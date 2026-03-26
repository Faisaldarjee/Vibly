/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vibly: {
          bg: '#0A0A0C',
          surface: '#121217',
          elevated: '#1A1A21',
          accent: '#007AFF',
          'accent-hover': '#3395FF',
          success: '#00D084',
          warning: '#FF9F0A',
          danger: '#FF3B30',
          muted: '#A1A1AA',
        }
      },
      fontFamily: {
        heading: ['Barlow Condensed', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
