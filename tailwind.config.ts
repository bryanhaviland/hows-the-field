import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          sky: '#2563EB',
          'sky-light': '#7DD3FC',
          'sky-deep': '#1D4ED8',
          turf: '#16A34A',
          'turf-dark': '#15803D',
          dirt: '#C08552',
          sunshine: '#F59E0B',
          ink: '#111827',
          cream: '#FFFDF7',
        },
      },
    },
  },
  plugins: [],
}

export default config
