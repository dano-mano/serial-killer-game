# Server Action Contracts: Auth & Profiles

**Feature**: 002-supabase-auth-profiles

## updateProfileAction

**File**: `apps/web/src/app/actions/auth/update-profile.ts`
**Auth**: Required (via `authActionClient` middleware)
**Validation**: `updateProfileSchema` via `.inputSchema()`

### Input

```typescript
{
  displayName: string   // 2-32 chars, [a-zA-Z0-9 _-]
  avatarUrl?: string | null  // Valid URL or null/undefined
}
```

### Success Response

```typescript
{
  data: {
    id: string
    displayName: string
    avatarUrl: string | null
    createdAt: string
    updatedAt: string
  }
}
```

### Error Responses

| Scenario | Error Type | Message |
|----------|-----------|---------|
| Not authenticated | serverError | "Not authenticated" |
| Invalid input | validationErrors | Per-field Zod errors |
| Profile not found | serverError | "Profile not found" |
| Database error | serverError | "Something went wrong" (sanitized) |

## Auth Callback Route

**File**: `apps/web/src/app/auth/callback/route.ts`
**Method**: GET
**Auth**: None (processes auth tokens)

### Query Parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| code | string | Yes | Auth code from Supabase email link |

### Behavior

| Scenario | Redirect |
|----------|----------|
| Valid code, exchange success | `/game/select-role` (or `next` param if present) |
| Missing code | `/login?error=missing_code` |
| Exchange failure | `/login?error=auth_callback_failed` |
