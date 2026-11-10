import logoUrl from '../assets/browns-logo.png'
export const Logo = ({ size = 38 }: { size?: number }) => <img src={logoUrl} alt="Browns Group" className="brand-logo" style={{ width: size, height: size }} />
import { useMemo, useState, ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { fmtDT, stampedPhoto, fileToThumb } from '../lib/util'
import { toast, useDB } from '../lib/store'

export const PAL = ['#1565c0', '#2a9d8f', '#e9a23b', '#8e6bbf', '#d1344a', '#5c7a99', '#3f8f5b', '#c2185b']
const TONE: Record<string, string> = {
  Approved: 'ok', Posted: 'ok', Successful: 'ok', Active: 'ok', Completed: 'ok', Settled: 'ok', Accepted: 'ok', Live: 'ok', Verified: 'ok', Received: 'ok', Available: 'ok', Closed: 'ok', Disbursed: 'info', 'Checked In': 'info', Present: 'ok',
  'Pending Approval': 'warn', Pending: 'warn', Submitted: 'info', 'Under Review': 'info', Ongoing: 'info', 'In Progress': 'info', 'In Transit': 'info', Processing: 'info', Requested: 'warn', Delayed: 'warn', Maintenance: 'warn', Open: 'warn', 'Requires Reconciliation': 'warn', Stale: 'bad', 'Saved on Device': 'warn', 'Awaiting Upload': 'warn', Uploading: 'info', Dispatched: 'info', 'Not Started': 'mut', Draft: 'mut', Inactive: 'mut',
  Rejected: 'bad', Failed: 'bad', 'Sync Failed': 'bad', 'Out of Service': 'bad', Returned: 'warn', Critical: 'bad', High: 'bad', Medium: 'warn', Low: 'mut',
}
export const Badge = ({ s, label }: { s: string; label?: string }) => <span className={`bdg stat-${TONE[s] || 'mut'}`}>{label || (s === 'Posted' ? 'Posted (simulated)' : s)}</span>
export const Sim = ({ text = 'SIMULATED' }: { text?: string }) => <span className="sim">{text}</span>

export function Kpi({ label, value, sub, icon, to, tone, onClick }: { label: string; value: ReactNode; sub?: ReactNode; icon?: string; to?: string; tone?: string; onClick?: () => void }) {
  const nav = useNavigate()
  return <div className="kpi" onClick={() => (onClick ? onClick() : to && nav(to))} title={to ? 'Click to drill down' : undefined}>
    {icon && <i className={`bi bi-${icon} ic`} />}<div className="l">{label}</div><div className="v" style={tone ? { color: `var(--${tone})` } : undefined}>{value}</div>{sub && <div className="s">{sub}</div>}</div>
}
export const Card = ({ title, right, children, className = '', body = true }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; body?: boolean }) =>
  <div className={`card ${className}`}>{title && <div className="card-h"><span>{title}</span><span className="d-flex gap-2 align-items-center">{right}</span></div>}{body ? <div className="p-3">{children}</div> : children}</div>
export const PageHeader = ({ title, crumbs = [], actions, sub }: { title: string; crumbs?: string[]; actions?: ReactNode; sub?: ReactNode }) =>
  <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-2">
    <div><nav className="small text-muted mb-1"><Link to="/app" className="text-muted text-decoration-none">Home</Link>{crumbs.map(c => <span key={c}> / {c}</span>)}<span> / <b className="text-navy">{title}</b></span></nav>
      <h4 className="mb-0 text-navy fw-bold">{title}</h4>{sub && <div className="text-muted small">{sub}</div>}</div><div className="d-flex gap-2 flex-wrap">{actions}</div></div>
