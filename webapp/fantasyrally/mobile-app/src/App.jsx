import React, {useState, useEffect} from 'react'
import Admin from './Admin.jsx'
import ContentViewer from './ContentViewer.jsx'
import Auth from './Auth.jsx'
import Payment from './Payment.jsx'
import Viewer3D from './Viewer3D.jsx'
import Garage from './Garage.jsx'

const API = 'http://localhost:4000'

export default function App(){
  const [page, setPage] = useState('viewer')
  const [selected, setSelected] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [me, setMe] = useState(null)

  useEffect(()=>{ if(token) fetchMe() },[token])

  function onSignOut(){ setToken(null); setMe(null); localStorage.removeItem('token') }

  async function fetchMe(){
    const res = await fetch(`${API}/api/me`, {headers: { Authorization: `Bearer ${token}` }})
    if(res.ok){ const data = await res.json(); setMe(data) }
  }

  return (
    <div className="app">
      <header>
        <h1>FantasyRally</h1>
        <nav>
          <button onClick={()=>setPage('viewer')}>Viewer</button>
          <button onClick={()=>setPage('3d')}>3D Park</button>
          <button onClick={()=>setPage('garage')}>Garage</button>
          <button onClick={()=>setPage('admin')}>Admin</button>
          <button onClick={()=>setPage('auth')}>{token? 'Account' : 'Sign in'}</button>
          <button onClick={()=>setPage('payment')}>Deposit</button>
          {token && <button onClick={onSignOut}>Sign out</button>}
        </nav>
      </header>
      <main>
        {page==='3d' && <div style={{height:'80vh'}}><Viewer3D /></div>}
        {page==='garage' && <Garage />}
        {page==='admin' && <Admin token={token}/>} 
        {page==='viewer' && <ContentViewer onSelect={setSelected} selected={selected}/>} 
        {page==='auth' && <Auth onAuth={(t,u)=>{ setToken(t); localStorage.setItem('token', t); setMe(u)}} token={token} me={me}/>} 
        {page==='payment' && <Payment token={token} me={me} onSuccess={fetchMe} />}
      </main>
    </div>
  )
}
