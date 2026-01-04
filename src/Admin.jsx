import React, {useState, useEffect} from 'react'

const API = 'http://localhost:4000'

export default function Admin(){
  const [files, setFiles] = useState([])
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')

  useEffect(()=>{fetchList()},[])

  function fetchList(){
    fetch(`${API}/api/content`).then(r=>r.json()).then(setFiles)
  }

  async function upload(e){
    e.preventDefault()
    if(!file) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', title)
    const res = await fetch(`${API}/api/upload`, {method:'POST', body:fd})
    if(res.ok){ setFile(null); setTitle(''); fetchList() }
  }

  return (
    <div className="admin">
      <h2>Admin Upload</h2>
      <form onSubmit={upload}>
        <input type="text" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input type="file" onChange={e=>setFile(e.target.files[0])} />
        <button>Upload</button>
      </form>

      <h3>Files</h3>
      <ul>
        {files.map(f=> (
          <li key={f.id}><a href={`${API}/content/${f.filename}`} target="_blank" rel="noreferrer">{f.title||f.originalname}</a> — {f.mimetype}</li>
        ))}
      </ul>
    </div>
  )
}