export const Refreshed = () => { const s = useDB(); return <span className="small text-muted"><i className="bi bi-clock-history" /> Last sync/refresh: {fmtDT(s.lastSync)} · <Sim text="DEMO DATA" /></span> }
export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return <ul className="nav nav-tabs mb-3 flex-nowrap overflow-auto">{tabs.map(t => <li className="nav-item" key={t}><button className={`nav-link text-nowrap ${active === t ? 'active' : ''}`} onClick={() => onChange(t)}>{t}</button></li>)}</ul>
}
export const Progress = ({ v, color }: { v: number; color?: string }) => <div className="prog"><div style={{ width: Math.min(100, Math.max(0, v * 100)) + '%', background: color }} /></div>

// ---------- table ----------
export type Col = { key: string; label: string; render?: (r: any) => ReactNode; sort?: (r: any) => any; align?: string; hide?: boolean }
export function DataTable({ cols, rows, filters = [], onRow, pageSize = 8, toolbar, empty = 'No records found', exportName, searchText }: { cols: Col[]; rows: any[]; filters?: { key: string; label: string; options?: string[]; get?: (r: any) => string }[]; onRow?: (r: any) => void; pageSize?: number; toolbar?: ReactNode; empty?: string; exportName?: string; searchText?: (r: any) => string }) {
  const [q, setQ] = useState(''); const [sort, setSort] = useState<{ k: string; d: number } | null>(null); const [pg, setPg] = useState(0); const [f, setF] = useState<Record<string, string>>({})
  const data = useMemo(() => {
    let r = rows.filter(x => filters.every(fl => !f[fl.key] || (fl.get ? fl.get(x) : x[fl.key]) === f[fl.key]))
    if (q) { const t = q.toLowerCase(); r = r.filter(x => (searchText ? searchText(x) : JSON.stringify(Object.values(x).filter(v => typeof v !== 'object' || v === null))).toLowerCase().includes(t) || cols.some(c => c.sort && String(c.sort(x)).toLowerCase().includes(t))) }
    if (sort) { const c = cols.find(c => c.key === sort.k)!; const g = (x: any) => (c.sort ? c.sort(x) : x[c.key]); r = [...r].sort((a, b) => (g(a) > g(b) ? 1 : g(a) < g(b) ? -1 : 0) * sort.d) }
    return r
  }, [rows, q, sort, f])
  const pages = Math.max(1, Math.ceil(data.length / pageSize)); const cur = Math.min(pg, pages - 1)
  const opts = (fl: any) => fl.options || [...new Set(rows.map(r => (fl.get ? fl.get(r) : r[fl.key])).filter(Boolean))].sort()
  return <div>
    <div className="d-flex flex-wrap gap-2 mb-2 align-items-center">
      <div className="input-group input-group-sm" style={{ maxWidth: 260 }}><span className="input-group-text bg-white"><i className="bi bi-search" /></span><input className="form-control" placeholder="Search…" value={q} onChange={e => { setQ(e.target.value); setPg(0) }} /></div>
      {filters.map(fl => <select key={fl.key} className="form-select form-select-sm" style={{ width: 'auto', maxWidth: 190 }} value={f[fl.key] || ''} onChange={e => { setF({ ...f, [fl.key]: e.target.value }); setPg(0) }}><option value="">{fl.label}: All</option>{opts(fl).map((o: string) => <option key={o}>{o}</option>)}</select>)}
      <div className="ms-auto d-flex gap-2 align-items-center">{toolbar}{exportName && <ExportBtn name={exportName} rows={data} cols={cols} />}</div>
    </div>
    <div className="table-responsive border rounded bg-white"><table className="table table-sm mb-0 align-middle"><thead><tr>{cols.filter(c => !c.hide).map(c => <th key={c.key} style={{ cursor: 'pointer', textAlign: c.align as any }} onClick={() => setSort(s => (s?.k === c.key ? { k: c.key, d: -s.d } : { k: c.key, d: 1 }))}>{c.label}{sort?.k === c.key && <i className={`bi bi-caret-${sort.d > 0 ? 'up' : 'down'}-fill ms-1`} />}</th>)}</tr></thead>
      <tbody>{data.slice(cur * pageSize, cur * pageSize + pageSize).map((r, i) => <tr key={i} className={onRow ? 'clk' : ''} onClick={() => onRow?.(r)}>{cols.filter(c => !c.hide).map(c => <td key={c.key} style={{ textAlign: c.align as any }}>{c.render ? c.render(r) : r[c.key] ?? '—'}</td>)}</tr>)}
        {!data.length && <tr><td colSpan={cols.length} className="text-center text-muted py-4">{empty}</td></tr>}</tbody></table></div>
    <div className="d-flex justify-content-between align-items-center mt-2 small text-muted"><span>{data.length} record(s)</span>
      <div className="btn-group btn-group-sm"><button className="btn btn-outline-secondary" disabled={cur === 0} onClick={() => setPg(cur - 1)}>‹</button><button className="btn btn-outline-secondary disabled">{cur + 1} / {pages}</button><button className="btn btn-outline-secondary" disabled={cur >= pages - 1} onClick={() => setPg(cur + 1)}>›</button></div></div>
  </div>
}
function ExportBtn({ name, rows, cols }: any) {
  return <button className="btn btn-sm btn-outline-secondary" onClick={() => { import('../lib/util').then(u => { u.downloadCSV(name, rows.map((r: any) => Object.fromEntries(cols.filter((c: any) => !c.hide).map((c: any) => [c.label, c.sort ? c.sort(r) : typeof r[c.key] === 'object' ? '' : r[c.key]])))); toast('Exported ' + name + '.csv', 'success') }) }}><i className="bi bi-download" /> CSV</button>
}

