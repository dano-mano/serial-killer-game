# Research: Project Scaffold

**Branch**: `001-project-scaffold` | **Date**: 2026-03-18
**Status**: Complete -- all unknowns resolved

## Research Summary

No NEEDS CLARIFICATION items existed in the Technical Context (stack is fully decided in TECH_RESEARCH.md). Research focused on 6 implementation pattern questions for integrating the chosen technologies correctly.

## Decisions

### 1. ESLint Configuration

**Decision**: Target ESLint 10.x (released Feb 2026, flat config only). Use `eslint-plugin-no-barrel-files` with flat config file-level overrides for package entry point exceptions. Use `eslint-plugin-n` (n/no-process-env) with file-level override for config directories.

**Rationale**: ESLint 10 is the current stable release. The barrel file plugin has no built-in exception mechanism, but flat config file-scoping provides explicit, git-tracked exceptions that align with the constitution's centralized configuration principle.

**Alternatives considered**:
- Custom ESLint rule (rejected: existing plugin covers the pattern, no need to maintain custom code)
- eslintrc overrides (rejected: eslintrc is removed in ESLint 10)
- eslint-plugin-import `no-restricted-exports` (rejected: doesn't detect barrel file pattern specifically)

**Impact on TECH_RESEARCH**: TECH_RESEARCH.md says "ESLint 9.x" but ESLint 10 was released Feb 2026. The scaffold should target ESLint 10. This is a minor version drift that should be updated in TECH_RESEARCH after this feature ships.

### 2. Pino + Sentry Integration

**Decision**: Use `Sentry.pinoIntegration()` in `sentry.server.config.ts`. This is a Sentry SDK integration, NOT a Pino transport. No changes to the Pino logger singleton are needed.

**Rationale**: The official Sentry integration instruments Pino at the SDK level -- it intercepts log calls automatically after Sentry.init() runs. This requires zero Pino configuration, keeping the logger singleton clean and framework-agnostic.

**Alternatives considered**:
- `pino-sentry-transport` npm package (rejected: runs in worker thread, requires separate Sentry init, community-maintained vs official)
- Custom Pino destination that calls Sentry.captureException (rejected: reinvents what the official integration provides)

### 3. Sentry + Next.js 16 Initialization

**Decision**: 4-file initialization pattern in `apps/web/src/`:
1. `instrumentation-client.ts` -- Client-side Sentry init
2. `instrumentation.ts` -- Server registration, exports `onRequestError`
3. `sentry.server.config.ts` -- Server-side Sentry init with pinoIntegration
4. `app/global-error.tsx` -- Root error boundary

Plus `withSentryConfig` wrapper in `next.config.ts` for source map upload with tunnel route `/monitoring`.

**Rationale**: This is the official @sentry/nextjs pattern for Next.js 16 App Router. No `sentry.edge.config.ts` needed because proxy.ts runs on Node.js runtime (not edge).

**Alternatives considered**:
- Manual Sentry.init() in layout.tsx (rejected: misses server-side coverage, doesn't integrate with instrumentation hooks)
- Edge config (rejected: project uses Node.js runtime exclusively)

### 4. Next.js 16 proxy.ts API

**Decision**: Named `proxy` export function with `NextRequest` parameter. Node.js runtime only. Return `Response.json()` for early termination (rate limit 429), `NextResponse.next()` with headers for pass-through (CSP).

**Rationale**: Official Next.js 16 API. The proxy file replaces middleware.ts with the same capabilities but Node.js runtime only.

**Key detail**: Exclude `/monitoring` from proxy matcher to avoid intercepting Sentry tunnel route.

### 5. Turborepo Configuration

**Decision**: `tasks` object (not `pipeline`), `^build` for topological dependencies, explicit `outputs` and `inputs` for cache optimization, `NEXT_PUBLIC_*` in build task `env`.

**Rationale**: Turborepo v2 API. Explicit inputs/outputs enable precise cache invalidation -- a README change won't bust the test cache.

### 6. Vitest Configuration

**Decision**: Per-package `vitest.config.mts` files (NOT vitest.workspace.ts). Shared base config at `vitest.shared.mts` in monorepo root. Turborepo orchestrates test execution per-package.

**Rationale**: Per-package configs enable Turborepo to cache test results independently per package. A change in `packages/shared` only re-runs shared's tests, not all tests. Vitest Projects/Workspaces would run from a single root, invalidating all caches on any change.

**Impact on plan**: Plan originally specified `vitest.workspace.ts` -- updated to `vitest.shared.mts`.

**Environments**: `jsdom` for apps/web (React components need DOM), `node` for game-engine and shared (pure logic).

## Sources

Full source URLs documented in `.bytedragon/agent-outputs/researcher-scaffold-patterns.md`.
