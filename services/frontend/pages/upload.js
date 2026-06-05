import {useState} from 'react'
import axios from 'axios'

export default function Upload(){
  const [file,setFile]=useState(null)
  const [status,setStatus]=useState(null)
  const [analysis,setAnalysis]=useState(null)

  const submit=async(e)=>{
    e.preventDefault()
    if(!file) return setStatus('select file')
    const form = new FormData()
    form.append('file', file)
    // for dev we'll include a title
    form.append('title', file.name)
    try{
      const token = localStorage.getItem('access')
      const r = await axios.post('/api/analyzer/upload', form, { headers: { Authorization: token? `Bearer ${token}` : undefined, 'Content-Type':'multipart/form-data' }, timeout: 600000 })
      setStatus('submitted')
      setAnalysis(r.data)
    }catch(e){ setStatus('upload failed: '+(e.response?.data||e.message)) }
  }

  return (
    <div style={{padding:20}}>
      <h2>Upload Document</h2>
      <form onSubmit={submit}>
        <input type="file" onChange={e=>setFile(e.target.files?.[0])} />
        <button type="submit">Upload</button>
      </form>
      {status && <div>{status}</div>}
      {analysis && <pre>{JSON.stringify(analysis,null,2)}</pre>}
    </div>
  )
}
