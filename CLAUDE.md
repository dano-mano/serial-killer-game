# Project: Browser-Based Video Game

A browser-based video game built with Next.js 16 + Phaser 3 + Supabase, deployed on Azure App Service via containerized GitHub Actions pipeline.

Game design has not been determined yet. The technology stack, architecture, and governance principles are established and ready for any gameplay mechanics to be built on top.

<!-- bytedragon:governance-start -->
## Project Governance (Summary)

`.bytedragon/RULES.md` is the authoritative governance document for this project — it defines
the principles, standards, and constraints that all development must follow. Read it before
making significant changes to architecture, tooling, or conventions.

`.bytedragon/TECH_RESEARCH.md` contains the technology stack decisions — the chosen
technologies, versions, rationale, and compatibility constraints for this project.

**Scope distinction**:
- `CLAUDE.md` — project instructions for AI assistants (workflow, context, preferences)
- `.bytedragon/RULES.md` — governance principles (what standards the project enforces)
- `.bytedragon/TECH_RESEARCH.md` — technology decisions (what stack the project uses)

### Governance Location

Governance principles are in `.specify/memory/constitution.md`. See `.bytedragon/RULES.md` for redirect details.

### Technology Stack Summary

| Layer | Technology | Version | Role/Why |
|-------|-----------|---------|----------|
| Runtime | Node.js | 24.14.0 LTS | Active LTS until Oct 2026 |
| Framework | Next.js | 16.1.6 | Turbopack, React 19.2, App Router |
| UI Framework | React | 19.2.4 | View Transitions, React Compiler |
| Language | TypeScript | 5.9.3 | Staying on 5.9.x until 6.0 stability confirmed |
| Styling | Tailwind CSS | 4.2.1 | CSS-first config, Oxide engine |
| App UI | shadcn/ui | CLI v4 | Accessible components, Radix-based |
| Marketing UI | Magic UI | — | Animated marketing components |
| Game Engine | Phaser 3 | 3.90.0 | Official Next.js template, MIT |
| Database | Supabase Cloud | — | PostgreSQL + Auth + Realtime |
| Auth | Supabase Auth | — | Native RLS integration |
| Real-Time | Supabase Realtime | — | Broadcast + Presence |
| State | Zustand | — | React-Phaser bridge |
| Hosting | Azure App Service | B1 Linux | ~$13/mo |
| CI/CD | GitHub Actions | — | Docker build -> ghcr.io -> Azure |
| Asset Storage | Azure Blob Storage | — | Large game assets |
| Monorepo | Turborepo | — | Shared types, cached builds |
| Analytics | PostHog | — | 1M events/month free |
| Error Tracking | Sentry | — | 5K errors/month free |
| Testing (Unit) | Vitest | 4.1.0 | ESM-native, Turborepo-compatible |
| Testing (Component) | React Testing Library | 16.3.2 | Behavior-focused, React 19.2 compatible |
| Testing (E2E) | Playwright | 1.58.2 | Multi-browser, WebSocket, multi-tab |
| Linting | ESLint (flat config) | 10 | eslint-config-next, barrel file prevention |
| Logging | Pino | 10.x | Structured JSON, Sentry integration |
| Error Handling | neverthrow + next-safe-action | — | Type-safe Result pattern + Server Action validation |
| Rate Limiting | rate-limiter-flexible | 10.0.1 | In-memory MVP, PostgreSQL upgrade path |
| Package Manager | npm (NOT pnpm, NOT yarn, NOT bun) | — | Bundled with Node.js 24 |

For full research, version details, cost analysis, and architecture decisions:
see `.bytedragon/TECH_RESEARCH.md`.
<!-- bytedragon:governance-end -->

## Constitution (Governance)

The project constitution at `.specify/memory/constitution.md` is the authority for all development decisions. It contains 33 principles across 6 sections:

- **Core Architecture (I-X)**: Direct imports (no barrel files), centralized config/types/branding, immutable vendor components, domain-based organization, explicit client/server boundaries, singleton services, runtime version consistency, observability
- **Data & State (XI-XV)**: Zod schema validation, Data Access Layer, Server Actions for mutations, three-layer game state bridge (Phaser/Zustand/Supabase), database schema design
- **Security (XVI-XXII)**: Zero-trust frontend, server-side enforcement, secrets management, RLS defense-in-depth, input validation at every boundary, rate limiting, content security policy
- **Quality (XXIII-XXIX)**: Zero tech debt, dependency management, no ephemeral references in source code, centralized test organization + quality, AI-optimized documentation, WCAG AA accessibility, art style consistency
- **Performance (XXX-XXXIII)**: Responsive design, progressive enhancement, asset loading tiers, graceful visual degradation

**Conflict resolution priority**: Security > Architecture > Data > Quality > Performance

