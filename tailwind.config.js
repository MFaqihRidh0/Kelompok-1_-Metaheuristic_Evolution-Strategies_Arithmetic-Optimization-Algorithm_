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
        cyber: {
          950: '#06090e',
          900: '#0b0f17',
          850: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          cyan: '#06b6d4',
          sky: '#38bdf8',
          emerald: '#10b981',
          mint: '#34d399',
          gold: '#f59e0b',
          amber: '#fbbf24',
          purple: '#8b5cf6',
          violet: '#a855f7',
          pink: '#ec4899',
          rose: '#f43f5e',
          lime: '#84cc16'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}

