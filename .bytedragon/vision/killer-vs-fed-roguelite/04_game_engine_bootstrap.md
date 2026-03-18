---
vision: killer-vs-fed-roguelite
sequence: 04
name: game-engine-bootstrap
group: Core Engine
group_order: 2
status: pending
depends_on:
  - "01: packages/game-engine/ scaffold, packages/shared/src/types/, packages/shared/src/constants/, Zustand dependency, Phaser 3.90.0 dependency already in game-engine package.json"
produces:
  - "Phaser game config packages/game-engine/src/config/game-config.ts"
  - "Scene manager with scene keys enum packages/game-engine/src/scenes/scene-keys.ts"
  - "Boot scene packages/game-engine/src/scenes/boot-scene.ts"
  - "Preload scene packages/game-engine/src/scenes/preload-scene.ts"
  - "EventBus packages/game-engine/src/events/event-bus.ts (typed, Phaser-to-React signals)"
  - "Shared event types packages/shared/src/types/events.ts"
  - "Shared event constants packages/shared/src/constants/events.ts"
  - "Zustand game store apps/web/src/stores/game.ts"
  - "Zustand player store apps/web/src/stores/player.ts"
  - "React PhaseGame component apps/web/src/components/app/game/phaser-game.tsx"
  - "Game page apps/web/src/app/game/page.tsx with full-screen GameLayout"
  - "Asset loader utility packages/game-engine/src/utils/asset-loader.ts"
  - "Game constants packages/shared/src/constants/game.ts"
created: 2026-03-17
last_aligned: never
---

# Vision Piece 04: Game Engine Bootstrap

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: project scaffold (foundation infrastructure)

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Set up the Phaser 3 game instance within the Next.js 16 application. This includes Phaser game configuration, scene management, the EventBus bridge pattern for safe Phaser-to-React communication, core Zustand stores as the React side of the bridge, the React wrapper component that mounts and destroys the Phaser canvas, and the asset loading utility. After this piece, the game engine runs inside Next.js with bidirectional communication to React — without either system importing the other directly.

### Core Architecture: Phaser + React Isolation

**Constitutional requirement**: Phaser code MUST NOT import React. React code MUST NOT import Phaser internals. This is an absolute boundary.

The bridge pattern:
```
Phaser Scene
  ↓ emits events via EventBus (one-time signals)
  ↓ writes to Zustand stores (continuous state)
React Component
  ↑ reads Zustand stores (subscribes to state)
  ↑ receives EventBus events (handles signals)
```

- **EventBus**: For one-time signals (player died, item picked up, run ended). Fire-and-forget. React components subscribe to these to trigger side effects.
- **Zustand stores**: For continuous state (health, position, inventory, current scene). Phaser writes; React reads. State persists between EventBus events.
- **React → Phaser**: React uses the Phaser game instance reference (stored in a React ref) to call `game.events.emit()` for user-initiated actions (pause, resume, restart). Alternatively, stores a reference to specific scenes.

### Phaser Game Configuration

**`packages/game-engine/src/config/game-config.ts`**:

```typescript
import Phaser from 'phaser'
import { BootScene } from '../scenes/boot-scene'
import { PreloadScene } from '../scenes/preload-scene'
// Additional scenes imported and added to scene list in later pieces

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,          // WebGL with Canvas fallback
    parent,                     // DOM element ID where canvas is inserted
    width: 1280,
    height: 720,
    backgroundColor: '#0a0a0f', // Matches --color-background CSS variable
    pixelArt: false,            // Smooth rendering (assets are not pixel art)
    antialias: true,
    scale: {
      mode: Phaser.Scale.FIT,   // Fit canvas to parent while maintaining aspect ratio
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 }, // Top-down game — no gravity
        debug: false,             // Set to true during development via env config
      },
    },
    scene: [BootScene, PreloadScene],
    // Additional scenes (MapScene, CombatScene) registered in later pieces
  }
}
```

