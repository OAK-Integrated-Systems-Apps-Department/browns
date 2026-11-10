import { useState, ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDB, decide, canDecide, mutate, entityOf, empName, siteName, projName, mat, veh, taskOf, wbsName, resubmit, getActor, toast, audit } from '../lib/store'
import { COLL_OF } from '../lib/seed'
import { ROLES } from '../lib/roles'
import { fmtDT, fmtDate, money, num } from '../lib/util'
import { useRole } from '../App'
import { Badge, DataTable, Drawer, Detail, Flow, PageHeader, ReasonModal, Tabs, Timeline, FormDrawer, Sim, Refreshed } from '../components/ui'

export function summary(s: any, kind: string, e: any): [string, ReactNode][] {
  if (!e) return []
  const base: [string, ReactNode][] = [['Reference', e.ref], ['Status', <Badge s={e.status} />]]
  switch (kind) {
    case 'attendance': return [...base, ['Employee', `${e.empName} (${e.empId})`], ['Category', e.category], ['Site', siteName(s, e.siteId)], ['Date', fmtDate(e.date)], ['Check-in', fmtDT(e.in)], ['Check-out', e.out ? fmtDT(e.out) : 'Missing'], ['GPS (in)', e.inLat ? `${e.inLat.toFixed(4)}, ${e.inLng.toFixed(4)} ±${e.acc}m` : '—'], ['Method', e.method + (e.gangRef ? ' · ' + e.gangRef : '')], ['Hours / OT', `${e.hours?.toFixed(1)} / ${e.ot?.toFixed(1)}`], ['Flags', e.flags?.length ? e.flags.join('; ') : 'None'], ['HRIS ack', e.postRef || '—'], ['Transaction ID', e.txId]]
    case 'leave': return [...base, ['Employee', empName(s, e.empId)], ['Type', e.type], ['From – To', `${fmtDate(e.from)} – ${fmtDate(e.to)}`], ['Days', e.days], ['Reason', e.reason]]
    case 'progress': { const t = taskOf(s, e.taskId); return [...base, ['Project', projName(s, e.projectId)], ['Site', siteName(s, e.siteId)], ['WBS', wbsName(s, e.wbsId)], ['Task', t?.name], ['Report date', fmtDate(e.date)], ['Planned qty/day', `${num(e.planned)} ${t?.unit}`], ['Actual daily qty', `${num(e.daily)} ${t?.unit}`], ['Cumulative (after approval)', `${num((t?.cumulative || 0) + (['Approved', 'Posted'].includes(e.status) ? 0 : e.daily))} / ${num(t?.planned)} ${t?.unit}`], ['Version', 'v' + e.version], ['Weather', e.weather], ['Manpower used', e.manpower], ['Equipment', e.equipment], ['Delays', e.delays || '—'], ['Safety', e.safety || '—'], ['Quality', e.quality || '—'], ['Work done', e.desc], ['Evidence', `${e.photos} photo(s), ${e.videos} video(s)`], ['SAP ref', e.postRef || '—']] }
    case 'indent': return [...base, ['Project', projName(s, e.projectId)], ['Site', siteName(s, e.siteId)], ['WBS', wbsName(s, e.wbsId)], ['Requested by', empName(s, e.by)], ['Required', fmtDate(e.required)], ['Purpose', e.purpose], ['Items', e.items.map((i: any) => `${mat(s, i.code)?.name} × ${i.qty} ${i.unit}`).join('; ')]]
    case 'receipt': return [...base, ['PO', e.poNo], ['Supplier', e.supplier], ['Material', mat(s, e.code)?.name], ['Received / ordered', `${e.qty} / ${e.ordered}`], ['Store', siteName(s, e.siteId)], ['Discrepancy', e.discrepancy || 'None'], ['Received by', empName(s, e.by)], ['SAP MM doc', e.postRef || '—']]
    case 'issue': return [...base, ['Type', e.type], ['Material', mat(s, e.code)?.name], ['Qty', `${e.qty} ${e.unit}`], ['Store', siteName(s, e.siteId)], ['Project', projName(s, e.projectId)], ['WBS', wbsName(s, e.wbsId)], ['Issued by', empName(s, e.by)], ['Received by', empName(s, e.receivedBy)], ['Date', fmtDT(e.date)], ['SAP MM doc', e.postRef || '—']]
    case 'mreturn': return [...base, ['Return type', e.type], ['Material', mat(s, e.code)?.name], ['Qty', e.qty], ['Store/site', siteName(s, e.siteId)], ['Reason', e.reason]]
    case 'stockcount': return [...base, ['Material', mat(s, e.code)?.name], ['Store', siteName(s, e.siteId)], ['SAP balance', e.sap], ['Physical', e.physical], ['Variance', `${(e.physical - e.sap).toFixed(2)} (${((e.physical - e.sap) / e.sap * 100).toFixed(1)}%)`], ['Reason', e.reason || '—'], ['Note', 'Approval does not auto-adjust SAP; an adjustment is queued for validated posting.']]
    case 'transfer': return [...base, ['Material', mat(s, e.code)?.name], ['Qty', e.qty], ['From', siteName(s, e.from)], ['To', siteName(s, e.to)]]
    case 'trip': { const v = veh(s, e.vehicleId); return [...base, ['Vehicle', `${v?.reg} (${v?.type})`], ['Driver', empName(s, e.driverId)], ['Route', `${e.origin} → ${e.dest}`], ['Purpose', e.purpose], ['Odometer', `${e.startOdo} → ${e.endOdo ?? '…'}`], ['Segments', e.segments?.map((x: any) => `${siteName(s, x.siteId)} (${x.projectId}, ${x.km} km)`).join('; ') || '—'], ['SAP ref', e.postRef || '—']] }
    case 'fuel': return [...base, ['Vehicle', veh(s, e.vehicleId)?.reg], ['Station', e.station], ['Litres', e.litres], ['Cost', money(e.cost)], ['Odometer', e.odo], ['Trip', e.tripRef || '—']]
    case 'tempveh': return [...base, ['Type', e.type], ['Project', projName(s, e.projectId)], ['Dates', `${fmtDate(e.from)} – ${fmtDate(e.to)}`], ['Reason', e.reason], ['Estimate', money(e.est)]]
    case 'advance': return [...base, ['Employee', empName(s, e.empId)], ['Project', projName(s, e.projectId)], ['Site', siteName(s, e.siteId)], ['WBS', wbsName(s, e.wbsId)], ['Purpose', e.purpose], ['Requested', money(e.amount)], ['Required by', fmtDate(e.required)], ['Disbursed', e.disb ? `${money(e.disb.amount)} · ${e.disb.method} · ${e.disb.reference}` : 'Not yet']]
    case 'expense': return [...base, ['Employee', empName(s, e.empId)], ['Advance', e.advRef], ['Category', e.cat], ['Date', fmtDate(e.date)], ['Amount', money(e.amount)], ['Description', e.desc], ['Receipt', e.photo ? 'Attached ✔' : 'MISSING'], ['Fuel cross-ref', e.fuelRef ? `${e.fuelRef} – excluded from petty-cash cost (already in Transport)` : '—']]
  }
  return base
}

