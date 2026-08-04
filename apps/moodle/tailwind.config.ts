import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#005a9e', dark: '#004071' },
      },
    },
  },
  plugins: [],
}
export default config
