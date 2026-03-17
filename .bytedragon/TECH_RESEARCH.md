# Technology Research: Serial Killer Game

> Browser-based video game technology stack evaluation
> Research date: 2026-03-15

> Updated: 2026-03-16 — Added testing, linting, logging, and error handling sections

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Node.js Version](#nodejs-version)
3. [Frontend Stack Versions](#frontend-stack-versions)
4. [Game Engine Evaluation](#game-engine-evaluation)
5. [Authentication](#authentication)
6. [Real-Time Communication](#real-time-communication)
7. [Game State Management](#game-state-management)
8. [Supporting Technologies](#supporting-technologies)
9. [Testing Infrastructure](#testing-infrastructure)
10. [Code Quality Tooling](#code-quality-tooling)
11. [Logging & Error Handling](#logging--error-handling)
12. [Supabase Development Scripts](#supabase-development-scripts)
13. [Architecture & Project Structure](#architecture--project-structure) (incl. [Centralization Principles](#centralization-principles), [Zero-Trust Security](#zero-trust-security-architecture))
14. [Deployment Strategy](#deployment-strategy)
15. [Cost Analysis](#cost-analysis)
16. [Recommended Stack Summary](#recommended-stack-summary)
17. [Sources](#sources)

---

## Executive Summary

### Recommended Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Runtime** | Node.js 24 LTS (24.14.0) | Active LTS until Oct 2026, maintenance until April 2028 |
| **App Shell** | Next.js 16.1.6 | Turbopack default, React 19.2, Cache Components, full SSR |
| **UI Framework** | React 19.2.4 + React DOM 19.2.4 | View Transitions, useEffectEvent, Activity, React Compiler |
| **Language** | TypeScript 5.9.3 (upgrade to 6.0.x when stable) | 6.0 RC released March 6, stable expected ~March 17 |
| **Styling** | Tailwind CSS 4.2.1 | CSS-first config, Oxide engine (5x faster), no config file needed |
| **App UI** | shadcn/ui (CLI v4) | 50+ accessible components built on Radix UI, copy-paste, Tailwind v4 native |
| **Marketing UI** | Magic UI | 150+ animated components for landing pages, hero sections, pricing tables |
| **Package Manager** | npm (bundled with Node.js 24) | Zero extra dependencies, native Node.js tooling, Turborepo workspace support |
| **Game Engine** | Phaser 3 (v3.90.0) | Best Next.js integration (official template), best AI/Claude support, batteries-included, MIT license |
| **Database** | Supabase Cloud (PostgreSQL) | RLS for game security, real-time capabilities, edge functions, generous free tier |
| **Auth** | Supabase Auth | Native RLS integration (`auth.uid()` in policies), 50K MAU free, no JWT bridge complexity |
| **Real-Time** | Supabase Realtime (Broadcast + Presence) | 6ms median latency, perfect for social deduction game, unified with database |
| **State Management** | Zustand | Subscribable outside React (critical for game loop), tiny (1KB), minimal boilerplate |
| **Hosting** | Azure App Service B1 Linux (~$13/mo) | Full GA Next.js support, WebSockets, custom headers, 10GB storage, no preview caveats |
| **Container Registry** | GitHub Container Registry (ghcr.io) | Free for public repos, 500MB free for private, integrated with GitHub Actions CI/CD |
| **Asset Storage** | Azure Blob Storage | Consolidates with hosting under single Azure provider |
| **CDN** | Azure Front Door (at scale) | WAF + global edge caching; skip for MVP, add when global performance matters |
| **Monorepo** | Turborepo | Shared types, cached builds, clear boundaries |
| **Analytics** | PostHog (free tier) | 1M events/month, session replay, feature flags |
| **Error Tracking** | Sentry (free tier) | 5K errors/month, performance monitoring |
| **Testing (Unit)** | Vitest 4.1.0 | ESM-native, Turborepo-compatible, fast |
| **Testing (Component)** | React Testing Library 16.3.2 | Behavior-focused, React 19.2 compatible |
| **Testing (E2E)** | Playwright 1.58.2 | Multi-browser, WebSocket support, multi-tab |
| **Linting** | ESLint (flat config) with eslint-config-next | Constitution principle enforcement |
| **Logging** | Pino 10.x | Structured JSON, 5-10x faster than Winston, Sentry integration |
| **Error Handling** | neverthrow (Result type) + next-safe-action | Type-safe errors across Phaser, React, and Server Actions |

### Key Architectural Decision

Next.js handles everything outside the game canvas (auth, routing, admin, lobby, settings, UI overlays). Phaser handles everything inside the canvas (game rendering, animations, input during gameplay). They communicate via an **EventBus bridge pattern** (official Phaser template). Supabase handles all server-side concerns (database, auth, real-time sync, edge functions for authoritative game logic).

---

## Node.js Version

### Required: Node.js 24 LTS (24.14.0)

All project artifacts -- local development, Docker images, CI/CD, and Azure App Service -- must target **Node.js 24 LTS**.

| Attribute | Value |
|-----------|-------|
| **Version** | 24.14.0 (Active LTS) |
| **Released** | February 24, 2026 |
| **Active LTS since** | October 28, 2025 |
| **Active LTS until** | ~October 2026 |
| **Maintenance LTS until** | April 30, 2028 |

### Compatibility Verification

| Technology | Node 24 Compatible? | Details |
|-----------|---------------------|---------|
| **Next.js 16.1.6** | Yes | Minimum Node.js 20.9 required. Node 24 exceeds this. |
| **Phaser 3.90.0** | Yes | Client-side library. Any modern Node version works for build tooling. |
| **Supabase JS SDK** | Yes | Requires Active or Maintenance LTS. Node 24 is fully supported. |
| **Azure App Service Linux** | Yes | Node.js 24 LTS available via runtime stack `NODE\|24-lts`. |
| **GitHub Actions** | Yes | Use `actions/setup-node@v4` with `node-version: '24'`. |
| **Docker** | Yes | `node:24-alpine` image available on Docker Hub. |
| **Turborepo** | Yes | Supports Node.js 18+. |

### Where Node 24 Must Be Specified

| Artifact | Configuration | Value |
|----------|--------------|-------|
| **package.json** | `engines.node` | `">=24.0.0"` |
| **Dockerfile** | `FROM` base image | `node:24-alpine` |
| **GitHub Actions** | `actions/setup-node` | `node-version: '24'` |
| **Azure App Service** | Runtime stack | `NODE\|24-lts` |
| **.nvmrc** | Version file | `24` |
| **.node-version** | Version file (alt) | `24.14.0` |

### Version to Avoid

- **Node.js 20**: EOL is April 30, 2026 -- do NOT target for new projects
- **Node.js 22**: Maintenance LTS (until April 2027) -- functional but not the latest LTS
- **Node.js 25 (Current)**: Odd-numbered, not LTS, not for production

---

## Frontend Stack Versions

All versions verified compatible with each other and Node.js 24 LTS as of March 2026.

### Version Matrix

| Technology | Version | Notes |
|-----------|---------|-------|
| **Next.js** | `16.1.6` | Turbopack default, React Compiler support, Cache Components |
| **React** | `19.2.4` | View Transitions, useEffectEvent, Activity |
| **React DOM** | `19.2.4` | Matches React version |
| **TypeScript** | `5.9.3` | Upgrade to `6.0.x` when stable (~March 17, 2026) |
| **Tailwind CSS** | `4.2.1` | CSS-first config, Oxide engine, no `tailwind.config.js` |
| **npm** | Bundled with Node.js 24 | Package manager (no extra install needed) |
| **shadcn/ui** | CLI v4 (copy-paste, no version pinning) | App UI components |
| **Magic UI** | Latest (copy-paste, no version pinning) | Marketing/landing page components |
| **Radix UI** | Unified `radix-ui` package (Feb 2026) | Managed by shadcn/ui, not installed separately |

### Next.js 16

**Latest stable**: `16.1.6` (February 2026)

**Key features**:
- **Turbopack is default** -- no more `--turbopack` flag for `next dev` and `next build`
- **React Compiler support (stable)** -- automatic memoization via `reactCompiler: true`
- **Cache Components** -- replaces experimental PPR via `cacheComponents: true`
- **React 19.2 features** -- View Transitions, `useEffectEvent`, Activity
- **New caching APIs** -- `updateTag` (read-your-writes), stable `cacheLife`/`cacheTag`

**Breaking changes to watch**:
- `middleware.ts` must be renamed to `proxy.ts` -- the `edge` runtime is dropped from proxy
- Async Request APIs fully enforced -- no more synchronous `cookies()`, `headers()`, `params`, `searchParams`
- `next lint` command removed -- use ESLint or Biome directly
- ESLint Flat Config by default
- `images.domains` deprecated (use `remotePatterns`)
- AMP support removed
- Runtime configuration (`serverRuntimeConfig`/`publicRuntimeConfig`) removed

**Node.js requirement**: Minimum `20.9.0`. Node 24 LTS is fully compatible.

### React 19.2

**Latest stable**: `19.2.4` (January 26, 2026)

No React 20 yet -- 19.2.x is the current stable line.

**Key features**:
- View Transitions API
- `useEffectEvent` hook
- Activity component (background rendering with state preservation)
- React Compiler 1.0 (automatic memoization -- no more manual `useMemo`/`useCallback`)
- DoS mitigations for Server Actions
- Hardened Server Components

### Tailwind CSS 4

**Latest stable**: `4.2.1` (February 2026)

**Major changes from v3**:
- **CSS-first configuration** -- `@theme` directive in CSS replaces `tailwind.config.js`
- **No config file required** -- all customization via CSS variables and `@theme`
- **Automatic content detection** -- no `content: [...]` array needed; respects `.gitignore`
- **No extra PostCSS plugins** -- no `postcss-import`, no `autoprefixer` (handled internally)
- **Oxide engine (Rust-based)** -- 5x faster full builds, 100x faster incremental
- **Native CSS features** -- cascade layers, `@property`, `color-mix()`
- **Built-in `@import`** -- handles CSS imports natively

**Setup in Next.js 16**: Automatic. `create-next-app` scaffolds with Tailwind v4 by default. Just `@import "tailwindcss"` in the CSS entry point.

### TypeScript

**Current stable**: `5.9.3` (October 2025)

**TypeScript 6.0**: RC released March 6, 2026. Stable expected ~March 17, 2026.
- Temporal API support
- Last JavaScript-based TypeScript release (7.0 will be rewritten in Go)
- Breaking changes present -- review before upgrading

**Recommendation**: Start with `5.9.3`. Upgrade to `6.0.x` once stable (imminent). Next.js 16 requires minimum TypeScript `5.1.0`, so both are compatible.

### npm (Package Manager)

**Version**: Bundled with Node.js 24 (no separate install)

**Why npm**: It ships with Node.js -- zero extra dependencies to install or manage. Turborepo supports npm workspaces natively. For a small team, the practical speed difference of alternative package managers (pnpm, Bun) is negligible and doesn't justify adding another tool to the stack.

**Turborepo workspace config** (`package.json` root):
```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

### UI Components: shadcn/ui (App UI)

**Role**: All application UI -- admin panel, user settings, login/signup, game lobby, forms, data tables, navigation, modals, toasts, etc.

| Attribute | Detail |
|-----------|--------|
| **Type** | Copy-paste component library (no runtime dependency, no version pinning) |
| **CLI** | `npx shadcn@latest init` then `npx shadcn@latest add [component]` |
| **GitHub Stars** | ~105K+ (fastest growing React UI library) |
| **npm Downloads** | ~560K/week |
| **License** | MIT (100% free) |
| **Tailwind v4** | Full support -- all components updated for v4 + React 19 |
| **Next.js 16** | Full App Router support |
| **Component Count** | 50+ core components |
| **Accessibility** | Excellent -- built on Radix UI primitives (WAI-ARIA, keyboard navigation, screen reader, focus management) |
| **Theming** | CSS variable theming, dark mode via `class` strategy, highly customizable |

**Key components for this project**: Button, Card, Dialog, Dropdown Menu, Form, Input, Label, Navigation Menu, Select, Sheet (mobile nav), Sidebar, Skeleton, Sonner (toasts), Switch, Table, Tabs, Toggle, Tooltip, Avatar, Badge, Separator.

**Installation approach -- immutable vendor directory**: shadcn/ui components are installed via CLI into a centralized vendor directory (e.g., `src/components/vendor/shadcn/`) and **treated as immutable**. These files are never modified directly. Instead, custom application components in `src/components/app/` import and compose the immutable vendor primitives, adding project-specific behavior, branding, and props. This ensures vendor components can be regenerated or updated without losing customizations, and that all application-specific styling flows from a single layer. See [Centralization Principles](#centralization-principles) in the Architecture section.

**2026 updates**:
- Unified `radix-ui` package (Feb 2026) -- single dependency instead of many `@radix-ui/react-*` packages
- Dual primitive support -- now supports both Radix UI AND Base UI as underlying primitives
- RTL support (Jan 2026)
- Pre-built blocks -- login, signup, sidebar, dashboard blocks

**Radix UI relationship**: Radix provides the unstyled, accessible primitive layer. shadcn/ui wraps Radix with Tailwind styling. You do NOT install Radix separately -- shadcn manages the dependency.

### UI Components: Magic UI (Marketing Pages)

**Role**: Landing pages, hero sections, feature showcases, pricing tables, testimonial carousels, animated call-to-action blocks -- anywhere polished marketing animations are needed.

| Attribute | Detail |
|-----------|--------|
| **Type** | Copy-paste animated components (like shadcn/ui but for marketing) |
| **GitHub Stars** | ~19K+ |
| **License** | MIT (100% free) |
| **Tailwind v4** | Full support (defaults to v4 + React 19) |
| **Next.js 16** | Full App Router support |
| **Component Count** | 150+ animated components and effects |
| **Approach** | Copy-paste -- no runtime dependency, zero bundle overhead for unused components |

**Installation approach -- immutable vendor directory**: Same principle as shadcn/ui. Magic UI components are installed into `src/components/vendor/magic-ui/` and **treated as immutable**. Custom marketing components in `src/components/app/marketing/` compose these vendor primitives with project-specific content, branding, and layout. See [Centralization Principles](#centralization-principles) in the Architecture section.

**Complements shadcn/ui**: Use shadcn/ui for application UI (forms, tables, settings) and Magic UI for marketing/landing page sections (animated heroes, feature grids, testimonials). Both are copy-paste, Tailwind v4 native, and add zero runtime overhead.

### UI Alternatives Evaluated (Not Selected)

| Library | Version | Stars | Why Not Selected |
|---------|---------|-------|-----------------|
| **Mantine** | 8.x (9.0 alpha) | ~28-38K | Not Tailwind-native. Uses own CSS modules styling that can conflict with Tailwind. Best when Tailwind isn't primary. |
| **daisyUI** | 5.5.19 | ~35K+ | Pure CSS classes (no JS behavior). No built-in ARIA management. Would need Radix underneath anyway. |
| **HeroUI** (ex-NextUI) | 2.8.10 (v3 beta) | ~23.5K | v3 still in beta. Not recommended until v3 stabilizes. |
| **Ark UI** | Active dev | ~5K | Good Radix alternative but 10x smaller ecosystem. No reason to pick over Radix/shadcn. |
| **Park UI** | 0.20.1 | Small | Tailwind plugin appears unmaintained (~2 years old). |
| **Aceternity UI** | Active | ~3.3K | Good animated components but smaller community than Magic UI (3.3K vs 19K stars). |

### Where Versions Must Be Specified

| Artifact | Configuration |
|----------|--------------|
| **package.json** | `"engines": { "node": ">=24.0.0" }`, exact dependency versions in `dependencies`/`devDependencies` |
| **package.json scripts** | Remove any `--turbopack` flags (default in Next.js 16) |
| **Dockerfile** | `FROM node:24-alpine` |
| **.nvmrc** | `24` |
| **.node-version** | `24.14.0` |
| **GitHub Actions** | `actions/setup-node@v4` with `node-version: '24'` |
| **next.config.ts** | `output: 'standalone'`, `reactCompiler: true` |
| **CSS entry point** | `@import "tailwindcss"` (no `tailwind.config.js`) |
| **package.json (root)** | `"workspaces": ["apps/*", "packages/*"]` for npm workspaces + Turborepo |

---

## Game Engine Evaluation

### Comparison Matrix

| Criteria | Phaser 3 | PixiJS | React Three Fiber | Babylon.js | Excalibur | Kaplay | Godot (HTML5) |
|----------|---------|--------|-------------------|-----------|-----------|--------|--------------|
| **Cost** | Free (MIT) | Free (MIT) | Free (MIT) | Free (Apache) | Free (BSD) | Free (MIT) | Free (MIT) |
| **Next.js Integration** | A+ (official template) | A (React bindings) | A+ (native React) | B (community) | C (no template) | D (none) | D (iframe) |
| **Production Ready** | A+ (10+ years) | A+ (mature) | A (mature) | A+ (Microsoft) | C (pre-1.0) | B- (small) | A+ (mature) |
| **AI/Claude Usability** | A+ (best) | A (good) | A (good) | B+ (good) | D (hallucinations) | D (hallucinations) | B (GDScript only) |
| **2D Capability** | A+ (purpose-built) | A+ (best renderer) | C (3D focus) | C (3D focus) | A (good) | A (good) | A+ (both) |
| **Batteries Included** | A+ (physics, audio, input, scenes, tilemaps) | D (renderer only) | C (must add everything) | A+ (full engine) | A (good built-ins) | B+ (basic features) | A+ (full engine) |
| **Community Size** | ~38K GitHub stars | ~47K stars | ~30K stars (R3F) | ~25K stars | ~2K stars | ~4.5K stars | ~97K stars |
| **Bundle Size** | ~1.2MB (122KB compressed) | ~450KB | ~900KB+ combined | Heavy | ~300KB | Medium | 40MB+ export |

### Winner: Phaser 3 (v3.90.0)

**Why Phaser wins across all evaluation criteria:**

1. **Official Next.js Template** - The only game engine with a maintained, official Next.js integration template (`phaserjs/template-nextjs`), supporting Next.js 15.3.1+ (compatible with Next.js 16) + TypeScript 5.
2. **Best AI/Claude Support** - Largest training corpus of any JS game framework. A direct comparison study found Phaser produces significantly fewer AI hallucinations than Excalibur or Kaplay. 1500+ examples on phaser.io.
3. **Batteries Included** - Physics (Arcade + Matter.js), audio, input handling, tweening, particles, tilemaps, cameras, scene management all built in. No need to assemble a stack from multiple libraries.
4. **Production Proven** - 10+ years of maturity. Used in games like Grid Gladiators, Grapplenauts, and hundreds of games on itch.io.
5. **Headless Server Mode** - Can run Phaser on Node.js for authoritative multiplayer game logic.
6. **Phaser 4 Migration Path** - Phaser 4 (currently RC6) shares the same API. Upgrade is incremental, not a rewrite. v4 brings native TypeScript, WebGPU support, and the new Beam renderer.
7. **Bundle Optimization** - Phaser Compressor reduces the 1.2MB bundle by 60% to ~122KB min+gzipped.

### Next.js Integration Pattern (Bridge Component)

```typescript
// How Phaser integrates with Next.js (official pattern)

// 1. Dynamic import with SSR disabled
const PhaserGame = dynamic(() => import('./PhaserGame'), {
  ssr: false,
  loading: () => <GameLoadingScreen />
});

// 2. PhaserGame.tsx - Bridge component (forwardRef)
// Initializes Phaser in a useRef/useEffect, exposes game + scene via ref

// 3. EventBus.ts - Bidirectional communication
// Phaser scenes emit events -> React listens
// React calls methods on scene ref -> Phaser responds

// 4. React handles UI overlays (menus, HUD, voting, chat)
// Phaser handles game canvas (rendering, animations, game loop)
```

### Detailed Engine Profiles

#### Phaser 3 (RECOMMENDED)
- **Version**: 3.90.0 (stable, likely final v3 release)
- **npm Downloads**: ~50K-63K weekly
- **TypeScript**: Full definitions in v3, native TypeScript in v4
- **Key Feature**: Official Next.js template with EventBus bridge pattern
- **Notable**: Best mobile/Safari performance of all JS game frameworks
- **License**: MIT - completely free including commercial use

#### PixiJS (Strong alternative for rendering-only needs)
- **Version**: 8.16.0
- **npm Downloads**: ~229K weekly (@pixi/core)
- **TypeScript**: Full support in v8
- **Key Feature**: Official React bindings (@pixi/react v8), fastest pure 2D renderer
- **Limitation**: NOT a game engine - no physics, audio, input, scene management. Must build or assemble from separate libraries.
- **Best for**: Projects that need maximum rendering performance and don't need game engine features

#### React Three Fiber (Best 3D option if needed later)
- **Version**: 9.5.0 (Three.js r176+)
- **Three.js npm Downloads**: ~2.96M weekly
- **TypeScript**: Full support
- **Key Feature**: IS a React renderer - most native React integration of any 3D library
- **Note**: Can coexist with Phaser in the same Next.js app if 3D is needed later
- **Limitation**: 3D-focused, not a game engine, large bundle

#### Babylon.js
- **Version**: 8.55.1 (actively maintained by Microsoft)
- **TypeScript**: Written in TypeScript
- **Key Feature**: Full 3D engine with Havok physics, WebGPU support
- **Limitation**: React bindings are community-maintained (not official), heavy bundle, overkill for 2D

#### Excalibur.js (NOT recommended)
- **Version**: 0.32.0 (pre-1.0)
- **TypeScript**: Built from ground up in TypeScript
- **Limitation**: Pre-1.0, very small community (~2K stars), poor AI/Claude support (more hallucinations), no Next.js template, no React bindings

#### Kaplay / Kaboom.js (NOT recommended)
- **Version**: 3001.0.19
- **Limitation**: No React/Next.js integration, poor AI support, Kaboom->Kaplay rename confuses AI models, not suited for production

#### Godot HTML5 Export (NOT recommended for Next.js)
- **Version**: 4.6.1
- **Limitation**: 40MB+ export size, iframe-based integration only, requires SharedArrayBuffer headers, no TypeScript, separate development workflow from Next.js

---

## Authentication

### Recommendation: Supabase Auth

| Option | Free Tier | Cost After Free | RLS Integration | Implementation Time |
|--------|-----------|----------------|-----------------|-------------------|
| **Supabase Auth** | 50K MAU | $0.00325/MAU | Native (`auth.uid()`) | 2-5 days |
| Clerk | 10K MAU | $0.02/MAU (6x more) | Requires JWT bridge (deprecated April 2025) | 1-3 days |
| NextAuth (Auth.js) v5 | Unlimited (self-hosted) | $0 (maintenance cost) | Custom adapter required | 5-10 days |

**Why Supabase Auth wins**: For a game that uses Supabase for database and real-time, native auth integration eliminates an entire category of bugs. `auth.uid()` works directly in Row Level Security policies without JWT bridges, custom ID mapping, or token forwarding. This is a massive architectural simplification. Auth is one of the few operations the browser performs directly against Supabase (login, signup, session refresh). All other mutations go through server-side code. See [Zero-Trust Security Architecture](#zero-trust-security-architecture).

**Key capabilities**: Social login (Google, Discord, GitHub), magic links, OTP, MFA, 50K MAU free tier.

**Clerk's JWT bridge was deprecated in April 2025**, confirming the integration complexity is real. String-based IDs vs Supabase UUIDs adds friction.

---

## Real-Time Communication

### Recommendation: Supabase Realtime (sufficient for this game type)

### Latency Benchmarks

| Method | Median Latency | P95 Latency | Max Throughput |
|--------|---------------|-------------|----------------|
| Supabase Broadcast | 6ms | 28ms | 224K msg/s with 32K users |
| Supabase Database Changes | 46ms | N/A | 10K msg/s with 80K users |

### Game Type Suitability

| Game Type | Acceptable Latency | Supabase Fit |
|-----------|-------------------|--------------|
| Turn-based (chess, cards) | < 500ms | EXCELLENT |
| Social deduction (Among Us-style) | < 200ms | EXCELLENT |
| Real-time strategy | < 100ms | GOOD (Broadcast) |
| Casual action (party games) | < 60ms | POSSIBLE (Broadcast only) |
| FPS / Fighting | < 20ms | NOT SUITABLE |

A social deduction game is an **ideal use case** for Supabase Realtime:
- Phase-based gameplay tolerates 50-200ms latency easily
- 5-15 players per session (well within connection limits)
- Game events (votes, reveals, chat) are low-frequency
- Free tier: 200 concurrent connections = ~13-40 simultaneous game rooms

### Three Realtime Features for Games

| Feature | Use Case | Persistence | Latency |
|---------|----------|-------------|---------|
| **Broadcast** | Game events (votes, actions, chat) | No (fire-and-forget) | 6ms median |
| **Presence** | Who is online, player status, lobby tracking | Auto-managed | Real-time |
| **Database Changes** | Game results, scores, leaderboards | Yes (database) | 46ms median |

### Alternatives Evaluated (Not Recommended)

- **PartyKit (Cloudflare)**: Overkill for social deduction. Consider only if game evolves to need authoritative server-side game loop with Durable Objects.
- **Socket.io**: Requires custom server infrastructure. Unnecessary when Supabase Realtime covers the use case.
- **Liveblocks**: Designed for collaborative apps (Figma-style), not games.
- **Ably/Pusher**: Enterprise-grade pub/sub. Overkill and expensive for an indie game.

### WebSocket vs WebRTC

| Feature | WebSocket (Supabase) | WebRTC |
|---------|---------------------|--------|
| Architecture | Client-Server | Peer-to-Peer |
| Latency | ~6-50ms via server | ~1-5ms P2P |
| Delivery | Guaranteed (TCP) | Best-effort (UDP) |
| Complexity | Low | High (STUN/TURN, SDP) |
| Best For | Social deduction, turn-based | FPS, voice chat |

**For this game**: WebSocket via Supabase is correct. Social deduction needs reliable message delivery (votes must arrive!) more than ultra-low latency.

### Plan Limits

| Feature | Free | Pro ($25/mo) |
|---------|------|-------------|
| Concurrent Connections | 200 | 500 (up to 10K) |
| Messages/second | 100 | 500 (up to 2,500) |
| Presence msg/second | 20 | 50 (up to 1,000) |
| Monthly Messages | 2M | 5M + overage |
| Broadcast Payload | 256 KB | 3,000 KB |

---

## Game State Management

### Three-Layer Architecture

```
Layer 1: Game Engine State (Phaser Scenes)
  - Physics, sprites, animations, game loop
  - Managed by Phaser natively
  - Communicated to React via EventBus

Layer 2: Application State (Zustand)
  - UI state (menus, overlays, HUD)
  - Player preferences, settings
  - Game metadata (room info, player list)
  - Bridges React UI and Phaser canvas

Layer 3: Server State (Supabase)
  - Persistent game state (matches, scores, history)
  - Multiplayer sync (Realtime Broadcast + Presence)
  - Auth state
```

### Why Zustand

| Library | Bundle Size | Game Use Case Fit | Key Advantage |
|---------|------------|-------------------|---------------|
| **Zustand** | ~1KB | EXCELLENT | Subscribable outside React (Phaser can read/write directly) |
| Jotai | ~3KB | Good | Better for complex derived state, overkill here |
| Redux/RTK | ~10KB+ | Overkill | Too much boilerplate for game state |
| React Context | 0KB | Poor | Bad performance with frequent game updates |

**Critical for games**: Zustand stores can be subscribed to **outside React components** - meaning the Phaser game loop can read/write state directly without triggering React re-renders.

### Multiplayer Sync Flow

```
Client A (Phaser + React)          Supabase            Client B (Phaser + React)
    |                                  |                       |
    |-- Player action (vote) --------->|                       |
    |   (Broadcast)                    |-- Broadcast --------->|
    |                                  |                       |
    |-- Game result (persist) -------->|                       |
    |   (Database insert)              |-- DB Change --------->|
    |                                  |                       |
    |   Presence sync <--------------->|<------- Presence ---->|
```

---

## Supporting Technologies

### Audio
- **If using Phaser**: Use Phaser's built-in audio system (already included)
- **If React-only UI**: Howler.js (7KB gzip, excellent for SFX + music)

### Physics
- Likely not needed for a social deduction game
- If spatial gameplay exists: Phaser Arcade (built-in, fast) for simple collision/movement

### Animation
- **Game canvas**: Phaser Tweens (built-in property animations)
- **React UI**: Framer Motion (React UI animations, transitions)
- **Complex characters**: Spine ($69+) or DragonBones (free) only if skeletal animation needed

### Map/Level Editors
- **Tiled**: Phaser has native Tiled tilemap support (TMX/JSON format)
- **LDtk**: Universal JSON format, parseable in JS
- For social deduction: A custom React-based room/lobby editor may be more appropriate than traditional tile maps

### Asset Management & CDN

| Service | Free Tier | Egress Cost | Best For |
|---------|-----------|-------------|----------|
| **Azure Blob Storage** | 5GB (first 12 months) | $0.087/GB (first 5GB/mo free) | Game assets (sprites, audio, maps) -- consolidates under Azure |
| **App Service `public/`** | Included in App Service plan | Included (served by App Service) | Small static assets bundled with app (icons, UI) |
| **Supabase Storage** | 1GB, 2GB transfer | Included | User avatars, uploads (integrates with RLS) |

**Strategy**: Small assets in `public/` (served directly by App Service), large game assets on Azure Blob Storage (same provider as hosting), user-generated content in Supabase Storage. At scale, add Azure Front Door in front of both App Service and Blob Storage for global edge caching.

**Egress cost note**: Azure Blob Storage charges $0.087/GB for egress (first 5GB/mo free). For an MVP with low traffic this is negligible. At scale (1000+ DAU, ~300GB/mo egress), costs reach ~$26/mo. If egress becomes a significant cost factor, Cloudflare R2 ($0 egress) can be introduced specifically for high-egress assets while keeping everything else on Azure.

### Analytics & Monitoring

| Service | Free Tier | Best For |
|---------|-----------|----------|
| **PostHog** | 1M events, 5K session replays, 1M feature flags | Product analytics, A/B testing |
| **Sentry** | 5K errors/month | Error tracking, performance monitoring |

**Game-specific metrics to track**: Game completion rate, average game duration, player retention, popular game modes, connection drop rates during games.

---

## Testing Infrastructure

All testing tooling versions verified compatible with Node.js 24, TypeScript 5.9.3/6.0, React 19.2, Next.js 16.1.6, and Turborepo as of March 2026.

### Vitest 4.1.0 (Unit + Integration Testing)

**Version**: `4.1.0` | **Status**: Active, latest stable | **Released**: March 12, 2026

**Why Vitest over Jest**:

| Factor | Vitest 4.1 | Jest 30 |
|--------|-----------|---------|
| ESM support | Native (Vite-powered) | Requires configuration, CommonJS-first |
| TypeScript | Zero-config, native | Needs ts-jest or @swc/jest |
| Speed | 2-3x faster for most workloads | Slower startup, requires transforms |
| Next.js 16 integration | Official docs recommend Vitest | Supported but more config needed |
| Configuration | Shares Vite config (resolve.alias, plugins) | Separate Jest config |
| Browser testing | Built-in (stable in v4) | Experimental |

**Verdict**: Vitest is the clear choice for a Vite/ESM-first project. Next.js 16 official docs recommend Vitest over Jest for new projects. Zero-config TypeScript and 2-3x speed advantage are significant for developer experience. Vitest 4.x requires Vite 6.0+ (Vite 8 based) and Node.js 20+.

**Stack Compatibility**:

| Requirement | Status | Details |
|------------|--------|---------|
| ESM-native | Yes | Vite-powered, ESM-first by design |
| TypeScript 5.9/6.0 | Yes | Native TS support, no ts-jest needed |
| Node.js 24 | Yes | Requires >= 20, Node 24 exceeds |
| Next.js 16 | Yes | Official Next.js docs updated Feb 27, 2026 |
| React 19.2 | Yes | Via @vitejs/plugin-react |
| Turborepo | Yes | Official integration docs at turborepo.dev |

**Turborepo Integration**: Per-package Vitest configs with Turborepo caching. Each package (`apps/web`, `packages/game-engine`, `packages/shared`) gets its own `vitest.config.mts` and Turborepo parallelizes and caches test runs independently.

**Per-package vitest.config.mts** (example for apps/web):
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
})
```

**turbo.json tasks**:
```json
{
  "tasks": {
    "test": {
      "dependsOn": ["^test"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Environment**: Use `jsdom` as default for React component tests (more complete browser API, better CSS support, aligns with Next.js official docs). Add `// @vitest-environment happy-dom` per-file for pure unit tests where speed matters.

**Security**: No critical CVEs for vitest 4.x. Dev dependency only. Underlying Vite had CVE-2025-31125 (improper access control) — fixed in Vite 6.x+, which Vitest 4.x requires.

### React Testing Library 16.3.2 (Component Testing)

**React 19.2 compatible**: `@testing-library/react@16.3.2` peer-deps include `react@(^18 | ^19)`.

**Exact Versions**:

| Package | Version | React 19.2 Compatible | Notes |
|---------|---------|:----:|-------|
| `@testing-library/react` | 16.3.2 | Yes | Peer: `react@(^18 \| ^19)` |
| `@testing-library/dom` | 10.x | Yes | Required peer dep |
| `@testing-library/jest-dom` | 6.9.1 | Yes | Vitest-compatible via `/vitest` import |
| `@testing-library/user-event` | 14.6.1 | Yes | Simulates real user interactions |

**Vitest compatibility**: `@testing-library/jest-dom` has native Vitest support via the `/vitest` import path:

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest'
```

This adds DOM matchers (`toBeInTheDocument()`, `toHaveTextContent()`, `toBeVisible()`, `toBePressed()`) to Vitest's `expect`.

**Important**: Vitest + RTL do NOT support testing async Server Components. Use Playwright E2E for those. Synchronous Server and Client Components work fine. React 19 async rendering means `render`, `renderHook`, `fireEvent`, `act` may return Promises and should be awaited.

**Constitution alignment** (Principle XXVI): RTL's `getByRole`, `getByText`, and `userEvent` enforce behavior-focused testing. The `.test.ts` / `.test.tsx` suffix aligns with the Vitest `include` pattern.

### Playwright 1.58.2 (E2E Testing)

**Version**: `1.58.2` | **Status**: Active, latest stable | **Released**: ~February 2026

**Stack Compatibility**:

| Requirement | Status | Details |
|------------|--------|---------|
| WebSocket testing | Yes | `page.routeWebSocket()`, `browserContext.routeWebSocket()` |
| Multi-tab testing | Yes | Multiple `Page` objects within `BrowserContext` |
| Multi-user simulation | Yes | Multiple `BrowserContext` instances |
| Headless Chromium for CI | Yes | Default mode |
| TypeScript | Yes | Native support |
| Next.js | Yes | First-class support |

**WebSocket Testing (critical for Supabase Realtime)**: Playwright has built-in WebSocket support via `page.routeWebSocket()` (intercept per page) and `browserContext.routeWebSocket()` (intercept all pages in context). This is the primary mechanism for testing Supabase Realtime (Broadcast + Presence) in E2E scenarios.

**Multi-Tab Testing (for multiplayer scenarios)**:
```typescript
const context1 = await browser.newContext()
const context2 = await browser.newContext()
const player1 = await context1.newPage()
const player2 = await context2.newPage()
// Both navigate to game lobby, test multiplayer interactions
```

**Placement**: Lives at monorepo root with `e2e/` test directory. Per-package E2E in `apps/web/e2e/` for app-level flows.

**CI Configuration**:
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

**Security Advisories**:

| CVE | Severity | Description | Status |
|-----|----------|-------------|--------|
| CVE-2025-59288 | Medium | Supply chain (SHA1-Hulud) in playwright-core | Fixed in recent versions |
| CVE-2025-9611 | Medium | MCP Server DNS rebinding (playwright-mcp, not core) | Not applicable |

Playwright is a dev dependency with limited production risk surface.

### Test Organization (Constitution Principle XXVI)

```
apps/web/
  src/
    components/app/common/Button.tsx
  tests/
    components/app/common/Button.test.tsx    # Component test (Vitest + RTL)
  e2e/
    lobby.spec.ts                            # E2E test (Playwright)
    multiplayer.spec.ts                      # Multi-user E2E (Playwright)

packages/game-engine/
  src/
    scenes/GameScene.ts
  tests/
    scenes/GameScene.test.ts                 # Unit test (Vitest, no Phaser rendering)

packages/shared/
  src/
    schemas/player.ts
  tests/
    schemas/player.test.ts                   # Schema validation test (Vitest)
```

**File suffixes**: `.test.ts` / `.test.tsx` for Vitest unit + component tests; `.spec.ts` for Playwright E2E. This distinction prevents Vitest from picking up E2E files.

### Phaser Testing Strategy

**Do NOT unit test Phaser rendering**. Phaser's rendering engine is a browser canvas concern — unit tests cannot and should not simulate it. Instead:

- **Extract logic**: Move game logic (combat resolution, state transitions, voting tallies) into pure functions in `packages/game-engine/src/systems/` with zero Phaser dependency. These pure functions are unit-testable with Vitest.
- **E2E for scene behavior**: Use Playwright to test that game scenes initialize, that UI overlays appear, that multiplayer state syncs. This exercises the full stack including Phaser canvas output.

### Supabase Testing Strategy

- **Local Supabase**: Use `supabase start` for RLS and integration tests against a real PostgreSQL instance. Confirms that policies block/allow the right operations.
- **Mock clients**: For unit tests, mock the Supabase client to avoid real network calls. Keep unit tests fast and deterministic.
- **Two-client pattern**: In integration tests, use `service_role` client to set up test data and `anon`/authenticated client to make assertions. This verifies that RLS behaves correctly from the client perspective.

### Complete Package List

```bash
# Unit + Integration testing (per-package devDependencies)
npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths jsdom \
  @testing-library/react @testing-library/dom @testing-library/jest-dom \
  @testing-library/user-event

# E2E testing (monorepo root devDependencies)
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

**Exact versions to pin**:

| Package | Version |
|---------|---------|
| `vitest` | `^4.1.0` |
| `@vitejs/plugin-react` | `^5.1.3` |
| `vite-tsconfig-paths` | `^5.x` |
| `jsdom` | `^25.x` |
| `@testing-library/react` | `^16.3.2` |
| `@testing-library/dom` | `^10.x` |
| `@testing-library/jest-dom` | `^6.9.1` |
| `@testing-library/user-event` | `^14.6.1` |
| `@playwright/test` | `^1.58.2` |

---

## Code Quality Tooling

### ESLint Flat Config

Next.js 16 completely removed the `next lint` command and the `eslint` option in `next.config.mjs`. ESLint must be run independently via npm scripts. The `eslint-config-next` package supports ESLint flat config natively (ESLint 9+).

**Plugin List**:

| Package | Purpose | Constitution Principle |
|---------|---------|----------------------|
| `eslint` | Core linter | Required |
| `eslint-config-next` | Next.js + React + React Hooks + accessibility | Required |
| `typescript-eslint` | TypeScript parser + rules (unified package) | Required |
| `eslint-plugin-react-compiler` | React Compiler rules | Required (project uses React Compiler) |
| `eslint-plugin-no-barrel-files` | Prevents barrel file authoring | Principle I |
| `eslint-plugin-n` | Node.js rules including `n/no-process-env` | Principle II |
| `eslint-config-prettier` | Disables formatting rules conflicting with Prettier | Recommended |

**Note**: The core ESLint `no-process-env` rule is **deprecated** as of ESLint v7.0.0 and will be removed in v11.0.0. Use `n/no-process-env` from `eslint-plugin-n` instead.

**eslint.config.mjs** (adapted for monorepo root):
```javascript
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import reactCompiler from 'eslint-plugin-react-compiler'
import noBarrelFiles from 'eslint-plugin-no-barrel-files'
import n from 'eslint-plugin-n'
import prettier from 'eslint-config-prettier/flat'

const eslintConfig = defineConfig([
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts',
    'node_modules/**', 'dist/**', '.turbo/**']),

  ...nextVitals,
  ...nextTs,

  reactCompiler.configs.recommended,
  noBarrelFiles.flat,

  {
    plugins: { n },
    rules: {
      // Constitution II: Prevent direct process.env access
      'n/no-process-env': 'error',
      // Constitution V: Prevent feature code from importing vendor directly
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['**/components/vendor/**'],
            message: 'Constitution V: Import from components/app/ instead.' },
        ],
      }],
      // Constitution X: No console.log in production
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // Override: Allow process.env in config modules (Constitution II)
  {
    files: ['**/config/**/*.ts', '**/config/**/*.js'],
    rules: { 'n/no-process-env': 'off' },
  },

  prettier,
])

export default eslintConfig
```

**Monorepo**: Set `settings.next.rootDir: 'apps/web/'` so `@next/eslint-plugin-next` resolves correctly from the monorepo root.

**Constitution Enforcement Summary**:

| Constitution Principle | ESLint Rule | Notes |
|----------------------|-------------|-------|
| I. No barrel files | `no-barrel-files/no-barrel-files` | Detects index.ts re-exports |
| II. No direct process.env | `n/no-process-env` | Disabled only in `config/` directories |
| V. No vendor direct imports | `no-restricted-imports` patterns | Feature code must import from `components/app/` |
| VII. Client/server boundaries | `@next/next/no-async-client-component` | Included in eslint-config-next |
| X. No console.log | `no-console` | Allows `warn` and `error` |
| XXVIII. Accessibility | `jsx-a11y/*` rules | Included in eslint-config-next |

### Build Script Pattern

Adapted from a reference project using the same Next.js 16 + ESLint flat config stack:

```json
{
  "scripts": {
    "build": "rm -rf .next && tsc --noEmit && eslint . && next build",
    "lint": "eslint --cache --cache-location .next/cache/eslint/ .",
    "lint:fix": "eslint --fix ."
  }
}
```

**Sequence**: cache removal → type check → lint → build

1. `rm -rf .next` — clears Next.js build cache before every production build
2. `tsc --noEmit` — type-checks the entire project without emitting output
3. `eslint .` — lints all files using the flat config
4. `next build` — runs the actual Next.js build

**Why NOT `next lint`**: Next.js 16 removed the `next lint` command entirely. ESLint must be invoked directly via `eslint .` in npm scripts. The build script pattern above reflects this.

**Install command**:
```bash
npm i -D eslint eslint-config-next typescript-eslint eslint-plugin-react-compiler \
  eslint-plugin-no-barrel-files eslint-plugin-n eslint-config-prettier
```

---

## Logging & Error Handling

### Pino v10.x (Structured Logging)

**Why Pino over Winston**:

| Factor | Pino v10.x | Winston v3.x |
|--------|-----------|-------------|
| Performance | ~50,000+ logs/sec | ~10,000 logs/sec (5-10x slower) |
| Bundle size | ~25KB | ~200KB+ with dependencies |
| TypeScript | First-class (official) | Community-maintained types |
| JSON output | Native NDJSON | Requires formatter setup |
| PII redaction | Built-in `redact` option | Must implement manually |
| Sentry integration | Official `pinoIntegration()` | Community packages only |
| Event loop | Non-blocking (external transport) | Can block (synchronous) |

**Critical for games**: Pino never blocks the game/application loop. Performance is essential when logging must not affect game state processing.

**Implementation** (server-only singleton, Constitution Principle VIII):
```typescript
// apps/web/src/lib/logger/index.ts
import 'server-only'
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,

  // Redaction (Constitution X + XVIII: PII must never appear in logs)
  redact: {
    paths: ['password', 'token', 'authorization',
      'req.headers.authorization', 'req.headers.cookie',
      '*.password', '*.token', '*.secret', '*.apiKey'],
    censor: '[REDACTED]',
  },

  // Pretty-print in development only
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
})

export function createLogger(context: string) {
  return logger.child({ context })
}
```

**Sentry Integration**:
```typescript
Sentry.init({
  dsn: config.sentry.dsn,
  enableLogs: true,
  integrations: [
    Sentry.pinoIntegration({
      log: { levels: ['info', 'warn', 'error', 'fatal'] },
      error: { levels: ['error', 'fatal'] },
    }),
  ],
})
```

**Next.js Configuration** (required — pino uses Node.js native bindings):
```typescript
// next.config.ts
const nextConfig = {
  serverExternalPackages: ['pino', 'pino-pretty'],
}
```

**Install command**:
```bash
npm i pino
npm i -D pino-pretty  # dev-only, never in production bundle
```

**Security**: No known CVEs (verified via Snyk). Pure Node.js, no native binaries.

### Error Handling (Hybrid Pattern)

The three-layer architecture (Phaser → Zustand → Supabase) requires error handling that works both inside and outside React. A hybrid pattern serves each layer cleanly:

```
Layer             Error Pattern            Library
-----             -------------            -------
Phaser scenes     Result<T, E>             neverthrow (no React dependency)
Zustand stores    Result<T, E> consumed    neverthrow (bridge layer)
DAL functions     Result<T, E>             neverthrow (server-only)
Server Actions    Typed action results     next-safe-action (Zod validation)
React components  Error boundaries         Next.js error.tsx (uncaught)
React forms       useActionState           React 19 built-in (expected)
```

**Why hybrid**: Each layer uses the error pattern native to its context. neverthrow works without any React dependency (critical for Phaser), while next-safe-action is purpose-built for Server Actions. Error boundaries catch only what slips through.

#### neverthrow v8.x (DAL + Game Engine)

**Status**: Active | **Downloads**: ~1.3M/week | **Stars**: 7.3k | **License**: MIT

**Key API**:
- `ok(value)` / `err(error)` — constructors
- `Result<T, E>` — discriminated union type
- `ResultAsync<T, E>` — wraps `Promise<Result<T, E>>`
- `.map()`, `.mapErr()`, `.andThen()` — chainable transformations
- `.match()` — exhaustive pattern matching
- `Result.fromThrowable()` — wraps exception-throwing functions

**Why it fits**: Zero React dependency means it works in `packages/game-engine`. Zero runtime dependencies (pure TypeScript). ESLint plugin (`eslint-plugin-neverthrow`) enforces result consumption — unchecked `Result` values become a compile-time error.

#### next-safe-action v8.x (Server Actions)

**Status**: Active (published March 2026) | **Stars**: 3k+ | **License**: MIT

**Why it fits**:
- Constitution XI: Zod validation built-in (shared schemas from `packages/shared`)
- Constitution XIII: Purpose-built for Server Actions
- Constitution XVI: Server-side validation enforced by design
- Returns typed results without manual try/catch

#### Shared Error Types (packages/shared)

```typescript
// packages/shared/src/types/errors.ts
export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL: 'INTERNAL',
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  INVALID_GAME_STATE: 'INVALID_GAME_STATE',
  INVALID_ACTION: 'INVALID_ACTION',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

export interface AppError {
  code: ErrorCode
  message: string
  context?: Record<string, unknown>  // Never PII
}
```

#### Error Flow

```
Phaser Scene
  -> resolveCombat() returns Result<T, AppError>
  -> .match(ok => updateVisuals, err => zustandStore.setError(err))
  -> Zustand store holds error state
  -> React UI reads error from store, displays to user

DAL Function
  -> getUserById() returns ResultAsync<T, AppError>
  -> Server Action (next-safe-action) maps result
  -> useActionState in React form displays validation/server errors
  -> Unexpected throws caught by error.tsx boundary

React Component
  -> Uncaught exception during render
  -> Caught by nearest error.tsx boundary
  -> Sentry.captureException() for monitoring
```

**Install command**:
```bash
npm i neverthrow next-safe-action
```

**ESLint Integration** (enforce Result consumption):
```javascript
import neverthrowPlugin from 'eslint-plugin-neverthrow'

{
  plugins: { neverthrow: neverthrowPlugin },
  rules: { 'neverthrow/must-use-result': 'error' },
}
```

---

## Supabase Development Scripts

Standard scripts for the Turborepo monorepo. Adapted from a reference project using the same Supabase CLI version.

### Scripts

```json
{
  "scripts": {
    "db:push": "supabase db push",
    "db:push:dry": "supabase db push --dry-run",
    "db:types": "supabase gen types --linked --lang=typescript > packages/shared/src/types/supabase.ts"
  }
}
```

**db:push**: Applies all pending migrations in `supabase/migrations/` to the linked remote Supabase project. Uses `supabase db push` which tracks which migrations have already been applied.

**db:push:dry**: Previews what migrations would be applied without executing. Useful for CI validation before deployment.

**db:types**: Generates TypeScript types from the linked remote project's schema (`--linked` flag). Outputs to `packages/shared/src/types/supabase.ts` so generated types are available to all packages (`apps/web`, `packages/game-engine`, `packages/shared` itself).

**Critical monorepo adaptation**: The reference project generates types to `src/types/supabase.ts` (app-local). In this monorepo, the correct destination is `packages/shared/src/types/supabase.ts` — the shared package is the single source of truth for all database types (Constitution Principle III: Centralized Type Definitions).

**Supabase CLI version**: `^2.78.1` (install as root devDependency for monorepo access).

### CI/CD Integration

Supabase migrations run as a dedicated step before app deployment in GitHub Actions:

```yaml
- name: Apply database migrations
  run: npx supabase db push
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
    SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}

- name: Build and push Docker image
  # ... (after migrations succeed)
```

This ensures the database schema is always up to date before the new application code is deployed — preventing schema mismatch errors on startup.

---

## Architecture & Project Structure

### Recommended: Turborepo Monorepo

```
serial-killer-game/
  apps/
    web/                              # Next.js application
      src/
        app/                          # App Router pages (routing only, minimal logic)
          (auth)/                      # Auth routes
          (game)/                      # Game routes
            lobby/
            room/[id]/
          (admin)/
          layout.tsx
        proxy.ts                      # Next.js 16 proxy (renamed from middleware.ts)

        components/
          vendor/                     # IMMUTABLE vendor components (never modify directly)
            shadcn/                   #   shadcn/ui primitives (installed via CLI)
              button.tsx
              card.tsx
              dialog.tsx
              ...
            magic-ui/                 #   Magic UI primitives (installed via CLI)
              hero-video-dialog.tsx
              animated-gradient-text.tsx
              ...
          app/                        # APPLICATION components (compose vendor primitives)
            common/                   #   Shared app components (branded Button, AppCard, etc.)
              AppButton.tsx           #     Wraps vendor/shadcn/button with brand defaults
              AppCard.tsx
              AppDialog.tsx
              ...
            marketing/                #   Marketing page components
              HeroSection.tsx         #     Composes vendor/magic-ui primitives + branding
              PricingTable.tsx
              FeatureGrid.tsx
            game/                     #   Game-specific React components
              PhaserGame.tsx          #     Bridge component
              GameHUD.tsx
              VotingOverlay.tsx
              ChatPanel.tsx
            layout/                   #   Layout components (header, footer, sidebar, nav)
              AppHeader.tsx
              AppSidebar.tsx
              AppFooter.tsx

        hooks/                        # Centralized custom hooks
          useGameRoom.ts
          usePresence.ts
          useGameState.ts

        stores/                       # Centralized Zustand stores
          gameStore.ts
          uiStore.ts

        lib/                          # Centralized service clients & utilities
          supabase/
            client.ts                 #   Browser client (anon key)
            server.ts                 #   Server client (service_role key)

        config/                       # Centralized application configuration
          site.ts                     #   Site metadata, URLs, feature flags
          navigation.ts               #   Route definitions, nav structure
          game.ts                     #   Client-side game settings

      public/
        assets/                       # Small static assets (icons, favicon)
        branding/                     # Centralized brand assets (logo, og-image)

  packages/
    game-engine/                      # Phaser game code (standalone package)
      src/
        scenes/
          LobbyScene.ts
          GameScene.ts
          VotingScene.ts
          RevealScene.ts
        entities/
          Player.ts
          GameRoom.ts
        systems/
          TurnSystem.ts
          VotingSystem.ts
        EventBus.ts
        config.ts

    shared/                           # CENTRALIZED shared types, constants, & utilities
      src/
        types/                        #   Single source of truth for all TypeScript types
          game.ts                     #     GameState, Player, Action, Phase, Role
          events.ts                   #     Event payload types (Phaser + Supabase)
          api.ts                      #     API request/response types
          database.ts                 #     Generated Supabase DB types (output target)
        constants/                    #   Single source of truth for all constants
          gameRules.ts                #     Roles, phases, timers, player limits
          routes.ts                   #     Route path constants
          events.ts                   #     Event name constants
        utils/                        #   Shared pure utility functions
          validation.ts

    ui-theme/                         # CENTRALIZED design tokens & brand configuration
      src/
        tokens/
          colors.ts                   #   Brand colors, semantic color mappings
          typography.ts               #   Font families, sizes, weights
          spacing.ts                  #   Spacing scale, breakpoints
        brand/
          config.ts                   #   Brand name, tagline, descriptions
          assets.ts                   #   Paths to logos, icons, og-images

  supabase/
    migrations/                       # SQL migrations
    functions/                        # Edge Functions
      validate-action/
      resolve-phase/
      matchmaking/
    seed.sql

  .github/
    workflows/
      deploy.yml                      # GitHub Actions -> ghcr.io -> Azure App Service

  Dockerfile                          # Multi-stage build for Next.js standalone
  turbo.json
  package.json
```

### Centralization Principles

The project enforces a **single source of truth** for every cross-cutting concern. Nothing is duplicated, scattered, or defined inline when it belongs in a centralized location. This is critical for a small team -- changes propagate from one place, not twenty.

#### Principle 1: Immutable Vendor Components

```
vendor/shadcn/button.tsx    <-- IMMUTABLE (installed by CLI, never hand-edited)
        │
        ▼
app/common/AppButton.tsx    <-- APPLICATION layer (adds brand colors, default sizes, project props)
        │
        ▼
app/game/VotingOverlay.tsx  <-- FEATURE layer (uses AppButton, never imports vendor/ directly)
```

- **Vendor directory** (`components/vendor/`): Contains shadcn/ui and Magic UI components exactly as installed by their CLIs. These files are **never modified directly**. They can be regenerated, updated, or diffed against upstream without risk of losing customizations.
- **Application directory** (`components/app/`): Contains project-specific components that **compose** vendor primitives. All branding, default prop overrides, custom variants, and project-specific behavior live here.
- **Feature code** (pages, game components, etc.): Imports from `components/app/`, **never** from `components/vendor/` directly. This ensures every UI element flows through the application's customization layer.

**Why**: When shadcn releases an update or a component needs regeneration, the vendor directory can be refreshed cleanly. All customizations are isolated in the application layer and never at risk.

#### Principle 2: Centralized Types

All TypeScript types live in `packages/shared/src/types/`. No type is defined locally in a feature file if it's used (or could be used) by more than one module.

| Type Category | Location | Consumed By |
|--------------|----------|-------------|
| Game types (GameState, Player, Role, Phase) | `packages/shared/src/types/game.ts` | Next.js app, Phaser game engine, Edge Functions |
| Event payloads (Broadcast, Presence) | `packages/shared/src/types/events.ts` | Next.js app, Phaser game engine |
| API types (request/response shapes) | `packages/shared/src/types/api.ts` | Next.js app, Edge Functions |
| Database types (generated from Supabase) | `packages/shared/src/types/database.ts` | Next.js app, Edge Functions |

**Why**: A single `Player` type definition used by the React UI, Phaser game engine, and Supabase Edge Functions eliminates drift. When a field changes, it changes once and TypeScript catches every consumer.

#### Principle 3: Centralized Constants

All magic values, game rules, route paths, and event names live in `packages/shared/src/constants/`. No string literal or magic number is scattered across feature code.

| Constant Category | Location | Example |
|------------------|----------|---------|
| Game rules | `constants/gameRules.ts` | `MIN_PLAYERS = 5`, `MAX_PLAYERS = 15`, `VOTING_DURATION_MS = 30000` |
| Route paths | `constants/routes.ts` | `ROUTES.LOBBY = '/game/lobby'`, `ROUTES.ROOM = '/game/room'` |
| Event names | `constants/events.ts` | `EVENTS.PLAYER_VOTED = 'player:voted'`, `EVENTS.PHASE_CHANGED = 'phase:changed'` |

**Why**: Changing a timer duration, adding a route, or renaming an event happens in one file. Grep never returns scattered duplicates.

#### Principle 4: Centralized Configuration

Application configuration is not spread across components. It lives in dedicated config files.

| Config Category | Location | Contains |
|----------------|----------|----------|
| Site metadata | `apps/web/src/config/site.ts` | Site name, description, URLs, OG metadata, feature flags |
| Navigation | `apps/web/src/config/navigation.ts` | Nav items, route mappings, menu structure |
| Game settings | `apps/web/src/config/game.ts` | Client-side defaults (not game rules -- those are in `shared/constants`) |

**Why**: Adding a nav item, changing the site name, or toggling a feature flag is a config change, not a code change.

#### Principle 5: Centralized Branding & Design Tokens

Brand identity is defined once and consumed everywhere -- never hardcoded in components.

| Brand Concern | Location | Contains |
|--------------|----------|----------|
| Design tokens | `packages/ui-theme/src/tokens/` | Colors, typography, spacing (feeds into Tailwind `@theme`) |
| Brand config | `packages/ui-theme/src/brand/` | Brand name, tagline, logo paths, descriptions |
| Brand assets | `apps/web/public/branding/` | Logo files, OG images, favicons |

**Why**: Rebranding, adding a dark mode palette, or adjusting typography scales happens in one package. Every component that uses `brand.primaryColor` or `brand.name` updates automatically.

#### Principle 6: Centralized Asset Management

Game assets (sprites, audio, maps) and static assets (icons, fonts) each have a single canonical location.

| Asset Type | Location | Served Via |
|-----------|----------|-----------|
| Small static assets (favicon, icons) | `apps/web/public/assets/` | App Service directly |
| Brand assets (logo, OG images) | `apps/web/public/branding/` | App Service directly |
| Large game assets (sprites, audio, tile maps) | Azure Blob Storage | Blob Storage URL (CDN at scale) |
| User-generated content (avatars) | Supabase Storage | Supabase Storage URL (RLS-protected) |

**Why**: No asset is "somewhere in the repo." Each type has one home and one delivery mechanism.

#### Principle 7: Direct Imports Only (No Barrel Files)

**Every import points to the actual file that contains the code. No `index.ts` barrel files that re-export from other modules.**

```typescript
// CORRECT -- direct import to the actual file
import { AppButton } from '@/components/app/common/AppButton';
import { GameState } from '@repo/shared/types/game';
import { MIN_PLAYERS } from '@repo/shared/constants/gameRules';

// WRONG -- barrel import that hides the real location
import { AppButton } from '@/components/app/common';       // index.ts re-export
import { GameState, MIN_PLAYERS } from '@repo/shared';     // barrel file
```

**Why**:
- **Findability**: Every import path tells you exactly which file contains the code. No guessing, no tracing through re-exports.
- **No circular dependencies**: Barrel files are the #1 cause of circular dependency chains in TypeScript monorepos. Direct imports eliminate the risk entirely.
- **Tree-shaking**: Bundlers can dead-code-eliminate more effectively with direct imports. Barrel files can force bundlers to evaluate entire module graphs via side effects.
- **Grep-friendly**: Searching for `from '.*AppButton'` always leads to the real file, not an intermediary.

**The only exception**: A package's root `package.json` `exports` field may define entry points for cross-package imports (e.g., `@repo/shared/types/game` maps to `packages/shared/src/types/game.ts`). These are package boundary entry points managed by the build system, not hand-written barrel files.

#### Summary: The Centralization Rule

> **If a value, type, component, config, or asset is used by more than one module -- or _could be_ -- it belongs in a centralized location, not inline where it's first needed.**

This principle is non-negotiable. It is what allows a small team to maintain a growing codebase without drowning in inconsistency, duplication, and drift.

### Zero-Trust Security Architecture

The browser is treated as **hostile**. Every request from the frontend is untrusted. The Supabase `anon` key is public by design (it ships to every browser), so we assume an attacker has it and can make arbitrary API calls.

#### Security Model

```
┌──────────────────────────────────────────────────────────────┐
│  BROWSER (UNTRUSTED)                                         │
│                                                              │
│  - Has the Supabase anon key (public, assume compromised)    │
│  - Can see all client-side JavaScript                        │
│  - Can forge any request                                     │
│  - Can tamper with any client-side state                     │
│                                                              │
│  Rule: The browser may DISPLAY data and COLLECT user input.  │
│        It must NEVER be the authority on game state,         │
│        permissions, or business logic.                       │
└────────────────────────┬─────────────────────────────────────┘
                         │ All mutations go through
                         │ server-side validation
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  SERVER (TRUSTED)                                            │
│                                                              │
│  Next.js Server Actions / Route Handlers / proxy.ts          │
│    - Authenticate every request (Supabase server client)     │
│    - Validate all inputs (schema + business rules)           │
│    - Use service_role key (never exposed to browser)         │
│    - Execute mutations via server-side Supabase client       │
│                                                              │
│  Supabase Edge Functions                                     │
│    - Authoritative game logic (phase resolution, votes)      │
│    - Anti-cheat validation                                   │
│    - Role assignment, matchmaking                            │
│                                                              │
│  Supabase RLS (Defense-in-Depth)                             │
│    - Enforced on ALL tables regardless of access pattern     │
│    - Default-deny: tables with no policy = no access         │
│    - Backup safety net, NOT the primary security gate        │
└──────────────────────────────────────────────────────────────┘
```

#### Zero-Trust Principles

**1. Server-side by default**: All Supabase mutations (inserts, updates, deletes) go through Next.js Server Actions, Route Handlers, or Supabase Edge Functions -- **never directly from the browser client**. The server uses the `service_role` key (which bypasses RLS) only after validating the request.

**2. Anon key minimized**: The Supabase `anon` key exposed to the browser should have the **minimum possible permissions**. Ideally, the browser uses the anon key only for:
- Authentication (login, signup, session refresh)
- Supabase Realtime subscriptions (Broadcast, Presence, Database Changes)
- Read-only queries that RLS already restricts appropriately

**3. RLS as defense-in-depth, not primary gate**: Every table has RLS enabled with a **default-deny** posture. Even if a Server Action is the intended access path, RLS policies exist as a backup in case the frontend is attacked or a server-side bug exposes a code path that bypasses validation.

```sql
-- Default-deny: enable RLS on every table, even if accessed only server-side
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- With no policies, anon/authenticated users have ZERO access.
-- Policies are then added explicitly for each allowed operation.
-- This means an attacker with the anon key cannot read or write
-- anything that isn't explicitly permitted by a policy.
```

**4. Input validation at every boundary**: Every server-side handler validates inputs with a schema (e.g., Zod). Never trust that a game_id, player_id, or action type from the browser is valid, in-range, or belongs to the requesting user.

**5. No sensitive data in client bundles**: The `service_role` key, database connection strings, and any server-side secrets are **never** in `NEXT_PUBLIC_*` environment variables. They exist only in Azure App Service Application Settings (runtime) and are accessed only in server-side code.

**6. Realtime is read-only trust**: Supabase Realtime (Broadcast, Presence, Database Changes) delivers data to clients but does not validate it. Game state received via Realtime is for **display only**. If a player needs to take an action based on received state, that action goes through a Server Action for validation.

#### Data Flow Example: Player Casts a Vote

```
1. Browser: User clicks "Vote for Player X"
2. Browser: Calls Next.js Server Action `castVote(gameId, targetPlayerId)`
3. Server Action:
   a. Authenticates request (Supabase server client, verifies JWT)
   b. Validates inputs (Zod schema: gameId is UUID, targetPlayerId is UUID)
   c. Business logic checks:
      - Is the game in voting phase?
      - Is the requesting player alive and in this game?
      - Has the player already voted this round?
      - Is the target player alive and in this game?
   d. If all checks pass: INSERT into game_actions using service_role client
   e. If checks fail: Return error (no database write occurs)
4. Database: RLS policy on game_actions provides backup validation
   (even if someone bypasses the Server Action, RLS blocks unauthorized writes)
5. Realtime: Database Change event broadcasts the vote to all players in the room
6. Browser: Receives Realtime event, updates display (read-only trust)
```

#### What the Browser CAN Do Directly

| Action | Method | Why Allowed |
|--------|--------|-------------|
| Login / signup | Supabase Auth (anon key) | Auth is designed for browser use |
| Refresh session | Supabase Auth (anon key) | Required for session continuity |
| Subscribe to Realtime channels | Supabase Realtime (anon key) | Read-only data delivery |
| Read own profile | Supabase query (anon key + RLS) | RLS restricts to `auth.uid() = user_id` |

#### What the Browser CANNOT Do Directly

| Action | Enforced By | Must Go Through |
|--------|------------|-----------------|
| Cast a vote | Server Action + RLS | `castVote()` Server Action |
| Join a game | Server Action + RLS | `joinGame()` Server Action |
| Create a game room | Server Action + RLS | `createGame()` Server Action |
| Update profile | Server Action + RLS | `updateProfile()` Server Action |
| View other players' roles | RLS (no policy allows it) | Not possible, period |
| Resolve a game phase | Edge Function only | `resolve-phase` Edge Function |
| Assign roles | Edge Function only | `matchmaking` Edge Function |

#### Supabase Client Configuration

```typescript
// lib/supabase/client.ts -- BROWSER client (minimal permissions)
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // Public key, minimal permissions
);

// lib/supabase/server.ts -- SERVER client (full permissions, never exposed to browser)
import { createServerClient } from '@supabase/ssr';

export const supabaseAdmin = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // NEVER in NEXT_PUBLIC_, NEVER in browser
  { /* cookie config for server-side auth */ }
);
```

### Separation of Concerns

```
Next.js (apps/web)
  |- User management, auth, settings, admin
  |- Game lobby, room setup, matchmaking UI
  |- React UI overlays on game (HUD, voting, chat)
  |- Supabase client & subscriptions
  |- Application components (compose vendor primitives)
  |
  |- Imports PhaserGame bridge component
  |       |
  v       v
Phaser (packages/game-engine)
  |- Game scenes, game loop, rendering
  |- Visual gameplay (characters, animations)
  |- Input handling within game canvas
  |- EventBus communication with React
  |- Imports types + constants from packages/shared

Shared (packages/shared)
  |- Types (single source of truth for all TS types)
  |- Constants (game rules, routes, event names)
  |- Utilities (pure functions)

UI Theme (packages/ui-theme)
  |- Design tokens (colors, typography, spacing)
  |- Brand configuration (name, tagline, asset paths)

Supabase (server-side)
  |- Database (game state persistence)
  |- Edge Functions (authoritative game logic)
  |- Realtime (multiplayer sync)
  |- Auth (player identity)
  |- RLS (security policies)
```

### Why Turborepo Monorepo
- **Shared types**: Game engine and Next.js app share the same TypeScript types from `packages/shared`
- **Centralized design tokens**: Brand and theme defined once in `packages/ui-theme`, consumed by the app
- **Cached builds**: Phaser game code changes don't rebuild the Next.js app
- **Independent testing**: Test game logic without Next.js overhead
- **Clear boundaries**: Enforced separation between vendor, application, and feature code
- **Single repo**: Easier for a small team to manage

### Supabase Edge Functions for Game Logic

| Metric | Value |
|--------|-------|
| Cold Start (median) | 400ms |
| Hot Latency (median) | 125ms |
| Max CPU Time | 2s per request |
| Free Invocations | 500K/month |

**Good for (authoritative server-side game logic -- zero-trust)**: Validating votes (anti-cheat), resolving game phases, matchmaking, random role assignment. These operations must NEVER run on the client. See [Zero-Trust Security Architecture](#zero-trust-security-architecture).
**Not good for**: Real-time game loop, high-frequency state updates.

### Database Schema Pattern

```sql
-- Core tables for a social deduction game

games (id, status, created_by, current_phase, round_number, settings, created_at)
players (id, game_id, user_id, role, is_alive, joined_at)
game_actions (id, game_id, player_id, action_type, target_player_id, payload, round_number, phase, created_at)
game_events (id, game_id, event_type, payload, round_number, created_at)
profiles (id, display_name, avatar_url, games_played, games_won, created_at)
match_history (id, game_id, user_id, role_played, result, created_at)
leaderboards (user_id, total_wins, total_games, win_rate, current_streak, best_streak, last_updated)
```

### Row Level Security (Defense-in-Depth)

RLS is enforced on **every table** with a **default-deny** posture. Even though most mutations go through server-side code (Server Actions, Edge Functions) using the `service_role` key, RLS exists as a backup safety net. If a bug or attack bypasses the server layer, RLS blocks unauthorized access at the database level. See [Zero-Trust Security Architecture](#zero-trust-security-architecture) for the full security model.

```sql
-- STEP 1: Enable RLS on ALL tables (default-deny, no access without a policy)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- STEP 2: Add explicit policies only for operations that need direct browser access.
-- Most writes go through Server Actions (service_role bypasses RLS),
-- so these policies primarily protect against direct anon-key abuse.

-- Players can only see their own hidden role
CREATE POLICY "Players see own role only"
ON players FOR SELECT
USING (auth.uid() = user_id);

-- Players can only act in games they belong to (backup for Server Action validation)
CREATE POLICY "Players act in own games"
ON game_actions FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM players WHERE game_id = NEW.game_id
  )
);

-- Game results are public after game ends
CREATE POLICY "Results visible after game ends"
ON match_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM games
    WHERE id = match_history.game_id AND status = 'completed'
  )
);
```

---

## Deployment Strategy

> **Decision: Azure App Service B1 + GitHub Actions + GitHub Container Registry (ghcr.io)**. No Vercel. No SWA. Full GA Next.js support from day one via containerized deployment.

### Hosting: Azure App Service B1 Linux (~$13/mo)

Azure App Service provides **complete, production-grade** Next.js support as a GA (Generally Available) service -- no preview caveats, no feature limitations.

| Tier | vCPU | RAM | Storage | Monthly Cost | Best For |
|------|------|-----|---------|-------------|----------|
| F1 (Free) | Shared (60 CPU min/day) | 1 GB | 1 GB | $0 | Dev/experimentation only |
| **B1 (Basic)** | 1 | 1.75 GB | 10 GB | **~$13** | **MVP and production** |
| B2 (Basic) | 2 | 3.5 GB | 10 GB | ~$26 | Medium traffic |
| S1 (Standard) | 1 | 1.75 GB | 50 GB | ~$55 | Autoscaling + staging slots |
| P0v3 (Premium) | 1 | 4 GB | 250 GB | ~$37 | High-performance production |

**Full Next.js feature support**:
- App Router + Pages Router
- React Server Components
- SSR + hybrid rendering (static + dynamic)
- Route Handlers (API routes)
- Middleware
- ISR (Incremental Static Regeneration) -- fully supported
- Image optimization
- WebSockets enabled by default on Linux
- Full control over HTTP headers (COOP/COEP for SharedArrayBuffer if ever needed)
- Custom server configurations
- 10GB storage -- no bundle size concerns for Phaser

**Why App Service B1 over SWA**: Azure SWA's hybrid Next.js support is still in PREVIEW (not GA) with known limitations (no linked APIs, no ISR image caching, no SWA CLI emulation, 500MB storage limit). App Service B1 avoids all of these issues for only ~$4/mo more, with a proven, production-grade platform.

### Container Registry: GitHub Container Registry (ghcr.io)

The deployment pipeline uses GitHub Container Registry (ghcr.io) -- GitHub's built-in container registry -- as the bridge between CI/CD and Azure App Service.

**Why ghcr.io**:
- Built into GitHub -- no separate service to manage or pay for
- Free for public repositories (unlimited storage + bandwidth)
- 500MB free storage for private repos (GitHub Free), 2GB on Pro
- Tight integration with GitHub Actions (authentication via `GITHUB_TOKEN`, no extra secrets)
- Supports Docker OCI images natively
- Packages appear directly in the GitHub repository UI

**Pricing**:

| GitHub Plan | Storage | Bandwidth | Cost |
|-------------|---------|-----------|------|
| Free (public repos) | Unlimited | Unlimited | $0 |
| Free (private repos) | 500 MB | 1 GB/mo | $0 |
| Pro (private repos) | 2 GB | 10 GB/mo | $4/mo |
| Team (private repos) | 2 GB | 10 GB/mo | $4/user/mo |
| Overage (private) | $0.25/GB | $0.50/GB | Pay-as-you-go |

**Note**: GitHub Actions minutes used to build and push images are also free for public repos, and 2,000 minutes/mo free for private repos on GitHub Free.

### Deployment Pipeline: GitHub Actions -> ghcr.io -> Azure App Service

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  Git Push    │────>│  GitHub Actions   │────>│  ghcr.io             │
│  (main)      │     │                  │     │  (Container Registry) │
│              │     │  1. Checkout     │     │                      │
│              │     │  2. Docker build │     │  Image tagged with   │
│              │     │  3. Push to ghcr │     │  commit SHA + latest │
│              │     │  4. Deploy to Az │     │                      │
└──────────────┘     └──────────────────┘     └──────────┬───────────┘
                                                          │
                                                          │ Pull image
                                                          v
                                              ┌──────────────────────┐
                                              │  Azure App Service   │
                                              │  B1 Linux            │
                                              │                      │
                                              │  Runs container from │
                                              │  ghcr.io image       │
                                              │  ~$13/mo             │
                                              └──────────────────────┘
```

**How it works**:
1. Developer pushes to `main` (or merges a PR)
2. GitHub Actions workflow triggers
3. Workflow builds a Docker image using the project's `Dockerfile`
4. Image is pushed to `ghcr.io/<owner>/<repo>:<tag>` (tagged with commit SHA + `latest`)
5. Workflow tells Azure App Service to pull and deploy the new image
6. App Service restarts with the updated container

**Dockerfile** (Next.js standalone output for minimal image size):

```dockerfile
# Multi-stage build for minimal production image
FROM node:24-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
```

**Note**: This Dockerfile is simplified for illustration. The actual Turborepo monorepo will require `turbo prune --scope=web --docker` to generate a pruned workspace before the Docker build. See the [Turborepo Docker guide](https://turborepo.dev/docs/guides/tools/docker) for the full monorepo-aware pattern.

**Key config**: Next.js must use `standalone` output mode in `next.config.ts`:
```typescript
const nextConfig = {
  output: 'standalone',
  reactCompiler: true,
};
```
This produces a minimal self-contained build (~50-150MB) instead of the full `node_modules` tree.

**GitHub Actions workflow** (`.github/workflows/deploy.yml`):

```yaml
name: Build and Deploy to Azure

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
  AZURE_WEBAPP_NAME: serial-killer-game  # Your App Service name

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (tags, labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha
            type=raw,value=latest

      - name: Build and push Docker image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: |
            NEXT_PUBLIC_SUPABASE_URL=${{ vars.NEXT_PUBLIC_SUPABASE_URL }}
            NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
```

**Required GitHub secrets/variables**:
- `AZURE_WEBAPP_PUBLISH_PROFILE` -- Download from Azure Portal > App Service > Deployment Center > Manage publish profile
- `NEXT_PUBLIC_SUPABASE_URL` -- Set as GitHub Actions variable (not secret, since it's public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -- Set as GitHub Actions secret

**Azure App Service configuration**:
- Set the App Service to pull from ghcr.io: Azure Portal > App Service > Deployment Center > Container Registry > GitHub Container Registry
- Runtime environment variables (server-side secrets like `SUPABASE_SERVICE_ROLE_KEY`): Azure Portal > App Service > Configuration > Application Settings
- App Service exposes port 8080 by default on Linux containers -- match this in the Dockerfile

### Environment Variable Management

| Variable Type | Where to Set | Example |
|--------------|-------------|---------|
| **Build-time public** (`NEXT_PUBLIC_*`) | GitHub Actions `build-args` or `env` | `NEXT_PUBLIC_SUPABASE_URL` |
| **Runtime server-side secrets** | Azure App Service Application Settings | `SUPABASE_SERVICE_ROLE_KEY` |
| **Runtime public** | Baked into image at build time | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

**Important**: `NEXT_PUBLIC_*` variables are embedded into the JavaScript bundle at build time. They must be available during the `docker build` step (via `build-args` in the workflow). Server-side-only secrets should be set in Azure App Service Application Settings so they're available at runtime without being baked into the image.

### Asset Storage: Azure Blob Storage

Azure Blob Storage serves game assets (sprites, audio, tile maps) and integrates with Azure Front Door.

| Resource | Cost |
|----------|------|
| Storage (Hot tier) | ~$0.0184/GB/month |
| Egress (first 5 GB/mo) | Free |
| Egress (5 GB - 10 TB) | $0.087/GB |
| Read operations | $0.0054/10K ops |

**For a 5GB asset library**: ~$0.09/mo storage + egress based on traffic.

**Caching strategy for game assets**:
```
Cache-Control: public, max-age=31536000, immutable
```
Use content-hash filenames (e.g., `sprites-a1b2c3.png`) for cache busting. Set via Azure CLI on blob upload or via Azure Portal blob properties.

### CDN Strategy

**MVP (skip dedicated CDN)**: Serve small assets from `public/` via App Service directly, and larger assets from Azure Blob Storage. For low traffic, direct Blob Storage access is sufficient.

**Growth (add Azure Front Door Standard, $35/mo base)**: When performance for global users matters, Azure Front Door provides:
- Global edge caching for both the Next.js app and Blob Storage assets
- Path-based routing: `/assets/*` -> Blob Storage origin, everything else -> App Service origin
- WAF (Web Application Firewall) for DDoS protection
- Bot protection (Premium tier)
- Custom caching rules per path

**Note**: Azure CDN (Classic) is **RETIRING** (September 2027). All new projects should use Azure Front Door instead.

### WebSocket Considerations

Supabase Realtime WebSocket connections go **directly from the browser to Supabase** (`wss://<project>.supabase.co/realtime/v1`). They do NOT route through Azure hosting. This means the hosting platform's WebSocket support is irrelevant for Supabase Realtime -- it works identically on any host. (App Service B1 Linux does have WebSockets enabled by default regardless.)

### Bundle Size Considerations

- Phaser 3: ~1.2MB raw, ~122KB with Phaser Compressor (min+gzip)
- Use `next/dynamic` with `ssr: false` to lazy-load the game component
- Docker image with Next.js `standalone` output: ~50-150MB (much smaller than full `node_modules`)
- Azure App Service B1: 10GB storage, no practical bundle size concern
- Large game assets should be in Azure Blob Storage, not bundled with the Docker image

### Scaling Path

```
Phase 1 (Dev):     App Service F1 Free ($0/mo) + Blob Storage free tier
Phase 2 (MVP):     App Service B1 ($13/mo) + Blob Storage
Phase 3 (Growth):  App Service B2 ($26/mo) + Blob Storage + consider Front Door
Phase 4 (Scale):   App Service S1/P0v3 + Azure Front Door Standard ($35/mo)
```

**Caveats**:
- Supabase free tier pauses after 7 days of inactivity
- App Service F1 (Free) is extremely limited (60 CPU min/day, shared, no custom domains) -- only suitable for initial experimentation
- ghcr.io private repo storage (500MB free) should be monitored; old images should be pruned

---

## Cost Analysis

### Development Phase ($0/month)

| Service | Free Tier | Sufficient for Dev? |
|---------|-----------|-------------------|
| Supabase | 500MB DB, 50K MAU, 200 realtime connections | Yes |
| Azure App Service | F1 Free (60 CPU min/day, 1GB RAM) | Barely -- for initial experimentation only |
| Azure Blob Storage | 5GB free (first 12 months) | Yes |
| GitHub Container Registry | 500MB private / unlimited public | Yes |
| GitHub Actions | 2,000 min/mo free (private) / unlimited (public) | Yes |
| PostHog | 1M events/month | Yes |
| Sentry | 5K errors/month | Yes |
| **Total** | **$0/month** | |

**Note**: Azure offers a $200 credit for the first 30 days on new accounts. The F1 free tier is very limited (shared CPU, no custom domains) -- move to B1 as soon as real development begins.

### Production MVP (~$39/month for 1 developer)

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Supabase | Pro | $25 |
| Azure App Service | B1 Linux | ~$13 |
| Azure Blob Storage | Hot, ~5GB | ~$0.10 |
| GitHub Container Registry | Free (public repo) or Pro ($4) | $0-4 |
| PostHog | Free tier | $0 |
| Sentry | Free tier | $0 |
| Domain | .com | ~$1 |
| **Total (1 dev, public repo)** | | **~$39/month** |
| **Total (1 dev, private repo)** | | **~$43/month** |

### Growth Phase (1000+ DAU)

| Service | Monthly Cost |
|---------|-------------|
| Supabase Pro + usage | $25 + $50-200 |
| Azure App Service B2 | ~$26 |
| Azure Blob Storage + egress (~300GB/mo) | ~$26 |
| Azure Front Door Standard (optional) | $35 + egress |
| GitHub Container Registry | ~$4 |
| PostHog usage | ~$0-50 |
| Sentry Team | $26 |
| **Total (without Front Door)** | **~$107-357/month** |
| **Total (with Front Door)** | **~$142-392/month** |

**Egress cost optimization**: If Azure Blob egress costs become significant at scale, Cloudflare R2 ($0 egress) can be introduced specifically for high-traffic game assets while keeping all other infrastructure on Azure. This hybrid approach saves ~$26/mo at 300GB/mo egress.

### Cost Optimization Tips
1. Use Supabase **Broadcast** over Database Changes for ephemeral game events (no DB writes)
2. Cache game assets aggressively with long `Cache-Control` headers and content-hash filenames
3. Use Next.js `standalone` output mode to keep Docker images small (~50-150MB)
4. Prune old container images from ghcr.io to stay within free storage limits
5. Batch database writes (write game results once per game, not per action)
6. Use Presence wisely (20 msg/s on free tier, 50 on Pro)
7. If egress costs spike, move heaviest assets to Cloudflare R2 ($0 egress) while keeping hosting on Azure

---

## Recommended Stack Summary

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER CLIENT                       │
│                                                         │
│  ┌──────────────┐    EventBus    ┌──────────────────┐  │
│  │   Next.js    │ <============> │   Phaser 3       │  │
│  │   React UI   │                │   Game Canvas    │  │
│  │              │                │                  │  │
│  │  - Auth UI   │                │  - Scenes        │  │
│  │  - Lobby     │                │  - Animations    │  │
│  │  - HUD       │   Zustand     │  - Game Loop     │  │
│  │  - Voting    │ <-----------> │  - Input         │  │
│  │  - Chat      │  (shared      │  - Physics       │  │
│  │  - Settings  │   state)      │  - Audio         │  │
│  └──────┬───────┘                └──────────────────┘  │
│         │                                               │
└─────────┼───────────────────────────────────────────────┘
          │ Supabase Client (Realtime + Auth + DB)
          │
┌─────────┼───────────────────────────────────────────────┐
│         v          SUPABASE CLOUD                       │
│                                                         │
│  ┌──────────────┐  ┌───────────┐  ┌─────────────────┐  │
│  │   Auth       │  │ Realtime  │  │ Edge Functions  │  │
│  │  (50K MAU)   │  │           │  │                 │  │
│  │  - Social    │  │ -Broadcast│  │ - Validate vote │  │
│  │  - Magic     │  │ -Presence │  │ - Resolve phase │  │
│  │    links     │  │ -DB       │  │ - Matchmaking   │  │
│  │  - RLS       │  │  Changes  │  │ - Role assign   │  │
│  └──────────────┘  └───────────┘  └─────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │          PostgreSQL + Row Level Security          │   │
│  │  games | players | actions | events | profiles   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                GITHUB + AZURE                           │
│                                                         │
│  ┌──────────────────────┐  ┌────────────────────────┐  │
│  │  GitHub Actions      │  │  GitHub Container      │  │
│  │  (CI/CD Pipeline)    │  │  Registry (ghcr.io)    │  │
│  │                      │  │                        │  │
│  │  Build Docker image  │──│  Store tagged images   │  │
│  │  Push to ghcr.io     │  │  (SHA + latest)        │  │
│  │  Deploy to Azure     │  │                        │  │
│  └──────────────────────┘  └───────────┬────────────┘  │
│                                         │ Pull image   │
│  ┌──────────────────────┐               │              │
│  │  Azure Blob Storage  │  ┌────────────v───────────┐  │
│  │  (Game Assets)       │  │  Azure App Service     │  │
│  │  Sprites, audio,     │  │  B1 Linux (~$13/mo)    │  │
│  │  maps, tile data     │  │                        │  │
│  │                      │  │  Next.js container     │  │
│  │  (+ Front Door CDN   │  │  Full SSR, WebSockets  │  │
│  │   at scale, $35/mo)  │  │  Custom headers, ISR   │  │
│  └──────────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Important Considerations

1. **Phaser confirmed**: Phaser 3 is the game engine for this project. Its official Next.js template, batteries-included features, and best-in-class AI/Claude support make it the right choice for building this game with an AI-assisted development team.

2. **Phaser 4 Migration**: Start with Phaser 3.90.0 (stable). Phaser 4 (RC6) shares the same API - when it reaches stable release, migration is incremental. v4 brings native TypeScript, WebGPU, and the new Beam renderer.

3. **Azure + GitHub consolidation**: Hosting (App Service) and asset storage (Blob Storage) are on Azure. CI/CD (GitHub Actions) and container registry (ghcr.io) are on GitHub. Two providers, tightly integrated, no Vercel dependency. Azure Front Door adds CDN/WAF at scale.

4. **Containerized deployment**: The Next.js app ships as a Docker container via ghcr.io. This gives full control over the runtime environment, reproducible builds, and easy rollback (just re-deploy a previous image tag).

5. **Supabase Free Tier Gotcha**: Projects pause after 7 days of inactivity. Keep a cron job or monitoring ping to prevent this during development.

6. **Egress cost escape hatch**: If Azure Blob Storage egress costs become significant at scale, Cloudflare R2 ($0 egress) can be introduced for the heaviest game assets while keeping all other infrastructure on Azure.

7. **ghcr.io image cleanup**: Old container images accumulate. Set up a retention policy or periodic pruning GitHub Action to stay within free storage limits on private repos.

---

## Sources

### Game Engines
- [Phaser.io](https://phaser.io/) | [GitHub](https://github.com/phaserjs/phaser) | [Next.js Template](https://github.com/phaserjs/template-nextjs)
- [Phaser v4 RC6 Announcement](https://phaser.io/news/2025/12/phaser-v4-release-candidate-6-is-out)
- [Phaser + Next.js Integration (Dec 2025)](https://phaser.io/news/2025/12/merging-nextjs-app-and-phaser-game)
- [Phaser Compressor](https://phaser.io/news/2024/05/phaser-compressor-released)
- [PixiJS](https://pixijs.com/) | [PixiJS React](https://react.pixijs.io/)
- [React Three Fiber](https://r3f.docs.pmnd.rs/) | [react-three-next](https://github.com/pmndrs/react-three-next)
- [Babylon.js](https://www.babylonjs.com/) | [react-babylonjs](https://github.com/brianzinn/react-babylonjs)
- [PlayCanvas](https://playcanvas.com/) | [@playcanvas/react](https://github.com/playcanvas/react)
- [Excalibur.js](https://excaliburjs.com/) | [Kaplay](https://kaplayjs.com/)
- [Godot Web Export](https://docs.godotengine.org/en/latest/tutorials/export/exporting_for_web.html)
- [JS Game Framework Comparison](https://jslegenddev.substack.com/p/i-tried-3-web-game-frameworks-so)
- [Best JS Game Engines 2025](https://blog.logrocket.com/best-javascript-html5-game-engines-2025/)
- [Web Game Engines 2026](https://app.cinevva.com/guides/web-game-engines-comparison.html)

### Supabase & Real-Time
- [Supabase Realtime Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks)
- [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits) | [Pricing](https://supabase.com/docs/guides/realtime/pricing)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Pricing](https://supabase.com/pricing)
- [Clerk vs Supabase Auth](https://clerk.com/articles/clerk-vs-supabase-auth)

### Architecture & State Management
- [Emojitsu - Multiplayer Game with Supabase + Next.js](https://dev.to/iakabu/i-built-a-real-time-multiplayer-browser-game-with-supabase-nextjs-no-backend-server-required-h28)
- [Supabase Realtime Game Tutorial](https://www.aleksandra.codes/supabase-game)
- [State Management in 2025](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)
- [Turborepo Next.js Guide](https://turborepo.dev/docs/guides/frameworks/nextjs)
- [Phaser React Bridge Pattern](https://arokis.me/articles/react-phaser)

### Azure Hosting & Infrastructure
- [App Service Linux Pricing](https://azure.microsoft.com/en-us/pricing/details/app-service/linux/)
- [App Service Node.js Quickstart](https://learn.microsoft.com/en-us/azure/app-service/quickstart-nodejs)
- [Next.js 15 on Azure App Service](https://blog.kudoai.com/hosting-next-js-15-on-azure-app-service-the-complete-guide-with-ci-cd-ed5a0a173c17)
- [App Service GitHub Actions Deploy](https://learn.microsoft.com/en-us/azure/app-service/deploy-github-actions)
- [Azure Blob Storage Pricing](https://azure.microsoft.com/en-us/pricing/details/storage/blobs/)
- [Azure Front Door Pricing](https://azure.microsoft.com/en-us/pricing/details/frontdoor/)
- [Front Door vs CDN Comparison](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-cdn-comparison)
- [Azure Free Services](https://azure.microsoft.com/en-us/pricing/free-services)
- [Cloudflare R2 vs Azure Blob](https://yconsulting.substack.com/p/cloudflare-r2-vs-the-big-3-a-deep)

### Node.js
- [Node.js Releases](https://nodejs.org/en/about/previous-releases)
- [Node.js 24 Becomes LTS](https://nodesource.com/blog/nodejs-24-becomes-lts)
- [Node.js endoflife.date](https://endoflife.date/nodejs)
- [Node.js 24 on Azure App Service](https://techcommunity.microsoft.com/blog/appsonazureblog/node-js-24-is-now-available-on-azure-app-service-for-linux/4468801)
- [Evolving the Node.js Release Schedule](https://nodejs.org/en/blog/announcements/evolving-the-nodejs-release-schedule)

### Frontend Stack
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) | [16.1 Blog Post](https://nextjs.org/blog/next-16-1)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [React 19.2 Announcement](https://react.dev/blog/2025/10/01/react-19-2) | [React Versions](https://react.dev/versions)
- [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4) | [npm](https://www.npmjs.com/package/tailwindcss)
- [shadcn/ui Docs](https://ui.shadcn.com) | [Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4) | [Changelog](https://ui.shadcn.com/docs/changelog)
- [Magic UI](https://magicui.design/) | [GitHub](https://github.com/magicuidesign/magicui) | [Tailwind v4](https://v3.magicui.design/docs/tailwind-v4)
- [Radix UI Primitives](https://www.radix-ui.com/primitives) | [Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [TypeScript 6.0 RC Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-rc/)
- [Best React UI Libraries 2026](https://blog.croct.com/post/best-react-ui-component-libraries)

### GitHub Container Registry & CI/CD
- [GitHub Container Registry Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [GitHub Packages Billing](https://docs.github.com/en/billing/managing-billing-for-github-packages/about-billing-for-github-packages)
- [GitHub Actions: Build & Push Docker](https://docs.github.com/en/actions/use-cases-and-examples/publishing-packages/publishing-docker-images)
- [docker/build-push-action](https://github.com/docker/build-push-action)
- [azure/webapps-deploy Action](https://github.com/Azure/webapps-deploy)
- [Next.js Docker Example](https://github.com/vercel/next.js/tree/canary/examples/with-docker)

### Analytics & Monitoring
- [PostHog Pricing](https://posthog.com/pricing) | [Next.js Integration](https://posthog.com/docs/libraries/next-js)
- [Sentry Pricing](https://sentry.io/pricing/)

### Latency & Networking
- [Low Latency Gaming](https://www.pubnub.com/blog/low-latency-gaming/)
- [WebRTC vs WebSockets for Games](https://developers.rune.ai/blog/webrtc-vs-websockets-for-multiplayer-games)
- [Latency in Online Games](https://www.researchgate.net/publication/220427777_Latency_and_player_actions_in_online_games)
