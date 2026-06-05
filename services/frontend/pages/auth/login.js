import {useState} from 'react'
import axios from 'axios'

export default function Login(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [msg,setMsg]=useState(null)

  const submit=async(e)=>{
    e.preventDefault()
    try{
      const r=await axios.post('/api/auth/login', {email, password})
      // store token in localStorage for client requests; cookie set by proxy
      if(r.data?.access) localStorage.setItem('access', r.data.access)
      if(r.data?.refresh) localStorage.setItem('refresh', r.data.refresh)
      setMsg('Login successful')
    }catch(e){ setMsg('Login failed: '+(e.response?.data?.detail||e.message)) }
  }

  return (
    <div style={{padding:20}}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div><input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div><input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <button type="submit">Login</button>
      </form>
      {msg && <div>{msg}</div>}
    </div>
  )
}
