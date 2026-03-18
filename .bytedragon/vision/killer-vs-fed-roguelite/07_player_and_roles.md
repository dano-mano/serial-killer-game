---
vision: killer-vs-fed-roguelite
sequence: 07
name: player-and-roles
group: Core Gameplay
group_order: 3
status: pending
depends_on:
  - "01: Result utilities, shared type scaffold, Pino logger, environment config"
  - "02: Auth session (required for run start), user profile (display name in HUD), Supabase client factories"
  - "03: Design system components (AppButton, AppCard, AppDialog) for HUD and role selection page"
  - "04: EventBus, game constants, Zustand game store, scene manager"
  - "05: Spawn manager (player spawn point), camera controller, map scene"
  - "06: BaseEntity (PlayerController extends it), SpriteManager, InteractionManager, NPCSpawner, entity types"
produces:
  - "Player controller extending base entity with keyboard/mouse input"
  - "Player types: PlayerRole, PlayerState, PlayerAbility, RoleConfig"
  - "Input manager: keyboard bindings, mouse interaction, customizable controls"
  - "Role interface: getObjectives(), getAbilities(), getHUDConfig(), checkWinCondition(), checkLoseCondition()"
  - "Role registry for registering and retrieving role implementations"
  - "Player action system: interact, use-ability, open-inventory, open-map"
  - "In-session inventory: item management during a run"
  - "Inventory types: InventoryItem, ItemType, ItemRarity, ItemEffect"
  - "Player Zustand store: role, inventory, abilities, objectives, health"
  - "HUD store: panel state, notification queue"
  - "Run manager: run lifecycle init → play → end"
  - "Run types: RunConfig, RunState, RunResult"
  - "HUD components: HealthBar, Minimap, InventoryPanel, InteractionPrompt, ObjectiveTracker"
  - "Role selection page at /game/select-role"
created: 2026-03-17
last_aligned: never
---

# Vision Piece 07: Player and Roles

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: project-scaffold, auth-and-profiles, design-system, game-engine-bootstrap, world-and-maps, entity-and-npc-system

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Implement the player character controller, input handling, inventory system, and role selection framework for an asymmetric roguelite. The player character uses the same base entity class and sprite system as NPCs — this is the disguise mechanic's foundation. Role selection (Killer or Fed) happens before each run, and the role framework provides a clean abstraction for the killer-gameplay and fed-gameplay features to implement their specific behavior without coupling to each other.

### Dependency Context (Inline)

This piece depends on outputs from multiple earlier pieces. These are reproduced here in full so this document is self-contained:

**From project-scaffold**:
```
packages/shared/src/utils/result.ts:
  - ok<T>(value: T): Ok<T, never>
  - err<E>(error: E): Err<never, E>
  - type AppError = { code: string; message: string }
  - type ValidationError extends AppError
apps/web/src/lib/logger/pino.ts — Pino singleton
apps/web/src/config/env.ts — Zod-validated env vars (no direct process.env)
```

**From auth-and-profiles**:
```typescript
// apps/web/src/lib/supabase/client.ts — browser client
// apps/web/src/lib/supabase/server.ts — server client (cookies)
// packages/shared/src/types/auth.ts
type User = { id: string; email: string }
type UserProfile = { id: string; display_name: string; avatar_url: string | null }
type AuthSession = { user: User; profile: UserProfile }
// apps/web/src/dal/auth/profiles.ts
function getProfile(userId: string): Promise<Result<UserProfile, NotFoundError | DatabaseError>>
// Auth is required before a player can start a run
```

**From design-system**:
```typescript
// apps/web/src/components/app/common/
// AppButton, AppCard, AppDialog, AppInput, AppToast — branded wrappers
// Layout components: PageLayout, GameLayout, AuthLayout
// apps/web/src/components/app/common/theme-provider.tsx
// Tailwind v4 CSS custom properties for colors/spacing via globals.css @theme inline
```

**From game-engine-bootstrap**:
```typescript
// packages/game-engine/src/events/event-bus.ts
eventBus.emit<K>(event: K, payload: GameEvents[K]): void
eventBus.on<K>(event: K, handler: (payload: GameEvents[K]) => void): void

// packages/shared/src/constants/game.ts
TICK_RATE: number          // physics tick rate
PLAYER_BASE_SPEED: number  // pixels/second walking
PLAYER_RUN_SPEED: number
PLAYER_SNEAK_SPEED: number

// apps/web/src/stores/game.ts — { isRunning, isPaused, currentScene }
// apps/web/src/stores/player.ts — extended by this piece
// packages/game-engine/src/scenes/scene-keys.ts — SceneKey enum
// packages/game-engine/src/utils/asset-loader.ts — tiered asset loading
```

