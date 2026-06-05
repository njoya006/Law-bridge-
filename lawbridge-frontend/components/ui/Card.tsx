import React from 'react'
import { cn } from '../../lib/utils'

export function Card({ children, className=''}: { children: React.ReactNode, className?: string }){
  return (
    <div className={cn(
      `rounded-xl p-6 bg-primary-800/40 border border-neutral-700/30
       hover:border-neutral-600/40 transition-all duration-300
       hover:bg-primary-800/50 shadow-sm hover:shadow-md`,
      className
    )}>
      {children}
    </div>
  )
}

export default Card
