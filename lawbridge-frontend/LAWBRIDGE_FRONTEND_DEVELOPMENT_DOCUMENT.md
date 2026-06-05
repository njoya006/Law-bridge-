# LawBridge — Complete Frontend Development Document
## Premium Legal Platform for Cameroon & CEMAC Region
### Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui

---

# PART 1 — DESIGN PHILOSOPHY & AESTHETIC DIRECTION

## 1.1 Conceptual Direction

LawBridge sits at the intersection of two visual languages:
**Parisian legal gravitas** (dark, authoritative, serif-anchored)
and **West African luminosity** (warm gold, deep earth tones,
generous white space, geometric rhythm borrowed from Kente weave).

The result is a platform that feels like a private banking app
merged with a prestigious law firm's brand identity. It commands
trust immediately. Nothing is playful. Everything is deliberate.

**One sentence that defines the aesthetic:**
"Power expressed through restraint, with gold as the accent of authority."

---

# PART 2 — DESIGN SYSTEM

## 2.1 Color Palette

### Primary Palette

```
Deep Navy (Primary)
  --color-primary-900: #0B1426   ← Near-black navy (backgrounds)
  --color-primary-800: #112240   ← Rich navy (sidebar, headers)
  --color-primary-700: #1B3461   ← Dark navy (active states)
  --color-primary-600: #1E4080   ← Medium navy (buttons)
  --color-primary-500: #2855A8   ← Bright navy (links)
  --color-primary-400: #4B78CC   ← Light navy (hover)
  --color-primary-100: #E8EDF8   ← Near-white blue tint (backgrounds)
  --color-primary-50:  #F4F7FD   ← Whisper blue (subtle bg)

Judicial Gold (Accent)
  --color-gold-900:    #5C3D00   ← Deep gold (text on light)
  --color-gold-700:    #8B5E00   ← Dark gold
  --color-gold-500:    #C9923A   ← Primary gold (CTAs, highlights)
  --color-gold-400:    #D4A853   ← Medium gold (borders, dividers)
  --color-gold-300:    #E4C078   ← Light gold (soft accents)
  --color-gold-100:    #FDF6E8   ← Gold tint (alert backgrounds)
  --color-gold-50:     #FEFBF3   ← Whisper gold

Emerald (Status / Success)
  --color-emerald-700: #065F46
  --color-emerald-500: #10B981
  --color-emerald-100: #D1FAE5
  --color-emerald-50:  #ECFDF5

Crimson (Error / Alert)
  --color-crimson-700: #991B1B
  --color-crimson-500: #EF4444
  --color-crimson-100: #FEE2E2
  --color-crimson-50:  #FFF5F5

Amber (Warning)
  --color-amber-700:   #92400E
  --color-amber-500:   #F59E0B
  --color-amber-100:   #FEF3C7

Neutral (Greys)
  --color-neutral-950: #0A0A0F   ← True near-black
  --color-neutral-900: #111118
  --color-neutral-800: #1E1E2A
  --color-neutral-700: #2D2D3F
  --color-neutral-600: #4A4A6A
  --color-neutral-500: #6B6B8A
  --color-neutral-400: #9696AA
  --color-neutral-300: #BABACF
  --color-neutral-200: #D8D8E8
  --color-neutral-100: #EDEDF5
  --color-neutral-50:  #F7F7FB
  --color-neutral-0:   #FFFFFF
```

### Semantic Color Tokens

```css
/* Light Mode */
--bg-base:           var(--color-neutral-0)
--bg-surface:        var(--color-neutral-50)
--bg-elevated:       var(--color-neutral-0)
--bg-overlay:        rgba(11, 20, 38, 0.6)

--text-primary:      var(--color-neutral-900)
--text-secondary:    var(--color-neutral-600)
--text-tertiary:     var(--color-neutral-400)
--text-inverse:      var(--color-neutral-0)
--text-gold:         var(--color-gold-700)

--border-default:    var(--color-neutral-200)
--border-strong:     var(--color-neutral-300)
--border-gold:       var(--color-gold-300)

--sidebar-bg:        var(--color-primary-800)
--sidebar-text:      rgba(255,255,255,0.75)
--sidebar-active:    var(--color-gold-500)

/* Dark Mode */
--bg-base:           var(--color-primary-900)
--bg-surface:        var(--color-neutral-800)
--bg-elevated:       var(--color-neutral-700)
--text-primary:      var(--color-neutral-50)
--text-secondary:    var(--color-neutral-300)
--border-default:    var(--color-neutral-700)
```

