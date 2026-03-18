---
vision: killer-vs-fed-roguelite
sequence: 03
name: design-system
group: Foundation
group_order: 1
status: pending
depends_on:
  - "01: Turborepo structure, packages/ui-theme/ scaffold, apps/web/src/components/ directory structure, Tailwind CSS 4.2.1 dependency already installed"
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

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Set up the complete visual design foundation for the game's non-game UI: a Tailwind CSS theme with a dark-first color palette suited to the serial killer thriller genre, a UI component library installation, app-layer wrappers around vendor components, centralized design tokens, and layout scaffolding for auth pages, marketing pages, and full-screen game view.

This piece provides all UI primitives that auth pages, HUD components, menus, and marketing sections will import. It does not implement game mechanics — it creates the visual language.

### Visual Identity

The game's aesthetic is dark, tense, and noir-influenced. Think dimly lit crime scenes, neon-tinted surveillance footage, police procedural UI elements contrasted with predator-POV darkness. The palette should evoke:

- **Killer perspective**: deep blacks, crimson accents, shadowed environments — danger and predation
- **Fed perspective**: muted institutional blues — authority and investigation
- **Shared UI**: near-black backgrounds, off-white text, high-contrast interactive elements

Dark mode is the **default and primary mode**. Light mode is a secondary accessibility option. All components must look correct in dark mode first.

### Tailwind CSS Theme

The chosen version of Tailwind CSS uses CSS-first configuration — there is no JavaScript config file. The entire theme is defined via a CSS `@theme` block in the global stylesheet. This enables runtime CSS custom property access, which is required for the game to dynamically read color values for the Phaser canvas and other programmatic uses.

The color palette is organized into semantic groups:
- **Background and surface**: a range of near-black tones from page background through elevated surfaces
- **Borders**: subtle separators matching the dark palette
- **Text**: primary (near-white), secondary (muted), and inverse (for light backgrounds)
- **Killer / accent colors**: crimson red family — danger, action, killer theme
- **Fed / investigation colors**: muted blue family — authority, investigation
- **Status colors**: standard success (green), warning (amber), danger (red), info (blue)

Typography variables define three font families: a clean sans-serif for body text, a bold display font for headers and HUD labels, and a monospace font for codes and procedural data.

A light mode override block redefines the surface and text tokens when the light theme class is applied to the root element.

### Design Tokens Package

The UI theme package provides JavaScript access to design token values for code that cannot use CSS (such as the Phaser canvas). It mirrors the CSS custom properties as typed constants:

- **Colors module**: All color values as a typed object with a `ColorKey` type
- **Typography module**: Font family strings and a complete size scale in rem values
- **Spacing module**: Custom spacing values for HUD and panel contexts
- **Brand config**: Game name, tagline, description, and Open Graph metadata

### Fonts

Three Google Fonts are loaded via the Next.js font optimization system:
- **Inter**: Clean, readable body text — menus, descriptions, UI labels
- **Bebas Neue**: Bold, uppercase display font — game title, section headers, HUD labels (theatrical)
- **JetBrains Mono**: Monospace for evidence codes, item IDs, investigation data (procedural feel)

All three fonts are configured with CSS variable names that match the theme's font variables. The font variables are applied to the `<html>` element via className in the root layout.

### shadcn/ui Components

Install the following shadcn/ui components into the vendor component directory. These files are IMMUTABLE — never edit them directly. Customization happens only in app-layer wrappers.

Components to install:
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

### Magic UI Components

Install the following Magic UI components into the vendor component directory. These are used on marketing and landing pages and for select dramatic UI moments in menus. They must NOT be used in the game HUD — they have CSS animation overhead unsuitable for high-frequency component rendering.

Components to install:
- `animated-beam` — connection animations on the marketing page (killer↔fed)
- `border-beam` — glowing borders for selected items, active states
- `shimmer-button` — CTA button for marketing/landing page
- `text-reveal` — dramatic text reveal for game title on landing page
- `number-ticker` — animated stat counters on leaderboards
- `meteors` — particle background for landing page

### App-Layer Wrapper Components

Feature code must always import from the app component layer, never from the vendor directory directly. This layer:
- Applies game-specific styling defaults over the vendor base
- Adds game-specific prop variants (e.g., an accent variant for the killer theme, a fed variant for the fed theme)
- Provides a stable import contract — vendor component internals can change without updating feature code

Wrapper components to create in the shared app component directory:
- **AppButton**: Extends the base button with `accent` and `fed` variant support and game-themed defaults
- **AppCard**: Wraps the card with game-themed border colors and surface background
- **AppDialog**: Wraps the dialog with a dark overlay and game-themed content area
- **AppInput**: Wraps the input with dark-theme styling and error state display
- **AppToast**: Configures and exports the Sonner toast provider with game theme applied

### Layout Components

Three layout components scaffold the primary page types:

- **PageLayout**: Full-height page with navigation header, content area, and footer. Used for landing page, profile, leaderboards, and settings.
- **GameLayout**: Full-screen layout (full viewport height and width, no scroll) for the game canvas with no navigation. The Phaser canvas fills the entire area; React HUD components overlay it using absolute positioning. Used for all game routes.
- **AuthLayout**: Centered card layout with dark background, game logo, and a centered form panel. Used for login and signup pages.

### Theme Provider

A client-side theme provider manages dark/light mode switching:
- Default: dark mode
- Applies a dark or light class to the root HTML element
- Respects the system color scheme preference on first visit, then persists the user's choice
- The light class triggers the light mode CSS variable overrides defined in the global stylesheet

