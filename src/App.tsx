import { createContext, useContext, useEffect, useState } from 'react'
import { HashRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { useDB, useToasts, setActor, actorFor, resetDemo, setOnline, toast, mutate } from './lib/store'
import { ROLES, NAV, RoleKey } from './lib/roles'
import { fmtDT } from './lib/util'
import { Sim } from './components/ui'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Manpower from './pages/Manpower'
import Transport from './pages/Transport'
import Progress from './pages/Progress'
import Materials from './pages/Materials'
import Petty from './pages/Petty'
import Approvals from './pages/Approvals'
import Notifications from './pages/Notifications'
import Reports from './pages/Reports'
import Integration, { SyncMonitor } from './pages/Integration'
import { Audit, Users, RolesPage, Master, Settings } from './pages/Admin'
import Mobile from './mobile/Mobile'
import Studio from './pages/Studio'

export const RoleCtx = createContext<{ role: RoleKey; logout: () => void; setRole: (r: RoleKey) => void }>({ role: 'admin', logout: () => {}, setRole: () => {} })
export const useRole = () => useContext(RoleCtx)
const SK = 'browns-web-role'

function Toasts() { const t = useToasts(); return <div className="toasts">{t.map((x: any) => <div key={x.id} className={`toast-i t-${x.kind}`}>{x.msg}</div>)}</div> }
export const Logo = ({ size = 38 }: { size?: number }) => <div className="logo-ph" style={{ width: size, height: size }} title="Placeholder for official Browns logo">B</div>

function Login({ onLogin }: { onLogin: (r: RoleKey) => void }) {
  const [email, setEmail] = useState('demo@browns-demo.lk'); const [pw, setPw] = useState('demo1234')
  return <div className="login-bg"><div style={{ width: 'min(1000px,100%)' }}>
    <div className="text-center text-white mb-4"><div className="d-inline-flex align-items-center gap-3"><Logo size={56} /><div className="text-start"><div className="fs-3 fw-bold">BROWNS</div><div style={{ letterSpacing: '.18em', fontSize: '.72rem' }}>ENGINEERING & CONSTRUCTION</div></div></div>
      <h4 className="mt-3 fw-semibold">Field Operations Management System</h4><div className="opacity-75 small">Enterprise prototype · SAP S/4HANA Cloud & HRIS integration (simulated) · <b>DEMO DATA</b></div></div>
    <div className="row g-3"><div className="col-lg-4"><div className="card p-4 h-100"><h6 className="fw-bold text-navy mb-3">Sign in</h6>
      <label className="small fw-semibold">Email</label><input className="form-control mb-2" value={email} onChange={e => setEmail(e.target.value)} />
      <label className="small fw-semibold">Password</label><input type="password" className="form-control mb-3" value={pw} onChange={e => setPw(e.target.value)} />
      <div className="small text-muted mb-3">Prototype login (SSO placeholder). Choose a demonstration role on the right, or sign in as the default Project Manager.</div>
      <button className="btn btn-primary w-100 mb-2" onClick={() => onLogin('pm')}>Sign in</button><Link to="/mobile" className="btn btn-outline-primary w-100 mb-2"><i className="bi bi-phone" /> Open mobile app</Link><Link to="/studio" className="btn btn-outline-secondary w-100"><i className="bi bi-layout-split" /> Demo Studio (web + mobile)</Link></div></div>
      <div className="col-lg-8"><div className="card p-3"><div className="small fw-bold text-navy mb-2">DEMONSTRATION ROLES – click to enter</div><div className="row g-2">{(Object.keys(ROLES) as RoleKey[]).map(r => <div key={r} className="col-6 col-md-3"><div className="role-card" onClick={() => onLogin(r)}><i className={`bi bi-${ROLES[r].icon}`} /><div className="fw-semibold small mt-1">{ROLES[r].label}</div><div className="text-muted" style={{ fontSize: '.7rem' }}>{ROLES[r].desc}</div></div></div>)}</div></div></div></div></div></div>
}

function Layout({ children }: any) {
  const db = useDB(); const { role, logout, setRole } = useRole(); const nav = useNavigate(); const loc = useLocation()
  const [col, setCol] = useState(false); const [open, setOpen] = useState(false); const [nOpen, setNOpen] = useState(false); const [q, setQ] = useState('')
  const R = ROLES[role]; const a = actorFor(role); setActor(a)
  const items = R.web.map(k => ({ k, ...NAV[k] })); const groups = ['MAIN MENU', 'OPERATIONS', 'SYSTEM']
  const notes = db.notifications.filter((n: any) => n.roles.includes(role)); const unread = notes.filter((n: any) => !n.read).length
  const pendingMine = db.approvals.filter((x: any) => x.status === 'Pending' && x.stages[x.stage]?.role === role).length
  useEffect(() => setOpen(false), [loc.pathname])
  const hits = q.length < 2 ? [] : [
    ...db.approvals.filter((x: any) => x.ref.toLowerCase().includes(q.toLowerCase())).slice(0, 4).map((x: any) => ({ t: `${x.ref} · ${x.module}`, to: '/app/approvals?ref=' + x.ref })),
    ...db.projects.filter((p: any) => (p.name + p.id).toLowerCase().includes(q.toLowerCase())).slice(0, 3).map((p: any) => ({ t: `${p.id} · ${p.name}`, to: '/app/projects' })),
    ...db.employees.filter((e: any) => (e.name + e.id).toLowerCase().includes(q.toLowerCase())).slice(0, 3).map((e: any) => ({ t: `${e.id} · ${e.name}`, to: '/app/manpower' })),
    ...db.vehicles.filter((v: any) => (v.reg + v.id).toLowerCase().includes(q.toLowerCase())).slice(0, 2).map((v: any) => ({ t: `${v.id} · ${v.reg}`, to: '/app/transport' }))]
  return <div className="shell">
    <aside className={`sidebar ${col ? 'collapsed' : ''} ${open ? 'open' : ''}`}>
      <div className="brand"><Logo /><div className="brand-t"><div className="fw-bold text-white lh-1">BROWNS</div><div style={{ fontSize: '.58rem', letterSpacing: '.12em' }}>ENGINEERING & CONSTRUCTION</div></div></div>
      {groups.map(g => { const gi = items.filter(i => i.group === g); return gi.length ? <div key={g}><div className="grp">{g}</div>{gi.map(i => <NavLink key={i.k} to={i.path} end={i.path === '/app'} className={({ isActive }) => `nv ${isActive ? 'active' : ''}`} title={i.label}><i className={`bi bi-${i.icon}`} /><span className="nl">{i.label}</span>{i.k === 'approvals' && pendingMine > 0 && <span className="badge bg-warning text-dark ms-auto nl">{pendingMine}</span>}{i.k === 'notifications' && unread > 0 && <span className="badge bg-danger ms-auto nl">{unread}</span>}</NavLink>)}</div> : null })}
    </aside>
    <div className="main">
      <div className="demo-strip">DEMO DATA · SIMULATED SAP S/4HANA & HRIS INTEGRATION · Prototype for demonstration only</div>
      <div className="topbar">
        <button className="btn btn-sm btn-light" onClick={() => (window.innerWidth < 900 ? setOpen(!open) : setCol(!col))}><i className="bi bi-list fs-5" /></button>
        <div className="position-relative flex-grow-1" style={{ maxWidth: 420 }}><div className="input-group input-group-sm"><span className="input-group-text bg-white"><i className="bi bi-search" /></span><input className="form-control" placeholder="Search reference, project, employee, vehicle…" value={q} onChange={e => setQ(e.target.value)} onBlur={() => setTimeout(() => setQ(''), 200)} /></div>
          {hits.length > 0 && <div className="card position-absolute w-100 mt-1" style={{ zIndex: 100 }}>{hits.map((h, i) => <button key={i} className="btn btn-sm btn-light text-start border-0 rounded-0" onMouseDown={() => nav(h.to)}>{h.t}</button>)}</div>}</div>
        <div className="ms-auto d-flex align-items-center gap-2">
          <button className={`btn btn-sm ${db.device.online ? 'btn-outline-success' : 'btn-outline-warning'}`} title="Mobile device connectivity (demo)" onClick={() => setOnline(!db.device.online)}><i className={`bi bi-${db.device.online ? 'wifi' : 'wifi-off'}`} /> <span className="d-none d-md-inline">{db.device.online ? 'Online' : 'Offline'}</span></button>
          <div className="position-relative"><button className="btn btn-sm btn-light position-relative" onClick={() => setNOpen(!nOpen)}><i className="bi bi-bell fs-6" />{unread > 0 && <span className="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle">{unread}</span>}</button>
            {nOpen && <div className="card position-absolute end-0 mt-1" style={{ width: 340, zIndex: 100 }}><div className="card-h">Notifications <button className="btn btn-link btn-sm p-0" onClick={() => { mutate(s => s.notifications.forEach((n: any) => n.roles.includes(role) && (n.read = true))) }}>Mark all read</button></div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>{notes.slice(0, 6).map((n: any) => <div key={n.id} className={`p-2 border-bottom small ${n.read ? '' : 'bg-light'}`} style={{ cursor: 'pointer' }} onClick={() => { mutate(s => { s.notifications.find((x: any) => x.id === n.id).read = true }); setNOpen(false); nav(n.link) }}><div className="fw-semibold">{n.title}</div><div className="text-muted">{fmtDT(n.at)}</div></div>)}{!notes.length && <div className="p-3 text-muted small">No notifications</div>}</div><Link to="/app/notifications" className="p-2 text-center small" onClick={() => setNOpen(false)}>View all</Link></div>}</div>
          <div className="dropdown"><button className="btn btn-sm btn-light d-flex align-items-center gap-2" data-bs-toggle="dropdown"><i className={`bi bi-${R.icon} text-primary`} /><span className="text-start d-none d-md-block lh-1"><b className="small">{a.name}</b><br /><span className="text-muted" style={{ fontSize: '.68rem' }}>{R.short}</span></span></button>
            <ul className="dropdown-menu dropdown-menu-end shadow" style={{ minWidth: 260 }}><li className="dropdown-header">Switch demo role</li>{(Object.keys(ROLES) as RoleKey[]).map(r => <li key={r}><button className={`dropdown-item small ${r === role ? 'active' : ''}`} onClick={() => { setRole(r); nav('/app') }}><i className={`bi bi-${ROLES[r].icon} me-2`} />{ROLES[r].label}</button></li>)}
              <li><hr className="dropdown-divider" /></li><li><Link className="dropdown-item small" to="/mobile"><i className="bi bi-phone me-2" />Open mobile app</Link></li><li><Link className="dropdown-item small" to="/studio"><i className="bi bi-layout-split me-2" />Demo Studio</Link></li>
              <li><button className="dropdown-item small text-danger" onClick={() => { if (confirm('Reset all demo data to the seeded state?')) resetDemo() }}><i className="bi bi-arrow-counterclockwise me-2" />Reset demo data</button></li><li><button className="dropdown-item small" onClick={logout}><i className="bi bi-box-arrow-right me-2" />Sign out</button></li></ul></div>
        </div>
      </div>
      <div className="content">{R.readonly && <div className="alert alert-info py-2 small"><i className="bi bi-eye" /> View-only access: Senior Management cannot create or approve transactions unless authority is explicitly assigned.</div>}{children}</div>
    </div></div>
}

function Guard({ k, children }: { k: string; children: any }) { const { role } = useRole(); return ROLES[role].web.includes(k) ? children : <div className="alert alert-warning">Your role ({ROLES[role].short}) does not have access to this page. <Link to="/app">Back to dashboard</Link></div> }

export default function App() {
  const [role, setR] = useState<RoleKey | null>(() => (sessionStorage.getItem(SK) as RoleKey) || null)
  const setRole = (r: RoleKey) => { sessionStorage.setItem(SK, r); setR(r); toast(`Signed in as ${ROLES[r].label}`, 'info') }
  const logout = () => { sessionStorage.removeItem(SK); setR(null) }
  useDB()
  return <HashRouter><Toasts /><Routes>
    <Route path="/mobile" element={<Mobile />} /><Route path="/studio" element={<Studio />} />
    <Route path="/login" element={role ? <Navigate to="/app" /> : <Login onLogin={setRole} />} />
    <Route path="/app/*" element={!role ? <Navigate to="/login" /> : <RoleCtx.Provider value={{ role, logout, setRole }}><Layout><Routes>
      <Route index element={<Dashboard />} />
      <Route path="projects" element={<Guard k="projects"><Projects /></Guard>} /><Route path="manpower" element={<Guard k="manpower"><Manpower /></Guard>} /><Route path="transport" element={<Guard k="transport"><Transport /></Guard>} />
      <Route path="progress" element={<Guard k="progress"><Progress /></Guard>} /><Route path="materials" element={<Guard k="materials"><Materials /></Guard>} /><Route path="petty" element={<Guard k="petty"><Petty /></Guard>} />
      <Route path="approvals" element={<Guard k="approvals"><Approvals /></Guard>} /><Route path="notifications" element={<Notifications />} /><Route path="reports" element={<Guard k="reports"><Reports /></Guard>} />
      <Route path="integration" element={<Guard k="integration"><Integration /></Guard>} /><Route path="sync" element={<Guard k="sync"><SyncMonitor /></Guard>} /><Route path="audit" element={<Guard k="audit"><Audit /></Guard>} />
      <Route path="users" element={<Guard k="users"><Users /></Guard>} /><Route path="roles" element={<Guard k="roles"><RolesPage /></Guard>} /><Route path="master" element={<Guard k="master"><Master /></Guard>} /><Route path="settings" element={<Guard k="settings"><Settings /></Guard>} />
    </Routes></Layout></RoleCtx.Provider>} />
    <Route path="*" element={<Navigate to="/login" />} />
  </Routes></HashRouter>
}
