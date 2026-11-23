import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronRight, Download, FileText, Info, Paperclip, Send, Stamp, Upload, X } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Deadline, DirectionBadge, Lane } from '../components/BrokerageBits'
import { Button, Drawer, Empty, Expand, KV, Page, PageHead, Pill, cx } from '../components/ui'
import { ClearanceRoute } from '../data/brokerage'
import { BrokerDoc, BrokerageShipment, OWNER_LABEL, ROUTE_LABEL, STATUS_LABEL, STATUS_TONE, docsOk, docsOutstanding, lc, nextAction, openQuestions, readyToRequest, useBrokerage } from '../lib/brokerage'
import { openCora } from '../lib/notifications'

type Tab = 'documents' | 'messages' | 'entry' | 'activity'

export default function BrokerageShipmentPage() {
  const { job } = useParams()
  const [params, setParams] = useSearchParams()
  const b = useBrokerage((s) => s.shipments.find((x) => x.job === job))
  const { upload, reply, request, setRoute } = useBrokerage()
  const tab = (params.get('tab') as Tab) || 'documents'
  const setTab = (t: Tab) => { const p = new URLSearchParams(params); p.set('tab', t); setParams(p, { replace: true }) }
  const [uploading, setUploading] = useState<string | null>(null)   // doc id in the upload drawer
  const [reqs, setReqs] = useState<string | null>(null)             // doc id in the requirements drawer
  const [warn, setWarn] = useState(false)
  useEffect(() => { window.scrollTo({ top: 0 }) }, [job])

  if (!b) return <Page><Empty title="Shipment not found" text="This job is not in Brokerage. Only shipments with the Customs brokerage add-on appear here." action={<Button to="/brokerage">Back to Brokerage</Button>} /></Page>

  const a = nextAction(b)
  const questions = openQuestions(b)
  const outstanding = docsOutstanding(b)
  const doRequest = () => { if (outstanding.length) setWarn(true); else request(b.job) }

  return (
    <Page>
      <Link to="/brokerage" className="back"><ArrowLeft size={15} /> Brokerage</Link>
      <PageHead
        eyebrow={<span className="row" style={{ gap: 8 }}><DirectionBadge direction={b.direction} size="sm" />{b.serviceLine} · {b.tier} tier</span>}
        title={`Job ${b.job}`}
        sub={<span><Lane b={b} /> · {b.goods}</span>}
        tools={<div className="row" style={{ gap: 8 }}><Pill tone={STATUS_TONE[b.status]} dot>{STATUS_LABEL[b.status]}</Pill><Button variant="ghost" size="sm" to={`/shipments?job=${b.job}`} icon={<ArrowRight size={15} />}>Track shipment</Button></div>}
      />

      <Tracker b={b} />

      <StatusNote b={b} onRequest={doRequest} onTab={setTab} onUpload={(id) => setUploading(id)} />

      <div className="seg" style={{ margin: '22px 0 14px' }}>
        {([['documents', `Documents · ${docsOk(b)}/${b.docs.length}`], ['messages', `Messages${questions.length ? ` · ${questions.length} to answer` : ''}`], ['entry', 'Customs entry'], ['activity', 'Activity']] as [Tab, string][]).map(([id, label]) => (
          <button key={id} className={cx(tab === id && 'active', id === 'messages' && questions.length > 0 && 'attn')} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'documents' && (
        <div className="grid brk-cols">
          <div>
            {b.docs.map((d) => <DocCard key={d.id} d={d} blanket={b.route === 'blanket'} onUpload={() => setUploading(d.id)} onReqs={() => setReqs(d.id)} />)}
            {b.status === 'docs' || b.status === 'hold' ? (
              <div className="row between wrap" style={{ marginTop: 16, gap: 10 }}>
                <span className="small muted">{outstanding.length === 0 ? 'All documents checked. You can request OK to Send.' : 'You can submit with documents outstanding; OK to Send will not be given until all documents meet requirements.'}</span>
                <Button onClick={doRequest} icon={<Send size={15} />}>{b.status === 'hold' ? 'Resubmit' : 'Request OK to Send'}</Button>
              </div>
            ) : null}
          </div>
          <aside>
            <RouteCard b={b} onChange={(r, detail) => setRoute(b.job, r, detail)} />
            <div className="card pad" style={{ marginTop: 14 }}>
              <div className="strong small">Your broker</div>
              <div className="row" style={{ gap: 10, marginTop: 10 }}>
                <span className="avatar" aria-hidden="true">{b.specialist.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>
                <div className="min0"><div className="strong small">{b.specialist}</div><div className="tiny muted">{b.broker}</div></div>
              </div>
              <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
                <Button variant="soft" size="xs" onClick={() => setTab('messages')}>Message</Button>
                <Button variant="ghost" size="xs" onClick={() => openCora(`What is outstanding on job ${b.job}?`)}>Ask Cora</Button>
              </div>
              <div className="tiny faint" style={{ marginTop: 12 }}>{b.fee}</div>
            </div>
          </aside>
        </div>
      )}

      {tab === 'messages' && <Messages b={b} onReply={(id, text) => reply(b.job, id, text)} onUpload={(id) => setUploading(id)} />}

      {tab === 'entry' && <EntryTab b={b} />}

      {tab === 'activity' && (
        <div className="card pad">
          <div className="timeline">
            {b.activity.map((x, i) => (
              <div key={i} className="tl-item"><span className={cx('dot', i === 0 && b.status !== 'cleared' ? '' : 'green')} /><span className="when">{x.at}</span><div className="t" style={{ fontWeight: 500 }}>{x.text}</div></div>
            ))}
          </div>
        </div>
      )}

      {uploading && <UploadDrawer b={b} docId={uploading} onClose={() => setUploading(null)} onUpload={(file) => upload(b.job, uploading, file)} onReqs={() => setReqs(uploading)} onNext={(id) => setUploading(id)} />}
      {reqs && <ReqsDrawer d={b.docs.find((d) => d.id === reqs)!} blanket={b.route === 'blanket'} onClose={() => setReqs(null)} onUpload={() => { setReqs(null); setUploading(reqs) }} />}
      {warn && (
        <div className="modal-scrim" onClick={(e) => e.target === e.currentTarget && setWarn(false)}>
          <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="warn-t">
            <h2 id="warn-t">Some documents are not ready</h2>
            <p className="muted small" style={{ marginTop: 4 }}>These documents are missing or do not meet the requirements:</p>
            <ul className="plain" style={{ margin: '12px 0' }}>
              {outstanding.map((d) => <li key={d.id} className="row between" style={{ padding: '8px 0', borderTop: '1px solid var(--line-soft)' }}><span className="strong small">{d.name}</span><DocPill d={d} /></li>)}
            </ul>
            <div className="note warn"><strong>If you submit anyway</strong>OK to Send will not be given until all documents meet requirements. Cencora will contact you with further guidance.</div>
            <div className="row" style={{ gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <Button variant="secondary" onClick={() => { setWarn(false); request(b.job, true) }}>Submit anyway</Button>
              <Button onClick={() => setWarn(false)}>Go back and fix</Button>
            </div>
          </div>
        </div>
      )}
      <div className="tiny faint" style={{ marginTop: 28 }}>Document rules shown here are placeholders for the Document Library rules by destination. Owner of the next step: {OWNER_LABEL[a.owner]}.</div>
    </Page>
  )
}

// ----- OK to Send tracker -----
function Tracker({ b }: { b: BrokerageShipment }) {
  const steps = [
    { id: 'docs', title: 'Documents', d: `${docsOk(b)} of ${b.docs.length} checked` },
    { id: 'request', title: 'Request OK to Send', d: b.requestedAt ? `Sent ${b.requestedAt}` : 'Not yet requested' },
    { id: 'review', title: b.route === 'external' ? 'Broker review' : b.route === 'blanket' ? 'Blanket ID match' : 'Review', d: b.route === 'external' ? b.broker.split(' (')[0] : b.route === 'blanket' ? `Approved in advance · ${b.blanketId}` : b.broker.replace('World Courier Customs · ', 'WC Customs ') },
    { id: 'ok', title: 'OK to Send', d: b.okAt ? `Given ${b.okAt}` : 'Given after review' },
    { id: 'clear', title: b.direction === 'Import' ? 'Cleared into ' + b.destination.country : 'Cleared at destination', d: b.entry.released ? `Released ${b.entry.released}` : b.entry.lodged ? `Entry lodged ${b.entry.lodged}` : 'Entry lodged on arrival' },
  ]
  const stateOf = (i: number): 'done' | 'current' | 'hold' | 'pending' => {
    const s = b.status
    const stage = s === 'docs' ? 0 : s === 'hold' ? 1 : s === 'action' ? 2 : s === 'review' || s === 'broker' ? 2 : s === 'ok' ? 3 : s === 'clearing' ? 4 : 5
    if (i < stage) return 'done'
    if (i === stage) return s === 'action' || s === 'hold' ? 'hold' : s === 'docs' && docsOutstanding(b).length === 0 ? 'done' : 'current'
    return 'pending'
  }
  return (
    <div className="card pad tracker">
      <ol>
        {steps.map((s, i) => {
          const st = stateOf(i)
          return (
            <li key={s.id} className={st}>
              <span className="dot" aria-hidden="true">{st === 'done' ? <Check size={13} strokeWidth={3} /> : st === 'hold' ? '!' : i + 1}</span>
              <div className="min0"><div className="t">{s.title}</div><div className="d">{s.d}</div></div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// ----- Status note with the one thing to do next -----
function StatusNote({ b, onRequest, onTab, onUpload }: { b: BrokerageShipment; onRequest: () => void; onTab: (t: Tab) => void; onUpload: (id: string) => void }) {
  const a = nextAction(b)
  const q = openQuestions(b)[0]
  const amend = b.docs.find((d) => d.status === 'amend')
  const out = docsOutstanding(b)
  const tone = b.status === 'action' || b.status === 'hold' ? 'bad' : b.status === 'docs' ? 'warn' : b.status === 'ok' || b.status === 'cleared' ? 'ok' : 'info'
  const title = b.status === 'action' ? (q ? 'Destination amendment required' : 'Amendment needed') : b.status === 'docs' ? (out.length ? `${out.length} document${out.length > 1 ? 's' : ''} still needed` : 'Ready to request OK to Send') : b.status === 'hold' ? 'On hold until all documents meet requirements' : b.status === 'review' ? 'In review, nothing needed from you' : b.status === 'broker' ? 'With your appointed broker' : b.status === 'ok' ? 'OK to Send given' : b.status === 'clearing' ? 'Clearing customs' : 'Cleared and delivered'
  const body = b.status === 'action' && q ? q.text : b.status === 'action' && amend ? amend.issues.map((i) => i.fix).join(' ') : b.status === 'docs' ? (out.length ? `Upload ${out.map((d) => lc(d.name)).join(', ')}. We check each file as you upload it.` : 'Every document meets the destination requirements.') : b.status === 'hold' ? `Outstanding: ${out.map((d) => lc(d.name)).join(', ')}. Cencora will contact you with further guidance.` : b.status === 'review' ? `${b.broker.replace('World Courier Customs · ', 'WC Customs ')} is reviewing your documents. This page updates by itself.` : b.status === 'broker' ? 'World Courier does not review documents on this lane; your appointed broker will confirm OK to Send here.' : b.status === 'ok' ? `Hand the consignment over in your pick-up window. ${b.direction === 'Import' ? 'The import entry is pre-lodged.' : 'The entry is registered on arrival.'}` : b.status === 'clearing' ? `${b.entry.channel || 'Entry lodged'}. ${a.text}.` : `Released ${b.entry.released}. Documents are archived in the library.`
  return (
    <div className={cx('note', tone)} style={{ marginTop: 14, display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <span className="ic">{tone === 'ok' ? <CheckCircle2 size={20} /> : tone === 'info' ? <Info size={20} /> : <AlertTriangle size={20} />}</span>
      <div className="grow min0">
        <strong>{title}</strong>
        <div className="small" style={{ marginTop: 2 }}>{body}</div>
        <div className="row wrap" style={{ gap: 8, marginTop: 10 }}>
          {b.status === 'action' && q && <Button size="sm" onClick={() => onTab('messages')} icon={<Send size={14} />}>Reply to {b.specialist.split(' ')[0]}</Button>}
          {b.status === 'action' && amend && <Button size="sm" variant={q ? 'secondary' : 'primary'} onClick={() => onUpload(amend.id)} icon={<Upload size={14} />}>Fix and re-upload {lc(amend.name)}</Button>}
          {(b.status === 'docs' || b.status === 'hold') && out.length > 0 && <Button size="sm" onClick={() => onUpload(out[0].id)} icon={<Upload size={14} />}>Upload {lc(out[0].name)}</Button>}
          {readyToRequest(b) && <Button size="sm" onClick={onRequest} icon={<Send size={14} />}>Request OK to Send</Button>}
          {(b.status === 'clearing' || b.status === 'ok' || b.status === 'cleared') && <Button size="sm" variant="soft" onClick={() => onTab('entry')} icon={<Stamp size={14} />}>Customs entry</Button>}
        </div>
      </div>
      <div style={{ marginLeft: 'auto' }}><Deadline b={b} /></div>
    </div>
  )
}

// ----- Documents -----
function DocPill({ d }: { d: BrokerDoc }) {
  const m: Record<BrokerDoc['status'], [string, 'ok' | 'warn' | 'bad' | 'info' | 'brand' | undefined]> = { needed: ['Needed', 'warn'], checking: ['Checking…', 'info'], amend: ['Needs amendment', 'bad'], ok: ['Checked', 'ok'] }
  return <Pill tone={m[d.status][1]} dot>{m[d.status][0]}</Pill>
}

function DocCard({ d, blanket, onUpload, onReqs }: { d: BrokerDoc; blanket: boolean; onUpload: () => void; onReqs: () => void }) {
  return (
    <div className={cx('card pad doc', d.status)}>
      <div className="row between" style={{ gap: 10, alignItems: 'flex-start' }}>
        <div className="min0" style={{ flex: 1 }}>
          <div className="row" style={{ gap: 10 }}><span className={cx('icon-wrap', d.status === 'ok' ? 'ok' : d.status === 'amend' ? 'bad' : d.status === 'checking' ? 'info' : 'warn')} style={{ width: 34, height: 34, borderRadius: 10 }}><FileText size={16} /></span><div className="min0"><div className="strong">{d.name}</div><div className="tiny muted">{blanket ? 'Must match the document on file' : d.guidance}</div></div></div>
        </div>
        <DocPill d={d} />
      </div>
      {d.file && (
        <div className="file"><Paperclip size={14} /><span className="ellipsis">{d.file}</span>{d.version && d.version > 1 && <span className="tiny faint">v{d.version}</span>}{d.uploadedAt && <span className="tiny faint">· {d.uploadedAt}</span>}{d.status === 'ok' && <button className="link tiny" onClick={(e) => { e.stopPropagation() }}><Download size={12} /> Download</button>}</div>
      )}
      {d.status === 'amend' && (
        <ul className="issues">{d.issues.map((i) => <li key={i.check}><b>{i.check}:</b> {i.fix}</li>)}</ul>
      )}
      {d.status === 'ok' && d.resolved.length > 0 && <div className="tiny green" style={{ marginTop: 8 }}><Check size={12} /> Earlier problem resolved: {d.resolved.map((r) => r.check).join(', ')}</div>}
      <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
        <Button variant="ghost" size="xs" onClick={onReqs}>View requirements</Button>
        <Button variant={d.status === 'ok' ? 'ghost' : d.status === 'amend' ? 'primary' : 'soft'} size="xs" onClick={onUpload} icon={<Upload size={13} />}>{d.status === 'needed' ? 'Upload' : d.status === 'amend' ? 'Fix and re-upload' : d.status === 'checking' ? 'Checking…' : 'Replace file'}</Button>
      </div>
    </div>
  )
}

function ReqsDrawer({ d, blanket, onClose, onUpload }: { d: BrokerDoc; blanket: boolean; onClose: () => void; onUpload: () => void }) {
  return (
    <Drawer title={d.name} sub={blanket ? 'What must match the document on file' : 'What a correct document needs'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={onUpload} icon={<Upload size={15} />}>Upload this document</Button></>}>
      <ul className="checks" style={{ marginTop: 12 }}>{d.checks.map((c) => <li key={c} className="neutral"><span className="ic"><ChevronRight size={13} /></span><span>{c}</span></li>)}</ul>
      <div className="strong small" style={{ marginTop: 18 }}>Destination guidance</div>
      <p className="small muted" style={{ marginTop: 4 }}>{d.guidance}</p>
      <div className="strong small" style={{ marginTop: 14 }}>File types</div>
      <p className="small muted" style={{ marginTop: 4 }}>PDF, JPG or PNG, up to 10 MB. One document per file.</p>
      <p className="small" style={{ marginTop: 14 }}><Link to={blanket ? '/documents?kind=blanket' : '/documents?kind=customs'} className="link">{blanket ? 'View the document on file in the Blanket ID Library' : 'Open the template in the Document Library'}</Link></p>
    </Drawer>
  )
}

function UploadDrawer({ b, docId, onClose, onUpload, onReqs, onNext }: { b: BrokerageShipment; docId: string; onClose: () => void; onUpload: (file: string) => void; onReqs: () => void; onNext: (id: string) => void }) {
  const d = b.docs.find((x) => x.id === docId)!
  const [phase, setPhase] = useState<'idle' | 'checking' | 'result'>(d.file && d.status !== 'needed' ? 'result' : 'idle')
  const [over, setOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const prevStatus = useRef(d.status)
  useEffect(() => {
    if (d.status === 'checking') setPhase('checking')
    else if (prevStatus.current === 'checking') setPhase('result')
    prevStatus.current = d.status
  }, [d.status])
  const pick = (name: string) => { setPhase('checking'); onUpload(name) }
  const sample = d.samples[Math.min(d.attempts, d.samples.length - 1)]
  const next = b.docs.find((x) => x.status !== 'ok' && x.id !== d.id)
  const failMap = new Map(d.issues.map((i) => [i.check, i.fix]))

  return (
    <Drawer title={d.name} sub={d.guidance} onClose={onClose} badge={<DocPill d={d} />}
      footer={phase === 'result' && d.status === 'ok' ? (
        <>
          <Button variant="secondary" onClick={() => setPhase('idle')}>Replace file</Button>
          {next ? <Button onClick={() => { onNext(next.id); setPhase(next.file && next.status !== 'needed' ? 'result' : 'idle') }} icon={<ArrowRight size={15} />}>Upload {lc(next.name)}</Button> : <Button onClick={onClose}>Back to checklist</Button>}
        </>
      ) : <Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      {phase === 'idle' && (
        <>
          <div className={cx('drop', over && 'over')} onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) pick(f.name) }}>
            <span className="icon-wrap" style={{ width: 44, height: 44, borderRadius: 14 }}><Upload size={20} /></span>
            <div className="strong" style={{ marginTop: 10 }}>{d.status === 'amend' ? 'Upload a corrected file' : 'Drop your file here'}</div>
            <div className="small muted">PDF, JPG or PNG, up to 10 MB</div>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f.name) }} />
            <Button size="sm" onClick={() => fileRef.current?.click()}>Choose a file</Button>
            <div className="tiny muted" style={{ marginTop: 14 }}>No file to hand? <button className="link" onClick={() => pick(sample)}>Use a sample file</button>. In this prototype any file gives a scripted result.</div>
          </div>
          {d.status === 'amend' && <ul className="issues" style={{ marginTop: 14 }}>{d.issues.map((i) => <li key={i.check}><b>{i.check}:</b> {i.fix}</li>)}</ul>}
          <p className="small" style={{ marginTop: 14 }}><button className="link" onClick={onReqs}>View requirements</button></p>
        </>
      )}
      {phase === 'checking' && (
        <div className="checking">
          <div className="spin" aria-hidden="true" />
          <div className="strong">Checking {d.file}</div>
          <div className="small muted" style={{ marginTop: 4 }}>Comparing it with the {b.destination.country} requirements for this document.</div>
        </div>
      )}
      {phase === 'result' && d.status !== 'checking' && (
        <>
          {d.status === 'amend' ? (
            <div className="note bad" role="alert"><strong>{d.issues.length === 1 ? '1 change is needed' : `${d.issues.length} changes are needed`}</strong>{d.file} does not meet the requirements yet. Fix {d.issues.length === 1 ? 'it' : 'them'} and upload the file again. You do not need to contact World Courier.</div>
          ) : (
            <div className="note ok" role="status"><strong>Checked</strong>{d.file} meets the requirements{d.version && d.version > 1 ? ` (version ${d.version})` : ''}.</div>
          )}
          <div className="strong small" style={{ margin: '16px 0 8px' }}>What we checked</div>
          <ul className="checks">
            {d.checks.map((c) => failMap.has(c)
              ? <li key={c} className="fail"><span className="ic"><X size={12} strokeWidth={3} /></span><span><b>{c}</b><br /><span className="why">{failMap.get(c)}</span></span></li>
              : <li key={c} className="pass"><span className="ic"><Check size={12} strokeWidth={3} /></span><span>{c}</span></li>)}
          </ul>
          {d.status === 'ok' && d.resolved.length > 0 && (
            <div className="card pad tint" style={{ marginTop: 14, padding: '12px 14px' }}><div className="strong small">Earlier problems</div>{d.resolved.map((r) => <div key={r.check} className="small" style={{ marginTop: 4 }}><span className="muted" style={{ textDecoration: 'line-through' }}>{r.check}: {r.fix}</span> <Pill tone="ok">Resolved</Pill></div>)}</div>
          )}
          {d.status === 'amend' && (
            <div className={cx('drop', over && 'over')} style={{ marginTop: 16 }} onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) pick(f.name) }}>
              <div className="strong">Upload a corrected file</div>
              <div className="small muted">PDF, JPG or PNG, up to 10 MB</div>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f.name) }} />
              <Button size="sm" onClick={() => fileRef.current?.click()}>Choose a file</Button>
              <div className="tiny muted" style={{ marginTop: 12 }}>No file to hand? <button className="link" onClick={() => pick(sample)}>Use the corrected sample file</button>.</div>
            </div>
          )}
        </>
      )}
    </Drawer>
  )
}

// ----- Messages with the broker -----
function Messages({ b, onReply, onUpload }: { b: BrokerageShipment; onReply: (id: string, text: string) => void; onUpload: (id: string) => void }) {
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const open = openQuestions(b)
  const mounted = useRef(false)
  useEffect(() => { if (mounted.current) endRef.current?.scrollIntoView({ block: 'nearest' }); mounted.current = true }, [b.messages.length])
  const submit = (e: FormEvent) => { e.preventDefault(); if (!text.trim()) return; onReply(open[0]?.id || '', text.trim()); setText('') }
  const sorted = useMemo(() => b.messages, [b.messages])
  return (
    <div className="grid brk-cols">
      <div className="card pad thread">
        {sorted.map((m) => (
          <div key={m.id} className={cx('msg', m.from)}>
            {m.from !== 'you' && <span className={cx('avatar', m.from === 'system' && 'sys')} aria-hidden="true">{m.from === 'system' ? <Stamp size={15} /> : m.who.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>}
            <div className="bubble">
              <div className="row between" style={{ gap: 10 }}><span className="who">{m.who}</span><span className="tiny faint">{m.at}</span></div>
              <div className="text">{m.text}</div>
              {m.needsReply && (
                <div className="ask">
                  <span className="pill bad dot">Needs your reply</span>
                  <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
                    {m.quick?.map((q) => <button key={q} className="chip" onClick={() => onReply(m.id, q)}>{q}</button>)}
                    {m.doc && <button className="chip" onClick={() => onUpload(m.doc!)}><Upload size={13} /> Upload {lc(b.docs.find((d) => d.id === m.doc)?.name || '')}</button>}
                  </div>
                </div>
              )}
              {!m.needsReply && m.from === 'broker' && m.doc && b.docs.find((d) => d.id === m.doc)?.status !== 'ok' && (
                <div className="row wrap" style={{ gap: 6, marginTop: 8 }}><button className="chip" onClick={() => onUpload(m.doc!)}><Upload size={13} /> Upload {lc(b.docs.find((d) => d.id === m.doc)?.name || '')}</button></div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
        <form className="composer" onSubmit={submit}>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={open.length ? `Reply to ${b.specialist.split(' ')[0]}…` : `Message ${b.specialist.split(' ')[0]}…`} aria-label="Message your broker" />
          <button className="btn primary" type="submit" disabled={!text.trim()} aria-label="Send"><Send size={16} /></button>
        </form>
        <div className="tiny faint" style={{ marginTop: 8 }}>Messages stay with the shipment and are visible to your team. Your broker answers within the working hours of {b.broker.split(' · ')[1] || 'their office'}.</div>
      </div>
      <aside>
        <div className="card pad">
          <div className="strong small">Why you may hear from your broker</div>
          <ul className="plain small muted" style={{ marginTop: 8, display: 'grid', gap: 6 }}>
            <li>A document does not match the customs record at the destination.</li>
            <li>Customs selected the consignment for inspection and needs a clarification.</li>
            <li>A licence, permit or importer detail is missing for the entry.</li>
          </ul>
          <div className="tiny faint" style={{ marginTop: 10 }}>Questions arrive here and as a notification; nothing is sent by email alone.</div>
        </div>
      </aside>
    </div>
  )
}

// ----- Customs entry -----
function EntryTab({ b }: { b: BrokerageShipment }) {
  const e = b.entry
  return (
    <div className="grid brk-cols">
      <div className="card pad">
        <div className="row between wrap" style={{ gap: 10 }}><div className="strong">{e.regime}</div>{e.channel && <Pill tone={/green|cleared|pre-lodged/i.test(e.channel) ? 'ok' : /yellow|red/i.test(e.channel) ? 'warn' : 'info'} dot>{e.channel}</Pill>}</div>
        <div style={{ marginTop: 12 }}>
          <KV rows={[
            ['Entry number', e.entryNumber || <span className="muted">Registered on arrival</span>],
            ...(e.mrn ? [['Export MRN', e.mrn] as [string, string]] : []),
            ['HS / commodity code', <span className="mono">{e.hs}</span>],
            ['Goods', e.description],
            ['Customs value', e.value],
            ['Incoterm', e.incoterm],
            ['Duties and taxes', e.dutiesEstimate],
            ...(e.lodged ? [['Lodged', e.lodged] as [string, string]] : []),
            ...(e.released ? [['Released', e.released] as [string, string]] : []),
          ]} />
        </div>
      </div>
      <aside>
        <div className="card pad">
          <div className="strong small">Documents on the entry</div>
          <ul className="plain small" style={{ marginTop: 8, display: 'grid', gap: 6 }}>
            {b.docs.map((d) => <li key={d.id} className="row between"><span className={d.status === 'ok' ? '' : 'muted'}>{d.name}</span>{d.status === 'ok' ? <Check size={14} className="green" /> : <span className="tiny muted">pending</span>}</li>)}
          </ul>
          <div style={{ marginTop: 12 }}><Button variant="ghost" size="xs" to={`/financials?q=${b.job}`}>Brokerage fee on invoice</Button></div>
        </div>
      </aside>
    </div>
  )
}

// ----- Clearance route -----
function RouteCard({ b, onChange }: { b: BrokerageShipment; onChange: (r: ClearanceRoute, detail?: string) => void }) {
  const [edit, setEdit] = useState(false)
  const [route, setR] = useState<ClearanceRoute>(b.route)
  const [detail, setDetail] = useState(b.route === 'external' ? b.broker.split(' (')[0] : b.blanketId || '')
  const valid = route === 'wc' || (route === 'external' && detail.trim().length > 1) || (route === 'blanket' && /^BID-\d{4}-[A-Z]{2}-\d{4}$/i.test(detail.trim()))
  const locked = !(b.status === 'docs' || b.status === 'hold')
  return (
    <div className="card pad">
      <div className="row between"><div className="strong small">Clearance route</div>{!locked && !edit && <button className="link small" onClick={() => setEdit(true)}>Change</button>}</div>
      {!edit ? (
        <>
          <div className="small" style={{ marginTop: 8 }}>{ROUTE_LABEL[b.route]}</div>
          <div className="tiny muted" style={{ marginTop: 2 }}>{b.route === 'blanket' ? `${b.blanketId} · approved by the importing office in advance; documents must match the ones on file.` : b.route === 'external' ? `${b.broker}. World Courier passes the documents on and does not review them.` : `${b.broker} reviews the documents and lodges the entry.`}</div>
          {locked && <div className="tiny faint" style={{ marginTop: 8 }}>The route is fixed once OK to Send has been requested.</div>}
        </>
      ) : (
        <Expand title="Who handles the customs documents?" open>
          {(['wc', 'external', 'blanket'] as ClearanceRoute[]).map((r) => (
            <label key={r} className={cx('opt', route === r && 'on')}>
              <input type="radio" name="route" checked={route === r} onChange={() => setR(r)} />
              <span><span className="strong small">{ROUTE_LABEL[r]}</span><br /><span className="tiny muted">{r === 'wc' ? 'World Courier Customs reviews your documents and lodges the entry.' : r === 'external' ? 'External broker confirmed. You still upload documents; OK to Send is pending the broker’s review.' : 'The importing office has approved this lane. Documents must exactly match the ones on file.'}</span></span>
            </label>
          ))}
          {route !== 'wc' && (
            <div style={{ marginTop: 8 }}>
              <label className="tiny muted" htmlFor="route-detail">{route === 'external' ? 'External broker name' : 'Blanket ID number'}</label>
              <input id="route-detail" className={cx('input', detail && !valid && 'err')} style={{ height: 38, marginTop: 4 }} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder={route === 'external' ? 'Nova Aduaneira Ltda' : 'BID-2026-BR-0001'} />
              {route === 'blanket' && detail && !valid && <div className="tiny red" style={{ marginTop: 4 }}>Enter the Blanket ID in the format BID-2026-BR-0001.</div>}
            </div>
          )}
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <Button size="xs" disabled={!valid} onClick={() => { onChange(route, detail.trim().toUpperCase() === detail.trim().toUpperCase() && route === 'blanket' ? detail.trim().toUpperCase() : detail.trim()); setEdit(false) }}>Save</Button>
            <Button size="xs" variant="ghost" onClick={() => { setEdit(false); setR(b.route) }}>Cancel</Button>
          </div>
        </Expand>
      )}
    </div>
  )
}
