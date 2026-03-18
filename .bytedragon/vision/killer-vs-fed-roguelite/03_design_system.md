---
vision: killer-vs-fed-roguelite
sequence: 03
name: design-system
group: Foundation
group_order: 1
status: pending
depends_on:
  - "01_project_scaffold: Turborepo structure, packages/ui-theme/ scaffold, apps/web/src/components/ directory structure, Tailwind CSS 4.2.1 dependency already installed"
produces:
  - "Tailwind v4 theme in apps/web/src/app/globals.css using @theme inline block"
  - "Design tokens in packages/ui-theme/src/tokens/ (colors, typography, spacing)"
  - "Brand config in packages/ui-theme/src/brand/config.ts"
  - "shadcn/ui vendor components in apps/web/src/components/vendor/shadcn/"
  - "Magic UI vendor components in apps/web/src/components/vendor/magic-ui/"
  - "App wrapper components in apps/web/src/components/app/common/ (AppButton, AppCard, AppDialog, AppInput, AppToast)"
  - "Layout components in apps/web/src/components/app/common/layout/ (PageLayout, GameLayout, AuthLayout)"
  - "Dark/light theme provider apps/web/src/components/app/common/theme-provider.tsx"
  - "Font configuration apps/web/src/app/fonts.ts"
  - "shadcn CLI config apps/web/components.json"
created: 2026-03-17
last_aligned: never
---

# Vision Piece 03: Design System

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: project scaffold (foundation infrastructure)

---

## Feature Specification

> **Usage**: Copy everything below this line through the next `---` separator, then
> paste after typing `/speckit.specify `

Set up the complete visual design foundation for the game's non-game UI: Tailwind CSS v4 theme configuration with a dark-first color palette suited to the serial killer thriller genre, shadcn/ui and Magic UI component installation, app-layer wrappers around vendor components, centralized design tokens in the ui-theme package, and layout scaffolding for auth pages, marketing pages, and full-screen game view.

This piece provides all UI primitives that auth pages, HUD components, menus, and marketing sections will import. It does not implement game mechanics — it creates the visual language.

### Visual Identity

The game's aesthetic is dark, tense, and noir-influenced. Think dimly lit crime scenes, neon-tinted surveillance footage, police procedural UI elements contrasted with predator-POV darkness. The palette should evoke:

- **Killer perspective**: deep blacks, crimson accents, shadowed environments
- **Fed perspective**: muted blues, manila case file yellows, institutional greens
- **Shared UI**: near-black backgrounds, off-white text, high-contrast interactive elements

Dark mode is the **default and primary mode**. Light mode is a secondary accessibility option. All components MUST look correct in dark mode first.

### Tailwind v4 Theme Configuration

**Critical**: Tailwind CSS v4 uses CSS-first configuration. There is NO `tailwind.config.ts` file. All theme values are defined via `@theme inline { }` in `apps/web/src/app/globals.css`. The `@theme inline` variant enables runtime CSS custom property access (required for dynamic theming).

**`apps/web/src/app/globals.css`**:

```css
@import "tailwindcss";

@theme inline {
  /* Color palette — dark-first thriller aesthetic */
  --color-background: #0a0a0f;
  --color-surface: #12121a;
  --color-surface-elevated: #1a1a25;
  --color-border: #2a2a3a;
  --color-border-subtle: #1e1e2d;

  /* Text */
  --color-text-primary: #e8e8f0;
  --color-text-secondary: #9090a8;
  --color-text-muted: #60607a;
  --color-text-inverse: #0a0a0f;

  /* Brand / accent — crimson red for danger, action, killer theme */
  --color-accent: #c41e3a;
  --color-accent-hover: #e02040;
  --color-accent-subtle: #3a0a14;
  --color-accent-foreground: #ffffff;

  /* Fed / investigation — muted blue */
  --color-fed: #1e5ba8;
  --color-fed-hover: #2470cc;
  --color-fed-subtle: #0a1e3a;
  --color-fed-foreground: #ffffff;

  /* Status colors */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #3b82f6;

  /* Typography */
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-bebas-neue), var(--font-sans);
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;

  /* Spacing scale — extends Tailwind defaults */
  --spacing-game-hud: 1rem;
  --spacing-panel: 1.5rem;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;

  /* Shadows */
  --shadow-panel: 0 4px 24px 0 rgba(0, 0, 0, 0.6);
  --shadow-overlay: 0 8px 48px 0 rgba(0, 0, 0, 0.8);
}

/* Dark mode (default) — CSS class-based switching via ThemeProvider */
:root {
  color-scheme: dark;
}

/* Light mode override (accessibility) */
.light {
  --color-background: #f5f5f7;
  --color-surface: #ffffff;
  --color-surface-elevated: #f0f0f5;
  --color-border: #d0d0e0;
  --color-border-subtle: #e0e0ee;
  --color-text-primary: #0a0a0f;
  --color-text-secondary: #40404f;
  --color-text-muted: #70708a;
  --color-text-inverse: #e8e8f0;
  color-scheme: light;
}
```

