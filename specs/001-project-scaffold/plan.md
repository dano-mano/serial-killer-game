# Implementation Plan: Project Scaffold

**Branch**: `001-project-scaffold` | **Date**: 2026-03-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-project-scaffold/spec.md`

## Summary

Bootstrap the complete Turborepo monorepo with four packages (web app, game engine, shared, ui-theme) providing all development infrastructure: centralized Zod-validated env config, Pino structured logging, Sentry error tracking, neverthrow Result pattern, ESLint 10 flat config with barrel file and process.env custom rules, rate limiting via rate-limiter-flexible in proxy.ts, CSP headers, Vitest per-package configs + Playwright E2E scaffold, multi-stage Docker build, and GitHub Actions CI/CD pipeline. Every subsequent feature depends on this foundation.

## Technical Context

**Language/Version**: TypeScript 5.9.3 (staying on 5.9.x until 6.0 stability confirmed)
**Primary Dependencies**: Next.js 16.1.6, React 19.2.4, Phaser 3.90.0, Tailwind CSS 4.2.1, Zustand (latest), Pino 10.x, neverthrow (latest), rate-limiter-flexible 10.0.1, next-safe-action (latest), @sentry/nextjs (latest), Zod (latest)
**Storage**: Supabase Cloud (PostgreSQL) -- no database tables in scaffold, connection config only
**Testing**: Vitest 4.1.0, React Testing Library 16.3.2, Playwright 1.58.2
**Target Platform**: Browser (desktop + mobile), deployed as Docker container on Azure App Service B1 Linux
**Project Type**: Monorepo web application (Turborepo, npm workspaces)
**Performance Goals**: Fresh clone to running application in under 5 minutes (SC-001)
**Constraints**: Node.js 24.14.0 LTS pinned across all environments; single-instance B1 deployment for MVP; game engine package MUST NOT import React
**Scale/Scope**: Solo developer, MVP phase, 19 vision pieces planned after scaffold

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Applies | Plan Compliance |
|-----------|---------|-----------------|
| I. Direct Import Strategy | Yes | ESLint custom rule enforces no barrel files; package `exports` field for boundary entry points |
| II. Centralized Configuration | Yes | `apps/web/src/config/env.ts` with Zod validation; ESLint rule blocks direct `process.env` |
| III. Shared Types | Yes | `packages/shared/src/types/common.ts` — ID, Timestamp, BaseDto |
| IV. Centralized Branding | Yes | `packages/ui-theme/` scaffold with tokens/ and brand/ directories |
| V. Immutable Vendor Components | Yes | `components/vendor/shadcn/` and `vendor/magic-ui/` directories created empty (populated by design system feature) |
| VI. Domain-Based Organization | Yes | Directory structure uses `[domain]/` pattern throughout |
| VII. Client/Server Boundaries | Yes | Explicit directory separation: config/, dal/, lib/ (server); components/, stores/ (client) |
| VIII. Singleton Services | Yes | Logger (pino.ts), error tracking (sentry/client.ts, sentry/server.ts) as singletons in lib/ |
| IX. Runtime Version Consistency | Yes | Node.js 24.14.0 in .nvmrc, .node-version, Dockerfile, CI workflow |
| X. Observability | Yes | Pino structured logging + Sentry error tracking from first commit |
| XI. Zod Schema Validation | Yes | Environment config uses Zod; base schemas in packages/shared |
| XVI. Zero-Trust Frontend | Yes | Architecture separates client/server; no service_role key in client bundles |
| XVIII. Secrets Management | Yes | SUPABASE_SERVICE_ROLE_KEY server-only; SENTRY_AUTH_TOKEN CI-only; secrets via runtime env |
| XX. Input Validation | Yes | Zod at env config boundary; rate-limiter-flexible at request boundary |
| XXI. Rate Limiting | Yes | rate-limiter-flexible 10.0.1 in proxy.ts; centralized config in config/security/ |
| XXII. Content Security Policy | Yes | CSP headers defined centrally in proxy.ts; connect-src includes Supabase WebSocket origins |
| XXIII. Zero Tech Debt | Yes | Scaffold starts clean; no shortcuts |
| XXIV. Dependency Management | Yes | npm audit in CI blocks critical/high vulnerabilities |
| XXV. No Ephemeral References | Yes | No spec IDs, line counts, or planning artifact references in source code |
| XXVI. Test Organization | Yes | `tests/` at each package root mirroring `src/`; `.test.ts`/`.test.tsx` suffix |

**Gate result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-scaffold/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Implementation research
├── data-model.md        # Phase 1: Shared types and schemas
├── quickstart.md        # Phase 1: Developer setup guide
├── contracts/
│   └── shared-package.md  # Phase 1: Shared package public surface
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
/
├── apps/
│   └── web/                          # Next.js 16.1.6 application
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx        # Root layout (Sentry client init, metadata)
│       │   │   ├── page.tsx          # Home page (minimal scaffold)
│       │   │   ├── error.tsx         # Root error boundary
│       │   │   └── global-error.tsx  # Global error boundary (catches layout errors)
│       │   ├── proxy.ts              # Next.js 16 proxy (rate limiting, CSP headers)
│       │   ├── instrumentation.ts    # Sentry server registration + onRequestError
│       │   ├── instrumentation-client.ts  # Sentry client-side init
│       │   ├── sentry.server.config.ts    # Sentry server init + pinoIntegration
│       │   ├── components/
│       │   │   ├── vendor/shadcn/    # IMMUTABLE (empty, created by design system feature)
│       │   │   ├── vendor/magic-ui/  # IMMUTABLE (empty, created by design system feature)
│       │   │   └── app/
│       │   │       └── common/       # App-layer wrappers (empty, created by design system feature)
│       │   ├── config/
│       │   │   ├── env.ts            # Zod-validated environment variables
│       │   │   └── security/
│       │   │       └── rate-limits.ts  # Rate limit configuration per endpoint category
│       │   ├── dal/                  # Data Access Layer (empty, created per domain later)
│       │   ├── stores/              # Zustand stores (empty, created per domain later)
│       │   ├── lib/
│       │   │   ├── logger/
│       │   │   │   └── pino.ts      # Singleton Pino instance
│       │   │   └── sentry/
│       │   │       ├── client.ts    # Sentry client-side init
│       │   │       └── server.ts    # Sentry server-side init
│       │   └── app/actions/         # Server Actions (empty, created per domain later)
│       ├── tests/
│       │   ├── config/
│       │   │   └── env.test.ts      # Environment validation tests
│       │   └── app/
│       │       └── page.test.tsx    # Home page smoke test
│       ├── public/
│       │   ├── assets/              # Small static assets (empty)
│       │   └── branding/            # Brand assets (empty)
│       ├── e2e/
│       │   └── home.spec.ts         # Playwright E2E: home page loads
│       ├── next.config.ts
│       ├── playwright.config.ts
│       ├── vitest.config.ts
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   ├── game-engine/                  # Phaser 3 (MUST NOT import React)
│   │   ├── src/
│   │   │   └── index.ts             # Package entry point (exports nothing yet)
│   │   ├── tests/
│   │   │   └── setup.test.ts        # Verify package builds
│   │   ├── vitest.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json             # @repo/game-engine (NO React dependency)
│   ├── shared/                       # Shared types, constants, schemas
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   └── common.ts        # ID, Timestamp, BaseDto
│   │   │   ├── constants/
│   │   │   │   └── errors.ts        # Error category constants
│   │   │   ├── schemas/
│   │   │   │   └── common.ts        # idSchema, timestampSchema, paginationSchema
│   │   │   └── utils/
│   │   │       └── result.ts        # neverthrow wrappers: ok(), err(), AppError types
│   │   ├── tests/
│   │   │   ├── schemas/
│   │   │   │   └── common.test.ts   # Schema validation tests
│   │   │   └── utils/
│   │   │       └── result.test.ts   # Result pattern tests
│   │   ├── vitest.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json             # @repo/shared (exports field maps subpaths)
│   └── ui-theme/                     # Design tokens, brand config
│       ├── src/
│       │   ├── tokens/
│       │   │   └── colors.ts        # Color token definitions (empty scaffold)
│       │   └── brand/
│       │       └── config.ts        # Brand configuration (empty scaffold)
│       ├── tests/
│       │   └── setup.test.ts        # Verify package builds
│       ├── vitest.config.ts
│       ├── tsconfig.json
│       └── package.json             # @repo/ui-theme
├── supabase/
│   ├── migrations/                   # SQL migrations (empty)
│   └── functions/                    # Edge Functions (empty)
├── .github/
│   └── workflows/
│       ├── ci.yml                    # PR: lint, test, build, audit, version verify
│       └── deploy.yml                # Main: build → ghcr.io → Azure App Service
├── .env.example                      # All env var stubs with descriptions
├── Dockerfile                        # Multi-stage: deps → builder → runner
├── .dockerignore
├── turbo.json                        # Pipeline: build, test, lint
├── .nvmrc                            # 24.14.0
├── .node-version                     # 24.14.0
├── eslint.config.mjs                 # ESLint 10 flat config with custom rules
├── vitest.shared.mts                 # Shared test config (imported by per-package configs)
├── tsconfig.json                     # Root TypeScript config (strict)
└── package.json                      # npm workspaces: apps/*, packages/*
```

**Structure Decision**: Turborepo monorepo with npm workspaces. Four packages enforce strict dependency topology: `shared` is a leaf (no internal deps), `ui-theme` is a leaf, `game-engine` depends only on `shared`, and `web` depends on all three. This matches the constitution's domain-based organization principle.

## Complexity Tracking

No violations detected — no complexity justifications needed.