Physics: **Arcade Physics** is the correct choice for this top-down roguelite. Matter.js would add unnecessary complexity. Arcade Physics provides efficient AABB collision detection suitable for movement and hitboxes.

Resolution strategy: 1280×720 base resolution. `Phaser.Scale.FIT` scales the canvas to fill the parent container (the full-screen GameLayout div) while maintaining 16:9 aspect ratio. Letterboxing appears on non-16:9 screens — acceptable for V1.

### Scene Keys

**`packages/game-engine/src/scenes/scene-keys.ts`**:

```typescript
export const SceneKey = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MAP: 'MapScene',           // Registered by the world-and-maps feature
  COMBAT: 'CombatScene',     // Registered by the combat-system feature
  GAME_OVER: 'GameOverScene', // Registered by the player-and-roles feature
  RESULTS: 'ResultsScene',   // Registered by the session-economy feature
} as const

export type SceneKey = typeof SceneKey[keyof typeof SceneKey]
```

### Boot Scene

**`packages/game-engine/src/scenes/boot-scene.ts`**:

```typescript
import Phaser from 'phaser'
import { SceneKey } from './scene-keys'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.BOOT })
  }

  preload() {
    // Load CRITICAL assets only (loading screen background, progress bar sprite)
    // Critical tier: assets needed before any content renders
    // Everything else deferred to PreloadScene or MapScene
    this.load.image('loading-bg', '/assets/loading/background.png')
  }

  create() {
    // Transition to preload scene immediately after critical assets ready
    this.scene.start(SceneKey.PRELOAD)
  }
}
```

### Preload Scene

**`packages/game-engine/src/scenes/preload-scene.ts`**:

```typescript
import Phaser from 'phaser'
import { SceneKey } from './scene-keys'
import { eventBus } from '../events/event-bus'
import { GAME_EVENTS } from '@repo/shared/constants/events'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKey.PRELOAD })
  }

  preload() {
    // Display loading progress bar using critical assets from BootScene
    this.createLoadingBar()

    // Load STANDARD assets: UI sprites, common NPC sprites, shared tilesets
    // Asset loading tiers (Constitution XXXI):
    //   Critical: BootScene (loading screen itself)
    //   Standard: PreloadScene (shared game assets)
    //   Deferred: MapScene and specific scenes (biome-specific, role-specific)
    this.load.on('progress', (value: number) => {
      this.updateProgressBar(value)
    })

    // Standard asset loading here (added incrementally as later pieces define assets)
  }

  create() {
    // Signal to React that preloading is complete
    eventBus.emit(GAME_EVENTS.PRELOAD_COMPLETE)
    // Actual scene start (MapScene or RoleSelectScene) triggered by React
    // after user selects role — Phaser waits for signal
  }

  private createLoadingBar() { /* progress bar implementation */ }
  private updateProgressBar(value: number) { /* update bar fill */ }
}
```

### EventBus

**`packages/game-engine/src/events/event-bus.ts`**:

```typescript
import Phaser from 'phaser'

// Phaser.Events.EventEmitter is a typed event emitter
// Using Phaser's built-in emitter to avoid React dependency
class GameEventBus extends Phaser.Events.EventEmitter {
  constructor() {
    super()
  }
}

// Singleton — exported as a module-level instance
// Both Phaser scenes and React components import this same instance
export const eventBus = new GameEventBus()
```

**Usage in Phaser scenes** (no React imports):
```typescript
import { eventBus } from '../events/event-bus'
import { GAME_EVENTS } from '@repo/shared/constants/events'

// Emit: fire-and-forget signal
eventBus.emit(GAME_EVENTS.PLAYER_DIED, { causeOfDeath: 'combat' })
```

