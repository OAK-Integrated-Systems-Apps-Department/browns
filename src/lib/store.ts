import { useSyncExternalStore } from 'react'
import { makeSeed, MODULE_OF, COLL_OF } from './seed'
import { uid, corr, pad } from './util'
import { ROLES } from './roles'

const KEY = 'browns-fom-db-v3'
let state: any
const subs = new Set<() => void>()
function load() {
  try { const r = localStorage.getItem(KEY); if (r) { const s = JSON.parse(r); if (s.version === 3) { s.integrations.forEach((i: any) => i.status === 'Processing' && (i.status = 'Pending')); return s } } } catch { /* ignore */ }
  const s = makeSeed(); buildApprovals(s); return s
}
function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { toast('Browser storage is full – photos are kept as thumbnails only', 'warning') } }
function emit() { subs.forEach(f => f()) }
if (typeof window !== 'undefined') window.addEventListener('storage', e => { if (e.key === KEY && e.newValue) { state = JSON.parse(e.newValue); emit() } })
export const getDB = () => state
export const useDB = (): any => useSyncExternalStore(f => (subs.add(f), () => subs.delete(f)), () => state)
export function mutate(fn: (s: any) => void) { const n = structuredClone(state); fn(n); state = n; persist(); emit() }
export function resetDemo() { state = makeSeed(); buildApprovals(state); persist(); emit(); toast('Demo data has been reset to the seeded state', 'success') }

// ---------- toasts ----------
let toasts: any[] = []; const tsubs = new Set<() => void>()
export const useToasts = () => useSyncExternalStore(f => (tsubs.add(f), () => tsubs.delete(f)), () => toasts)
export function toast(msg: string, kind: 'success' | 'warning' | 'danger' | 'info' = 'info') {
  const t = { id: Math.random(), msg, kind }; toasts = [...toasts, t]; tsubs.forEach(f => f())
  setTimeout(() => { toasts = toasts.filter(x => x !== t); tsubs.forEach(f => f()) }, 4200)
}

// ---------- session ----------
export type Actor = { role: string; userId: string; name: string; empId: string }
let actor: Actor = { role: 'admin', userId: 'U-01', name: 'Nadeesha Perera', empId: 'EMP-0001' }
export const setActor = (a: Actor) => { actor = a }
export const getActor = () => actor
export const actorFor = (role: string): Actor => { const u = state.users.find((x: any) => x.id === (ROLES as any)[role].userId); return { role, userId: u.id, name: u.name, empId: u.empId } }

// ---------- lookups ----------
export const emp = (s: any, id: string) => s.employees.find((e: any) => e.id === id)
export const empName = (s: any, id: string) => emp(s, id)?.name || id || '—'
export const site = (s: any, id: string) => s.sites.find((x: any) => x.id === id)
export const siteName = (s: any, id: string) => site(s, id)?.name || id || '—'
export const proj = (s: any, id: string) => s.projects.find((x: any) => x.id === id)
export const projName = (s: any, id: string) => proj(s, id)?.name || id || '—'
export const mat = (s: any, code: string) => s.materials.find((m: any) => m.code === code)
export const veh = (s: any, id: string) => s.vehicles.find((v: any) => v.id === id)
export const taskOf = (s: any, id: string) => s.tasks.find((t: any) => t.id === id)
export const wbsName = (s: any, id: string) => { const w = s.wbs.find((x: any) => x.id === id); return w ? `${w.id} ${w.name}` : id || '—' }
export const avail = (m: any) => m.sap + m.delta

// ---------- audit / notify ----------
export function audit(s: any, action: string, module: string, ref: string, prev = '', next = '', decision = '', posting = '', user?: string) {
  s.audit.unshift({ id: 'AUD-' + (s.audit.length + 10), at: new Date().toISOString(), user: user || actor.name, action, module, ref, prev, next, decision, posting })
}
export function notify(s: any, type: string, roles: string[], title: string, body: string, link = '/app') {
  s.notifications.unshift({ id: 'N' + Date.now() + Math.random().toString(36).slice(2, 5), at: new Date().toISOString(), type, roles, title, body, read: false, link })
}
const SEQ: Record<string, [string, number]> = { attendance: ['ATT', 1100], leave: ['LVE', 50], progress: ['DPR', 320], indent: ['MIN', 120], receipt: ['GRN', 210], issue: ['ISS', 510], mreturn: ['RET', 75], stockcount: ['STK', 35], transfer: ['TRF', 20], trip: ['TRP', 110], fuel: ['FUL', 310], tempveh: ['TVR', 25], advance: ['ADV', 95], expense: ['EXP', 420], maint: ['MNT', 50], alloc: ['ALC', 100] }
export function nextRef(s: any, kind: string) { s.seq ||= {}; const [p, b] = SEQ[kind]; s.seq[kind] = (s.seq[kind] || b) + 1; return `${p}-2026-${pad(s.seq[kind])}` }

