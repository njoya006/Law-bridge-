export default async function handler(req, res) {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://ai-assistant-service:8011'
  try {
    const token = req.headers.authorization || (req.cookies?.access ? `Bearer ${req.cookies.access}` : '')
    const headers = {}
    if (token) headers['Authorization'] = token
    const r = await fetch(`${base}/api/v1/health/ready/`, { headers })
    const data = await r.json()
    return res.status(r.status).json(data)
  } catch (err) {
    return res.status(500).json({ ready: false, error: String(err) })
  }
}
