/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        arc: {
          bg: '#F0EDE8',
          surface: '#E8E4DE',
          card: '#EDEAE4',
          border: '#D4CFC8',
          muted: '#9E9890',
          text: '#1A1916',
          accent: '#C84B31',
          gold: '#C9A84C',
          blue: '#2B5BA1',
        }
      },
      boxShadow: {
        'neo': '6px 6px 12px #C8C4BE, -6px -6px 12px #FFFFFF',
        'neo-sm': '3px 3px 6px #C8C4BE, -3px -3px 6px #FFFFFF',
        'neo-inset': 'inset 4px 4px 8px #C8C4BE, inset -4px -4px 8px #FFFFFF',
        'neo-pressed': 'inset 2px 2px 5px #C8C4BE, inset -2px -2px 5px #FFFFFF',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        }
      }
    },
  },
  plugins: [],
}
