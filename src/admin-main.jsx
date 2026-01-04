import React from 'react'
import { createRoot } from 'react-dom/client'
import Admin from './Admin.jsx'

function AdminApp(){
  return <Admin token={localStorage.getItem('token') || null} />
}

createRoot(document.getElementById('root')).render(<AdminApp />)
