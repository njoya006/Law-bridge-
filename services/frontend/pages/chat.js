import {useState, useRef} from 'react'

export default function Chat(){
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const controllerRef = useRef(null)

  const send = async (e) => {
    e.preventDefault()
    if(!input) return
    setLoading(true)
    setMessages(prev => [...prev, {role:'user', text: input}])
    try{
      controllerRef.current = new AbortController()
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
        signal: controllerRef.current.signal,
      })
      if(!resp.ok){ const t = await resp.text(); throw new Error(t) }
      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while(true){
        const {done, value} = await reader.read()
        if(done) break
        const chunk = decoder.decode(value)
        // backend sends SSE-like `data: {...}\n\n` blocks; try to extract token or json
        const lines = chunk.split(/\r?\n/).filter(Boolean)
        for(const line of lines){
          if(line.startsWith('data:')){
            const payload = line.replace(/^data:\s*/,'')
            try{
              const obj = JSON.parse(payload)
              if(obj.token){ full += obj.token }
            }catch(e){ full += payload }
          }
        }
        setMessages(prev => {
          const next = [...prev]
          const last = next[next.length-1]
          if(last && last.role==='assistant'){
            last.text = full
          } else {
            next.push({role:'assistant', text: full})
          }
          return next
        })
      }
    }catch(e){
      setMessages(prev => [...prev, {role:'system', text: 'Error: '+String(e)}])
    }finally{ setLoading(false); setInput('') }
  }

  return (
    <div style={{padding:20}}>
      <h2>Chat (Streaming)</h2>
      <div style={{border:'1px solid #ccc', padding:10, height:200, overflow:'auto'}}>
        {messages.map((m,i)=>(<div key={i}><b>{m.role}:</b> {m.text}</div>))}
      </div>
      <form onSubmit={send} style={{marginTop:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} style={{width:'70%'}} />
        <button type="submit" disabled={loading}>{loading? 'Sending...':'Send'}</button>
      </form>
    </div>
  )
}
