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
  - "Supabase browser and server client factories in apps/web/src/lib/supabase/ (per-request, not singletons)"
  - "Supabase proxy session refresh utility apps/web/src/lib/supabase/proxy.ts"
  - "Safe-action client with auth middleware apps/web/src/lib/safe-action/client.ts"
  - "Database migration supabase/migrations/001_user_profiles.sql with RLS"
  - "Shared types packages/shared/src/types/auth.ts (UserProfile extends BaseDto, AuthUser, UserProfileRow)"
  - "Shared schemas packages/shared/src/schemas/auth.ts (displayName, updateProfile, login, signup)"
  - "Generated database types packages/shared/src/types/database.ts"
  - "DAL module apps/web/src/dal/auth/profiles.ts (getProfile, updateProfile) returning Result<T, AppError>"
  - "Server Action apps/web/src/app/actions/auth/update-profile.ts (authActionClient with .use() middleware)"
  - "Auth pages: login/page.tsx, signup/page.tsx, auth/callback/route.ts"
  - "Proxy session refresh, route protection, and auth redirect logic in apps/web/src/proxy.ts"
  - "Auth config apps/web/src/config/auth/supabase.ts"
  - "Auth provider component apps/web/src/components/app/auth/auth-provider.tsx"
  - "Zustand auth store apps/web/src/stores/auth.ts (game engine bridge)"
created: 2026-03-17
last_aligned: 2026-03-20
---

# Vision Piece 02: Auth and Profiles

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: project scaffold (foundation infrastructure)

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Integrate Supabase Auth into the Next.js 16 application to provide user authentication with email/password login and signup. Create the user profile system with a database table protected by Row Level Security policies, a Data Access Layer for server-side profile operations, and a Server Action for profile mutations. This establishes the identity system that all player-facing features (role selection, persistent progression, session history) will depend on.

### Overview

Authentication uses cookie-based sessions managed by the Supabase SSR library — not the deprecated auth helpers package. Two Supabase client factories are required: one for use inside client components, and one for use in Server Components, Server Actions, and Route Handlers (which must read cookies fresh on each request). Both factories read credentials from the centralized environment config module — no direct environment variable access.

### User Profile Data Model

A User Profile represents a player's public identity within the game. Each profile belongs to exactly one authenticated user.

Key fields:
- **id**: UUID, primary key, linked to the authenticated user identity (cascades on user deletion)
- **display name**: The player's chosen name shown to others, 2–32 characters, alphanumeric with spaces, hyphens, and underscores. Not unique — players are identified by UUID, not display name.
- **avatar URL**: An optional URL to a profile image. Nullable. No file upload in this piece — external URLs only.
- **created at / updated at**: Timestamps

When a new user signs up, a profile row is automatically created with a default display name of "Player" (or whatever name the user provided during signup). This is enforced at the database level via an insert trigger.

### Data Access Rules

