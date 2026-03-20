# Research: Supabase Auth & User Profiles

**Feature**: 002-supabase-auth-profiles
**Date**: 2026-03-20

## @supabase/ssr

**Decision**: Use @supabase/ssr v0.9.0
**Rationale**: Official Supabase package for server-side auth in Next.js App Router. Cookie-based session management with `getAll`/`setAll` pattern. Replaces deprecated `@supabase/auth-helpers-nextjs`.
**Alternatives considered**: @supabase/auth-helpers-nextjs (deprecated, removed from docs), manual JWT handling (unnecessary complexity, error-prone).

### API Surface

- `createBrowserClient(url, anonKey)` — client components, no cookie config needed
- `createServerClient(url, anonKey, { cookies: { getAll, setAll } })` — server contexts, per-request factory
- Cookie pattern: MUST use `getAll`/`setAll` only (individual get/set/remove causes auth issues in production)
- Server Component `setAll` needs try/catch (Server Components can't set cookies; proxy handles it)

### Proxy/Middleware Pattern

Create a per-request Supabase client in proxy.ts using `request.cookies.getAll()` for reads and `response.cookies.set()` for writes. Call `supabase.auth.getUser()` to refresh expired sessions. The `setAll` callback must update both request cookies (for downstream Server Components) and response cookies (for the browser).

### getClaims() vs getUser()

| Method | Network Call | Use In |
|--------|-------------|--------|
| `getClaims()` | No (async key validation) | Future proxy optimization |
| `getUser()` | Yes (Supabase API) | Proxy session refresh, Server Actions |
| `getSession()` | Never | NEVER use server-side |

**Decision**: Use `getUser()` everywhere for this implementation. `getClaims()` is a newer performance optimization — evaluate when API stabilizes further.

## @supabase/supabase-js

**Decision**: Use @supabase/supabase-js v2.99.3
**Rationale**: Required peer dependency of @supabase/ssr (^2.97.0). Latest stable release. No known CVEs.
**Install**: `npm install @supabase/ssr@0.9.0 @supabase/supabase-js@2.99.3` in apps/web

## API Key Naming

**Decision**: Keep existing `NEXT_PUBLIC_SUPABASE_ANON_KEY` env var name
**Rationale**: Supabase is migrating from `anon_key` → `publishable_key` (projects created after Nov 2025 use new format). This project already has `ANON_KEY` in env.ts, .env.example, CI workflows, and TECH_RESEARCH. Renaming is a separate migration task.
**Future**: Rename to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` when Supabase completes the migration.

## next-safe-action

**Decision**: Keep next-safe-action v8.1.8 (already installed)
**Rationale**: Latest stable. Provides type-safe Server Actions with Zod validation and middleware chaining.

### API Changes from User Input

| User Input | Actual API (v8.1.8) | Fix |
|------------|---------------------|-----|
| `.schema(zodSchema)` | `.inputSchema(zodSchema)` | `.schema()` is deprecated alias |
| Direct `getUser()` in action | `.use()` middleware | Centralizes auth check |

### Auth Middleware Pattern

```typescript
export const authActionClient = actionClient.use(async ({ next }) => {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) throw new Error('Not authenticated')
  return next({ ctx: { user, supabase } })
})
```

Actions then use: `authActionClient.inputSchema(schema).action(async ({ parsedInput, ctx }) => { ... })`

## Existing Codebase Alignment

### Error Handling

The user's code used `err({ type: 'NOT_FOUND', message })` but the project's established pattern is:

```typescript
// CORRECT — use AppError factory methods
import { AppError } from '@repo/shared/utils/result'
return AppError.notFound(`Profile not found for user ${userId}`)
return AppError.database(error.message, error)
return AppError.unauthorized('Not authenticated')
```

### Zod v4 Validators

Per session notes (`2026-03-20-zod-v4-deprecated-string-validators.md`):

```typescript
// CORRECT — Zod v4 top-level validators
z.url()          // NOT z.string().url()
z.uuid()         // NOT z.string().uuid()
z.iso.datetime() // NOT z.string().datetime()
```

### BaseDto Pattern

`UserProfile` should extend `BaseDto` from `@repo/shared/types/common`:

```typescript
import type { BaseDto } from '@repo/shared/types/common'

export interface UserProfile extends BaseDto {
  displayName: string
  avatarUrl: string | null
}
```

## Sources

- [Supabase SSR Docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase Next.js Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [@supabase/ssr npm](https://www.npmjs.com/package/@supabase/ssr) — v0.9.0, 2026-03-02
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) — v2.99.3, 2026-03-20
- [next-safe-action docs](https://next-safe-action.dev/docs/getting-started) — v8.1.8
