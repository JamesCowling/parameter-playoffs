/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        '99': '99px',
        '512': '512px',
        '384': '384px',
      },
    },
  },
  plugins: [],
}

