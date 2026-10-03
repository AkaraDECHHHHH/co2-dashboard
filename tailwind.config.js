/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#090d16', 900: '#0f172a', 800: '#1e293b', 700: '#2b3a52' },
        crisis: { 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
        ember: { 400: '#fb923c', 500: '#f97316', 600: '#ea580c' },
        amberx: { 400: '#fbbf24', 500: '#f59e0b' },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'Impact', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(220,38,38,.28), 0 0 28px -8px rgba(220,38,38,.35)',
      },
      keyframes: {
        drawer: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        fade: { from: { opacity: 0 }, to: { opacity: 1 } },
      },
      animation: {
        drawer: 'drawer .28s cubic-bezier(.2,.8,.2,1) both',
        fade: 'fade .2s ease-out both',
      },
    },
  },
  plugins: [],
};
