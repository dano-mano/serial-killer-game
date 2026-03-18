---
vision: killer-vs-fed-roguelite
sequence: 01
name: project-scaffold
group: Foundation
group_order: 1
status: pending
depends_on: []
produces:
  - "Turborepo monorepo with apps/web, packages/game-engine, packages/shared, packages/ui-theme"
  - "Next.js 16 app shell with App Router, proxy.ts, layout.tsx"
  - "ESLint flat config with barrel file prevention and no-direct-process-env rules"
  - "Vitest workspace config with per-package test setup"
  - "Playwright config scaffold for E2E"
  - "Dockerfile (node:24-alpine, Next.js standalone output)"
  - "GitHub Actions CI/CD workflows (lint, test, build, deploy)"
  - "Centralized Zod-validated environment config"
  - "Pino 10.x structured logging singleton with Sentry integration"
  - "Sentry error tracking singleton (client + server)"
  - "neverthrow Result<T,E> utilities and shared error types"
  - "TypeScript strict configs with path aliases"
  - "Root .nvmrc (24.14.0), .node-version, package.json with workspaces"
  - "Shared types scaffold (packages/shared/src/types/common.ts)"
  - "Shared schemas scaffold (packages/shared/src/schemas/common.ts)"
created: 2026-03-17
last_aligned: never
---

# Vision Piece 01: Project Scaffold

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: none (foundation)

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Bootstrap the complete Turborepo monorepo for a browser-based asymmetric roguelite game built with Next.js 16, Phaser 3, and Supabase. This piece creates the entire development infrastructure — every subsequent feature depends on this foundation.

### Monorepo Structure

The project uses Turborepo with four packages:

```
/
├── apps/
│   └── web/                     # Next.js 16.1.6 application
│       ├── src/
│       │   ├── app/             # App Router (layout.tsx, page.tsx)
│       │   ├── proxy.ts         # Next.js 16 proxy (renamed from middleware.ts)
│       │   ├── components/
│       │   │   ├── vendor/shadcn/     # IMMUTABLE (installed by the design system feature)
│       │   │   ├── vendor/magic-ui/   # IMMUTABLE (installed by the design system feature)
│       │   │   └── app/
│       │   │       └── common/        # App-layer wrappers (created by the design system feature)
│       │   ├── config/          # Centralized Zod-validated configuration
│       │   ├── dal/             # Data Access Layer (created per domain in later pieces)
│       │   ├── stores/          # Zustand stores (created per domain in later pieces)
│       │   ├── lib/             # Singleton service clients
│       │   │   ├── logger/      # Pino instance
│       │   │   └── sentry/      # Sentry SDK init
│       │   └── app/actions/     # Server Actions (created per domain in later pieces)
│       ├── tests/               # Centralized test directory mirroring src/
│       ├── public/
│       │   ├── assets/          # Small static assets
│       │   └── branding/        # Brand assets (logo, OG images)
│       ├── playwright.config.ts
│       └── vitest.config.ts
├── packages/
│   ├── game-engine/             # Phaser 3 game code (MUST NOT import React)
│   │   ├── src/
│   │   ├── tests/
│   │   └── vitest.config.ts
│   ├── shared/                  # Shared types, constants, schemas
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   └── common.ts    # Base types (ID, Timestamp, etc.)
│   │   │   ├── constants/
│   │   │   ├── schemas/
│   │   │   │   └── common.ts    # Base Zod schemas
│   │   │   └── utils/
│   │   │       └── result.ts    # neverthrow Result<T,E> utilities
│   │   ├── tests/
│   │   └── vitest.config.ts
│   └── ui-theme/                # Design tokens, brand config
│       ├── src/
│       │   ├── tokens/
│       │   └── brand/
│       ├── tests/
│       └── vitest.config.ts
├── supabase/
│   ├── migrations/
│   └── functions/
├── .github/
│   └── workflows/
│       ├── ci.yml               # Lint, test, build on PR
│       └── deploy.yml           # Docker build → ghcr.io → Azure
├── Dockerfile
├── .dockerignore
├── turbo.json
├── .nvmrc                       # 24.14.0
├── .node-version                # 24.14.0
├── eslint.config.mjs
├── vitest.workspace.ts
├── tsconfig.json                # Root TypeScript config
└── package.json                 # Workspaces definition
```

### Package Naming Convention

- `@repo/game-engine` — Phaser game code
- `@repo/shared` — Shared types, constants, schemas, utilities
- `@repo/ui-theme` — Design tokens and brand configuration

### Environment Configuration

Centralized environment config at `apps/web/src/config/env.ts` using Zod validation. The application MUST fail to start if required environment variables are missing or invalid. No direct `process.env` access anywhere else in the codebase.

