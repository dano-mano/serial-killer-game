---
name: project_context
description: Project type, current status, what exists vs. what's planned to be built
type: project
---

Greenfield browser-based asymmetric roguelite game — "Serial Killer vs. Fed". One player hunts targets while evading detection; the other investigates crime scenes to identify and arrest the killer. Both players disguised among NPCs.

**Why:** Foundation-first approach — governance and architecture ratified before game design. Game design vision (19 pieces) completed 2026-03-18. 001-project-scaffold completed 2026-03-20.

**How to apply:** No game logic exists yet. All scaffold directories are ready but empty (DAL, stores, actions, components). First game implementation piece is 02+.

## What Exists (as of 2026-03-20)
- `.specify/memory/constitution.md` — 33-principle governance document (v1.2.0)
- `.bytedragon/TECH_RESEARCH.md` — Full technology research
- `apps/web/` — Complete Next.js 16.2.0 scaffold (55 tasks done)
  - config/env.ts, config/security/rate-limits.ts
  - lib/logger/pino.ts
  - proxy.ts (rate limiting + CSP + security headers)
  - instrumentation.ts, instrumentation-client.ts, sentry.server.config.ts
  - app/layout.tsx, app/page.tsx (placeholder), app/error.tsx, app/global-error.tsx
  - app/globals.css (Tailwind v4 @theme inline tokens)
  - tests/ with env.test.ts and page.test.tsx
  - e2e/ with home.spec.ts
- `packages/shared/` — types, schemas, constants, result utils (fully tested)
- `packages/game-engine/` — EMPTY scaffold (src/index.ts is a comment-only placeholder)
- `packages/ui-theme/` — color tokens + brand config
- `Dockerfile`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml` — complete CI/CD

## What Does NOT Exist Yet
- No game scenes, Phaser code, or rendering logic
- No Zustand stores (apps/web/src/stores/ is .gitkeep only)
- No DAL modules (apps/web/src/dal/ is .gitkeep only)
- No Server Actions (apps/web/src/app/actions/ is .gitkeep only)
- No app/common/ or app/[domain]/ components
- No shadcn/ui or Magic UI components installed
- No Supabase database tables
- No auth implementation

## Known Issues from Compliance Audit
1. CI workflow trigger is `workflow_dispatch` only — needs `pull_request` trigger (FR-019)
2. Dockerfile comment noted using node:24-alpine but actual file uses node:24.14.0-alpine (constitution-compliant)

## Critical Warnings
- Piece 09 depends on 08 (evidence system consumes combat events) — NOT parallelizable
- ContentRegistry<T> pattern (pieces 08+): use `DamageTypeId = string`, NOT hardcoded unions
- Ghost token scarcity intentional — don't add GT sources without balance review
- Art style guide: `.bytedragon/vision/killer-vs-fed-roguelite/art-style-guide.md`
- Constitution v1.2.0 adds Principle XXIX (Art Style Consistency) and XXXIII (Graceful Visual Degradation)

## Verified
2026-03-20 — fully re-verified against actual scaffold source code (all files read directly)
