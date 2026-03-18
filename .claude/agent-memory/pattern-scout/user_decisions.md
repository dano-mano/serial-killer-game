---
name: user_decisions
description: Firm user preferences and explicitly rejected alternatives — do not re-suggest these
type: feedback
---

Do not re-suggest rejected options. Dan made these decisions explicitly and with clear rationale.

**Why:** Dan rejected these with clear reasoning. Re-suggesting wastes time and erodes trust.

**How to apply:** If a task involves hosting, package manager, auth, UI components, or testing tools — reference the chosen options and never propose the rejected ones.

## Firm Preferences
| Category | Chosen | Rejected | Notes |
|----------|--------|----------|-------|
| Hosting | Azure App Service B1 | Vercel, Azure SWA | Dan's explicit preference |
| Package manager | npm | pnpm, yarn, bun | Dan's explicit preference; no extra dependency |
| Auth | Supabase Auth | Clerk, NextAuth | Native RLS integration |
| Game engine | Phaser 3 (v3.90.0) | PixiJS, Three.js, Babylon.js, Excalibur, Kaplay, Godot | Best Next.js integration + AI support |
| State management | Zustand | Redux, Jotai, React Context | Only option subscribable outside React (Phaser bridge) |
| UI components | shadcn/ui + Magic UI | Mantine, daisyUI, HeroUI, Ark UI | Copy-paste, Tailwind v4 native, immutable vendor pattern |
| Container registry | ghcr.io | Azure Container Registry | Free, GitHub Actions integrated |
| Logging | Pino 10.x | Winston | Non-blocking, 5-10x faster, native Sentry integration |
| Error handling | neverthrow + next-safe-action | try/catch everywhere | Hybrid: neverthrow for game/DAL, next-safe-action for Server Actions |
| Testing (unit) | Vitest 4.1.0 | Jest | ESM-native, zero-config TS, 2-3x faster, Next.js 16 official recommendation |
| Testing (component) | React Testing Library 16.3.2 | — | React 19.2 compatible |
| Testing (E2E) | Playwright 1.58.2 | Cypress | WebSocket support, multi-user, multi-tab |

**Testing tooling note**: As of constitution v1.1.0 (2026-03-16), testing tooling IS decided and researched. The previous memory entry saying "PENDING" is now obsolete.

## Game Design: Settled
- Asymmetric roguelite "Serial Killer vs. Fed" — 15 vision pieces complete
- ContentRegistry<T> pattern for all game content (pieces 08+)
- Ghost token scarcity intentional — do not add GT sources without balance review
- Piece 09 (evidence system) depends on Piece 08 (combat) — not parallelizable

## Architecture: Settled
- Next.js 16 `middleware.ts` → renamed to `proxy.ts` (Edge runtime dropped)
- Tailwind v4: no tailwind.config.js — CSS-first config via `@theme` in CSS
- ESLint: `next lint` command REMOVED in Next.js 16 — use `eslint .` in scripts
- `package-lock.json` committed; `npm ci` in CI (never `npm install`)
