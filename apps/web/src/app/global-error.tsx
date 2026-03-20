'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

/**
 * Global error boundary — catches errors in the root layout and its children.
 *
 * This component replaces the entire document (including RootLayout) when an
 * error occurs at the layout level. It MUST include its own <html> and <body>
 * tags because the root layout is unavailable when this boundary activates.
 *
 * Captures the error to Sentry before rendering the recovery UI.
 * For route-segment errors (below the layout), see error.tsx.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h2>Something went wrong</h2>
        <p>A critical error occurred. Please try again.</p>
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 1rem',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