// ---------- approvals ----------
function ctx(s: any, kind: string, e: any) {
  const sid = e.siteId || e.from || e.segments?.[0]?.siteId || emp(s, e.empId || e.by || e.driverId)?.siteId || veh(s, e.vehicleId)?.siteId
  const pid = e.projectId || e.segments?.[0]?.projectId || site(s, sid)?.projectId
  const requester = empName(s, e.by || e.empId || e.driverId)
  let amount: number | null = null, qty = ''
  if (kind === 'advance' || kind === 'expense') amount = e.amount
  if (kind === 'fuel') amount = e.cost
  if (kind === 'tempveh') amount = e.est
  if (kind === 'attendance') qty = (e.hours ? e.hours.toFixed(1) : '—') + ' h'
  if (kind === 'progress') qty = `${e.daily} ${taskOf(s, e.taskId)?.unit || ''}`
  if (kind === 'indent') qty = e.items.length + ' item(s)'
  if (['receipt', 'issue', 'mreturn', 'transfer'].includes(kind)) qty = `${e.qty} ${mat(s, e.code)?.unit || ''}`
  if (kind === 'stockcount') qty = `${(e.physical - e.sap).toFixed(1)} var`
  if (kind === 'trip') qty = e.endOdo ? `${e.endOdo - e.startOdo} km` : 'in progress'
  if (kind === 'leave') qty = e.days + ' day(s)'
  return { sid, pid, requester, amount, qty }
}
function hist(s: any, a: any, action: string, comment = '', stage?: string) { a.history.push({ at: new Date().toISOString(), by: actor.name, role: (ROLES as any)[actor.role]?.short || actor.role, action, comment, stage: stage ?? a.stages[a.stage]?.name ?? '—' }) }
export function createApproval(s: any, kind: string, e: any) {
  const flow = s.settings.flows[kind]; const c = ctx(s, kind, e)
  const a = { ref: e.ref, kind, module: MODULE_OF[kind], requester: c.requester, projectId: c.pid, siteId: c.sid, date: new Date().toISOString(), amount: c.amount, qty: c.qty, stages: flow, stage: 0, status: 'Pending', assignee: (ROLES as any)[flow[0].role].short, remarks: '', history: [] as any[] }
  a.history.push({ at: a.date, by: c.requester, role: 'Requester', action: 'Submitted', comment: '', stage: 'Submission' })
  s.approvals.unshift(a); return a
}
export function entityOf(s: any, kind: string, ref: string) { return s[COLL_OF[kind]]?.find((x: any) => x.ref === ref) }
/** create & submit an entity: pushes into its collection and starts the approval workflow */
export function submitNew(s: any, kind: string, data: any, opts: { status?: string } = {}) {
  const e = { ref: nextRef(s, kind), status: opts.status || (kind === 'progress' ? 'Submitted' : 'Pending Approval'), createdAt: new Date().toISOString(), txId: data.txId || uid(), ...data }
  s[COLL_OF[kind]].unshift(e)
  if (e.status !== 'Draft') createApproval(s, kind, e)
  audit(s, 'Created & submitted', MODULE_OF[kind], e.ref, '', e.status)
  const flow = s.settings.flows[kind]
  notify(s, 'Pending approval', [flow[0].role], `New ${MODULE_OF[kind]} submission ${e.ref}`, `Awaiting ${flow[0].name}.`, '/app/approvals')
  return e
}
export function resubmit(kind: string, ref: string, patch: any) {
  mutate(s => {
    const e = entityOf(s, kind, ref); const a = s.approvals.find((x: any) => x.ref === ref)
    const prev = e.status; Object.assign(e, patch)
    if (kind === 'progress') { e.version = (e.version || 1) + 1; e.history.push({ v: e.version, at: new Date().toISOString(), by: actor.name, note: 'Corrected & resubmitted' }) }
    e.status = kind === 'progress' ? 'Submitted' : 'Pending Approval'
    if (a) { a.status = 'Pending'; a.stage = 0; a.assignee = (ROLES as any)[a.stages[0].role].short; hist(s, a, 'Resubmitted', 'Corrected by requester', 'Submission') } else createApproval(s, kind, e)
    audit(s, 'Resubmitted', MODULE_OF[kind], ref, prev, e.status)
  }); toast(`${ref} resubmitted for approval`, 'success')
}
export function canDecide(a: any, role: string) { const st = a.stages[a.stage]; return a.status === 'Pending' && st && st.role === role && !(ROLES as any)[role].readonly }
export function decide(ref: string, action: 'approve' | 'reject' | 'return' | 'review', comment = '') {
  let msg = '', kind: 'success' | 'warning' | 'danger' = 'success'
  mutate(s => {
    const a = s.approvals.find((x: any) => x.ref === ref); if (!a) return
    if (!canDecide(a, actor.role)) { msg = `Your role (${(ROLES as any)[actor.role].short}) is not authorised for "${a.stages[a.stage]?.name}"`; kind = 'danger'; return }
    const e = entityOf(s, a.kind, ref); const prev = e?.status; const st = a.stages[a.stage].name
    if ((action === 'reject' || action === 'return') && !comment.trim()) { msg = 'A comment is required to reject or return a record'; kind = 'warning'; return }
    if (action === 'review') { e.status = 'Under Review'; hist(s, a, 'Review started', comment); audit(s, 'Review started', a.module, ref, prev, 'Under Review'); msg = `${ref} is now Under Review`; return }
    if (action === 'approve') {
      hist(s, a, a.stage < a.stages.length - 1 ? 'Verified / Approved' : 'Approved', comment)
      if (a.stage < a.stages.length - 1) { a.stage++; a.assignee = (ROLES as any)[a.stages[a.stage].role].short; e.status = a.kind === 'progress' ? 'Verified' : 'Pending Approval'; msg = `${st} complete – routed to ${a.stages[a.stage].name}` }
      else { a.status = 'Approved'; e.status = 'Approved'; a.assignee = '—'; onApproved(s, a.kind, e); msg = `${ref} approved` }
      audit(s, 'Approval decision', a.module, ref, prev, e.status, 'Approved')
    } else {
      a.status = action === 'reject' ? 'Rejected' : 'Returned'; e.status = a.status; a.assignee = '—'; a.remarks = comment; e.remarks = comment
      hist(s, a, action === 'reject' ? 'Rejected' : 'Returned for correction', comment, st); audit(s, 'Approval decision', a.module, ref, prev, e.status, a.status)
      notify(s, a.status === 'Rejected' ? 'Pending approval' : 'Pending approval', ['supervisor', 'employee', 'pm', 'storekeeper', 'driver'], `${ref} ${a.status.toLowerCase()}`, comment, '/app/approvals')
      msg = `${ref} ${a.status.toLowerCase()}`; kind = action === 'reject' ? 'danger' : 'warning'
    }
  })
  if (msg) toast(msg, kind)
  return kind === 'success'
}
function ledger(s: any, e: any, code: string, siteId: string, type: string, qty: number) { s.stockLedger.unshift({ ref: e.ref, at: new Date().toISOString(), code, siteId, type, qty, by: actor.name }) }
function onApproved(s: any, kind: string, e: any) {
  if (kind === 'progress') { const t = taskOf(s, e.taskId); t.cumulative += e.daily; t.status = t.cumulative >= t.planned ? 'Completed' : t.status === 'Delayed' ? 'Delayed' : 'Ongoing' }
  if (kind === 'receipt') { const m = mat(s, e.code); m.delta += e.qty; const po = s.pos.find((p: any) => p.no === e.poNo); if (po) po.received += e.qty; ledger(s, e, e.code, e.siteId, 'Receipt', e.qty) }
  if (kind === 'issue') { const m = mat(s, e.code); m.delta -= e.qty; ledger(s, e, e.code, e.siteId, e.type, -e.qty) }
  if (kind === 'mreturn') { const m = mat(s, e.code); const q = e.type === 'Site to Store' ? e.qty : e.type === 'Supplier' ? -e.qty : 0; m.delta += q; ledger(s, e, e.code, e.siteId, 'Return – ' + e.type, q) }
  if (kind === 'stockcount') { const v = e.physical - e.sap; if (v !== 0) { mat(s, e.code).delta += v; ledger(s, e, e.code, e.siteId, 'Approved stock adjustment', v) } }
  if (kind === 'transfer') { e.status = 'Approved'; e.history.push(['Approved', new Date().toISOString()]) }
  if (kind === 'advance') notify(s, 'Pending approval', ['finance'], `${e.ref} approved – ready for disbursement`, 'Record actual disbursement.', '/app/petty')
  queueIntegration(s, kind, e)
}
const INT: Record<string, [string, string, string]> = { attendance: ['HRIS', 'HRIS', 'Attendance'], progress: ['SAP S/4HANA Cloud', 'SAP', 'Progress'], receipt: ['SAP S/4HANA Cloud', 'SAP', 'Materials'], issue: ['SAP S/4HANA Cloud', 'SAP', 'Materials'], mreturn: ['SAP S/4HANA Cloud', 'SAP', 'Materials'], stockcount: ['SAP S/4HANA Cloud', 'SAP', 'Materials'], trip: ['SAP S/4HANA Cloud', 'SAP', 'Transport'], fuel: ['SAP S/4HANA Cloud', 'SAP', 'Transport'], advance: ['SAP S/4HANA Cloud', 'SAP', 'Petty Cash'] }
export function queueIntegration(s: any, kind: string, e: any, label = '') {
  const m = INT[kind]; if (!m) return
  if (kind === 'stockcount' && e.physical === e.sap) return
  if (kind === 'advance' && !label) return
  if (s.integrations.some((i: any) => i.ref === e.ref && i.direction === 'Outbound' && i.label === label && i.status !== 'Failed')) { return }
  if (kind === 'attendance' && e.hours != null && e.status !== 'Approved') return
  const it = { id: 'INT-' + pad(s.integrations.length + 1), name: m[0], system: m[1], module: m[2], direction: 'Outbound', ref: e.ref, kind, label, corr: corr(), at: new Date().toISOString(), status: 'Pending', docRef: '', error: '', simulated: true }
  s.integrations.unshift(it)
  if (s.device.autoPost !== false) setTimeout(() => postIntegration(it.id), 1600)
}
export function postIntegration(id: string) {
  const cur = state.integrations.find((i: any) => i.id === id); if (!cur) return
  if (cur.status === 'Requires Reconciliation') { toast('Uncertain posting – run "Verify in SAP/HRIS" first. Retry is blocked to avoid a duplicate posting.', 'warning'); return }
  if (cur.status === 'Successful' || cur.status === 'Processing') return
  mutate(s => { s.integrations.find((i: any) => i.id === id).status = 'Processing' })
  setTimeout(() => {
    let ok = true, msg = ''
    mutate(s => {
      const it = s.integrations.find((i: any) => i.id === id); const e = it.kind ? entityOf(s, it.kind, it.ref) : null
      if (s.device.failNext) { s.device.failNext = false; it.status = 'Requires Reconciliation'; it.error = 'Gateway timeout after request was sent – outcome uncertain. Verify before retry (simulated).'; ok = false; msg = `${it.ref}: uncertain outcome → Requires Reconciliation`; audit(s, 'Posting uncertain', it.module, it.ref, 'Pending', 'Requires Reconciliation', '', '', 'System (simulated)'); notify(s, 'SAP posting failure', ['admin', 'finance'], `Posting needs reconciliation: ${it.ref}`, it.error, '/app/integration'); return }
      const pfx = it.system === 'HRIS' ? 'HRIS-ACK-' : { Progress: 'SAP-PS-', Materials: 'SAP-MM-', Transport: 'SAP-CO-', 'Petty Cash': 'SAP-FI-' }[it.module as string] || 'SAP-'
      it.docRef = pfx + (it.system === 'HRIS' ? pad(90000 + Math.floor(Math.random() * 9999), 6) : (it.module === 'Petty Cash' ? 1800000000 : it.module === 'Materials' ? 5000000000 : it.module === 'Progress' ? 7700000000 : 4900000000) + Math.floor(Math.random() * 99999 + 20000))
      it.status = 'Successful'; it.error = ''; it.at = new Date().toISOString()
      if (e) { e.status = it.label === 'settlement' ? 'Settled' : e.kind === 'advance' ? e.status : 'Posted'; if (it.kind === 'advance') { (it.label === 'settlement' ? (e.settle ||= {}) : (e.disb ||= {})).postRef = it.docRef } else e.postRef = it.docRef }
      if (it.kind === 'receipt' || it.kind === 'issue' || it.kind === 'mreturn' || it.kind === 'stockcount') { const q = it.kind === 'receipt' ? e.qty : it.kind === 'issue' ? -e.qty : it.kind === 'mreturn' ? (e.type === 'Site to Store' ? e.qty : e.type === 'Supplier' ? -e.qty : 0) : e.physical - e.sap; const m = mat(s, e.code); if (m) { m.sap += q; m.delta -= q } }
      audit(s, 'Posted (simulated)', it.module, it.ref, 'Pending', 'Successful', '', it.docRef, 'System (simulated)'); msg = `${it.ref} → ${it.docRef} (simulated ${it.system} acknowledgement)`
    })
    if (ok) toast(msg, 'success'); else toast(msg, 'warning')
  }, 900)
}
export function reconcileIntegration(id: string) {
  toast('Checking whether the original transaction was processed… (simulated)', 'info')
  setTimeout(() => mutate(s => {
    const it = s.integrations.find((i: any) => i.id === id); const e = it.kind ? entityOf(s, it.kind, it.ref) : null
    if (e && Math.random() < 0.5 && e.status === 'Approved') { it.status = 'Failed'; it.error = 'Reconciliation: no document found in target system – safe to retry.' ; toast(`${it.ref}: not found in target – retry now allowed`, 'warning') }
    else { it.status = 'Failed'; it.error = 'Reconciliation: no document found in target system – safe to retry.'; toast(`${it.ref}: original transaction NOT found in target – retry now allowed`, 'warning') }
    audit(s, 'Reconciliation check', it.module, it.ref, 'Requires Reconciliation', it.status)
  }), 900)
}
export function markReconciled(id: string) {
  mutate(s => { const it = s.integrations.find((i: any) => i.id === id); it.status = 'Successful'; it.docRef = (it.system === 'HRIS' ? 'HRIS-ACK-' : 'SAP-MM-') + (5000119000 + Math.floor(Math.random() * 999)); it.error = ''; const e = it.kind ? entityOf(s, it.kind, it.ref) : null; if (e) { e.status = 'Posted'; e.postRef = it.docRef }; audit(s, 'Reconciled – found in target', it.module, it.ref, 'Requires Reconciliation', 'Successful', '', it.docRef) })
  toast('Original document found in target system – marked Successful without re-posting', 'success')
}

