import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDB, siteName, projName, empName, veh, advanceSummary, canDecide, getActor, avail, mat } from '../lib/store'
import { costs, overall, projectProgress, pettyKpis, triTotal, isLow, wbsProgress, taskPct, attFlags } from '../lib/calc'
import { ROLES } from '../lib/roles'
import { money, num, short, fmtDate, fmtTime, sum, dayStr } from '../lib/util'
import { useRole } from '../App'
import { Kpi, Card, ChartCard, BarC, LineC, PieC, PageHeader, Refreshed, Badge, Sim, Progress as Prog, DataTable } from '../components/ui'

export default function Dashboard() {
  const { role } = useRole()
  if (role === 'admin') return <AdminDash />
  if (role === 'pm') return <PMDash />
  if (role === 'supervisor') return <SupDash />
  if (role === 'storekeeper') return <StoreDash />
  if (role === 'driver') return <DriverDash />
  if (role === 'finance') return <FinDash />
  if (role === 'employee') return <EmpDash />
  return <Executive />
}

function Executive({ embedded }: { embedded?: boolean }) {
  const db = useDB(); const nav = useNavigate()
  const [f, setF] = useState({ project: '', site: '', from: '', to: '', wbs: '', dept: '', module: '' })
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v, ...(k === 'project' ? { site: '', wbs: '' } : {}) }))
  const pids = db.projects.filter((p: any) => !f.project || p.id === f.project).map((p: any) => p.id)
  const siteOk = (id: string) => !f.site || f.site === id
  const emps = db.employees.filter((e: any) => pids.includes(e.projectId) && siteOk(e.siteId) && (!f.dept || e.dept === f.dept))
  const C = costs(db, { project: f.project, site: f.site, from: f.from, to: f.to })
  const today = dayStr(0)
  const att = db.attendance.filter((a: any) => a.date === today && pids.includes(a.projectId) && siteOk(a.siteId) && !['Rejected'].includes(a.status))
  const attRate = emps.length ? Math.min(100, (att.length / emps.filter((e: any) => e.status === 'Active').length) * 100) : 0
  const ov = overall(db, pids); const pk = pettyKpis(db)
  const vehs = db.vehicles.filter((v: any) => pids.includes(v.projectId) && siteOk(v.siteId)); const trips = db.trips.filter((t: any) => t.status === 'In Progress')
  const matVal = sum(pids, (p: string) => C[p].materials.est + C[p].materials.appr + C[p].materials.conf)
  const m = (k: string) => !f.module || f.module === k
  const pName = (id: string) => id
  const trend = ['-6d', '-5d', '-4d', '-3d', '-2d', 'Yesterday', 'Today'].map((d, i) => ({ name: d, Present: [58, 61, 57, 63, 60, 14 + att.length, att.length][i] ?? 0, Absent: [6, 3, 7, 1, 4, 6, Math.max(0, emps.length - att.length)][i] }))
  const ovt = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((n, i) => ({ name: n, 'OT hours': [310, 345, 298, 372, 401, 150 + Math.round(sum(db.attendance, (a: any) => a.ot))][i] }))
  const fuelTrend = ['W-5', 'W-4', 'W-3', 'W-2', 'W-1', 'This wk'].map((n, i) => ({ name: n, Litres: [820, 910, 780, 860, 940, 330 + sum(db.fuel, (x: any) => x.litres)][i] }))
  const ageing = [['0–7 d', 0, 7], ['8–14 d', 8, 14], ['15–30 d', 15, 30], ['> 30 d', 31, 9999]].map(([n, a, b]: any) => ({ name: n, Outstanding: sum(db.advances.filter((x: any) => x.status === 'Disbursed' && pids.includes(x.projectId)), (x: any) => { const age = Math.floor((Date.now() - Date.parse(x.disb.date)) / 864e5); return age >= a && age <= b ? Math.max(0, advanceSummary(db, x).balance) : 0 }) }))
  const lowStock = [...db.materials].filter((x: any) => x.status === 'Active' && siteOk(x.store)).sort((a: any, b: any) => avail(a) / a.reorder - avail(b) / b.reorder).slice(0, 7).map((x: any) => ({ name: x.name.slice(0, 16), Available: avail(x), 'Reorder level': x.reorder }))
  const pend = ['Manpower', 'Progress', 'Materials', 'Transport', 'Petty Cash'].map(k => ({ name: k, Pending: db.approvals.filter((a: any) => a.module === k && a.status === 'Pending').length }))
  const wbsFilter = db.wbs.filter((w: any) => (!f.project || w.projectId === f.project))
  return <>
    {!embedded && <PageHeader title="Executive Dashboard" crumbs={['Main Menu']} sub={<Refreshed />} actions={<button className="btn btn-sm btn-outline-primary" onClick={() => nav('/app/reports')}><i className="bi bi-file-earmark-bar-graph" /> Reports</button>} />}
    <Card className="mb-3"><div className="row g-2 align-items-end">
      {[['Project', 'project', db.projects.map((p: any) => ({ v: p.id, l: p.id + ' · ' + p.name.slice(0, 30) }))], ['Site', 'site', db.sites.filter((s: any) => !f.project || s.projectId === f.project).map((s: any) => ({ v: s.id, l: s.name }))], ['WBS', 'wbs', wbsFilter.map((w: any) => ({ v: w.id, l: w.id + ' ' + w.name }))], ['Department', 'dept', [...new Set(db.employees.map((e: any) => e.dept))].map((d: any) => ({ v: d, l: d }))], ['Module', 'module', ['Manpower', 'Transport', 'Progress', 'Materials', 'Petty Cash'].map(x => ({ v: x, l: x }))]].map(([l, k, o]: any) => <div className="col-6 col-md-2" key={k}><label className="small text-muted">{l}</label><select className="form-select form-select-sm" value={(f as any)[k]} onChange={e => set(k, e.target.value)}><option value="">All</option>{o.map((x: any) => <option key={x.v} value={x.v}>{x.l}</option>)}</select></div>)}
      <div className="col-6 col-md-1"><label className="small text-muted">From</label><input type="date" className="form-control form-control-sm" value={f.from} onChange={e => set('from', e.target.value)} /></div>
      <div className="col-6 col-md-1"><label className="small text-muted">To</label><input type="date" className="form-control form-control-sm" value={f.to} onChange={e => set('to', e.target.value)} /></div></div></Card>
    <div className="row g-3 mb-3">{[
      ['Total Projects', pids.length, `${db.projects.filter((p: any) => pids.includes(p.id) && p.status === 'Delayed').length} delayed`, 'building', '/app/projects'], ['Active Sites', db.sites.filter((s: any) => pids.includes(s.projectId) && siteOk(s.id)).length, 'incl. stores & yards', 'geo-alt', '/app/projects'],
      ['Total Manpower', emps.length, `${emps.filter((e: any) => e.category === 'Internal').length} int · ${emps.filter((e: any) => e.category === 'Hired Labour').length} hired · ${emps.filter((e: any) => e.category === 'Subcontractor').length} sub`, 'people', '/app/manpower'], ['Attendance Rate', attRate.toFixed(0) + '%', `${att.length} present today`, 'person-check', '/app/manpower'],
      ['Total Vehicles', vehs.length, `${vehs.filter((v: any) => v.status === 'Active').length} active`, 'truck', '/app/transport'], ['Active Trips', trips.length, 'driver-device tracked', 'signpost-split', '/app/transport'],
      ['Overall Progress', (ov.actual * 100).toFixed(1) + '%', `Planned ${(ov.planned * 100).toFixed(1)}% (weighted)`, 'bar-chart-steps', '/app/progress'], ['Material Consumption', money(matVal), 'valued items only', 'boxes', '/app/materials'],
      ['Petty Cash Advances', money(pk.disbursed), 'cash movement – not an expense', 'wallet2', '/app/petty'], ['Outstanding Settlements', money(pk.outstanding), `${db.advances.filter((a: any) => a.status === 'Disbursed').length} open advances`, 'hourglass-split', '/app/petty']].map(([l, v, s, i, t]: any) => <div className="col-6 col-md-4 col-xl-2" key={l}><Kpi label={l} value={v} sub={s} icon={i} to={t} /></div>)}</div>
    <div className="row g-3">
      {m('Manpower') && <><div className="col-lg-4"><ChartCard title="1 · Manpower by project" onClick={() => nav('/app/manpower')}><PieC data={db.projects.filter((p: any) => pids.includes(p.id)).map((p: any) => ({ name: p.id, value: emps.filter((e: any) => e.projectId === p.id).length }))} onClick={() => '/app/manpower'} /></ChartCard></div>
        <div className="col-lg-4"><ChartCard title="2 · Daily attendance trend" onClick={() => nav('/app/manpower')}><LineC data={trend} keys={['Present', { k: 'Absent', c: '#d1344a' }]} area /></ChartCard></div>
        <div className="col-lg-4"><ChartCard title="3 · Labour cost by project (LKR)" onClick={() => nav('/app/manpower')}><BarC stacked fmt={short} data={pids.map((p: string) => ({ name: p, Estimated: Math.round(C[p].labour.est), Approved: Math.round(C[p].labour.appr), 'SAP-confirmed': Math.round(C[p].labour.conf) }))} keys={[{ k: 'Estimated', c: '#e9a23b' }, { k: 'Approved', c: '#1565c0' }, { k: 'SAP-confirmed', c: '#1e8e5a' }]} /></ChartCard></div></>}
      {m('Progress') && <><div className="col-lg-6"><ChartCard title="4 · Planned vs actual progress (%)" onClick={() => nav('/app/progress')}><BarC data={pids.map((p: string) => ({ name: p, Planned: +(projectProgress(db, p).planned * 100).toFixed(1), Actual: +(projectProgress(db, p).actual * 100).toFixed(1) }))} keys={[{ k: 'Planned', c: '#9fb3cc' }, { k: 'Actual', c: '#1565c0' }]} onClick={() => '/app/progress'} /></ChartCard></div>
        <div className="col-lg-6"><ChartCard title="5 · Project completion comparison (weighted, %)" onClick={() => nav('/app/progress')}><BarC horizontal data={pids.map((p: string) => ({ name: p, 'Completion %': +(projectProgress(db, p).actual * 100).toFixed(1) }))} keys={[{ k: 'Completion %', c: '#2a9d8f' }]} onClick={() => '/app/progress'} /></ChartCard></div></>}
      {m('Transport') && <><div className="col-lg-6"><ChartCard title="6 · Transportation expenditure (LKR)" onClick={() => nav('/app/transport')}><BarC stacked fmt={short} data={pids.map((p: string) => ({ name: p, Estimated: Math.round(C[p].transport.est), Approved: Math.round(C[p].transport.appr), 'SAP-confirmed': Math.round(C[p].transport.conf) }))} keys={[{ k: 'Estimated', c: '#e9a23b' }, { k: 'Approved', c: '#1565c0' }, { k: 'SAP-confirmed', c: '#1e8e5a' }]} /></ChartCard></div>
        <div className="col-lg-6"><ChartCard title="7 · Fuel consumption trend (litres)" onClick={() => nav('/app/transport')}><LineC area data={fuelTrend} keys={['Litres']} /></ChartCard></div></>}
      {m('Materials') && <><div className="col-lg-6"><ChartCard title="8 · Material consumption by project (LKR, valued)" onClick={() => nav('/app/materials')}><BarC fmt={short} data={pids.map((p: string) => ({ name: p, Value: Math.round(C[p].materials.est + C[p].materials.appr + C[p].materials.conf) }))} keys={[{ k: 'Value', c: '#8e6bbf' }]} onClick={() => '/app/materials'} /></ChartCard></div>
        <div className="col-lg-6"><ChartCard title="9 · Material stock availability (lowest cover)" onClick={() => nav('/app/materials')}><BarC data={lowStock} keys={[{ k: 'Available', c: '#2a9d8f' }, { k: 'Reorder level', c: '#d1344a' }]} /></ChartCard></div></>}
      {m('Petty Cash') && <><div className="col-lg-6"><ChartCard title="10 · Petty cash utilisation (LKR)" onClick={() => nav('/app/petty')}><BarC fmt={short} data={pids.map((p: string) => ({ name: p, 'Advances issued': sum(db.advances.filter((a: any) => a.projectId === p && a.disb), (a: any) => a.disb.amount), 'Approved expenses': sum(db.expenses.filter((e: any) => e.projectId === p && e.status === 'Approved'), (e: any) => e.amount) }))} keys={[{ k: 'Advances issued', c: '#9fb3cc' }, { k: 'Approved expenses', c: '#1565c0' }]} onClick={() => '/app/petty'} /></ChartCard></div>
        <div className="col-lg-3"><ChartCard title="11 · Outstanding advance ageing" onClick={() => nav('/app/petty')}><BarC fmt={short} data={ageing} keys={[{ k: 'Outstanding', c: '#d1344a' }]} /></ChartCard></div></>}
      <div className={`col-lg-${m('Petty Cash') ? 3 : 6}`}><ChartCard title="12 · Pending approvals by module" onClick={() => nav('/app/approvals')}><BarC horizontal data={pend} keys={[{ k: 'Pending', c: '#e08a00' }]} onClick={() => '/app/approvals'} /></ChartCard></div>
    </div>
    <CostOverview C={C} pids={pids} />
  </>
}
export function CostOverview({ C, pids }: any) {
  const db = useDB(); const [b, setB] = useState<'est' | 'appr' | 'conf'>('appr'); const nav = useNavigate()
  const names = { est: 'Estimated operational cost', appr: 'Approved operational cost', conf: 'SAP-confirmed financial actuals (simulated)' }
  const tot = (k: any) => sum(pids, (p: string) => triTotal(C[p], k)); const un = sum(pids, (p: string) => C[p].unvalued); const dup = sum(pids, (p: string) => C[p].dupExcluded)
  return <Card className="mt-3" title="Project operational cost overview" right={<div className="btn-group btn-group-sm">{(['est', 'appr', 'conf'] as const).map(k => <button key={k} className={`btn btn-${b === k ? 'primary' : 'outline-primary'}`} onClick={() => setB(k)}>{k === 'est' ? 'Estimated' : k === 'appr' ? 'Approved' : 'SAP-confirmed'}</button>)}</div>}>
    <div className="row g-2 mb-3">{(['est', 'appr', 'conf'] as const).map(k => <div className="col-md-4" key={k}><div className={`p-2 border rounded ${k === b ? 'border-primary bg-light' : ''}`}><div className="small text-muted">{names[k]}</div><div className="fs-5 fw-bold text-navy">{money(tot(k))}</div></div></div>)}</div>
    <div className="table-responsive"><table className="table table-sm align-middle"><thead><tr><th>Project</th><th className="text-end">Labour</th><th className="text-end">Transport</th><th className="text-end">Material consumption</th><th className="text-end">Petty cash expenditure</th><th className="text-end">Total ({b === 'est' ? 'Estimated' : b === 'appr' ? 'Approved' : 'SAP-confirmed'})</th></tr></thead>
      <tbody>{pids.map((p: string) => <tr key={p} className="clk" style={{ cursor: 'pointer' }} onClick={() => nav('/app/reports')}><td><b>{p}</b> <span className="text-muted small">{projName(db, p).slice(0, 34)}</span></td>{(['labour', 'transport', 'materials', 'petty'] as const).map(k => <td key={k} className="text-end">{C[p][k][b] ? money(C[p][k][b]) : <span className="text-muted">{b === 'conf' ? 'Not yet posted' : '—'}</span>}</td>)}<td className="text-end fw-bold">{triTotal(C[p], b) ? money(triTotal(C[p], b)) : '—'}</td></tr>)}</tbody></table></div>
    <div className="small text-muted"><i className="bi bi-info-circle" /> Advances are cash movements and are <b>not</b> counted as cost – only approved expenses are. {dup > 0 && <>Petty-cash fuel claims of <b>{money(dup)}</b> were excluded because the same fuel is already costed in Transport (duplicate prevented). </>}{un > 0 && <><b>{un}</b> consumption record(s) have no SAP valuation and are shown as "not valued", not as zero. </>}Estimated = submitted/awaiting approval · Approved = approved in this app · SAP-confirmed = simulated posting acknowledged.</div>
  </Card>
}

