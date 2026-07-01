import { useEffect, useRef } from 'react'

type CaseUpdatePayload = {
  case_id: string
  status?: string
  timeline?: Array<{ status: string; timestamp: string; notes?: string; updated_by?: string }>
  [key: string]: unknown
}

/**
 * Subscribes to live case updates via the monitoring-service WebSocket.
 * Requires NEXT_PUBLIC_MONITORING_WS_URL set (e.g. wss://api.lawbridge.app/monitoring).
 * Silently no-ops if the env var is missing or the socket can't connect.
 */
export function useCaseWebSocket(
  caseId: string,
  onUpdate: (data: CaseUpdatePayload) => void,
) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_MONITORING_WS_URL ?? '').replace(/\/$/, '')
    if (!base || !caseId) return

    const token = localStorage.getItem('access') ?? ''
    const url = `${base}/ws/monitoring/cases/${caseId}/timeline/?token=${encodeURIComponent(token)}`

    let ws: WebSocket
    let retryTimer: ReturnType<typeof setTimeout>
    let retries = 0
    const MAX_RETRIES = 4

    function connect() {
      try {
        ws = new WebSocket(url)
      } catch {
        return
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; data: CaseUpdatePayload }
          if (msg.type === 'case_update' && msg.data) {
            onUpdateRef.current(msg.data)
          }
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = (event) => {
        if (event.wasClean || retries >= MAX_RETRIES) return
        retries++
        const delay = Math.min(1000 * 2 ** retries, 30000)
        retryTimer = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      clearTimeout(retryTimer)
      if (ws) {
        ws.onclose = null
        ws.close()
      }
    }
  }, [caseId])
}
