import 'server-only'

import pino from 'pino'

import { env } from '@/config/env'

/**
 * Singleton Pino logger instance.
 *
 * This module is server-only — importing it in client components will throw at build time.
 *
 * - Development: human-readable output via pino-pretty transport
 * - Production: structured JSON for log aggregation pipelines
 *
 * Log level is determined by the LOG_LEVEL env var, defaulting to 'debug' in
 * development and 'info' in production. All server code imports this logger;
 * console.log is prohibited by ESLint.
 */
const logger = pino(
  {
    level: env.logLevel,
  },
  env.nodeEnv !== 'production'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      })
    : undefined,
)

export { logger }