// ---------- seeded approvals ----------
export function buildApprovals(s: any) {
  const pending = ['Pending Approval', 'Submitted', 'Under Review', 'Verified']
  Object.keys(s.settings.flows).forEach(kind => (s[COLL_OF[kind]] || []).forEach((e: any) => {
    if (['Draft', 'Checked In', 'In Progress'].includes(e.status)) return
    const flow = s.settings.flows[kind], c = ctx(s, kind, e), at = e.createdAt || new Date(Date.now() - 864e5).toISOString()
    const a: any = { ref: e.ref, kind, module: MODULE_OF[kind], requester: c.requester, projectId: c.pid, siteId: c.sid, date: at, amount: c.amount, qty: c.qty, stages: flow, stage: 0, status: 'Pending', assignee: (ROLES as any)[flow[0].role].short, remarks: e.remarks || '', history: [{ at, by: c.requester, role: 'Requester', action: 'Submitted', comment: '', stage: 'Submission' }] }
    const done = ['Approved', 'Posted', 'Disbursed', 'Settled', 'In Transit', 'Dispatched', 'Received', 'Completed'].includes(e.status)
    if (done) { flow.forEach((f: any, i: number) => a.history.push({ at: new Date(Date.parse(at) + (i + 1) * 36e5).toISOString(), by: i === 0 ? 'Supervisor / Verifier' : 'Approver', role: (ROLES as any)[f.role].short, action: 'Approved', comment: '', stage: f.name })); a.status = 'Approved'; a.stage = flow.length - 1; a.assignee = '—' }
    else if (e.status === 'Rejected' || e.status === 'Returned') { a.status = e.status; a.assignee = '—'; a.history.push({ at: new Date(Date.parse(at) + 36e5).toISOString(), by: 'Approver', role: (ROLES as any)[flow[0].role].short, action: e.status === 'Rejected' ? 'Rejected' : 'Returned for correction', comment: e.remarks || 'See remarks', stage: flow[0].name }) }
    else if (pending.includes(e.status)) { if (e.status === 'Verified') { a.stage = 1; a.assignee = (ROLES as any)[flow[1].role].short; a.history.push({ at, by: 'Superior', role: 'Project Manager', action: 'Verified', comment: '', stage: flow[0].name }) } if (kind === 'advance' && e.ref === 'ADV-2026-0089') { /* returned handled */ } }
    s.approvals.push(a)
  }))
  s.approvals.sort((x: any, y: any) => y.date.localeCompare(x.date))
}

