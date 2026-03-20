import 'server-only'

/**
 * Rate limit configuration per endpoint category.
 *
 * Used by proxy.ts to create module-scope RateLimiterMemory singleton instances.
 * Each category represents a different endpoint class with appropriate thresholds.
 *
 * points: maximum number of requests allowed within the duration window
 * duration: window length in seconds (points reset after this period)
 * blockDuration: penalty period in seconds after limit is exceeded
 */

export interface RateLimitConfig {
  /** Maximum requests allowed within the duration window */
  readonly points: number
  /** Window length in seconds */
  readonly duration: number
  /** Block duration in seconds after limit is exceeded */
  readonly blockDuration: number
}

export interface RateLimitsConfig {
  /** Authentication endpoints: strict limits to prevent brute-force */
  readonly auth: RateLimitConfig
  /** General API endpoints: moderate limits */
  readonly api: RateLimitConfig
  /** Server Action endpoints: moderate limits for form submissions */
  readonly actions: RateLimitConfig
  /** Authenticated user endpoints: higher limits for logged-in users */
  readonly authenticated: RateLimitConfig
}

/**
 * Rate limit thresholds for each endpoint category.
 *
 * auth: 5 requests per 15 minutes, blocked for 30 minutes on excess
 *   Prevents brute-force login and signup attempts.
 *
 * api: 30 requests per minute, blocked for 1 minute on excess
 *   General API route protection.
 *
 * actions: 20 requests per minute, blocked for 1 minute on excess
 *   Server Action protection — slightly lower than api due to write semantics.
 *
 * authenticated: 60 requests per minute, blocked for 30 seconds on excess
 *   Higher threshold for authenticated users with a shorter recovery period.
 */
export const rateLimits: RateLimitsConfig = {
  auth: {
    points: 5,
    duration: 900, // 15 minutes
    blockDuration: 1800, // 30 minutes
  },
  api: {
    points: 30,
    duration: 60, // 1 minute
    blockDuration: 60, // 1 minute
  },
  actions: {
    points: 20,
    duration: 60, // 1 minute
    blockDuration: 60, // 1 minute
  },
  authenticated: {
    points: 60,
    duration: 60, // 1 minute
    blockDuration: 30, // 30 seconds
  },
} as const
