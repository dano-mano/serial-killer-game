---
name: conventions
description: Naming conventions, directory patterns, import rules, and file directives for this codebase
type: project
---

All conventions are derived from `.specify/memory/constitution.md` v1.2.0.

**Why:** Constitution is the governing authority — conventions are non-negotiable without an amendment.

**How to apply:** Apply these in every pattern discovery and every recommendation to implementation agents.

## Import Conventions (Principle I — CRITICAL, ESLint-enforced)
- Direct imports only — no barrel files (`index.ts` re-exports PROHIBITED)
- Cross-package: use package `exports` field entry points (build-system managed, not hand-written barrels)
- `@repo/shared/types/game` maps to `packages/shared/src/types/game.ts` — allowed (package boundary)
- NEVER: `import { X } from '@/components/app/common'` (barrel)
- ALWAYS: `import { X } from '@/components/app/common/AppButton'` (direct)

## Directory Naming
- All directories: `kebab-case`
- Domain pattern: `[domain]/` notation — functional area naming, not technical role
- Package naming: `@repo/game-engine`, `@repo/shared`, `@repo/ui-theme`

## Domain-Based Organization (Principle VI)
Every layer uses `[domain]/` subdirectory pattern:
- `apps/web/src/config/[domain]/` or `config/env.ts` for env
- `apps/web/src/dal/[domain]/`
- `apps/web/src/stores/[domain].ts`
- `apps/web/src/lib/[service]/`
- `apps/web/src/app/actions/[domain]/`
- `packages/shared/src/types/[domain].ts`
- `packages/shared/src/schemas/[domain].ts`
- `docs/architecture/`, `docs/integrations/`, `docs/[domain]/`

## File Naming Conventions
- TypeScript: `kebab-case.ts` / `kebab-case.tsx`
- React components: `PascalCase.tsx`
- Test files: `[source-name].test.ts` or `[source-name].test.tsx`
- E2E specs: `[feature].spec.ts` (keeps E2E out of Vitest include patterns)
- Directories: `kebab-case`

## File Directive Requirements (Principle VII)
| Module Type | Directive |
|-------------|-----------|
| Client components | `"use client"` at top of file |
| Server-only modules (DAL, lib/supabase/server, lib/logger/pino) | `import "server-only"` at top |
| Server Actions files | `'use server'` at top |
| Config files (`config/[domain]/`) | No special directive — process.env allowed here ONLY |

## Test Organization (Principle XXVI)
- `tests/` at package root — sibling to `src/`, NEVER inside `src/`
- Each package has its own `tests/` directory mirroring `src/` structure
- No test files co-located with source files

## Source Code Prohibitions (Principles I, II, XXIII, XXV)
- No `process.env` access outside `config/[domain]/` files (ESLint: `n/no-process-env`)
- No ephemeral references in source: T001, FR-001, ADR-001, spec paths
- No TODO without a corresponding tracked issue
- No commented-out code (use version control for history)
- No `console.log` in production code — use Pino logger (ESLint: `no-console` allows warn/error)
- No barrel file `index.ts` re-exports (ESLint: `no-barrel-files/no-barrel-files`)
- Feature code NEVER imports from `components/vendor/` directly (ESLint: `no-restricted-imports`)

## Supabase Database Conventions (Principle XV)
- UUIDs for ALL primary keys
- `TIMESTAMPTZ` for ALL timestamps
- 3NF starting point — denormalization requires documented rationale in migration file
- JSONB only for genuinely variable-shape data with documented rationale

## Next.js 16 File Naming (GOTCHA)
- `middleware.ts` → renamed to `proxy.ts` (Next.js 16 removed Edge runtime from proxy)
- `next lint` command → REMOVED; use `eslint .` directly in scripts

## Tailwind v4 Conventions (GOTCHA from session note)
- NO `tailwind.config.js` or `tailwind.config.ts` — file does not exist in this project
- All theme in CSS via `@theme` directive
- Just `@import "tailwindcss"` in CSS entry point
