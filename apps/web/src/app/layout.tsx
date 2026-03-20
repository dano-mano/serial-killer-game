import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Serial Killer Game',
  description: 'A browser-based roguelite where detectives hunt a serial killer through procedurally generated cities.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