**Usage in React components** ("use client" required):
```typescript
import { eventBus } from '@repo/game-engine/events/event-bus'
import { GAME_EVENTS } from '@repo/shared/constants/events'

// Subscribe in useEffect, cleanup on unmount
useEffect(() => {
  const handler = (payload: PlayerDiedPayload) => { /* update UI */ }
  eventBus.on(GAME_EVENTS.PLAYER_DIED, handler)
  return () => { eventBus.off(GAME_EVENTS.PLAYER_DIED, handler) }
}, [])
```

The EventBus is the ONLY cross-boundary communication mechanism for one-time events. Phaser does NOT access React state. React does NOT call Phaser scene methods directly (except via the game instance ref for high-level controls).

### Shared Event Types

**`packages/shared/src/types/events.ts`**:

```typescript
// All EventBus event payload types — typed at the boundary
export interface PlayerDiedPayload {
  causeOfDeath: 'combat' | 'evidence' | 'timeout'
  role: 'KILLER' | 'FED'
}

export interface PreloadCompletePayload {
  // No payload — signal only
}

export interface SceneChangedPayload {
  from: string
  to: string
}

export interface ZoneEnteredPayload {
  zoneId: string
  zoneName: string
}

// Additional payloads added as later pieces define their events
```

### Shared Event Constants

**`packages/shared/src/constants/events.ts`**:

```typescript
// String constants for all EventBus event names
// Using string constants (not enum) for Phaser EventEmitter compatibility

export const GAME_EVENTS = {
  PRELOAD_COMPLETE: 'game:preload-complete',
  SCENE_CHANGED: 'game:scene-changed',
  PLAYER_DIED: 'game:player-died',
  RUN_STARTED: 'game:run-started',
  RUN_ENDED: 'game:run-ended',
  ZONE_ENTERED: 'game:zone-entered',
  ZONE_EXITED: 'game:zone-exited',
  ITEM_PICKED_UP: 'game:item-picked-up',
  // Additional event names added in later pieces
} as const

export type GameEventName = typeof GAME_EVENTS[keyof typeof GAME_EVENTS]
```

### Game Constants

**`packages/shared/src/constants/game.ts`**:

```typescript
export const GAME_CONFIG = {
  TARGET_FPS: 60,
  PHYSICS_TICK_RATE: 60,    // Hz — matches target FPS for Arcade Physics
  AI_TICK_RATE: 12,          // Hz — NPC AI updates at 1/5 of physics rate (every 5 frames)
  BASE_RESOLUTION: { width: 1280, height: 720 },
  TILE_SIZE: 32,             // Pixels per tile (32×32 tiles)
  PLAYER_SPEED_WALK: 120,    // Pixels per second
  PLAYER_SPEED_RUN: 200,
  PLAYER_SPEED_SNEAK: 60,
  INTERACTION_RANGE: 48,     // Pixels — interaction radius for items and NPCs
} as const
```

### Zustand Game Stores

**`apps/web/src/stores/game.ts`**:

```typescript
'use client'
import { create } from 'zustand'

export type GamePhase = 'idle' | 'loading' | 'running' | 'paused' | 'game-over' | 'results'

interface GameStore {
  phase: GamePhase
  currentScene: string | null
  fps: number
  setPhase: (phase: GamePhase) => void
  setCurrentScene: (scene: string | null) => void
  setFps: (fps: number) => void
}

export const useGameStore = create<GameStore>((set) => ({
  phase: 'idle',
  currentScene: null,
  fps: 0,
  setPhase: (phase) => set({ phase }),
  setCurrentScene: (currentScene) => set({ currentScene }),
  setFps: (fps) => set({ fps }),
}))
```

**`apps/web/src/stores/player.ts`**:

```typescript
'use client'
import { create } from 'zustand'

// Stub store — extended by the player-and-roles feature with role, inventory, abilities
interface PlayerStore {
  userId: string | null
  displayName: string | null
  health: number
  maxHealth: number
  position: { x: number; y: number } | null
  setUserId: (userId: string | null) => void
  setDisplayName: (name: string | null) => void
  setHealth: (health: number) => void
  setPosition: (pos: { x: number; y: number }) => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  userId: null,
  displayName: null,
  health: 100,
  maxHealth: 100,
  position: null,
  setUserId: (userId) => set({ userId }),
  setDisplayName: (displayName) => set({ displayName }),
  setHealth: (health) => set({ health }),
  setPosition: (position) => set({ position }),
}))
```

Zustand stores use a flat structure per store. Do NOT create a single massive store. Each domain gets its own store file.

### React PhaseGame Component

**`apps/web/src/components/app/game/phaser-game.tsx`**:

```typescript
'use client'
import { useEffect, useRef } from 'react'
import type Phaser from 'phaser'
import { useGameStore } from '../../../stores/game'

const PHASER_PARENT_ID = 'phaser-game-container'

export function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null)
  const setPhase = useGameStore((s) => s.setPhase)
  const setCurrentScene = useGameStore((s) => s.setCurrentScene)

  useEffect(() => {
    // Phaser must only be instantiated client-side
    // Dynamic import ensures Phaser never runs during SSR
    let game: Phaser.Game

    async function initGame() {
      const { default: Phaser } = await import('phaser')
      const { createGameConfig } = await import('@repo/game-engine/config/game-config')

      const config = createGameConfig(PHASER_PARENT_ID)
      game = new Phaser.Game(config)
      gameRef.current = game
      setPhase('loading')
    }

    initGame()

    return () => {
      // Cleanup: destroy Phaser instance when component unmounts
      // This happens when navigating away from /game
      if (gameRef.current) {
        gameRef.current.destroy(true) // true = remove canvas from DOM
        gameRef.current = null
        setPhase('idle')
        setCurrentScene(null)
      }
    }
  }, []) // Empty deps — create once, destroy on unmount

  return (
    <div
      id={PHASER_PARENT_ID}
      className="w-full h-full"
      aria-label="Game canvas"
      role="application"
    />
  )
}
```

**Critical implementation notes**:
- Use dynamic `import('phaser')` inside `useEffect` — never at the top of the file. This prevents Phaser from being included in the SSR bundle.
- Use `useRef` (not `useState`) for the game instance — React must NOT re-render when the game instance changes.
- The parent div fills the GameLayout's full-screen container.
- The component emits nothing to EventBus itself — it's a mount/unmount lifecycle wrapper.

### Game Page and Layout

**`apps/web/src/app/game/layout.tsx`**:

```typescript
import type { ReactNode } from 'react'

// Full-screen layout for all game routes
// No navigation header, no footer, no scroll
export default function GameLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-screen h-dvh overflow-hidden relative bg-background">
      {children}
    </div>
  )
}
```

**`apps/web/src/app/game/page.tsx`**:

```typescript
import { PhaserGame } from '../../components/app/game/phaser-game'

// The game page — full-screen Phaser canvas
// HUD overlay components are added by the player-and-roles feature
export default function GamePage() {
  return (
    <main className="w-full h-full relative">
      {/* Phaser canvas fills entire area */}
      <PhaserGame />

      {/* HUD overlay — added in later pieces, absolute positioned */}
      {/* <GameHUD /> */}
    </main>
  )
}
```

### Asset Loader Utility

**`packages/game-engine/src/utils/asset-loader.ts`**:

```typescript
import Phaser from 'phaser'

// Asset loading tiers per Constitution XXXI (progressive enhancement):
//   Critical: Loaded in BootScene — required for loading screen itself
//   Standard: Loaded in PreloadScene — shared across all game modes
//   Deferred: Loaded in specific scenes — biome/role-specific assets

export type AssetTier = 'critical' | 'standard' | 'deferred'

interface AssetDefinition {
  key: string
  path: string
  tier: AssetTier
}

// Azure Blob Storage URL construction for large game assets
// Base URL from centralized env config at apps/web/src/config/env.ts
export function getAssetUrl(relativePath: string, blobStorageBaseUrl?: string): string {
  if (blobStorageBaseUrl) {
    return `${blobStorageBaseUrl}/${relativePath}`
  }
  // Fallback to /public/assets/ for development without blob storage
  return `/assets/${relativePath}`
}

// Load a set of image assets into a Phaser scene
export function loadImages(scene: Phaser.Scene, assets: AssetDefinition[]) {
  assets.forEach(({ key, path }) => {
    scene.load.image(key, path)
  })
}

// Load sprite atlas assets
export function loadAtlases(
  scene: Phaser.Scene,
  atlases: Array<{ key: string; imagePath: string; dataPath: string }>
) {
  atlases.forEach(({ key, imagePath, dataPath }) => {
    scene.load.atlas(key, imagePath, dataPath)
  })
}

// Load tilemaps
export function loadTilemaps(
  scene: Phaser.Scene,
  tilemaps: Array<{ key: string; path: string }>
) {
  tilemaps.forEach(({ key, path }) => {
    scene.load.tilemapTiledJSON(key, path)
  })
}
```

The `blobStorageBaseUrl` is read from centralized env config (`AZURE_BLOB_STORAGE_URL`). The asset loader does NOT access `process.env` directly — it receives the URL as a parameter from the calling scene, which gets it from the Phaser game config (which is initialized server-side via Next.js and passed as configuration).

### Edge Cases

- **SSR prevention**: Phaser absolutely must not run during server-side rendering. The dynamic `import('phaser')` inside `useEffect` guarantees this. Never import Phaser at module scope in any file within `apps/web/`.
- **Hot reload during development**: When Next.js hot-reloads a page, the `PhaserGame` component unmounts and remounts. The cleanup function (`game.destroy(true)`) must run cleanly. Verify no Phaser instances accumulate in the browser's JavaScript heap during development.
- **Canvas resizing**: Phaser's `Scale.FIT` mode handles window resizes automatically. However, the React container div must use `w-full h-full` (not fixed pixels) so Phaser's scale manager has accurate parent dimensions.
- **Multiple game instances**: There MUST be only one Phaser game instance at a time. The `useRef` pattern and cleanup function enforce this. Navigation that re-mounts `PhaserGame` without proper cleanup would create multiple instances — confirm cleanup runs before re-creation.
- **EventBus memory leaks**: React components that subscribe to EventBus events MUST unsubscribe in the `useEffect` cleanup. Missing cleanup leads to stale event handlers after component unmount.
- **Zustand store reset on game end**: When a run ends, game and player stores must be reset to initial state. The cleanup in `PhaserGame` partially handles this — later pieces add full reset logic.

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

Reference the official Phaser + Next.js template at https://phaser.io/tutorials/making-your-first-phaser-3-game-with-nextjs as a starting point for the EventBus pattern and React component structure. The key pattern (dynamic import, useEffect mounting, useRef for instance) comes directly from Phaser's official guidance for Next.js integration.

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| Phaser | 3.90.0 | In `packages/game-engine/` only — NEVER in apps/web directly |
| Zustand | latest | In `apps/web/` only |
| React | 19.2.4 | PhaserGame component uses useEffect, useRef |
| TypeScript | 5.9.3+ | Phaser ships its own types |

### Implementation Order

