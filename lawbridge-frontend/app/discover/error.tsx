'use client'

import React from 'react'
import Link from 'next/link'

export default function DiscoverError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-2xl mx-auto mt-16 px-4">
      <div className="rounded-xl border border-crimson-500/30 bg-crimson-900/10 p-8 text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="font-heading text-body-lg text-neutral-50">Something went wrong</h2>
        <p className="text-neutral-400 text-sm">{error?.message ?? 'An unexpected error occurred loading this page.'}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm hover:bg-gold-500/20 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/discover"
            className="px-4 py-2 rounded-lg border border-neutral-700/40 text-neutral-400 text-sm hover:text-neutral-200 transition-colors"
          >
            Back to Discover
          </Link>
        </div>
        {error?.digest && (
          <p className="text-neutral-600 text-xs">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
