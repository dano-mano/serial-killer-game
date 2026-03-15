# Project: Browser-Based Video Game

A browser-based video game built with Next.js 16 + Phaser 3 + Supabase, deployed on Azure App Service via containerized GitHub Actions pipeline.

Game design has not been determined yet. The technology stack, architecture, and governance principles are established and ready for any gameplay mechanics to be built on top.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 24 LTS |
| Framework | Next.js 16 (App Router, Turbopack, React Compiler) |
| UI Framework | React 19.2 |
| Language | TypeScript 5.9+ |
| Styling | Tailwind CSS v4 (CSS-first config, no tailwind.config.js) |
| App UI | shadcn/ui (immutable vendor primitives) |
| Marketing UI | Magic UI (immutable vendor primitives) |
| Game Engine | Phaser 3 (EventBus bridge pattern with React) |
| Database | Supabase Cloud (PostgreSQL + Auth + Realtime + Edge Functions) |
| Auth | Supabase Auth (native RLS integration) |
| Real-Time | Supabase Realtime (Broadcast + Presence) |
| State | Zustand (bridges React and Phaser) |
| Hosting | Azure App Service B1 Linux |
| CI/CD | GitHub Actions -> ghcr.io -> Azure App Service |
| Asset Storage | Azure Blob Storage |
| Monorepo | Turborepo with npm workspaces |
| Analytics | PostHog |
| Error Tracking | Sentry |
| Package Manager | npm (NOT pnpm, NOT yarn, NOT bun) |

## Key Files

| File | Purpose |
|------|---------|
| `.specify/memory/constitution.md` | Project constitution (v1.0.0, 29 principles) -- the governing document for all development. Read this FIRST. |
| `.bytedragon/TECH_RESEARCH.md` | Comprehensive technology research with version numbers, compatibility verification, architecture patterns, deployment pipeline, and cost analysis. |

## Constitution (Governance)

The project constitution at `.specify/memory/constitution.md` is the authority for all development decisions. It contains 29 principles across 6 sections:

- **Core Architecture (I-X)**: Direct imports (no barrel files), centralized config/types/branding, immutable vendor components, domain-based organization, explicit client/server boundaries, singleton services, runtime version consistency, observability
- **Data & State (XI-XV)**: Zod schema validation, Data Access Layer, Server Actions for mutations, three-layer game state bridge (Phaser/Zustand/Supabase), database schema design
- **Security (XVI-XXI)**: Zero-trust frontend, server-side enforcement, secrets management, RLS defense-in-depth, input validation at every boundary, rate limiting
- **Quality (XXII-XXVI)**: Zero tech debt, no ephemeral references in source code, centralized test organization + quality, AI-optimized documentation, WCAG AA accessibility
- **Performance (XXVII-XXIX)**: Responsive design, progressive enhancement, asset loading tiers

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

- **Testing tooling**: Not yet researched. Vitest + React Testing Library + Playwright are likely candidates but need formal evaluation before adding to the constitution.
- **Game design**: No gameplay mechanics, database tables, or routes have been defined yet. The architecture and constitution are intentionally generic to support any game design.
