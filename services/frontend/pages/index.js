import React, {useState} from 'react'
import axios from 'axios'

export default function Home(){
  const [resp, setResp] = useState(null)
  const [loading, setLoading] = useState(false)

  const call = async ()=>{
    setLoading(true)
    try{
      const r = await axios.post('/api/test-generate', {model:'phi3', prompt:'Give a one-sentence test response.'}, {timeout: 700000})
      setResp(r.data)
    }catch(e){
      setResp({error: e.message})
    }finally{setLoading(false)}
  }

  return (
    <div style={{fontFamily:'Arial', padding:20}}>
      <h1>LawBridge Frontend (Next.js)</h1>
      <nav style={{marginBottom:16}}>
        <a href="/health" style={{marginRight:8}}>Health</a>
        <a href="/upload" style={{marginRight:8}}>Upload</a>
        <a href="/analyses" style={{marginRight:8}}>Analyses</a>
        <a href="/auth/login">Login</a>
      </nav>
      <button onClick={call} disabled={loading}>{loading? 'Waiting...':'Call AI'}</button>
      {resp && <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(resp,null,2)}</pre>}
    </div>
  )
}
