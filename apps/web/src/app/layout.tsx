import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Research Platforms — Legacy Modernisation',
  description: 'Contract-based modernisation of open-source legacy platforms. Academic demo.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
