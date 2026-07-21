'use client'

import React from 'react'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`skeleton rounded ${className}`} style={style} />
}

export function SkeletonStat() {
  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-7 rounded-xl" />
      </div>
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-2.5 w-16" />
    </div>
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <div className="space-y-2 pt-1">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-2.5"
            style={{ width: i === lines - 1 ? '60%' : '100%' } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-white/8 overflow-hidden">
      <div className="border-b border-white/8 bg-primary-900/40 px-4 py-3 flex gap-4">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-2.5 w-16 ml-auto" />
      </div>
      <div className="divide-y divide-white/5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-2.5 w-40" />
              <Skeleton className="h-2 w-24" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
