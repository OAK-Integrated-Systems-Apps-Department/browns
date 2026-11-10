import { useState } from 'react'
import { useDB } from '../lib/store'
import { REPORTS } from '../lib/reports'
import { Card, DataTable, PageHeader, Refreshed, BarC, ChartCard } from '../components/ui'
import { useRole } from '../App'

export function ReportView({ module }: { module?: string }) {
  const db = useDB(); const list = REPORTS.filter(r => !module || r.module === module); const [id, setId] = useState(list[0].id)
  const rep = list.find(r => r.id === id) || list[0]; const rows = rep.rows(db); const cols = rows[0] ? Object.keys(rows[0]) : []
  const numCols = cols.filter(c => rows.every((r: any) => r[c] === '' || typeof r[c] === 'number')).slice(0, 3); const labelCol = cols[0]
  return <div>
    <div className="d-flex gap-2 mb-3 flex-wrap">{list.map(r => <button key={r.id} className={`btn btn-sm btn-${r.id === rep.id ? 'primary' : 'outline-secondary'}`} onClick={() => setId(r.id)}>{r.title}</button>)}</div>
    <Card title={rep.title} right={<span className="small text-muted">{rows.length} rows · generated {new Date().toLocaleTimeString('en-GB')}</span>}>
      {numCols.length > 0 && rows.length > 1 && rows.length <= 14 && <div style={{ height: 220 }} className="mb-3"><BarC data={rows.map((r: any) => ({ name: String(r[labelCol]).slice(0, 14), ...Object.fromEntries(numCols.map(c => [c, r[c] === '' ? 0 : r[c]])) }))} keys={numCols} /></div>}
      <DataTable exportName={rep.id + '-report'} rows={rows} pageSize={10} cols={cols.map(c => ({ key: c, label: c, render: (r: any) => (typeof r[c] === 'number' ? r[c].toLocaleString('en-US') : r[c] ?? '—'), sort: (r: any) => r[c], align: typeof rows[0][c] === 'number' ? 'right' : undefined }))} /></Card></div>
}
export default function Reports() {
  const { role } = useRole(); const mods = [...new Set(REPORTS.map(r => r.module))]; const [m, setM] = useState(role === 'storekeeper' ? 'Materials' : role === 'driver' ? 'Transport' : role === 'finance' ? 'Petty Cash' : mods[mods.length - 1])
  const allowed = role === 'storekeeper' ? ['Materials'] : role === 'driver' ? ['Transport'] : role === 'finance' ? ['Petty Cash', 'Executive'] : mods
  return <><PageHeader title="Reports & Analytics" crumbs={['Operations']} sub={<Refreshed />} />
    <ul className="nav nav-pills mb-3">{allowed.map(x => <li className="nav-item" key={x}><button className={`nav-link ${m === x ? 'active' : ''}`} onClick={() => setM(x)}>{x}</button></li>)}</ul>
    <ReportView key={m} module={m} /></>
}