export function ApprovalDrawer({ refNo: r, onClose }: { refNo: string; onClose: () => void }) {
  const db = useDB(); const { role } = useRole(); const a = db.approvals.find((x: any) => x.ref === r); const [m, setM] = useState<null | 'reject' | 'return' | 'comment'>(null); const [resub, setResub] = useState(false)
  if (!a) return null
  const e = entityOf(db, a.kind, r); const can = canDecide(a, role); const st = a.stages[a.stage]
  const isRequesterRole = ['supervisor', 'employee', 'storekeeper', 'driver', 'pm'].includes(role)
  const photo = e?.inPhoto || e?.photo
  return <Drawer wide title={<>{a.ref} <Badge s={a.status === 'Pending' ? 'Pending Approval' : a.status} /></>} onClose={onClose}
    footer={<>{can && a.kind === 'progress' && e?.status === 'Submitted' && <button className="btn btn-outline-primary me-auto" onClick={() => decide(r, 'review')}>Start review</button>}
      {a.status === 'Returned' && isRequesterRole && <button className="btn btn-outline-primary" onClick={() => setResub(true)}>Correct & resubmit</button>}
      <button className="btn btn-light" onClick={() => setM('comment')}>Add comment</button>
      {can && <><button className="btn btn-outline-warning" onClick={() => setM('return')}>Return</button><button className="btn btn-outline-danger" onClick={() => setM('reject')}>Reject</button><button className="btn btn-success" onClick={() => { if (decide(r, 'approve')) { /* keep open to show result */ } }}>{a.stage < a.stages.length - 1 ? 'Verify / Approve stage' : 'Approve'}</button></>}</>}>
    <div className="mb-3"><div className="small text-muted mb-1">Approval route · current: {a.status === 'Pending' ? <b>{st.name} ({a.assignee})</b> : a.status}</div><Flow stages={a.stages.map((x: any) => x.name)} cur={a.stage} status={a.status} /></div>
    {!can && a.status === 'Pending' && <div className="alert alert-secondary py-2 small">This record is awaiting <b>{st.name}</b> by <b>{a.assignee}</b>. Your role ({ROLES[role as keyof typeof ROLES].short}) {ROLES[role as keyof typeof ROLES].readonly ? 'has view-only access.' : 'cannot decide at this stage.'}</div>}
    <Detail rows={summary(db, a.kind, e)} />
    {photo && photo !== 'demo' && <div className="mt-3"><div className="small text-muted">Evidence photo (thumbnail)</div><img src={photo} className="thumb" style={{ width: 160, height: 115 }} alt="" /></div>}
    {e?.postRef && <div className="alert alert-success py-2 small mt-3 mb-0">Posted – reference <b>{e.postRef}</b> <Sim /></div>}
    <h6 className="mt-4 text-navy">Decision history & audit trail</h6>
    <Timeline items={[...a.history].reverse().map((h: any) => ({ at: h.at, title: `${h.action} – ${h.by}`, sub: `${h.role} · ${h.stage}${h.comment ? ' · “' + h.comment + '”' : ''}` }))} />
    {e?.history && a.kind === 'progress' && <><h6 className="mt-3 text-navy">Version history</h6><Timeline items={[...e.history].reverse().map((h: any) => ({ at: h.at, title: `Version ${h.v}`, sub: `${h.by} · ${h.note}` }))} /></>}
    {m === 'reject' && <ReasonModal danger title={`Reject ${r}`} cta="Reject" onClose={() => setM(null)} onSubmit={(c: string) => decide(r, 'reject', c)} />}
    {m === 'return' && <ReasonModal title={`Return ${r} for correction`} cta="Return" onClose={() => setM(null)} onSubmit={(c: string) => decide(r, 'return', c)} />}
    {m === 'comment' && <ReasonModal title="Add comment" cta="Add" onClose={() => setM(null)} onSubmit={(c: string) => { mutate(s => { const x = s.approvals.find((y: any) => y.ref === r); x.history.push({ at: new Date().toISOString(), by: getActor().name, role: ROLES[role as keyof typeof ROLES].short, action: 'Comment', comment: c, stage: x.stages[x.stage]?.name || '—' }); audit(s, 'Comment added', x.module, r, '', '', '', '') }); toast('Comment added', 'success') }} />}
    {resub && <ResubmitForm kind={a.kind} e={e} onClose={() => setResub(false)} />}
  </Drawer>
}
function ResubmitForm({ kind, e, onClose }: any) {
  const f: any[] = kind === 'progress' ? [{ name: 'daily', label: 'Actual daily quantity (corrected)', type: 'number', required: true, min: 0 }, { name: 'desc', label: 'Description of work', type: 'textarea', required: true }]
    : kind === 'advance' ? [{ name: 'amount', label: 'Requested amount (LKR)', type: 'number', required: true, min: 1 }, { name: 'desc', label: 'Description', type: 'textarea' }]
      : kind === 'expense' ? [{ name: 'amount', label: 'Amount (LKR)', type: 'number', required: true, min: 1 }, { name: 'photo', label: 'Receipt photograph', type: 'photo', required: true }, { name: 'desc', label: 'Description', type: 'text' }]
        : [{ name: 'note', label: 'Correction note', type: 'textarea', required: true }]
  return <FormDrawer title={`Correct & resubmit ${e.ref}`} cta="Resubmit" fields={f} initial={e} onClose={onClose} onSubmit={v => { if (kind === 'expense' && !v.photo) return 'Receipt photograph is mandatory'; const p: any = { ...v }; if (p.daily != null) { p.daily = +p.daily; p.cumulative = p.daily } if (p.amount != null) p.amount = +p.amount; delete p.note; resubmit(kind, e.ref, p) }} />
}

