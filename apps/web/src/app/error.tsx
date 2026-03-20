'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

/**
 * Root error boundary for route segments.
 *
 * Catches unhandled errors thrown during rendering within the route segment
 * and its children. Captures the error to Sentry for alerting and debugging,
 * then presents a user-friendly recovery UI with a retry button.
 *
 * For layout-level errors (e.g. errors in RootLayout), see global-error.tsx.
 */
export default function Error({
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
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h2>Something went wrong</h2>
      <p>An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        style={{
          padding: '0.5rem 1rem',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </main>
  )
}
