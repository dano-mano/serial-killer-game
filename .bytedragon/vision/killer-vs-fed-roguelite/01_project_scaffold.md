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
  - ".env.example with all required and optional environment variable stubs"
  - "rate-limiter-flexible v10.0.1 configured in proxy.ts with centralized rate limit config"
created: 2026-03-17
last_aligned: v1.2.0
---

# Vision Piece 01: Project Scaffold

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: none (foundation)

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Bootstrap the complete Turborepo monorepo for a browser-based asymmetric roguelite game. This piece creates the entire development infrastructure — every subsequent feature depends on this foundation.

### Monorepo Structure

The project uses a monorepo build system with four packages that enforce a strict dependency topology:

- **Web app**: The Next.js application. Contains the App Router pages, React components organized by domain, a centralized config module, a Data Access Layer, Zustand stores, singleton service clients (logger, error tracking), and Server Actions.
- **Game engine**: All Phaser game code. This package must never import React — the isolation between game engine and UI framework is a hard architectural rule.
- **Shared**: Types, constants, schemas, and utilities used by both the web app and the game engine. No framework dependencies.
- **UI theme**: Design tokens and brand configuration. No framework dependencies.

Supporting directories at the root: a database migrations folder, a cloud functions folder, and GitHub Actions CI/CD workflows.

### Environment Configuration

The application uses a centralized configuration module that validates all environment variables at startup using a schema validation library. The application must refuse to start if any required variable is missing or invalid — no lazy validation at first use. No code outside the configuration module may read environment variables directly.

Required environment variables include:
- The Supabase project URL and anonymous key (both public, available to the client)
- The Supabase service role key (server-only, must never be exposed to client bundles)
- The Sentry data source name for error tracking
- A Sentry auth token for CI/CD source map uploads
- Optional analytics keys for PostHog
- An optional Azure Blob Storage base URL for game asset delivery

### Structured Logging

A singleton logger provides all application logging:
- In development: human-readable, colorized console output
- In production: structured JSON with consistent fields (timestamp, level, message, context object)
- Errors are automatically forwarded to the error tracking service
- No direct console usage in production code — all output routes through the logger

### Error Tracking

A singleton error tracking client is initialized separately for client-side and server-side contexts:
- Client-side: captures error boundary failures and includes component context
- Server-side: captures request context (route, method, user ID) without personal data
- Source maps are uploaded during CI/CD so stack traces reference original source

### Error Handling

All data access and game logic uses an explicit Result pattern (ok/err) rather than thrown exceptions:
- A Result wrapper type encapsulates either a success value or a typed error
- Common error categories: base application error, validation failure, not-found, unauthorized, database error
- Errors can be serialized for transport across process boundaries
- Convention: DAL functions and game engine logic return Result values; Server Actions use a safe action wrapper; React error boundaries handle unrecoverable thrown exceptions

### ESLint Configuration

The linter enforces two critical custom rules in addition to standard TypeScript and Next.js rules:
- No barrel files: index files that merely re-export other modules are rejected
- No direct environment variable access: reading environment variables is only permitted within the centralized config module

The barrel file restriction does not apply to package boundary entry points in the game-engine and shared packages.

### Testing Infrastructure

Three testing layers are configured:
- **Unit and component tests**: A workspace-aware test runner with per-package configuration. Component testing in the web app uses a React testing library. Tests live in a centralized tests directory at each package root, mirroring the source structure.
- **End-to-end tests**: A browser automation framework is configured in the web app with a basic scaffold and an example test.
- All test files use a `.test.ts` or `.test.tsx` suffix.

### Docker

A multi-stage container build produces a minimal production image:
1. First stage installs all dependencies
2. Second stage runs the build (producing a standalone output)
3. Third stage copies only the standalone output — no development dependencies in production

Public environment variables are injected at build time as build arguments. Secret server-side variables are provided at runtime via the hosting environment, never baked into the image.

### CI/CD

**On pull request**: lint, test, and build all packages; audit dependencies for critical or high severity vulnerabilities; verify the Node.js version matches the pinned engine requirement.

**On push to main**: run all CI checks, build and push a Docker image to a container registry, then deploy to the hosting service.

### Shared Types Scaffold

The shared package contains two foundational files created in this piece and extended by every subsequent piece:

A base types file defines the primitive type aliases used project-wide: a string-based identifier type (UUID format), a string-based timestamp type (ISO 8601), and a base data transfer object shape with an id and timestamps.

A base schemas file provides reusable validation schemas for those primitives, plus a standard schema for limit/offset pagination parameters.

### Rate Limiting

`proxy.ts` enforces rate limits using `rate-limiter-flexible` v10.0.1:
- Rate limit configuration is defined centrally in `apps/web/src/config/security/rate-limits.ts` — no handler defines limits inline
- Limiter instances are created at module scope in `proxy.ts` (singleton per restart)
- IP identification uses `request.ip` with `x-forwarded-for` fallback for Azure App Service
- Auth endpoints: 5 requests per 15 minutes (30-minute block on exceeded)
- API routes: 30 requests per minute (1-minute block)
- Server Actions: 20 requests per minute (1-minute block)
- Authenticated endpoints: 60 requests per minute (30-second block on exceeded)
- All rate limit rejections return HTTP 429 with a `Retry-After` header
- In-memory store is used for MVP (resets on restart — acceptable for single-instance B1)

### Edge Cases

- Application MUST fail fast on startup if required env vars are missing (not at first use)
- The container build must handle the monorepo structure correctly (prune for the web app only)
- CI must cache dependency and build caches for performance
- The barrel file lint rule must not false-positive on package boundary entry points in the shared and game-engine packages

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

Use `npx create-turbo@latest` as starting point, then restructure to match the required monorepo layout. Alternatively, scaffold manually to ensure exact structure compliance with the constitution.

### Directory Structure

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

### Environment Variables

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

### Shared Types — `packages/shared/src/types/common.ts`

```typescript
type ID = string        // UUID format
type Timestamp = string // ISO 8601

interface BaseDto {
  id: ID
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Shared Schemas — `packages/shared/src/schemas/common.ts`

```typescript
// idSchema — Zod UUID validator
// timestampSchema — Zod ISO 8601 validator
// paginationSchema — Zod schema for limit/offset pagination
```

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
| TypeScript | 5.9.3 | Staying on 5.9.x until 6.0 stability confirmed |
| Tailwind CSS | 4.2.1 | CSS-first config (NO tailwind.config.ts) |
| Phaser | 3.90.0 | In packages/game-engine only |
| Zustand | latest | In apps/web only (bridge layer) |
| Vitest | 4.1.0 | ESM-native |
| Playwright | 1.58.2 | In apps/web only |
| Pino | 10.x | Structured logging |
| neverthrow | latest | Result<T,E> pattern |
| rate-limiter-flexible | 10.0.1 | Rate limiting in proxy.ts (in-memory MVP) |
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

### Content Security Policy

Configure Content Security Policy headers in `proxy.ts`. Include `script-src`, `style-src`, `img-src`, `connect-src` (Supabase WebSocket origins — `wss://*.supabase.co` and `https://*.supabase.co`), and `frame-ancestors` directives. CSP must be defined centrally in `proxy.ts` per Constitution Principle XXII. Placing CSP here (in the scaffold) ensures it is present from the first deployed commit and never added as an afterthought. The `connect-src` directive must include Supabase Realtime WebSocket endpoints — these must be configured before the multiplayer feature is needed or the CSP will block Realtime connections.

### Constitution Compliance Checklist

- [x] I: No barrel files (ESLint rule enforced)
- [x] II: Centralized config with Zod (env.ts)
- [x] III: Shared types in packages/shared/src/types/
- [x] VII: Explicit client/server boundaries (directory structure ready)
- [x] VIII: Singleton services (lib/ pattern)
- [x] IX: Runtime version consistency (.nvmrc, Dockerfile, CI all 24.14.0)
- [x] X: Observability (Pino + Sentry)
- [x] XXI: Rate limiting in proxy.ts (rate-limiter-flexible, centralized config)
- [x] XXII: Content Security Policy defined in proxy.ts
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
- `.env.example` — stubs for all required and optional environment variables
- `apps/web/src/config/security/rate-limits.ts` — centralized rate limit configuration
- `apps/web/src/proxy.ts` — rate limiting integrated via `rate-limiter-flexible` module-scope singletons

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
