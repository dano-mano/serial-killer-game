---
vision: killer-vs-fed-roguelite
sequence: 02
name: auth-and-profiles
group: Foundation
group_order: 1
status: pending
depends_on:
  - "01: Turborepo structure, packages/shared/src/types/, packages/shared/src/schemas/, apps/web/src/config/env.ts, apps/web/src/lib/ singleton pattern, neverthrow Result utilities, Pino logger"
produces:
  - "Supabase browser and server client singletons in apps/web/src/lib/supabase/"
  - "Database migration supabase/migrations/001_user_profiles.sql with RLS"
  - "Shared types packages/shared/src/types/auth.ts (User, UserProfile, AuthSession)"
  - "Shared schemas packages/shared/src/schemas/auth.ts (Zod validation)"
  - "Generated database types packages/shared/src/types/database.ts"
  - "DAL module apps/web/src/dal/auth/profiles.ts (getProfile, updateProfile) returning Result<T,E>"
  - "Server Action apps/web/src/app/actions/auth/update-profile.ts (next-safe-action)"
  - "Auth pages: login/page.tsx, signup/page.tsx, callback/route.ts"
  - "Proxy session refresh and protected route logic in apps/web/src/proxy.ts"
  - "Auth config apps/web/src/config/auth/supabase.ts"
  - "Auth provider component apps/web/src/components/app/auth/auth-provider.tsx"
created: 2026-03-17
last_aligned: never
---

# Vision Piece 02: Auth and Profiles

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: project scaffold (foundation infrastructure)

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Integrate Supabase Auth into the Next.js 16 application to provide user authentication with email/password login and signup. Create the user profile system with a PostgreSQL table, Row Level Security policies, a Data Access Layer for server-side profile operations, and a Server Action for profile mutations. This establishes the identity system that all player-facing features (role selection, persistent progression, session history) will depend on.

### Overview

Authentication uses `@supabase/ssr` (NOT the deprecated `@supabase/auth-helpers-nextjs`) with cookie-based sessions for Next.js 16 compatibility. Two Supabase client singletons are required:

- **Browser client** (`apps/web/src/lib/supabase/client.ts`): Used inside `"use client"` components. Created with `createBrowserClient` from `@supabase/ssr`.
- **Server client** (`apps/web/src/lib/supabase/server.ts`): Used in Server Components, Server Actions, and Route Handlers. Created with `createServerClient` from `@supabase/ssr` using Next.js `cookies()`.

Both clients import Supabase URL and anon key from `apps/web/src/config/auth/supabase.ts`, which reads from the centralized env config at `apps/web/src/config/env.ts`. No direct `process.env` access elsewhere.

### Database Schema

**Migration file**: `supabase/migrations/001_user_profiles.sql`

```sql
-- user_profiles: one row per authenticated user, linked to auth.users
create table public.user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) >= 2 and char_length(display_name) <= 32),
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Trigger to auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Player'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS: enable row-level security
alter table public.user_profiles enable row level security;

-- Policy: any authenticated user can read any profile (for matchmaking, leaderboards)
create policy "profiles_select_all"
  on public.user_profiles for select
  to authenticated
  using (true);

-- Policy: users can only update their own profile
create policy "profiles_update_own"
  on public.user_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
```

### Shared Types

**`packages/shared/src/types/auth.ts`**:

```typescript
import type { ID, Timestamp } from './common'

export interface UserProfile {
  id: ID
  displayName: string
  avatarUrl: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AuthSession {
  userId: ID
  email: string
  profile: UserProfile | null
}

// Raw database row shape (snake_case, matches Supabase generated types)
export interface UserProfileRow {
  id: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}
```

Where `ID` and `Timestamp` are imported from `packages/shared/src/types/common.ts`:
- `type ID = string` (UUID format)
- `type Timestamp = string` (ISO 8601)

### Shared Schemas

**`packages/shared/src/schemas/auth.ts`**:

