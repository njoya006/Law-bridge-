import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2.5 font-heading font-semibold transition-all duration-200 
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
   disabled:pointer-events-none disabled:opacity-40 select-none active:scale-[0.98]
   relative overflow-hidden`,
  {
    variants: {
      variant: {
        primary: `bg-gradient-to-br from-primary-600 to-primary-700 text-white 
                  hover:from-primary-500 hover:to-primary-600 
                  focus-visible:ring-gold-500 focus-visible:ring-offset-primary-900
                  shadow-lg hover:shadow-xl active:shadow-md`,
        gold: `bg-gradient-to-br from-gold-400 to-gold-500 text-primary-900 font-semibold
               hover:from-gold-300 hover:to-gold-400
               focus-visible:ring-gold-300 focus-visible:ring-offset-primary-900
               shadow-lg hover:shadow-gold active:shadow-md`,
        outline: `bg-transparent text-gold-400 border-2 border-gold-400 
                  hover:bg-gold-400 hover:text-primary-900 hover:border-gold-300
                  focus-visible:ring-gold-500 focus-visible:ring-offset-primary-900
                  transition-all`,
        ghost: `bg-transparent text-neutral-300 hover:text-neutral-50 hover:bg-neutral-700/30
                focus-visible:ring-gold-500 focus-visible:ring-offset-primary-900`,
        destructive: `bg-gradient-to-br from-crimson-600 to-crimson-700 text-white
                     hover:from-crimson-500 hover:to-crimson-600
                     focus-visible:ring-crimson-500 focus-visible:ring-offset-primary-900
                     shadow-lg hover:shadow-xl`,
        link: `bg-transparent text-gold-400 hover:text-gold-300 underline-offset-4 
               hover:underline p-0 h-auto font-semibold`,
      },
      size: {
        xs: `h-7 px-2.5 text-label-sm rounded-md`,
        sm: `h-8 px-3 text-body-sm rounded-md`,
        md: `h-10 px-4 text-body-md rounded-lg`,
        lg: `h-11 px-5 text-body-md rounded-lg`,
        xl: `h-12 px-6 text-body-lg rounded-xl`,
        icon: `h-10 w-10 rounded-lg flex-shrink-0`,
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({ className, variant, size, loading, leftIcon, rightIcon, children, ...props }: ButtonProps){
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : leftIcon && (
        <span className="flex-shrink-0">
          {leftIcon}
        </span>
      )}
      {children}
      {!loading && rightIcon && (
        <span className="flex-shrink-0">
          {rightIcon}
        </span>
      )}
    </button>
  )
}

export default Button
