---
name: tooling
description: Speckit workflow toolchain, build tooling, testing infrastructure, ESLint, CI/CD, and process decisions
type: project
---

**Why:** Speckit is the spec-driven development workflow for this project. All feature work goes through it.

**How to apply:** When reporting workflow recommendations to orchestrator, use speckit command names and directory conventions.

## Speckit Version
v0.3.0, Claude AI with skills enabled (`.specify/init-options.json`)

## Command Flow
```
/speckit.specify  → specs/[###-feature]/spec.md
/speckit.clarify  → resolve ambiguities in spec
/speckit.plan     → specs/[###-feature]/plan.md + research.md + data-model.md + quickstart.md + contracts/
/speckit.analyze  → cross-artifact consistency check
/speckit.tasks    → specs/[###-feature]/tasks.md
/speckit.implement → execute tasks
/speckit.checklist → quality checklists
/speckit.constitution → amend governance
/speckit.taskstoissues → convert to GitHub issues
```

## Feature Directory Convention
`specs/[###-feature-name]/` with sequential numbering

## Constitution Amendment Pattern (DECISION from session note)
Must follow: @architect -> @quality-auditor -> fix (max 3 cycles) -> `/speckit.constitution`
Single architect draft is insufficient — audit catches gaps. This is mandatory.

## Dual-Audit Pattern for Research (PATTERN from session note)
Every research document needs TWO parallel audits:
1. @quality-auditor (internal consistency)
2. @researcher (external accuracy verification)
Previously caught broken Dockerfile, wrong SQL table reference, wrong cost totals.

## Task Format
`[ID] [P?] [Story] Description`
- `[P]` = parallel-safe (different files, no dependencies)
- Story label = US1, US2, etc.
- Phase order: Setup -> Foundational (blocking) -> User Stories -> Polish
- Tests FIRST (must fail before implementation)

## Build Tooling

### ESLint Flat Config (eslint.config.mjs)
Key rules enforcing constitution:
- `no-barrel-files/no-barrel-files` — Principle I
- `n/no-process-env: error` — Principle II (disabled in `config/` dirs only)
- `no-restricted-imports` on `**/components/vendor/**` — Principle V
- `no-console` (allows warn/error) — Principle X
- `neverthrow/must-use-result: error` — Error handling enforcement
- `jsx-a11y/*` via eslint-config-next — Principle XXVIII

Note: `next lint` command REMOVED in Next.js 16 — use `eslint .` directly.

### Build Script
```json
"build": "rm -rf .next && tsc --noEmit && eslint . && next build"
```
Sequence: clear cache → type check → lint → build

### Turborepo Tasks (turbo.json)
```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^test"] },
    "test:watch": { "cache": false, "persistent": true },
    "lint": {}
  }
}
```

### Vitest 4.1.0
- `vitest.workspace.ts` at monorepo root (not vitest.config.ts)
- Per-package `vitest.config.ts` in each package
- `include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx']`
- Default environment: `jsdom` for component tests
- `@testing-library/jest-dom/vitest` import in vitest.setup.ts

### Playwright 1.58.2
- Config at `apps/web/playwright.config.ts`
- `testDir: './e2e'`
- E2E spec suffix: `.spec.ts` (distinguishes from Vitest `.test.ts`)
- Multi-context pattern for multiplayer tests: `browser.newContext()` per player

## CI/CD Pipeline

### ci.yml (on PR)
1. `actions/setup-node@v4` with `node-version: '24'`
2. `npm ci` (NOT npm install)
3. `turbo lint`
4. `turbo test`
5. `turbo build`
6. `npm audit` — FAILS on critical/high vulnerabilities (Principle XXIV)
7. Validate Node.js version matches `engines.node`

### deploy.yml (on push to main)
1. Run CI checks
2. Supabase migrations: `supabase db push` BEFORE app deployment
3. Docker build with `NEXT_PUBLIC_*` as build-args
4. Push to ghcr.io
5. Azure App Service pulls from ghcr.io

### Dockerfile Pattern (node:24-alpine, multi-stage)
- deps stage: `npm ci`
- builder stage: `turbo build --filter=web`
- runner stage: copy standalone output, `node apps/web/server.js`
- Server secrets: NEVER in Dockerfile — set in Azure App Service Application Settings at runtime

## Package Manager
`npm` ONLY — bundled with Node.js 24. NEVER pnpm, yarn, or bun.
`package-lock.json` MUST be committed. Use `npm ci` in CI.

## Supabase Development Scripts
```json
{
  "db:push": "supabase db push",
  "db:push:dry": "supabase db push --dry-run",
  "db:types": "supabase gen types --linked --lang=typescript > packages/shared/src/types/database.ts"
}
```
Note: db:types outputs to `packages/shared/` (monorepo-adapted from standard single-app pattern).
