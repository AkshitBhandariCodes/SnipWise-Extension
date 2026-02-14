/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./popup.html",
    "./options.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light mode colors
        background: {
          primary: '#FFFFFF',
          secondary: '#F8FAFC',
          tertiary: '#F1F5F9',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
        },
        accent: {
          blue: '#3B82F6',
          purple: '#8B5CF6',
          pink: '#EC4899',
          green: '#10B981',
          yellow: '#F59E0B',
          red: '#EF4444',
        },
        // Category colors
        category: {
          url: '#3B82F6',
          code: '#8B5CF6',
          color: '#EC4899',
          image: '#F472B6',
          text: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', '-apple-system', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        mono: ['Geist Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'h1': ['24px', { lineHeight: '1.2', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.5' }],
        'small': ['12px', { lineHeight: '1.4' }],
        'code': ['13px', { lineHeight: '1.5' }],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
      },
      borderRadius: {
        'small': '8px',
        'medium': '12px',
        'large': '16px',
        'pill': '9999px',
      },
      boxShadow: {
        'card': '0 8px 24px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 12px 32px rgba(0, 0, 0, 0.12)',
        'modal': '0 20px 40px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
