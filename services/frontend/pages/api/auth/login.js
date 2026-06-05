export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).end()
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://ai-assistant-service:8011'
  try{
    const r = await fetch(`${base}/api/v1/auth/login/`,{
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(req.body), timeout: 15000
    })
    const data = await r.json()
    // if backend returned tokens, set cookies for browser
    if (data?.access) {
      const cookies = []
      cookies.push(`access=${data.access}; Path=/; SameSite=Lax`)
      if (data?.refresh) cookies.push(`refresh=${data.refresh}; Path=/; SameSite=Lax`)
      res.setHeader('Set-Cookie', cookies)
    }
    return res.status(r.status).json(data)
  }catch(err){ return res.status(500).json({error: String(err)}) }
}
