import * as Sentry from '@sentry/nextjs'

/**
 * Sentry client-side initialization.
 *
 * This file runs in the browser. It uses process.env.NEXT_PUBLIC_SENTRY_DSN directly
 * because env.ts imports 'server-only' and cannot be loaded in client bundles.
 * NEXT_PUBLIC_* variables are statically inlined by Next.js at build time, so
 * this is safe and correct for the client-side init pattern.
 *
 * Session Replay is configured with maximum privacy settings (maskAllText,
 * maskAllInputs, blockAllMedia) to avoid capturing sensitive user data.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
  enableLogs: true,
  // Session Replay: capture 10% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
})

/**
 * Required export for Next.js App Router navigation tracking.
 * Records navigation spans in Sentry when routes transition.
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
