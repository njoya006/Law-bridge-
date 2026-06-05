export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://ai-assistant-service:8011'
  try {
    const token = req.headers.authorization || (req.cookies?.access ? `Bearer ${req.cookies.access}` : '')
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = token
    const r = await fetch(`${base}/api/v1/ai/test-generate/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    })
    const data = await r.json()
    return res.status(r.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
