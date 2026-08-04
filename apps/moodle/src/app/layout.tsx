import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'moodle-next — Research Platform',
  description: 'Contract-based modernisation of Moodle. Academic demo.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
