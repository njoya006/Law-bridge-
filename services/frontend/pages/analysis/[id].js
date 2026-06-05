import {useState,useEffect} from 'react'
import {useRouter} from 'next/router'

export default function AnalysisDetail(){
  const router = useRouter()
  const {id} = router.query
  const [data,setData] = useState(null)
  const [err,setErr] = useState(null)

  useEffect(()=>{
    if(!id) return
    let mounted = true
    const fetchOne = async ()=>{
      try{
        const r = await fetch(`/api/analyzer/${id}`)
        const json = await r.json()
        if(mounted) setData(json)
      }catch(e){ if(mounted) setErr(String(e)) }
    }
    fetchOne()
    const iv = setInterval(fetchOne, 5000)
    return ()=>{ mounted=false; clearInterval(iv) }
  },[id])

  if(err) return <div>Error: {err}</div>
  if(!data) return <div>Loading...</div>
  return (
    <div style={{padding:20}}>
      <h2>Analysis {id}</h2>
      <div>Status: {data.status}</div>
      <h3>Summary</h3>
      <pre>{JSON.stringify(data.summary, null, 2)}</pre>
      <h3>Raw AI Response</h3>
      <pre style={{whiteSpace:'pre-wrap'}}>{data.raw_response}</pre>
    </div>
  )
}
