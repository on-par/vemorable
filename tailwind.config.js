/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#1a1a1a',
        'surface-light': '#2a2a2a',
        primary: '#6366f1',
        'primary-light': '#818cf8',
        accent: '#22c55e',
        muted: '#71717a',
        text: '#fafafa',
        'text-secondary': '#a1a1aa',
      },
    },
  },
  plugins: [],
};