**From world-and-maps**:
```typescript
// packages/game-engine/src/world/spawn-manager.ts
function getSpawnPoint(type: 'PLAYER' | 'NPC' | 'ITEM' | 'EXIT'): SpawnPoint | null
// packages/game-engine/src/world/camera-controller.ts — follow player
// packages/game-engine/src/scenes/map-scene.ts — player added here
```

**From entity-and-npc-system**:
```typescript
// packages/game-engine/src/entities/base-entity.ts
abstract class BaseEntity {
  readonly id: string
  pos: Vec2; velocity: Vec2
  sprite: Phaser.GameObjects.Sprite
  animState: AnimationState
  collisionBody: Phaser.Physics.Arcade.Body
  health: number | null; maxHealth: number | null
  interactionRadius: number
  entityType: EntityType
  abstract update(delta: number): void
  takeDamage(amount: number, source: string): void
  heal(amount: number): void
  setAnimation(key: AnimationKey, direction: Direction): void
}
// packages/game-engine/src/entities/sprite-manager.ts — createCharacterSprite()
// packages/game-engine/src/entities/interaction-manager.ts — register player interactions
// packages/game-engine/src/entities/npc-spawner.ts — getNPCById(), getAllNPCs()
// packages/shared/src/types/entity.ts — EntityType, EntityState, AnimationKey, Direction
// packages/shared/src/constants/entities.ts — NPC_INTERACTION_RADIUS, ANIMATION_KEYS
```

### Player Controller

**File**: `packages/game-engine/src/player/player-controller.ts`

Extends `BaseEntity`. Driven by human input rather than AI. MUST use identical sprite system as NPCs (same `SpriteManager.createCharacterSprite()` call, same animation keys):

```typescript
class PlayerController extends BaseEntity {
  role: PlayerRole
  movementMode: MovementMode    // WALK | RUN | SNEAK
  stamina: number               // 0-100, running drains, sneaking drains slowly
  maxStamina: number
  inputManager: InputManager
  roleHandler: RoleInterface | null  // set after role selection
  actionQueue: PlayerAction[]

  constructor(config: PlayerConfig, scene: Phaser.Scene): PlayerController
  update(delta: number): void
  setRole(role: PlayerRole, handler: RoleInterface): void
  useAbility(abilityId: string): boolean
  performAction(action: PlayerAction): void
  // Emits EventBus events on health change, death, position change
}

type MovementMode = 'WALK' | 'RUN' | 'SNEAK'
type PlayerConfig = {
  id: string
  startPos: Vec2
  role: PlayerRole
  spriteVariant: number   // which NPC skin to use — chosen at run start
}
```

### Shared Types

**File**: `packages/shared/src/types/player.ts`

```typescript
type PlayerRole = 'KILLER' | 'FED'

type PlayerState = {
  id: string
  role: PlayerRole
  health: number
  maxHealth: number
  stamina: number
  pos: Vec2
  movementMode: MovementMode
  activeAbilities: string[]
  statusEffects: string[]
}

type PlayerAbility = {
  id: string
  name: string
  description: string
  cooldownMs: number
  currentCooldownMs: number
  resourceCost: number    // stamina or special resource
  role: PlayerRole
  tier: number            // 1 = default, 2-3 = unlocked via progression
}

type RoleConfig = {
  role: PlayerRole
  startingAbilities: PlayerAbility[]
  startingItems: InventoryItem[]
  baseHealth: number
  baseStamina: number
  movementSpeeds: Record<MovementMode, number>
}
```

**File**: `packages/shared/src/constants/player.ts`

```typescript
const PLAYER_BASE_HEALTH = 100
const PLAYER_BASE_STAMINA = 100
const STAMINA_RUN_DRAIN_RATE = 15    // per second while running
const STAMINA_SNEAK_DRAIN_RATE = 5   // per second while sneaking
const STAMINA_REGEN_RATE = 10        // per second while walking/idle
const PLAYER_INTERACTION_RADIUS = 64 // pixels (slightly larger than NPC)
const ROLES: Record<PlayerRole, { label: string; description: string }>
```

