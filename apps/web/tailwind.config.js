/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060a14',
          900: '#0a0f1e', // deep background
          850: '#0b1226',
          800: '#0d1530', // surface card
          750: '#0f1a3a',
          700: '#111827', // surface elevated
          600: '#1e293b',
          500: '#334155',
        },
        slate: {
          750: '#243044',
          850: '#141d2e',
        },
        cyber: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4', // main cyan accent
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          glow: 'rgba(6, 182, 212, 0.35)',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed', // main violet highlight
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        accent: {
          cyan: '#06b6d4',
          blue: '#0ea5e9',
          indigo: '#6366f1',
          violet: '#7c3aed',
        },
        surface: {
          base: '#0a0f1e',
          card: '#0d1530',
          elevated: '#111827',
          hover: '#152144',
          border: 'rgba(148, 163, 184, 0.1)',
          'border-active': 'rgba(6, 182, 212, 0.4)',
        },
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.25)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.55)',
          },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.25s ease-out forwards',
        slideUp: 'slideUp 0.3s ease-out forwards',
        slideDown: 'slideDown 0.3s ease-out forwards',
        'pulse-glow': 'pulse-glow 2.5s infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'cyber-sm': '0 0 10px rgba(6, 182, 212, 0.2)',
        'cyber-md': '0 0 20px rgba(6, 182, 212, 0.35)',
        'cyber-lg': '0 0 35px rgba(6, 182, 212, 0.5)',
      }
    },
  },
  plugins: [],
}