// ---------- domain actions ----------
export function disburse(ref: string, d: any) {
  mutate(s => { const e = s.advances.find((x: any) => x.ref === ref); e.disb = { ...d, by: actor.empId, amount: +d.amount }; e.status = 'Disbursed'; audit(s, 'Advance disbursed', 'Petty Cash', ref, 'Approved', 'Disbursed', '', d.reference); notify(s, 'Outstanding petty cash advance', ['employee', 'supervisor'], `Advance ${ref} disbursed`, `LKR ${d.amount} issued. Submit expenses with receipts.`, '/app/petty'); queueIntegration(s, 'advance', e, 'disbursement') })
  toast(`Disbursement recorded for ${ref} (cash movement – not a project expense)`, 'success')
}
export const advanceSummary = (s: any, a: any) => {
  const exps = s.expenses.filter((x: any) => x.advRef === a.ref)
  const issued = a.disb?.amount || 0, recorded = exps.reduce((t: number, x: any) => t + x.amount, 0)
  const approved = exps.filter((x: any) => x.status === 'Approved').reduce((t: number, x: any) => t + x.amount, 0)
  const returned = a.settle?.returned || 0
  const open = exps.filter((x: any) => !['Approved', 'Rejected'].includes(x.status)).length
  return { issued, recorded, approved, returned, excess: Math.max(0, approved - issued), balance: issued - approved - returned, open, count: exps.length }
}
export function settleAdvance(ref: string, returned: number) {
  let err = ''
  mutate(s => {
    const a = s.advances.find((x: any) => x.ref === ref); const sm = advanceSummary(s, a)
    if (sm.open > 0) { err = `${sm.open} expense claim(s) are still pending/returned – review them before settlement`; return }
    const bal = sm.issued - sm.approved - returned
    if (bal > 0) { err = `LKR ${bal.toLocaleString()} of unspent cash is not accounted for – record the cash returned`; return }
    if (bal < 0 && sm.approved <= sm.issued) { err = 'Returned cash exceeds unspent balance'; return }
    a.settle = { returned, excess: Math.max(0, sm.approved - sm.issued), status: 'Settled' }; a.status = 'Settled'
    audit(s, 'Advance settled', 'Petty Cash', ref, 'Disbursed', 'Settled'); queueIntegration(s, 'advance', a, 'settlement')
  })
  if (err) toast(err, 'danger'); else toast(`${ref} settled – SAP FI posting queued (simulated)`, 'success')
  return !err
}
export function advanceTransition(kind: 'transfer', ref: string, to: string) {
  mutate(s => {
    const t = s.transfers.find((x: any) => x.ref === ref); const m = mat(s, t.code); const prev = t.status
    if (to === 'Dispatched') { if (avail(m) < t.qty) { toast('Insufficient stock to dispatch', 'danger'); return } m.delta -= t.qty; ledger(s, t, t.code, t.from, 'Transfer out', -t.qty); t.status = 'In Transit'; t.history.push(['Dispatched', new Date().toISOString()], ['In Transit', new Date().toISOString()]) }
    else if (to === 'Received') { s.stockLedger.unshift({ ref: t.ref, at: new Date().toISOString(), code: t.code, siteId: t.to, type: 'Transfer in', qty: t.qty, by: actor.name }); t.status = 'Received'; t.history.push(['Receipt Confirmed', new Date().toISOString()]) }
    else if (to === 'Completed') { t.status = 'Completed'; t.history.push(['Completed', new Date().toISOString()]) }
    audit(s, 'Transfer ' + to, 'Materials', ref, prev, t.status)
  })
  toast(`${ref} → ${to}`, 'success')
}

