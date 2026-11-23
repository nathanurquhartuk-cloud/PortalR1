import { ArrowRight, FileCheck2, Info, Stamp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Deadline, DirectionBadge, DocsMeter, Lane, NextAction } from '../components/BrokerageBits'
import { Button, Page, PageHead, Pill, Section, Segmented, Stat, cx } from '../components/ui'
import { BrokerageShipment, OkStatus, STATUS_LABEL, STATUS_TONE, hoursLeft, needsYou, nextAction, statusCounts, useBrokerage } from '../lib/brokerage'
import { openCora } from '../lib/notifications'

type Dir = 'all' | 'Export' | 'Import'
type View = 'open' | 'all' | 'delivered'
const ORDER: OkStatus[] = ['action', 'docs', 'hold', 'broker', 'review', 'ok']

export default function Brokerage() {
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const shipments = useBrokerage((s) => s.shipments)
  const dir = (params.get('dir') as Dir) || 'all'
  const view = (params.get('view') as View) || 'open'
  const [status, setStatus] = useState<OkStatus | 'all'>('all')

  const filtered = useMemo(() => shipments
    .filter((b) => dir === 'all' || b.direction === dir)
    .filter((b) => (view === 'delivered' ? !!b.delivered : view === 'open' ? !b.delivered : true))
    .filter((b) => status === 'all' || b.status === status)
    .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || a.deadline.at.getTime() - b.deadline.at.getTime()), [shipments, dir, view, status])
  const mine = useMemo(() => shipments.filter((b) => (dir === 'all' || b.direction === dir) && needsYou(b)).sort((a, b) => a.deadline.at.getTime() - b.deadline.at.getTime()), [shipments, dir])
  const counts = statusCounts(shipments.filter((b) => dir === 'all' || b.direction === dir))
  const setQ = (k: string, v: string) => { const p = new URLSearchParams(params); if (v === 'all' || v === 'open') p.delete(k); else p.set(k, v); setParams(p, { replace: true }) }

  return (
    <Page>
      <PageHead
        eyebrow="Customs and OK to Send"
        title="Brokerage"
        sub="Where OK to Send stands for every shipment that crosses a border with the Customs brokerage add-on, exports and imports alike: the documents each destination needs, the review, and the commentary from World Courier Customer Service as it is written on the case."
        tools={<Segmented value={dir} onChange={(v) => setQ('dir', v)} options={[{ id: 'all', label: 'All' }, { id: 'Export', label: 'Exports' }, { id: 'Import', label: 'Imports' }]} />}
      />

      <div className="grid cols-3 brk-stats" style={{ marginBottom: 8 }}>
        <div className="click-stat" onClick={() => { setStatus('all'); setQ('view', 'open') }}><Stat label="Needs you" value={counts.needsYou} delta={counts.needsYou ? 'Documents outstanding or to amend' : 'Nothing waiting on you'} tone={counts.needsYou ? 'warn' : 'ok'} /></div>
        <div className="click-stat" onClick={() => { setStatus('review'); setQ('view', 'open') }}><Stat label="In review" value={counts.inReview} delta="World Courier Customs or your broker" /></div>
        <div className="click-stat" onClick={() => { setStatus('ok'); setQ('view', 'open') }}><Stat label="OK to Send" value={counts.okToSend} delta="Approved and under way" tone="ok" /></div>
      </div>

      {mine.length > 0 && view !== 'delivered' && (
        <Section title="Needs your attention" action={<span className="small muted">Sorted by deadline</span>}>
          <div className="grid cols-2" style={{ gap: 14 }}>
            {mine.map((b) => {
              const a = nextAction(b)
              const h = hoursLeft(b)
              return (
                <div key={b.job} className={cx('card pad need', h <= 6 ? 'urgent' : '')}>
                  <div className="row between" style={{ gap: 10, alignItems: 'flex-start' }}>
                    <div>
                      <div className="row" style={{ gap: 8 }}><DirectionBadge direction={b.direction} size="sm" /><span className="strong">Job {b.job}</span></div>
                      <div className="small muted" style={{ marginTop: 4 }}><Lane b={b} compact /> · {b.serviceLine}</div>
                    </div>
                    <Pill tone={STATUS_TONE[b.status]} dot>{STATUS_LABEL[b.status]}</Pill>
                  </div>
                  <div className="need-text">{a.text}</div>
                  <div className="row between wrap" style={{ marginTop: 12, gap: 10 }}>
                    <Deadline b={b} />
                    <Button size="sm" onClick={() => nav(`/brokerage/${b.job}`)} icon={<ArrowRight size={15} />}>{a.cta || 'Open'}</Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      <Section
        title={view === 'delivered' ? 'Delivered shipments' : 'Brokerage shipments'}
        action={
          <div className="row" style={{ gap: 8 }}>
            <select className="select" style={{ width: 'auto', height: 34, fontSize: 13, padding: '0 10px' }} value={status} onChange={(e) => setStatus(e.target.value as OkStatus | 'all')} aria-label="Filter by status">
              <option value="all">All statuses</option>
              {ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <div className="seg sm"><button className={view === 'open' ? 'active' : ''} onClick={() => setQ('view', 'open')}>Open</button><button className={view === 'all' ? 'active' : ''} onClick={() => setQ('view', 'all')}>All</button><button className={view === 'delivered' ? 'active' : ''} onClick={() => setQ('view', 'delivered')}>Delivered</button></div>
          </div>
        }
      >
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="brk-head hide-m"><span>Shipment</span><span>Lane</span><span>Documents</span><span>Status</span><span>Next action</span><span>Deadline</span></div>
          {filtered.length === 0 && <div className="muted" style={{ padding: 28, textAlign: 'center' }}>No shipments match this view.</div>}
          {filtered.map((b) => <Row key={b.job} b={b} onOpen={() => nav(`/brokerage/${b.job}`)} />)}
        </div>
      </Section>

      <Section title="How OK to Send works">
        <div className="card pad how">
          <ol className="how-steps">
            <li><span className="n">1</span><div><div className="strong small">Documents</div><div className="tiny muted">Each destination has its own list. We check every file as you upload it and say exactly what to change.</div></div></li>
            <li><span className="n">2</span><div><div className="strong small">Request OK to Send</div><div className="tiny muted">Submit the set. You can submit with documents outstanding; OK to Send waits until they meet requirements.</div></div></li>
            <li><span className="n">3</span><div><div className="strong small">Review</div><div className="tiny muted">World Courier Customs at the destination, or your appointed broker, reviews. Their commentary from Salesforce shows on the shipment.</div></div></li>
            <li><span className="n">4</span><div><div className="strong small">OK to Send</div><div className="tiny muted">Hand over in your pick-up window. Blanket ID lanes are approved in advance. You are notified here and on the bell.</div></div></li>
          </ol>
          <div className="row wrap" style={{ gap: 10, marginTop: 14 }}>
            <Button variant="soft" size="sm" onClick={() => openCora('Which shipments need customs documents?')} icon={<Info size={15} />}>Ask Cora what is outstanding</Button>
            <Button variant="ghost" size="sm" to="/documents?kind=customs" icon={<FileCheck2 size={15} />}>Document templates</Button>
            <Button variant="ghost" size="sm" to="/book" icon={<Stamp size={15} />}>Book a shipment with brokerage</Button>
          </div>
        </div>
      </Section>
    </Page>
  )
}

function Row({ b, onOpen }: { b: BrokerageShipment; onOpen: () => void }) {
  return (
    <div className="brk-row click" onClick={onOpen} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      <div className="min0">
        <div className="row" style={{ gap: 8 }}><DirectionBadge direction={b.direction} size="sm" /><span className="title">Job {b.job}</span></div>
        <div className="meta ellipsis">{b.serviceLine} · {b.tier} · {b.broker.split(' (')[0].replace('World Courier Customs · ', 'WC Customs ')}</div>
      </div>
      <div className="min0"><Lane b={b} compact /></div>
      <div><DocsMeter b={b} /></div>
      <div><Pill tone={STATUS_TONE[b.status]} dot>{STATUS_LABEL[b.status]}</Pill></div>
      <div className="min0 hide-m"><NextAction b={b} /></div>
      <div className="hide-m"><Deadline b={b} short /></div>
    </div>
  )
}
