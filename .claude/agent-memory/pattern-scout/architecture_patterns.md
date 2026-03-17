---
name: architecture_patterns
description: Key architectural patterns defined by the project constitution — use these as the baseline for all pattern discovery
type: project
---

All patterns from `.specify/memory/constitution.md` v1.0.0. These are non-negotiable without a constitution amendment.

**Why:** Constitution ratified 2026-03-15 defines all implementation patterns before any code was written.

**How to apply:** Reference these when reporting patterns to orchestrator and when verifying implementation agent work.

## Three-Layer State Bridge (core unique pattern)
1. **Phaser scenes** — game loop state (physics, sprites) → EventBus for signals
2. **Zustand** (`stores/[domain].ts`) — bridges React and Phaser, subscribable outside React
3. **Supabase Realtime** — server state flows through Zustand before React or Phaser consumers

EventBus = one-time signals. Zustand = persistent shared state.
Phaser MUST NOT import React. React MUST NOT import Phaser internals.
Phaser loaded via `next/dynamic` with `ssr: false`.

## DAL Pattern
- All queries through `apps/web/src/dal/[domain]/`
- Every DAL file: `import "server-only"` at top
- Returns DTOs (not raw DB responses)

## Server Actions Pattern
- `apps/web/src/app/actions/[domain]/[action].ts`
- `'use server'` directive
- Always validate with Zod before calling DAL
- Always call `revalidatePath()` or `revalidateTag()` after mutation

## Validation Pattern
- Zod schemas are the source of TypeScript types (`z.infer<typeof schema>`)
- User input schemas: `packages/shared/src/schemas/[domain].ts` (no server-only, importable by client)
- Config schemas: co-located with config, must import `"server-only"`

## Component Pattern (three-layer composition)
- `vendor/shadcn/` and `vendor/magic-ui/` → IMMUTABLE
- `app/common/` → branded wrappers
- `app/[domain]/` → feature components
- Feature code imports from `app/`, never from `vendor/`

## Singleton Services
- `apps/web/src/lib/[service]/` — one instantiation point
- Service modules export configured client only, no business logic
- Server-side clients: `import "server-only"`

## Security Pattern
- Zero-trust: browser is hostile, all mutations server-side
- `service_role` key: server-only, never in `NEXT_PUBLIC_*`
- RLS: enabled on every table, default-deny, defense-in-depth (not primary gate)
- UUIDs for PKs, TIMESTAMPTZ for all timestamps

## Asset Loading Pattern
- Small static: `apps/web/public/assets/`
- Brand assets: `apps/web/public/branding/`
- Large game assets: Azure Blob Storage with content-hash filenames
- User-generated: Supabase Storage (RLS-protected)