// ---------- drawer / forms ----------
export function Drawer({ title, onClose, children, footer, wide }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  return <div className="drawer-bg" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className={`drawer ${wide ? 'wide' : ''}`}><div className="hd"><h5 className="mb-0 text-navy">{title}</h5><button className="btn-close" onClick={onClose} /></div><div className="bd">{children}</div>{footer && <div className="ft">{footer}</div>}</div></div>
}
export function Modal({ title, onClose, children }: any) { return <div className="modal-bg" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="modal-c"><div className="d-flex justify-content-between mb-2"><h6 className="text-navy fw-bold mb-0">{title}</h6><button className="btn-close" onClick={onClose} /></div>{children}</div></div> }
export function ReasonModal({ title, label = 'Comment', required = true, onSubmit, onClose, cta = 'Confirm', danger }: any) {
  const [v, setV] = useState(''); const [err, setErr] = useState('')
  return <Modal title={title} onClose={onClose}><label className="form-label small fw-semibold">{label}{required && ' *'}</label><textarea className={`form-control ${err ? 'is-invalid' : ''}`} rows={3} value={v} onChange={e => setV(e.target.value)} autoFocus /><div className="invalid-feedback">{err}</div>
    <div className="text-end mt-3"><button className="btn btn-light me-2" onClick={onClose}>Cancel</button><button className={`btn btn-${danger ? 'danger' : 'primary'}`} onClick={() => { if (required && !v.trim()) return setErr('A comment is required'); onSubmit(v); onClose() }}>{cta}</button></div></Modal>
}
export type Field = { name: string; label: string; type?: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'photo' | 'datetime-local' | 'time' | 'tel' | 'email' | 'files'; options?: (string | { v: string; l: string })[]; required?: boolean; min?: number; max?: number; readOnly?: boolean; help?: string; show?: (v: any) => boolean; def?: any; col?: number; step?: string }
export function FormDrawer({ title, fields, initial = {}, onSubmit, onClose, cta = 'Save', extra, wide }: { title: string; fields: Field[]; initial?: any; onSubmit: (v: any) => string | void | boolean; onClose: () => void; cta?: string; extra?: (v: any) => ReactNode; wide?: boolean }) {
  const [v, setV] = useState<any>(() => { const o: any = {}; fields.forEach(f => { o[f.name] = initial[f.name] ?? f.def ?? (f.type === 'photo' ? '' : '') }); return o })
  const [err, setErr] = useState<Record<string, string>>({}); const [top, setTop] = useState('')
  const set = (n: string, x: any) => setV((p: any) => ({ ...p, [n]: x }))
  const submit = () => {
    const e: Record<string, string> = {}
    fields.forEach(f => { if (f.show && !f.show(v)) return; const x = v[f.name]
      if (f.required && (x === '' || x == null)) e[f.name] = `${f.label} is required`
      else if (f.type === 'number' && x !== '') { const n = +x; if (isNaN(n)) e[f.name] = 'Enter a valid number'; else if (f.min != null && n < f.min) e[f.name] = `Must be ≥ ${f.min}`; else if (f.max != null && n > f.max) e[f.name] = `Must be ≤ ${f.max}` } })
    setErr(e); if (Object.keys(e).length) { setTop('Please correct the highlighted fields.'); return }
    const r = onSubmit(v); if (typeof r === 'string' && r) { setTop(r); return } onClose()
  }
  const opt = (o: any) => (typeof o === 'string' ? { v: o, l: o } : o)
  return <Drawer title={title} onClose={onClose} wide={wide} footer={<><button className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>{cta}</button></>}>
    {top && <div className="alert alert-danger py-2 small">{top}</div>}
    <div className="row g-3">{fields.filter(f => !f.show || f.show(v)).map(f => <div key={f.name} className={`col-12 col-md-${f.col || (f.type === 'textarea' || f.type === 'photo' || f.type === 'files' ? 12 : 6)}`}>
      <label className="form-label small fw-semibold mb-1">{f.label}{f.required && <span className="text-danger"> *</span>}</label>
      {f.type === 'select' ? <select className={`form-select ${err[f.name] ? 'is-invalid' : ''}`} value={v[f.name]} disabled={f.readOnly} onChange={e => set(f.name, e.target.value)}><option value="">Select…</option>{(f.options || []).map(o => <option key={opt(o).v} value={opt(o).v}>{opt(o).l}</option>)}</select>
        : f.type === 'textarea' ? <textarea className={`form-control ${err[f.name] ? 'is-invalid' : ''}`} rows={3} value={v[f.name]} onChange={e => set(f.name, e.target.value)} />
          : f.type === 'photo' ? <PhotoInput value={v[f.name]} onChange={x => set(f.name, x)} label={f.label} /> : f.type === 'files' ? <FilesInput value={v[f.name]} onChange={x => set(f.name, x)} />
            : <input className={`form-control ${err[f.name] ? 'is-invalid' : ''}`} type={f.type || 'text'} step={f.step} value={v[f.name]} readOnly={f.readOnly} min={f.min} max={f.max} onChange={e => set(f.name, e.target.value)} />}
      {err[f.name] && <div className="invalid-feedback d-block">{err[f.name]}</div>}{f.help && <div className="form-text">{f.help}</div>}</div>)}</div>
    {extra && <div className="mt-3">{extra(v)}</div>}
  </Drawer>
}
export function PhotoInput({ value, onChange, label = 'Photo', stamp }: { value: string; onChange: (v: string) => void; label?: string; stamp?: { lat: number; lng: number }; mobile?: boolean }) {
  return <div className="d-flex gap-2 align-items-center flex-wrap">
    {value ? <img src={value === 'demo' ? stampedPhoto(label) : value} className="thumb" alt="" /> : <div className="thumb d-grid bg-light text-muted" style={{ placeItems: 'center' }}><i className="bi bi-camera" /></div>}
    <label className="btn btn-sm btn-outline-primary mb-0"><i className="bi bi-camera" /> Take / upload<input type="file" accept="image/*" capture="environment" hidden onChange={async e => { const f = e.target.files?.[0]; if (f) onChange(await fileToThumb(f)) }} /></label>
    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onChange(stampedPhoto(label, stamp?.lat, stamp?.lng))}>Use demo photo</button>
    {value && <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => onChange('')}>Remove</button>}</div>
}
export function FilesInput({ value, onChange }: { value: string[] | ''; onChange: (v: string[]) => void }) {
  const a = Array.isArray(value) ? value : []
  return <div><input type="file" multiple className="form-control form-control-sm" onChange={e => onChange([...a, ...Array.from(e.target.files || []).map(f => f.name)])} /><div className="mt-1 small text-muted">{a.length ? a.join(', ') : 'No documents attached'}</div></div>
}
export const Detail = ({ rows }: { rows: [string, ReactNode][] }) => <dl className="row mb-0 small">{rows.map(([k, v]) => <div className="col-sm-6 d-flex mb-2" key={k}><dt className="text-muted fw-normal" style={{ width: 130, flexShrink: 0 }}>{k}</dt><dd className="mb-0 fw-semibold">{v ?? '—'}</dd></div>)}</dl>
export function Timeline({ items }: { items: { at: string; title: string; sub?: string }[] }) { return <div className="tl">{items.map((h, i) => <div key={i}><div className="fw-semibold small">{h.title}</div><div className="text-muted" style={{ fontSize: '.75rem' }}>{fmtDT(h.at)}{h.sub ? ' · ' + h.sub : ''}</div></div>)}</div> }
export const Flow = ({ stages, cur, status }: { stages: string[]; cur: number; status: string }) => <div className="flow">{stages.map((s, i) => <span key={s} className={`st ${status === 'Approved' || i < cur ? 'done' : i === cur && status === 'Pending' ? 'cur' : ''}`}>{i + 1}. {s}</span>)}</div>

