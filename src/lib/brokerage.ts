import { create } from 'zustand'
import { BROKERAGE_SEED, BrokerDoc, BrokerageShipment, ClearanceRoute, DocIssue, OkStatus } from '../data/brokerage'
import { useNotifications } from './notifications'

export { STATUS_LABEL, STATUS_TONE, ROUTE_LABEL, fmtDeadline } from '../data/brokerage'
export type { BrokerageShipment, BrokerDoc, OkStatus } from '../data/brokerage'

const nowStamp = () => `${new Date().toLocaleDateString('en-GB', { month: 'short', day: '2-digit' })} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`

// Lower-case a document name for mid-sentence use, keeping acronyms (ANVISA, CDSCO, LI)
export const lc = (name: string) => name.split(' ').map((w) => (/[A-Z]/.test(w.slice(1)) ? w : w.toLowerCase())).join(' ')

// ----- Selectors -----
export const docsOk = (b: BrokerageShipment) => b.docs.filter((d) => d.status === 'ok').length
export const docsOutstanding = (b: BrokerageShipment) => b.docs.filter((d) => d.status !== 'ok')
export const openQuestions = (b: BrokerageShipment) => b.messages.filter((m) => m.needsReply)
export const needsYou = (b: BrokerageShipment) => b.status === 'docs' || b.status === 'action' || b.status === 'hold'
export const readyToRequest = (b: BrokerageShipment) => (b.status === 'docs' || b.status === 'hold') && docsOutstanding(b).length === 0
export const hoursLeft = (b: BrokerageShipment) => Math.round((b.deadline.at.getTime() - Date.now()) / 3600000)

