/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'medical-blue': '#1e3a8a',
        'medical-teal': '#0d9488',
        'medical-green': '#059669',
        'medical-red': '#dc2626',
        'medical-gray': '#6b7280',
        'medical-light': '#f8fafc',
        'medical-dark': '#0f172a',
      },
      fontFamily: {
        'medical': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}