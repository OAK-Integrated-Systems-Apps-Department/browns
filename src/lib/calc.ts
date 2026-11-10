import { mat, veh, emp, advanceSummary } from './store'
import { sum } from './util'

const EST = ['Submitted', 'Pending Approval', 'Under Review', 'Verified']
const APPR = ['Approved', 'Disbursed', 'Settled']
export const bucket = (status: string): 'est' | 'appr' | 'conf' | null => status === 'Posted' ? 'conf' : APPR.includes(status) ? 'appr' : EST.includes(status) ? 'est' : null

export const taskPct = (t: any) => Math.min(1, t.cumulative / t.planned)
export const taskPlanned = (t: any) => { const a = Date.parse(t.start), b = Date.parse(t.end), n = Date.now(); return Math.max(0, Math.min(1, (n - a) / Math.max(1, b - a))) }
/** Weighted roll-up: task → WBS (task weights) → project (WBS weights). Never a simple sum/average of percentages. */
export function wbsProgress(s: any, wbsId: string) { const ts = s.tasks.filter((t: any) => t.wbsId === wbsId); const w = sum(ts, (t: any) => t.weight) || 1; return { actual: sum(ts, (t: any) => t.weight * taskPct(t)) / w, planned: sum(ts, (t: any) => t.weight * taskPlanned(t)) / w } }
export function projectProgress(s: any, pid: string) {
  const ws = s.wbs.filter((w: any) => w.projectId === pid); const tw = sum(ws, (w: any) => w.weight) || 1
  return { actual: sum(ws, (w: any) => w.weight * wbsProgress(s, w.id).actual) / tw, planned: sum(ws, (w: any) => w.weight * wbsProgress(s, w.id).planned) / tw }
}
export const overall = (s: any, pids?: string[]) => { const ps = s.projects.filter((p: any) => !pids || pids.includes(p.id)); const tw = sum(ps, (p: any) => p.budget) || 1; return { actual: sum(ps, (p: any) => p.budget * projectProgress(s, p.id).actual) / tw, planned: sum(ps, (p: any) => p.budget * projectProgress(s, p.id).planned) / tw } }

export const labourAmount = (s: any, a: any) => { const e = emp(s, a.empId); const r = e?.rate || 0; return a.hours * r + a.ot * r * s.settings.otMultiplier }
type Tri = { est: number; appr: number; conf: number }
const z = (): Tri => ({ est: 0, appr: 0, conf: 0 })
export type CostRow = { labour: Tri; transport: Tri; materials: Tri; petty: Tri; unvalued: number; dupExcluded: number }
export function costs(s: any, filter: { project?: string; site?: string; from?: string; to?: string } = {}): Record<string, CostRow> {
  const out: Record<string, CostRow> = {}
  s.projects.forEach((p: any) => { out[p.id] = { labour: z(), transport: z(), materials: z(), petty: z(), unvalued: 0, dupExcluded: 0 } })
  const ok = (d: string, site: string) => (!filter.site || filter.site === site) && (!filter.from || d >= filter.from) && (!filter.to || d <= filter.to)
  s.attendance.forEach((a: any) => { const b = bucket(a.status); if (!b || !ok(a.date, a.siteId) || !out[a.projectId]) return; out[a.projectId].labour[b] += labourAmount(s, a) })
  s.fuel.forEach((f: any) => {
    const b = bucket(f.status); const v = veh(s, f.vehicleId); if (!b || !v || !ok(f.date, v.siteId)) return
    const trip = f.tripRef && s.trips.find((t: any) => t.ref === f.tripRef)
    if (trip?.segments?.length) { const km = sum(trip.segments, (x: any) => x.km) || 1; trip.segments.forEach((x: any) => out[x.projectId] && (out[x.projectId].transport[b] += (f.cost * x.km) / km)) } // allocated across segments, never charged in full to several projects
    else if (out[v.projectId]) out[v.projectId].transport[b] += f.cost
  })
  s.tempVeh.forEach((t: any) => { const b = bucket(t.status); if (b && out[t.projectId] && ok(t.from, t.siteId)) out[t.projectId].transport[b] += t.est })
  const matMove = (r: any, qty: number, siteId: string, date: string, pid: string) => { const m = mat(s, r.code); const b = bucket(r.status); if (!b || !ok(date.slice(0, 10), siteId) || !out[pid]) return; if (m?.price == null) { out[pid].unvalued++; return } out[pid].materials[b] += qty * m.price }
  s.issues.filter((i: any) => i.type === 'Consumption' || i.type === 'Issue').forEach((i: any) => matMove(i, i.qty, i.siteId, i.date, i.projectId))
  // Petty cash: only approved/pending EXPENSES count (advance = cash movement). Fuel already recorded in Transport is excluded.
  s.expenses.forEach((e: any) => {
    const b = bucket(e.status); if (!b || !out[e.projectId] || !ok(e.date, e.siteId)) return
    if (e.fuelRef && s.fuel.some((f: any) => f.ref === e.fuelRef)) { out[e.projectId].dupExcluded += e.amount; return }
    out[e.projectId].petty[b] += e.amount
  })
  return out
}
export const triTotal = (c: CostRow, k: 'est' | 'appr' | 'conf') => c.labour[k] + c.transport[k] + c.materials[k] + c.petty[k]
export function pettyKpis(s: any) {
  const advs = s.advances; const issued = advs.filter((a: any) => ['Disbursed', 'Settled'].includes(a.status))
  const outstanding = s.advances.filter((a: any) => a.status === 'Disbursed').reduce((t: number, a: any) => t + Math.max(0, advanceSummary(s, a).balance), 0)
  return {
    requested: sum(advs, (a: any) => a.amount), pending: advs.filter((a: any) => a.status === 'Pending Approval').length, approved: sum(advs.filter((a: any) => a.status === 'Approved'), (a: any) => a.amount), disbursed: sum(issued, (a: any) => a.disb?.amount),
    expenses: sum(s.expenses.filter((e: any) => e.status === 'Approved'), (e: any) => e.amount), pendingClaims: s.expenses.filter((e: any) => ['Pending Approval', 'Returned'].includes(e.status)).length, settled: advs.filter((a: any) => a.status === 'Settled').length, outstanding,
  }
}
export const isLow = (m: any) => m.status === 'Active' && m.sap + m.delta < m.reorder
export const attFlags = (s: any, a: any) => { const f = [...(a.flags || [])]; if (!a.out && a.date < new Date().toISOString().slice(0, 10) && !f.includes('Missing check-out')) f.push('Missing check-out'); return f }
