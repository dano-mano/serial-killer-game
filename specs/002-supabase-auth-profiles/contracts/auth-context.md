# Auth Context Contract

**Feature**: 002-supabase-auth-profiles

## AuthProvider Context

**File**: `apps/web/src/components/app/auth/auth-provider.tsx`
**Directive**: `'use client'`

### Context Value Shape

```typescript
interface AuthContextValue {
  user: AuthUser | null        // { userId: string, email: string }
  session: Session | null      // Supabase Session object
  isLoading: boolean           // True during initial auth state resolution
  signOut: () => Promise<void> // Clears session, redirects to landing page
}
```

### Behavior

1. Creates a Supabase browser client on mount
2. Subscribes to `onAuthStateChange` events
3. On auth state change: updates `user` and `session`, reads `displayName` from `session.user.user_metadata.display_name`, writes `userId` + `displayName` to Zustand auth store via `setAuth()`
4. On sign out: clears Zustand auth store via `clearAuth()`, redirects to `/`
5. Does NOT expose the raw Supabase client — only typed convenience values

### Zustand Auth Store Bridge

**File**: `apps/web/src/stores/auth.ts`

```typescript
interface AuthStore {
  userId: string | null
  displayName: string | null
  setAuth: (userId: string, displayName: string) => void
  clearAuth: () => void
}
```

- Written by AuthProvider on auth state changes (displayName sourced from `session.user.user_metadata.display_name`)
- Read by Phaser game engine via `useAuthStore.getState()` (no React import needed)
- Cleared on sign out
- Kept in sync: `updateProfileAction` updates both `user_profiles` table AND auth metadata via `supabase.auth.updateUser({ data: { display_name } })`, so the next `onAuthStateChange` event picks up the new displayName

## DAL Contract

**File**: `apps/web/src/dal/auth/profiles.ts`
**Directive**: `import 'server-only'`

### getProfile

```typescript
function getProfile(userId: string): Promise<Result<UserProfile, AppError>>
```

| Scenario | Return |
|----------|--------|
| Profile exists | `ok({ id, displayName, avatarUrl, createdAt, updatedAt })` |
| Profile not found | `AppError.notFound('Profile not found for user {userId}')` |
| Database error | `AppError.database(error.message, error)` |

### updateProfile

```typescript
function updateProfile(userId: string, input: UpdateProfileInput): Promise<Result<UserProfile, AppError>>
```

| Scenario | Return |
|----------|--------|
| Update success | `ok({ id, displayName, avatarUrl, createdAt, updatedAt })` |
| Database error | `AppError.database(error.message, error)` |

Note: RLS enforces that `userId` matches the authenticated user. The DAL does not need a separate authorization check — RLS is defense-in-depth, and the Server Action middleware already verified `getUser()`.

## Route Protection Contract

### Protected Routes

| Pattern | Requires Auth | Redirect |
|---------|--------------|----------|
| `/game/*` | Yes | → `/login?next={originalUrl}` |
| `/profile/*` | Yes | → `/login?next={originalUrl}` |
| `/login`, `/signup` | Redirect if authenticated | → `/game/select-role` |
| `/`, `/(auth)/*`, `/api/*` | No | N/A |

### Proxy Session Flow

1. Rate limiting (existing)
2. Create Supabase server client with request/response cookies
3. Call `getUser()` — refreshes expired session
4. Check route protection rules
5. If unauthenticated + protected route → redirect to `/login?next={path}`
6. If authenticated + auth page → redirect to `/game/select-role`
7. Generate CSP nonce (existing)
8. Apply security headers (existing)