### Component Import Convention

The import chain flows strictly in one direction: feature code imports from the domain app layer, which imports from shared app-layer wrappers, which in turn import from vendor components. Never skip a level. Feature code does not import from vendor components directly.

### Edge Cases

- **Tailwind class scanning**: Tailwind scans files for class usage automatically. Dynamic class strings (e.g., assembled via template literals) must use full class names, not assembled fragments — Tailwind cannot statically analyze assembled strings.
- **shadcn CSS variable naming**: shadcn/ui uses its own CSS variable names internally. When configuring the component installer, verify that the variable names align with the theme variables defined in the global stylesheet.
- **Font loading**: The Next.js font optimization system loads fonts at build time and injects them via className on the root element — not via style tags. All three fonts must be applied to the root HTML element.
- **Magic UI performance**: Never use animated Magic UI components inside the game canvas area or in components that mount and unmount frequently.
- **GameLayout z-index**: The Phaser canvas renders at the base z-index layer. React HUD overlay components must use absolute positioning and higher z-index values to appear above the canvas.

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

Start with the `globals.css` theme definition as the foundation — everything else depends on the CSS custom properties being available. Then install shadcn/ui CLI, configure `components.json`, install individual components. Then create app-layer wrappers. Magic UI components can be added last.

### Theme CSS — `apps/web/src/app/globals.css`

```css
@import "tailwindcss";

@theme inline {
  --color-background: #0a0a0f;
  --color-surface: #12121a;
  --color-surface-elevated: #1a1a25;
  --color-border: #2a2a3a;
  --color-border-subtle: #1e1e2d;

  --color-text-primary: #e8e8f0;
  --color-text-secondary: #9090a8;
  --color-text-muted: #60607a;
  --color-text-inverse: #0a0a0f;

  --color-accent: #c41e3a;
  --color-accent-hover: #e02040;
  --color-accent-subtle: #3a0a14;
  --color-accent-foreground: #ffffff;

  --color-fed: #1e5ba8;
  --color-fed-hover: #2470cc;
  --color-fed-subtle: #0a1e3a;
  --color-fed-foreground: #ffffff;

  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #3b82f6;

  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-bebas-neue), var(--font-sans);
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;

  --spacing-game-hud: 1rem;
  --spacing-panel: 1.5rem;

  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;

  --shadow-panel: 0 4px 24px 0 rgba(0, 0, 0, 0.6);
  --shadow-overlay: 0 8px 48px 0 rgba(0, 0, 0, 0.8);
}

:root {
  color-scheme: dark;
}

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

### Design Tokens — `packages/ui-theme/src/tokens/`

**colors.ts**:
```typescript
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

**typography.ts**:
```typescript
export const typography = {
  fontSans: 'Inter, ui-sans-serif, system-ui, sans-serif',
  fontDisplay: 'Bebas Neue, Inter, sans-serif',
  fontMono: 'JetBrains Mono, ui-monospace, monospace',
  sizes: {
    xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem',
    xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem',
    '4xl': '2.25rem', '5xl': '3rem',
  },
} as const
```

**spacing.ts**:
```typescript
export const spacing = { gameHud: '1rem', panel: '1.5rem' } as const
```

### Brand Config — `packages/ui-theme/src/brand/config.ts`

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

### Font Config — `apps/web/src/app/fonts.ts`

```typescript
import { Inter, Bebas_Neue, JetBrains_Mono } from 'next/font/google'

export const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
export const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas-neue', display: 'swap' })
export const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' })
```

Apply in `apps/web/src/app/layout.tsx` — add all three variables to the `<html>` element className.

### shadcn CLI Config — `apps/web/components.json`

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

### App-Layer Wrapper Signatures

**AppButton** (`apps/web/src/components/app/common/AppButton.tsx`):
```typescript
'use client'
import { Button } from '../../vendor/shadcn/button'
import type { ButtonProps } from '../../vendor/shadcn/button'

interface AppButtonProps extends ButtonProps {
  variant?: 'default' | 'accent' | 'fed' | 'ghost' | 'destructive' | 'outline'
}

export function AppButton({ variant = 'default', className, ...props }: AppButtonProps) { ... }
```

**AppCard**: wraps `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription` — applies surface background and game-themed border colors.

**AppDialog**: wraps `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` — applies dark overlay and themed content area.

**AppInput**: wraps `Input` — applies dark-theme styling and error state display prop.

**AppToast**: configures and exports Sonner `Toaster` with game theme; feature code uses `import { toast } from 'sonner'` directly.

### Layout Component Implementations

**GameLayout** (`apps/web/src/components/app/common/layout/GameLayout.tsx`):
```typescript
// className: "w-screen h-dvh overflow-hidden relative bg-background"
// No navigation, no footer, no scroll
```

**AuthLayout** (`apps/web/src/components/app/common/layout/AuthLayout.tsx`):
```typescript
// Centered dark background with a centered card panel and game logo above form
```

**PageLayout** (`apps/web/src/components/app/common/layout/PageLayout.tsx`):
```typescript
// Full height, navigation header, scrollable content area, footer
```

### Theme Provider — `apps/web/src/components/app/common/theme-provider.tsx`

```typescript
'use client'
// next-themes or manual localStorage
// Adds .dark or .light class to <html>
// Default: dark
// Respects prefers-color-scheme on first visit, then persists choice
```

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

----

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