### Input Manager

**File**: `packages/game-engine/src/player/input-manager.ts`

Handles keyboard and mouse input with support for remappable controls:

```typescript
class InputManager {
  constructor(scene: Phaser.Scene)
  // Returns current movement vector based on held keys
  getMovementVector(): Vec2  // normalized, 0-1 each axis
  // Returns whether run modifier is held
  isRunHeld(): boolean
  // Returns whether sneak modifier is held
  isSneakHeld(): boolean
  // Returns interaction trigger this frame
  getInteractionInput(): boolean
  // Returns ability ID triggered this frame (1-4 ability slots)
  getAbilityInput(): string | null
  // Returns inventory toggle trigger
  getInventoryToggle(): boolean
  // Returns map toggle trigger
  getMapToggle(): boolean
  // Remaps a key binding
  rebindKey(action: InputAction, key: Phaser.Input.Keyboard.Key): void
  // Loads saved bindings from localStorage (persistence for accessibility)
  loadSavedBindings(): void
}

type InputAction = 'MOVE_UP' | 'MOVE_DOWN' | 'MOVE_LEFT' | 'MOVE_RIGHT'
  | 'RUN' | 'SNEAK' | 'INTERACT' | 'ABILITY_1' | 'ABILITY_2' | 'ABILITY_3' | 'ABILITY_4'
  | 'INVENTORY' | 'MAP'

// Default bindings:
// MOVE: WASD, RUN: Shift, SNEAK: Ctrl, INTERACT: E
// ABILITY_1: Q, ABILITY_2: F, ABILITY_3: R, ABILITY_4: T
// INVENTORY: Tab, MAP: M
```

### Role Framework

**File**: `packages/game-engine/src/player/roles/role-interface.ts`

```typescript
interface RoleInterface {
  readonly role: PlayerRole
  // Returns current run objectives for this role
  getObjectives(): RoleObjective[]
  // Returns abilities available to this role (modified by progression loadout)
  getAbilities(): PlayerAbility[]
  // Returns HUD configuration (which panels to show, layout hints)
  getHUDConfig(): HUDConfig
  // Returns true if win condition is met — called every game tick
  checkWinCondition(state: RunState): boolean
  // Returns true if lose condition is met — called every game tick
  checkLoseCondition(state: RunState): boolean
  // Called when run starts — initializes role state
  onRunStart(config: RunConfig): void
  // Called when run ends — cleanup
  onRunEnd(result: RunResult): void
  // Called when player performs an action — role may react
  onPlayerAction(action: PlayerAction): void
}

type RoleObjective = {
  id: string
  description: string
  isComplete: boolean
  isRequired: boolean   // optional objectives give bonus score
  progress?: { current: number; total: number }
}

type HUDConfig = {
  showHealthBar: boolean
  showStaminaBar: boolean
  showMinimap: boolean
  showObjectives: boolean
  roleSpecificPanels: string[]  // IDs of role-specific HUD panels to render
}
```

**File**: `packages/game-engine/src/player/roles/role-registry.ts`

```typescript
class RoleRegistry {
  register(role: PlayerRole, factory: () => RoleInterface): void
  create(role: PlayerRole): RoleInterface
  isRegistered(role: PlayerRole): boolean
}
export const roleRegistry: RoleRegistry
```

### Player Actions

**File**: `packages/game-engine/src/player/player-actions.ts`

```typescript
type PlayerAction = {
  type: PlayerActionType
  targetId?: string      // entity ID if action targets an entity
  pos?: Vec2             // world position if action targets a location
  data?: Record<string, unknown>
}

type PlayerActionType =
  | 'INTERACT'           // context-sensitive: talk/examine/pickup
  | 'USE_ABILITY'        // triggers ability slot
  | 'USE_ITEM'           // uses consumable from inventory
  | 'OPEN_INVENTORY'
  | 'CLOSE_INVENTORY'
  | 'OPEN_MAP'
  | 'CLOSE_MAP'
  | 'CHANGE_MOVEMENT_MODE'

// Player actions are emitted as EventBus PLAYER_ACTION events so the evidence system
// can intercept them and generate appropriate evidence
```

### Inventory System

**File**: `packages/game-engine/src/player/inventory.ts`

