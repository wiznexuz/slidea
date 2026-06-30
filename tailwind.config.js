/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          light: '#F5E6C8',
          DEFAULT: '#C9A84C',
          dark:  '#A07830',
        }
      }
    },
  },
  plugins: [],
}