1. Add Phaser 3.90.0 to `packages/game-engine/package.json` (NOT to apps/web)
2. Add Zustand to `apps/web/package.json`
3. Create `packages/shared/src/constants/events.ts` — event name constants
4. Create `packages/shared/src/types/events.ts` — event payload types
5. Create `packages/shared/src/constants/game.ts` — game configuration constants
6. Create `packages/game-engine/src/events/event-bus.ts` — EventBus singleton
7. Create `packages/game-engine/src/scenes/scene-keys.ts` — SceneKey enum
8. Create `packages/game-engine/src/scenes/boot-scene.ts`
9. Create `packages/game-engine/src/scenes/preload-scene.ts`
10. Create `packages/game-engine/src/config/game-config.ts`
11. Create `packages/game-engine/src/utils/asset-loader.ts`
12. Create `apps/web/src/stores/game.ts`
13. Create `apps/web/src/stores/player.ts`
14. Create `apps/web/src/components/app/game/phaser-game.tsx`
15. Create `apps/web/src/app/game/layout.tsx`
16. Create `apps/web/src/app/game/page.tsx`
17. Write tests

### Monorepo Package Boundary

`packages/game-engine` exports its public API via `package.json` `exports` field (these are package boundary entry points, NOT barrel files per the ESLint rule):

```json
{
  "exports": {
    "./config/game-config": "./src/config/game-config.ts",
    "./events/event-bus": "./src/events/event-bus.ts",
    "./utils/asset-loader": "./src/utils/asset-loader.ts",
    "./scenes/scene-keys": "./src/scenes/scene-keys.ts"
  }
}
```

React components in `apps/web` import via these entry points (e.g., `import { eventBus } from '@repo/game-engine/events/event-bus'`).

### Testing Strategy

**Unit tests** (`packages/game-engine/tests/events/event-bus.test.ts`):
- EventBus emits events to registered handlers
- EventBus off() removes handlers
- Multiple handlers for same event all receive it

**Unit tests** (`packages/shared/tests/constants/events.test.ts`):
- All event constants are unique strings (no collisions)

**Unit tests** (`packages/shared/tests/constants/game.test.ts`):
- Game config values are within valid ranges (e.g., TILE_SIZE > 0, TARGET_FPS > 0)

**Component tests** (`apps/web/tests/components/app/game/phaser-game.test.tsx`):
- Renders the container div with correct ID
- Dynamic Phaser import is mocked (Phaser does not run in Vitest/jsdom)
- Cleanup function calls `game.destroy()` on unmount

**Unit tests** (`apps/web/tests/stores/game.test.ts`):
- Initial state is correct
- `setPhase` updates `phase`
- `setCurrentScene` updates `currentScene`

**E2E** (`apps/web/tests/e2e/game.test.ts`) — Playwright:
- Navigating to `/game` renders the canvas element
- No console errors from Phaser initialization (check browser console)

**Note**: Phaser cannot run in Vitest (Node.js, no Canvas API). Mock Phaser in all unit/component tests. E2E tests with Playwright verify actual Phaser behavior in a real browser.

### Constitution Compliance Checklist

- [x] I: No barrel files — game-engine uses `exports` field in package.json (package boundary, not barrel)
- [x] III: Shared types in `packages/shared/src/types/events.ts`
- [x] VI: Domain-based organization — `game/` scenes, `events/` bus, `utils/` loader
- [x] VII: `"use client"` on PhaserGame component; Phaser scenes have no React imports
- [x] VIII: EventBus is a singleton (module-level instance); Phaser game instance managed via useRef
- [x] XIV: EventBus for one-time signals; Zustand for persistent state — correctly applied
- [x] XXVI: Tests in `tests/` at each package root
- [x] XXIX: Responsive canvas via `Phaser.Scale.FIT` mode
- [x] XXXI: Asset loading tiers implemented (Critical → Standard → Deferred)

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

When this piece is fully implemented, it should produce:

- `packages/game-engine/src/config/game-config.ts` — `createGameConfig(parent)` factory
- `packages/game-engine/src/scenes/scene-keys.ts` — `SceneKey` const object
- `packages/game-engine/src/scenes/boot-scene.ts` — critical asset preload + transition to preload
- `packages/game-engine/src/scenes/preload-scene.ts` — standard asset preload + loading bar
- `packages/game-engine/src/events/event-bus.ts` — `eventBus` singleton
- `packages/game-engine/src/utils/asset-loader.ts` — `loadImages`, `loadAtlases`, `loadTilemaps`, `getAssetUrl`
- `packages/shared/src/types/events.ts` — all event payload types
- `packages/shared/src/constants/events.ts` — `GAME_EVENTS` constants
- `packages/shared/src/constants/game.ts` — `GAME_CONFIG` constants
- `apps/web/src/stores/game.ts` — `useGameStore` (phase, currentScene, fps)
- `apps/web/src/stores/player.ts` — `usePlayerStore` stub (userId, displayName, health, position)
- `apps/web/src/components/app/game/phaser-game.tsx` — `PhaserGame` component
- `apps/web/src/app/game/layout.tsx` — full-screen game layout
- `apps/web/src/app/game/page.tsx` — game page hosting PhaserGame

### Dependencies Consumed (from Project Scaffold)

All of the following are produced by piece 01 and must be in place:

- **`packages/game-engine/` scaffold** — `package.json` with Phaser 3.90.0 listed, `tsconfig.json`, `src/` directory
- **`packages/shared/src/types/` and `constants/` directories** — scaffold exists, ready to populate
- **Zustand** — listed in `apps/web/package.json` dependencies
- **`packages/shared/src/utils/result.ts`** — neverthrow utilities (not directly used in this piece but downstream pieces need them)

### Produces (for Downstream Pieces)

- **`createGameConfig`** — piece 05 (world-and-maps) adds `MapScene` to the scene list
- **`SceneKey`** — all subsequent scene pieces add their keys here
- **`eventBus`** — every downstream Phaser scene and React component uses this
- **`GAME_EVENTS`** constants — downstream pieces add their event names here
- **`GAME_CONFIG`** constants — piece 05 uses `TILE_SIZE`; piece 06 uses `AI_TICK_RATE`
- **`useGameStore`** — HUD components (piece 07+) read `phase` and `currentScene`
- **`usePlayerStore`** — extended by piece 07 (player-and-roles) with role, inventory, objectives
- **`loadImages`, `loadAtlases`, `loadTilemaps`** — piece 05 uses these in MapScene asset loading
- **`getAssetUrl`** — piece 05 uses this for Azure Blob Storage URLs
- **`GameLayout`** (from piece 03) — this piece's game page uses it via `apps/web/src/app/game/layout.tsx`

### Success Criteria

- [ ] Navigating to `/game` in the browser renders a black Phaser canvas (1280×720, fitted to viewport)
- [ ] No Phaser import appears in any file under `apps/web/` (verify with `grep -r "from 'phaser'" apps/web/`)
- [ ] No React import appears in any file under `packages/game-engine/` (verify with `grep -r "from 'react'" packages/game-engine/`)
- [ ] EventBus emits and receives events correctly (verified in Vitest unit tests)
- [ ] Game instance is destroyed when navigating away from `/game` (no memory leaks)
- [ ] `useGameStore.getState().phase` transitions from `idle` → `loading` when PhaserGame mounts
- [ ] Zustand stores initial state is correct

### Alignment Notes

This piece runs in parallel with auth-and-profiles (piece 02) and design-system (piece 03). All three depend only on the project scaffold.

The game page at `/game` should be protected by the proxy's auth check (established in piece 02). If this piece is implemented before piece 02, the game page will be temporarily accessible without auth — this is acceptable during development, corrected when piece 02's proxy logic is merged.

Piece 05 (world-and-maps) directly extends this piece by adding `MapScene` to the scene list in `game-config.ts` and registering `SceneKey.MAP`. The scene list in `game-config.ts` is the connection point — piece 04 creates the list with Boot and Preload only; subsequent pieces add their scenes.

The `player` Zustand store stub created here is intentionally minimal. Piece 07 (player-and-roles) extends it with role, inventory, objectives, and abilities. The store file is owned by piece 04 but extended by piece 07.
