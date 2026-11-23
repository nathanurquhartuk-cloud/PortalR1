import { ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react'
import { BrokerageShipment, OWNER_LABEL, docsOk, hoursLeft, nextAction } from '../lib/brokerage'
import { cx } from './ui'

// Shared pieces for the Brokerage pages

export function DirectionBadge({ direction, size = 'md' }: { direction: BrokerageShipment['direction']; size?: 'sm' | 'md' }) {
  const Icon = direction === 'Export' ? ArrowUpRight : ArrowDownLeft
  return (
    <span className={cx('dir', direction === 'Export' ? 'out' : 'in', size === 'sm' && 'sm')} title={direction}>
      <Icon size={size === 'sm' ? 13 : 15} strokeWidth={2.2} />{direction}
    </span>
  )
}

export function Lane({ b, compact }: { b: BrokerageShipment; compact?: boolean }) {
  return (
    <span className="lane">
      <span className="cc">{b.origin.code}</span>
      <span className="place">{compact ? b.origin.place : `${b.origin.place}, ${b.origin.country}`}</span>
      <span className="arrow">→</span>
      <span className="cc">{b.destination.code}</span>
      <span className="place">{compact ? b.destination.place : `${b.destination.place}, ${b.destination.country}`}</span>
    </span>
  )
}

export function Deadline({ b, short }: { b: BrokerageShipment; short?: boolean }) {
  if (b.status === 'cleared') return <span className="small muted">Delivered {b.deadline.at.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
  const h = hoursLeft(b)
  const tone = h <= 6 ? 'bad' : h <= 24 ? 'warn' : ''
  const txt = h < 0 ? 'overdue' : h < 1 ? 'under an hour' : h < 48 ? `${h} h` : `${Math.round(h / 24)} days`
  return (
    <span className={cx('deadline', tone)}><Clock size={13} />{short ? txt : `${b.deadline.label} · ${txt}`}</span>
  )
}

export function DocsMeter({ b }: { b: BrokerageShipment }) {
  const n = docsOk(b), total = b.docs.length
  const amend = b.docs.some((d) => d.status === 'amend')
  return (
    <span className="docs-meter" title={`${n} of ${total} documents checked`}>
      <span className="segs">{b.docs.map((d) => <i key={d.id} className={cx(d.status === 'ok' && 'ok', d.status === 'amend' && 'bad', d.status === 'checking' && 'busy')} />)}</span>
      <span className={cx('small', amend ? 'red' : n === total ? 'green' : 'muted')}>{n}/{total}</span>
    </span>
  )
}

export function NextAction({ b }: { b: BrokerageShipment }) {
  const a = nextAction(b)
  return (
    <span className="next">
      <span className={cx('owner', a.owner)}>{OWNER_LABEL[a.owner]}</span>
      <span className="small">{a.text}</span>
    </span>
  )
}
