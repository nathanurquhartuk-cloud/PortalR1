import { ArrowRight, Stamp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Deadline, DirectionBadge, Lane } from './BrokerageBits'
import { Pill } from './ui'
import { STATUS_LABEL, STATUS_TONE, hoursLeft, needsYou, nextAction, statusCounts, useBrokerage } from '../lib/brokerage'

// Compact brokerage summary for the Overview: what needs you, then the counts
export function BrokerageStrip() {
  const nav = useNavigate()
  const shipments = useBrokerage((s) => s.shipments)
  const mine = shipments.filter(needsYou).sort((a, b) => a.deadline.at.getTime() - b.deadline.at.getTime()).slice(0, 3)
  const c = statusCounts(shipments)
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="brk-strip">
        <div className="brk-kpi"><span className="icon-wrap warn"><Stamp size={18} /></span><div><div className="value">{c.needsYou}</div><div className="label">need you</div></div></div>
        <div className="brk-kpi"><div><div className="value">{c.inReview}</div><div className="label">in review</div></div></div>
        <div className="brk-kpi"><div><div className="value green">{c.okToSend}</div><div className="label">OK to Send</div></div></div>
        <div className="brk-kpi hide-m"><div><div className="value">{c.cleared}</div><div className="label">cleared · 30 days</div></div></div>
      </div>
      {mine.map((b) => {
        const a = nextAction(b)
        return (
          <div key={b.job} className="list-row click" onClick={() => nav(`/brokerage/${b.job}`)}>
            <span className={`icon-wrap ${hoursLeft(b) <= 6 ? 'bad' : 'warn'}`}><Stamp size={18} /></span>
            <div className="grow">
              <div className="title row" style={{ gap: 8 }}><DirectionBadge direction={b.direction} size="sm" />Job {b.job} <span className="muted" style={{ fontWeight: 400 }}>· <Lane b={b} compact /></span></div>
              <div className="meta ellipsis">{a.text} · {b.deadline.label.toLowerCase()} <Deadline b={b} short /></div>
            </div>
            <Pill tone={STATUS_TONE[b.status]} dot>{STATUS_LABEL[b.status]}</Pill>
            <ArrowRight size={16} className="faint hide-m" />
          </div>
        )
      })}
      {mine.length === 0 && <div className="muted small" style={{ padding: '14px 20px', borderTop: '1px solid var(--line-soft)' }}>Nothing is waiting on you. Your brokers have everything they need.</div>}
    </div>
  )
}
