'use client'
import React, { useRef, useState } from 'react'
import { uploadAvatar, validateImageFile } from '../../lib/avatarApi'

type Props = {
  currentUrl?: string | null
  initials: string
  size?: 'sm' | 'md' | 'lg'
  onUploaded?: (url: string) => void
  /** If omitted the component is display-only (no upload affordance) */
  token?: string | null
  className?: string
}

const SIZE_CLASSES = {
  sm:  'h-10 w-10 text-sm',
  md:  'h-20 w-20 sm:h-24 sm:h-24 text-2xl sm:text-3xl',
  lg:  'h-28 w-28 text-3xl',
}

export default function AvatarUploader({ currentUrl, initials, size = 'md', onUploaded, token, className = '' }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const canUpload = !!token

  const displayUrl = preview ?? currentUrl ?? null

  const handleFile = async (file: File) => {
    const err = validateImageFile(file)
    if (err) { setError(err); return }
    setError('')

    // Optimistic preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    if (!token) return
    setUploading(true)
    try {
      const { avatar_url } = await uploadAvatar(file, token)
      onUploaded?.(avatar_url)
      // Notify sidebar/navbar so they refresh without a full page reload
      window.dispatchEvent(new CustomEvent('lawbridge:avatar-updated', { detail: { url: avatar_url } }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  const sizeClass = SIZE_CLASSES[size]

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center font-display select-none
          ${displayUrl ? '' : 'bg-gradient-to-br from-primary-400 to-primary-600 text-neutral-900'}
          ${canUpload ? 'cursor-pointer group' : ''}`}
        onClick={() => canUpload && inputRef.current?.click()}
        title={canUpload ? 'Click to change photo' : undefined}
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt="Profile photo" className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}

        {/* Hover overlay — only when upload is possible */}
        {canUpload && (
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 pointer-events-none">
            {uploading ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-white text-[10px] font-semibold">Change</span>
              </>
            )}
          </div>
        )}
      </div>

      {canUpload && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onInputChange}
        />
      )}

      {error && (
        <p className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-xs text-crimson-300 whitespace-nowrap bg-primary-900 px-2 py-1 rounded-lg border border-crimson-500/30 z-10">
          {error}
        </p>
      )}
    </div>
  )
}
