<!--
SYNC IMPACT REPORT
==================
Version Change: 1.0.0 -> 1.1.0
Type: MINOR - Two new principles added (CSP, Dependency Management),
one principle strengthened (Database Schema), one principle clarified
(Test Organization), technology decisions updated.

Current Principle Count: 31 (I-XXXI)

Added Principles (2):
- XXII. Content Security Policy (Security & Compliance section)
- XXIV. Dependency Management (Quality & Maintenance section)

Modified Principles (2):
- XV. Database Schema Design: Strengthened to require 3NF as starting
  point, JSONB usage now requires documented rationale (MUST), added
  JSONB limitations note
- XXVI (was XXIV). Centralized Test Organization & Quality: Added
  canonical test directory name requirement (`tests/` at package root)

Renumbered Principles:
- Old XXII-XXVI -> New XXIII-XXVIII (shifted by XXII CSP insertion
  and XXIV Dependency Management insertion)
- Old XXVII-XXIX -> New XXIX-XXXI (cascaded shift)

Cross-Reference Updates:
- Governance conflict resolution ranges updated to reflect new numbering

Technology Decisions:
- Runtime: Node.js 24 LTS
- Framework: Next.js 16 with TypeScript (App Router)
- Game Engine: Phaser 3 (standalone package in monorepo)
- Database: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- State Management: Zustand (React-Phaser bridge)
- Styling: Tailwind CSS v4 + shadcn/ui + Magic UI
- Monorepo: Turborepo
- Package Manager: npm (bundled with Node.js)
- Deployment: Azure App Service via GitHub Actions + ghcr.io
- Testing: Vitest (unit/integration), React Testing Library (component),
  Playwright (E2E)
- Linting: ESLint flat config with eslint-config-next
- Logging: Pino (structured JSON)
- Error Handling: neverthrow (Result type) + next-safe-action
  (Server Actions)

Templates Requiring Updates:
- None (templates are generic and load constitution at runtime)

Follow-up TODOs:
- Update CLAUDE.md principle count from 29 to 31 and section ranges
- Update CLAUDE.md Pending Decisions to remove testing tooling
  (now decided)
- Create docs/architecture/testing-strategy.md ADR with coverage
  targets and mocking conventions

=== Historical Record: v1.0.0 (Initial) ===
Version Change: template -> 1.0.0
Type: INITIAL - Full constitution for browser-based game project.
Added Principles (29): I-XXIX across 6 sections.
Ratified: 2026-03-15
-->

# Project Constitution

## Core Architecture Principles

### I. Direct Import Strategy

All imports MUST reference the exact source file containing the
imported code. Barrel imports/exports (`index.ts` files that
re-export from multiple modules) are PROHIBITED.

**Rationale**: Barrel imports obscure the true source of functions
and types, making code harder to trace and debug. Direct imports
eliminate circular dependency risks, improve tree-shaking
effectiveness, and make dependency graphs transparent to both
humans and tooling.

**Requirements**:
- Import statements MUST include the full path to the actual file
  containing the code
- No `index.ts` files that re-export from other modules
- Cross-package imports MUST use the package `exports` field entry
  points (e.g., `@repo/shared/types/game` maps to the actual
  source file) -- these are package boundary entry points managed
  by the build system, not hand-written barrel files

**Enforcement**:
- Code reviews MUST reject PRs introducing barrel exports
- ESLint rules SHOULD be configured to detect and flag barrel
  file patterns

---

### II. Centralized Configuration

All configuration values MUST be stored in dedicated configuration
directories. Hard-coded configuration values in application code
are PROHIBITED except when technically required by the framework.

**Environment Variable Access**: Direct `process.env` access in
application code is STRICTLY PROHIBITED. Environment variables
MUST be loaded, validated, and exported through centralized
configuration modules organized by functional area.

**Rationale**: Centralized configuration makes environment-specific
changes predictable and auditable. It provides type safety via Zod
validation, enables startup validation (fail-fast on missing
values), and simplifies testing by allowing configuration injection.

**Organization**:
- `apps/web/src/config/[domain]/` -- Application-specific
  configuration (site metadata, navigation, feature flags)
- `packages/shared/src/constants/[domain]/` -- Cross-package
  constants (game rules, route paths, event names)
- `packages/ui-theme/src/tokens/` -- Design token configuration

**Requirements**:
- All environment variables MUST be validated with Zod schemas at
  application startup
- Application MUST fail to start if required environment variables
  are missing or invalid
- ESLint rules SHOULD prevent `process.env` access outside
  centralized config modules
- Configuration MUST be organized by functional domain, with new
  domains added as the application grows

---

### III. Centralized Type Definitions

All shared TypeScript types MUST be stored in the
`packages/shared/src/types/` directory, organized by functional
domain. Types MAY be co-located with a single file ONLY if there
is zero possibility of reuse by any other module across the
monorepo.