Row Level Security is enforced on the user profiles table:
- Any authenticated user may read any profile (required for matchmaking and leaderboards)
- A user may only update their own profile (enforced by checking the authenticated user's ID against the row ID)

### Validation Rules

Display name validation:
- Minimum 2 characters
- Maximum 32 characters
- Allowed characters: letters, numbers, spaces, hyphens, underscores

Avatar URL: must be a valid URL if provided, nullable, optional.

### Auth Pages

**Login page** (`/login`):
- Email and password fields
- A "Forgot password" link that triggers Supabase's password reset flow
- A link to the signup page
- On success: redirect to `/game/select-role`
- On failure: display a user-friendly error message (invalid credentials, account not found, etc.)

**Signup page** (`/signup`):
- Email, password, confirm password, and display name fields
- Validates display name format before submission
- Passes the display name through signup metadata so the auto-create trigger can use it
- On success: redirect to email verification notice (if verification is required) or directly to the game

**Auth callback route** (`/auth/callback`):
- Handles the OAuth code exchange for magic link and social login flows
- On success: redirect to `/game/select-role`
- On failure: redirect to `/login` with an error parameter

**Route group**: all auth pages live under an `(auth)` route group and use the `AuthLayout` component from the design system piece. If the design system is not yet available, a minimal centered layout suffices.

### Session Refresh and Route Protection

The Next.js proxy (middleware) is extended to refresh the Supabase session cookie on every request. On each request:
1. A Supabase server client is created
2. `getUser()` is called — this refreshes an expired session automatically
3. If the user is unauthenticated and the route is protected, redirect to `/login`

Protected routes (require authentication): `/game/*`, `/profile/*`

Public routes: `/` (landing), `/(auth)/*` (login, signup, callback), `/api/*` (each handler enforces its own auth)

### Auth Provider Component

A React context provider wraps the entire app layout, providing auth state to all client components without prop drilling. The provider:
- Creates a Supabase browser client
- Subscribes to auth state change events
- Exposes `user`, `session`, `isLoading`, and a `signOut()` function via context
- Does NOT expose the raw Supabase client — only typed convenience methods

### Auth State Flow to the Game Engine

Auth state must flow into the Phaser game world without Phaser importing any React code. The bridge:
- The Auth Provider observes auth state changes and writes `userId` and `displayName` into the player Zustand store (produced by the game engine bootstrap piece)
- Phaser scenes read these values from the store or via the EventBus before starting a run
- If the user is not authenticated when they reach `/game`, the proxy redirects them to `/login` before the page ever mounts

### Edge Cases

- **Profile missing**: The database trigger creates a profile automatically on signup, but if the trigger fails, the DAL must return a not-found error rather than crashing.
- **Display name conflict**: No uniqueness constraint — display names are cosmetic only. Players are always identified by UUID internally.
- **Session expiry during gameplay**: The proxy refreshes sessions on page loads. For long in-game sessions, the Supabase SSR library handles background token refresh automatically.
- **Avatar URL**: Optional, nullable, no file upload in this piece. File upload to blob storage is a future enhancement.
- **Email verification**: Supabase may require email verification before login depending on project settings. The app must handle the `email_not_confirmed` error gracefully with a friendly, actionable message.
- **Authenticated users on auth pages**: If an already-authenticated player navigates to `/login` or `/signup`, redirect them to `/game/select-role`.
- **Post-login redirect**: When route protection redirects an unauthenticated visitor to `/login`, preserve the originally requested URL. After login, redirect to that URL (fallback: `/game/select-role`).

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

Use `@supabase/ssr` exclusively — this is the current package for Next.js App Router. The deprecated `@supabase/auth-helpers-nextjs` must NOT be used. Check the installed version with `npm ls @supabase/ssr` to confirm.

### Database Schema — `supabase/migrations/001_user_profiles.sql`

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

-- RLS
alter table public.user_profiles enable row level security;

create policy "profiles_select_all"
  on public.user_profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.user_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
```

### Shared Types — `packages/shared/src/types/auth.ts`

```typescript
import type { BaseDto } from './common'

// Application DTO — camelCase, extends BaseDto
export interface UserProfile extends BaseDto {
  displayName: string
  avatarUrl: string | null
}

// Auth state for React context and Zustand store
export interface AuthUser {
  userId: string
  email: string
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

### Shared Schemas — `packages/shared/src/schemas/auth.ts`

```typescript
import { z } from 'zod'

export const displayNameSchema = z
  .string()
  .min(2, 'Display name must be at least 2 characters')
  .max(32, 'Display name must be at most 32 characters')
  .regex(/^[a-zA-Z0-9 _-]+$/, 'Only letters, numbers, spaces, hyphens, and underscores')

export const avatarUrlSchema = z.url().nullable().optional()  // Zod v4: z.url() not z.string().url()

export const updateProfileSchema = z.object({
  displayName: displayNameSchema,
  avatarUrl: avatarUrlSchema,
})

export const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),  // Zod v4: z.email() not z.string().email()
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  displayName: displayNameSchema.optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
```

### Generated Database Types

Add to `apps/web/package.json` scripts:
```json
"db:types": "supabase gen types typescript --local > ../../packages/shared/src/types/database.ts"
```

Run `npm run db:types` after each migration. The generated file is committed to the repo and regenerated when the schema changes.

### Auth Config — `apps/web/src/config/auth/supabase.ts`

```typescript
import { env } from '../env'

export const supabaseAuthConfig = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const
```

### Supabase Client Factories

**`apps/web/src/lib/supabase/client.ts`** (browser only):
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
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component — safe to ignore.
            // Server Components cannot set cookies; the proxy handles refresh.
          }
        },
      },
    }
  )
}
```

Note: These are factory functions (not singletons) because Next.js Server Components require fresh cookie access per request.

### DAL — `apps/web/src/dal/auth/profiles.ts`

```typescript
import 'server-only'
import { ok } from '@repo/shared/utils/result'
import type { Result } from '@repo/shared/utils/result'
import { AppError } from '@repo/shared/utils/result'
import { createSupabaseServerClient } from '../../lib/supabase/server'
import { logger } from '../../lib/logger/pino'
import type { UserProfile, UserProfileRow } from '@repo/shared/types/auth'
import type { UpdateProfileInput } from '@repo/shared/schemas/auth'

