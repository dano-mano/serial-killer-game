---
name: user_decisions
description: Firm user preferences and explicitly rejected alternatives — do not re-suggest these
type: feedback
---

Do not re-suggest rejected options. Dan made these decisions explicitly and with clear rationale.

**Why:** Dan rejected these with clear reasoning. Re-suggesting wastes time and erodes trust.

**How to apply:** If a task involves hosting, package manager, auth, or UI component choices — reference the chosen options and never propose the rejected ones.

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

## Testing Tooling (PENDING — not yet decided)
Testing tools have NOT been formally evaluated. Vitest + React Testing Library + Playwright are likely candidates but require a @researcher evaluation before adoption. Do NOT install or recommend them without prior research.
