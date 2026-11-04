/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdfbf7',
          100: '#fbf7ee',
          200: '#f6eedc',
          300: '#efe2c5',
          400: '#e5d1a5',
          500: '#d7bc82',
        },
        sand: {
          50: '#f8f6f0',
          100: '#f2eee3',
          200: '#e5decb',
          300: '#d4c7ad',
          400: '#bfab8b',
          500: '#ab916f',
        },
        coffee: {
          50: '#fbf7f4',
          100: '#f5ede6',
          200: '#eadacc',
          300: '#dbbeaa',
          400: '#c79d84',
          500: '#b47e62',
          600: '#9d6348',
          700: '#7f4e39',
          800: '#5c3727',
          900: '#3d2419',
          950: '#26150f',
        },
        caramel: {
          DEFAULT: '#c2884d',
          dark: '#9c6630',
          light: '#e0aa6d',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