**Rationale**: In a monorepo where the Next.js application, game
engine package, and Supabase Edge Functions all consume the same
data structures, a single source of truth for types eliminates
drift. When a type changes, it changes once and TypeScript catches
every consumer at compile time.

**Organization**: `packages/shared/src/types/[domain].ts` organized
by functional area (e.g., game state types, event payload types,
API request/response types, generated database types).

**Requirements**:
- Types consumed by more than one package MUST live in
  `packages/shared/src/types/`
- Generated types (e.g., Supabase database types) MUST have a
  designated output location within the shared package
- Type files MUST be organized by functional domain, not by
  technical role

---

### IV. Centralized Branding & Design Tokens

All branding assets, design tokens (colors, typography, spacing),
and brand configuration MUST be stored in the `packages/ui-theme/`
package. Brand values MUST NOT be hardcoded in components.

**Rationale**: Centralizing brand identity in a dedicated package
ensures visual consistency across the application. Rebranding,
adding a dark mode palette, or adjusting typography scales happens
in one package and propagates to every consumer automatically via
Tailwind CSS `@theme` integration.

**Organization**:
- `packages/ui-theme/src/tokens/` -- Design tokens (colors,
  typography, spacing, breakpoints)
- `packages/ui-theme/src/brand/` -- Brand configuration (name,
  tagline, descriptions, asset paths)
- `apps/web/public/branding/` -- Brand asset files (logos, OG
  images, favicons)

**Requirements**:
- Components MUST reference design tokens through the theme
  system, not hardcoded values
- Color values, font families, and spacing scales MUST be defined
  in the ui-theme package
- All brand assets MUST have a single canonical location

---

### V. Immutable Vendor Components

Vendor UI components (shadcn/ui and Magic UI) installed into
`components/vendor/` MUST NEVER be modified directly. All
customization MUST be achieved by composing vendor primitives into
application-layer components in `components/app/[domain]/`.

**Rationale**: Preserving vendor components in their installed form
ensures they can be regenerated, updated, or diffed against
upstream without merge conflicts or lost customizations. The
composition pattern isolates all project-specific behavior in the
application layer.

**Organization**:
- `components/vendor/shadcn/` -- shadcn/ui primitives (IMMUTABLE,
  installed via CLI)
- `components/vendor/magic-ui/` -- Magic UI primitives (IMMUTABLE,
  installed via CLI)
- `components/app/common/` -- Shared application components that
  wrap vendor primitives with brand defaults
- `components/app/[domain]/` -- Domain-specific components
  organized by functional area

**Requirements**:
- Feature code MUST import from `components/app/`, NEVER from
  `components/vendor/` directly
- Every vendor component used in the application SHOULD have a
  corresponding application-layer wrapper that applies brand
  defaults
- New component domains in `components/app/` are added as features
  require them

---

### VI. Domain-Based Organization

All directory structures MUST follow domain-based organization.
Files MUST be grouped by functional area rather than by technical
role alone.

**Rationale**: Domain-based organization scales better as
applications grow and aligns code structure with product
understanding. Finding all code related to a feature requires
looking in one domain directory, not scattered across technical
role directories.

**Requirements**:
- New features MUST create domain directories where appropriate
  (e.g., `config/[new-domain]/`, `types/[new-domain]/`)
- Domain names MUST describe the functional area they serve
- Technical role subdirectories within a domain are acceptable
  (e.g., `[domain]/queries.ts`, `[domain]/mutations.ts`)

---

### VII. Explicit Client/Server Boundaries

All client-side React components MUST use the `"use client"`
directive. All server-side modules containing privileged logic
(database access, secret usage, server-only business logic) MUST
import `"server-only"` at the top of the file.

**Rationale**: Explicit boundaries make security reviews
systematic, prevent accidental bundling of server code in client
bundles (which would expose secrets), and clarify execution context
for every module in the codebase.

**Requirements**:
- Every client component file MUST start with `"use client"`
- Every server-only module (DAL functions, integrations, server
  utilities) MUST import `"server-only"`
- The build process MUST fail if server-only code is imported by
  client code
- Server-only modules MUST NOT be placed in directories that
  client code imports from

---

### VIII. Singleton Service Instances

Service clients (database, logging, analytics, external API
clients) MUST be instantiated exactly once and exported from a
centralized location. Multiple instantiations of the same service
client are PROHIBITED.

**Rationale**: Multiple database client instances waste
connections, cause inconsistent behavior, and make connection
pooling ineffective. Centralizing service instantiation ensures
predictable resource usage and provides a single place to configure
timeouts, retries, and connection parameters.

**Organization**: `apps/web/src/lib/[service]/` -- One module per
service that creates and exports the singleton instance.

**Requirements**:
- Database clients (browser and server) MUST each have exactly one
  instantiation point
- Logging and analytics clients MUST be instantiated once and
  imported where needed
- Service client modules MUST NOT contain business logic -- they
  export the configured client only
