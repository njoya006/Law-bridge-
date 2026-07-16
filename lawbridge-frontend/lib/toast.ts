export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastOptions {
  type?: ToastType
  title?: string
  message: string
  duration?: number
}

export function showToast(opts: ToastOptions) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('lawbridge:toast', { detail: opts }))
}

export function toastSuccess(message: string, title?: string) {
  showToast({ type: 'success', message, title })
}

export function toastError(message: string, title?: string) {
  showToast({ type: 'error', message, title })
}

export function toastInfo(message: string, title?: string) {
  showToast({ type: 'info', message, title })
}

export function toastWarning(message: string, title?: string) {
  showToast({ type: 'warning', message, title })
}
