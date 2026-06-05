export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://ai-assistant-service:8011'
  try {
    const token = req.headers.authorization || (req.cookies?.access ? `Bearer ${req.cookies.access}` : '')
    const headers = { Accept: 'text/event-stream', 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = token

    // read raw body from req
    let body = ''
    for await (const chunk of req) body += chunk

    const backendRes = await fetch(`${base}/api/v1/chat/chat/`, {
      method: 'POST', headers, body
    })

    if (!backendRes.ok && backendRes.status !== 200) {
      const err = await backendRes.text()
      return res.status(backendRes.status).send(err)
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const stream = backendRes.body
    if (stream && stream.pipe) {
      stream.pipe(res)
    } else if (stream && stream.getReader) {
      // web stream
      const reader = stream.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(decoder.decode(value))
      }
      res.end()
    } else {
      const text = await backendRes.text()
      res.end(text)
    }
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
}