- Server-side service clients MUST import `"server-only"` per
  Principle VII

---

### IX. Runtime Version Consistency

All project artifacts MUST target the same Node.js LTS version
across local development, CI/CD, container images, and production
hosting. Version drift between environments is PROHIBITED.

**Rationale**: Version drift between local development, CI, and
production causes "works on my machine" failures, subtle runtime
behavior differences, and wasted debugging time. A single pinned
LTS version across all artifacts eliminates this class of bugs
entirely.

**Requirements**:
- `package.json` MUST specify `engines.node` with the target LTS
  version
- Dockerfile MUST use the matching `node:[version]-alpine` base
  image
- GitHub Actions MUST use `actions/setup-node` with the matching
  version
- Azure App Service MUST be configured with the matching Node.js
  runtime
- `.nvmrc` and/or `.node-version` MUST be present at the repo root
  with the matching version
- Version upgrades MUST update ALL artifacts simultaneously in a
  single commit

**Enforcement**:
- CI MUST validate that the running Node.js version matches the
  `engines.node` requirement
- PRs that update Node.js version in one artifact but not all
  others MUST be rejected

---

### X. Observability & Error Tracking

All production code MUST integrate with centralized error tracking
and analytics services. Errors MUST NOT be silently swallowed.
Application behavior MUST be observable without attaching a
debugger.

**Rationale**: In production, you cannot attach a debugger or read
console output. Centralized error tracking and structured logging
are the only way to diagnose issues, measure performance, and
understand user behavior. Without observability, bugs become
invisible until users complain.

**Requirements**:
- Unhandled exceptions and rejected promises MUST be captured by
  the error tracking service automatically
- Server-side errors MUST include request context (route, method,
  user ID if authenticated) without leaking secrets
- Client-side errors MUST include component context and user
  action that triggered the error
- Error tracking and analytics clients MUST be instantiated as
  singletons per Principle VIII
- Log output MUST use structured format (JSON) with consistent
  field names (timestamp, level, message, context)
- Application code MUST NOT use `console.log` for production
  logging -- use the centralized logging service
- Sensitive data (secrets, passwords, tokens, PII) MUST NEVER
  appear in logs or error reports

**Organization**:
- Error tracking and analytics clients in
  `apps/web/src/lib/[service]/`
- Configuration in `apps/web/src/config/[service]/`

---

## Data & State Management

### XI. Shared Schema Validation

Validation schemas MUST be defined using Zod with location
determined by usage pattern. The same schema MUST be used for
both client-side validation and server-side validation to guarantee
consistency.

**Rationale**: Shared schemas eliminate validation duplication,
ensure client/server consistency, and provide end-to-end type
safety from user input to database. Co-locating config schemas
with their configuration data improves discoverability while
maintaining server-only boundaries.

**Schema Location Guidance (Hybrid Pattern)**:

1. **User Input Validation Schemas** (client + server shared) --
   `packages/shared/src/schemas/[domain].ts` or
   `apps/web/src/types/schemas/[domain].ts`
   - Form data validation, API payload validation, URL parameter
     validation
   - Characteristics: NO `"server-only"` import; importable by
     client components for form library resolvers

2. **Config Validation Schemas** (server-only) -- co-located with
   config data in `config/[domain]/`
   - Environment variable validation, static registry validation,
     server configuration
   - Characteristics: Co-located with config data; MUST import
     `"server-only"`

**Heuristic**: If a client component needs to import the schema
for form validation, place it in the shared schemas location. If
the schema validates server-only configuration, co-locate it with
the config module.

**Requirements**:
- Server Actions MUST re-validate input with the same schema used
  for client-side validation (never trust client validation alone)
- Zod schemas MUST be the source of TypeScript types via
  `z.infer<typeof schema>` to prevent type/validation drift
- Config schemas MUST co-locate with config data and import
  `"server-only"`

---

### XII. Data Access Layer (DAL)

All database queries and third-party API calls MUST go through a
server-only Data Access Layer. DAL functions MUST return Data
Transfer Objects (DTOs) containing only the fields necessary for
the consumer, not raw database responses.

**Rationale**: Centralizing data access makes queries auditable,
prevents accidental data leaks (raw database rows may contain
sensitive fields), and provides a natural integration point for
Row Level Security and caching.

**Organization**: `apps/web/src/dal/[domain]/` organized by
functional area. New domains are added as features require them.

**Requirements**:
- All DAL files MUST start with `import "server-only"`
- DAL functions MUST return DTOs, not raw Supabase/database
  responses
- Components and Server Actions MUST NOT construct database
  queries directly -- they MUST call DAL functions
- Each DAL domain SHOULD expose a clear interface of available
  operations (queries and mutations)

---

### XIII. Server Actions for Mutations, Server Components for Reads

Server Actions MUST be used exclusively for data mutations. Async
Server Components with direct DAL calls MUST be used for read
operations.

