import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDB, mutate } from '../lib/store'
import { useRole } from '../App'
import { fmtDT } from '../lib/util'
import { PageHeader, Badge } from '../components/ui'

const ICON: Record<string, string> = { 'Pending approval': 'check2-square', 'Attendance irregularity': 'person-exclamation', 'Missing check-out': 'door-open', 'Delayed progress': 'hourglass-split', 'Material shortage': 'box-seam', 'Stock discrepancy': 'clipboard-x', 'Vehicle maintenance': 'tools', 'Failed synchronization': 'arrow-repeat', 'SAP posting failure': 'plug', 'Outstanding petty cash advance': 'wallet2' }
export default function Notifications() {
  const db = useDB(); const { role } = useRole(); const nav = useNavigate(); const [f, setF] = useState(''); const [unread, setUnread] = useState(false)
  const rows = db.notifications.filter((n: any) => n.roles.includes(role) && (!f || n.type === f) && (!unread || !n.read))
  const types = [...new Set(db.notifications.filter((n: any) => n.roles.includes(role)).map((n: any) => n.type))] as string[]
  return <><PageHeader title="Notification Centre" crumbs={['Operations']} sub="Role-specific alerts" actions={<button className="btn btn-sm btn-outline-primary" onClick={() => mutate(s => s.notifications.forEach((n: any) => n.roles.includes(role) && (n.read = true)))}>Mark all as read</button>} />
    <div className="d-flex gap-2 mb-3 flex-wrap"><select className="form-select form-select-sm w-auto" value={f} onChange={e => setF(e.target.value)}><option value="">All types</option>{types.map(t => <option key={t}>{t}</option>)}</select><div className="form-check form-switch pt-1"><input className="form-check-input" type="checkbox" checked={unread} onChange={e => setUnread(e.target.checked)} id="u" /><label className="form-check-label small" htmlFor="u">Unread only</label></div></div>
    <div className="card">{rows.map((n: any) => <div key={n.id} className={`d-flex gap-3 p-3 border-bottom ${n.read ? '' : 'bg-light'}`} style={{ cursor: 'pointer' }} onClick={() => { mutate(s => { s.notifications.find((x: any) => x.id === n.id).read = true }); nav(n.link) }}>
      <i className={`bi bi-${ICON[n.type] || 'bell'} fs-4 text-primary`} /><div className="flex-grow-1"><div className="fw-semibold">{n.title} {!n.read && <span className="badge bg-primary ms-1">new</span>}</div><div className="small text-muted">{n.body}</div><div className="small text-muted">{n.type} · {fmtDT(n.at)}</div></div><button className="btn btn-sm btn-link" onClick={e => { e.stopPropagation(); mutate(s => { const x = s.notifications.find((y: any) => y.id === n.id); x.read = !x.read }) }}>{n.read ? 'Mark unread' : 'Mark read'}</button></div>)}
      {!rows.length && <div className="p-4 text-center text-muted">No notifications for your role.</div>}</div></>
}
