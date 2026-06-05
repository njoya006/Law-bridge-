import React from 'react'

export function Badge({ children }: { children: React.ReactNode }){
  return <span className="inline-block px-2 py-0.5 rounded bg-gold-500 text-black text-sm">{children}</span>
}

export default Badge
