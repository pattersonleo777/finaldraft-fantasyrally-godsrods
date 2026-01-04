import React, {useState} from 'react'

const API = 'http://localhost:4000'

export default function Auth({onAuth, token, me}){
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function submit(e){
    e.preventDefault()
    setError('')
    const url = `${API}/api/${mode}`
    try{
      const res = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email,password})})
      const data = await res.json()
      if(!res.ok) return setError(data.error || 'error')
      if(data.token){ onAuth(data.token, data.user) }
    }catch(err){ setError(err.message) }
  }

  if(token && me) return (
    <div>
      <h2>Account</h2>
      <p>{me.email}</p>
      <p>Sweepcoins: {me.sweepcoins}</p>
    </div>
  )

  return (
    <div>
      <h2>{mode==='signin' ? 'Sign in' : 'Sign up'}</h2>
      <form onSubmit={submit}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" type="password" />
        <button>{mode==='signin' ? 'Sign in' : 'Sign up'}</button>
      </form>
      {error && <div style={{color:'red'}}>{error}</div>}
      <p>
        {mode==='signin' ? <span>Need an account? <button onClick={()=>setMode('signup')}>Sign up</button></span> : <span>Have an account? <button onClick={()=>setMode('signin')}>Sign in</button></span>}
      </p>
    </div>
  )
}