export type Owner = 'you' | 'wc' | 'broker' | 'customs' | 'none'
export function nextAction(b: BrokerageShipment): { owner: Owner; text: string; cta?: string } {
  if (b.status === 'action') {
    const q = openQuestions(b)[0]
    const amend = b.docs.find((d) => d.status === 'amend')
    if (q && amend) return { owner: 'you', text: `Answer ${b.specialist.split(' ')[0]} and re-upload the ${lc(amend.name)}`, cta: 'Fix and reply' }
    if (q) return { owner: 'you', text: `Answer ${b.specialist.split(' ')[0]}'s question`, cta: 'Reply' }
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
  if (b.status === 'ok') return { owner: 'none', text: 'OK to Send given. Hand over in your pick-up window' }
  if (b.status === 'clearing') return { owner: 'customs', text: 'Entry lodged, awaiting customs release' }
  return { owner: 'none', text: 'Cleared and delivered' }
}
export const OWNER_LABEL: Record<Owner, string> = { you: 'You', wc: 'World Courier', broker: 'Your broker', customs: 'Customs', none: 'No action' }

// ----- Store -----
interface State {
  shipments: BrokerageShipment[]
  upload: (job: string, docId: string, fileName: string) => void
  reply: (job: string, messageId: string, text: string) => void
  request: (job: string, anyway?: boolean) => void
  setRoute: (job: string, route: ClearanceRoute, detail?: string) => void
}

const update = (list: BrokerageShipment[], job: string, fn: (b: BrokerageShipment) => BrokerageShipment) => list.map((b) => (b.job === job ? fn(b) : b))
const log = (b: BrokerageShipment, text: string): BrokerageShipment => ({ ...b, activity: [{ at: nowStamp(), text }, ...b.activity] })
const sys = (b: BrokerageShipment, text: string): BrokerageShipment => ({ ...b, messages: [...b.messages, { id: `s${Date.now()}`, from: 'system', who: 'OK to Send', at: nowStamp(), text }] })
const notify = (b: BrokerageShipment, title: string, message: string, tone: 'success' | 'info' | 'warning' = 'success') =>
  useNotifications.getState().add({ id: `brk-${b.job}-${Date.now()}`, kind: 'customs', tone, title, message, time: 'Just now', unread: true, to: `/brokerage/${b.job}`, cta: 'Open in Brokerage' })

// After a successful request the review completes on its own, as the destination office would
function scheduleReview(job: string, set: (fn: (s: State) => Partial<State>) => void, delay = 7000) {
  setTimeout(() => set((s) => ({
    shipments: update(s.shipments, job, (b) => {
      if (b.status !== 'review') return b
      const who = `${b.specialist} · ${b.broker.replace('World Courier Customs · ', 'WC Customs ')}`
      // an amendment on a consignment already at customs goes back into clearance rather than to a fresh OK to Send
      const atCustoms = !!b.entry.lodged && !b.entry.released
      const next: BrokerageShipment = atCustoms
        ? { ...b, status: 'clearing', okAt: b.okAt || nowStamp(), deadline: { label: 'Release expected', at: new Date(Date.now() + 3 * 3600000) }, entry: { ...b.entry, channel: 'Green · amendment accepted' } }
        : { ...b, status: 'ok', okAt: nowStamp(), deadline: { label: b.direction === 'Export' ? 'Pick-up window' : 'Arrival', at: b.deadline.at } }
      const text = atCustoms
        ? 'Amendment accepted. Customs moved the consignment to the green channel; I expect release within three hours and will confirm here.'
        : b.direction === 'Export' ? 'OK to Send given. All documents meet the destination requirements; hand the cartons over in your pick-up window and I will register the entry on arrival.' : 'OK to Send given. The import entry is pre-lodged, so clearance starts before the flight lands.'
      const withMsg: BrokerageShipment = { ...next, messages: [...next.messages, { id: `b${Date.now()}`, from: 'broker', who, at: nowStamp(), text }] }
      notify(withMsg, atCustoms ? `Amendment accepted · job ${b.job}` : `OK to Send · job ${b.job}`, atCustoms ? `Customs moved the consignment to the green channel. Release expected within three hours.` : `${b.lane} ${b.direction.toLowerCase()} reviewed by ${b.broker.split(' (')[0]}. No action needed.`)
      return log(withMsg, atCustoms ? 'Amendment accepted · green channel' : 'OK to Send given')
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
        // an amended document plus an answered question clears the destination amendment
        if (out.status === 'action' && !out.docs.some((d) => d.status === 'amend') && openQuestions(out).length === 0) {
          out = log(sys({ ...out, status: 'review' }, 'Amendment sent back for review.'), 'Resubmitted for review')
          scheduleReview(job, set, 6000)
        }
        return out
      }),
    })), 1300)
  },

  reply: (job, messageId, text) => set((s) => ({
    shipments: update(s.shipments, job, (b) => {
      const messages = b.messages.map((m) => (m.id === messageId ? { ...m, needsReply: false } : m))
      let out: BrokerageShipment = log({ ...b, messages: [...messages, { id: `y${Date.now()}`, from: 'you', who: 'You', at: nowStamp(), text }] }, 'You replied to your broker')
      if (out.status === 'action' && !out.docs.some((d) => d.status === 'amend') && openQuestions(out).length === 0) {
        out = log(sys({ ...out, status: 'review' }, 'Your answer has been sent back for review.'), 'Resubmitted for review')
        scheduleReview(job, set, 6000)
      }
      return out
    }),
  })),

  request: (job, anyway) => {
    set((s) => ({
      shipments: update(s.shipments, job, (b) => {
        const out = docsOutstanding(b)
        if (out.length && !anyway) return b
        if (out.length) {
          return log(sys({ ...b, status: 'hold', requestedAt: nowStamp() }, `Order submitted with ${out.length} document${out.length > 1 ? 's' : ''} outstanding. OK to Send will not be given until all documents meet requirements; Cencora will contact you with further guidance.`), 'Submitted with documents outstanding · on hold')
        }
        const external = b.route === 'external'
        const status: OkStatus = external ? 'broker' : 'review'
        const text = external
          ? `Request OK to Send sent with ${b.docs.length} documents checked and passed to ${b.broker.split(' (')[0]}. World Courier does not review documents on this lane; your appointed broker is responsible for the review.`
          : b.route === 'blanket'
            ? `Documents match the documents on file for Blanket ID ${b.blanketId}. OK to Send is already approved by the importing office.`
            : `Request OK to Send sent with ${b.docs.length} documents checked. ${b.broker.replace('World Courier Customs · ', 'WC Customs ')} is reviewing.`
        const next = log(sys({ ...b, status: b.route === 'blanket' ? 'ok' : status, requestedAt: nowStamp(), okAt: b.route === 'blanket' ? nowStamp() : b.okAt }, text), b.route === 'blanket' ? 'OK to Send given under Blanket ID' : 'Request OK to Send submitted')
        if (b.route === 'blanket') notify(next, `OK to Send · job ${b.job}`, `Approved under Blanket ID ${b.blanketId}.`)
        return next
      }),
    }))
    const b = useBrokerage.getState().shipments.find((x) => x.job === job)
    if (b?.status === 'review') scheduleReview(job, set)
  },

  setRoute: (job, route, detail) => set((s) => ({
    shipments: update(s.shipments, job, (b) => log({
      ...b,
      route,
      broker: route === 'external' ? `${detail || 'Appointed broker'} (your appointed broker)` : b.broker.includes('(your appointed broker)') ? `World Courier Customs · ${b.destination.place}` : b.broker,
      blanketId: route === 'blanket' ? (detail || b.blanketId) : undefined,
    }, route === 'external' ? `Clearance route changed · external broker ${detail || ''}`.trim() : route === 'blanket' ? `Clearance route changed · Blanket ID ${detail || ''}`.trim() : 'Clearance route changed · World Courier Customs')),
  })),
}))

export const statusCounts = (list: BrokerageShipment[]) => ({
  needsYou: list.filter(needsYou).length,
  inReview: list.filter((b) => b.status === 'review' || b.status === 'broker').length,
  okToSend: list.filter((b) => b.status === 'ok' || b.status === 'clearing').length,
  cleared: list.filter((b) => b.status === 'cleared').length,
})
