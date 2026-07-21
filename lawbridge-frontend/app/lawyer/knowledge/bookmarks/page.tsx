'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

const BOOKMARKS_KEY = 'lawbridge_article_bookmarks'

type Bookmark = {
  id: string
  title: string
  author?: string
  url: string
  savedAt: string
}

function getBookmarks(): Bookmark[] {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]') }
  catch { return [] }
}

function removeBookmark(id: string) {
  const bm = getBookmarks().filter(b => b.id !== id)
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bm))
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])

  useEffect(() => {
    setBookmarks(getBookmarks())
  }, [])

  function handleRemove(id: string) {
    removeBookmark(id)
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h2 className="font-display text-display-md">Bookmarks</h2>
        <p className="mt-1 text-sm text-neutral-400">{bookmarks.length} saved article{bookmarks.length !== 1 ? 's' : ''}</p>
      </header>

      {bookmarks.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-700/40 text-3xl">🔖</div>
          <h3 className="font-semibold text-neutral-200">No bookmarks yet</h3>
          <p className="mt-1.5 text-sm text-neutral-500">Save articles from the library to access them quickly.</p>
          <Link href="/library"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/10 px-5 py-2.5 text-sm font-semibold text-gold-400 hover:bg-gold-500/20 transition-colors">
            Browse Library →
          </Link>
        </div>
      )}

      {bookmarks.length > 0 && (
        <div className="space-y-3">
          {bookmarks.map(b => (
            <div key={b.id} className="flex items-start gap-4 rounded-2xl border border-white/8 bg-primary-800/20 p-5 hover:border-white/12 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-100">{b.title}</p>
                {b.author && <p className="text-xs text-neutral-500 mt-0.5">{b.author}</p>}
                <p className="text-xs text-neutral-700 mt-1">Saved {new Date(b.savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a href={b.url}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gold-400/25 text-gold-400 hover:bg-gold-500/10 transition-colors">
                  Open
                </a>
                <button onClick={() => handleRemove(b.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/8 text-neutral-500 hover:border-crimson-500/30 hover:text-crimson-400 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
