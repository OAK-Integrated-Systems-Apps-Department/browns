import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROLES, RoleKey } from '../lib/roles'
import { resetDemo } from '../lib/store'

export default function Studio() {
  const [mr, setMr] = useState<RoleKey>('supervisor'); const [wr, setWr] = useState<RoleKey>('pm'); const [k, setK] = useState(0)
  return <div style={{ minHeight: '100vh', background: '#101a2b' }} className="p-3">
    <div className="d-flex flex-wrap gap-3 align-items-center text-white mb-3"><Link to="/login" className="btn btn-sm btn-outline-light">‹ Login</Link><b>Demo Studio</b><span className="small opacity-75">Web console and mobile app share one data store – act in one, watch the other update (offline → sync, approvals, etc.).</span>
      <div className="ms-auto d-flex gap-2 align-items-center"><select className="form-select form-select-sm" value={mr} onChange={e => { setMr(e.target.value as RoleKey); setK(k + 1) }}>{(Object.keys(ROLES) as RoleKey[]).map(r => <option key={r} value={r}>Mobile: {ROLES[r].short}</option>)}</select><select className="form-select form-select-sm" value={wr} onChange={e => { setWr(e.target.value as RoleKey); sessionStorage.setItem('browns-web-role', e.target.value); setK(k + 1) }}>{(Object.keys(ROLES) as RoleKey[]).map(r => <option key={r} value={r}>Web: {ROLES[r].short}</option>)}</select><button className="btn btn-sm btn-warning" onClick={() => { if (confirm('Reset demo data?')) { resetDemo(); setK(k + 1) } }}>Reset data</button></div></div>
    <div className="d-flex gap-3 flex-wrap justify-content-center align-items-start"><div style={{ width: 390, height: 780, borderRadius: 38, border: '9px solid #05080d', overflow: 'hidden', background: '#fff' }}><iframe key={'m' + k + mr} title="mobile" src={`#/mobile?role=${mr}&embed=1`} style={{ width: '100%', height: '100%', border: 0 }} /></div>
      <div style={{ flex: 1, minWidth: 640, height: 780, borderRadius: 10, overflow: 'hidden', background: '#fff' }}><iframe key={'w' + k + wr} title="web" src="#/app" style={{ width: '100%', height: '100%', border: 0 }} /></div></div></div>
}