In-session inventory. Items collected during a run. Resets between runs:

```typescript
class Inventory {
  readonly maxSlots: number   // 12 default
  items: InventoryItem[]

  addItem(item: InventoryItem): Result<void, 'INVENTORY_FULL'>
  removeItem(itemId: string): Result<InventoryItem, NotFoundError>
  useItem(itemId: string): Result<ItemEffect[], NotFoundError | 'NOT_CONSUMABLE'>
  hasItem(itemId: string): boolean
  getItemsByType(type: ItemType): InventoryItem[]
  getStackCount(itemId: string): number
}
```

**File**: `packages/shared/src/types/inventory.ts`

```typescript
type ItemType = 'WEAPON' | 'TOOL' | 'CONSUMABLE' | 'KEY_ITEM' | 'EVIDENCE_MOD' | 'DISGUISE'

type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY'

type ItemEffect = {
  type: 'DAMAGE_BONUS' | 'EVIDENCE_REDUCTION' | 'SPEED_BOOST' | 'HEALTH_RESTORE'
        | 'STAMINA_RESTORE' | 'STEALTH_BOOST' | 'DETECTION_RANGE' | 'CUSTOM'
  value: number
  durationMs: number | null   // null = permanent for run
}

type InventoryItem = {
  id: string
  name: string
  description: string
  type: ItemType
  rarity: ItemRarity
  stackable: boolean
  maxStack: number
  effects: ItemEffect[]
  role: PlayerRole | 'ANY'    // role-restricted items
  iconKey: string
}
```

### Zustand Stores

**File**: `apps/web/src/stores/player.ts` (extended from game-engine-bootstrap)

```typescript
type PlayerStore = {
  // From game-engine-bootstrap (existing)
  health: number
  position: Vec2
  inventory: InventoryItem[]
  // Added by this piece
  role: PlayerRole | null
  maxHealth: number
  stamina: number
  maxStamina: number
  movementMode: MovementMode
  abilities: PlayerAbility[]
  objectives: RoleObjective[]
  statusEffects: string[]
  // Actions
  setRole: (role: PlayerRole) => void
  updateHealth: (health: number) => void
  updateStamina: (stamina: number) => void
  updateObjectives: (objectives: RoleObjective[]) => void
  addItem: (item: InventoryItem) => void
  removeItem: (itemId: string) => void
  updateAbilityCooldown: (abilityId: string, cooldownMs: number) => void
}
```

**File**: `apps/web/src/stores/hud.ts` (new)

```typescript
type HUDStore = {
  isInventoryOpen: boolean
  isMapOpen: boolean
  notifications: HUDNotification[]
  activePrompt: InteractionPrompt | null
  // Actions
  toggleInventory: () => void
  toggleMap: () => void
  addNotification: (n: HUDNotification) => void
  dismissNotification: (id: string) => void
  setActivePrompt: (prompt: InteractionPrompt | null) => void
}

type HUDNotification = {
  id: string
  message: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER'
  durationMs: number
}

type InteractionPrompt = {
  entityId: string
  label: string       // e.g. "Talk to Worker" or "Examine Body"
  key: string         // input key hint e.g. "E"
}
```

### Run Manager

**File**: `packages/game-engine/src/run/run-manager.ts`

```typescript
class RunManager {
  // Starts a new run: generates map, spawns player, spawns NPCs, initializes role
  initRun(config: RunConfig): Promise<Result<RunState, AppError>>
  // Called each tick — checks win/lose conditions via role handler
  update(delta: number): void
  // Ends the run — collects results, emits RUN_ENDED event
  endRun(outcome: RunOutcome): RunResult
  getCurrentState(): RunState
}

type RunConfig = {
  userId: string
  role: PlayerRole
  biome: Biome
  seed: string         // deterministic map + NPC generation
  loadout: Loadout     // from persistent progression (stubbed initially, populated by the progression feature)
}

type RunState = {
  runId: string
  userId: string
  role: PlayerRole
  biome: Biome
  seed: string
  startTime: number
  elapsedMs: number
  objectives: RoleObjective[]
  isComplete: boolean
  outcome: RunOutcome | null
}

type RunOutcome = 'WIN' | 'LOSS' | 'ABANDONED'

type RunResult = {
  runId: string
  userId: string
  role: PlayerRole
  biome: Biome
  outcome: RunOutcome
  durationMs: number
  score: number
  materialsEarned: Record<string, number>
  objectivesCompleted: string[]
}
```

