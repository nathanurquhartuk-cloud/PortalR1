import { create } from 'zustand'
import { BROKERAGE_SEED, BrokerDoc, BrokerageShipment, DocIssue, OkStatus } from '../data/brokerage'
import { useNotifications } from './notifications'

export { STATUS_LABEL, STATUS_TONE, ROUTE_LABEL, fmtDeadline } from '../data/brokerage'
export type { BrokerageShipment, BrokerDoc, OkStatus, Commentary } from '../data/brokerage'

const nowStamp = () => `${new Date().toLocaleDateString('en-GB', { month: 'short', day: '2-digit' })} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`

// Lower-case a document name for mid-sentence use, keeping acronyms (ANVISA, CDSCO, LI)
export const lc = (name: string) => name.split(' ').map((w) => (/[A-Z]/.test(w.slice(1)) ? w : w.toLowerCase())).join(' ')

// ----- Selectors -----
export const docsOk = (b: BrokerageShipment) => b.docs.filter((d) => d.status === 'ok').length
export const docsOutstanding = (b: BrokerageShipment) => b.docs.filter((d) => d.status !== 'ok')
export const needsYou = (b: BrokerageShipment) => b.status === 'docs' || b.status === 'action' || b.status === 'hold'
export const readyToRequest = (b: BrokerageShipment) => (b.status === 'docs' || b.status === 'hold') && docsOutstanding(b).length === 0
export const hoursLeft = (b: BrokerageShipment) => Math.round((b.deadline.at.getTime() - Date.now()) / 3600000)
export const latestCommentary = (b: BrokerageShipment) => b.commentary[0]

export type Owner = 'you' | 'wc' | 'broker' | 'none'
export function nextAction(b: BrokerageShipment): { owner: Owner; text: string; cta?: string } {
  if (b.status === 'action') {
    const amend = b.docs.find((d) => d.status === 'amend')
    if (amend) return { owner: 'you', text: `Fix and re-upload the ${lc(amend.name)}`, cta: 'Fix and re-upload' }
    return { owner: 'you', text: 'Resubmit for review', cta: 'Resubmit' }
  }
  if (b.status === 'docs' || b.status === 'hold') {
    const out = docsOutstanding(b)
    if (out.length === 0) return { owner: 'you', text: 'All documents checked. Request OK to Send', cta: 'Request OK to Send' }
    return { owner: 'you', text: out.length === 1 ? `Upload the ${lc(out[0].name)}` : `Upload ${out.length} documents`, cta: 'Upload' }
  }
  if (b.status === 'review') return { owner: 'wc', text: `${b.broker.replace('World Courier Customs · ', 'WC Customs ')} is reviewing` }
  if (b.status === 'broker') return { owner: 'broker', text: `${b.broker.split(' (')[0]} is reviewing` }
  if (b.delivered) return { owner: 'none', text: 'OK to Send given · delivered' }
  return { owner: 'none', text: 'OK to Send given. Hand over in your pick-up window' }
}
export const OWNER_LABEL: Record<Owner, string> = { you: 'You', wc: 'World Courier', broker: 'Your broker', none: 'No action' }

// ----- Store -----
interface State {
  shipments: BrokerageShipment[]
  upload: (job: string, docId: string, fileName: string) => void
  request: (job: string, anyway?: boolean) => void
}

const update = (list: BrokerageShipment[], job: string, fn: (b: BrokerageShipment) => BrokerageShipment) => list.map((b) => (b.job === job ? fn(b) : b))
const log = (b: BrokerageShipment, text: string): BrokerageShipment => ({ ...b, activity: [{ at: nowStamp(), text }, ...b.activity] })
const comment = (b: BrokerageShipment, who: string, text: string): BrokerageShipment => ({ ...b, commentary: [{ id: `c${Date.now()}`, at: nowStamp(), who, text }, ...b.commentary] })
const SF = 'World Courier Customer Service · Salesforce'
const notify = (b: BrokerageShipment, title: string, message: string, tone: 'success' | 'info' | 'warning' = 'success') =>
  useNotifications.getState().add({ id: `brk-${b.job}-${Date.now()}`, kind: 'customs', tone, title, message, time: 'Just now', unread: true, to: `/brokerage/${b.job}`, cta: 'Open in Brokerage' })