**Rationale**: Server Components benefit from caching, parallel
fetching, and streaming. Server Actions execute serially. Using
the correct pattern for each operation type optimizes performance
and aligns with Next.js architectural intent.

**Organization**: `apps/web/src/app/actions/[domain]/[action].ts`
organized by domain.

**Requirements**:
- Read operations: Server Components calling DAL functions directly
- Write operations: Server Actions calling DAL functions with
  input validation
- Server Actions MUST call `revalidatePath()` or
  `revalidateTag()` after successful mutations
- All files in `apps/web/src/app/actions/` MUST start with
  `'use server'` directive
- Server Actions MUST validate all input with Zod schemas before
  calling DAL functions

---

### XIV. Game Engine State Bridge

Application state MUST follow a three-layer architecture
separating game engine state, application state, and server state.
Zustand MUST serve as the bridge between the React UI layer and
the Phaser game engine.

**Rationale**: The game engine (Phaser) and UI framework (React)
have fundamentally different rendering models. Phaser uses an
imperative game loop; React uses declarative rendering. Zustand's
ability to be subscribed to outside React components makes it the
bridge that connects both systems without forcing either into the
other's paradigm.

**Three-Layer Architecture**:

1. **Game Engine State** (Phaser Scenes) -- Physics, sprites,
   animations, game loop. Managed by Phaser natively. Communicated
   to React via EventBus.
2. **Application State** (Zustand) -- UI state, player
   preferences, game metadata. Bridges React UI and Phaser canvas.
   Both systems can read/write directly.
3. **Server State** (Supabase) -- Persistent data, multiplayer
   sync (Realtime Broadcast + Presence), authentication state.

**Organization**: `apps/web/src/stores/[domain].ts` for Zustand
stores.

**Requirements**:
- Zustand stores MUST be the single communication channel for
  shared state between React and Phaser
- Game engine code MUST NOT import React; React code MUST NOT
  import Phaser internals
- EventBus MUST be used for event-driven communication (one-time
  signals); Zustand MUST be used for persistent shared state
- Zustand stores MUST NOT contain rendering logic for either
  React or Phaser
- Server state (Supabase Realtime) MUST flow through Zustand
  stores before reaching either React or Phaser consumers

---

### XV. Database Schema Design

Database schemas MUST use normalized tables with explicit columns
for well-defined, queryable data. Schema design MUST start from
third normal form (3NF) as the baseline for all table designs.
Denormalization is permitted only when justified by measured
performance requirements, and the rationale MUST be documented in
the corresponding migration file.

**Rationale**: Normalized tables provide data integrity, enable
efficient querying, and support Supabase Row Level Security
policies. Third normal form eliminates redundant data storage,
prevents update anomalies, and ensures each column depends on the
primary key, the whole key, and nothing but the key.

**JSONB Usage Policy**:
- JSONB MUST NOT be used as a convenience shortcut to avoid
  designing a normalized schema. Every JSONB column MUST be
  accompanied by a documented rationale (in the migration file or
  schema documentation) explaining WHY normalization is not
  possible or practical for that specific data.
- JSONB is ALLOWED only for genuinely semi-structured data with
  variable shape where the set of keys is not known at design
  time (e.g., third-party webhook payloads, user-defined
  settings with arbitrary keys, event metadata with
  provider-specific fields).
- JSONB MUST NOT be used for data queried by WHERE, JOIN, or
  GROUP BY clauses, data requiring foreign key relationships, or
  data where referential integrity matters. JSONB columns cannot
  enforce referential integrity, are difficult to index
  efficiently, and make ad-hoc querying and reporting
  significantly harder.
- Schema design SHOULD anticipate migration from JSONB to
  normalized structures as data access patterns become clear.

**Requirements**:
- Every table MUST have RLS enabled with a default-deny posture
  per Principle XIX
- Tables MUST use UUIDs for primary keys (aligns with Supabase
  Auth `auth.uid()`)
- All timestamps MUST use `TIMESTAMPTZ` (timezone-aware)
- Schema migrations MUST be managed through `supabase/migrations/`
  and version-controlled

---

## Security & Compliance

### XVI. Zero-Trust Frontend Architecture

The browser MUST be treated as a hostile environment. Client-side
code MUST NEVER directly access databases, call third-party APIs
with secrets, or perform privileged operations. All data mutations
and privileged reads MUST go through a secure server-side layer.

**Rationale**: The Supabase `anon` key is public by design (it
ships to every browser). We assume an attacker has it and can make
arbitrary API calls. The browser may display data and collect user
input. It MUST NEVER be the authority on game state, permissions,
or business logic.

**Client-side code is limited to**:
- Presentation and rendering
- User input collection
- Client-side form validation (duplicated server-side per
  Principle XI)
- Optimistic UI updates
- Supabase Auth operations (login, signup, session refresh)
- Supabase Realtime subscriptions (Broadcast, Presence, Database
  Changes) -- read-only trust
- Read-only queries restricted by RLS policies