### Design Tokens Package

**`packages/ui-theme/src/tokens/colors.ts`**:

```typescript
// JS access to design token values — mirrors CSS custom properties
// Used for programmatic access (Phaser canvas, Chart.js, etc.)
export const colors = {
  background: '#0a0a0f',
  surface: '#12121a',
  surfaceElevated: '#1a1a25',
  border: '#2a2a3a',
  accent: '#c41e3a',
  accentHover: '#e02040',
  fed: '#1e5ba8',
  textPrimary: '#e8e8f0',
  textSecondary: '#9090a8',
  textMuted: '#60607a',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
} as const

export type ColorKey = keyof typeof colors
```

**`packages/ui-theme/src/tokens/typography.ts`**:

```typescript
export const typography = {
  fontSans: 'Inter, ui-sans-serif, system-ui, sans-serif',
  fontDisplay: 'Bebas Neue, Inter, sans-serif',
  fontMono: 'JetBrains Mono, ui-monospace, monospace',
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
} as const
```

**`packages/ui-theme/src/tokens/spacing.ts`**:

```typescript
export const spacing = {
  gameHud: '1rem',
  panel: '1.5rem',
} as const
```

**`packages/ui-theme/src/brand/config.ts`**:

```typescript
export const brand = {
  name: 'Serial Killer vs. Fed',
  shortName: 'SKvF',
  tagline: 'Hunt. Evade. Survive.',
  description: 'An asymmetric roguelite where a serial killer and a federal investigator play cat and mouse across procedurally generated worlds.',
  ogTitle: 'Serial Killer vs. Fed — Asymmetric Roguelite',
  ogDescription: 'Take on the role of a serial killer evading capture or a fed hot on the trail. Every run is different. Only one wins.',
  social: {
    twitter: undefined as string | undefined,
    discord: undefined as string | undefined,
  },
} as const
```

### Font Configuration

**`apps/web/src/app/fonts.ts`**:

```typescript
import { Inter, Bebas_Neue, JetBrains_Mono } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
  display: 'swap',
})

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})
```

Apply in `apps/web/src/app/layout.tsx`:
```typescript
import { inter, bebasNeue, jetbrainsMono } from './fonts'

// In the html element className:
// `${inter.variable} ${bebasNeue.variable} ${jetbrainsMono.variable}`
```

Fonts rationale:
- **Inter**: Clean, readable body text — menus, descriptions, UI labels
- **Bebas Neue**: Bold, uppercase display font — game title, section headers, HUD labels (theatrical)
- **JetBrains Mono**: Monospace for evidence codes, item IDs, investigation data (procedural feel)

### shadcn/ui Components

