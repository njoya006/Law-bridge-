const fallback = (value: string | undefined, defaultValue: string) => value?.trim() || defaultValue

export const SERVICE_URLS = {
  auth: fallback(process.env.NEXT_PUBLIC_AUTH_SERVICE_URL, '/api/v1'),
  client: fallback(process.env.NEXT_PUBLIC_CLIENT_SERVICE_URL, '/api/v1/clients'),
  lawyer: fallback(process.env.NEXT_PUBLIC_LAWYER_SERVICE_URL, '/api/v1/lawyers'),
  firms: fallback(process.env.NEXT_PUBLIC_FIRMS_SERVICE_URL, '/api/v1/firms'),
  case: fallback(process.env.NEXT_PUBLIC_CASE_SERVICE_URL, '/api/v1/cases'),
  document: fallback(process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL, '/api/v1/documents'),
  notification: fallback(process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL, '/api/v1/notifications'),
  payment: fallback(process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL, '/api/v1/payments'),
  calendar: fallback(process.env.NEXT_PUBLIC_CALENDAR_SERVICE_URL, '/api/v1/calendar'),
  monitoring: fallback(process.env.NEXT_PUBLIC_MONITORING_SERVICE_URL, '/api/v1/monitoring'),
  search: fallback(process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL, '/api/v1/search'),
  ai: fallback(process.env.NEXT_PUBLIC_AI_ASSISTANT_SERVICE_URL, '/api/v1/ai'),
} as const

export type ServiceName = keyof typeof SERVICE_URLS