**Server-side code is required for**:
- All database mutations (via Server Actions or Edge Functions
  using `service_role` key)
- All third-party API calls involving secrets
- All business logic validation (game rules, permissions,
  authorization)
- All operations where correctness matters (anti-cheat, state
  resolution)

**Requirements**:
- The `service_role` key MUST NEVER appear in client bundles or
  `NEXT_PUBLIC_*` variables
- Supabase Realtime data is for display only -- actions based on
  received state MUST be validated server-side
- Client-side validation MUST be duplicated on the server (never
  trusted alone)

---

### XVII. Server-Side Security Enforcement

All security checks MUST execute server-side. Client-side guards
are for user experience only and MUST NOT be relied upon for
security.

**Rationale**: Client-side code runs in untrusted environments and
can be bypassed by any technically capable user. Security decisions
made in the browser provide zero actual protection.

**Requirements**:
- All data mutations MUST have server-side input validation (Zod
  schemas)
- All data mutations MUST have server-side authorization checks
  (does this user have permission?)
- All data mutations MUST have server-side business rule
  validation (is this action valid in the current state?)
- CSRF protection MUST be enabled on form submissions
- Client-provided data (user IDs, entity IDs, timestamps, state
  values) MUST NEVER be trusted for security decisions without
  server-side verification

---

### XVIII. Secrets Management

All secrets (API keys, database credentials, service tokens) MUST
be stored in environment variables or managed secret services.
Secrets MUST NEVER appear in source code, configuration files
committed to version control, or client-side bundles.

**Rationale**: Secret exposure would compromise the database,
authentication system, and any integrated third-party services.
The blast radius of a leaked secret is proportional to the
permissions it grants.

**Environment Variable Categories**:

| Type | Where to Set | Build/Runtime |
|------|-------------|---------------|
| Public client-side (`NEXT_PUBLIC_*`) | GitHub Actions build-args | Build-time (baked into JS bundle) |
| Server-side secrets | Azure App Service Application Settings | Runtime (never in image) |
| Development secrets | `.env.local` (git-ignored) | Local runtime |

**Requirements**:
- Secrets MUST NOT be hardcoded in source code or committed
  configuration files
- `.env.local` MUST be in `.gitignore`
- Logs MUST be sanitized to prevent accidental secret exposure
- Server-side secrets MUST be set in Azure App Service Application
  Settings (runtime), NOT baked into Docker images
- `NEXT_PUBLIC_*` variables MUST contain only values safe for
  public exposure

---

### XIX. Row Level Security (Defense-in-Depth)

RLS MUST be enabled on every Supabase table with a default-deny
posture. RLS serves as a defense-in-depth backup, NOT the primary
security gate.

**Rationale**: Even though most mutations go through server-side
code using the `service_role` key (which bypasses RLS), RLS exists
as a safety net. If a bug or attack bypasses the server layer, RLS
blocks unauthorized access at the database level. A table with no
RLS policies has no access via the `anon` key -- which is the
correct default.

**Requirements**:
- Every table MUST have
  `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY` applied
- Tables with no explicit policies MUST default to zero access
  (the Supabase default when RLS is enabled)
- RLS policies MUST be added explicitly only for operations that
  require direct browser access
- RLS policies MUST use `auth.uid()` for user-scoped access
  control
- RLS policy changes MUST be version-controlled in
  `supabase/migrations/`

---

### XX. Input Validation at Every Boundary

Every server-side handler (Server Action, Route Handler, Edge
Function, webhook handler) MUST validate all inputs with a Zod
schema before processing. No input from any external source
(browser, webhook, API call) is trusted.

**Rationale**: Input validation is the first line of defense
against injection attacks, data corruption, and logic bugs.
Validating at every boundary -- not just the outermost one --
ensures defense-in-depth even if an intermediate layer is bypassed.

**Requirements**:
- Entity IDs from clients MUST be validated as proper UUIDs
- Enum values from clients MUST be validated against allowed
  values
- Numeric values MUST be range-checked
- String values MUST be length-limited
- Webhook payloads MUST have signature verification before
  processing
- Validation errors MUST return descriptive error messages
  (without leaking internal details) and appropriate HTTP status
  codes

---

### XXI. Rate Limiting

Public-facing endpoints MUST implement rate limiting to prevent
abuse, spam, and denial-of-service attacks.

**Rationale**: Public endpoints (form submissions, API routes,
webhook handlers) are targets for automated abuse. Rate limiting
protects both the application and downstream services (database,
third-party APIs) from excessive load.

**Requirements**:
- Rate limits MUST be defined in a centralized configuration
  module (not scattered across handlers)
- Rate-limited responses MUST return HTTP 429 with a
  `Retry-After` header
- Rate limit configuration MUST be adjustable per endpoint based
  on expected legitimate usage patterns
- Authentication-gated endpoints SHOULD have higher rate limits
  than anonymous endpoints
