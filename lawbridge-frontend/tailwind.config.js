/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}'
  ],
  darkMode: 'class',
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
          600: '#A87722',
          700: '#8B5E00',
          900: '#5C3D00',
        },
        emerald: { 700: '#065F46', 600: '#059669', 500: '#10B981', 400: '#34D399', 100: '#D1FAE5' },
        crimson: { 700: '#991B1B', 600: '#C62828', 500: '#EF4444', 400: '#F87171', 100: '#FEE2E2' },
        amber: { 700:'#92400E', 600:'#D97706', 500:'#F59E0B', 400:'#FCD34D', 100:'#FEF3C7' },
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
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
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
        'card':       '0 1px 3px rgba(11,20,38,0.06), 0 1px 2px rgba(11,20,38,0.04)',
        'card-md':    '0 4px 6px rgba(11,20,38,0.07), 0 2px 4px rgba(11,20,38,0.05)',
        'card-lg':    '0 10px 15px rgba(11,20,38,0.08), 0 4px 6px rgba(11,20,38,0.06)',
        'card-xl':    '0 20px 25px rgba(11,20,38,0.10), 0 8px 10px rgba(11,20,38,0.06)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.3)',
        'gold':       '0 0 0 3px rgba(201,146,58,0.2)',
        'focus':      '0 0 0 3px rgba(40,85,168,0.3)',
        'modal':      '0 25px 50px rgba(11,20,38,0.25)',
        'sidebar':    '4px 0 24px rgba(11,20,38,0.15)',
      },
      borderRadius: {
        'xs': '2px', 'sm': '4px', 'md': '6px', 'lg': '8px', 'xl': '12px', '2xl':'16px', '3xl':'20px', '4xl':'24px'
      },
      spacing: {
        '18': '4.5rem', '22': '5.5rem', '72': '18rem', '80': '20rem', '88': '22rem', '96': '24rem'
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
    }
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ]
}
