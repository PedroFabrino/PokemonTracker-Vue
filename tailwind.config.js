/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'bounce-subtle': 'bounce 1s ease-in-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      colors: {
        pokemon: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        fire: '#FF6B35',
        water: '#4A90E2',
        grass: '#7ED321',
        electric: '#F5A623',
        psychic: '#BD10E0',
        ice: '#50E3C2',
        dragon: '#9013FE',
        dark: '#4A4A4A',
        fighting: '#D0021B',
        poison: '#B347D9',
        ground: '#8B4513',
        flying: '#87CEEB',
        bug: '#417505',
        rock: '#8D6E63',
        ghost: '#7B68EE',
        steel: '#9E9E9E',
        fairy: '#FFB6C1',
        normal: '#9B9B9B',
      },
      gridTemplateColumns: {
        'binder': 'repeat(4, 1fr)', // 4x4 Pokemon binder grid
        'auto-fit-cards': 'repeat(auto-fit, minmax(200px, 1fr))',
      },
      aspectRatio: {
        'card': '3/4', // Pokemon card aspect ratio
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
