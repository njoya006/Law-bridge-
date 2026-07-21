const fallback = (value: string | undefined, defaultValue: string) => value?.trim() || defaultValue

export const SERVICE_URLS = {
  auth:         fallback(process.env.NEXT_PUBLIC_AUTH_SERVICE_URL,         '/api/v1'),
  client:       fallback(process.env.NEXT_PUBLIC_CLIENT_SERVICE_URL,       '/api/v1'),
  lawyer:       fallback(process.env.NEXT_PUBLIC_LAWYER_SERVICE_URL,       '/api/v1'),
  firms:        fallback(process.env.NEXT_PUBLIC_FIRMS_SERVICE_URL,        '/api/v1/firms'),
  case:         fallback(process.env.NEXT_PUBLIC_CASE_SERVICE_URL,         '/api/v1'),
  document:     fallback(process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL,     '/api/v1/documents'),
  notification: fallback(process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL, '/api/v1'),
  payment:      fallback(process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL,      '/api/v1'),
  calendar:     fallback(process.env.NEXT_PUBLIC_CALENDAR_SERVICE_URL,     '/api/v1/calendar'),
  monitoring:   fallback(process.env.NEXT_PUBLIC_MONITORING_SERVICE_URL,   '/api/v1'),
  search:       fallback(process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL,       '/api/v1'),
  ai:           fallback(process.env.NEXT_PUBLIC_AI_ASSISTANT_SERVICE_URL, '/api/v1'),
  messaging:    fallback(process.env.NEXT_PUBLIC_MESSAGING_SERVICE_URL,    '/api/v1'),
  library:      fallback(process.env.NEXT_PUBLIC_LIBRARY_SERVICE_URL,      '/api/v1/library'),
  network:      fallback(process.env.NEXT_PUBLIC_NETWORK_SERVICE_URL,      '/api/v1/network'),
} as const

export type ServiceName = keyof typeof SERVICE_URLS