- Additional protections (honeypot fields, bot detection) SHOULD
  be applied to public forms

---

### XXII. Content Security Policy

The application MUST define Content Security Policy (CSP) headers
in the Next.js proxy to control which resources the browser is
permitted to load and execute. CSP MUST be enforced in production
and MAY use report-only mode during development.

**Rationale**: Even with server-side zero-trust architecture
(Principle XVI), a cross-site scripting (XSS) attack via
user-generated content, a compromised CDN, or a malicious
third-party script can execute arbitrary code in the browser. CSP
is the browser-level defense that limits the damage of any
injection that bypasses server-side controls. For a game with
real-time communication and user-facing content, this protection
is essential.

**Requirements**:
- CSP headers MUST be defined in the Next.js proxy (`proxy.ts`),
  not scattered across individual route handlers
- The `script-src` directive MUST restrict script execution to
  trusted sources. Inline scripts MUST be controlled via nonces
  or hashes where required by the framework.
- The `connect-src` directive MUST allowlist the application's
  API endpoints and WebSocket connections (e.g., Supabase API
  and Realtime endpoints)
- The `img-src` directive MUST allowlist the application's asset
  storage origins (e.g., the Azure Blob Storage domain used for
  game assets)
- The `style-src` directive MUST account for the styling approach
  used by the application (e.g., inline styles generated by the
  CSS framework)
- The `default-src` directive MUST be set to `'self'` as a
  fallback. Additional source origins MUST be explicitly added
  only for the specific directives that require them.
- CSP violation reports SHOULD be configured to send to the error
  tracking service for monitoring
- CSP directives MUST be reviewed when new third-party services
  or asset origins are added to the application

**Enforcement**:
- CI SHOULD include a CSP validation check that verifies the
  proxy defines a Content-Security-Policy header
- Security audits MUST verify that CSP directives have not been
  weakened (e.g., `unsafe-inline` or `unsafe-eval` added without
  documented justification)

---

## Quality & Maintenance

### XXIII. Zero Tech Debt Tolerance

All code changes MUST include complete removal of obsolete code,
outdated comments, and unused artifacts.

**Rationale**: Accumulated tech debt compounds exponentially. A
clean codebase maintains development velocity as the project
scales and prevents AI assistants from being confused by stale
code.

**Requirements**:
- Unused functions, components, imports, and variables MUST be
  removed immediately
- Commented-out code MUST be removed (use version control for
  history)
- Code comments MUST explain WHY, never WHAT (the code itself
  explains what)
- No `TODO` comments without a corresponding tracked issue
- Dead code paths MUST be removed, not left behind "just in case"

---

### XXIV. Dependency Management

All npm dependencies MUST be actively managed to prevent security
vulnerabilities, version drift, and supply chain risks.

**Rationale**: A project with numerous direct and transitive
dependencies is exposed to security vulnerabilities through its
supply chain. Without active dependency management, outdated
packages accumulate silently, and known vulnerabilities persist in
production. Consistent dependency hygiene is as important as code
quality for maintaining a secure application.

**Requirements**:
- `npm audit` MUST pass in CI with zero critical or high severity
  vulnerabilities. Builds MUST fail if critical or high
  vulnerabilities are detected.
- `package-lock.json` MUST be committed to version control and
  MUST be used for all installations (`npm ci` in CI, not
  `npm install`)
- Dependencies MUST be installed at the most specific appropriate
  level in the monorepo (shared dependencies at root, package-
  specific dependencies in the consuming package)
- A regular dependency update cadence SHOULD be established to
  keep packages current and reduce the risk of large, disruptive
  upgrades
- Security advisories for direct dependencies SHOULD be monitored
  and addressed promptly
- New dependencies MUST be evaluated for maintenance status,
  license compatibility, and security posture before adoption
- Dev dependencies MUST be clearly separated from production
  dependencies (no dev-only packages in `dependencies`)

**Enforcement**:
- CI pipelines MUST include an `npm audit` step that blocks
  deployment on critical or high findings
- PRs that add new dependencies SHOULD document the rationale
  for the addition

---

### XXV. No Ephemeral References in Source Code

Application source code MUST NOT contain references to ephemeral
planning or tooling artifacts. This includes spec task identifiers
(e.g., T001), functional requirement IDs (e.g., FR-001), design
decision IDs (e.g., D-001), ADR identifiers (e.g., ADR-001), user
story labels (e.g., US1), spec file paths, and vision-alignment
document paths.

**Rationale**: Spec artifacts and planning infrastructure are
ephemeral -- they will be trimmed, archived, or removed as the
project matures. Source code that references these artifacts
creates brittle coupling to non-permanent documents. Code must be
self-documenting; its correctness and intent must be
understandable without access to planning artifacts.