```typescript
import { z } from 'zod'

export const displayNameSchema = z
  .string()
  .min(2, 'Display name must be at least 2 characters')
  .max(32, 'Display name must be at most 32 characters')
  .regex(/^[a-zA-Z0-9_\- ]+$/, 'Display name may only contain letters, numbers, spaces, hyphens, and underscores')

export const avatarUrlSchema = z.string().url().nullable().optional()

export const updateProfileSchema = z.object({
  displayName: displayNameSchema,
  avatarUrl: avatarUrlSchema,
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
```

### Generated Database Types

Run `npx supabase gen types typescript --local > packages/shared/src/types/database.ts` as part of the development workflow. This file is generated (committed to repo, regenerated after migrations). It provides type-safe access to all Supabase table schemas including `user_profiles`.

Add an npm script to `apps/web/package.json`:
```json
"scripts": {
  "db:types": "supabase gen types typescript --local > ../../packages/shared/src/types/database.ts"
}
```

### Auth Configuration

**`apps/web/src/config/auth/supabase.ts`**:

```typescript
// Reads from centralized env config — no direct process.env access
import { env } from '../env'

export const supabaseAuthConfig = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const
```

The centralized env config at `apps/web/src/config/env.ts` (the Zod-validated environment config from the project scaffold) must include these variables validated with Zod.

### Supabase Client Singletons

**`apps/web/src/lib/supabase/client.ts`** (browser, "use client" only):
```typescript
'use client'
import { createBrowserClient } from '@supabase/ssr'
import { supabaseAuthConfig } from '../../config/auth/supabase'
import type { Database } from '@repo/shared/types/database'

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    supabaseAuthConfig.url,
    supabaseAuthConfig.anonKey,
  )
}
```

**`apps/web/src/lib/supabase/server.ts`** (server components, actions, route handlers):
```typescript
import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAuthConfig } from '../../config/auth/supabase'
import type { Database } from '@repo/shared/types/database'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    supabaseAuthConfig.url,
    supabaseAuthConfig.anonKey,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

Note: These are factory functions (not singletons in the traditional sense) because Next.js Server Components require fresh cookie access per request. The singleton pattern applies to browser clients.

### Data Access Layer

**`apps/web/src/dal/auth/profiles.ts`**:

```typescript
import 'server-only'
import { ok, err } from 'neverthrow'
import type { Result } from 'neverthrow'
import { createSupabaseServerClient } from '../../lib/supabase/server'
import { logger } from '../../lib/logger/pino'
import type { UserProfile } from '@repo/shared/types/auth'
import type { UpdateProfileInput } from '@repo/shared/schemas/auth'
import type { DatabaseError, NotFoundError } from '@repo/shared/utils/result'

function rowToDto(row: { id: string; display_name: string; avatar_url: string | null; created_at: string; updated_at: string }): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getProfile(userId: string): Promise<Result<UserProfile, NotFoundError | DatabaseError>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return err({ type: 'NOT_FOUND', message: `Profile not found for user ${userId}` })
    }
    logger.error({ userId, error }, 'Failed to fetch user profile')
    return err({ type: 'DATABASE_ERROR', message: error.message })
  }

  return ok(rowToDto(data))
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<Result<UserProfile, DatabaseError>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      display_name: input.displayName,
      avatar_url: input.avatarUrl ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    logger.error({ userId, error }, 'Failed to update user profile')
    return err({ type: 'DATABASE_ERROR', message: error.message })
  }

  return ok(rowToDto(data))
}
```

The error types `DatabaseError` and `NotFoundError` are defined in `packages/shared/src/utils/result.ts` (the neverthrow Result utilities from the project scaffold).

### Server Actions

**`apps/web/src/app/actions/auth/update-profile.ts`**:

```typescript
'use server'
import { createSafeActionClient } from 'next-safe-action'
import { updateProfileSchema } from '@repo/shared/schemas/auth'
import { updateProfile } from '../../../dal/auth/profiles'
import { createSupabaseServerClient } from '../../../lib/supabase/server'

