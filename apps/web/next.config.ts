import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pino', 'pino-pretty'],
  transpilePackages: ['@repo/shared', '@repo/ui-theme', '@repo/game-engine'],
}

export default withSentryConfig(nextConfig, {
  // Sentry organization and project from SENTRY_ORG / SENTRY_PROJECT env vars
  // SENTRY_AUTH_TOKEN is used for source map upload during build (CI only)
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  sourcemaps: {
    deleteSourcemapsAfterUpload: process.env.NODE_ENV === 'production',
  },
})
