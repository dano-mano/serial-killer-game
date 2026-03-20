import 'server-only'
import * as Sentry from '@sentry/nextjs'

import { env } from '@/config/env'

/**
 * Sentry server-side initialization.
 *
 * Imported by instrumentation.ts register() function for the nodejs runtime.
 * Uses pinoIntegration to intercept Pino log calls at the Sentry SDK level —
 * this requires NO changes to the Pino logger singleton (Constitution Principle VIII).
 *
 * pinoIntegration docs:
 * - errorLevels: Pino levels that map to Sentry error events
 * - logLevels: Pino levels that forward as Sentry log breadcrumbs
 */
Sentry.init({
  dsn: env.sentry.dsn,
  tracesSampleRate: env.nodeEnv === 'production' ? 0.1 : 1.0,
  integrations: [
    Sentry.pinoIntegration({
      error: {
        levels: ['error', 'fatal'],
      },
      log: {
        levels: ['info', 'warn', 'error', 'fatal'],
      },
    }),
  ],
  enableLogs: true,
})
