import React, {useState, useEffect} from 'react'

const API = 'http://localhost:4000'

export default function ContentViewer({onSelect, selected}){
  const [files, setFiles] = useState([])

  useEffect(()=>{ fetch(`${API}/api/content`).then(r=>r.json()).then(setFiles) },[])

  return (
    <div className="viewer">
      <h2>Content</h2>
      <div className="list">
        <ul>
          {files.map(f=> (
            <li key={f.id}>
              <button onClick={()=>onSelect(f)}>{f.title||f.originalname}</button>
              <a href={`${API}/content/${f.filename}`} target="_blank" rel="noreferrer">open</a>
            </li>
          ))}
        </ul>
      </div>
      <div className="frame">
        {selected ? (
          <iframe title={selected.title} src={`${API}/content/${selected.filename}`} style={{width:'100%',height:'60vh',border:'1px solid #ccc'}} />
        ) : <p>Select a file to preview.</p>}
      </div>
    </div>
  )
}
