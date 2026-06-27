/**
 * Avatar upload helpers.
 * Avatars are served at /api/v1/auth/avatars/<user_uuid>/ by auth-service.
 * Firm logos are served at /api/v1/firms/logo/<firm_id>/ by lawyer-service.
 */

const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPEG, PNG, WebP, or GIF images are accepted.'
  if (file.size > MAX_SIZE_BYTES) return 'Image must be under 5 MB.'
  return null
}

export async function uploadAvatar(file: File, token: string): Promise<{ avatar_url: string }> {
  const form = new FormData()
  form.append('avatar', file)
  const res = await fetch('/api/v1/auth/me/avatar/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    let detail = `Upload failed (${res.status})`
    try { detail = JSON.parse(msg).detail ?? detail } catch { /* */ }
    throw new Error(detail)
  }
  return res.json() as Promise<{ avatar_url: string }>
}

export async function uploadFirmLogo(firmId: number, file: File, token: string): Promise<{ logo_url: string }> {
  const form = new FormData()
  form.append('logo', file)
  const res = await fetch(`/api/v1/firms/${firmId}/logo/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    let detail = `Upload failed (${res.status})`
    try { detail = JSON.parse(msg).detail ?? detail } catch { /* */ }
    throw new Error(detail)
  }
  return res.json() as Promise<{ logo_url: string }>
}
