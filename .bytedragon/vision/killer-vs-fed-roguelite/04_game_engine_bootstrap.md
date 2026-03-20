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
  - "Shared game event types packages/shared/src/types/events/game.ts"
  - "Shared game event constants packages/shared/src/constants/events/game.ts"
  - "Zustand game store apps/web/src/stores/game.ts"
  - "Zustand player store apps/web/src/stores/player.ts"
  - "React PhaseGame component apps/web/src/components/app/game/phaser-game.tsx"
  - "Game page apps/web/src/app/game/page.tsx with full-screen GameLayout"
  - "Asset loader utility packages/game-engine/src/utils/asset-loader.ts"
  - "Game constants packages/shared/src/constants/game.ts"
created: 2026-03-17
last_aligned: 2026-03-20
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

Phaser code must never import React. React code must never import Phaser internals. This is an absolute architectural boundary.

The bridge pattern has two channels:

- **EventBus** (one-time signals): When something happens in the game (player died, item picked up, run ended), Phaser emits an event on a shared event emitter. React components subscribe to these events to trigger side effects (show UI, update records, navigate).
- **Zustand stores** (continuous state): Phaser writes state (health, position, inventory, current scene) directly to Zustand stores. React components subscribe to the store and re-render when values change. State persists between events.

**React → Phaser direction**: React holds a reference to the Phaser game instance (stored in a React ref, never in React state). React calls `game.events.emit()` to trigger high-level game controls (pause, resume, restart).

### Game Configuration

Base resolution: 1280×720. The canvas fits its parent container using a FIT scale mode that maintains 16:9 aspect ratio — letterboxing on non-16:9 screens is acceptable for V1. The canvas background matches the app's near-black background color.

Physics: Arcade Physics (top-down, no gravity). This is the correct choice for a top-down roguelite. It provides efficient axis-aligned bounding box collision detection suitable for movement and hitboxes without the complexity of Matter.js.

Scene list: Boot and Preload scenes are registered in this piece. Later pieces add their scenes (Map, Combat, GameOver, Results) to the same list.

### Scenes

**Boot Scene**: Loads only the critical assets needed to display a loading screen (background, progress bar sprite). Immediately transitions to the Preload scene.

**Preload Scene**: Displays a loading progress bar using the critical assets from Boot. Loads all standard (shared) assets — UI sprites, common NPC sprites, shared tilesets. When loading completes, emits `PRELOAD_COMPLETE` on the EventBus. The actual game start is triggered by React after the user selects a role — Phaser waits for the signal.

### EventBus