// ---------- offline / mobile sync ----------
export function setOnline(on: boolean) { mutate(s => { s.device.online = on }); toast(on ? 'Device is ONLINE – synchronization starts automatically' : 'Device is OFFLINE – records are saved on the device', on ? 'success' : 'warning'); if (on) setTimeout(syncNow, 700) }
export function txStatus(s: any, t: any) {
  if (['Saved on Device', 'Awaiting Upload', 'Uploading', 'Sync Failed'].includes(t.status)) return t.status
  const k = t.type === 'checkin' || t.type === 'checkout' ? 'attendance' : t.type === 'tripstart' || t.type === 'tripend' ? 'trip' : t.type; const e = t.entityRef && entityOf(s, k, t.entityRef)
  if (!e) return t.status
  if (e.status === 'Returned') return 'Returned'
  if (['Approved', 'Posted', 'Disbursed', 'Settled'].includes(e.status)) return 'Accepted'
  return 'Submitted'
}
export function captureTx(type: string, label: string, payload: any) {
  const tx: any = { txId: uid(), type, label, payload, capturedAt: new Date().toISOString(), status: 'Saved on Device', error: '', role: actor.role, entityRef: '', device: 'DEV-' + actor.userId }
  let on = state.device.online
  mutate(s => { s.syncQueue.unshift(tx); if (on) { tx.status = 'Awaiting Upload'; s.syncQueue[0] = tx } })
  if (on) setTimeout(() => processTx(tx.txId), 500)
  else toast('Saved on device – provisional, awaiting connectivity', 'warning')
  return tx
}
function processTx(txId: string) {
  mutate(s => { const t = s.syncQueue.find((x: any) => x.txId === txId); if (t) { t.status = 'Uploading'; t.error = '' } })
  setTimeout(() => {
    let msg = '', kind: 'success' | 'danger' = 'success'
    mutate(s => {
      const t = s.syncQueue.find((x: any) => x.txId === txId); if (!t) return
      if (s.syncQueue.some((x: any) => x !== t && x.txId === txId && x.entityRef) || [...Object.values(COLL_OF)].some(c => (s[c as string] || []).some((x: any) => x.txId === txId))) { t.status = 'Submitted'; t.error = ''; msg = `Duplicate prevented – transaction ${txId} was already received by the server`; return }
      const err = applyTx(s, t)
      if (err) { t.status = 'Sync Failed'; t.error = err; kind = 'danger'; msg = 'Sync failed: ' + err; notify(s, 'Failed synchronization', ['admin'], `Sync failed: ${t.label}`, err, '/app/sync') }
      else { t.status = 'Submitted'; msg = `${t.label} uploaded – ${t.entityRef} awaiting approval` }
    })
    if (msg) toast(msg, kind)
  }, 900)
}
export function syncNow() {
  const q = state.syncQueue.filter((t: any) => ['Saved on Device', 'Awaiting Upload', 'Sync Failed'].includes(t.status) && !(t.status === 'Sync Failed' && t.txId === 'TX-DEMO-CF1'))
  if (!state.device.online) { toast('Cannot synchronize while offline', 'warning'); return }
  if (!q.length) { toast('Nothing to synchronize', 'info'); return }
  q.slice().reverse().forEach((t: any, i: number) => setTimeout(() => processTx(t.txId), i * 1100))
  mutate(s => { s.lastSync = new Date().toISOString() })
}
export function replayDuplicate(txId: string) { toast('Replaying the same transaction ID to the server…', 'info'); setTimeout(() => processTx(txId), 300) }
function applyTx(s: any, t: any): string {
  const p = t.payload; const at = t.capturedAt; const delayed = Date.now() - Date.parse(at) > 60000
  const flags = delayed ? ['Delayed submission (offline)'] : []
  if (t.type === 'checkin') {
    const emps = p.empIds || [p.empId]
    const gangRef = emps.length > 1 ? 'GNG-' + pad(s.seq?.gang || 40) : undefined
    for (const id of emps) {
      const ex = s.attendance.find((a: any) => a.empId === id && a.date === p.date)
      if (ex && ['Approved', 'Posted'].includes(ex.status)) return `Conflict: an approved attendance for ${id} already exists for ${p.date} (${ex.ref}). Nothing was overwritten.`
      const f = [...flags]; if (ex) f.push('Duplicate attendance suspected')
      if (s.attendance.some((a: any) => a.empId === id && a.date === p.date && a.siteId !== p.siteId)) f.push('Overlapping site assignment')
      const e = { ref: nextRef(s, 'attendance'), empId: id, empName: empName(s, id), category: emp(s, id)?.category, projectId: p.projectId, siteId: p.siteId, date: p.date, in: at, out: null, inLat: p.lat, inLng: p.lng, acc: p.acc, inPhoto: p.photo, outPhoto: '', method: emps.length > 1 ? 'Gang' : 'Individual', gangRef, by: p.by, status: 'Checked In', hours: 0, ot: 0, flags: f, txId: t.txId + (emps.length > 1 ? '-' + id : ''), createdAt: at }
      s.attendance.unshift(e); t.entityRef = e.ref; audit(s, 'Check-in captured', 'Manpower', e.ref, '', 'Checked In', '', '', t.role)
    }; if (emps.length > 1) s.seq.gang = (s.seq.gang || 40) + 1; return ''
  }
  if (t.type === 'checkout') {
    const emps = p.empIds || [p.empId]
    for (const id of emps) {
      const e = s.attendance.find((a: any) => a.empId === id && !a.out && a.status === 'Checked In')
      if (!e) return `No open check-in found for ${id} – check-out cannot be applied.`
      e.out = at; e.outPhoto = p.photo; e.outLat = p.lat; e.outLng = p.lng
      const hrs = Math.max(0, (Date.parse(at) - Date.parse(e.in)) / 36e5 - s.settings.breakHours)
      e.hours = Math.min(hrs, s.settings.regularHours); e.ot = Math.max(0, hrs - s.settings.regularHours); e.status = 'Pending Approval'; e.flags = [...new Set([...e.flags, ...flags])]
      createApproval(s, 'attendance', e); t.entityRef = e.ref; notify(s, 'Pending approval', ['pm'], `Attendance ${e.ref} submitted`, `${e.empName} – ${e.hours.toFixed(1)}h`, '/app/approvals')
    } return ''
  }
  if (t.type === 'tripstart') {
    const v = veh(s, p.vehicleId); if (s.trips.some((x: any) => x.vehicleId === p.vehicleId && x.status === 'In Progress')) return `Vehicle ${v?.reg} already has an active journey.`
    const e = { ref: nextRef(s, 'trip'), vehicleId: p.vehicleId, driverId: p.driverId, origin: p.origin, dest: p.dest, purpose: p.purpose, startOdo: p.startOdo, endOdo: null, start: at, end: null, status: 'In Progress', segments: [], startPhoto: p.photo, txId: t.txId, createdAt: at }
    s.trips.unshift(e); t.entityRef = e.ref; s.tracking[p.vehicleId] = { lat: p.lat, lng: p.lng, speed: 0, movedAt: new Date().toISOString() }; v.status = 'Active'; return ''
  }
  if (t.type === 'tripend') {
    const e = s.trips.find((x: any) => x.ref === p.tripRef); if (!e || e.status !== 'In Progress') return 'Journey is not active on the server.'
    if (p.endOdo <= e.startOdo) return 'End odometer must be greater than start odometer.'
    e.endOdo = p.endOdo; e.end = at; e.endPhoto = p.photo; e.segments = p.segments; e.status = 'Pending Approval'; veh(s, e.vehicleId).odo = p.endOdo
    createApproval(s, 'trip', e); t.entityRef = e.ref; notify(s, 'Pending approval', ['pm'], `Trip ${e.ref} submitted`, `${p.endOdo - e.startOdo} km`, '/app/approvals'); return ''
  }
  const map: any = { stockcount: 'stockcount', transfer: 'transfer', progress: 'progress', issue: 'issue', receipt: 'receipt', trip: 'trip', fuel: 'fuel', expense: 'expense', indent: 'indent', advance: 'advance', mreturn: 'mreturn', leave: 'leave' }
  const kind = map[t.type]; if (!kind) return 'Unknown transaction type'
  if (kind === 'expense') { if (!p.photo) return 'Receipt photograph is mandatory'; const a = s.advances.find((x: any) => x.ref === p.advRef); if (!a || a.status !== 'Disbursed') return `Advance ${p.advRef} is not in a disbursed state (balance conflict).` }
  if (kind === 'issue') { const m = mat(s, p.code); if (m && avail(m) < p.qty) return `Stock shortage: only ${avail(m)} ${m.unit} available for ${m.name} – entry sent to exception queue.` }
  const e = submitNew(s, kind, { ...p, createdAt: at, txId: t.txId, flags: kind === 'progress' ? undefined : flags, history: kind === 'progress' ? [{ v: 1, at, by: actor.name, note: 'Created (device event time retained)' }] : undefined })
  t.entityRef = e.ref; return ''
}

state = load()
