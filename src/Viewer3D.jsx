import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export default function Viewer3D() {
  const mountRef = useRef(null)
  const [parkedModels, setParkedModels] = useState([null, null, null])
  const inputRefs = [useRef(), useRef(), useRef()]

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a1a)

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    camera.position.set(0, 6, 12)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio || 1)
    mount.appendChild(renderer.domElement)

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8)
    hemi.position.set(0, 20, 0)
    scene.add(hemi)
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(5, 10, 7)
    scene.add(dir)

    // Ground / parking layout
    const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    grid.position.y = 0
    scene.add(grid)

    // Parking docks positions (x, z)
    const parkPositions = [ [-6, 0], [0, 0], [6, 0] ]

    // placeholder boxes for empty spots
    const placeholders = parkPositions.map(p => {
      const geo = new THREE.BoxGeometry(4, 0.1, 6)
      const mat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b })
      const m = new THREE.Mesh(geo, mat)
      m.position.set(p[0], 0.05, p[1])
      scene.add(m)
      return m
    })

    // container for loaded models
    const modelGroup = new THREE.Group()
    scene.add(modelGroup)

    // expose globals for loader hook
    window._viewer3d_scene = scene
    window._viewer3d_group = modelGroup
    window._viewer3d_parks = parkPositions

    // simple orbit controls fallback (pointer drag rotates camera around center)
    let isDragging = false
    let prev = { x: 0, y: 0 }
    function onPointerDown(e){ isDragging = true; prev = { x: e.clientX, y: e.clientY } }
    function onPointerUp(){ isDragging = false }
    function onPointerMove(e){ if(!isDragging) return; const dx = (e.clientX - prev.x)/200; camera.position.applyAxisAngle(new THREE.Vector3(0,1,0), -dx); prev = { x: e.clientX, y: e.clientY } }
    mount.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointermove', onPointerMove)

    let rafId
    function animate(){
      rafId = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // resize handling
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      mount.removeChild(renderer.domElement)
      mount.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
      delete window._viewer3d_scene
      delete window._viewer3d_group
      delete window._viewer3d_parks
    }
  }, [])

  // Load model and place into slot index
  function handleFileInput(e, index){
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    // store blob url in state so we can show small preview and re-use later
    const next = [...parkedModels]
    next[index] = { url, name: file.name }
    setParkedModels(next)
    // lazy-load into three scene via custom event so effect has access to scene
    const ev = new CustomEvent('viewer3d-load-model', { detail: { index, url } })
    window.dispatchEvent(ev)
  }

  // When viewer3d-load-model is received, load with GLTFLoader and place at parking pos
  useEffect(()=>{
    function onLoadModel(e){
      const { index, url } = e.detail
      const scene = window._viewer3d_scene
      const modelGroup = window._viewer3d_group
      const parkPositions = window._viewer3d_parks
      if (!scene || !modelGroup || !parkPositions) return

      const loader = new GLTFLoader()
      loader.load(url, gltf => {
        const root = gltf.scene || gltf.scenes[0]
        root.traverse(n=>{ if (n.isMesh) n.castShadow = true })
        // scale and position to fit
        const bbox = new THREE.Box3().setFromObject(root)
        const size = new THREE.Vector3(); bbox.getSize(size)
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = maxDim > 0 ? 3 / maxDim : 1
        root.scale.setScalar(scale)
        const pos = parkPositions[index]
        root.position.set(pos[0], 0, pos[1])
        modelGroup.add(root)
      }, undefined, err => console.error('GLTF load err', err))
    }
    window.addEventListener('viewer3d-load-model', onLoadModel)
    return () => window.removeEventListener('viewer3d-load-model', onLoadModel)
  }, [parkedModels])

  return (
    <div style={{display:'flex',height:'100%'}}>
      <div style={{width:260, padding:12, background:'#2d2d2d', color:'#fff'}}>
        <h3>3D Park</h3>
        <p style={{fontSize:12}}>Upload GLTF/GLB models for each parking spot.</p>
        {[0,1,2].map(i=> (
          <div key={i} style={{marginBottom:12}}>
            <div style={{fontSize:13, marginBottom:6}}>Spot {i+1}</div>
            <input ref={inputRefs[i]} type="file" accept=".glb,.gltf" onChange={(e)=>handleFileInput(e,i)} />
            <div style={{marginTop:6, fontSize:12, color:'#ddd'}}>{parkedModels[i]?.name || 'Empty'}</div>
          </div>
        ))}
      </div>
      <div ref={mountRef} style={{flex:1, height:'100%'}} />
    </div>
  )
}
