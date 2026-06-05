import {useState} from 'react'
import axios from 'axios'

export default function Register(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [msg,setMsg]=useState(null)

  const submit=async(e)=>{
    e.preventDefault()
    try{
      const r=await axios.post('/api/auth/register', {email, password})
      setMsg('Registered; please login')
    }catch(e){ setMsg('Register failed: '+(e.response?.data||e.message)) }
  }

  return (
    <div style={{padding:20}}>
      <h2>Register</h2>
      <form onSubmit={submit}>
        <div><input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
        <div><input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <button type="submit">Register</button>
      </form>
      {msg && <div>{msg}</div>}
    </div>
  )
}
