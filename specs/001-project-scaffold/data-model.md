# Data Model: Project Scaffold

**Branch**: `001-project-scaffold` | **Date**: 2026-03-18

## Overview

The project scaffold has no database tables. The data model consists of shared TypeScript types and Zod schemas that form the foundation for all subsequent features.

## Base Types (`packages/shared/src/types/common.ts`)

### ID
- Format: UUID v4 string
- Purpose: Universal identifier for all entities across the project
- Usage: Primary keys, foreign keys, reference IDs

### Timestamp
- Format: ISO 8601 string (e.g., `2026-03-18T12:00:00.000Z`)
- Purpose: All date/time values across the project
- Usage: Created/updated timestamps, event times, session start/end

### BaseDto
- Fields: `id` (ID), `createdAt` (Timestamp), `updatedAt` (Timestamp)
- Purpose: Base shape for all data transfer objects returned by the DAL
- Usage: Every entity DTO extends this shape

## Error Types (`packages/shared/src/constants/errors.ts`)

### AppError Categories
- `VALIDATION` -- Input failed schema validation
- `NOT_FOUND` -- Requested resource does not exist
- `UNAUTHORIZED` -- Request lacks valid authentication
- `FORBIDDEN` -- Authenticated but insufficient permissions
- `DATABASE` -- Database operation failed
- `INTERNAL` -- Unexpected internal error

### AppError Shape
- `category` -- One of the error categories above
- `message` -- Human-readable error description
- `code` -- Optional machine-readable error code for client handling
- `cause` -- Optional original error for debugging (not serialized to client)

## Validation Schemas (`packages/shared/src/schemas/common.ts`)

### idSchema
- Validates UUID v4 format
- Used at every boundary where IDs are received

### timestampSchema
- Validates ISO 8601 datetime format
- Used for query parameters, form inputs involving dates

### paginationSchema
- `limit` -- Positive integer, default 20, max 100
- `offset` -- Non-negative integer, default 0
- Used by all list/query endpoints

## Result Pattern (`packages/shared/src/utils/result.ts`)

### Result<T, E>
- Wraps `neverthrow` Result type
- Success: `ok(value: T)` -- contains the success value
- Failure: `err(error: E)` -- contains a typed error
- Convention: DAL functions return `Result<DTO, AppError>`, game systems return `Result<GameState, GameError>`

### Utility Functions
- `ok(value)` -- Create a success result
- `err(error)` -- Create a failure result
- `AppError.validation(message)` -- Factory for validation errors
- `AppError.notFound(message)` -- Factory for not-found errors
- `AppError.unauthorized(message)` -- Factory for auth errors
- `AppError.database(message, cause?)` -- Factory for DB errors

## Environment Configuration (`apps/web/src/config/env.ts`)

### Validated Environment Shape
- `supabase.url` -- Supabase project URL (required, URL format)
- `supabase.anonKey` -- Supabase anonymous key (required, non-empty string)
- `supabase.serviceRoleKey` -- Supabase service role key (required server-only, non-empty string)
- `sentry.dsn` -- Sentry DSN (required, URL format)
- `posthog.key` -- PostHog API key (optional, string)
- `posthog.host` -- PostHog host URL (optional, URL format)
- `azure.blobStorageUrl` -- Azure Blob Storage base URL (optional, URL format)
- `logLevel` -- Log level for Pino logger (optional string, default: `'info'` in production, `'debug'` in development); sourced from `LOG_LEVEL` env var; all Pino log level access MUST go through this config field, never `process.env.LOG_LEVEL` directly (Constitution II)

### Rate Limit Configuration Shape (`apps/web/src/config/security/rate-limits.ts`)
- `auth` -- 5 points / 900s duration / 1800s block
- `api` -- 30 points / 60s duration / 60s block
- `actions` -- 20 points / 60s duration / 60s block
- `authenticated` -- 60 points / 60s duration / 30s block

### CSP Policy Configuration (`apps/web/src/proxy.ts`)
The Content Security Policy is built per-request in proxy.ts. The nonce is generated at runtime (`Buffer.from(crypto.randomUUID()).toString('base64')`) and is not stored — it exists only for the duration of one request/response cycle. The directive policy and allowed domains are static constants embedded in proxy.ts:

| Directive | Production Value | Development Addition | Rationale |
|-----------|-----------------|---------------------|-----------|
| `default-src` | `'self'` | — | Restrictive fallback |
| `script-src` | `'self' 'nonce-{nonce}' 'strict-dynamic'` | `'unsafe-eval'` | Nonce gates inline scripts; strict-dynamic propagates trust to dynamic imports; unsafe-eval needed for React dev error tooling |
| `style-src` | `'self' 'nonce-{nonce}'` | `'unsafe-inline'` | Nonce for Next.js inline styles; unsafe-inline needed for hot reload |
| `img-src` | `'self' blob: data:` | — | Game assets may use blob URLs; data URIs for small images |
| `font-src` | `'self'` | — | Fonts served from application origin |
| `connect-src` | `'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://*.ingest.sentry.io` | — | Supabase REST + WebSocket, PostHog analytics, Sentry error/replay upload |
| `worker-src` | `'self' blob:` | — | Sentry Session Replay + PostHog Session Replay web workers (blob URL requirement) |
| `object-src` | `'none'` | — | No plugins |
| `base-uri` | `'self'` | — | Prevent base tag hijacking |
| `form-action` | `'self'` | — | Server Actions submit to same origin only |
| `frame-ancestors` | `'none'` | — | Prevent clickjacking |
| `upgrade-insecure-requests` | (flag) | — | Force HTTPS for all subresources |

- Nonce propagation: Next.js 16 reads the nonce from the `x-nonce` request header and automatically applies it to all framework-generated scripts during SSR. Server Components can read the nonce from the `x-nonce` request header via `headers()` API to attach it to third-party `<Script>` components if needed.
- PostHog and Sentry SDKs are npm-bundled (not loaded from CDN), so no `script-src` entries are required for them — only `connect-src` and `worker-src`.
- Static pages are incompatible with per-request nonces. For this project that is acceptable because game pages are inherently dynamic (authenticated sessions, real-time state).

## Relationships

```
packages/shared/types/common.ts
  └── BaseDto (extended by every domain DTO in later features)
  └── ID (used as PK/FK type everywhere)
  └── Timestamp (used for all datetime fields)

packages/shared/constants/errors.ts
  └── Error categories (used by all Result-returning functions)

packages/shared/utils/result.ts
  └── Result<T,E> (used by DAL, game engine, and service layer)

packages/shared/schemas/common.ts
  └── Validation schemas (used at API boundaries, form validation)
```

No entity-to-entity relationships exist in the scaffold. These emerge in subsequent features (auth adds User, game features add Player, Match, etc.).