**File**: `packages/shared/src/types/run.ts` — exports `RunConfig`, `RunState`, `RunResult`, `RunOutcome`

### HUD Components

All HUD components are React ("use client"), read from Zustand stores, rendered as an overlay on the Phaser canvas:

**File**: `apps/web/src/components/app/game/hud/HealthBar.tsx`
- Reads: `playerStore.health`, `playerStore.maxHealth`
- Shows: health percentage bar with color gradient (green → yellow → red)

**File**: `apps/web/src/components/app/game/hud/Minimap.tsx`
- Reads: `playerStore.position` + minimap data from Zustand (fog-of-war aware)
- Shows: small map with player position dot, explored areas

**File**: `apps/web/src/components/app/game/hud/InventoryPanel.tsx`
- Reads: `playerStore.inventory`, `hudStore.isInventoryOpen`
- Shows: 12-slot grid, item icons, use/drop actions
- Triggers: `hudStore.toggleInventory()` on close

**File**: `apps/web/src/components/app/game/hud/InteractionPrompt.tsx`
- Reads: `hudStore.activePrompt`
- Shows: floating prompt near player (e.g. "[E] Talk to Worker"), disappears when player moves away

**File**: `apps/web/src/components/app/game/hud/ObjectiveTracker.tsx`
- Reads: `playerStore.objectives`
- Shows: current objectives with completion checkmarks, role-appropriate styling

### Role Selection Page

**File**: `apps/web/src/app/game/select-role/page.tsx`

Pre-run flow (all before entering a run):
1. Role selection: Killer or Fed cards with description, ability preview, playstyle summary
2. Biome selection: Available biomes with difficulty rating and unlock status
3. (Future: loadout selection — stubbed initially, integrated by the persistent-progression feature)
4. Confirm → calls `RunManager.initRun(config)` → navigates to `/game`

Uses AppCard, AppButton from design-system. Protected by auth (redirect to login if no session).

### EventBus Integration

New events added to GameEvents interface:

```typescript
PLAYER_ACTION: { action: PlayerAction; playerId: string; timestamp: number }
PLAYER_HEALTH_CHANGED: { health: number; maxHealth: number; delta: number; source: string }
PLAYER_DIED: { playerId: string; cause: string }
PLAYER_ROLE_SET: { role: PlayerRole }
ITEM_PICKED_UP: { item: InventoryItem; playerId: string }
ITEM_USED: { itemId: string; effects: ItemEffect[] }
ABILITY_USED: { abilityId: string; playerId: string; cooldownMs: number }
OBJECTIVE_UPDATED: { objectiveId: string; isComplete: boolean }
RUN_STARTED: { runId: string; role: PlayerRole; biome: Biome; seed: string }
RUN_ENDED: { runId: string; outcome: RunOutcome; result: RunResult }
MOVEMENT_MODE_CHANGED: { mode: MovementMode }
```

### Edge Cases

- Player must be authenticated (auth session exists) before role selection — middleware redirects if not logged in
- Player sprite variant is randomly selected from available NPC skins at run start — persists for the full run so the opponent can build a mental image of what the player looks like
- Stamina runs out: player auto-reverts to WALK mode (cannot run/sneak with 0 stamina)
- Inventory full: attempting to pick up an item shows a toast via `hudStore.addNotification()` — item stays in world for a short time
- Run manager must handle the case where `initRun()` is called while a run is already active — log warning and return error (no nested runs)

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

The player controller and role framework are the junction point between the game engine (Phaser, packages/game-engine) and the React application layer (apps/web). The role interface ensures that the killer and fed role implementations can each implement their role without touching each other's code. The role registry is how the game engine discovers and instantiates the correct role at run start.

Run manager orchestrates the entire run lifecycle. It is a singleton in the game engine package, coordinating between the map scene, NPC spawner, player controller, and role handler.

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| Zustand | latest | Player and HUD stores in apps/web |
| Phaser | 3.90.0 | PlayerController extends BaseEntity |
| next-safe-action | latest | Role selection Server Action if needed |
| TypeScript | 5.9.3 | Strict types throughout |

### Testing Strategy

