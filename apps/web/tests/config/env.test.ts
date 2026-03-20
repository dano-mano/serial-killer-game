import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Tests for environment configuration validation.
 *
 * Uses vi.stubEnv() + vi.resetModules() + dynamic import to test
 * the env config module, which caches its parsed result on first import.
 * Each test resets the module registry so env.ts re-runs its validation.
 */

const VALID_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  NEXT_PUBLIC_SENTRY_DSN: 'https://abc123@o123456.ingest.sentry.io/123456',
  NODE_ENV: 'test',
}

describe('env config', () => {
  beforeEach(() => {
    // Clear module registry so each test gets a fresh import of env.ts
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('accepts a valid configuration', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', VALID_ENV.NEXT_PUBLIC_SUPABASE_URL)
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', VALID_ENV.SUPABASE_SERVICE_ROLE_KEY)
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', VALID_ENV.NEXT_PUBLIC_SENTRY_DSN)
    vi.stubEnv('NODE_ENV', VALID_ENV.NODE_ENV)

    const { env } = await import('@/config/env')

    expect(env.supabase.url).toBe(VALID_ENV.NEXT_PUBLIC_SUPABASE_URL)
    expect(env.supabase.anonKey).toBe(VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    expect(env.supabase.serviceRoleKey).toBe(VALID_ENV.SUPABASE_SERVICE_ROLE_KEY)
    expect(env.sentry.dsn).toBe(VALID_ENV.NEXT_PUBLIC_SENTRY_DSN)
  })

  it('throws when a required variable is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', VALID_ENV.NEXT_PUBLIC_SUPABASE_URL)
    // Deliberately omit NEXT_PUBLIC_SUPABASE_ANON_KEY
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', VALID_ENV.SUPABASE_SERVICE_ROLE_KEY)
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', VALID_ENV.NEXT_PUBLIC_SENTRY_DSN)

    await expect(import('@/config/env')).rejects.toThrow(
      'Environment configuration is invalid',
    )
  })

  it('includes the variable name in the error message', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', VALID_ENV.NEXT_PUBLIC_SUPABASE_URL)
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', VALID_ENV.SUPABASE_SERVICE_ROLE_KEY)
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', VALID_ENV.NEXT_PUBLIC_SENTRY_DSN)

    await expect(import('@/config/env')).rejects.toThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  })

  it('throws when a URL-format variable has an invalid format', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'not-a-url')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', VALID_ENV.SUPABASE_SERVICE_ROLE_KEY)
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', VALID_ENV.NEXT_PUBLIC_SENTRY_DSN)

    await expect(import('@/config/env')).rejects.toThrow(
      'Environment configuration is invalid',
    )
  })

  it('treats empty string as missing for required variables', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', VALID_ENV.NEXT_PUBLIC_SUPABASE_URL)
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')  // empty string
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', VALID_ENV.NEXT_PUBLIC_SENTRY_DSN)

    await expect(import('@/config/env')).rejects.toThrow(
      'SUPABASE_SERVICE_ROLE_KEY',
    )
  })

  it('reports ALL missing variables at once rather than stopping at the first failure', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', VALID_ENV.SUPABASE_SERVICE_ROLE_KEY)
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', VALID_ENV.NEXT_PUBLIC_SENTRY_DSN)

    let errorMessage = ''
    try {
      await import('@/config/env')
    } catch (e) {
      errorMessage = e instanceof Error ? e.message : String(e)
    }

    expect(errorMessage).toContain('NEXT_PUBLIC_SUPABASE_URL')
    expect(errorMessage).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  })

  it('gracefully handles optional variables being absent', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', VALID_ENV.NEXT_PUBLIC_SUPABASE_URL)
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', VALID_ENV.SUPABASE_SERVICE_ROLE_KEY)
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', VALID_ENV.NEXT_PUBLIC_SENTRY_DSN)
    // Deliberately not setting optional vars: NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST,
    // AZURE_BLOB_STORAGE_URL, LOG_LEVEL

    const { env } = await import('@/config/env')

    expect(env.posthog.key).toBeUndefined()
    expect(env.posthog.host).toBeUndefined()
    expect(env.azure.blobStorageUrl).toBeUndefined()
  })

  it('defaults logLevel to debug in development', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', VALID_ENV.NEXT_PUBLIC_SUPABASE_URL)
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', VALID_ENV.SUPABASE_SERVICE_ROLE_KEY)
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', VALID_ENV.NEXT_PUBLIC_SENTRY_DSN)
    vi.stubEnv('NODE_ENV', 'development')

    const { env } = await import('@/config/env')

    expect(env.logLevel).toBe('debug')
  })

  it('defaults logLevel to info in production', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', VALID_ENV.NEXT_PUBLIC_SUPABASE_URL)
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', VALID_ENV.SUPABASE_SERVICE_ROLE_KEY)
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', VALID_ENV.NEXT_PUBLIC_SENTRY_DSN)
    vi.stubEnv('NODE_ENV', 'production')

    const { env } = await import('@/config/env')

    expect(env.logLevel).toBe('info')
  })

  it('uses LOG_LEVEL when explicitly set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', VALID_ENV.NEXT_PUBLIC_SUPABASE_URL)
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', VALID_ENV.SUPABASE_SERVICE_ROLE_KEY)
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', VALID_ENV.NEXT_PUBLIC_SENTRY_DSN)
    vi.stubEnv('LOG_LEVEL', 'warn')

    const { env } = await import('@/config/env')

    expect(env.logLevel).toBe('warn')
  })
})