// ---------- charts ----------
export const ChartCard = ({ title, children, h = 260, right, onClick }: { title: string; children: ReactNode; h?: number; right?: ReactNode; onClick?: () => void }) =>
  <Card title={<span>{title}{onClick && <button className="btn btn-link btn-sm py-0" onClick={onClick}>View records <i className="bi bi-arrow-right" /></button>}</span>} right={right}><div style={{ height: h }}>{children}</div></Card>
const tick = { fontSize: 11, fill: '#6b7788' }
export function BarC({ data, keys, x = 'name', stacked, h, fmt, onClick, horizontal, colors }: any) {
  const nav = useNavigate()
  return <ResponsiveContainer><BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ left: horizontal ? 40 : 0, right: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" vertical={false} />
    {horizontal ? <><XAxis type="number" tick={tick} tickFormatter={fmt} /><YAxis type="category" dataKey={x} tick={tick} width={90} /></> : <><XAxis dataKey={x} tick={tick} /><YAxis tick={tick} tickFormatter={fmt} /></>}
    <Tooltip formatter={fmt ? (v: any) => fmt(v) : undefined} /><Legend wrapperStyle={{ fontSize: 11 }} />
    {keys.map((k: any, i: number) => <Bar key={k.k || k} dataKey={k.k || k} name={k.n || k.k || k} stackId={stacked ? 's' : undefined} fill={k.c || (colors || PAL)[i % 8]} radius={stacked ? 0 : [3, 3, 0, 0]} cursor={onClick ? 'pointer' : undefined} onClick={onClick ? (d: any) => nav(onClick(d)) : undefined} />)}</BarChart></ResponsiveContainer>
}
export function LineC({ data, keys, x = 'name', area, fmt, h }: any) {
  const C: any = area ? AreaChart : LineChart; const L: any = area ? Area : Line
  return <ResponsiveContainer><C data={data} margin={{ left: 0, right: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" vertical={false} /><XAxis dataKey={x} tick={tick} /><YAxis tick={tick} tickFormatter={fmt} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
    {keys.map((k: any, i: number) => <L key={k.k || k} type="monotone" dataKey={k.k || k} name={k.n || k.k || k} stroke={k.c || PAL[i]} fill={k.c || PAL[i]} fillOpacity={area ? 0.15 : 0} strokeWidth={2} dot={false} strokeDasharray={k.dash} />)}</C></ResponsiveContainer>
}
export function PieC({ data, onClick }: any) {
  const nav = useNavigate()
  return <ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="82%" paddingAngle={2} cursor={onClick ? 'pointer' : undefined} onClick={onClick ? (d: any) => nav(onClick(d)) : undefined}>{data.map((_: any, i: number) => <Cell key={i} fill={PAL[i % 8]} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer>
}
