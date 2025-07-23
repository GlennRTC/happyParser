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
        'medical-blue': '#1e3a8a',
        'medical-teal': '#0d9488',
        'medical-green': '#059669',
        'medical-red': '#dc2626',
        'medical-gray': '#6b7280',
        'medical-light': '#f8fafc',
        'medical-dark': '#0f172a',
        // Dark mode color variants
        'dark-bg': '#1a1a1a',
        'dark-surface': '#2d2d2d',
        'dark-border': '#404040',
        'dark-text': '#e5e5e5',
        'dark-text-secondary': '#a3a3a3',
      },
      fontFamily: {
        'medical': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}