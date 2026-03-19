# Tasks: Project Scaffold

**Input**: Design documents from `/specs/001-project-scaffold/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/shared-package.md

**Tests**: Included — the scaffold must verify its own infrastructure works (env validation tests, schema tests, result pattern tests, smoke tests, E2E scaffold).

**Organization**: Tasks grouped by user story. Phase 1-2 are shared infrastructure; Phases 3+ map to spec user stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Paths are relative to repository root

---

## Phase 1: Setup (Monorepo Structure)

**Purpose**: Create the Turborepo monorepo skeleton — root configs, version pinning, workspace definitions. No application code yet.

- [ ] T001 Create root package.json with npm workspaces (`"workspaces": ["apps/*", "packages/*"]`), engine field (`"node": ">=24.14.0"`), and root scripts (build, dev, lint, test, type-check) in package.json
- [ ] T002 [P] Create turbo.json with `tasks` config: build (^build, outputs, NEXT_PUBLIC_* env), lint (^build), test (^build, inputs), type-check, dev (persistent), test:watch (persistent) in turbo.json
- [ ] T003 [P] Create root tsconfig.json with strict mode, moduleResolution bundler, target ES2022, base config for all packages to extend in tsconfig.json
- [ ] T004 [P] Create version pinning files: .nvmrc (24.14.0) and .node-version (24.14.0)
- [ ] T004b [P] Create .gitignore excluding node_modules/, .next/, .turbo/, dist/, .env.local, .env*.local, *.tsbuildinfo, .DS_Store
- [ ] T005 [P] Create vitest.shared.mts with shared test configuration (globals: false, restoreMocks: true, passWithNoTests: true) in vitest.shared.mts

---

## Phase 2: Foundational (Shared Packages)

**Purpose**: Create all four packages with their package.json, tsconfig, and core exports. Implement shared types, schemas, error constants, and Result pattern utilities. These are consumed by ALL user stories.

### packages/shared (@repo/shared)

- [ ] T006 Create packages/shared/package.json with name @repo/shared, exports field mapping subpaths (./types/common, ./schemas/common, ./constants/errors, ./utils/result) to source files in packages/shared/package.json
- [ ] T007 [P] Create packages/shared/tsconfig.json extending root tsconfig with package-specific settings in packages/shared/tsconfig.json
- [ ] T008 [P] Implement base types: ID (UUID string), Timestamp (ISO 8601 string), BaseDto interface in packages/shared/src/types/common.ts
- [ ] T009 [P] Implement error category constants (VALIDATION, NOT_FOUND, UNAUTHORIZED, FORBIDDEN, DATABASE, INTERNAL) in packages/shared/src/constants/errors.ts
- [ ] T010 Implement Zod validation schemas: idSchema (UUID), timestampSchema (ISO 8601), paginationSchema (limit/offset with defaults and bounds) in packages/shared/src/schemas/common.ts
- [ ] T011 Implement neverthrow Result wrappers: ok(), err(), AppError class with category/message/code/cause, factory methods (AppError.validation, .notFound, .unauthorized, .forbidden, .database, .internal), re-export Result and ResultAsync types in packages/shared/src/utils/result.ts
- [ ] T012 [P] Create packages/shared/vitest.config.mts with node environment, importing from vitest.shared.mts, include tests/**/*.test.ts in packages/shared/vitest.config.mts

### packages/game-engine (@repo/game-engine)

- [ ] T013 [P] Create packages/game-engine/package.json with name @repo/game-engine, dependency on @repo/shared, NO React dependency in packages/game-engine/package.json
- [ ] T014 [P] Create packages/game-engine/tsconfig.json extending root in packages/game-engine/tsconfig.json
- [ ] T015 [P] Create packages/game-engine/src/index.ts as empty package entry point in packages/game-engine/src/index.ts
- [ ] T016 [P] Create packages/game-engine/vitest.config.mts with node environment in packages/game-engine/vitest.config.mts

### packages/ui-theme (@repo/ui-theme)

- [ ] T017 [P] Create packages/ui-theme/package.json with name @repo/ui-theme in packages/ui-theme/package.json
- [ ] T018 [P] Create packages/ui-theme/tsconfig.json extending root in packages/ui-theme/tsconfig.json
- [ ] T019 [P] Create empty scaffold files: packages/ui-theme/src/tokens/colors.ts and packages/ui-theme/src/brand/config.ts
- [ ] T020 [P] Create packages/ui-theme/vitest.config.mts with node environment in packages/ui-theme/vitest.config.mts

### apps/web (Next.js application shell)

- [ ] T021 Create apps/web/package.json with dependencies: next, react, react-dom, tailwindcss, zustand, pino, pino-pretty, neverthrow, next-safe-action, @sentry/nextjs, rate-limiter-flexible, zod; devDependencies: typescript, @types/react, vitest, @vitejs/plugin-react, vite-tsconfig-paths, @testing-library/react, @testing-library/jest-dom, playwright, eslint in apps/web/package.json
- [ ] T022 [P] Create apps/web/tsconfig.json extending root with Next.js-specific settings, path aliases (@/ -> src/) in apps/web/tsconfig.json
- [ ] T023 Create apps/web/vitest.config.mts with jsdom environment, React plugin, RTL setup file, tsconfigPaths plugin in apps/web/vitest.config.mts
- [ ] T024 [P] Create apps/web/vitest.setup.ts importing @testing-library/jest-dom/vitest in apps/web/vitest.setup.ts

**Checkpoint**: Run `npm install` — all dependencies resolve. Run `npx turbo build` on packages/shared — builds successfully. Package topology is correct.

---

## Phase 3: US1 + US2 — Developer Setup + Config Validation (Priority: P1)

**Goal**: A developer can clone, install, start the dev server, and see the home page. The application validates all environment variables at startup and fails fast if any are missing.

**Independent Test**: `npm install && npm run dev` starts the app; removing a required env var causes immediate startup failure.

### Implementation

- [ ] T025 [US2] Implement centralized Zod-validated environment config exporting typed env object; fail-fast with clear error on missing/invalid required vars; graceful handling of optional vars in apps/web/src/config/env.ts
- [ ] T026 [US1] Create next.config.ts with standalone output, serverExternalPackages (pino, pino-pretty), withSentryConfig wrapper for automatic source map upload during build (FR-010), tunnelRoute /monitoring in apps/web/next.config.ts
- [ ] T027 [US1] Create root layout.tsx with html/body tags, metadata export, children prop, importing globals.css in apps/web/src/app/layout.tsx
- [ ] T027b [P] [US1] Create globals.css with `@import "tailwindcss"`, `@theme inline { }` directive (NOT `@theme { }`) importing design tokens from @repo/ui-theme, dark mode class-based switching setup in apps/web/src/app/globals.css
- [ ] T028 [US1] Create minimal home page with project name heading in apps/web/src/app/page.tsx
- [ ] T029 [US2] Create .env.example with all required and optional variable stubs and descriptions: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SENTRY_DSN, NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST, AZURE_BLOB_STORAGE_URL, LOG_LEVEL (optional, default info/debug) in .env.example
- [ ] T030 [US2] Write env validation tests: valid config passes, missing required var fails with clear message, invalid format fails, empty string treated as missing, optional vars gracefully absent in apps/web/tests/config/env.test.ts

**Checkpoint**: `npm run dev` starts the app and renders the home page. Removing NEXT_PUBLIC_SUPABASE_URL causes immediate failure with a clear error message.

---

## Phase 4: US3 — Structured Observability (Priority: P2)

**Goal**: Structured logging via Pino and error tracking via Sentry are active from the first deployed commit. Dev logs are readable; production logs are structured JSON. Errors auto-forward to Sentry.

**Independent Test**: Trigger a log statement and verify format; trigger an error and verify it appears in Sentry.

### Implementation

- [ ] T031 [US3] Implement singleton Pino logger: dev mode uses pino-pretty transport, production uses structured JSON; import 'server-only' guard; export typed logger instance in apps/web/src/lib/logger/pino.ts
- [ ] T032 [US3] Implement Sentry server config with pinoIntegration (error levels: error/fatal, log levels: info/warn/error/fatal), enableLogs: true, tracesSampleRate in apps/web/src/sentry.server.config.ts
- [ ] T033 [P] [US3] Implement Sentry server registration: register() imports sentry.server.config for nodejs runtime, export onRequestError from @sentry/nextjs in apps/web/src/instrumentation.ts
- [ ] T034 [P] [US3] Implement Sentry client init: DSN from env, replayIntegration (maskAllText, maskAllInputs, blockAllMedia), enableLogs, export onRouterTransitionStart in apps/web/src/instrumentation-client.ts
- [ ] T035 [US3] Implement root error boundary capturing errors to Sentry in apps/web/src/app/error.tsx
- [ ] T036 [P] [US3] Implement global error boundary (catches layout errors) capturing to Sentry in apps/web/src/app/global-error.tsx

**Checkpoint**: Start the app, trigger a console log — see human-readable output. Set NODE_ENV=production — see structured JSON. Throw an error — verify Sentry captures it.

---

## Phase 5: US4 — Predictable Error Handling (Priority: P2)

**Goal**: Verify the Result pattern and error types work correctly. Implementation was done in Phase 2 (T009, T011); this phase validates via tests.

**Independent Test**: Run `npx turbo test --filter=@repo/shared` — all tests pass.

### Tests

- [ ] T037 [US4] Write Result pattern tests: ok() returns success, err() returns failure with typed error, AppError factories produce correct categories, errors serialize correctly in packages/shared/tests/utils/result.test.ts
- [ ] T038 [P] [US4] Write schema validation tests: idSchema accepts valid UUID and rejects invalid, timestampSchema accepts ISO 8601 and rejects malformed, paginationSchema applies defaults and rejects out-of-bounds in packages/shared/tests/schemas/common.test.ts

**Checkpoint**: `npx turbo test --filter=@repo/shared` passes all tests.

---

## Phase 6: US7 — Linter Enforces Conventions (Priority: P2)

**Goal**: ESLint 10 flat config with two custom rules: no barrel files (with package entry point exception) and no direct process.env access (with config directory exception). Zero violations on scaffold code.

**Independent Test**: Run `npx turbo lint` — zero violations. Create a barrel file — linter catches it.

### Implementation

- [ ] T039 [US7] Implement eslint.config.mjs: import eslint-config-next (core-web-vitals + typescript), react-compiler plugin, eslint-plugin-neverthrow with must-use-result error rule, noBarrelFiles.flat, n plugin with no-process-env error; file-level override disabling barrel rule for packages/*/src/index.ts; file-level override disabling process-env for **/config/**; no-restricted-imports for vendor direct access; no-console; globalIgnores; prettier; install eslint-plugin-neverthrow as devDependency in eslint.config.mjs
- [ ] T040 [US7] Add lint scripts to root package.json and apps/web/package.json; verify `npx turbo lint` passes with zero violations on all scaffold code

**Checkpoint**: `npx turbo lint` passes. A barrel file in apps/web/ triggers a violation. Direct process.env in apps/web/src/app/ triggers a violation. packages/shared/src/index.ts does NOT trigger.

---

## Phase 7: US9 — Tests Run Across All Packages (Priority: P2)

**Goal**: Vitest runs per-package with Turborepo orchestration. Playwright E2E scaffold loads the home page. All scaffold tests pass.

**Independent Test**: `npx turbo test` discovers and runs tests across all packages.

### Implementation

- [ ] T041 [US9] Create Playwright config with chromium project, baseURL localhost:3000, webServer config for dev mode in apps/web/playwright.config.ts
- [ ] T042 [P] [US9] Create Playwright E2E test that navigates to home page and verifies it loads with expected content in apps/web/e2e/home.spec.ts
- [ ] T043 [P] [US9] Create home page smoke test using RTL: render page component, verify heading renders in apps/web/tests/app/page.test.tsx
- [ ] T044 [P] [US9] Create game-engine package build verification test in packages/game-engine/tests/setup.test.ts
- [ ] T045 [P] [US9] Create ui-theme package build verification test in packages/ui-theme/tests/setup.test.ts
- [ ] T046 [US9] Verify `npx turbo test` runs all package tests and all pass; verify `npx playwright test` runs E2E test

**Checkpoint**: `npx turbo test` runs tests in shared, game-engine, ui-theme, and web — all pass. `npx playwright test` loads the home page.

---

## Phase 8: US8 — Rate Limiting (Priority: P3)

**Goal**: proxy.ts enforces rate limits per endpoint category with in-memory store. CSP headers set on all responses. HTTP 429 with Retry-After on limit exceeded.

**Independent Test**: Send rapid requests to a protected path — get 429 after threshold.

### Implementation

- [ ] T047 [US8] Implement rate limit configuration: auth (5/15min/30min block), api (30/min/1min block), actions (20/min/1min block), authenticated (60/min/30s block) in apps/web/src/config/security/rate-limits.ts
- [ ] T048 [US8] Implement proxy.ts in apps/web/src/proxy.ts:
  1. Import RateLimiterMemory from rate-limiter-flexible; create module-scope singleton limiter instances from config (apps/web/src/config/security/rate-limits.ts)
  2. getClientIp with x-forwarded-for fallback; route-based limiter selection; 429 + Retry-After on limit exceeded
  3. Generate per-request nonce: `Buffer.from(crypto.randomUUID()).toString('base64')`
  4. Build CSP header string with NODE_ENV check for dev-mode exceptions:
     - `default-src 'self'`
     - `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'` + `'unsafe-eval'` in development only
     - `style-src 'self' 'nonce-${nonce}'` + `'unsafe-inline'` in development only
     - `img-src 'self' blob: data:`
     - `font-src 'self'`
     - `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.posthog.com https://*.ingest.sentry.io`
     - `worker-src 'self' blob:`
     - `object-src 'none'`
     - `base-uri 'self'`
     - `form-action 'self'`
     - `frame-ancestors 'none'`
     - `upgrade-insecure-requests`
  5. Set `x-nonce` request header so Server Components can read it via `headers()` API
  6. Set `Content-Security-Policy` on BOTH request headers (for downstream reading) AND response headers (for browser enforcement)
  7. Set additional security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  8. Matcher config excluding `_next/static`, `_next/image`, `favicon.ico`, and prefetch requests (next-router-prefetch header, purpose=prefetch header)
  - Note: PostHog and Sentry SDKs are npm-bundled — they appear in the application JS bundle and inherit the nonce from Next.js framework scripts. Only `connect-src` and `worker-src` are needed for them (no `script-src` entries required).
  - Note: Next.js automatically applies the nonce to all framework-generated scripts during SSR — no manual nonce attachment needed in layout.tsx or page components.
  - Note: `'strict-dynamic'` propagates trust from nonced bootstrap scripts to dynamically loaded scripts, enabling code splitting without additional `script-src` entries.
  - Note: `worker-src 'self' blob:` is required for Sentry Session Replay and PostHog Session Replay, which use web workers loaded from blob URLs.
  - Note: CSP violation reporting via `report-uri` directive pointing to Sentry security endpoint is OPTIONAL for scaffold; add when Sentry project ID is configured.
  - Note: Do NOT enable `cacheComponents: true` in next.config.ts without addressing the nonce/`headers()` incompatibility (vercel/next.js#89754 — not relevant for scaffold defaults).

**Checkpoint**: Start the app, send rapid requests to /api/ — get 429 after 30 requests. Response headers include Content-Security-Policy.

---

## Phase 9: US5 + US6 — CI Pipeline + Container Deployment (Priority: P2/P3)

**Goal**: GitHub Actions runs lint/test/build/audit on PRs. Docker builds a minimal production image. Deploy pipeline pushes to ghcr.io and deploys to Azure on merge to main.

**Independent Test**: Open a PR — CI runs all checks. Build Docker image — containerized app serves the home page.

### Implementation

- [ ] T049 [P] [US5] Create CI workflow: trigger on PR, setup-node@v4 pinned to 24.14.0, npm cache, npm ci, turbo lint, turbo test, turbo build, npm audit --audit-level=high, node version verification in .github/workflows/ci.yml
- [ ] T050 [P] [US6] Create multi-stage Dockerfile: deps stage (node:24-alpine, copy package*.json + turbo.json + per-package package.json, npm ci), builder stage (copy all, NEXT_PUBLIC_* build args, turbo build --filter=web), runner stage (node:24-alpine, copy standalone + static + public, CMD node apps/web/server.js) in Dockerfile
- [ ] T051 [P] [US6] Create .dockerignore excluding node_modules, .next, .git, .bytedragon, specs, .env*, .claude in .dockerignore
- [ ] T052 [US6] Create deploy workflow: trigger on push to main, run CI checks, docker build with build-args, push to ghcr.io, deploy to Azure App Service via azure/webapps-deploy action in .github/workflows/deploy.yml

**Checkpoint**: Docker image builds locally. `docker run -p 3000:3000` serves the home page. CI and deploy workflow files pass YAML validation.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, empty directory scaffolds, and cleanup.

- [ ] T053 Create empty scaffold directories: apps/web/src/dal/, apps/web/src/stores/, apps/web/src/app/actions/, apps/web/src/components/vendor/shadcn/, apps/web/src/components/vendor/magic-ui/, apps/web/src/components/app/common/, apps/web/public/assets/, apps/web/public/branding/, supabase/migrations/, supabase/functions/ (use .gitkeep files)
- [ ] T054 [P] Verify all success criteria from spec.md: SC-001 through SC-010
- [ ] T055 Run quickstart.md validation: follow setup steps from scratch, verify all commands work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (`npm install` needs root package.json)
- **US1 + US2 (Phase 3)**: Depends on Phase 2 (web app needs shared types, Next.js config)
- **US3 (Phase 4)**: Depends on Phase 3 (Sentry needs env.ts for DSN; logger needs running app)
- **US4 (Phase 5)**: Depends on Phase 2 only (tests shared package, independent of web app)
- **US7 (Phase 6)**: Depends on Phase 2 only (lints all packages, independent of app features)
- **US9 (Phase 7)**: Depends on Phase 3 (Playwright needs running app; component test needs page.tsx)
- **US8 (Phase 8)**: Depends on Phase 3 (proxy.ts needs env.ts for config pattern)
- **US5 + US6 (Phase 9)**: Depends on Phase 6 (CI runs lint) and Phase 7 (CI runs tests)
- **Polish (Phase 10)**: Depends on all previous phases

### User Story Dependencies

- **US1 + US2 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US3 (P2)**: Depends on US2 (env config provides Sentry DSN)
- **US4 (P2)**: Independent — can start after Phase 2 (parallel with US1+US2)
- **US7 (P2)**: Independent — can start after Phase 2 (parallel with US1+US2)
- **US9 (P2)**: Depends on US1 (needs home page for smoke test and E2E)
- **US5 (P2)**: Depends on US7 and US9 (CI runs lint and test)
- **US8 (P3)**: Depends on US2 (rate limit config follows env.ts pattern)
- **US6 (P3)**: Depends on US5 (deploy workflow extends CI)

### Parallel Opportunities

After Phase 2 completes, these can run in parallel:
- US4 (shared package tests) — independent
- US7 (ESLint config) — independent
- US1 + US2 (core app) — independent

After Phase 3 (US1+US2) completes:
- US3 (observability) and US8 (rate limiting) — different files, can parallelize
- US9 (test infrastructure) — different files

---

## Parallel Example: Phase 2 (Foundational)

```
# These packages have no interdependencies and can be created in parallel:
Task T013: packages/game-engine/package.json
Task T017: packages/ui-theme/package.json
Task T014: packages/game-engine/tsconfig.json
Task T018: packages/ui-theme/tsconfig.json
Task T016: packages/game-engine/vitest.config.mts
Task T020: packages/ui-theme/vitest.config.mts

# After packages/shared is built (T006-T012), these test configs can be parallel:
Task T012: packages/shared/vitest.config.mts
Task T023: apps/web/vitest.config.mts
```

## Parallel Example: After Phase 2

```
# US4 and US7 can start immediately after Phase 2 (no web app dependency):
Task T037: packages/shared/tests/utils/result.test.ts (US4)
Task T038: packages/shared/tests/schemas/common.test.ts (US4)
Task T039: eslint.config.mjs (US7)

# Meanwhile, US1+US2 progresses:
Task T025: apps/web/src/config/env.ts (US2)
Task T027: apps/web/src/app/layout.tsx (US1)
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T024)
3. Complete Phase 3: US1 + US2 (T025-T030)
4. **STOP and VALIDATE**: `npm run dev` works, env validation works, home page renders
5. This alone is a deployable scaffold

### Incremental Delivery

1. Setup + Foundational → Monorepo builds
2. US1 + US2 → App runs, config validates (MVP)
3. US3 → Observability active
4. US4 + US7 → Error handling verified, linting enforced
5. US9 → Tests run across all packages
6. US8 → Rate limiting active
7. US5 + US6 → CI/CD pipeline works, Docker deploys
8. Polish → All success criteria verified

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] labels: US1-US9 map to spec.md user stories
- US4 implementation is in Phase 2 (foundational); Phase 5 validates via tests
- US7 (linting) and US9 (testing) depend on files from multiple phases but are independently testable
- Commit after each phase checkpoint
- The scaffold has no database tables — Supabase connection is config-only
- packages/game-engine MUST NOT have react in dependencies (Constitution Principle VII, FR-002)