## Architecture

### Monorepo Structure

```
apps/web/                    # Next.js application
  src/
    app/                     # App Router pages
    proxy.ts                 # Next.js 16 proxy (renamed from middleware.ts)
    components/
      vendor/shadcn/         # IMMUTABLE shadcn/ui primitives
      vendor/magic-ui/       # IMMUTABLE Magic UI primitives
      app/common/            # Application wrappers (branded, customized)
      app/[domain]/          # Domain-specific components
    config/[domain]/         # Centralized configuration
    dal/[domain]/            # Data Access Layer (server-only)
    stores/[domain].ts       # Zustand stores
    lib/[service]/           # Singleton service clients
    app/actions/[domain]/    # Server Actions

packages/game-engine/        # Phaser game code (standalone)
packages/shared/             # Shared types, constants, schemas
packages/ui-theme/           # Design tokens, brand config

supabase/
  migrations/                # SQL migrations
  functions/                 # Edge Functions
```

### Key Patterns

- **Vendor -> App -> Feature layering**: Feature code imports from `components/app/`, NEVER from `components/vendor/` directly
- **Three-layer state**: Phaser scenes (game state) <-> Zustand stores (bridge) <-> Supabase (server state)
- **EventBus for signals, Zustand for state**: One-time events via EventBus, persistent shared state via Zustand
- **Server Actions for writes, Server Components for reads**: All mutations through Server Actions with Zod validation
- **Zero-trust**: Browser is hostile. All mutations go server-side. RLS is defense-in-depth backup, not primary gate.

## Critical Rules

1. **No barrel files** -- every import points to the actual source file, never an `index.ts` re-export
2. **No direct `process.env`** -- all env vars through centralized config with Zod validation
3. **No direct database queries in components** -- all queries through the DAL
4. **No modifying vendor components** -- shadcn/ui and Magic UI files are immutable; compose in `app/` layer
5. **No `service_role` key in client bundles** -- it MUST NEVER appear in `NEXT_PUBLIC_*` variables
6. **No ephemeral references in source code** -- no T001, FR-001, spec paths, or planning artifact IDs in `src/`
7. **Phaser and React are isolated** -- game engine code MUST NOT import React; React code MUST NOT import Phaser internals

## Testing

| Tool | Purpose |
|------|---------|
| Vitest | Unit and integration tests |
| React Testing Library | React component testing |
| Playwright | End-to-end browser testing |

- Tests live in `tests/` at each package root, mirroring `src/` structure
- `.test.ts` / `.test.tsx` suffix required
- See constitution Principles XXVI (test organization) for full requirements

## Deployment

Containerized deployment via GitHub Actions:
```
Git push -> GitHub Actions -> Docker build -> Push to ghcr.io -> Azure App Service pulls image
```

- Dockerfile uses `node:24-alpine` with Next.js `standalone` output
- `NEXT_PUBLIC_*` vars set as build-args in GitHub Actions
- Server-side secrets set in Azure App Service Application Settings (runtime, never in image)
- Large game assets on Azure Blob Storage (not in Docker image)

## Speckit Workflow

This project uses the speckit system for spec-driven development:

```
/speckit.constitution  -> Establish/amend principles
/speckit.specify       -> Create feature specification
/speckit.clarify       -> Resolve spec ambiguities
/speckit.plan          -> Create implementation plan
/speckit.analyze       -> Cross-artifact consistency check
/speckit.tasks         -> Break plan into tasks
/speckit.checklist     -> Generate quality checklists
/speckit.implement     -> Execute all tasks
```

Speckit commands are at `.claude/commands/speckit.*.md` and skills at `.claude/skills/speckit-*/`.

## Pending Decisions

- **Game design**: No gameplay mechanics, database tables, or routes have been defined yet. The architecture and constitution are intentionally generic to support any game design.

## Active Technologies
- TypeScript 5.9.3 (staying on 5.9.x until 6.0 stability confirmed) + Next.js 16.1.6, React 19.2.4, Phaser 3.90.0, Tailwind CSS 4.2.1, Zustand (latest), Pino 10.x, neverthrow (latest), rate-limiter-flexible 10.0.1, next-safe-action (latest), @sentry/nextjs (latest), Zod (latest) (001-project-scaffold)
- Supabase Cloud (PostgreSQL) -- no database tables in scaffold, connection config only (001-project-scaffold)

## Recent Changes
- 001-project-scaffold: Added TypeScript 5.9.3 (staying on 5.9.x until 6.0 stability confirmed) + Next.js 16.1.6, React 19.2.4, Phaser 3.90.0, Tailwind CSS 4.2.1, Zustand (latest), Pino 10.x, neverthrow (latest), rate-limiter-flexible 10.0.1, next-safe-action (latest), @sentry/nextjs (latest), Zod (latest)
