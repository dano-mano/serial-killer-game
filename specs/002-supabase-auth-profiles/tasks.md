# Tasks: Supabase Auth & User Profiles

**Input**: Design documents from `/specs/002-supabase-auth-profiles/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included — plan.md defines a testing strategy with unit, component, and E2E tests.

**Organization**: Tasks grouped by user story. US1+US2 combined (tightly coupled auth pages).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1–US7)
- Exact file paths included

---

## Phase 1: Setup

**Purpose**: Install dependencies and configure package exports

- [ ] T001 Install @supabase/ssr@0.9.0 and @supabase/supabase-js@2.99.3 in apps/web/package.json
- [ ] T002 Add package exports for auth types and schemas to packages/shared/package.json (`./types/auth`, `./schemas/auth`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth infrastructure that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [P] Create shared auth types in packages/shared/src/types/auth.ts (UserProfile extends BaseDto, AuthUser, UserProfileRow)
- [ ] T004 [P] Create shared auth schemas in packages/shared/src/schemas/auth.ts (displayNameSchema, avatarUrlSchema, updateProfileSchema, loginSchema, signupSchema — use Zod v4 validators: z.url(), z.email())
- [ ] T005 [P] Create auth config module in apps/web/src/config/auth/supabase.ts (reads url + anonKey from config/env.ts)
- [ ] T006 [P] Write SQL migration in supabase/migrations/001_user_profiles.sql (table, trigger, RLS policies per data-model.md)
- [ ] T007 Create Supabase browser client factory in apps/web/src/lib/supabase/client.ts ('use client', createBrowserClient from @supabase/ssr)
- [ ] T008 Create Supabase server client factory in apps/web/src/lib/supabase/server.ts ('server-only', createServerClient with getAll/setAll cookies, try/catch in setAll for Server Component compatibility)
- [ ] T009 Create Supabase proxy session utility in apps/web/src/lib/supabase/proxy.ts (updateSession function: creates per-request client with request/response cookies, calls getUser() for session refresh)
- [ ] T010 Create safe-action client with auth middleware in apps/web/src/lib/safe-action/client.ts (actionClient base + authActionClient with .use() middleware calling getUser(), passing { ctx: { user, supabase } })
- [ ] T011 Create DAL module in apps/web/src/dal/auth/profiles.ts ('server-only', getProfile and updateProfile returning Result<UserProfile, AppError> using AppError.notFound() and AppError.database() factory methods)
- [ ] T012 Create Zustand auth store in apps/web/src/stores/auth.ts (userId, displayName, setAuth, clearAuth — readable by Phaser via getState() without React)
- [ ] T013 Create AuthProvider component in apps/web/src/components/app/auth/auth-provider.tsx ('use client', creates browser client, subscribes to onAuthStateChange, exposes user/session/isLoading/signOut via context, writes userId+displayName to Zustand store, does NOT expose raw Supabase client)
- [ ] T014 Wrap root layout with AuthProvider in apps/web/src/app/layout.tsx

**Checkpoint**: Auth infrastructure complete — all clients, stores, DAL, and context ready for page implementation

---

## Phase 3: User Story 1+2 — Registration & Login (Priority: P1) MVP

**Goal**: New visitors can create accounts and returning players can log in. Both redirect to `/game/select-role` on success.

**Independent Test**: Complete signup form with valid data, then log out and log back in. Verify profile exists with chosen display name.

### Tests for US1+US2

- [ ] T015 [P] [US1] Create auth schema tests in packages/shared/tests/schemas/auth.test.ts (displayNameSchema accepts/rejects valid/invalid names, loginSchema validates, signupSchema validates including password mismatch)
- [ ] T016 [P] [US1] Create DAL tests in apps/web/tests/dal/auth/profiles.test.ts (mock Supabase client, test getProfile ok/notFound/dbError, test updateProfile ok/dbError)

### Implementation for US1+US2

- [ ] T017 [P] [US1] Create auth layout in apps/web/src/app/(auth)/layout.tsx (centered, minimal — not using design system yet)
- [ ] T018 [P] [US1] Create signup form component in apps/web/src/components/app/auth/signup-form.tsx ('use client', email/password/confirmPassword/displayName fields, validates with signupSchema, calls supabase.auth.signUp with display_name in metadata, handles email verification notice)
- [ ] T019 [P] [US2] Create login form component in apps/web/src/components/app/auth/login-form.tsx ('use client', email/password fields, validates with loginSchema, calls supabase.auth.signInWithPassword, shows generic "invalid credentials" error on failure, handles email_not_confirmed gracefully)
- [ ] T020 [US1] Create signup page in apps/web/src/app/(auth)/signup/page.tsx (renders SignupForm, link to login)
- [ ] T021 [US2] Create login page in apps/web/src/app/(auth)/login/page.tsx (renders LoginForm, "Forgot password" link, link to signup)
- [ ] T022 [US1] Create auth callback route handler in apps/web/src/app/auth/callback/route.ts (GET handler: exchanges code via supabase.auth.exchangeCodeForSession, redirects to `next` param or `/game/select-role` on success, redirects to `/login?error=...` on failure)

**Checkpoint**: Users can sign up with email/password/display name and log in. Profile auto-created by DB trigger.

---

## Phase 4: User Story 3 — Route Protection (Priority: P1)

**Goal**: Unauthenticated visitors cannot access `/game/*` or `/profile/*`. Authenticated players on `/login` or `/signup` are redirected to `/game/select-role`.

**Independent Test**: Visit `/game/select-role` while not logged in — should redirect to `/login?next=/game/select-role`. Log in, then visit `/login` — should redirect to `/game/select-role`.

### Implementation for US3

- [ ] T023 [US3] Extend proxy.ts with session refresh, route protection, and auth redirect in apps/web/src/proxy.ts (integrate updateSession between rate limiting and CSP, add route protection rules per contracts/auth-context.md: protected routes → /login?next={path}, auth pages when authenticated → /game/select-role, preserve existing rate limiting and CSP logic)

**Checkpoint**: Route protection active. Unauthenticated users redirected from protected routes. Post-login redirects to originally requested URL.

---

## Phase 5: User Story 4 — Profile Management (Priority: P2)

**Goal**: Authenticated players can view and update their display name and avatar URL. Cannot modify other players' profiles.

**Independent Test**: Log in, navigate to profile, change display name, verify it persists on page reload.

### Implementation for US4

- [ ] T024 [US4] Create update profile Server Action in apps/web/src/app/actions/auth/update-profile.ts ('use server', authActionClient.inputSchema(updateProfileSchema).action(), calls DAL updateProfile, returns updated profile)
- [ ] T025 [P] [US4] Create profile edit component in apps/web/src/components/app/auth/profile-form.tsx ('use client', displays current profile, form for displayName + avatarUrl, uses useAction hook from next-safe-action/hooks to call updateProfileAction, validates with updateProfileSchema)
- [ ] T026 [US4] Create profile page in apps/web/src/app/(auth)/profile/page.tsx (server component, calls getProfile from DAL, renders ProfileForm with current data, shows not-found message if profile missing)

**Checkpoint**: Players can view and update their own profile. RLS prevents cross-user modification.

---

## Phase 6: User Story 5 — Password Recovery (Priority: P2)

**Goal**: Players can request a password reset email from the login page and set a new password via the email link.

**Independent Test**: Click "Forgot password" on login page, enter email, verify confirmation message appears. (Email delivery requires Supabase project configuration.)

### Implementation for US5

- [ ] T027 [US5] Add forgot password flow to login page: create password reset form in apps/web/src/components/app/auth/forgot-password-form.tsx ('use client', email field, calls supabase.auth.resetPasswordForEmail, shows confirmation message regardless of email existence — prevents info leakage)
- [ ] T028 [US5] Integrate forgot password form into login page in apps/web/src/app/(auth)/login/page.tsx (show/hide toggle or modal for forgot password form, link from login form)

**Checkpoint**: Password recovery flow functional. Email delivery depends on Supabase project email settings.

---

## Phase 7: User Story 6 — Auth Identity in Game World (Priority: P2)

**Goal**: Game engine can read authenticated player's userId and displayName without importing React or auth code.

**Independent Test**: Log in, navigate to a game page, verify Zustand store contains userId and displayName via browser devtools or test.

### Implementation for US6

- [ ] T029 [US6] Verify AuthProvider writes to Zustand store on auth state change — ensure auth-provider.tsx fetches profile via getProfile DAL and writes displayName to auth store (may require updating T013 implementation if not already included)
- [ ] T030 [P] [US6] Create AuthProvider component test in apps/web/tests/components/app/auth/auth-provider.test.tsx (renders children, provides auth context with mock Supabase, calls signOut correctly, writes to Zustand store on auth state change)

**Checkpoint**: Game engine can read player identity from Zustand store without React dependency.

---

## Phase 8: User Story 7 — Sign Out (Priority: P3)

**Goal**: Authenticated players can sign out, clearing their session and redirecting to the landing page.

**Independent Test**: Log in, click sign out, verify redirect to landing page, then attempt to visit a protected route — should redirect to login.

### Implementation for US7

- [ ] T031 [US7] Add sign-out UI element — create a sign-out button/link accessible from the app layout or navigation that calls signOut() from AuthProvider context, ensures Zustand auth store is cleared, and redirects to `/`

**Checkpoint**: Complete auth lifecycle: signup → login → use app → sign out.

---

## Phase 9: Tests

**Purpose**: Comprehensive test coverage for auth infrastructure

- [ ] T032 [P] Create safe-action client test in apps/web/tests/lib/safe-action/client.test.ts (test authActionClient middleware rejects unauthenticated requests, passes user in ctx)
- [ ] T033 [P] Create Supabase server client test in apps/web/tests/lib/supabase/server.test.ts (test factory creates client with correct cookie handling)
- [ ] T034 Run full test suite: npm test (via Turborepo) — verify all new and existing tests pass, type-check clean, lint clean

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup

- [ ] T035 Update apps/web/.env.example with any new environment variables or documentation notes for auth setup
- [ ] T036 Verify constitution compliance: no barrel files, no direct process.env, no ephemeral references, server-only guards on all server modules, 'use client' on all client components

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001, T002)
- **US1+US2 (Phase 3)**: Depends on Foundational (needs clients, config, AuthProvider, schemas)
- **US3 (Phase 4)**: Depends on Foundational (needs proxy utility) — can run parallel with Phase 3
- **US4 (Phase 5)**: Depends on Foundational (needs DAL, safe-action client)  — can run parallel with Phase 3
- **US5 (Phase 6)**: Depends on US2 login page (extends it with forgot password)
- **US6 (Phase 7)**: Depends on Foundational (AuthProvider + Zustand store)  — can run parallel with Phase 3
- **US7 (Phase 8)**: Depends on Foundational (AuthProvider signOut)
- **Tests (Phase 9)**: Can start after Foundational, run parallel with user stories
- **Polish (Phase 10)**: Depends on all user stories complete

### User Story Dependencies

- **US1+US2 (P1)**: After Foundational — no other story dependencies
- **US3 (P1)**: After Foundational — independent of US1+US2 (but most useful together)
- **US4 (P2)**: After Foundational — independent
- **US5 (P2)**: After US2 login page exists (extends it)
- **US6 (P2)**: After Foundational — independent (AuthProvider already writes to store)
- **US7 (P3)**: After Foundational — independent

### Within Each User Story

- Schema/type tasks before service/DAL tasks
- DAL before Server Actions
- Server-side before client-side
- Components before pages

### Parallel Opportunities

- T003–T006 (foundational types, schemas, config, migration) — all different files
- T007–T010 (clients, proxy utility, safe-action) — different files but some interdependencies
- T015–T016 (tests for US1+US2) — different packages, fully parallel
- T017–T019 (auth layout, signup form, login form) — different files, parallel
- T025 (profile form) parallel with other story phases
- T032–T033 (test tasks) parallel with each other
- Phases 3, 4, 5, 6, 7 can all start after Phase 2 (except US5 needs US2's login page)

---

## Parallel Example: Foundational Phase

```
# Batch 1 — all independent files:
T003: Shared auth types (packages/shared/src/types/auth.ts)
T004: Shared auth schemas (packages/shared/src/schemas/auth.ts)
T005: Auth config (apps/web/src/config/auth/supabase.ts)
T006: SQL migration (supabase/migrations/001_user_profiles.sql)

# Batch 2 — depend on config (T005):
T007: Browser client factory
T008: Server client factory
T009: Proxy session utility
T010: Safe-action client

# Batch 3 — depend on server client (T008):
T011: DAL module (needs server client)

# Batch 4 — depend on browser client (T007) + DAL (T011):
T012: Zustand auth store
T013: AuthProvider component
T014: Wrap root layout
```

## Parallel Example: US1+US2 Registration & Login

```
# Tests (parallel with implementation):
T015: Schema tests (packages/shared)
T016: DAL tests (apps/web)

# Implementation Batch 1 — independent components:
T017: Auth layout
T018: Signup form component
T019: Login form component

# Implementation Batch 2 — pages (depend on components):
T020: Signup page (depends on T018)
T021: Login page (depends on T019)
T022: Auth callback route
```

---

## Implementation Strategy

### MVP First (US1+US2+US3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1+US2 (Registration & Login)
4. Complete Phase 4: US3 (Route Protection)
5. **STOP and VALIDATE**: Users can sign up, log in, and are protected from unauthorized access
6. This is a functional MVP — all P1 stories complete

### Incremental Delivery

1. Setup + Foundational → Auth infrastructure ready
2. US1+US2 → Registration & Login → Test independently → **MVP!**
3. US3 → Route Protection → Test independently
4. US4 → Profile Management → Test independently
5. US5 → Password Recovery → Test independently
6. US6 → Game Engine Bridge → Verify store population
7. US7 → Sign Out → Test independently
8. Tests + Polish → Full coverage

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- AppError factory pattern: use `AppError.notFound()`, `AppError.database()`, NOT raw `err({ type })`
- Zod v4: use `z.url()`, `z.email()`, NOT `z.string().url()`, `z.string().email()`
- next-safe-action: use `.inputSchema()`, NOT deprecated `.schema()`
- Cookie pattern: use ONLY `getAll`/`setAll`, NEVER individual get/set/remove
- Server client `setAll` needs try/catch (Server Components can't set cookies)
- `.env.local` must be at `apps/web/`, NOT repo root
