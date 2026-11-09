/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shelter: {
          primary: '#1e40af', // Blue 800
          accent: '#0284c7',  // Sky 600
          danger: '#dc2626',  // Red 600
          warning: '#f59e0b', // Amber 500
          success: '#10b981', // Emerald 500
        }
      }
    },
  },
  plugins: [],
}

