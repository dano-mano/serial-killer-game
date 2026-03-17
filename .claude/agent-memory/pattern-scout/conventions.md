---
name: conventions
description: Naming conventions, directory patterns, and import rules for this codebase
type: project
---

All conventions are derived from `.specify/memory/constitution.md` v1.0.0.

**Why:** Constitution is the governing authority — conventions are non-negotiable without an amendment.

**How to apply:** Apply these in every pattern discovery and every recommendation to implementation agents.

## Import Conventions
- Direct imports only — no barrel files (`index.ts` re-exports PROHIBITED)
- Cross-package: use package `exports` field entry points (build-system managed, not hand-written barrels)

## Directory Naming
- All directories: `kebab-case`
- Domain pattern: `[domain]/` notation — functional area naming, not technical role
- Feature branches: `[###-feature-name]`

## Domain-Based Organization
Every layer uses `[domain]/` subdirectory pattern:
- `apps/web/src/config/[domain]/`
- `apps/web/src/dal/[domain]/`
- `apps/web/src/stores/[domain].ts`
- `apps/web/src/lib/[service]/`
- `apps/web/src/app/actions/[domain]/`
- `packages/shared/src/types/[domain].ts`
- `packages/shared/src/schemas/[domain].ts`
- `docs/architecture/`, `docs/integrations/`, `docs/[domain]/`

## File Conventions
- TypeScript: `kebab-case.ts` / `kebab-case.tsx`
- Test files: `[source-name].test.ts` or `[source-name].test.tsx`
- Tests: centralized, NOT co-located with source files
- Client components: start with `"use client"`
- Server-only modules: start with `import "server-only"`
- Server Actions files: start with `'use server'`

## Component Naming
- React components: PascalCase
- Vendor components: immutable (never renamed)
- Application wrappers: descriptive branded names

## Source Code Prohibitions
- No `process.env` access outside `config/[domain]/`
- No ephemeral references in source (no T001, FR-001, ADR-001, spec paths)
- No TODO without a tracked issue
- No commented-out code
