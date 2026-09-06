/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        game: {
          bg: '#12141A',
          surface: '#1A1D24',
          card: '#222630',
          cardHover: '#2A2E3B',
          border: '#313644',
          borderLight: '#434A5C',
          cream: '#F4EFE6',
          creamMuted: '#B8B2A7',
          creamDim: '#7A756C',
          b: '#E11D48', // Crimson Red
          i: '#D97706', // Warm Amber
          n: '#059669', // Forest Emerald
          g: '#EA580C', // Terracotta Orange
          o: '#7C3AED', // Royal Plum
          gold: '#F59E0B',
        }
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'ball-pop': 'ballPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'tile-stamp': 'tileStamp 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        ballPop: {
          '0%': { transform: 'scale(0.8) translateY(-16px)', opacity: '0' },
          '70%': { transform: 'scale(1.05) translateY(2px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        tileStamp: {
          '0%': { transform: 'scale(1.15)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
