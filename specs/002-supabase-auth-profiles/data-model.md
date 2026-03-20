# Data Model: Supabase Auth & User Profiles

**Feature**: 002-supabase-auth-profiles
**Date**: 2026-03-20

## Entities

### User Account (managed by Supabase Auth)

Supabase's `auth.users` table — not managed by application code. Created during signup.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key, auto-generated |
| email | text | Unique, validated by Supabase |
| raw_user_meta_data | jsonb | Holds `display_name` passed during signup |
| (other auth fields) | various | Managed by Supabase Auth internally |

### User Profile (`public.user_profiles`)

Player's public-facing identity within the game.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID PK | References `auth.users(id)` ON DELETE CASCADE | 1:1 with auth user |
| display_name | TEXT NOT NULL | CHECK length 2–32 chars | Default "Player" via trigger |
| avatar_url | TEXT | Nullable | External URL only, no file upload |
| created_at | TIMESTAMPTZ NOT NULL | Default `now()` | Immutable after creation |
| updated_at | TIMESTAMPTZ NOT NULL | Default `now()` | Updated on profile changes |

**Relationships**:
- `user_profiles.id` → `auth.users.id` (1:1, cascade delete)

**Lifecycle**:
1. User signs up via Supabase Auth → `auth.users` row created
2. Database trigger `on_auth_user_created` fires → `user_profiles` row created automatically
3. Display name sourced from `raw_user_meta_data->>'display_name'`, defaults to "Player"
4. User updates profile → `updated_at` refreshed
5. User account deleted → profile cascades via FK

## Validation Rules

### Display Name

| Rule | Constraint | Enforcement |
|------|-----------|-------------|
| Min length | 2 characters | Zod schema + DB CHECK |
| Max length | 32 characters | Zod schema + DB CHECK |
| Allowed chars | `[a-zA-Z0-9 _-]` | Zod regex |
| Uniqueness | NOT unique | By design — players identified by UUID |

### Avatar URL

| Rule | Constraint | Enforcement |
|------|-----------|-------------|
| Format | Valid URL | Zod `z.url()` |
| Required | Optional, nullable | Zod `.nullable().optional()` |
| Source | External URLs only | No file upload in this feature |

## RLS Policies

| Policy | Operation | Target | Rule |
|--------|-----------|--------|------|
| `profiles_select_all` | SELECT | authenticated | `USING (true)` — any authenticated user can read any profile |
| `profiles_update_own` | UPDATE | authenticated | `USING (auth.uid() = id) WITH CHECK (auth.uid() = id)` — own profile only |

No INSERT policy needed — the trigger function uses `SECURITY DEFINER` (runs as table owner).
No DELETE policy needed — cascades from `auth.users` deletion (handled by Supabase Auth).

## TypeScript Types

### Shared Types (`packages/shared/src/types/auth.ts`)

```typescript
import type { BaseDto } from './common'

// Application DTO — camelCase, extends BaseDto
export interface UserProfile extends BaseDto {
  displayName: string
  avatarUrl: string | null
}

// Auth session state for React context
export interface AuthUser {
  userId: string
  email: string
}

// Raw database row shape (snake_case, matches Supabase)
export interface UserProfileRow {
  id: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}
```

### Shared Schemas (`packages/shared/src/schemas/auth.ts`)

```typescript
import { z } from 'zod'

export const displayNameSchema = z
  .string()
  .min(2, 'Display name must be at least 2 characters')
  .max(32, 'Display name must be at most 32 characters')
  .regex(/^[a-zA-Z0-9 _-]+$/, 'Only letters, numbers, spaces, hyphens, and underscores')

export const avatarUrlSchema = z.url().nullable().optional()

export const updateProfileSchema = z.object({
  displayName: displayNameSchema,
  avatarUrl: avatarUrlSchema,
})

export const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
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

## Migration SQL

File: `supabase/migrations/001_user_profiles.sql`

```sql
-- user_profiles: one row per authenticated user, linked to auth.users
create table public.user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) >= 2 and char_length(display_name) <= 32),
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Trigger function: auto-create profile when user signs up
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
