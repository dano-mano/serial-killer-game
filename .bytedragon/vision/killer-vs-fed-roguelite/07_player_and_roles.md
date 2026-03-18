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

This piece depends on several earlier systems. These are described here so this document is self-contained.

**Project scaffold** provides the shared Result type for fallible operations, a Pino logger singleton, and Zod-validated environment config. Game engine code must not import React; config is accessed via the centralized env module, never directly from process.env.

**Auth and profiles** provides Supabase client factories for browser and server use, the User and UserProfile types, and a profile lookup function. Authentication is required before a player can start a run — the role selection page must redirect unauthenticated users to login.

**Design system** provides the shared component library (AppButton, AppCard, AppDialog, AppInput, AppToast) and layout components (PageLayout, GameLayout, AuthLayout). All HUD and role selection UI uses these branded wrappers. Tailwind v4 CSS custom properties are available in all React components.

**Game engine bootstrap** provides the EventBus (emit and subscribe typed events), game constants (physics tick rate, base player speeds for walking, running, and sneaking), the game and player Zustand stores (the player store is extended by this piece), scene keys, and the tiered asset loader.

**World and maps** provides the spawn manager (get a player spawn point for the current map), the camera controller (which follows the player), and the main map scene where the player entity is added.

**Entity and NPC system** provides the base entity class that the player controller extends, the sprite manager (player uses the same `createCharacterSprite` call as NPCs), the interaction manager (player interactions are registered here), the NPC spawner (for querying NPCs during gameplay), and all entity and animation type definitions and constants.

### Player Character

The player controller is a game engine entity that extends the shared base entity class. It is driven by human input rather than AI — this is the only behavioral difference from an NPC. It must use the identical sprite creation call and animation key system as NPCs so that the player is visually indistinguishable from an NPC of the same appearance variant.

The player controller holds:
- The selected role for this run (Killer or Fed)
- The current movement mode (walking, running, or sneaking)
- A stamina pool that drains when running or sneaking and regenerates when walking or idle
- An input manager for reading keyboard state
- A role handler reference (set after role selection, implements the role interface)
- An action queue for processing player inputs into game events

The player controller emits EventBus events when health changes, when the player dies, when the player's position changes significantly, and when movement mode changes.

To create a player, a configuration object specifies the ID, starting position, role, and which NPC appearance variant to use (randomly selected at run start from the role's available skins, and fixed for the entire run).

### Player Data Model

The player's role is either Killer or Fed. Movement mode is one of walk, run, or sneak.

The player's state includes: role, health, maximum health, stamina, maximum stamina, current position, movement mode, a list of currently active ability IDs, and any active status effect IDs.

Each player ability has: an ID, name, description, cooldown duration, current remaining cooldown, resource cost (stamina or a role-specific resource), the role it belongs to, and a tier (tier 1 = available by default, tiers 2–3 = unlocked via progression).

Each role has a configuration defining: starting abilities, starting inventory items, base health and stamina pools, and movement speeds for each movement mode.

Player constants establish the baseline values for health (100), stamina (100), drain rates (stamina drains faster while running than sneaking, regenerates while walking or idle), the player's interaction radius in pixels (slightly larger than an NPC's), and a display label and description for each role.

### Input Handling

The input manager reads keyboard state each frame and provides a clean API to the player controller. It returns:
- The current movement vector based on held directional keys (normalized 0–1 per axis)
- Whether the run modifier key is held
- Whether the sneak modifier key is held
- Whether the interaction key was pressed this frame
- Which ability slot was triggered this frame (slots 1–4), or none
- Whether the inventory toggle was pressed this frame
- Whether the map toggle was pressed this frame

Key bindings are remappable. Default bindings: WASD for movement, Shift for run, Ctrl for sneak, E for interact, Q/F/R/T for ability slots 1–4, Tab for inventory, M for map. Saved bindings are persisted to local storage for accessibility.

The input actions are a defined enumeration covering all bindable player inputs.

### Role Framework

