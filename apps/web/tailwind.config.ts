import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: { 0: 'var(--surface-0)', 1: 'var(--surface-1)' },
        ink: { 1: 'var(--ink-1)', 2: 'var(--ink-2)', 3: 'var(--ink-3)' },
        series: { 1: 'var(--series-1)', 2: 'var(--series-2)', 3: 'var(--series-3)' },
        status: { good: 'var(--status-good)', warning: 'var(--status-warning)', serious: 'var(--status-serious)', critical: 'var(--status-critical)' },
        track: 'var(--track)',
        // Moodle brand (blue) and GLPI brand (indigo) — namespaced literals so
        // opacity modifiers (ring/border) work correctly.
        mbrand: { DEFAULT: '#2a78d6', dark: '#1e5aa6', light: '#eaf2fc' },
        gbrand: { DEFAULT: '#3d5afe', dark: '#2a3eb1', light: '#e8ebff' },
        rbrand: { DEFAULT: '#b0413e', dark: '#8a2f2c', light: '#f7e7e6' },
        teal: { DEFAULT: '#1baf7a', dark: '#0d7a55', light: '#e2f4ec' },
        danger: { light: '#fbe6e6' },
      },
      fontFamily: { sans: ['ui-sans-serif','-apple-system','BlinkMacSystemFont','Segoe UI','Roboto','Inter','Helvetica Neue','Arial','sans-serif'] },
      boxShadow: {
        card: '0 1px 2px rgba(11,11,11,0.04), 0 4px 16px rgba(11,11,11,0.06)',
        cardHover: '0 2px 4px rgba(11,11,11,0.06), 0 12px 32px rgba(11,11,11,0.10)',
      },
    },
  },
  plugins: [],
}
export default config
