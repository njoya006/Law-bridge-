import React from 'react'
import { cn } from '../../lib/utils'

export function Card({ children, className=''}: { children: React.ReactNode, className?: string }){
  return (
    <div className={cn(
      `rounded-xl p-6 bg-primary-800/40 border border-neutral-700/30
       transition-all duration-200
       hover:border-neutral-600/40 hover:bg-primary-800/50
       hover:-translate-y-0.5 hover:shadow-card-hover`,
      className
    )}>
      {children}
    </div>
  )
}

export default Card
