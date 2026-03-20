# Implementation Plan: Supabase Auth & User Profiles

**Branch**: `002-supabase-auth-profiles` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-supabase-auth-profiles/spec.md`

## Summary

Integrate Supabase Auth with cookie-based sessions into the Next.js 16 application. Create two Supabase client factories (browser + server), extend the proxy for session refresh and route protection, build an AuthProvider context, create login/signup/callback pages, and establish the user profile system with a database table, RLS policies, DAL, and Server Action for mutations. The player's auth identity bridges into the game engine via Zustand store.

## Technical Context

**Language/Version**: TypeScript 5.9.3, Node.js 24.14.0 LTS
**Primary Dependencies**: Next.js 16.2.0, React 19.2.4, @supabase/ssr 0.9.0, @supabase/supabase-js 2.99.3, next-safe-action 8.1.8, neverthrow 8.2.0, Zod 4.3.6, Zustand 5.0.12
**Storage**: Supabase Cloud (PostgreSQL) — `user_profiles` table with RLS
**Testing**: Vitest 4.1.0 (unit), React Testing Library 16.3.2 (component), Playwright 1.58.2 (E2E)
**Target Platform**: Browser (320px–2560px+), Azure App Service B1 Linux
**Project Type**: Turborepo monorepo web application (Next.js App Router + Phaser 3 game engine)
**Performance Goals**: Signup <60s, login <15s, session refresh adds <50ms proxy latency
**Constraints**: Zero-trust frontend, cookie-based sessions (no localStorage tokens), server-only secrets
**Scale/Scope**: MVP phase, single Supabase project, ~8 new source files + 1 SQL migration + proxy extension

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Direct Imports | PASS | All new files use direct imports, no barrel files |
| II. Centralized Config | PASS | Auth config reads from `config/env.ts`, new `config/auth/supabase.ts` for auth-specific config |
| III. Centralized Types | PASS | `UserProfile`, `AuthSession`, `UserProfileRow` in `packages/shared/src/types/auth.ts` |
| V. Immutable Vendor | N/A | No vendor component modifications |
| VI. Domain-Based Org | PASS | Auth domain: `config/auth/`, `dal/auth/`, `actions/auth/`, `components/app/auth/`, `stores/auth.ts` |
| VII. Client/Server Boundaries | PASS | Browser client has `'use client'`, server client has `import 'server-only'` |
| VIII. Singleton/Factory | PASS | Per-request factory functions (required by Next.js App Router cookie handling) |
| XI. Shared Schema Validation | PASS | `packages/shared/src/schemas/auth.ts` for display name + profile schemas, used client and server |
| XII. DAL | PASS | `dal/auth/profiles.ts` with `import 'server-only'`, returns DTOs via AppError Result pattern |
| XIII. Server Actions | PASS | `actions/auth/update-profile.ts` with `'use server'`, Zod validation via next-safe-action `.inputSchema()` |
| XIV. Game Engine State Bridge | PASS | Auth state written to Zustand player store, Phaser reads from store (no React imports) |
| XV. Database Schema Design | PASS | Normalized table, UUID PK, TIMESTAMPTZ, RLS enabled, migration in `supabase/migrations/` |
| XVI. Zero-Trust Frontend | PASS | Browser only collects input + does auth operations. All mutations via Server Actions. |
| XVII. Server-Side Security | PASS | `getUser()` validation in Server Actions, RLS as defense-in-depth |
| XVIII. Secrets Management | PASS | `SUPABASE_SERVICE_ROLE_KEY` never in `NEXT_PUBLIC_*`, server-only via `config/env.ts` |
| XIX. RLS Defense-in-Depth | PASS | `user_profiles` table: authenticated SELECT all, UPDATE own only |
| XX. Input Validation | PASS | Zod schemas for all inputs (display name, avatar URL, login/signup forms) |
| XXI. Rate Limiting | PASS | Existing proxy rate limiters cover auth routes (`/auth/*`, `/api/auth/*`) |
| XXII. CSP | PASS | Existing CSP in proxy.ts already allows `*.supabase.co` in connect-src |
| XXV. No Ephemeral References | PASS | No spec IDs in source code |
| XXVI. Test Organization | PASS | Tests in `tests/` at package root, mirroring `src/` structure |
| XXVIII. Accessibility | PASS | Auth forms use semantic HTML, ARIA labels, keyboard navigation |
| XXXI. Progressive Enhancement | PASS | Auth forms work as native `<form>` with Server Actions (no JS required) |

**Gate result: PASS** — No violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-supabase-auth-profiles/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── server-actions.md
│   └── auth-context.md
└── tasks.md (created by /speckit.tasks)
```

### Source Code (repository root)

```text
supabase/
└── migrations/
    └── 001_user_profiles.sql          # Table + trigger + RLS policies

packages/shared/src/
├── types/
│   ├── auth.ts                        # UserProfile, AuthSession, UserProfileRow
│   └── database.ts                    # Generated Supabase types (npm run db:types)
├── schemas/
│   └── auth.ts                        # displayNameSchema, updateProfileSchema, loginSchema, signupSchema
└── (exports in package.json)

apps/web/src/
├── config/auth/
│   └── supabase.ts                    # Auth config (url, anonKey from env.ts)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # createSupabaseBrowserClient ('use client')
│   │   ├── server.ts                  # createSupabaseServerClient ('server-only')
│   │   └── proxy.ts                   # updateSession helper for proxy.ts
│   └── safe-action/
│       └── client.ts                  # actionClient + authActionClient with .use() auth middleware
├── dal/auth/
│   └── profiles.ts                    # getProfile, updateProfile (server-only, AppError Results)
├── stores/
│   └── auth.ts                        # Zustand player auth store (userId, displayName)
├── components/app/auth/
│   ├── auth-provider.tsx              # AuthProvider context ('use client')
│   ├── login-form.tsx                 # Login form component ('use client')
│   └── signup-form.tsx                # Signup form component ('use client')
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx                 # Auth layout (centered, minimal)
│   │   ├── login/page.tsx             # Login page
│   │   └── signup/page.tsx            # Signup page
│   ├── auth/callback/route.ts         # OAuth/magic-link callback handler
│   └── actions/auth/
│       └── update-profile.ts          # updateProfileAction (Server Action)
├── proxy.ts                           # EXTEND: session refresh + route protection + auth redirects
└── app/layout.tsx                     # EXTEND: wrap with AuthProvider

apps/web/tests/
├── dal/auth/profiles.test.ts
├── components/app/auth/auth-provider.test.tsx
├── lib/supabase/server.test.ts
└── lib/safe-action/client.test.ts

packages/shared/tests/
└── schemas/auth.test.ts
```

**Structure Decision**: Extends existing Turborepo monorepo. All new code follows domain-based organization under `auth/` domain directories. No new packages — auth is an application concern, not a shared library.

## Key Technical Decisions

### 1. @supabase/ssr over deprecated auth-helpers

**Decision**: Use `@supabase/ssr@0.9.0` + `@supabase/supabase-js@2.99.3`
**Rationale**: Official replacement for deprecated `@supabase/auth-helpers-nextjs`. Cookie-based session management designed for App Router.
**Alternatives rejected**: `@supabase/auth-helpers-nextjs` (deprecated), manual JWT handling (unnecessary complexity).

### 2. Keep ANON_KEY env var naming

**Decision**: Continue using `NEXT_PUBLIC_SUPABASE_ANON_KEY` (already in env.ts, .env.example, CI workflows)
**Rationale**: Supabase is migrating to `PUBLISHABLE_KEY` naming, but the existing scaffold uses `ANON_KEY` across 6+ files. Renaming is a separate migration task.
**Future**: When Supabase completes the key migration, rename in a dedicated PR.

### 3. getUser() in proxy (not getClaims())

**Decision**: Use `getUser()` for session refresh in proxy.ts
**Rationale**: `getClaims()` is newer and faster (local JWT validation) but less proven. `getUser()` is the established pattern that also handles session refresh. User explicitly requested `getUser()`.
**Future**: Switch to `getClaims()` for performance when the API stabilizes further.

### 4. Per-request client factories (not singletons)

**Decision**: `createSupabaseBrowserClient()` and `createSupabaseServerClient()` are factory functions, not singletons.
**Rationale**: Next.js App Router requires fresh cookie access per request. Module-scope singletons would share cookies across users.
**Constitution alignment**: Principle VIII allows factory pattern when singleton is not safe.

### 5. next-safe-action .use() middleware for auth

**Decision**: Create `authActionClient` with `.use()` middleware that calls `getUser()` and passes `{ ctx: { user, supabase } }` to actions.
**Rationale**: Centralizes auth check for all protected Server Actions. Avoids repeating `getUser()` in every action. Uses `.inputSchema()` (not deprecated `.schema()`).

### 6. AppError factory pattern (align to existing codebase)

**Decision**: DAL functions return `AppError.notFound()`, `AppError.database()`, etc. — not plain objects.
**Rationale**: The scaffold established `AppError` at `packages/shared/src/utils/result.ts` with factory methods that return `err(new AppError(...))`. All new code must follow this pattern.

### 7. UserProfile extends BaseDto

**Decision**: `UserProfile` extends `BaseDto` (id, createdAt, updatedAt) and adds `displayName`, `avatarUrl`.
**Rationale**: Follows existing pattern where `BaseDto` is the foundation for all entities.

### 8. Proxy session refresh integration

**Decision**: Create `lib/supabase/proxy.ts` utility, integrate into existing `proxy.ts` between rate limiting and CSP.
**Rationale**: Keeps proxy.ts clean by extracting Supabase session logic. Session refresh runs after rate limiting (reject bad actors first) but before CSP header generation.

## Implementation Order

1. Install `@supabase/ssr@0.9.0` + `@supabase/supabase-js@2.99.3` in `apps/web`
2. Add `@repo/shared` package exports for new auth types/schemas
3. Create shared types (`packages/shared/src/types/auth.ts`)
4. Create shared schemas (`packages/shared/src/schemas/auth.ts`)
5. Create auth config module (`apps/web/src/config/auth/supabase.ts`)
6. Create Supabase browser client factory (`apps/web/src/lib/supabase/client.ts`)
7. Create Supabase server client factory (`apps/web/src/lib/supabase/server.ts`)
8. Create Supabase proxy utility (`apps/web/src/lib/supabase/proxy.ts`)
9. Create safe-action client with auth middleware (`apps/web/src/lib/safe-action/client.ts`)
10. Write SQL migration (`supabase/migrations/001_user_profiles.sql`)
11. Create DAL module (`apps/web/src/dal/auth/profiles.ts`)
12. Create Server Action (`apps/web/src/app/actions/auth/update-profile.ts`)
13. Create Zustand auth store (`apps/web/src/stores/auth.ts`)
14. Create AuthProvider component (`apps/web/src/components/app/auth/auth-provider.tsx`)
15. Create login/signup form components
16. Create auth pages (login, signup, auth layout)
17. Create auth callback route handler
18. Extend proxy.ts (session refresh + route protection + authenticated user redirect)
19. Wrap root layout with AuthProvider
20. Write unit tests (schemas, DAL, safe-action client)
21. Write component tests (AuthProvider, forms)
22. Write E2E tests (login, signup, route protection)

## Complexity Tracking

> No constitution violations — this section is empty.