### Tailwind Config Extension

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#F4F7FD',
          100: '#E8EDF8',
          400: '#4B78CC',
          500: '#2855A8',
          600: '#1E4080',
          700: '#1B3461',
          800: '#112240',
          900: '#0B1426',
        },
        gold: {
          50:  '#FEFBF3',
          100: '#FDF6E8',
          300: '#E4C078',
          400: '#D4A853',
          500: '#C9923A',
          700: '#8B5E00',
          900: '#5C3D00',
        },
        neutral: {
          0:   '#FFFFFF',
          50:  '#F7F7FB',
          100: '#EDEDF5',
          200: '#D8D8E8',
          300: '#BABACF',
          400: '#9696AA',
          500: '#6B6B8A',
          600: '#4A4A6A',
          700: '#2D2D3F',
          800: '#1E1E2A',
          900: '#111118',
          950: '#0A0A0F',
        }
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        heading: ['DM Sans', 'system-ui', 'sans-serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4.5rem',  { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-xl':  ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg':  ['3rem',    { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-md':  ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm':  ['1.875rem',{ lineHeight: '1.25', fontWeight: '600' }],
        'display-xs':  ['1.5rem',  { lineHeight: '1.3', fontWeight: '600' }],
        'body-xl':     ['1.25rem', { lineHeight: '1.6' }],
        'body-lg':     ['1.125rem',{ lineHeight: '1.6' }],
        'body-md':     ['1rem',    { lineHeight: '1.6' }],
        'body-sm':     ['0.875rem',{ lineHeight: '1.5' }],
        'body-xs':     ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        'label-lg':    ['0.875rem',{ lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.02em' }],
        'label-md':    ['0.75rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.04em' }],
        'label-sm':    ['0.625rem',{ lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.08em' }],
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(11,20,38,0.06), 0 1px 2px rgba(11,20,38,0.04)',
        'card-md': '0 4px 6px rgba(11,20,38,0.07), 0 2px 4px rgba(11,20,38,0.05)',
        'card-lg': '0 10px 15px rgba(11,20,38,0.08), 0 4px 6px rgba(11,20,38,0.06)',
        'card-xl': '0 20px 25px rgba(11,20,38,0.10), 0 8px 10px rgba(11,20,38,0.06)',
        'gold':    '0 0 0 3px rgba(201,146,58,0.2)',
        'focus':   '0 0 0 3px rgba(40,85,168,0.3)',
        'modal':   '0 25px 50px rgba(11,20,38,0.25)',
        'sidebar': '4px 0 24px rgba(11,20,38,0.15)',
      },
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl':'16px',
        '3xl':'20px',
        '4xl':'24px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '72': '18rem',
        '80': '20rem',
        '88': '22rem',
        '96': '24rem',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'fade-up':    'fadeUp 0.4s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'scale-in':   'scaleIn 0.2s ease-out',
        'shimmer':    'shimmer 1.8s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeUp:    { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn:   { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseGold: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
}

export default config
```

---

## 2.2 Typography

### Font Pairing

**Display / Headings:** `Cormorant Garamond` (serif)
- Evokes legal authority, old money, established institutions
- Perfect for page titles, hero text, formal headings
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Body / UI Text:** `DM Sans` (geometric sans-serif)
- Clean, highly legible, modern professional
- Works beautifully at small sizes for data tables, labels
- Weights: 300, 400, 500, 600, 700

**Monospace:** `JetBrains Mono`
- Case numbers, IDs, legal codes, document references

### Google Fonts Import

```html
<!-- In app/layout.tsx or globals.css -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

### Typography Scale Usage

```
Page Titles:        font-display text-display-md font-semibold
Section Headers:    font-heading text-display-xs font-semibold
Card Titles:        font-heading text-body-lg font-semibold
Body Text:          font-body text-body-md font-normal
Secondary Text:     font-body text-body-sm text-neutral-500
Labels/Caps:        font-body text-label-md uppercase tracking-widest
Case Numbers:       font-mono text-body-sm
```

---

## 2.3 Component Variants

### Button System

```tsx
// components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Base styles
  `inline-flex items-center justify-center gap-2 font-heading font-medium
   transition-all duration-200 focus-visible:outline-none
   focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
   disabled:pointer-events-none disabled:opacity-40 select-none
   active:scale-[0.98]`,
  {
    variants: {
      variant: {
        primary: `
          bg-primary-700 text-white
          hover:bg-primary-600
          shadow-sm hover:shadow-md
          border border-primary-700
        `,
        gold: `
          bg-gold-500 text-white
          hover:bg-gold-700
          shadow-sm hover:shadow-md
          border border-gold-500
        `,
        outline: `
          bg-transparent text-primary-700
          border border-primary-700
          hover:bg-primary-50
          dark:text-primary-400 dark:border-primary-600
          dark:hover:bg-primary-900
        `,
        ghost: `
          bg-transparent text-neutral-700
          hover:bg-neutral-100
          dark:text-neutral-300 dark:hover:bg-neutral-800
        `,
        destructive: `
          bg-crimson-500 text-white
          hover:bg-crimson-700
          border border-crimson-500
        `,
        link: `
          bg-transparent text-primary-600 underline-offset-4
          hover:underline p-0 h-auto
        `,
      },
      size: {
        xs:  'h-7  px-2.5 text-label-md rounded-sm',
        sm:  'h-8  px-3   text-body-sm  rounded-md',
        md:  'h-10 px-4   text-body-md  rounded-lg',
        lg:  'h-11 px-5   text-body-lg  rounded-lg',
        xl:  'h-12 px-6   text-body-lg  rounded-xl',
        icon:'h-10 w-10   rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({
  className, variant, size, loading, leftIcon, rightIcon, children, ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
}
```

### Input System

```tsx
// components/ui/Input.tsx
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className, label, hint, error, leftIcon, rightIcon, id, ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="font-heading text-label-lg text-neutral-700
                     dark:text-neutral-300 font-medium"
        >
          {label}
          {props.required && (
            <span className="ml-1 text-crimson-500">*</span>
          )}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2
                          text-neutral-400 pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            `w-full h-10 rounded-lg border bg-white px-3 py-2
             font-body text-body-md text-neutral-900
             placeholder:text-neutral-400
             transition-all duration-150
             focus:outline-none focus:ring-2 focus:ring-primary-500/30
             focus:border-primary-500
             disabled:bg-neutral-50 disabled:cursor-not-allowed
             dark:bg-neutral-800 dark:text-neutral-100
             dark:placeholder:text-neutral-500
             dark:focus:border-primary-400`,
            error
              ? 'border-crimson-500 focus:ring-crimson-500/30'
              : 'border-neutral-200 dark:border-neutral-700',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {rightIcon}
          </div>
        )}
      </div>

      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-body-xs text-neutral-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-body-xs text-crimson-500 flex items-center gap-1">
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
```

### Card System

```tsx
// components/ui/Card.tsx
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'gold' | 'ghost'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

const paddingMap = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
}

const variantMap = {
  default:  'bg-white border border-neutral-200 shadow-card dark:bg-neutral-800 dark:border-neutral-700',
  elevated: 'bg-white border border-neutral-100 shadow-card-lg dark:bg-neutral-800',
  bordered: 'bg-white border-2 border-primary-100 dark:bg-neutral-800 dark:border-primary-900',
  gold:     'bg-gold-50 border border-gold-300 dark:bg-neutral-800 dark:border-gold-700',
  ghost:    'bg-neutral-50 dark:bg-neutral-900',
}

export function Card({ className, variant = 'default', padding = 'md', hoverable, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-200',
        variantMap[variant],
        paddingMap[padding],
        hoverable && 'cursor-pointer hover:shadow-card-xl hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('font-heading text-display-xs font-semibold text-neutral-900 dark:text-neutral-100', className)} {...props}>
      {children}
    </h3>
  )
}
```

### Status Badge

```tsx
// components/ui/Badge.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-heading font-medium',
  {
    variants: {
      variant: {
        // Case statuses
        filed:             'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
        assigned:          'bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300',
        in_progress:       'bg-amber-100 text-amber-700',
        hearing_scheduled: 'bg-purple-100 text-purple-700',
        verdict:           'bg-emerald-100 text-emerald-700',
        closed:            'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
        dismissed:         'bg-crimson-100 text-crimson-700',
        // Generic
        success:  'bg-emerald-100 text-emerald-700',
        warning:  'bg-amber-100 text-amber-700',
        error:    'bg-crimson-100 text-crimson-700',
        info:     'bg-primary-100 text-primary-700',
        neutral:  'bg-neutral-100 text-neutral-600',
      },
      size: {
        sm: 'text-label-sm',
        md: 'text-label-md',
        lg: 'text-label-lg',
      },
      dot: {
        true: '',
        false: '',
      }
    },
    defaultVariants: { variant: 'neutral', size: 'md' }
  }
)

const dotColorMap: Record<string, string> = {
  filed:             'bg-primary-500',
  assigned:          'bg-gold-500',
  in_progress:       'bg-amber-500',
  hearing_scheduled: 'bg-purple-500',
  verdict:           'bg-emerald-500',
  closed:            'bg-neutral-400',
  dismissed:         'bg-crimson-500',
  success:           'bg-emerald-500',
  warning:           'bg-amber-500',
  error:             'bg-crimson-500',
  info:              'bg-primary-500',
  neutral:           'bg-neutral-400',
}

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  className?: string
  children: React.ReactNode
  dot?: boolean
}

export function Badge({ className, variant = 'neutral', size, dot = false, children }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)}>
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotColorMap[variant ?? 'neutral'])} />
      )}
      {children}
    </span>
  )
}
```

---

# PART 3 — PROJECT STRUCTURE

```
lawbridge-frontend/
│
├── app/                              ← Next.js 15 App Router
│   ├── (auth)/                       ← Auth route group (no sidebar)
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── verify-otp/page.tsx
│   │
│   ├── (dashboard)/                  ← Dashboard route group (with sidebar)
│   │   ├── layout.tsx                ← Sidebar + Navbar wrapper
│   │   ├── dashboard/page.tsx
│   │   ├── cases/
│   │   │   ├── page.tsx              ← Case list
│   │   │   ├── new/page.tsx          ← File new case
│   │   │   └── [id]/
│   │   │       ├── page.tsx          ← Case detail
│   │   │       ├── documents/page.tsx
│   │   │       └── timeline/page.tsx
│   │   ├── lawyers/
│   │   │   ├── page.tsx              ← Lawyer discovery
│   │   │   └── [id]/page.tsx         ← Lawyer profile
│   │   ├── documents/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── payments/
│   │   │   ├── page.tsx
│   │   │   └── invoices/[id]/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── ai-assistant/page.tsx
│   │   ├── research/page.tsx
│   │   ├── profile/page.tsx
│   │   └── settings/page.tsx
│   │
│   ├── (admin)/                      ← Admin-only route group
│   │   ├── layout.tsx
│   │   ├── admin/page.tsx
│   │   ├── admin/users/page.tsx
│   │   └── admin/cases/page.tsx
│   │
│   ├── api/                          ← API routes (Next.js)
│   ├── globals.css
│   └── layout.tsx                    ← Root layout (fonts, providers)
│
├── components/
│   ├── ui/                           ← Core primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Drawer.tsx
│   │   ├── Toast.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Avatar.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Table.tsx
│   │   ├── Pagination.tsx
│   │   ├── Select.tsx
│   │   ├── DatePicker.tsx
│   │   ├── FileUpload.tsx
│   │   ├── Tabs.tsx
│   │   └── EmptyState.tsx
│   │
│   ├── layout/                       ← Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   ├── MobileNav.tsx
│   │   ├── PageHeader.tsx
│   │   └── Footer.tsx
│   │
│   ├── auth/                         ← Auth components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── OTPInput.tsx
│   │   └── AuthCard.tsx
│   │
│   ├── dashboard/                    ← Dashboard widgets
│   │   ├── StatsCard.tsx
│   │   ├── RecentActivity.tsx
│   │   ├── CaseOverview.tsx
│   │   ├── UpcomingHearings.tsx
│   │   └── QuickActions.tsx
│   │
│   ├── cases/
│   │   ├── CaseCard.tsx
│   │   ├── CaseTable.tsx
│   │   ├── CaseTimeline.tsx
│   │   ├── CaseStatusBadge.tsx
│   │   ├── CaseForm.tsx
│   │   └── CaseFilters.tsx
│   │
│   ├── lawyers/
│   │   ├── LawyerCard.tsx
│   │   ├── LawyerSearch.tsx
│   │   ├── LawyerProfile.tsx
│   │   └── MatchScore.tsx
│   │
│   ├── documents/
│   │   ├── DocumentCard.tsx
│   │   ├── DocumentUpload.tsx
│   │   ├── AuditLog.tsx
│   │   └── PDFViewer.tsx
│   │
│   ├── ai/
│   │   ├── ChatInterface.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── DocumentAnalyzer.tsx
│   │   └── OutcomePredictor.tsx
│   │
│   └── shared/
│       ├── LanguageToggle.tsx
│       ├── ThemeToggle.tsx
│       ├── SearchBar.tsx
│       └── LoadingOverlay.tsx
│
├── lib/
│   ├── api.ts                        ← Axios instance + interceptors
│   ├── auth.ts                       ← Auth helpers
│   ├── utils.ts                      ← cn(), formatDate(), etc.
│   ├── constants.ts                  ← App constants
│   └── validators.ts                 ← Zod schemas
│
├── hooks/
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── useMediaQuery.ts
│   └── useScrollLock.ts
│
├── store/
│   ├── authStore.ts                  ← Zustand auth state
│   ├── uiStore.ts                    ← Sidebar, modals, theme
│   └── notificationStore.ts
│
├── types/
│   ├── auth.ts
│   ├── case.ts
│   ├── lawyer.ts
│   ├── document.ts
│   └── api.ts
│
├── public/
│   ├── fonts/
│   ├── icons/
│   └── images/
│
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
└── .env.local
```

---

# PART 4 — CORE LAYOUT & NAVIGATION

## 4.1 Sidebar Component

```tsx
// components/layout/Sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import {
  LayoutDashboard, Briefcase, Users, FileText,
  Calendar, CreditCard, Bell, Bot, BookOpen,
  Settings, ChevronLeft, Scale, Search,
  LogOut, User, Shield
} from 'lucide-react'

// Role-based navigation config
const navConfig = {
  client: [
    { label: 'Dashboard',    href: '/dashboard',        icon: LayoutDashboard },
    { label: 'My Cases',     href: '/cases',            icon: Briefcase },
    { label: 'Find a Lawyer',href: '/lawyers',          icon: Users },
    { label: 'Documents',    href: '/documents',        icon: FileText },
    { label: 'Calendar',     href: '/calendar',         icon: Calendar },
    { label: 'Payments',     href: '/payments',         icon: CreditCard },
    { label: 'AI Assistant', href: '/ai-assistant',     icon: Bot },
    { label: 'Notifications',href: '/notifications',    icon: Bell },
  ],
  lawyer: [
    { label: 'Dashboard',    href: '/dashboard',        icon: LayoutDashboard },
    { label: 'Cases',        href: '/cases',            icon: Briefcase },
    { label: 'Clients',      href: '/clients',          icon: Users },
    { label: 'Documents',    href: '/documents',        icon: FileText },
    { label: 'Calendar',     href: '/calendar',         icon: Calendar },
    { label: 'Payments',     href: '/payments',         icon: CreditCard },
    { label: 'Legal Research',href: '/research',        icon: BookOpen },
    { label: 'AI Assistant', href: '/ai-assistant',     icon: Bot },
    { label: 'Notifications',href: '/notifications',    icon: Bell },
  ],
  admin: [
    { label: 'Dashboard',    href: '/dashboard',        icon: LayoutDashboard },
    { label: 'All Cases',    href: '/admin/cases',      icon: Briefcase },
    { label: 'Users',        href: '/admin/users',      icon: Users },
    { label: 'Documents',    href: '/documents',        icon: FileText },
    { label: 'Payments',     href: '/payments',         icon: CreditCard },
    { label: 'System',       href: '/admin/system',     icon: Shield },
  ],
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const navItems = navConfig[user?.role ?? 'client']

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 h-screen z-40 flex flex-col',
        'bg-primary-800 dark:bg-primary-900',
        'shadow-sidebar border-r border-primary-700/50'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-primary-700/50 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center
                          rounded-lg bg-gold-500 shadow-md">
            <Scale className="h-5 w-5 text-white" aria-hidden />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <span className="font-display text-xl font-semibold text-white tracking-wide">
                  LawBridge
                </span>
                <span className="block font-body text-label-sm text-primary-300 tracking-widest uppercase">
                  Legal Platform
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2"
           aria-label="Main navigation">
        <ul className="space-y-0.5" role="list">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href ||
              (href !== '/dashboard' && pathname.startsWith(href))

            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5',
                    'font-heading text-body-sm font-medium',
                    'transition-all duration-150',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-primary-200 hover:bg-white/5 hover:text-white',
                    collapsed && 'justify-center px-0'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive ? 'text-gold-400' : 'text-primary-400 group-hover:text-primary-200'
                    )}
                    aria-hidden
                  />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="truncate"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-0 h-6 w-0.5 rounded-l-full bg-gold-400"
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom: Profile + Settings */}
      <div className="border-t border-primary-700/50 p-3 space-y-1 shrink-0">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5
                     text-primary-300 hover:bg-white/5 hover:text-white
                     transition-colors duration-150"
        >
          <Settings className="h-5 w-5 shrink-0" aria-hidden />
          {!collapsed && (
            <span className="font-heading text-body-sm">Settings</span>
          )}
        </Link>

        {/* User Profile */}
        <div className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5',
          'border border-primary-700/50 bg-primary-900/30',
          collapsed && 'justify-center px-0'
        )}>
          <div className="h-8 w-8 shrink-0 rounded-full bg-gold-500/20
                          border border-gold-500/40 flex items-center justify-center">
            <span className="font-heading text-label-md font-semibold text-gold-400">
              {user?.full_name?.[0] ?? 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-heading text-body-sm font-medium text-white truncate">
                {user?.full_name}
              </p>
              <p className="font-body text-label-sm text-primary-400 capitalize">
                {user?.role}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="text-primary-400 hover:text-crimson-400 transition-colors"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute -right-3 top-20 flex h-6 w-6 items-center justify-center',
          'rounded-full bg-primary-700 border border-primary-600',
          'text-primary-300 hover:text-white transition-all duration-150',
          'hover:bg-primary-600 shadow-md'
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </motion.div>
      </button>
    </motion.aside>
  )
}
```

## 4.2 Top Navbar

```tsx
// components/layout/Navbar.tsx
'use client'

import { Bell, Search, Moon, Sun, Globe } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useNotificationStore } from '@/store/notificationStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function Navbar({ sidebarWidth }: { sidebarWidth: number }) {
  const { theme, setTheme, language, setLanguage } = useUIStore()
  const { unreadCount } = useNotificationStore()

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16',
        'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md',
        'border-b border-neutral-200 dark:border-neutral-800',
        'flex items-center gap-4 px-6',
        'transition-all duration-200'
      )}
      style={{ left: sidebarWidth }}
    >
      {/* Search */}
      <div className="flex-1 max-w-md">
        <Input
          placeholder="Search cases, lawyers, documents..."
          leftIcon={<Search className="h-4 w-4" />}
          className="h-9 bg-neutral-50 dark:bg-neutral-800"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
          className="gap-1.5 font-mono text-label-md"
          aria-label="Toggle language"
        >
          <Globe className="h-4 w-4" />
          {language.toUpperCase()}
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label="Toggle theme"
        >
          {theme === 'light'
            ? <Moon className="h-4 w-4" />
            : <Sun className="h-4 w-4" />
          }
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4
                             items-center justify-center rounded-full
                             bg-crimson-500 text-white text-label-sm font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  )
}
```

---

# PART 5 — KEY PAGES

## 5.1 Authentication — Login Page

```tsx
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Scale, Mail, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuthStore()
  const router = useRouter()

  const { register, handleSubmit, formState: { errors }, setError } =
    useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      router.push('/dashboard')
    } catch {
      setError('root', { message: 'Invalid email or password' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* Left Panel — Visual */}
      <div className="hidden lg:flex relative bg-primary-800 overflow-hidden">
        {/* Geometric background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Gold accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-700 via-gold-500 to-gold-300" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center
                            rounded-lg bg-gold-500">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-display text-2xl font-semibold">LawBridge</span>
              <p className="font-body text-label-sm text-primary-300 tracking-widest uppercase mt-0.5">
                Legal Platform
              </p>
            </div>
          </div>

          {/* Middle Quote */}
          <div className="max-w-sm">
            <blockquote className="font-display text-display-sm italic text-white/90 leading-relaxed">
              "Justice is the foundation upon which a just society is built."
            </blockquote>
            <p className="mt-4 font-body text-body-sm text-primary-300">
              Connecting lawyers, clients, and courts across Cameroon.
            </p>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: '2,400+', label: 'Active Cases' },
              { value: '850+',   label: 'Lawyers' },
              { value: '15+',    label: 'Regions' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="font-display text-3xl font-semibold text-gold-400">
                  {stat.value}
                </p>
                <p className="font-body text-label-md text-primary-300 mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex items-center justify-center p-8 bg-neutral-50 dark:bg-neutral-900">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-neutral-900 dark:text-white">
              LawBridge
            </span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-display-md font-semibold text-neutral-900 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-2 font-body text-body-md text-neutral-500">
              Sign in to your LawBridge account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              autoComplete="email"
              required
              {...register('email')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              autoComplete="current-password"
              required
              {...register('password')}
            />

            {errors.root && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg bg-crimson-50 border border-crimson-200 p-3"
                role="alert"
              >
                <p className="font-body text-body-sm text-crimson-700">
                  {errors.root.message}
                </p>
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-neutral-300 text-primary-600" />
                <span className="font-body text-body-sm text-neutral-600">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="font-heading text-body-sm font-medium text-primary-600
                           hover:text-primary-800 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center font-body text-body-sm text-neutral-500">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="font-heading font-medium text-primary-600 hover:text-primary-800 transition-colors"
            >
              Create account
            </Link>
          </p>

          {/* Trust indicators */}
          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-center gap-4 text-neutral-400">
              <span className="font-body text-label-sm flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                256-bit SSL encryption
              </span>
              <span className="font-body text-label-sm flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Bar Council verified
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
```

## 5.2 Dashboard — Client Role

```tsx
// app/(dashboard)/dashboard/page.tsx
'use client'

import { motion } from 'framer-motion'
import { Briefcase, FileText, Calendar, CreditCard,
         TrendingUp, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'

// Animation variants for staggered cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden:   { opacity: 0, y: 16 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
}

const stats = [
  {
    label: 'Active Cases',
    value: '3',
    change: '+1 this month',
    trend: 'up',
    icon: Briefcase,
    color: 'text-primary-600',
    bg: 'bg-primary-50 dark:bg-primary-900/30',
  },
  {
    label: 'Documents',
    value: '12',
    change: '2 pending review',
    trend: 'neutral',
    icon: FileText,
    color: 'text-gold-600',
    bg: 'bg-gold-50 dark:bg-gold-900/30',
  },
  {
    label: 'Next Hearing',
    value: 'Dec 15',
    change: 'In 8 days',
    trend: 'warning',
    icon: Calendar,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
  },
  {
    label: 'Balance Due',
    value: 'XAF 75,000',
    change: 'Invoice #INV-003',
    trend: 'neutral',
    icon: CreditCard,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back. Here's your legal overview."
        actions={
          <Button variant="gold" leftIcon={<Briefcase className="h-4 w-4" />}>
            File New Case
          </Button>
        }
      />

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
      >
        {stats.map(stat => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card hoverable className="relative overflow-hidden">
              {/* Subtle gradient top border */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />

              <div className="flex items-start justify-between">
                <div>
                  <p className="font-heading text-label-md text-neutral-500 uppercase tracking-widest">
                    {stat.label}
                  </p>
                  <p className="mt-2 font-display text-display-sm font-semibold text-neutral-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="mt-1 font-body text-body-xs text-neutral-400">
                    {stat.change}
                  </p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Active Cases — 2 cols */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="xl:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Active Cases</CardTitle>
              <Button variant="ghost" size="sm">View all</Button>
            </CardHeader>

            <div className="space-y-3">
              {[
                {
                  id: 'CASE-2024-001',
                  title: 'Property Dispute — Buea',
                  lawyer: 'Me. Ambe Martin',
                  status: 'hearing_scheduled' as const,
                  nextDate: 'Dec 15, 2024',
                  type: 'Property Law',
                },
                {
                  id: 'CASE-2024-002',
                  title: 'Employment Termination',
                  lawyer: 'Me. Christelle Ngo',
                  status: 'in_progress' as const,
                  nextDate: 'Dec 22, 2024',
                  type: 'Labour Law',
                },
                {
                  id: 'CASE-2024-003',
                  title: 'Commercial Contract Breach',
                  lawyer: 'Unassigned',
                  status: 'filed' as const,
                  nextDate: '—',
                  type: 'Commercial',
                },
              ].map(c => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 rounded-lg border border-neutral-100
                             dark:border-neutral-700 p-4 hover:bg-neutral-50
                             dark:hover:bg-neutral-700/50 transition-colors cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-label-md text-neutral-400">
                        {c.id}
                      </span>
                      <Badge variant={c.status} size="sm" dot>
                        {c.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="font-heading text-body-md font-medium text-neutral-900
                                  dark:text-neutral-100 truncate group-hover:text-primary-600
                                  transition-colors">
                      {c.title}
                    </p>
                    <p className="mt-0.5 font-body text-body-sm text-neutral-500">
                      {c.lawyer} · {c.type}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-body text-label-md text-neutral-400 uppercase tracking-wide">
                      Next date
                    </p>
                    <p className="font-heading text-body-sm font-medium text-neutral-700
                                  dark:text-neutral-300 mt-0.5">
                      {c.nextDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Upcoming Hearings — 1 col */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
            </CardHeader>

            <div className="space-y-4">
              {[
                {
                  date: 'Dec 15',
                  day: 'Monday',
                  time: '09:00 AM',
                  title: 'Hearing — Property Dispute',
                  location: 'High Court, Buea',
                  urgent: true,
                },
                {
                  date: 'Dec 22',
                  day: 'Monday',
                  time: '02:30 PM',
                  title: 'Meeting with Lawyer',
                  location: 'Virtual (Zoom)',
                  urgent: false,
                },
              ].map(event => (
                <div key={event.date} className="flex gap-4">
                  <div className={`flex flex-col items-center justify-center rounded-xl
                                   min-w-[52px] py-2.5 text-center
                                   ${event.urgent
                                     ? 'bg-crimson-50 dark:bg-crimson-900/30'
                                     : 'bg-neutral-100 dark:bg-neutral-700'
                                   }`}>
                    <span className={`font-heading text-display-xs font-bold
                                      ${event.urgent ? 'text-crimson-600' : 'text-neutral-700 dark:text-neutral-200'}`}>
                      {event.date.split(' ')[1]}
                    </span>
                    <span className={`font-body text-label-sm
                                      ${event.urgent ? 'text-crimson-500' : 'text-neutral-500'}`}>
                      {event.date.split(' ')[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-body-sm font-medium text-neutral-900
                                  dark:text-neutral-100 truncate">
                      {event.title}
                    </p>
                    <p className="font-body text-body-xs text-neutral-500 mt-0.5">
                      {event.time} · {event.location}
                    </p>
                    {event.urgent && (
                      <Badge variant="error" size="sm" dot className="mt-1.5">
                        Requires preparation
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
```

## 5.3 Case Detail Page

```tsx
// Key structure for app/(dashboard)/cases/[id]/page.tsx

// The case detail page has 4 sections:
// 1. Case Header (status, parties, meta)
// 2. Tabbed Content (Timeline | Documents | Notes | AI Analysis)
// 3. Deadline Sidebar
// 4. Action Panel (for lawyers: add note, request document, etc.)

// CaseTimeline component — shows live status updates
export function CaseTimeline({ timeline }: { timeline: TimelineEntry[] }) {
  return (
    <ol className="relative space-y-0" aria-label="Case timeline">
      {timeline.map((entry, i) => (
        <li key={i} className="relative flex gap-4 pb-8 last:pb-0">
          {/* Connector line */}
          {i < timeline.length - 1 && (
            <div className="absolute left-[17px] top-8 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700" />
          )}

          {/* Status dot */}
          <div className={cn(
            'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center',
            'rounded-full border-2',
            i === 0
              ? 'bg-gold-500 border-gold-500 shadow-gold'
              : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600'
          )}>
            <CheckCircle2 className={cn(
              'h-4 w-4',
              i === 0 ? 'text-white' : 'text-neutral-400'
            )} />
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-heading text-body-md font-semibold text-neutral-900 dark:text-neutral-100 capitalize">
                  {entry.status.replace(/_/g, ' ')}
                </p>
                {entry.note && (
                  <p className="mt-1 font-body text-body-sm text-neutral-600 dark:text-neutral-400">
                    {entry.note}
                  </p>
                )}
              </div>
              <time className="font-mono text-label-md text-neutral-400 shrink-0 mt-0.5">
                {new Date(entry.timestamp).toLocaleDateString('en-CM', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}
              </time>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
```

## 5.4 Lawyer Discovery Page

```tsx
// Key structure for app/(dashboard)/lawyers/page.tsx

// Layout: Search bar + filters at top
//         3-column card grid of lawyer profiles
//         "Match for my case" button that opens the AI matching flow

// LawyerCard component
export function LawyerCard({ lawyer, matchScore }: LawyerCardProps) {
  return (
    <Card hoverable className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-xl bg-primary-100 dark:bg-primary-900
                        flex items-center justify-center shrink-0 border border-primary-200">
          <span className="font-display text-display-xs font-semibold text-primary-700">
            {lawyer.full_name.split(' ').map(n => n[0]).slice(0,2).join('')}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-body-xl font-semibold text-neutral-900 dark:text-white truncate">
            {lawyer.full_name}
          </h3>
          <p className="font-body text-body-sm text-gold-600 mt-0.5">
            {lawyer.specialization}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="info" size="sm">
              {lawyer.bijural_flag === 'both' ? 'Common + Civil Law' : lawyer.bijural_flag}
            </Badge>
            <Badge variant="neutral" size="sm">
              {lawyer.years_of_experience}yr exp
            </Badge>
          </div>
        </div>
        {matchScore !== undefined && (
          <div className="flex flex-col items-center justify-center rounded-xl
                          bg-emerald-50 dark:bg-emerald-900/30
                          border border-emerald-200 px-3 py-2 shrink-0">
            <span className="font-display text-display-xs font-bold text-emerald-700">
              {matchScore}
            </span>
            <span className="font-body text-label-sm text-emerald-500 mt-0.5">
              Match
            </span>
          </div>
        )}
      </div>

      {/* Bio */}
      <p className="font-body text-body-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
        {lawyer.bio}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-700">
        <div>
          <p className="font-body text-label-md text-neutral-400 uppercase tracking-wide">
            Consultation fee
          </p>
          <p className="font-heading text-body-md font-semibold text-neutral-900 dark:text-white mt-0.5">
            XAF {Number(lawyer.consultation_fee).toLocaleString()}
          </p>
        </div>
        <Button variant="outline" size="sm">
          View Profile
        </Button>
      </div>
    </Card>
  )
}
```

---

# PART 6 — LOADING STATES & SKELETON

```tsx
// components/ui/Skeleton.tsx
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'card' | 'avatar' | 'button'
}

export function Skeleton({ className, variant }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-gradient-to-r',
        'from-neutral-200 via-neutral-100 to-neutral-200',
        'dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-700',
        'bg-[length:200%_100%] rounded-lg',
        variant === 'text' && 'h-4 rounded',
        variant === 'avatar' && 'h-12 w-12 rounded-full',
        variant === 'button' && 'h-10 w-24 rounded-lg',
        className
      )}
      aria-hidden="true"
    />
  )
}

// Card skeleton for case list loading state
export function CaseCardSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
    </div>
  )
}
```

---

# PART 7 — EMPTY STATES

```tsx
// components/ui/EmptyState.tsx
import { LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {/* Decorative background circle */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-gold-100 dark:bg-gold-900/30 blur-xl scale-150" />
        <div className="relative flex h-20 w-20 items-center justify-center
                        rounded-2xl bg-primary-50 dark:bg-primary-900/30
                        border border-primary-100 dark:border-primary-800">
          <Icon className="h-10 w-10 text-primary-400" aria-hidden />
        </div>
      </div>

      <h3 className="font-display text-display-xs font-semibold text-neutral-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 font-body text-body-md text-neutral-500 max-w-sm">
        {description}
      </p>

      {action && (
        <Button
          variant="primary"
          className="mt-6"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

---

# PART 8 — TOAST NOTIFICATIONS

```tsx
// Using sonner for toasts — add to root layout
// npm install sonner

// In app/layout.tsx:
import { Toaster } from 'sonner'
// Add inside <body>: <Toaster position="bottom-right" theme="system" richColors />

// Usage throughout the app:
import { toast } from 'sonner'

// Success
toast.success('Case filed successfully', {
  description: 'Your case CASE-2024-004 has been submitted.',
})

// Error
toast.error('Upload failed', {
  description: 'Maximum file size is 50MB. Please compress your document.',
})

// Loading → Success pattern
const toastId = toast.loading('Uploading document...')
// ... after completion:
toast.success('Document uploaded', { id: toastId })
```

---

# PART 9 — PAGE TRANSITIONS

```tsx
// components/shared/PageTransition.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

const variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

---

# PART 10 — IMPLEMENTATION ROADMAP

## Phase 1 — Foundation (Days 1-3)

Day 1:
- npx create-next-app@latest lawbridge-frontend
- Install all dependencies (see package.json below)
- Configure tailwind.config.ts with full design system
- Set up globals.css with CSS variables for both themes
- Configure fonts (Cormorant Garamond + DM Sans + JetBrains Mono)

Day 2:
- Build all primitive UI components (Button, Input, Card, Badge)
- Build Skeleton + EmptyState + Toast setup
- Set up Zustand stores (auth, ui, notification)
- Set up TanStack Query provider
- Set up Axios client with JWT interceptors

Day 3:
- Build auth pages (Login, Register, Forgot Password, OTP)
- Test auth flow end-to-end against the running Django backend

## Phase 2 — Core Layout + Dashboard (Days 4-6)

Day 4:
- Build Sidebar with all role-based nav configs
- Build Navbar with search, theme toggle, notification bell
- Build dashboard layout (sidebar + navbar + content area)
- Build PageHeader component

Day 5:
- Build Client Dashboard (stats, case list, upcoming hearings)
- Build Lawyer Dashboard (different stats, different layout)
- Build Admin Dashboard

Day 6:
- Wire dashboard data to real API endpoints
- Add loading skeletons
- Add empty states

## Phase 3 — Main Features (Days 7-18)

Days 7-8:   Case list + Case filing form
Days 9-10:  Case detail (timeline, documents tab, notes)
Days 11-12: Lawyer discovery (search, filters, match)
Days 13-14: Document management (upload, audit log, viewer)
Days 15-16: AI Assistant (chat, analyzer, predictor)
Days 17:    Calendar + appointments
Days 18:    Payments + invoices

## Phase 4 — Polish & Launch (Days 19-22)

Day 19: Page transitions + micro-interactions
Day 20: Full mobile responsiveness audit
Day 21: WCAG 2.1 AA accessibility pass
Day 22: Performance audit (Lighthouse > 90), final fixes

---

# PART 11 — PACKAGE.JSON DEPENDENCIES

```json
{
  "dependencies": {
    "next": "15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.0.0",

    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "@tailwindcss/typography": "^0.5.10",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",

    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-popover": "^1.0.7",

    "framer-motion": "^11.0.0",

    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-query-devtools": "^5.0.0",

    "react-hook-form": "^7.50.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",

    "axios": "^1.6.0",
    "sonner": "^1.4.0",
    "lucide-react": "^0.363.0",
    "date-fns": "^3.3.0",
    "langdetect": "^1.0.0"
  }
}
```

---

# PART 12 — ACCESSIBILITY CHECKLIST

Every component must pass these checks:

- [ ] All interactive elements have visible focus rings
- [ ] Color contrast ratio ≥ 4.5:1 for body text (WCAG AA)
- [ ] Color contrast ratio ≥ 3:1 for large text
- [ ] All images have meaningful alt text
- [ ] Form inputs have associated labels
- [ ] Error messages are associated via aria-describedby
- [ ] Loading states are announced via aria-live
- [ ] Modal dialogs trap focus correctly
- [ ] Sidebar navigation uses role="navigation" and aria-current="page"
- [ ] Status badges use role="status" or visually hidden text
- [ ] Tables have proper th + scope attributes
- [ ] Keyboard navigation works throughout (Tab, Enter, Escape, Arrow keys)

---

# PART 13 — GLOBALS.CSS

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --sidebar-width: 260px;
    --navbar-height: 64px;
    --content-padding: 32px;
  }

  * {
    @apply border-neutral-200 dark:border-neutral-700;
  }

  html {
    @apply scroll-smooth;
    font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    @apply bg-neutral-50 text-neutral-900 font-body;
    @apply dark:bg-primary-900 dark:text-neutral-100;
  }

  /* Focus ring — consistent across all interactive elements */
  :focus-visible {
    @apply outline-none ring-2 ring-primary-500 ring-offset-2;
    @apply dark:ring-offset-primary-900;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { @apply bg-transparent; }
  ::-webkit-scrollbar-thumb {
    @apply bg-neutral-300 rounded-full;
    @apply dark:bg-neutral-600;
  }
  ::-webkit-scrollbar-thumb:hover { @apply bg-neutral-400 dark:bg-neutral-500; }

  /* Selection */
  ::selection { @apply bg-gold-200 text-neutral-900; }
}

@layer utilities {
  .sidebar-offset { margin-left: var(--sidebar-width); }
  .content-top { padding-top: calc(var(--navbar-height) + var(--content-padding)); }
  .text-balance { text-wrap: balance; }
}
```
