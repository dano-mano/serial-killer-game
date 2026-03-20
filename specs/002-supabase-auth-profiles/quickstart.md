# Quickstart: Supabase Auth & User Profiles

**Feature**: 002-supabase-auth-profiles

## Prerequisites

1. Supabase project created with email/password auth enabled
2. `.env.local` at `apps/web/` (NOT repo root) with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Node.js 24.14.0 (matches `.nvmrc`)

## Install Dependencies

```bash
cd apps/web
npm install @supabase/ssr@0.9.0 @supabase/supabase-js@2.99.3
```

## Run Migration

Apply via Supabase Dashboard SQL editor or CLI:
```bash
supabase db push
# or copy contents of supabase/migrations/001_user_profiles.sql into Dashboard SQL editor
```

## Key Files (implementation order)

| # | File | Purpose |
|---|------|---------|
| 1 | `packages/shared/src/types/auth.ts` | UserProfile, AuthUser, UserProfileRow |
| 2 | `packages/shared/src/schemas/auth.ts` | Zod schemas (display name, login, signup, update profile) |
| 3 | `apps/web/src/config/auth/supabase.ts` | Auth config from centralized env |
| 4 | `apps/web/src/lib/supabase/client.ts` | Browser client factory (`'use client'`) |
| 5 | `apps/web/src/lib/supabase/server.ts` | Server client factory (`'server-only'`) |
| 6 | `apps/web/src/lib/supabase/proxy.ts` | Session refresh utility for proxy.ts |
| 7 | `apps/web/src/lib/safe-action/client.ts` | Safe action client + auth middleware |
| 8 | `apps/web/src/dal/auth/profiles.ts` | getProfile, updateProfile (AppError Results) |
| 9 | `apps/web/src/app/actions/auth/update-profile.ts` | Profile update Server Action |
| 10 | `apps/web/src/stores/auth.ts` | Zustand auth store (game engine bridge) |
| 11 | `apps/web/src/components/app/auth/*` | AuthProvider, LoginForm, SignupForm |
| 12 | `apps/web/src/app/(auth)/*` | Login, signup pages + auth layout |
| 13 | `apps/web/src/app/auth/callback/route.ts` | Auth callback handler |
| 14 | `apps/web/src/proxy.ts` | Extend with session refresh + route protection |

## Critical Patterns

### Error handling — use AppError factory
```typescript
import { AppError } from '@repo/shared/utils/result'
return AppError.notFound('Profile not found')   // NOT err({ type: 'NOT_FOUND' })
return AppError.database(error.message, error)   // NOT err({ type: 'DATABASE_ERROR' })
```

### Zod v4 validators
```typescript
z.url()          // NOT z.string().url()
z.email()        // NOT z.string().email()
z.uuid()         // NOT z.string().uuid()
```

### Cookie pattern — getAll/setAll ONLY
```typescript
cookies: {
  getAll() { return cookieStore.getAll() },
  setAll(cookiesToSet) { /* ... */ },
}
// NEVER use individual get(), set(), remove()
```

### next-safe-action — use .inputSchema()
```typescript
authActionClient
  .inputSchema(updateProfileSchema)   // NOT .schema()
  .action(async ({ parsedInput, ctx }) => { ... })
```

### Server-only modules — import guard
```typescript
import 'server-only'   // REQUIRED on: server.ts, proxy utility, DAL, env.ts
```

## Running Tests

```bash
npm test                    # All packages via Turborepo
npx turbo run test --filter=web    # Web app only
npx turbo run test --filter=shared # Shared package only
```

## Gotchas

- `.env.local` must be at `apps/web/`, not repo root
- Server-only modules need `resolve.alias` stub in Vitest config
- `next-safe-action` `.schema()` is deprecated — use `.inputSchema()`
- Server Components can't `setAll` cookies — wrap in try/catch, proxy handles refresh
- `createSupabaseServerClient` is async (awaits `cookies()`)