**Scope**: This applies to all application source files including
TypeScript source, configuration modules, comments, string
literals, and error messages. It does NOT apply to:
- Spec artifacts themselves (e.g., `specs/`, `.specify/`)
- Documentation files (e.g., `docs/`, `README.md`, `CLAUDE.md`)
- Git commit messages (which naturally reference specs and tasks)
- Agent output files (e.g., `.bytedragon/`)

**Allowed Alternatives**:
- Comments explaining WHY with domain reasoning:
  `// Omit auto-generated fields for creation DTO`
- References to constitution principles by name (permanent):
  `// Per Constitution Principle XII`
- References to external standards: `// RFC 5321 max email length`

**Enforcement**:
- Code reviews MUST reject PRs with ephemeral references in
  source code
- Quality audits MUST flag spec/task/ADR identifiers in source
  code

---

### XXVI. Centralized Test Organization & Quality

All test files MUST be located in a centralized test directory
that mirrors the source directory structure. Tests MUST NOT be
co-located with source files. Tests MUST follow quality standards
that ensure long-term reliability.

**Rationale**: Centralized test organization keeps source
directories clean, makes test coverage auditable at a glance, and
mirrors the domain-based directory conventions established
throughout the project. Test quality standards prevent brittle
tests that break on refactors and flaky tests that erode
confidence.

**Organization**: Test files mirror their corresponding source
paths under a centralized test directory within each package.

**Requirements (Organization)**:
- The centralized test directory MUST be named `tests/` and MUST
  be located at the package root (sibling to `src/`), not nested
  within `src/`
- Test file paths MUST mirror their corresponding source file
  paths
- Test files MUST use the `.test.ts` or `.test.tsx` suffix
- No test files (`*.test.ts`, `*.test.tsx`, `*.spec.ts`,
  `*.spec.tsx`) are permitted alongside source files
- Test configuration lives at the package or project root
- Each package in the monorepo MUST have its own test directory
  mirroring its source structure
- Test setup and shared test utilities MUST have a designated
  location within each package's test directory

**Requirements (Quality)**:
- Tests SHOULD follow the testing pyramid: prefer unit tests over
  integration tests, prefer integration tests over E2E tests
- Tests MUST NOT use arbitrary `sleep()` or `setTimeout()` waits
  -- use proper async waiting mechanisms (polling, event listeners,
  test library utilities)
- Tests MUST NOT be coupled to implementation details (internal
  method names, private state, execution order) -- test behavior
  and outcomes
- Test names MUST describe the expected behavior in plain language
  (e.g., `it('rejects vote when player is not alive')`)
- Flaky tests MUST be fixed or quarantined immediately -- they
  MUST NOT remain in the main test suite

---

### XXVII. AI-Optimized Documentation

All documentation MUST be organized in `docs/` with domain-based
structure optimized for AI assistant discoverability and human
readability.

**Rationale**: Documentation enables AI tools to provide accurate
context and assists future development. Well-structured docs
reduce onboarding time and ensure decisions are preserved beyond
working memory.

**Organization**:
- `docs/architecture/` -- System design decisions and ADRs
- `docs/integrations/` -- Third-party service setup and
  configuration guides
- `docs/[domain]/` -- Domain-specific documentation (added as
  features are built)

**Requirements**:
- Architecture decisions MUST be documented as ADRs in
  `docs/architecture/`
- Integration guides MUST include setup steps, credential
  requirements, and troubleshooting
- Documentation MUST be updated when the code it describes changes
- Documentation MUST NOT contain hardcoded secrets, credentials,
  or environment-specific values

---

### XXVIII. Accessibility Standards (WCAG AA)

All user interface elements outside the game canvas MUST meet
WCAG 2.1 Level AA standards. Game canvas elements SHOULD provide
equivalent accessibility where technically feasible.

**Rationale**: Accessibility expands reach, improves SEO, ensures
legal compliance, and often improves usability for all users. The
game canvas presents unique challenges that require pragmatic
accessibility approaches distinct from standard web UI.

