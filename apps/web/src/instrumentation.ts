export { captureRequestError as onRequestError } from '@sentry/nextjs'

/**
 * Next.js instrumentation hook — server-side Sentry registration.
 *
 * Called once when the server starts. Dynamically imports sentry.server.config.ts
 * for the nodejs runtime so Sentry initialises before any request is handled.
 *
 * The dynamic import is required to prevent the server config (which uses
 * 'server-only' patterns) from being bundled into the edge runtime.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
}