- Unit tests for InputManager key binding logic (rebind, load saved)
- Unit tests for Inventory (add/remove/use, stack limits, role restrictions)
- Unit tests for RunManager lifecycle (initRun, endRun, state transitions)
- Unit tests for RoleRegistry (register, create, unknown role error)
- Component tests for HUD components (HealthBar renders correct width at various health values)
- Component tests for RoleSelectionPage (renders both roles, disabled on unauthenticated)
- E2E: navigate to /game/select-role, select Killer, confirm, game scene loads

### File Structure

```
packages/game-engine/src/
  player/
    player-controller.ts
    input-manager.ts
    player-actions.ts
    inventory.ts
    roles/
      role-interface.ts
      role-registry.ts
  run/
    run-manager.ts
packages/shared/src/
  types/
    player.ts
    inventory.ts
    run.ts
  constants/
    player.ts
apps/web/src/
  stores/
    player.ts    (extended)
    hud.ts       (new)
  components/app/game/hud/
    HealthBar.tsx
    Minimap.tsx
    InventoryPanel.tsx
    InteractionPrompt.tsx
    ObjectiveTracker.tsx
  app/game/
    select-role/page.tsx
    page.tsx     (game canvas page, updated to render HUD overlay)
    layout.tsx   (game layout, full-screen)
```

### Constitution Compliance

- [x] No barrel files — all imports direct to specific files
- [x] No React in game-engine package — PlayerController, InputManager, Inventory, RunManager all in game-engine
- [x] HUD components are React in apps/web, reading Zustand
- [x] EventBus for signals (PLAYER_DIED, RUN_ENDED, ITEM_PICKED_UP)
- [x] Zustand for persistent state (health, inventory, objectives)
- [x] Result<T,E> for inventory mutations, run init
- [x] Auth required before run start (redirect in page component)
- [x] Accessibility: remappable controls, keyboard navigation for role selection page

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

- `packages/game-engine/src/player/player-controller.ts`
- `packages/game-engine/src/player/input-manager.ts`
- `packages/game-engine/src/player/player-actions.ts`
- `packages/game-engine/src/player/inventory.ts`
- `packages/game-engine/src/player/roles/role-interface.ts`
- `packages/game-engine/src/player/roles/role-registry.ts`
- `packages/game-engine/src/run/run-manager.ts`
- `packages/shared/src/types/player.ts`, `inventory.ts`, `run.ts`
- `packages/shared/src/constants/player.ts`
- `apps/web/src/stores/player.ts` (extended), `hud.ts` (new)
- `apps/web/src/components/app/game/hud/` — all 5 HUD components
- `apps/web/src/app/game/select-role/page.tsx`

### Dependencies (Consumed from Earlier Pieces)

- Piece 01: Result utilities, shared type scaffold, Pino logger
- Piece 02: Auth session (required for run start), user profile (display name in HUD)
- Piece 03: Design system components for HUD and role selection page
- Piece 04: EventBus, game constants, Zustand game store (extended), scene manager
- Piece 05: Spawn manager (player spawn point), camera controller, map scene
- Piece 06: BaseEntity (PlayerController extends it), SpriteManager, InteractionManager

### Success Criteria

- [ ] Player spawns at correct spawn point on run start
- [ ] Player sprite is visually indistinguishable from NPCs of the same variant
- [ ] WASD movement, run (Shift), sneak (Ctrl) all work correctly
- [ ] Stamina drains on run/sneak, regenerates on walk, auto-reverts on empty
- [ ] Inventory accepts items up to max slots, rejects with notification when full
- [ ] Role interface registered for both KILLER and FED before run starts
- [ ] Win/lose condition checks run each tick and trigger RUN_ENDED event
- [ ] All 5 HUD components render and update reactively via Zustand
- [ ] Role selection page requires authentication (redirect if not logged in)

### Alignment Notes

The role framework is the key extensibility point in this piece. Piece 10 (killer-gameplay) and piece 11 (fed-gameplay) each implement `RoleInterface` and register themselves in `RoleRegistry`. The clean interface means neither piece needs to know about the other. The run manager just calls `roleRegistry.create(config.role)` and everything flows from there.

The sprite variant system (player randomly gets one of the NPC skins) is subtle but important: it means the killer and fed look like ordinary NPCs, but each has a consistent visual appearance within a run. Over time, the fed can learn "the killer has that brown jacket" based on witness descriptions, before the killer can change disguise.
