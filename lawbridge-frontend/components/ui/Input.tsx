'use client'
import React, { forwardRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { EyeIcon, EyeOffIcon } from '../icons/Icons'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, hint, error, leftIcon, rightIcon, showPasswordToggle, id, type, ...props }, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword && showPasswordToggle ? (visible ? 'text' : 'password') : type

  return (
    <div className={cn('flex flex-col', className)}>
      {label && (
        <label htmlFor={inputId} className="mb-2.5 text-label-md text-neutral-200 font-semibold tracking-wide">
          {label}
        </label>
      )}
      <div className="relative group">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-portal transition-colors">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          type={resolvedType}
          {...props}
          className={cn(
            `w-full rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50 placeholder:text-neutral-500
             border border-neutral-700/50 transition-all duration-200
             focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-400
             hover:border-neutral-600/50 hover:bg-primary-800/50`,
            leftIcon ? 'pl-11' : '',
            (rightIcon || (isPassword && showPasswordToggle)) ? 'pr-11' : '',
            error && 'border-crimson-500/50 focus:ring-crimson-500/50 focus:border-crimson-400'
          )}
        />
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-portal transition-colors"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOffIcon width={16} height={16} /> : <EyeIcon width={16} height={16} />}
          </button>
        )}
        {!isPassword && rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-portal transition-colors">
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