export default function Approvals() {
  const db = useDB(); const { role } = useRole(); const [sp, setSp] = useSearchParams(); const [tab, setTab] = useState('My Pending Approvals'); const [sel, setSel] = useState<string | null>(sp.get('ref'))
  const all = db.approvals; const mine = all.filter((a: any) => canDecide(a, role))
  const rows = tab === 'My Pending Approvals' ? mine : tab === 'All Approval Requests' ? all : tab === 'Approved Requests' ? all.filter((a: any) => a.status === 'Approved') : tab === 'Rejected Requests' ? all.filter((a: any) => a.status === 'Rejected') : all.filter((a: any) => a.status === 'Returned')
  const hist = all.flatMap((a: any) => a.history.filter((h: any) => h.action !== 'Submitted').map((h: any) => ({ ...h, ref: a.ref, module: a.module, project: projName(db, a.projectId) }))).sort((x: any, y: any) => y.at.localeCompare(x.at))
  return <>
    <PageHeader title="Approval Centre" crumbs={['Operations']} sub={<Refreshed />} />
    <Tabs tabs={['My Pending Approvals', 'All Approval Requests', 'Approved Requests', 'Rejected Requests', 'Returned Requests', 'Approval History']} active={tab} onChange={setTab} />
    {tab === 'Approval History' ? <DataTable exportName="approval-history" pageSize={10} rows={hist} filters={[{ key: 'module', label: 'Module' }, { key: 'action', label: 'Action' }]} onRow={h => setSel(h.ref)}
      cols={[{ key: 'at', label: 'When', render: h => fmtDT(h.at), sort: h => h.at }, { key: 'ref', label: 'Reference' }, { key: 'module', label: 'Module' }, { key: 'action', label: 'Decision', render: h => <Badge s={h.action.startsWith('Approved') || h.action.startsWith('Verified') ? 'Approved' : h.action.startsWith('Reject') ? 'Rejected' : h.action.startsWith('Return') ? 'Returned' : 'Submitted'} label={h.action} /> }, { key: 'by', label: 'By' }, { key: 'role', label: 'Role' }, { key: 'stage', label: 'Stage' }, { key: 'comment', label: 'Comment' }]} />
      : <>{tab === 'My Pending Approvals' && !mine.length && <div className="alert alert-success small">Nothing is waiting for your decision. {ROLES[role as keyof typeof ROLES].canApprove ? '' : 'Your role has no approval authority.'}</div>}
        <DataTable exportName="approvals" pageSize={10} rows={rows} onRow={a => setSel(a.ref)} filters={[{ key: 'module', label: 'Module' }, { key: 'status', label: 'Status' }, { key: 'assignee', label: 'Approver' }]}
          cols={[{ key: 'ref', label: 'Reference', render: a => <b className="text-primary">{a.ref}</b> }, { key: 'module', label: 'Module' }, { key: 'requester', label: 'Requester' }, { key: 'projectId', label: 'Project', render: a => a.projectId, sort: a => a.projectId }, { key: 'siteId', label: 'Site', render: a => siteName(db, a.siteId), sort: a => siteName(db, a.siteId) }, { key: 'date', label: 'Submitted', render: a => fmtDate(a.date), sort: a => a.date }, { key: 'amount', label: 'Amount / Qty', render: a => (a.amount != null ? money(a.amount) : a.qty || '—'), sort: a => a.amount ?? 0, align: 'right' },
            { key: 'stage', label: 'Current stage', render: a => (a.status === 'Pending' ? a.stages[a.stage].name : '—'), sort: a => a.stage }, { key: 'assignee', label: 'Assigned approver' }, { key: 'status', label: 'Status', render: a => <Badge s={a.status === 'Pending' ? 'Pending Approval' : a.status} />, sort: a => a.status }, { key: 'remarks', label: 'Remarks', render: a => <span className="small text-muted">{a.remarks || '—'}</span> }]} /></>}
    {sel && <ApprovalDrawer refNo={sel} onClose={() => { setSel(null); sp.delete('ref'); setSp(sp) }} />}
  </>
}