Initial environment variables:

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | string (URL) | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | string | Yes | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | string | Yes (server) | Supabase service role key (NEVER in client bundles) |
| `NEXT_PUBLIC_SENTRY_DSN` | string (URL) | Yes | Sentry Data Source Name |
| `SENTRY_AUTH_TOKEN` | string | Yes (CI) | Sentry auth for source maps |
| `NEXT_PUBLIC_POSTHOG_KEY` | string | No | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | string (URL) | No | PostHog instance URL |
| `AZURE_BLOB_STORAGE_URL` | string (URL) | No | Azure Blob Storage base URL for game assets |

### Structured Logging

Pino 10.x singleton at `apps/web/src/lib/logger/pino.ts`:
- Development: pretty-printed console output with colors
- Production: structured JSON with consistent fields (timestamp, level, message, context)
- Sentry integration: errors automatically forwarded to Sentry
- No `console.log` in production code — all logging through Pino

### Error Tracking

Sentry singleton at `apps/web/src/lib/sentry/client.ts`:
- Client-side: automatic error boundary capture, component context
- Server-side: request context (route, method, user ID without PII)
- Source map uploading in CI/CD pipeline

### Error Handling

neverthrow Result pattern utilities at `packages/shared/src/utils/result.ts`:
- `Result<T, E>` wrapper with standard `ok()` and `err()` constructors
- Common error types: `AppError` (base), `ValidationError`, `NotFoundError`, `UnauthorizedError`, `DatabaseError`
- Error serialization utilities for crossing process boundaries
- Convention: DAL functions and game engine logic return `Result<T, E>`. Server Actions use `next-safe-action`. React error boundaries catch thrown exceptions.

### ESLint Configuration

Flat config at `eslint.config.mjs`:
- `eslint-config-next` base
- Custom rule: no barrel files (reject `index.ts` that re-export)
- Custom rule: no direct `process.env` access outside `config/` directories
- TypeScript-ESLint strict rules
- Per-package config overrides where needed

### Testing Infrastructure

- **Vitest 4.1.0**: Workspace config at root (`vitest.workspace.ts`) with per-package configs
- **React Testing Library 16.3.2**: Configured in `apps/web/vitest.config.ts` for component testing
- **Playwright 1.58.2**: Config at `apps/web/playwright.config.ts`, basic scaffold with example test
- Tests live in `tests/` at each package root, mirroring `src/` structure
- `.test.ts` / `.test.tsx` suffix required

### Docker

Multi-stage Dockerfile using `node:24-alpine`:
1. **deps stage**: `npm ci` (all dependencies for build)
2. **build stage**: `turbo build --filter=web` (Next.js standalone output)
3. **runner stage**: Copy standalone output, `node server.js` (minimal image)

`NEXT_PUBLIC_*` variables set as build-args. Server-side secrets set at runtime via Azure App Service Application Settings (never baked into image).

### CI/CD

**ci.yml** (on PR):
1. Setup Node.js 24.14.0
2. `npm ci`
3. `turbo lint`
4. `turbo test`
5. `turbo build`
6. `npm audit` (fail on critical/high)
7. Validate Node.js version matches `engines.node`

**deploy.yml** (on push to main):
1. Run CI checks
2. Docker build with build-args for `NEXT_PUBLIC_*` vars
3. Push to ghcr.io
4. Deploy to Azure App Service (pull from ghcr.io)

### Shared Types Scaffold

`packages/shared/src/types/common.ts`:
- `type ID = string` (UUID format)
- `type Timestamp = string` (ISO 8601)
- `type Result<T, E> = import('neverthrow').Result<T, E>`
- Base DTO interface with `id` and timestamps

`packages/shared/src/schemas/common.ts`:
- `idSchema` — Zod UUID validator
- `timestampSchema` — Zod ISO 8601 validator
- `paginationSchema` — Zod schema for limit/offset pagination

### Edge Cases

- Application MUST fail fast on startup if required env vars are missing (not at first use)
- Dockerfile MUST handle Turborepo monorepo structure (prune for web app)
- GitHub Actions MUST cache `node_modules` and Turborepo cache for performance
- ESLint must not false-positive on `packages/shared/` package.json `exports` field (these are package boundary entry points, not barrel files)

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

Use `npx create-turbo@latest` as starting point, then restructure to match the required monorepo layout. Alternatively, scaffold manually to ensure exact structure compliance with the constitution.

### Package Configuration