**Configuration**: `apps/web/components.json` must point to the vendor directory:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "src/components/vendor/shadcn",
    "utils": "src/lib/utils",
    "ui": "src/components/vendor/shadcn",
    "lib": "src/lib",
    "hooks": "src/hooks"
  }
}
```

Install these shadcn/ui components into `apps/web/src/components/vendor/shadcn/`:
- `button` — primary interactive element
- `card` — container for panels, menus, info boxes
- `dialog` — modals for confirmations, item details, game over screens
- `dropdown-menu` — context menus, settings dropdowns
- `input` — text inputs for forms
- `label` — accessible form labels
- `separator` — visual dividers
- `toast` (via Sonner) — notification system
- `tabs` — tab navigation (inventory, objectives, etc.)
- `badge` — item rarity indicators, status tags
- `progress` — health bars, loading progress (used outside the canvas)
- `scroll-area` — scrollable panels for long lists
- `avatar` — player profile display

**IMPORTANT**: The files in `apps/web/src/components/vendor/shadcn/` are IMMUTABLE. Never edit them directly. Customization happens only in the app-layer wrappers.

### Magic UI Components

Install into `apps/web/src/components/vendor/magic-ui/`:
- `animated-beam` — for connection animations on the marketing page (killer↔fed)
- `border-beam` — glowing borders for selected items, active states
- `shimmer-button` — CTA button for marketing/landing page
- `text-reveal` — dramatic text reveal for game title on landing page
- `number-ticker` — animated stat counters on leaderboards
- `meteors` — particle background for landing page

These are used on marketing/landing pages and for select dramatic UI moments in menus. They MUST NOT be used in the game HUD (performance constraint).

### App-Layer Wrapper Components

Feature code MUST import from `components/app/`, never from `components/vendor/` directly.

**`apps/web/src/components/app/common/AppButton.tsx`**:
```typescript
'use client'
import { Button } from '../../vendor/shadcn/button'
import type { ButtonProps } from '../../vendor/shadcn/button'

interface AppButtonProps extends ButtonProps {
  variant?: 'default' | 'accent' | 'fed' | 'ghost' | 'destructive' | 'outline'
}

// Wraps Button with game-themed default variant and className conventions
export function AppButton({ variant = 'default', className, ...props }: AppButtonProps) { ... }
```

**`apps/web/src/components/app/common/AppCard.tsx`**:
```typescript
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../vendor/shadcn/card'
// Wraps Card with game-themed border colors and surface background
```

**`apps/web/src/components/app/common/AppDialog.tsx`**:
```typescript
'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../vendor/shadcn/dialog'
// Wraps Dialog with dark overlay and game-themed content area
```

**`apps/web/src/components/app/common/AppInput.tsx`**:
```typescript
'use client'
import { Input } from '../../vendor/shadcn/input'
// Wraps Input with dark-theme styling, error state display
```

**`apps/web/src/components/app/common/AppToast.tsx`**:
```typescript
// Re-exports configured Sonner Toaster with game theme applied
// Usage: import { toast } from 'sonner' anywhere in app-layer code
```

### Layout Components

**`apps/web/src/components/app/common/layout/PageLayout.tsx`**:
```typescript
// Standard page layout: full height, navigation header, content area, footer
// Used for: landing page, profile page, leaderboards, settings
```

**`apps/web/src/components/app/common/layout/GameLayout.tsx`**:
```typescript
// Full-screen layout for the game canvas — no navigation, no scrolling
// 100dvh × 100dvw, overflow hidden
// Hosts the Phaser canvas (full screen) with React HUD overlay (position: absolute)
// Used for: /game/* routes
```

**`apps/web/src/components/app/common/layout/AuthLayout.tsx`**:
```typescript
// Centered card layout for auth pages
// Dark background, centered panel, game logo above form
// Used for: /login, /signup
```

### Theme Provider

**`apps/web/src/components/app/common/theme-provider.tsx`**:
```typescript
'use client'
// Uses next-themes or manual localStorage approach
// Provides: dark (default) / light toggle
// Adds .dark or .light class to <html> element
// Respects prefers-color-scheme on first visit, then persists user preference
```

Dark mode is default. The `.dark` class activates the dark variables (which are the `@theme inline` defaults). The `.light` class applies the `.light` override block defined in `globals.css`.

### Component Import Convention

```
Feature code
  → apps/web/src/components/app/[domain]/MyComponent.tsx
    → apps/web/src/components/app/common/AppButton.tsx
      → apps/web/src/components/vendor/shadcn/button.tsx  (IMMUTABLE)
