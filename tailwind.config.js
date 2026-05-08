/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        atlas: {
          dark: '#1e3a8a',
          primary: '#2563eb',
          light: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
