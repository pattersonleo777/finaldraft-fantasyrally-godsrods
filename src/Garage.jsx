import React, { useState } from 'react'
import Viewer3D from './Viewer3D.jsx'

export default function Garage(){
  const [mode, setMode] = useState('2d') // '2d' or '3d'
  const [inventoryCollapsed, setInventoryCollapsed] = useState(false)

  function toggleMode() {
    const next = mode === '2d' ? '3d' : '2d'
    setMode(next)
    // auto-collapse inventory when switching to 3D
    setInventoryCollapsed(next === '3d')
  }

  return (
    <div className="garage-root" style={{display:'flex',height:'80vh',background:'#111'}}>
      <div className="garage-toolbar" style={{width:120, padding:12, background:'#2d2d2d'}}>
        <button className="btn" onClick={toggleMode} style={{width:'100%', marginBottom:8}}>{mode==='2d' ? 'Switch to 3D' : 'Switch to 2D'}</button>
        <button className="btn" onClick={()=>setInventoryCollapsed(i=>!i)} style={{width:'100%'}}>{inventoryCollapsed ? 'Show Inventory' : 'Hide Inventory'}</button>
      </div>

      <div className="garage-main" style={{flex:1, display:'flex'}}>
        <div className={`garage-canvas-area`} style={{flex:1}}>
          {mode === '2d' ? (
            // embed the standalone compositor HTML for now
            <iframe title="2D Compositor" src="/webapp/misc/html/car-compositor.html" style={{width:'100%',height:'100%',border:'none'}} />
          ) : (
            <Viewer3D />
          )}
        </div>

        <div className={`garage-inventory ${inventoryCollapsed ? 'collapsed' : ''}`} style={{width:260, transition:'width 200ms', overflow:'auto', background:'#2d2d2d'}}>
          {inventoryCollapsed ? (
            <div style={{padding:12,color:'#aaa'}}>Inventory collapsed</div>
          ) : (
            <div style={{padding:12,color:'#fff'}}>
              <h3 style={{marginTop:0}}>Inventory</h3>
              <p style={{fontSize:13}}>Parts and models are shown here. When using 3D this panel auto-collapses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