The role interface is the extensibility contract for both killer and fed roles. It defines:
- The role identifier
- How to get the current run objectives for display in the HUD
- How to get the abilities available to this role (filtered by progression loadout)
- How to get the HUD layout configuration (which panels to show)
- How to check win and lose conditions (called every tick)
- Lifecycle hooks: called when the run starts (initialize role state from the config), when the run ends (cleanup), and when the player takes an action (role may react)

Objectives have: an ID, a display description, a completion flag, a required flag (optional objectives give bonus score but don't block the win condition), and an optional progress tracker (current / total for countable goals).

HUD configuration specifies which standard panels to show (health bar, stamina bar, minimap, objectives) and an ordered list of role-specific panel IDs for the React HUD to render.

A role registry stores role factory functions keyed by role name. The run manager calls `roleRegistry.create(role)` to instantiate the appropriate role handler at run start. Roles register themselves with the registry on module initialization.

### Player Actions

Player actions are a typed event that flows through the EventBus. Each action has: an action type, an optional target entity ID, an optional world position, and optional additional data. The evidence system subscribes to PLAYER_ACTION events to generate appropriate forensic traces from killer actions.

Action types cover: context-sensitive interact (talk, examine, pick up), use ability, use consumable item, open/close inventory, open/close map, and change movement mode.

### In-Session Inventory

The inventory holds items collected during a run and resets between runs. It has a maximum slot count (12 by default). Items can be added, removed, and used. Consumable items produce a list of effects when used. Items can be queried by type, and stackable items have a stack count.

Inventory operations return typed results: adding an item fails if the inventory is full, removing fails if the item is not present, using fails if the item is not found or not a consumable.

Item types: weapon, tool, consumable, key item, evidence modifier, and disguise. Rarities: common, uncommon, rare, legendary.

Each item has: an ID, display name, description, type, rarity, whether it stacks, maximum stack size, a list of effects, which role may use it (or any role), and an icon key for the HUD.

Item effects describe modifications that activate when an item is used: damage bonus, evidence reduction, speed boost, health restore, stamina restore, stealth boost, detection range change, or custom. Effects have a numeric value and an optional duration (null means permanent for the run).

### Zustand Stores

The player Zustand store (extending the initial stub from game engine bootstrap) tracks: role, health, maximum health, stamina, maximum stamina, current position, movement mode, active abilities with cooldowns, current objectives, active status effect IDs, and in-session inventory. It exposes actions to update each of these fields.

A new HUD Zustand store tracks: whether the inventory panel is open, whether the map is open, a notification queue for transient toast messages, and the currently active interaction prompt. Notifications have a message, severity type (info, warning, success, danger), and a display duration.

### Run Manager

The run manager orchestrates the full run lifecycle. It initializes a run by generating the map, spawning the player at the designated spawn point, populating NPCs, and activating the role handler. It evaluates win and lose conditions each tick by delegating to the active role handler. It ends runs by collecting results and emitting the RUN_ENDED event.

A run configuration specifies: user ID, selected role, biome, deterministic seed (same seed produces the same map and NPC placement in multiplayer), and a loadout (initially stubbed; the persistent progression feature will populate this with skill and equipment data).

Run state tracks: run ID, user ID, role, biome, seed, start time, elapsed milliseconds, current objectives, completion flag, and outcome.

Outcomes are: win, loss, or abandoned. The run result records: run ID, user, role, biome, outcome, duration, score, materials earned, and which objectives were completed.

### HUD Components

Five React components form the in-game HUD overlay on top of the Phaser canvas. All are client components reading from Zustand:

- **Health bar**: shows the player's current health as a percentage bar that shifts from green through yellow to red as health decreases
- **Minimap**: shows a small overhead view of the map with the player's current position, revealing explored areas (fog of war aware)
- **Inventory panel**: shows a 12-slot grid of carried items with their icons; supports use and drop actions; toggles open and closed
- **Interaction prompt**: shows a floating prompt when an interactable entity is in range (e.g. "Press E to talk to Worker"), disappears when the player moves away
- **Objective tracker**: shows the current run objectives with completion checkmarks, styled to the current role

### Role Selection Page

Before starting a run, the player goes through a pre-run selection flow at the role selection page:
1. Choose Killer or Fed — each shown as a card with a role description, ability preview, and playstyle summary
2. Choose a biome — each shown with a difficulty rating and unlock status
3. (Loadout selection is stubbed initially and will be integrated by the persistent progression feature)
4. Confirm selection — starts the run and navigates to the game scene

The page uses AppCard and AppButton from the design system. It requires authentication — unauthenticated users are redirected to login by server middleware.

### EventBus Events

New events added for the player and run system:

- Player action event: emitted whenever the player takes an action (used by the evidence system)
- Player health changed: new health, maximum health, the delta, and the damage source
- Player died: player ID and cause of death
- Player role set: which role was chosen at run start
- Item picked up: the item and the player ID
- Item used: the item ID and the resulting effects
- Ability used: ability ID, player ID, and new cooldown duration
- Objective updated: which objective changed and whether it is now complete
- Run started: run ID, role, biome, and seed
- Run ended: run ID, outcome, and the full result object
- Movement mode changed: the new movement mode

### Edge Cases

- Player must be authenticated before role selection — middleware redirects unauthenticated users to login
- Player sprite variant is randomly selected from available NPC skins at run start and persists for the full run, so the opponent can build a mental image of what the player looks like
- When stamina reaches zero, the player automatically reverts to walk mode and cannot run or sneak until stamina regenerates
- When the inventory is full and the player tries to pick up an item, a toast notification appears and the item remains in the world for a brief window before disappearing
- The run manager must detect and reject nested run starts — if `initRun` is called while a run is already active, log a warning and return an error

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

The player controller and role framework are the junction point between the game engine (Phaser, packages/game-engine) and the React application layer (apps/web). The role interface ensures that the killer and fed role implementations can each implement their role without touching each other's code. The role registry is how the game engine discovers and instantiates the correct role at run start.

Run manager orchestrates the entire run lifecycle. It is a singleton in the game engine package, coordinating between the map scene, NPC spawner, player controller, and role handler.

### Shared Types and Constants

**File**: `packages/shared/src/types/player.ts`

```typescript
type PlayerRole = 'KILLER' | 'FED'
type MovementMode = 'WALK' | 'RUN' | 'SNEAK'

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
  resourceCost: number
  role: PlayerRole
  tier: number
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
const PLAYER_INTERACTION_RADIUS = 64 // pixels
const ROLES: Record<PlayerRole, { label: string; description: string }>
```

**File**: `packages/shared/src/types/inventory.ts`

```typescript
type ItemType = 'WEAPON' | 'TOOL' | 'CONSUMABLE' | 'KEY_ITEM' | 'EVIDENCE_MOD' | 'DISGUISE'
type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY'

type ItemEffect = {
  type: 'DAMAGE_BONUS' | 'EVIDENCE_REDUCTION' | 'SPEED_BOOST' | 'HEALTH_RESTORE'
        | 'STAMINA_RESTORE' | 'STEALTH_BOOST' | 'DETECTION_RANGE' | 'CUSTOM'
  value: number
  durationMs: number | null
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
  role: PlayerRole | 'ANY'
  iconKey: string
}
```

**File**: `packages/shared/src/types/run.ts`

```typescript
type RunConfig = {
  userId: string
  role: PlayerRole
  biome: Biome
  seed: string
  loadout: Loadout
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

### PlayerController Signature

**File**: `packages/game-engine/src/player/player-controller.ts`

```typescript
class PlayerController extends BaseEntity {
  role: PlayerRole
  movementMode: MovementMode
  stamina: number
  maxStamina: number
  inputManager: InputManager
  roleHandler: RoleInterface | null
  actionQueue: PlayerAction[]

  constructor(config: PlayerConfig, scene: Phaser.Scene): PlayerController
  update(delta: number): void
  setRole(role: PlayerRole, handler: RoleInterface): void
  useAbility(abilityId: string): boolean
  performAction(action: PlayerAction): void
}

type PlayerConfig = {
  id: string
  startPos: Vec2
  role: PlayerRole
  spriteVariant: number
}
```

### InputManager Signature

**File**: `packages/game-engine/src/player/input-manager.ts`

```typescript
class InputManager {
  constructor(scene: Phaser.Scene)
  getMovementVector(): Vec2
  isRunHeld(): boolean
  isSneakHeld(): boolean
  getInteractionInput(): boolean
  getAbilityInput(): string | null
  getInventoryToggle(): boolean
  getMapToggle(): boolean
  rebindKey(action: InputAction, key: Phaser.Input.Keyboard.Key): void
  loadSavedBindings(): void
}

type InputAction = 'MOVE_UP' | 'MOVE_DOWN' | 'MOVE_LEFT' | 'MOVE_RIGHT'
  | 'RUN' | 'SNEAK' | 'INTERACT' | 'ABILITY_1' | 'ABILITY_2' | 'ABILITY_3' | 'ABILITY_4'
  | 'INVENTORY' | 'MAP'

// Default bindings: WASD movement, Shift=RUN, Ctrl=SNEAK, E=INTERACT
// Q=ABILITY_1, F=ABILITY_2, R=ABILITY_3, T=ABILITY_4, Tab=INVENTORY, M=MAP
```

### Role Interface and Registry Signatures

**File**: `packages/game-engine/src/player/roles/role-interface.ts`

```typescript
interface RoleInterface {
  readonly role: PlayerRole
  getObjectives(): RoleObjective[]
  getAbilities(): PlayerAbility[]
  getHUDConfig(): HUDConfig
  checkWinCondition(state: RunState): boolean
  checkLoseCondition(state: RunState): boolean
  onRunStart(config: RunConfig): void
  onRunEnd(result: RunResult): void
  onPlayerAction(action: PlayerAction): void
}

type RoleObjective = {
  id: string
  description: string
  isComplete: boolean
  isRequired: boolean
  progress?: { current: number; total: number }
}

type HUDConfig = {
  showHealthBar: boolean
  showStaminaBar: boolean
  showMinimap: boolean
  showObjectives: boolean
  roleSpecificPanels: string[]
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

### Player Action Types

**File**: `packages/game-engine/src/player/player-actions.ts`

```typescript
type PlayerAction = {
  type: PlayerActionType
  targetId?: string
  pos?: Vec2
  data?: Record<string, unknown>
}

type PlayerActionType =
  | 'INTERACT'
  | 'USE_ABILITY'
  | 'USE_ITEM'
  | 'OPEN_INVENTORY'
  | 'CLOSE_INVENTORY'
  | 'OPEN_MAP'
  | 'CLOSE_MAP'
  | 'CHANGE_MOVEMENT_MODE'
```

### Inventory Signature

**File**: `packages/game-engine/src/player/inventory.ts`

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

### Run Manager Signature

**File**: `packages/game-engine/src/run/run-manager.ts`

```typescript
class RunManager {
  initRun(config: RunConfig): Promise<Result<RunState, AppError>>
  update(delta: number): void
  endRun(outcome: RunOutcome): RunResult
  getCurrentState(): RunState
}
```

### Zustand Store Types

**File**: `apps/web/src/stores/player.ts` (extended)

```typescript
type PlayerStore = {
  // existing from game-engine-bootstrap
  health: number
  position: Vec2
  inventory: InventoryItem[]
  // added by this piece
  role: PlayerRole | null
  maxHealth: number
  stamina: number
  maxStamina: number
  movementMode: MovementMode
  abilities: PlayerAbility[]
  objectives: RoleObjective[]
  statusEffects: string[]
  // actions
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
  label: string
  key: string
}
```

### EventBus Event Types

Added to `packages/shared/src/types/events.ts`:

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

The role framework is the key extensibility point in this piece. Piece 11 (killer-core-mechanics) and piece 13 (fed-core-mechanics) each implement `RoleInterface` and register themselves in `RoleRegistry`. The clean interface means neither piece needs to know about the other. The run manager just calls `roleRegistry.create(config.role)` and everything flows from there.

The sprite variant system (player randomly gets one of the NPC skins) is subtle but important: it means the killer and fed look like ordinary NPCs, but each has a consistent visual appearance within a run. Over time, the fed can learn "the killer has that brown jacket" based on witness descriptions, before the killer can change disguise.