```

Never skip a level. Feature code does not import from `vendor/` directly.

### Edge Cases

- **Tailwind v4 purge**: Tailwind v4 scans for class usage automatically. Ensure dynamic class strings (template literals like `` `text-${color}` ``) use full class names, not dynamic fragments.
- **shadcn dark mode**: shadcn/ui uses CSS variables that must match our `@theme inline` variable names. Verify variable names align (e.g., `--background`, `--foreground`, etc.) when configuring `components.json`.
- **Font loading**: `next/font/google` loads fonts at build time. All fonts must be specified in `fonts.ts` and applied to the `<html>` element via className — not via `<style>` tags.
- **Magic UI performance**: Magic UI animated components use CSS animations and occasional JavaScript. Never use them inside the game canvas area or in components that mount/unmount frequently.
- **GameLayout z-index**: The Phaser canvas renders at z-index 0. React HUD overlay renders at z-index 10+. All HUD components must use `position: absolute` and appropriate z-index values.

---

## Planning Guidance

> **Usage**: Copy everything below this line through the next `---` separator, then
> paste after typing `/speckit.plan `

### Architecture Approach

Start with the `globals.css` theme definition as the foundation — everything else depends on the CSS custom properties being available. Then install shadcn/ui CLI, configure `components.json`, install individual components. Then create app-layer wrappers. Magic UI components can be added last.

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| Tailwind CSS | 4.2.1 | CSS-first config, NO tailwind.config.ts |
| shadcn/ui CLI | v4 (`npx shadcn@latest`) | Component installer |
| next-themes | latest | Theme toggle (dark/light) |
| Sonner | latest | Toast notifications (shadcn/ui default) |
| next/font | Built into Next.js 16 | Google Fonts optimization |

### Implementation Order

1. Configure `globals.css` with `@theme inline { }` block and full color palette
2. Configure `fonts.ts` and apply font variables to `apps/web/src/app/layout.tsx`
3. Create `packages/ui-theme/src/tokens/colors.ts`, `typography.ts`, `spacing.ts`
4. Create `packages/ui-theme/src/brand/config.ts`
5. Run `npx shadcn@latest init` → configure `components.json` to point to vendor directory
6. Install individual shadcn/ui components (list above)
7. Install Magic UI components (list above)
8. Create ThemeProvider component
9. Create app-layer wrappers (AppButton, AppCard, AppDialog, AppInput, AppToast)
10. Create layout components (PageLayout, GameLayout, AuthLayout)
11. Apply ThemeProvider and layouts to `apps/web/src/app/layout.tsx`
12. Write tests for wrapper components

### Tailwind v4 Key Differences

These are common mistakes when migrating from v3 to v4:
- No `tailwind.config.ts` — all config in CSS via `@theme inline`
- No `@apply` directives in component files — use class names only
- Custom colors accessed as `bg-[--color-accent]` or as `bg-accent` if registered in `@theme`
- Dark mode via `class` strategy set in CSS, not in config file
- Responsive breakpoints defined in `@theme` if customizing defaults

### Testing Strategy

**Component tests** (`apps/web/tests/components/app/common/`):
- `AppButton.test.tsx` — renders, handles click, applies correct variant styles
- `AppCard.test.tsx` — renders children, applies surface styling
- `AppDialog.test.tsx` — opens/closes correctly
- `AppInput.test.tsx` — renders, forwards value/onChange, shows error state

**Visual regression** (optional for this piece — note for future):
- Playwright screenshot tests for key components in light and dark mode
- Can be added in the polish piece (piece 15)

**Unit tests** (`packages/ui-theme/tests/`):
- Verify color token values are valid hex codes
- Verify brand config has all required fields

### Constitution Compliance Checklist

- [x] I: No barrel files — each component is a direct import
- [x] IV: Design tokens in `packages/ui-theme/` — single source of truth
- [x] V: Vendor components in `vendor/` are IMMUTABLE; app wrappers in `app/common/`
- [x] VI: Domain-based organization — `app/common/` for shared, `app/game/` for game-specific (later)
- [x] XXVI: Tests in `tests/` at package root
- [x] XXVIII: Dark mode default + light mode for accessibility (WCAG AA contrast ratios)
- [x] XXIX: Responsive design — layouts use `dvh`/`dvw` units for mobile compatibility

---

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

When this piece is fully implemented, it should produce:

- `apps/web/src/app/globals.css` — `@theme inline` with complete color palette, typography variables
- `apps/web/src/app/fonts.ts` — Inter, Bebas Neue, JetBrains Mono via `next/font`
- `apps/web/components.json` — shadcn CLI config pointing to vendor directory
- `apps/web/src/components/vendor/shadcn/` — ~13 installed shadcn/ui components (IMMUTABLE)
- `apps/web/src/components/vendor/magic-ui/` — 6 installed Magic UI components (IMMUTABLE)
- `apps/web/src/components/app/common/AppButton.tsx`
- `apps/web/src/components/app/common/AppCard.tsx`
- `apps/web/src/components/app/common/AppDialog.tsx`
- `apps/web/src/components/app/common/AppInput.tsx`
- `apps/web/src/components/app/common/AppToast.tsx`
- `apps/web/src/components/app/common/theme-provider.tsx`
- `apps/web/src/components/app/common/layout/PageLayout.tsx`
- `apps/web/src/components/app/common/layout/GameLayout.tsx`
- `apps/web/src/components/app/common/layout/AuthLayout.tsx`
- `packages/ui-theme/src/tokens/colors.ts`
- `packages/ui-theme/src/tokens/typography.ts`
- `packages/ui-theme/src/tokens/spacing.ts`
- `packages/ui-theme/src/brand/config.ts`

### Dependencies Consumed (from Project Scaffold)

All of the following are produced by piece 01 and must be in place:

- **Turborepo workspace** — `turbo.json`, `package.json` workspaces
- **`packages/ui-theme/` scaffold** — empty package with `package.json`, `tsconfig.json`, `src/tokens/`, `src/brand/` directories
- **`apps/web/src/components/` directory structure** — `vendor/shadcn/`, `vendor/magic-ui/`, `app/common/` directories already exist as scaffolds
- **Tailwind CSS 4.2.1 dependency** — installed in `apps/web/package.json`

### Produces (for Downstream Pieces)

Every subsequent piece that builds UI consumes outputs from this piece:

- **AppButton, AppCard, AppDialog, AppInput, AppToast** — imported by HUD components (piece 07+), auth pages (piece 02), menus
- **GameLayout** — used by `/game/*` route layout (piece 04)
- **AuthLayout** — used by auth pages (piece 02)
- **PageLayout** — used by landing page, profile, leaderboards (piece 13+)
- **Color tokens** — imported by Phaser canvas to match UI palette (piece 04)
- **ThemeProvider** — wraps the entire app; theme state accessible to all components
- **Brand config** — used in page metadata, OG tags, marketing copy

### Success Criteria

- [ ] Dark mode is the default; `<html>` element has correct color-scheme
- [ ] All CSS custom properties from `@theme inline` resolve correctly in both dark and light modes
- [ ] shadcn/ui components render with correct game theme (not default blue/white shadcn theme)
- [ ] AppButton renders all variants (default, accent, fed, ghost, destructive, outline)
- [ ] GameLayout renders full-screen with no scrollbars
- [ ] AuthLayout centers content correctly on mobile and desktop
- [ ] Font variables resolve to correct typefaces (Inter, Bebas Neue, JetBrains Mono)
- [ ] No direct imports from `vendor/` in feature code (ESLint enforced)
- [ ] Vitest component tests pass

### Alignment Notes

This piece runs in parallel with auth-and-profiles (piece 02) and game-engine-bootstrap (piece 04). The auth pages created in piece 02 will benefit from having AuthLayout available, but can use a minimal layout if design system isn't ready yet. Auth and design system are intentionally decoupled.

The color palette defined here is the definitive visual identity. Changes after this point cascade to every UI component. Establish the palette thoughtfully before proceeding to subsequent pieces.

The `GameLayout` is critical for piece 04 (game-engine-bootstrap) — the full-screen layout must exist before the Phaser canvas component can be placed correctly.
