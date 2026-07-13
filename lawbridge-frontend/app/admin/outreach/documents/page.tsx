'use client'

import React from 'react'
import Link from 'next/link'

export default function DocumentsPage() {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs text-neutral-500 mb-1"><Link href="/admin/outreach" className="hover:text-neutral-300">Outreach</Link> › Documents</div>
        <h1 className="font-display text-2xl font-bold text-neutral-50">Documents & Resources</h1>
        <p className="text-sm text-neutral-500 mt-1">Outreach materials, agreements, and templates</p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-primary-800/20 py-20 text-center">
        <svg className="mx-auto mb-4 text-neutral-700" width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p className="text-neutral-400 font-medium">Documents coming soon</p>
        <p className="text-neutral-600 text-sm mt-2 max-w-xs mx-auto">
          This section will allow you to manage outreach materials, founding council agreements, and pitch decks. Backend Engineer A will connect this to MinIO file storage.
        </p>
      </div>
    </div>
  )
}
