/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark':   '#060B18',
        'brand-deeper': '#0A1128',
        'brand-card':   '#0F1B2E',
        'brand-card-hover': '#162236',
        'brand-border': '#1E3A5F',
        'brand-accent': '#00D4FF',
        'brand-accent2':'#7C3AED',
        'brand-glow':   '#00D4FF',
        'brand-success':'#10B981',
        'brand-warn':   '#F59E0B',
        'brand-danger': '#EF4444',
        'brand-orange': '#F97316',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scan-line': 'scanLine 4s linear infinite',
        'border-glow': 'borderGlow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 5px rgba(0, 212, 255, 0.2), 0 0 10px rgba(0, 212, 255, 0.1)' },
          '100%': { boxShadow: '0 0 15px rgba(0, 212, 255, 0.4), 0 0 30px rgba(0, 212, 255, 0.2)' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        borderGlow: {
          '0%':   { borderColor: 'rgba(0, 212, 255, 0.3)' },
          '100%': { borderColor: 'rgba(0, 212, 255, 0.8)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
