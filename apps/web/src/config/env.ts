import { z } from 'zod'

/**
 * Centralized environment configuration with Zod validation.
 *
 * This is the ONLY file allowed to access process.env directly.
 * All other code must import from this module.
 *
 * Fails fast at startup if any required variable is missing or malformed,
 * reporting ALL validation errors at once so operators can fix everything
 * in one deployment cycle rather than discovering issues one-by-one.
 */

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL' }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, { message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required' }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, { message: 'SUPABASE_SERVICE_ROLE_KEY is required' }),
  NEXT_PUBLIC_SENTRY_DSN: z.url({ message: 'NEXT_PUBLIC_SENTRY_DSN must be a valid URL' }),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.url({ message: 'NEXT_PUBLIC_POSTHOG_HOST must be a valid URL' }).optional(),
  AZURE_BLOB_STORAGE_URL: z.url({ message: 'AZURE_BLOB_STORAGE_URL must be a valid URL' }).optional(),
  LOG_LEVEL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

type RawEnv = z.infer<typeof envSchema>

function parseEnv(): RawEnv {
  // Treat empty strings as missing for required fields
  const raw = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY || undefined,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || undefined,
    AZURE_BLOB_STORAGE_URL: process.env.AZURE_BLOB_STORAGE_URL || undefined,
    LOG_LEVEL: process.env.LOG_LEVEL || undefined,
    NODE_ENV: process.env.NODE_ENV,
  }

  const result = envSchema.safeParse(raw)

  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n')

    throw new Error(
      `Environment configuration is invalid. Fix the following before starting the application:\n${errors}`,
    )
  }

  return result.data
}

const parsed = parseEnv()

/**
 * Typed, validated environment configuration.
 * All application code must access environment variables through this object.
 */
export const env = {
  supabase: {
    url: parsed.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: parsed.SUPABASE_SERVICE_ROLE_KEY,
  },
  sentry: {
    dsn: parsed.NEXT_PUBLIC_SENTRY_DSN,
  },
  posthog: {
    key: parsed.NEXT_PUBLIC_POSTHOG_KEY,
    host: parsed.NEXT_PUBLIC_POSTHOG_HOST,
  },
  azure: {
    blobStorageUrl: parsed.AZURE_BLOB_STORAGE_URL,
  },
  logLevel: parsed.LOG_LEVEL ?? (parsed.NODE_ENV === 'production' ? 'info' : 'debug'),
  nodeEnv: parsed.NODE_ENV,
} as const

export type Env = typeof env