// After a request the review completes on its own, as Customer Service would record it on the Salesforce case
function scheduleReview(job: string, set: (fn: (s: State) => Partial<State>) => void, delay = 7000) {
  setTimeout(() => set((s) => ({
    shipments: update(s.shipments, job, (b) => {
      if (b.status !== 'review') return b
      const who = `${b.specialist} · ${b.broker.replace('World Courier Customs · ', 'WC Customs ')}`
      const wasAmendment = b.activity.some((a) => /Resubmitted for review/.test(a.text))
      const text = wasAmendment
        ? 'Amendment accepted. Customs moved the consignment to the green channel; release expected within three hours.'
        : b.direction === 'Export' ? 'OK to Send given. All documents meet the destination requirements; hand the cartons over in your pick-up window and the entry will be registered on arrival.' : 'OK to Send given. The import entry will be pre-lodged so clearance starts before the flight lands.'
      const next: BrokerageShipment = comment({ ...b, status: 'ok', okAt: b.okAt || nowStamp(), deadline: wasAmendment ? { label: 'Customs release expected', at: new Date(Date.now() + 3 * 3600000) } : { label: b.direction === 'Export' ? 'Pick-up window' : 'Arrival', at: b.deadline.at } }, who, text)
      notify(next, wasAmendment ? `Amendment accepted · job ${b.job}` : `OK to Send · job ${b.job}`, wasAmendment ? 'Customs moved the consignment to the green channel. Release expected within three hours.' : `${b.lane} ${b.direction.toLowerCase()} reviewed by ${b.broker.split(' (')[0]}. No action needed.`)
      return log(next, wasAmendment ? 'Amendment accepted · green channel' : 'OK to Send given')
    }),
  })), delay)
}

export const useBrokerage = create<State>((set) => ({
  shipments: BROKERAGE_SEED,

  upload: (job, docId, fileName) => {
    set((s) => ({ shipments: update(s.shipments, job, (b) => ({ ...b, docs: b.docs.map((d) => (d.id === docId ? { ...d, status: 'checking', file: fileName } : d)) })) }))
    setTimeout(() => set((s) => ({
      shipments: update(s.shipments, job, (b) => {
        let checked: BrokerDoc | undefined
        const docs = b.docs.map((d) => {
          if (d.id !== docId) return d
          const fails: DocIssue[] = d.forcePass ? [] : (d.fails[d.attempts] || [])
          const prev = d.issues
          const next: BrokerDoc = fails.length
            ? { ...d, status: 'amend', attempts: d.attempts + 1, version: (d.version || 0) + 1, uploadedAt: nowStamp(), issues: fails, resolved: [] }
            : { ...d, status: 'ok', attempts: d.attempts + 1, version: (d.version || 0) + 1, uploadedAt: nowStamp(), issues: [], resolved: prev, forcePass: false }
          checked = next
          return next
        })
        let out: BrokerageShipment = { ...b, docs }
        if (checked) out = log(out, checked.status === 'ok' ? `${checked.name} checked · ${fileName}` : `${checked.name} needs amendment · ${checked.issues.length} change${checked.issues.length > 1 ? 's' : ''}`)
        // a corrected document clears the amendment and goes straight back for review
        if (out.status === 'action' && !out.docs.some((d) => d.status === 'amend')) {
          out = log(comment({ ...out, status: 'review' }, SF, 'Amended document received and sent back to the destination office for review.'), 'Resubmitted for review')
          scheduleReview(job, set, 6000)
        }
        return out
      }),
    })), 1300)
  },

  request: (job, anyway) => {
    set((s) => ({
      shipments: update(s.shipments, job, (b) => {
        const out = docsOutstanding(b)
        if (out.length && !anyway) return b
        if (out.length) {
          return log(comment({ ...b, status: 'hold', requestedAt: nowStamp() }, SF, `Order submitted with ${out.length} document${out.length > 1 ? 's' : ''} outstanding. OK to Send will not be given until all documents meet requirements; Cencora will contact you with further guidance.`), 'Submitted with documents outstanding · on hold')
        }
        if (b.route === 'blanket') {
          const next = log(comment({ ...b, status: 'ok', requestedAt: nowStamp(), okAt: nowStamp() }, SF, `Documents match the documents on file for Blanket ID ${b.blanketId}. OK to Send is already approved by the importing office.`), 'OK to Send given under Blanket ID')
          notify(next, `OK to Send · job ${b.job}`, `Approved under Blanket ID ${b.blanketId}.`)
          return next
        }
        const external = b.route === 'external'
        const status: OkStatus = external ? 'broker' : 'review'
        const text = external
          ? `Request OK to Send received with ${b.docs.length} documents checked and passed to ${b.broker.split(' (')[0]}. World Courier does not review documents on this lane; the appointed broker is responsible for the review.`
          : `Request OK to Send received with ${b.docs.length} documents checked. ${b.broker.replace('World Courier Customs · ', 'WC Customs ')} is reviewing.`
        return log(comment({ ...b, status, requestedAt: nowStamp() }, SF, text), 'Request OK to Send submitted')
      }),
    }))
    const b = useBrokerage.getState().shipments.find((x) => x.job === job)
    if (b?.status === 'review') scheduleReview(job, set)
  },
}))

export const statusCounts = (list: BrokerageShipment[]) => ({
  needsYou: list.filter(needsYou).length,
  inReview: list.filter((b) => b.status === 'review' || b.status === 'broker').length,
  okToSend: list.filter((b) => b.status === 'ok' && !b.delivered).length,
  delivered: list.filter((b) => b.delivered).length,
})
