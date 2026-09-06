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
        bingo: {
          bg: '#090D16',
          card: '#111726',
          cardLight: '#182033',
          border: '#1F293D',
          hover: '#26334D',
          b: '#EC4899', // Pink/Rose
          i: '#38BDF8', // Cyan/Sky
          n: '#F59E0B', // Amber
          g: '#10B981', // Emerald
          o: '#8B5CF6', // Purple/Violet
        }
      },
      animation: {
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pop-in': 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'ball-drop': 'ballDrop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        popIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        ballDrop: {
          '0%': { transform: 'translateY(-20px) scale(0.7)', opacity: '0' },
          '70%': { transform: 'translateY(4px) scale(1.05)', opacity: '1' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
