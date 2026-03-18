---
name: architecture_patterns
description: Key architectural patterns defined by the project constitution v1.1.0 — use these as the baseline for all pattern discovery and implementation guidance
type: project
---

All patterns from `.specify/memory/constitution.md` v1.1.0 (31 principles). Non-negotiable without a constitution amendment.

**Why:** Constitution ratified 2026-03-15, updated to v1.1.0 on 2026-03-16. Added Principle XXII (CSP) and XXIV (Dependency Management). Principles renumbered — use v1.1.0 numbering.

**How to apply:** Reference these when reporting patterns to orchestrator and when verifying implementation agent work.

## Three-Layer State Bridge (Principle XIV — core unique pattern)
1. **Phaser scenes** — game loop state (physics, sprites) → EventBus for ONE-TIME signals
2. **Zustand** (`apps/web/src/stores/[domain].ts`) — bridges React and Phaser, subscribable OUTSIDE React
3. **Supabase Realtime** — server state flows THROUGH Zustand before React or Phaser consumers

EventBus = one-time signals. Zustand = persistent shared state.
Phaser MUST NOT import React. React MUST NOT import Phaser internals.
Phaser loaded via `next/dynamic` with `ssr: false`.

## DAL Pattern (Principle XII)
- All queries through `apps/web/src/dal/[domain]/`
- Every DAL file: `import "server-only"` at top
- Returns DTOs (not raw DB responses)
- Components and Server Actions MUST NOT construct queries directly

## Server Actions Pattern (Principle XIII)
- `apps/web/src/app/actions/[domain]/[action].ts`
- `'use server'` directive
- Validate with Zod BEFORE calling DAL (never trust client input)
- Call `revalidatePath()` or `revalidateTag()` after mutation
- Use `next-safe-action` library for typed results

## Validation Pattern (Principle XI)
- Zod schemas are source of TypeScript types: `z.infer<typeof schema>`
- User input schemas: `packages/shared/src/schemas/[domain].ts` (NO server-only — client importable)
- Config schemas: co-located with config, MUST import `"server-only"`
- Server Actions re-validate even if client already validated (never trust client)

## Component Pattern — Three-layer composition (Principle V)
- `vendor/shadcn/` and `vendor/magic-ui/` → IMMUTABLE (never modify, never import directly)
- `app/common/` → branded wrappers (AppButton, AppCard, etc.)
- `app/[domain]/` → feature components
- Feature code imports from `app/`, never from `vendor/`

## Singleton Services (Principle VIII)
- `apps/web/src/lib/[service]/` — one instantiation point per service
- Service modules export configured client only, no business logic
- Server-side clients: `import "server-only"`
- Example: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server), `lib/logger/pino.ts`

## Security Pattern (Principles XVI-XXII)
- Zero-trust: browser is hostile, all mutations server-side
- `service_role` key: server-only, NEVER in `NEXT_PUBLIC_*`
- RLS: enabled on every table, default-deny, defense-in-depth (NOT primary gate)
- UUIDs for ALL PKs, TIMESTAMPTZ for ALL timestamps
- CSP defined in `proxy.ts` (not scattered across handlers)
- `npm audit` must pass with zero critical/high in CI (Principle XXIV)

## Error Handling Pattern (hybrid per layer)
- Phaser/DAL/Zustand: neverthrow `Result<T, AppError>`
- Server Actions: next-safe-action typed results
- React uncaught: Next.js `error.tsx` boundaries
- Shared error types: `packages/shared/src/types/errors.ts` (AppError, ErrorCode)
- ESLint `neverthrow/must-use-result: error` enforces result consumption

## Asset Loading Pattern (Principle XXXI)
- Small static: `apps/web/public/assets/`
- Brand assets: `apps/web/public/branding/`
- Large game assets: Azure Blob Storage with content-hash filenames, `Cache-Control: immutable`
- User-generated: Supabase Storage (RLS-protected)

## ContentRegistry<T> Pattern (Game-specific — vision/08_combat_system.md)
- All game content (skills, items, damage types, status effects) registered via generic registry
- `DamageTypeId = string` (registry-driven) — NEVER hardcoded `DamageType = 'MELEE' | 'RANGED'`
- Universal `Effect` type handles 95% of mechanics; CUSTOM escape hatch for MYTHIC boss items
- Adding content = adding data entry, zero code changes

## Tailwind v4 — IMPORTANT GOTCHA (session note 2026-03-16)
- NO `tailwind.config.js` or `tailwind.config.ts`
- CSS-first config via `@theme` directive in CSS entry point
- Just `@import "tailwindcss"` — no config file needed
- All theme customization via CSS variables in the CSS file
