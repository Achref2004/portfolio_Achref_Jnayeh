/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        portfolio: {
          navy: '#0D2F4F',
          gold: '#D4AF37',
          ivory: '#FAF7F2',
          white: '#FFFFFF',
          gray: '#5E6A73',
          'gold-light': '#F4E8C1',
          'navy-dark': '#071B2E',
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'plaque': '0 10px 35px -5px rgba(13, 47, 79, 0.08), 0 0 0 1px rgba(212, 175, 55, 0.2)',
        'plaque-hover': '0 20px 45px -5px rgba(13, 47, 79, 0.16), 0 0 0 1.5px rgba(212, 175, 55, 0.45)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}
