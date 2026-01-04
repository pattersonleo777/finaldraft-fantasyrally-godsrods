import React, {useState} from 'react'

const API = 'http://localhost:4000'

export default function Payment({token, me, onSuccess}){
  const [amount, setAmount] = useState('5.00')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function startCheckout(e){
    e.preventDefault()
    setError('')
    if(!token) return setError('Please sign in first')
    const cents = Math.round(parseFloat(amount) * 100)
    setLoading(true)
    try{
      const res = await fetch(`${API}/api/create-checkout-session`, {method:'POST', headers:{'Content-Type':'application/json', Authorization: `Bearer ${token}`}, body: JSON.stringify({amount_cents: cents})})
      const data = await res.json()
      if(!res.ok) { setError(data.error || 'checkout error'); setLoading(false); return }
      // redirect to Stripe Checkout
      window.location.href = data.url
    }catch(err){ setError(err.message); setLoading(false) }
  }

  return (
    <div>
      <h2>Deposit Sweepcoins</h2>
      {me && <p>Signed in as {me.email} — Balance: {me.sweepcoins}</p>}
      <form onSubmit={startCheckout}>
        <label>Amount (USD)</label>
        <input value={amount} onChange={e=>setAmount(e.target.value)} />
        <button disabled={loading}>{loading ? 'Redirecting...' : 'Deposit'}</button>
      </form>
      {error && <div style={{color:'red'}}>{error}</div>}
      <p>Conversion: 1 cent = 1 sweepcoin (e.g. $1 => 100 sweepcoins)</p>
    </div>
  )
}