**Requirements for Web UI (MUST)**:
- Semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<form>`,
  `<label>`)
- ARIA labels for interactive elements and form fields
- Keyboard navigation for all interactive UI outside the canvas
- Color contrast meeting 4.5:1 for normal text, 3:1 for large
  text
- Touch targets at least 44x44 pixels on mobile

**Requirements for Game Canvas (SHOULD)**:
- Audio cues SHOULD have visual equivalents
- Critical game information SHOULD be available outside the canvas
  (e.g., in the HUD overlay)
- Color-only indicators SHOULD have shape or text alternatives
- Game settings SHOULD include accessibility options (colorblind
  modes, text size, audio controls)

---

## Performance & User Experience

### XXIX. Responsive Design & Cross-Device Support

All web UI components MUST be responsive and functional from 320px
to 2560px+ viewport widths. The game canvas MUST adapt to
available space while maintaining its aspect ratio.

**Rationale**: Players will access the game on phones, tablets,
laptops, and desktops. The web UI (menus, lobby, settings, HUD
overlays) must work at every size. The game canvas has different
constraints -- it must scale while preserving visual fidelity.

**Requirements**:
- Web UI components MUST render correctly at all viewport widths
  (320px minimum)
- Touch targets MUST be at least 44x44 pixels
- Forms and interactive elements MUST be optimized for mobile
  input
- The game canvas MUST scale responsively within its container
- Critical game information MUST be readable at the smallest
  supported viewport
- Test at representative breakpoints: 320px, 375px, 768px,
  1024px, 1440px

---

### XXX. Progressive Enhancement

Server-rendered HTML MUST provide a functional baseline experience.
Client-side JavaScript enhancements MUST be layered on top of this
baseline for non-game pages.

**Rationale**: Progressive enhancement ensures accessibility and
reliability for users on slow connections or with JavaScript
disabled. The game canvas inherently requires JavaScript, but all
surrounding UI (authentication, settings, lobby) should degrade
gracefully.

**Requirements**:
- Forms MUST work without JavaScript using Server Actions
  (`<form action={serverAction}>`)
- Client-side enhancements (optimistic UI, loading states, inline
  validation) MUST be additive
- Navigation MUST function without client-side JavaScript
- The game canvas MAY require JavaScript (Phaser cannot run
  without it) -- this is an acceptable exception
- A clear message MUST be displayed if JavaScript is required for
  the game canvas and is unavailable

---

### XXXI. Asset Loading & Performance

Game assets (sprites, audio, maps, fonts) MUST be managed through
a tiered storage strategy with appropriate caching headers. Large
assets MUST NOT be bundled with the application Docker image.

**Rationale**: Game asset sizes can be substantial. Bundling them
in the Docker image inflates image size, slows deployments, and
wastes bandwidth. A tiered strategy matches asset types to optimal
delivery mechanisms.

**Asset Storage Tiers**:

| Asset Type | Location | Caching Strategy |
|-----------|----------|-----------------|
| Small static assets (icons, favicon) | `apps/web/public/assets/` | Served by App Service |
| Brand assets (logo, OG images) | `apps/web/public/branding/` | Served by App Service |
| Large game assets (sprites, audio, maps) | Azure Blob Storage | `Cache-Control: public, max-age=31536000, immutable` with content-hash filenames |
| User-generated content | Supabase Storage | RLS-protected access |

**Requirements**:
- The Phaser game component MUST be loaded via `next/dynamic` with
  `ssr: false` (Phaser requires browser APIs)
- Large game assets MUST use content-hash filenames for cache
  busting
- Asset loading MUST display progress indicators for game scenes
- Critical path assets (above-the-fold UI) MUST NOT be blocked by
  game asset loading
- Images MUST use Next.js `Image` component (or equivalent
  optimization) for non-game-canvas images
- The game engine bundle SHOULD be compressed and lazy-loaded to
  minimize initial page weight

---

## Governance

### Amendment Process

This constitution supersedes all other coding practices for this
project. Amendments require:

1. **Documentation**: Proposed changes with rationale explaining
   WHY the change is needed
2. **Review**: Changes MUST be reviewed before implementation
3. **Migration Plan**: Breaking changes MUST include an
   implementation timeline and migration steps
4. **Version Update**: Every amendment MUST include a semantic
   version bump

### Emergency Override

Emergency exceptions to constitutional principles (e.g.,
production hotfixes) MUST be documented with rationale and
reviewed within 48 hours. Emergency overrides MUST NOT become
permanent -- a follow-up amendment or code correction MUST be
scheduled.

### Versioning Policy

- **MAJOR**: Backward-incompatible principle removals,
  redefinitions, or structural reorganizations
- **MINOR**: New principle added, existing principle materially
  expanded, or section added
- **PATCH**: Clarifications, wording improvements, example
  updates, non-semantic refinements

### Sync Impact Report

Every version change MUST include a sync impact report in the
constitution's HTML comment header. The report MUST document:
version change, type (MAJOR/MINOR/PATCH), modified principles,
added/removed principles, added/removed sections, and any
downstream template or tooling updates required.

### Conflict Resolution

When principles conflict, apply in order of priority:

1. **Security & Compliance (XVI-XXII)** -- Security MUST NOT be
   compromised for any reason
2. **Core Architecture (I-X)** -- Structural foundation MUST
   remain stable
3. **Data & State Management (XI-XV)** -- Data integrity protects
   correctness
4. **Quality & Maintenance (XXIII-XXVIII)** -- Maintainability
   protects long-term velocity
5. **Performance & User Experience (XXIX-XXXI)** -- User
   experience within architectural constraints

### Documentation References

Canonical documentation locations:
- **Architecture Decisions**: `docs/architecture/`
- **Integration Guides**: `docs/integrations/`
- **Component Documentation**: Inline JSDoc + Storybook (if
  adopted)
- **API Documentation**: `docs/api/`

**Version**: 1.1.0 | **Ratified**: 2026-03-15 | **Last Amended**: 2026-03-16