const actionClient = createSafeActionClient()

export const updateProfileAction = actionClient
  .schema(updateProfileSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const result = await updateProfile(user.id, parsedInput)
    if (result.isErr()) {
      throw new Error(result.error.message)
    }

    return result.value
  })
```

### Auth Pages

**Route group**: `apps/web/src/app/(auth)/` — uses `AuthLayout` from `apps/web/src/components/app/common/` (installed by the design system feature). If design system is not yet available, use a minimal layout.

**`apps/web/src/app/(auth)/login/page.tsx`**:
- Email/password login form
- "Forgot password" link (Supabase password reset flow)
- Link to signup page
- Redirects to `/game/select-role` on success
- Displays error message on auth failure

**`apps/web/src/app/(auth)/signup/page.tsx`**:
- Email, password, confirm password, and display name fields
- Validates display name against `displayNameSchema` before submission
- Calls Supabase `signUp` with `display_name` in `options.data` (for trigger to use)
- Redirects to email verification notice or directly to game on success

**`apps/web/src/app/(auth)/callback/route.ts`** (Route Handler):
- Handles OAuth callback code exchange
- `GET /auth/callback?code=xxx` → exchanges code for session → redirects to `/game/select-role`
- Error cases redirect to `/login?error=auth_callback_failed`

### Proxy Session Refresh

**`apps/web/src/proxy.ts`** (Next.js 16 middleware, renamed from middleware.ts):

The proxy must refresh the Supabase session on every request so cookies stay fresh. It also enforces protected routes.

Protected routes (require authentication):
- `/game/*` — all game routes
- `/profile/*` — profile management

Public routes (accessible without auth):
- `/` — landing page
- `/(auth)/*` — login, signup, callback
- `/api/*` — API routes (individual handlers enforce auth)

Session refresh logic: On every request, create a Supabase server client and call `supabase.auth.getUser()`. If the session is expired, Supabase refreshes it automatically via the `@supabase/ssr` cookie handling. If the user is unauthenticated and the route is protected, redirect to `/login`.

### Auth Provider Component

**`apps/web/src/components/app/auth/auth-provider.tsx`**:

```typescript
'use client'
```

A React context provider that:
- Creates a Supabase browser client
- Subscribes to `onAuthStateChange` events
- Exposes `user`, `session`, `isLoading`, and `signOut()` via context
- Does NOT expose raw Supabase client — provide typed convenience methods only

Usage: Wrap `apps/web/src/app/layout.tsx` with this provider so all client components can access auth state without prop drilling.

### Auth State in the React-Phaser Boundary

Auth state flows into the game via Zustand. The `player` Zustand store (at `apps/web/src/stores/player.ts`, produced by the game engine bootstrap feature) will include a `userId` and `displayName` field. The `AuthProvider` component writes to this store when auth state changes. Phaser reads these values through the EventBus or directly from the store reference — it does NOT import React or the AuthProvider.

Specifically:
- `AuthProvider` subscribes to auth changes → updates Zustand `player` store
- Phaser boot scene reads `player` store values (userId, displayName) before starting a run
- If user is not authenticated when entering `/game`, the proxy redirects to `/login`

### Edge Cases

- **Profile missing**: The `on_auth_user_created` trigger creates a profile automatically. However, DAL must handle the case where the trigger failed (return `NotFoundError`, not panic).
- **Display name conflict**: No uniqueness constraint on `display_name` — players are identified by UUID, display names are cosmetic only.
- **Session expiry during gameplay**: The proxy refreshes sessions on page loads. For long in-game sessions, the Supabase client auto-refreshes via background token refresh built into `@supabase/ssr`.
- **Avatar URL**: Optional, nullable. No file upload in this piece — accept external URL only. File upload to Azure Blob Storage is a later enhancement.
- **Email verification**: Supabase can require email verification before login. Behavior depends on Supabase project settings — the app should handle the `email_not_confirmed` error gracefully and show a friendly message.

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

Use `@supabase/ssr` exclusively — this is the current package for Next.js App Router. The deprecated `@supabase/auth-helpers-nextjs` must NOT be used. Check the installed version with `npm ls @supabase/ssr` to confirm.

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| @supabase/ssr | latest | Cookie-based auth for Next.js App Router |
| @supabase/supabase-js | latest | Core Supabase client (peer dep of @supabase/ssr) |
| next-safe-action | latest | Server Action validation with Zod |
| neverthrow | latest | Result<T,E> pattern (from project scaffold) |
| zod | latest | Schema validation |

### Implementation Order

1. Install `@supabase/ssr` and `@supabase/supabase-js`
2. Add env vars to centralized config (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
3. Create auth config module (`apps/web/src/config/auth/supabase.ts`)
4. Create Supabase browser client factory (`apps/web/src/lib/supabase/client.ts`)
5. Create Supabase server client factory (`apps/web/src/lib/supabase/server.ts`)
6. Write and run database migration (`supabase/migrations/001_user_profiles.sql`)
7. Generate TypeScript types (`npm run db:types`)
8. Create DAL module (`apps/web/src/dal/auth/profiles.ts`)
9. Create Server Action (`apps/web/src/app/actions/auth/update-profile.ts`)
10. Update proxy.ts for session refresh and route protection
11. Create AuthProvider component
12. Create auth pages (login, signup, callback)
13. Write tests

### Testing Strategy

**Unit tests** (`apps/web/tests/dal/auth/profiles.test.ts`):
- Mock Supabase client (vitest `vi.mock`)
- Test `getProfile` returns `ok(profile)` on success
- Test `getProfile` returns `err(NotFoundError)` when row missing
- Test `updateProfile` returns `ok(profile)` on success
- Test `updateProfile` returns `err(DatabaseError)` on Supabase error

**Unit tests** (`packages/shared/tests/schemas/auth.test.ts`):
- Test `displayNameSchema` accepts valid names
- Test `displayNameSchema` rejects names under 2 chars, over 32 chars, and with invalid characters
- Test `updateProfileSchema` validates correctly

**Component tests** (`apps/web/tests/components/app/auth/auth-provider.test.tsx`):
- Renders children
- Provides auth context (mock Supabase)
- Calls signOut correctly

**E2E tests** (`apps/web/tests/e2e/auth.test.ts`) — Playwright:
- User can sign up with valid credentials
- User is redirected to login after signup (if email verification required)
- User can log in with valid credentials
- Protected route redirects unauthenticated user to login
- User can log out

### Constitution Compliance Checklist

- [x] I: No barrel files — direct imports to source files only
- [x] II: Centralized config — `config/auth/supabase.ts` reads from `config/env.ts`
- [x] III: Shared types in `packages/shared/src/types/auth.ts`
- [x] VII: Explicit boundaries — browser client has `"use client"`, server client imports `"server-only"`
- [x] VIII: Singleton/factory pattern — one instantiation point per client type
- [x] XI: Zod validation — `schemas/auth.ts` for all input
- [x] XII: DAL — all DB access through `dal/auth/profiles.ts`
- [x] XIII: Server Actions — mutations via `next-safe-action`
- [x] XVI: Zero-trust — server-side auth validation in every DAL function and action
- [x] XVII: RLS on `user_profiles` table
- [x] XVIII: `SUPABASE_SERVICE_ROLE_KEY` is server-only, never in `NEXT_PUBLIC_*`
- [x] XXVI: Tests in `tests/` at package root

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

When this piece is fully implemented, it should produce:

- `supabase/migrations/001_user_profiles.sql` — table definition, trigger, RLS policies
- `packages/shared/src/types/auth.ts` — `UserProfile`, `AuthSession`, `UserProfileRow`
- `packages/shared/src/types/database.ts` — generated Supabase TypeScript types
- `packages/shared/src/schemas/auth.ts` — `displayNameSchema`, `updateProfileSchema`
- `apps/web/src/config/auth/supabase.ts` — reads URL + anon key from env config
- `apps/web/src/lib/supabase/client.ts` — browser client factory
- `apps/web/src/lib/supabase/server.ts` — server client factory
- `apps/web/src/dal/auth/profiles.ts` — `getProfile`, `updateProfile`
- `apps/web/src/app/actions/auth/update-profile.ts` — safe action
- `apps/web/src/proxy.ts` — updated with session refresh + route protection
- `apps/web/src/components/app/auth/auth-provider.tsx` — auth context
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/signup/page.tsx`
- `apps/web/src/app/(auth)/callback/route.ts`

### Dependencies Consumed (from Project Scaffold)

All of the following are produced by piece 01 and must be in place before this piece begins:

- **Turborepo workspace** — `turbo.json`, `package.json` workspaces
- **Centralized env config** — `apps/web/src/config/env.ts` (Zod-validated, with SUPABASE_URL and SUPABASE_ANON_KEY)
- **neverthrow Result utilities** — `packages/shared/src/utils/result.ts` (exports `ok`, `err`, `AppError`, `DatabaseError`, `NotFoundError`, `UnauthorizedError`)
- **Pino logger singleton** — `apps/web/src/lib/logger/pino.ts` (used in DAL for error logging)
- **Shared types scaffold** — `packages/shared/src/types/common.ts` (provides `ID`, `Timestamp`)
- **`packages/shared/src/schemas/common.ts`** — base Zod schemas (`idSchema`, `timestampSchema`)
- **`apps/web/src/lib/` pattern** — established singleton/factory location
- **`apps/web/src/proxy.ts`** — exists as Next.js middleware, ready to extend

### Produces (for Downstream Pieces)

Downstream pieces consume these outputs:

- **`AuthSession`** and **`UserProfile`** types — piece 07 (player-and-roles) reads user profile to populate player display name and avatar
- **`createSupabaseServerClient`** — every subsequent piece with a DAL imports this factory
- **`createSupabaseBrowserClient`** — any client component needing auth state imports this
- **`AuthProvider`** — wraps the app layout; downstream pieces can access auth context
- **`user_profiles` table** — piece 13 (persistent-progression) joins against this table for player stats
- **`getProfile` DAL function** — piece 07 calls this to load player profile before a run
- **Protected route logic in `proxy.ts`** — extended by later pieces as new protected routes are added

### Success Criteria

- [ ] `npm run db:types` generates `packages/shared/src/types/database.ts` without errors
- [ ] User can sign up with email and display name
- [ ] User can log in with valid credentials
- [ ] User is redirected to `/login` when accessing `/game/*` without authentication
- [ ] `getProfile` returns a valid DTO for an existing user
- [ ] `updateProfile` updates display name and reflects in subsequent `getProfile` calls
- [ ] `SUPABASE_SERVICE_ROLE_KEY` does not appear in any `NEXT_PUBLIC_*` variable or client bundle
- [ ] All DAL functions return `Result<T,E>` (never throw)
- [ ] Vitest tests pass for schemas and DAL

### Alignment Notes

This piece runs in parallel with design-system (piece 03) and game-engine-bootstrap (piece 04). None of those pieces depend on auth being complete, and auth does not depend on them. All three can be developed simultaneously against the project scaffold.

The `proxy.ts` established in piece 01 is a stub. This piece extends it with real session refresh logic. Later pieces do NOT need to modify `proxy.ts` unless they introduce new route protection requirements.

The `display_name` field is intentionally minimal — no avatar file upload, no social features. Persistent progression (piece 13) will extend the profile concept with game stats.
