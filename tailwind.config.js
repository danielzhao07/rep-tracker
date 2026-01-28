/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0a0a',
          800: '#1a1a1a',
          700: '#2a2a2a',
        },
        gray: {
          600: '#3a3a3a',
          500: '#4a4a4a',
          400: '#6a6a6a',
          300: '#8a8a8a',
        },
        green: {
          500: '#10b981',
          600: '#059669',
          400: '#34d399',
        },
        error: '#ef4444',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