A singleton event emitter instance (using Phaser's built-in event emitter to avoid any React dependency in the game-engine package). Both Phaser scenes and React components import the same module-level instance.

Phaser emits events: `eventBus.emit(EVENT_NAME, payload)`

React subscribes in `useEffect` and cleans up on unmount: `eventBus.on(EVENT_NAME, handler)` / `eventBus.off(EVENT_NAME, handler)`

The EventBus is the only cross-boundary mechanism for one-time events. Phaser does not access React state. React does not call Phaser scene methods directly except via the game instance ref for high-level controls.

### Event System

Event names are string constants (not an enum) to maintain compatibility with Phaser's event emitter. Each event has a typed payload interface in the shared package.

Events defined in this piece:
- `game:preload-complete` — assets loaded, game ready to start
- `game:scene-changed` — active scene transitioned, with from/to scene names
- `game:player-died` — player death with cause (combat, evidence, timeout) and role
- `game:run-started` — new run initiated
- `game:run-ended` — run finished (win or lose)
- `game:zone-entered` / `game:zone-exited` — player entered or left a named zone
- `game:item-picked-up` — item acquired

Later pieces add their own events to the constants object and payload types file.

### Game Constants

Numeric game configuration values are shared constants:
- Target and physics tick rate: 60 Hz
- AI tick rate: 12 Hz (NPC AI updates every 5 frames for performance)
- Base resolution: 1280×720
- Tile size: 32 pixels per tile
- Player movement speeds: walk (120 px/s), run (200 px/s), sneak (60 px/s)
- Interaction range: 48 pixels radius

### Zustand Stores

**Game store** tracks the high-level game lifecycle:
- `phase`: the current game phase — idle, loading, running, paused, game-over, or results
- `currentScene`: the active Phaser scene key (null when not in game)
- `fps`: current frame rate for debug display

**Player store** (stub in this piece, extended by the player and role framework):
- `userId`, `displayName` — set by AuthProvider when user authenticates
- `health`, `maxHealth` — current HP (initialized to 100/100)
- `position` — current tile coordinates, or null

Each domain gets its own store file. No single massive store.

### React PhaserGame Component

A client-side React component that owns the Phaser game instance lifecycle:
- Renders a `<div>` that Phaser uses as its canvas parent
- On mount: dynamically imports Phaser (via `import('phaser')` inside `useEffect` — this is critical for SSR prevention), creates the game instance, sets phase to `loading`
- On unmount: calls `game.destroy(true)` to remove the canvas, resets the store to idle

**Critical**: Phaser is imported dynamically inside `useEffect`, never at module scope. This ensures Phaser never runs during server-side rendering. The game instance is stored in a React `ref` (not `state`) so React does not re-render when the game instance changes.

### Asset Loader Utility

A utility module in the game-engine package provides typed wrappers around Phaser's asset loading API:
- `loadImages(scene, assets)` — loads image assets by key and path
- `loadAtlases(scene, atlases)` — loads sprite atlas assets
- `loadTilemaps(scene, tilemaps)` — loads Tiled JSON tilemaps
- `getAssetUrl(relativePath, baseUrl?)` — constructs the correct URL for an asset: uses the Azure Blob Storage base URL if provided, falls back to `/assets/` for local development

The asset loader receives the blob storage URL as a parameter — it does not access environment variables directly.

Asset loading tiers (three levels):
- **Critical**: BootScene — assets needed before the loading screen can render
- **Standard**: PreloadScene — shared assets used across all game modes
- **Deferred**: Individual scenes (MapScene, etc.) — biome-specific and role-specific assets loaded just before needed

### Edge Cases

- **SSR prevention**: Phaser must never run during server-side rendering. The dynamic `import('phaser')` inside `useEffect` guarantees this. Never import Phaser at module scope in any file under `apps/web/`.
- **Hot reload during development**: Next.js hot-reloads cause the PhaserGame component to unmount and remount. The cleanup function (`game.destroy(true)`) must run cleanly — verify no Phaser instances accumulate in memory during development.
- **Canvas resizing**: Phaser's FIT scale mode handles window resizes automatically. The React container div must use relative sizing (`w-full h-full`), not fixed pixels, so Phaser's scale manager has accurate parent dimensions.
- **Multiple game instances**: Only one Phaser game instance may exist at a time. The `useRef` pattern and cleanup function enforce this. Navigation that re-mounts PhaserGame without cleanup would create multiple instances.
- **EventBus memory leaks**: React components that subscribe to EventBus events must unsubscribe in `useEffect` cleanup. Missing cleanup leaves stale handlers after component unmount.
- **Zustand store reset on game end**: The cleanup in PhaserGame resets phase to idle. Full state reset logic (clearing inventory, health, position) is added in later pieces.

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

Reference the official Phaser + Next.js template at https://phaser.io/tutorials/making-your-first-phaser-3-game-with-nextjs as a starting point for the EventBus pattern and React component structure. The key pattern (dynamic import, useEffect mounting, useRef for instance) comes directly from Phaser's official guidance for Next.js integration.

### Phaser Game Config — `packages/game-engine/src/config/game-config.ts`

```typescript
import Phaser from 'phaser'
import { BootScene } from '../scenes/boot-scene'
import { PreloadScene } from '../scenes/preload-scene'

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: '#0a0a0f',
    pixelArt: false,
    antialias: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [BootScene, PreloadScene],
  }
}
```

### Scene Keys — `packages/game-engine/src/scenes/scene-keys.ts`

```typescript
export const SceneKey = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MAP: 'MapScene',           // Added by world-and-maps
  COMBAT: 'CombatScene',     // Added by combat-system
  GAME_OVER: 'GameOverScene', // Added by player-and-roles
  RESULTS: 'ResultsScene',   // Added by session-economy
} as const

export type SceneKey = typeof SceneKey[keyof typeof SceneKey]
```

### EventBus — `packages/game-engine/src/events/event-bus.ts`

```typescript
import Phaser from 'phaser'

class GameEventBus extends Phaser.Events.EventEmitter {
  constructor() { super() }
}

export const eventBus = new GameEventBus()
```

### Event Constants — `packages/shared/src/constants/events/game.ts`

```typescript
export const GAME_EVENTS = {
  PRELOAD_COMPLETE: 'game:preload-complete',
  SCENE_CHANGED: 'game:scene-changed',
  PLAYER_DIED: 'game:player-died',
  RUN_STARTED: 'game:run-started',
  RUN_ENDED: 'game:run-ended',
  ZONE_ENTERED: 'game:zone-entered',
  ZONE_EXITED: 'game:zone-exited',
  ITEM_PICKED_UP: 'game:item-picked-up',
} as const

export type GameEventName = typeof GAME_EVENTS[keyof typeof GAME_EVENTS]
```

### Event Payload Types — `packages/shared/src/types/events/game.ts`

```typescript
export interface PlayerDiedPayload {
  causeOfDeath: 'combat' | 'evidence' | 'timeout'
  role: 'KILLER' | 'FED'
}

export interface SceneChangedPayload { from: string; to: string }

export interface ZoneEnteredPayload { zoneId: string; zoneName: string }

export interface PreloadCompletePayload {} // signal only
```

### Game Constants — `packages/shared/src/constants/game.ts`

```typescript
export const GAME_CONFIG = {
  TARGET_FPS: 60,
  PHYSICS_TICK_RATE: 60,
  AI_TICK_RATE: 12,
  BASE_RESOLUTION: { width: 1280, height: 720 },
  TILE_SIZE: 32,
  PLAYER_SPEED_WALK: 120,
  PLAYER_SPEED_RUN: 200,
  PLAYER_SPEED_SNEAK: 60,
  INTERACTION_RANGE: 48,
} as const
```

### Zustand Stores

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
  phase: 'idle', currentScene: null, fps: 0,
  setPhase: (phase) => set({ phase }),
  setCurrentScene: (currentScene) => set({ currentScene }),
  setFps: (fps) => set({ fps }),
}))
```

**`apps/web/src/stores/player.ts`** (stub — extended by the player and role framework):
```typescript
'use client'
import { create } from 'zustand'

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
  userId: null, displayName: null, health: 100, maxHealth: 100, position: null,
  setUserId: (userId) => set({ userId }),
  setDisplayName: (displayName) => set({ displayName }),
  setHealth: (health) => set({ health }),
  setPosition: (position) => set({ position }),
}))
```

### PhaserGame Component — `apps/web/src/components/app/game/phaser-game.tsx`

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
    async function initGame() {
      const { default: Phaser } = await import('phaser')
      const { createGameConfig } = await import('@repo/game-engine/config/game-config')
      const config = createGameConfig(PHASER_PARENT_ID)
      gameRef.current = new Phaser.Game(config)
      setPhase('loading')
    }

    initGame()

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
        setPhase('idle')
        setCurrentScene(null)
      }
    }
  }, [])

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

### Game Page and Layout

**`apps/web/src/app/game/layout.tsx`**:
```typescript
import type { ReactNode } from 'react'
export default function GameLayout({ children }: { children: ReactNode }) {
  return <div className="w-screen h-dvh overflow-hidden relative bg-background">{children}</div>
}
```

**`apps/web/src/app/game/page.tsx`**:
```typescript
import { PhaserGame } from '../../components/app/game/phaser-game'
export default function GamePage() {
  return (
    <main className="w-full h-full relative">
      <PhaserGame />
      {/* HUD overlay components added in later pieces */}
    </main>
  )
}
```

### Asset Loader — `packages/game-engine/src/utils/asset-loader.ts`

```typescript
import Phaser from 'phaser'