function rowToDto(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getProfile(userId: string): Promise<Result<UserProfile, AppError>> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return AppError.notFound(`Profile not found for user ${userId}`)
    }
    logger.error({ userId, error }, 'Failed to fetch user profile')
    return AppError.database(error.message, error)
  }
  return ok(rowToDto(data))
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<Result<UserProfile, AppError>> {
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
    return AppError.database(error.message, error)
  }
  return ok(rowToDto(data))
}
```

### Server Action — `apps/web/src/app/actions/auth/update-profile.ts`

```typescript
'use server'
import { updateProfileSchema } from '@repo/shared/schemas/auth'
import { updateProfile } from '../../../dal/auth/profiles'
import { authActionClient } from '../../../lib/safe-action/client'

export const updateProfileAction = authActionClient
  .inputSchema(updateProfileSchema)       // .inputSchema() not deprecated .schema()
  .action(async ({ parsedInput, ctx }) => {
    // ctx.user provided by authActionClient .use() middleware (already called getUser())
    const result = await updateProfile(ctx.user.id, parsedInput)
    if (result.isErr()) throw new Error(result.error.message)
    return result.value
  })
```

> **Note**: `authActionClient` is defined in `apps/web/src/lib/safe-action/client.ts` with a `.use()` middleware that calls `getUser()` and passes `{ ctx: { user, supabase } }` to all actions. This centralizes auth checks so individual actions don't repeat the pattern.

### Auth Provider — `apps/web/src/components/app/auth/auth-provider.tsx`

```typescript
'use client'
// Creates Supabase browser client
// Subscribes to onAuthStateChange
// Exposes: user, session, isLoading, signOut() via React context
// Does NOT expose raw Supabase client
```

Wrap `apps/web/src/app/layout.tsx` with this provider.

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| @supabase/ssr | 0.9.0 | Cookie-based auth for Next.js App Router |
| @supabase/supabase-js | 2.99.3 | Core Supabase client (peer dep ^2.97.0 of @supabase/ssr) |
| next-safe-action | 8.1.8 | Server Action validation with Zod (already installed) |
| neverthrow | 8.2.0 | Result<T,E> pattern (from project scaffold) |
| zod | 4.3.6 | Schema validation (use v4 top-level validators: z.url(), z.email()) |

### Implementation Order

1. Install `@supabase/ssr@0.9.0` and `@supabase/supabase-js@2.99.3` in `apps/web`
2. Add `@repo/shared` package exports for new auth types/schemas
3. Create shared types (`packages/shared/src/types/auth.ts` — UserProfile extends BaseDto, AuthUser)
4. Create shared schemas (`packages/shared/src/schemas/auth.ts` — Zod v4 validators)
5. Create auth config module (`apps/web/src/config/auth/supabase.ts`)
6. Create Supabase browser client factory (`apps/web/src/lib/supabase/client.ts`)
7. Create Supabase server client factory (`apps/web/src/lib/supabase/server.ts` — setAll with try/catch)
8. Create Supabase proxy utility (`apps/web/src/lib/supabase/proxy.ts`)
9. Create safe-action client with auth middleware (`apps/web/src/lib/safe-action/client.ts`)
10. Write database migration (`supabase/migrations/001_user_profiles.sql`)
11. Create DAL module (`apps/web/src/dal/auth/profiles.ts` — AppError factory pattern)
12. Create Server Action (`apps/web/src/app/actions/auth/update-profile.ts` — authActionClient + .inputSchema())
13. Create Zustand auth store (`apps/web/src/stores/auth.ts` — game engine bridge)
14. Create AuthProvider component (`apps/web/src/components/app/auth/auth-provider.tsx`)
15. Create login/signup form components
16. Create auth pages (login, signup, auth layout, auth callback)
17. Extend proxy.ts (session refresh + route protection + auth redirect for logged-in users)
18. Wrap root layout with AuthProvider
19. Write tests

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
- `packages/shared/src/types/auth.ts` — `UserProfile` (extends BaseDto), `AuthUser`, `UserProfileRow`
- `packages/shared/src/types/database.ts` — generated Supabase TypeScript types
- `packages/shared/src/schemas/auth.ts` — `displayNameSchema`, `updateProfileSchema`, `loginSchema`, `signupSchema`
- `apps/web/src/config/auth/supabase.ts` — reads URL + anon key from env config
- `apps/web/src/lib/supabase/client.ts` — browser client factory (`'use client'`)
- `apps/web/src/lib/supabase/server.ts` — server client factory (`'server-only'`, setAll with try/catch)
- `apps/web/src/lib/supabase/proxy.ts` — session refresh utility for proxy.ts
- `apps/web/src/lib/safe-action/client.ts` — `actionClient` + `authActionClient` with `.use()` auth middleware
- `apps/web/src/dal/auth/profiles.ts` — `getProfile`, `updateProfile` (AppError factory pattern)
- `apps/web/src/app/actions/auth/update-profile.ts` — uses `authActionClient.inputSchema()`
- `apps/web/src/stores/auth.ts` — Zustand auth store (game engine bridge)
- `apps/web/src/proxy.ts` — extended with session refresh + route protection + auth page redirect
- `apps/web/src/components/app/auth/auth-provider.tsx` — auth context + Zustand bridge
- `apps/web/src/components/app/auth/login-form.tsx` — login form component
- `apps/web/src/components/app/auth/signup-form.tsx` — signup form component
- `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/(auth)/signup/page.tsx`
- `apps/web/src/app/auth/callback/route.ts`

### Dependencies Consumed (from Project Scaffold)

All of the following are produced by piece 01 and must be in place before this piece begins:

- **Turborepo workspace** — `turbo.json`, `package.json` workspaces
- **Centralized env config** — `apps/web/src/config/env.ts` (Zod-validated, with SUPABASE_URL and SUPABASE_ANON_KEY)
- **neverthrow Result utilities** — `packages/shared/src/utils/result.ts` (exports `ok`, `err`, and the `AppError` class with static factory methods: `.validation()`, `.notFound()`, `.unauthorized()`, `.forbidden()`, `.database()`, `.internal()`; `ErrorCategory` constants live in `packages/shared/src/constants/errors.ts`)
- **Pino logger singleton** — `apps/web/src/lib/logger/pino.ts` (used in DAL for error logging)
- **Shared types scaffold** — `packages/shared/src/types/common.ts` (provides `ID`, `Timestamp`)
- **`packages/shared/src/schemas/common.ts`** — base Zod schemas (`idSchema`, `timestampSchema`)
- **`apps/web/src/lib/` pattern** — established singleton/factory location
- **`apps/web/src/proxy.ts`** — exists as Next.js middleware, ready to extend

### Produces (for Downstream Pieces)

Downstream pieces consume these outputs:

- **`AuthUser`** and **`UserProfile`** types — piece 07 (player-and-roles) reads user profile to populate player display name and avatar
- **`createSupabaseServerClient`** — every subsequent piece with a DAL imports this factory
- **`createSupabaseBrowserClient`** — any client component needing auth state imports this
- **`authActionClient`** — every protected Server Action uses this pre-authenticated action client
- **`AuthProvider`** — wraps the app layout; downstream pieces can access auth context
- **Zustand auth store** (`stores/auth.ts`) — game engine reads `userId`/`displayName` without importing React
- **`user_profiles` table** — piece 16 (progression-infrastructure) joins against this table for player stats
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

The `display_name` field is intentionally minimal — no avatar file upload, no social features. Persistent progression (piece 16) will extend the profile concept with game stats.

### Planning Adjustments (2026-03-20)

The following adjustments were discovered during `/speckit.plan` and `/speckit.clarify` and have been backfilled into the prompts above:

- **Error handling**: DAL uses `AppError.notFound()` / `AppError.database()` factory methods (project pattern), not raw `err({ type })` objects
- **next-safe-action API**: `.inputSchema()` replaces deprecated `.schema()`. Centralized `authActionClient` with `.use()` middleware replaces inline `getUser()` in each action.
- **Zod v4 validators**: `z.url()`, `z.email()` (not `z.string().url()`, `z.string().email()`)
- **UserProfile extends BaseDto**: Aligns with existing `packages/shared/src/types/common.ts` pattern
- **AuthSession renamed to AuthUser**: Simpler interface without embedded profile (profile fetched separately via DAL)
- **Server client setAll try/catch**: Required because Server Components cannot set cookies; proxy handles refresh
- **Pinned library versions**: @supabase/ssr 0.9.0, @supabase/supabase-js 2.99.3 (not "latest")
- **New files**: `lib/supabase/proxy.ts` (session refresh utility), `lib/safe-action/client.ts` (centralized action client), `stores/auth.ts` (Zustand game engine bridge), `login-form.tsx`, `signup-form.tsx`
- **Spec clarifications**: Authenticated users on auth pages redirect to `/game/select-role`; post-login redirect preserves originally requested URL
