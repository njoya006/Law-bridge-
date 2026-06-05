import React, { forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, hint, error, leftIcon, rightIcon, id, ...props }, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  return (
    <div className={cn('flex flex-col', className)}>
      {label && (
        <label htmlFor={inputId} className="mb-2.5 text-label-md text-neutral-200 font-semibold tracking-wide">
          {label}
        </label>
      )}
      <div className="relative group">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-gold-400 transition-colors">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          {...props}
          className={cn(
            `w-full rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50 placeholder:text-neutral-500
             border border-neutral-700/50 transition-all duration-200
             focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-400
             hover:border-neutral-600/50 hover:bg-primary-800/50`,
            leftIcon ? 'pl-11' : '',
            rightIcon ? 'pr-11' : '',
            error && 'border-crimson-500/50 focus:ring-crimson-500/50 focus:border-crimson-400'
          )}
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-gold-400 transition-colors">
            {rightIcon}
          </div>
        )}
      </div>
      {hint && !error && (
        <p className="mt-2 text-body-xs text-neutral-400">
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-2 text-body-xs text-crimson-400 font-medium">
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
