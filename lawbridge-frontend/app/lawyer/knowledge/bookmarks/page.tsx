'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { BookmarkIcon } from '../../../../components/icons/Icons'

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
        <EmptyState
          icon={<BookmarkIcon width={24} height={24} />}
          title="No bookmarks yet"
          body="Save articles from the library to access them quickly."
          action={{ label: 'Browse Library →', href: '/library' }}
        />
      )}

      {bookmarks.length > 0 && (
        <div className="space-y-3">
          {bookmarks.map((b, i) => (
            <div key={b.id} className="flex items-start gap-4 rounded-2xl border border-white/8 bg-primary-800/20 p-5 hover:border-white/12 transition-colors stagger-child" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
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