// ----- role dashboards -----
const Quick = ({ items }: { items: [string, string, string][] }) => <div className="row g-2 mb-3">{items.map(([l, i, t]) => <div className="col-6 col-md-3" key={l}><Link to={t} className="btn btn-outline-primary w-100 py-3"><i className={`bi bi-${i} d-block fs-4`} />{l}</Link></div>)}</div>
function PendingList({ role }: { role: string }) {
  const db = useDB(); const nav = useNavigate(); const rows = db.approvals.filter((a: any) => canDecide(a, role)).slice(0, 6)
  return <Card title="Awaiting my approval" right={<Link to="/app/approvals" className="small">Open Approval Centre</Link>}>{rows.length ? <ul className="list-group list-group-flush">{rows.map((a: any) => <li key={a.ref} className="list-group-item d-flex justify-content-between px-0" style={{ cursor: 'pointer' }} onClick={() => nav('/app/approvals?ref=' + a.ref)}><span><b>{a.ref}</b> <span className="text-muted small">{a.module} · {a.requester}</span></span><span className="small">{a.amount != null ? money(a.amount) : a.qty}</span></li>)}</ul> : <div className="text-muted small">All caught up.</div>}</Card>
}
function AdminDash() {
  const db = useDB(); const bad = db.integrations.filter((i: any) => ['Failed', 'Requires Reconciliation'].includes(i.status))
  return <><PageHeader title="Administrator Dashboard" sub={<Refreshed />} />
    <div className="row g-3 mb-3"><div className="col-6 col-md-3"><Kpi label="Active users" value={db.users.filter((u: any) => u.status === 'Active').length} icon="people" to="/app/users" /></div><div className="col-6 col-md-3"><Kpi label="Integration exceptions" value={bad.length} tone="red" icon="plug" to="/app/integration" sub="failed / reconcile" /></div><div className="col-6 col-md-3"><Kpi label="Pending sync items" value={db.syncQueue.filter((t: any) => ['Saved on Device', 'Awaiting Upload', 'Sync Failed'].includes(t.status)).length} icon="arrow-repeat" to="/app/sync" /></div><div className="col-6 col-md-3"><Kpi label="Audit events" value={db.audit.length} icon="journal-text" to="/app/audit" /></div></div>
    <Quick items={[['Users', 'person-gear', '/app/users'], ['Master data', 'database', '/app/master'], ['Integration', 'plug', '/app/integration'], ['Settings', 'gear', '/app/settings']]} />
    <div className="row g-3"><div className="col-lg-6"><Card title="Integration exceptions" right={<Sim />}>{bad.map((i: any) => <div key={i.id} className="d-flex justify-content-between border-bottom py-2 small"><span><b>{i.ref}</b> · {i.module}<br /><span className="text-muted">{i.error}</span></span><Badge s={i.status} /></div>)}{!bad.length && <div className="text-muted small">None</div>}</Card></div>
      <div className="col-lg-6"><Card title="Recent audit events">{db.audit.slice(0, 6).map((a: any) => <div key={a.id} className="small border-bottom py-1"><b>{a.action}</b> · {a.ref} <span className="text-muted">— {a.user}, {fmtTime(a.at)}</span></div>)}</Card></div></div></>
}
function PMDash() {
  const db = useDB(); const mine = db.projects.slice(0, 2).map((p: any) => p.id); const C = costs(db)
  const delayed = db.tasks.filter((t: any) => t.status === 'Delayed' && mine.includes(t.projectId))
  return <><PageHeader title="Project Manager Dashboard" sub={<Refreshed />} />
    <div className="row g-3 mb-3"><div className="col-6 col-md-3"><Kpi label="Pending my approval" value={db.approvals.filter((a: any) => canDecide(a, 'pm')).length} icon="check2-square" to="/app/approvals" tone="orange" /></div><div className="col-6 col-md-3"><Kpi label="Assigned projects" value={mine.length} icon="building" to="/app/projects" /></div><div className="col-6 col-md-3"><Kpi label="Delayed tasks" value={delayed.length} icon="exclamation-triangle" tone="red" to="/app/progress" /></div><div className="col-6 col-md-3"><Kpi label="Present today" value={db.attendance.filter((a: any) => a.date === dayStr(0) && mine.includes(a.projectId)).length} icon="person-check" to="/app/manpower" /></div></div>
    <div className="row g-3"><div className="col-lg-6"><PendingList role="pm" /></div><div className="col-lg-6"><Card title="My projects – progress (weighted)">{mine.map((p: string) => { const pr = projectProgress(db, p); return <div key={p} className="mb-3"><div className="d-flex justify-content-between small"><b>{p} {projName(db, p).slice(0, 36)}</b><span>{(pr.actual * 100).toFixed(1)}% vs plan {(pr.planned * 100).toFixed(1)}%</span></div><Prog v={pr.actual} /></div> })}</Card></div>
      <div className="col-12"><Card title="Delayed tasks" body={false}><DataTable pageSize={5} rows={delayed} cols={[{ key: 'id', label: 'Task' }, { key: 'name', label: 'Activity' }, { key: 'p', label: 'Progress', render: (t: any) => (taskPct(t) * 100).toFixed(0) + '%', sort: (t: any) => taskPct(t) }, { key: 'end', label: 'Planned end', render: (t: any) => fmtDate(t.end) }, { key: 's', label: 'Status', render: (t: any) => <Badge s={t.status} /> }]} /></Card></div></div>
    <CostOverview C={C} pids={mine} /></>
}
function SupDash() {
  const db = useDB(); const me = getActor().empId; const team = db.employees.filter((e: any) => e.supervisorId === me); const today = db.attendance.filter((a: any) => a.date === dayStr(0) && team.some((e: any) => e.id === a.empId))
  return <><PageHeader title="Supervisor Dashboard" sub={<Refreshed />} /><Quick items={[['Record attendance', 'person-check', '/app/manpower'], ['Daily progress', 'bar-chart-steps', '/app/progress'], ['Material indent', 'boxes', '/app/materials'], ['Approvals', 'check2-square', '/app/approvals']]} />
    <div className="row g-3 mb-3"><div className="col-6 col-md-3"><Kpi label="My team" value={team.length} icon="people" to="/app/manpower" /></div><div className="col-6 col-md-3"><Kpi label="Checked in today" value={today.length} icon="person-check" to="/app/manpower" /></div><div className="col-6 col-md-3"><Kpi label="Missing check-out" value={db.attendance.filter((a: any) => attFlags(db, a).includes('Missing check-out') && team.some((e: any) => e.id === a.empId)).length} tone="red" icon="exclamation-circle" to="/app/manpower" /></div><div className="col-6 col-md-3"><Kpi label="Drafts / returned" value={db.progress.filter((p: any) => ['Draft', 'Returned'].includes(p.status) && p.by === me).length} icon="pencil-square" to="/app/progress" /></div></div>
    <div className="row g-3"><div className="col-lg-6"><PendingList role="supervisor" /></div><div className="col-lg-6"><Card title="Team on site today">{team.slice(0, 8).map((e: any) => { const a = today.find((x: any) => x.empId === e.id); return <div key={e.id} className="d-flex justify-content-between small border-bottom py-1"><span>{e.name} <span className="text-muted">{e.designation}</span></span>{a ? <Badge s={a.out ? 'Completed' : 'Checked In'} label={a.out ? 'Out ' + fmtTime(a.out) : 'In ' + fmtTime(a.in)} /> : <Badge s="Rejected" label="Not in" />}</div> })}</Card></div></div></>
}
function StoreDash() {
  const db = useDB(); const low = db.materials.filter(isLow)
  return <><PageHeader title="Storekeeper Dashboard" sub={<Refreshed />} /><Quick items={[['Receive material', 'box-arrow-in-down', '/app/materials'], ['Issue / consume', 'box-arrow-up', '/app/materials'], ['Stock count', 'clipboard-check', '/app/materials'], ['Transfers', 'arrow-left-right', '/app/materials']]} />
    <div className="row g-3 mb-3"><div className="col-6 col-md-3"><Kpi label="Low-stock alerts" value={low.length} tone="red" icon="exclamation-triangle" to="/app/materials" /></div><div className="col-6 col-md-3"><Kpi label="Open purchase orders" value={db.pos.filter((p: any) => p.received < p.qty).length} icon="receipt" to="/app/materials" sub="SAP-synchronized" /></div><div className="col-6 col-md-3"><Kpi label="In-transit transfers" value={db.transfers.filter((t: any) => t.status === 'In Transit').length} icon="truck" to="/app/materials" /></div><div className="col-6 col-md-3"><Kpi label="Pending stock reviews" value={db.stockCounts.filter((c: any) => c.status === 'Pending Approval').length} icon="clipboard-data" to="/app/materials" /></div></div>
    <Card title="Low stock" body={false}><DataTable pageSize={6} rows={low} cols={[{ key: 'code', label: 'Code' }, { key: 'name', label: 'Material' }, { key: 'store', label: 'Store', render: (m: any) => siteName(db, m.store) }, { key: 'a', label: 'Available', render: (m: any) => `${num(avail(m), 1)} ${m.unit}`, sort: (m: any) => avail(m) }, { key: 'reorder', label: 'Reorder' }]} /></Card></>
}
function DriverDash() {
  const db = useDB(); const me = getActor().empId; const v = db.vehicles.find((x: any) => x.driverId === me); const trip = db.trips.find((t: any) => t.driverId === me && t.status === 'In Progress')
  return <><PageHeader title="Driver Dashboard" sub={<Refreshed />} />
    <div className="row g-3 mb-3"><div className="col-md-4"><Kpi label="My vehicle" value={v?.reg || '—'} sub={v ? `${v.make} ${v.model}` : 'None assigned'} icon="truck" to="/app/transport" /></div><div className="col-md-4"><Kpi label="Active journey" value={trip ? trip.ref : 'None'} sub={trip && `${trip.origin} → ${trip.dest}`} icon="signpost-split" to="/app/transport" /></div><div className="col-md-4"><Kpi label="Next service" value={v ? fmtDate(v.nextService) : '—'} icon="tools" to="/app/transport" /></div></div>
    <Card title="Tip">Use the mobile app (<Link to="/mobile">open</Link>) for journeys, odometer, fuel and photos. Location is captured from your phone during an active journey only.</Card></>
}
function FinDash() {
  const db = useDB(); const k = pettyKpis(db); const bad = db.integrations.filter((i: any) => i.module === 'Petty Cash' && i.status !== 'Successful')
  return <><PageHeader title="Finance Dashboard" sub={<Refreshed />} />
    <div className="row g-3 mb-3"><div className="col-6 col-md-3"><Kpi label="Pending advance approvals" value={k.pending} icon="hourglass" to="/app/petty" tone="orange" /></div><div className="col-6 col-md-3"><Kpi label="Ready for disbursement" value={db.advances.filter((a: any) => a.status === 'Approved').length} icon="cash-coin" to="/app/petty" /></div><div className="col-6 col-md-3"><Kpi label="Outstanding advances" value={money(k.outstanding)} icon="wallet2" to="/app/petty" tone="red" /></div><div className="col-6 col-md-3"><Kpi label="Expense claims to review" value={db.expenses.filter((e: any) => e.status === 'Pending Approval').length} icon="receipt" to="/app/petty" /></div></div>
    <div className="row g-3"><div className="col-lg-6"><PendingList role="finance" /></div><div className="col-lg-6"><Card title="SAP FI posting exceptions" right={<Sim />}>{bad.map((i: any) => <div key={i.id} className="d-flex justify-content-between small border-bottom py-2"><span><b>{i.ref}</b><br /><span className="text-muted">{i.error || 'Waiting to post'}</span></span><Badge s={i.status} /></div>)}{!bad.length && <div className="text-muted small">None</div>}<Link to="/app/integration" className="small">Open integration monitor</Link></Card></div></div></>
}
function EmpDash() {
  const db = useDB(); const me = getActor().empId; const a = db.attendance.filter((x: any) => x.empId === me).slice(0, 5); const adv = db.advances.filter((x: any) => x.empId === me)
  return <><PageHeader title="My Dashboard" sub={<Refreshed />} /><Quick items={[['Check in / out', 'geo-alt', '/mobile'], ['Request advance', 'wallet2', '/app/petty'], ['My attendance', 'calendar-check', '/app/manpower'], ['Leave', 'umbrella', '/app/manpower']]} />
    <div className="row g-3"><div className="col-lg-6"><Card title="Recent attendance">{a.map((x: any) => <div key={x.ref} className="d-flex justify-content-between small border-bottom py-1"><span>{fmtDate(x.date)} · {fmtTime(x.in)}–{x.out ? fmtTime(x.out) : '?'}</span><Badge s={x.status} /></div>)}</Card></div>
      <div className="col-lg-6"><Card title="My advances">{adv.map((x: any) => <div key={x.ref} className="d-flex justify-content-between small border-bottom py-1"><span>{x.ref} · {money(x.amount)}</span><Badge s={x.status} /></div>)}{!adv.length && <div className="text-muted small">No advances</div>}</Card></div></div></>
}
