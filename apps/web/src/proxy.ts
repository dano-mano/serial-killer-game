import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimits } from '@/config/security/rate-limits'

/**
 * Proxy function (Next.js 16 equivalent of middleware.ts).
 *
 * Responsibilities (in order):
 * 1. Rate limiting per endpoint category (RateLimiterMemory singleton instances)
 * 2. Per-request CSP nonce generation
 * 3. Content-Security-Policy header on both request and response
 * 4. Additional security headers on response
 *
 * Rate limit rejection returns 429 with Retry-After header.
 * All other requests pass through with security headers applied.
 *
 * NODE_ENV check is the one allowed process.env access in this file —
 * proxy.ts is not in config/ but needs dev/prod branching for CSP directives.
 */

// ---------------------------------------------------------------------------
// Step 1: Module-scope singleton limiter instances
// ---------------------------------------------------------------------------

const authLimiter = new RateLimiterMemory({
  points: rateLimits.auth.points,
  duration: rateLimits.auth.duration,
  blockDuration: rateLimits.auth.blockDuration,
})

const apiLimiter = new RateLimiterMemory({
  points: rateLimits.api.points,
  duration: rateLimits.api.duration,
  blockDuration: rateLimits.api.blockDuration,
})

const actionsLimiter = new RateLimiterMemory({
  points: rateLimits.actions.points,
  duration: rateLimits.actions.duration,
  blockDuration: rateLimits.actions.blockDuration,
})

const authenticatedLimiter = new RateLimiterMemory({
  points: rateLimits.authenticated.points,
  duration: rateLimits.authenticated.duration,
  blockDuration: rateLimits.authenticated.blockDuration,
})

// ---------------------------------------------------------------------------
// Step 2: IP extraction and route-based limiter selection
// ---------------------------------------------------------------------------

/**
 * Extracts the client IP address from the request.
 * Prefers the x-forwarded-for header (set by Azure App Service load balancer)
 * and falls back to a static string that prevents bypassing limits entirely.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for may be a comma-separated list; the first entry is the client
    const first = forwarded.split(',')[0]
    if (first) {
      return first.trim()
    }
  }
  return 'unknown'
}

/**
 * Selects the appropriate rate limiter based on the request path.
 * Returns null for paths that should not be rate limited.
 */
function selectLimiter(pathname: string): RateLimiterMemory | null {
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/auth')) {
    return authLimiter
  }
  if (pathname.startsWith('/api/')) {
    return apiLimiter
  }
  if (pathname.startsWith('/_actions/') || pathname.includes('/actions/')) {
    return actionsLimiter
  }
  // Apply authenticated limiter as the default for all other matched paths
  return authenticatedLimiter
}

/**
 * Attempts to consume a rate limit point for the given IP and limiter.
 * Returns null on success, or a Response with 429 status on limit exceeded.
 */
async function applyRateLimit(
  limiter: RateLimiterMemory,
  ip: string,
): Promise<Response | null> {
  try {
    await limiter.consume(ip)
    return null
  } catch (err) {
    if (err instanceof RateLimiterRes) {
      const retryAfterSeconds = Math.ceil(err.msBeforeNext / 1000)
      return Response.json(
        { error: 'Too Many Requests', retryAfter: retryAfterSeconds },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        },
      )
    }
    // Unexpected error — fail open to avoid blocking legitimate traffic
    return null
  }
}

// ---------------------------------------------------------------------------
// Main proxy export
// ---------------------------------------------------------------------------

/**
 * Next.js 16 proxy function — runs on every matched request.
 * Named export `proxy` is required by Next.js 16 (replaces default middleware export).
 */
export async function proxy(request: NextRequest): Promise<Response> {
  const { pathname } = request.nextUrl

  // --- Rate limiting ---
  const limiter = selectLimiter(pathname)
  if (limiter !== null) {
    const ip = getClientIp(request)
    const rateLimitResponse = await applyRateLimit(limiter, ip)
    if (rateLimitResponse !== null) {
      return rateLimitResponse
    }
  }

  // ---------------------------------------------------------------------------
  // Step 3: Generate per-request nonce
  // ---------------------------------------------------------------------------
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // ---------------------------------------------------------------------------
  // Step 4: Build CSP header string with NODE_ENV check for dev-mode exceptions
  // ---------------------------------------------------------------------------
  const isDev = process.env.NODE_ENV === 'development'

  const cspHeader = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-inline'" : ''}`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://*.ingest.sentry.io`,
    `worker-src 'self' blob:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ')

  // ---------------------------------------------------------------------------
  // Steps 5 & 6: Set x-nonce and CSP on request headers
  // ---------------------------------------------------------------------------
  const requestHeaders = new Headers(request.headers)
  // Step 5: x-nonce for Server Components to read via headers() API
  requestHeaders.set('x-nonce', nonce)
  // Step 6 (request side): CSP on request headers for downstream reading
  requestHeaders.set('Content-Security-Policy', cspHeader)

  // Pass modified request headers to the downstream handler
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Step 6 (response side): CSP on response headers for browser enforcement
  response.headers.set('Content-Security-Policy', cspHeader)

  // ---------------------------------------------------------------------------
  // Step 7: Additional security headers
  // ---------------------------------------------------------------------------
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )

  return response
}

// ---------------------------------------------------------------------------
// Step 8: Matcher config
// ---------------------------------------------------------------------------

/**
 * Proxy matcher configuration.
 *
 * Excludes:
 * - _next/static  — static assets, no security headers needed
 * - _next/image   — image optimization responses
 * - favicon.ico   — browser favicon requests
 * - /monitoring   — Sentry tunnel route (must bypass proxy to avoid 429 on replays)
 * - prefetch requests (next-router-prefetch header or purpose=prefetch header)
 */
export const config = {
  matcher: [
    {
      source:
        '/((?!_next/static|_next/image|favicon\\.ico|monitoring).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