export type AssetTier = 'critical' | 'standard' | 'deferred'

export function getAssetUrl(relativePath: string, blobStorageBaseUrl?: string): string {
  return blobStorageBaseUrl
    ? `${blobStorageBaseUrl}/${relativePath}`
    : `/assets/${relativePath}`
}

export function loadImages(scene: Phaser.Scene, assets: Array<{key: string; path: string; tier: AssetTier}>) {
  assets.forEach(({ key, path }) => scene.load.image(key, path))
}

export function loadAtlases(scene: Phaser.Scene, atlases: Array<{key: string; imagePath: string; dataPath: string}>) {
  atlases.forEach(({ key, imagePath, dataPath }) => scene.load.atlas(key, imagePath, dataPath))
}

export function loadTilemaps(scene: Phaser.Scene, tilemaps: Array<{key: string; path: string}>) {
  tilemaps.forEach(({ key, path }) => scene.load.tilemapTiledJSON(key, path))
}
```

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| Phaser | 3.90.0 | In `packages/game-engine/` only — NEVER in apps/web directly |
| Zustand | latest | In `apps/web/` only |
| React | 19.2.4 | PhaserGame component uses useEffect, useRef |
| TypeScript | 5.9.3+ | Phaser ships its own types |

### Per-Domain Event File Architecture

Use per-domain event constant files instead of a single `events.ts` to prevent merge conflicts when multiple pieces add events in parallel (e.g., when killer and fed roles are built concurrently):

```
packages/shared/src/constants/events/game.ts       — game engine events (this piece)
packages/shared/src/constants/events/entity.ts     — NPC/entity events (entity and NPC system)
packages/shared/src/constants/events/combat.ts     — combat events (combat mechanics)
packages/shared/src/constants/events/evidence.ts   — evidence events (evidence system)
packages/shared/src/constants/events/killer.ts     — killer role events (killer core mechanics)
packages/shared/src/constants/events/fed.ts        — fed role events (fed core mechanics)
packages/shared/src/constants/events/economy.ts    — session economy events (session economy)
packages/shared/src/constants/events/multiplayer.ts — multiplayer sync events (multiplayer sync)
```

Same pattern applies for `packages/shared/src/types/events/` — per-domain type files. Each piece owns its domain file exclusively. No piece modifies another piece's event file. This eliminates all merge conflicts during parallel implementation.

This piece creates `events/game.ts` with the GAME_EVENTS constants. Downstream pieces each create their own domain file.

### Implementation Order

1. Add Phaser 3.90.0 to `packages/game-engine/package.json` (NOT to apps/web)
2. Add Zustand to `apps/web/package.json`
3. Create `packages/shared/src/constants/events/game.ts` — game engine event name constants
4. Create `packages/shared/src/types/events/game.ts` — game engine event payload types
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

**Unit tests** (`packages/shared/tests/constants/events/game.test.ts`):
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
- [x] III: Shared types in `packages/shared/src/types/events/game.ts`
- [x] VI: Domain-based organization — `game/` scenes, `events/` bus, `utils/` loader
- [x] VII: `"use client"` on PhaserGame component; Phaser scenes have no React imports
- [x] VIII: EventBus is a singleton (module-level instance); Phaser game instance managed via useRef
- [x] XIV: EventBus for one-time signals; Zustand for persistent state — correctly applied
- [x] XXVI: Tests in `tests/` at each package root
- [x] XXIX: Art Style Consistency — PostFXPipeline classes registered at boot via `registerPipelines(game)`; rendering directory structure established; art-style-guide.md consulted for shader specifications
- [x] XXX: Responsive canvas via `Phaser.Scale.FIT` mode
- [x] XXXII: Asset loading tiers implemented (Critical → Standard → Deferred)
- [x] XXXIII: Graceful Visual Degradation — PostFX pipeline registration is a boot-time step; game renders correctly if individual pipelines fail to register (degradation tiers apply)

### Art Style Integration

Register the PostFX shader pipeline in the Phaser game config. The `packages/game-engine/src/rendering/` directory holds all `PostFXPipeline` classes. The game config calls `registerPipelines(game)` from `packages/game-engine/src/rendering/index.ts` after game initialization — this function registers all shader pipelines without re-exporting the classes (boot registration entry point, not a barrel file). Simple shaders (<50 lines) are embedded as template literals in each pipeline class file. Complex shaders are extracted to `.frag` files and imported as raw strings. See `art-style-guide.md` in the vision directory for full PostFX visual specifications.

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
- `packages/shared/src/types/events/game.ts` — game engine event payload types
- `packages/shared/src/constants/events/game.ts` — `GAME_EVENTS` constants
- `packages/shared/src/constants/game.ts` — `GAME_CONFIG` constants
- `apps/web/src/stores/game.ts` — `useGameStore` (phase, currentScene, fps)
- `apps/web/src/stores/player.ts` — `usePlayerStore` stub (userId, displayName, health, position)
- `apps/web/src/components/app/game/phaser-game.tsx` — `PhaserGame` component
- `apps/web/src/app/game/layout.tsx` — full-screen game layout
- `apps/web/src/app/game/page.tsx` — game page hosting PhaserGame

### Dependencies Consumed (from Project Scaffold)

All of the following are produced by piece 01 and must be in place:

- **`packages/game-engine/` scaffold** — `package.json` with Phaser 3.90.0 listed, `tsconfig.json`, `vitest.config.mts` (per-package vitest config that extends from `vitest.shared.mts` at the monorepo root), `src/` directory
- **`packages/shared/src/types/` and `constants/` directories** — scaffold exists, ready to populate
- **Zustand** — listed in `apps/web/package.json` dependencies
- **`packages/shared/src/utils/result.ts`** — neverthrow utilities (not directly used in this piece but downstream pieces need them)

### Produces (for Downstream Pieces)

- **`createGameConfig`** — piece 05 (world-and-maps) adds `MapScene` to the scene list
- **`SceneKey`** — all subsequent scene pieces add their keys here
- **`eventBus`** — every downstream Phaser scene and React component uses this
- **`GAME_EVENTS`** constants (in `events/game.ts`) — downstream pieces create their own domain event files (entity.ts, combat.ts, etc.) in the same directory
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