- Package naming: `@repo/game-engine`, `@repo/shared`, `@repo/ui-theme`
- TypeScript: strict mode everywhere, `"moduleResolution": "bundler"`, path aliases via `tsconfig.json` `paths`
- Each package has its own `tsconfig.json` extending root
- `packages/game-engine` MUST NOT have React as a dependency (Phaser and React are isolated per constitution)

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| Node.js | 24.14.0 | Pin in .nvmrc, Dockerfile, CI |
| Next.js | 16.1.6 | Turbopack default, App Router |
| React | 19.2.4 | View Transitions, React Compiler |
| TypeScript | 5.9.3+ | Upgrade to 6.0.x when stable |
| Tailwind CSS | 4.2.1 | CSS-first config (NO tailwind.config.ts) |
| Phaser | 3.90.0 | In packages/game-engine only |
| Zustand | latest | In apps/web only (bridge layer) |
| Vitest | 4.1.0 | ESM-native |
| Playwright | 1.58.2 | In apps/web only |
| Pino | 10.x | Structured logging |
| neverthrow | latest | Result<T,E> pattern |
| next-safe-action | latest | Server Action validation (skeleton setup) |
| Sentry | latest | @sentry/nextjs |
| ESLint | 9.x | Flat config |

### Testing Strategy

- Unit tests for shared utilities (Result pattern, Zod schemas)
- Smoke test for Next.js app startup (pages render without error)
- E2E scaffold: single Playwright test that loads the home page
- Vitest workspace enables `turbo test` to run all package tests
- Tests in `tests/` directory at each package root

### Docker Build Strategy

```dockerfile
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/*/  # one COPY per package
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SENTRY_DSN
RUN npx turbo build --filter=web

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
CMD ["node", "apps/web/server.js"]
```

### CI/CD Approach

- GitHub Actions with `actions/setup-node@v4` pinned to 24.14.0
- npm cache via `actions/cache` for `~/.npm`
- Turborepo remote caching optional (evaluate after initial setup)
- `npm audit` step blocks deployment on critical/high vulnerabilities

### File Structure Details

- `apps/web/src/config/env.ts` — exports validated env vars, all typed
- `apps/web/src/lib/logger/pino.ts` — exports singleton Pino instance
- `apps/web/src/lib/sentry/client.ts` — exports Sentry init function
- `packages/shared/src/utils/result.ts` — exports `ok()`, `err()`, error types
- All service clients follow singleton pattern: create instance, export it, import where needed

### Constitution Compliance Checklist

- [x] I: No barrel files (ESLint rule enforced)
- [x] II: Centralized config with Zod (env.ts)
- [x] III: Shared types in packages/shared/src/types/
- [x] VII: Explicit client/server boundaries (directory structure ready)
- [x] VIII: Singleton services (lib/ pattern)
- [x] IX: Runtime version consistency (.nvmrc, Dockerfile, CI all 24.14.0)
- [x] X: Observability (Pino + Sentry)
- [x] XXIV: Dependency management (npm audit in CI)
- [x] XXVI: Centralized tests/ directories

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

When this piece is fully implemented, it should produce:

- `turbo.json` with build/test/lint pipeline definitions
- `apps/web/` — Next.js 16 app with App Router, layout.tsx, page.tsx, proxy.ts
- `packages/game-engine/` — empty game engine scaffold with package.json, tsconfig
- `packages/shared/` — types/common.ts, schemas/common.ts, utils/result.ts
- `packages/ui-theme/` — empty token and brand scaffold with package.json, tsconfig
- `eslint.config.mjs` — flat config with barrel file and process.env rules
- `vitest.workspace.ts` + per-package vitest configs
- `apps/web/playwright.config.ts` — E2E scaffold
- `Dockerfile` — multi-stage, node:24-alpine, standalone output
- `.github/workflows/ci.yml` and `deploy.yml`
- `apps/web/src/config/env.ts` — Zod-validated env vars
- `apps/web/src/lib/logger/pino.ts` — Pino singleton
- `apps/web/src/lib/sentry/client.ts` — Sentry init
- `packages/shared/src/utils/result.ts` — neverthrow utilities
- `.nvmrc` and `.node-version` — both contain "24.14.0"
- Root `package.json` with workspaces array

### Dependencies (Consumed from Earlier Pieces)

None — this is a foundation piece.

### Success Criteria

- [ ] `npm install` succeeds from clean checkout
- [ ] `turbo build` completes successfully for all packages
- [ ] `turbo lint` passes with zero errors
- [ ] `turbo test` runs (even if only smoke tests)
- [ ] Next.js app starts and renders the home page
- [ ] Docker image builds successfully
- [ ] Environment validation fails fast when required vars are missing
- [ ] ESLint catches barrel file patterns and direct process.env usage

### Alignment Notes

This piece is the foundation for all 14 subsequent pieces. Changes to the monorepo structure, package naming, or path conventions will cascade to every downstream piece. The environment config module will be extended by every piece that adds new env vars. The shared types and schemas directories will grow incrementally with each piece.
