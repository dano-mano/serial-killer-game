---
vision: killer-vs-fed-roguelite
sequence: 06
name: entity-and-npc-system
group: Core Engine
group_order: 2
status: pending
depends_on:
  - "01: Result utilities, Pino logger, shared types scaffold, environment config"
  - "04: EventBus, Phaser game config, scene keys, Zustand game store"
  - "05: World/map data, biome types, pathfinding, zone manager, spawn manager, collision layer (line-of-sight), map scene"
produces:
  - "Base entity class with position, velocity, sprite, animation, collision, health, interaction radius"
  - "Entity types: Entity, EntityType, EntityState, NPCBehavior, NPCRoutine, NPCRole"
  - "NPC class with AI controller and routine system"
  - "Behavior tree engine: Selector, Sequence, Condition, Action nodes"
  - "NPC routines: patrol, idle, work, commute, socialize, flee"
  - "NPC role compositions: resident, worker, pedestrian, shopkeeper"
  - "Interaction manager for proximity-based player/NPC interaction"
  - "Sprite manager for character atlas loading and animation"
  - "NPC perception system (line-of-sight suspicion detection)"
  - "NPC spawner: populates zones with role-appropriate NPCs"
  - "Behavioral variation system to prevent robotic-looking patterns"
  - "Entity store bridge: EventBus events for NPC state changes HUD needs"
created: 2026-03-17
last_aligned: never
---

# Vision Piece 06: Entity and NPC System

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: project-scaffold, game-engine-bootstrap, world-and-maps

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Build the entity framework and NPC AI system for an asymmetric roguelite game. NPCs must exhibit believable behavioral routines — walking patterns, entering/exiting buildings, stopping to chat, working tasks, commuting — because the disguise mechanic requires that a human player blending in as an NPC is visually and behaviorally indistinguishable from actual NPCs. The AI behavior system is the backbone of the game's social deduction and stealth mechanics.

### Dependency Context (Inline)

This piece depends on outputs from three earlier pieces. These are reproduced here in full so this document is self-contained:

**Monorepo structure** (from project-scaffold):
```
packages/game-engine/src/   — Phaser code, MUST NOT import React
packages/shared/src/types/  — Shared TypeScript types
packages/shared/src/constants/ — Shared constants
packages/shared/src/utils/result.ts — neverthrow Result<T,E>
  - ok<T>(value: T): Ok<T, never>
  - err<E>(error: E): Err<never, E>
  - type AppError = { code: string; message: string }
  - type ValidationError extends AppError
  - type NotFoundError extends AppError
apps/web/src/lib/logger/pino.ts — Pino singleton (logger.info, logger.error, etc.)
```

**Game engine bootstrap** (from game-engine-bootstrap):
```typescript
// packages/game-engine/src/events/event-bus.ts
class EventBus {
  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void
  on<K extends keyof GameEvents>(event: K, handler: (payload: GameEvents[K]) => void): void
  off<K extends keyof GameEvents>(event: K, handler: (payload: GameEvents[K]) => void): void
}
export const eventBus: EventBus

// packages/shared/src/types/events.ts — GameEvents interface (extended by each piece)
// packages/shared/src/constants/events.ts — event name string constants
// packages/shared/src/constants/game.ts — TICK_RATE, PHYSICS_GRAVITY, GAME_WIDTH, GAME_HEIGHT
// packages/game-engine/src/scenes/scene-keys.ts — SceneKey enum
// apps/web/src/stores/game.ts — { isRunning, isPaused, currentScene }
// apps/web/src/stores/player.ts — { health, position, inventory }
```

**World and maps** (from world-and-maps):
```typescript
// packages/game-engine/src/world/pathfinding.ts
function findPath(grid: PathGrid, from: Vec2, to: Vec2): Vec2[]
function isWalkable(grid: PathGrid, pos: Vec2): boolean

// packages/game-engine/src/world/zone-manager.ts
function getZone(pos: Vec2): Zone | null
function getZoneById(id: string): Zone | null
function getNPCsInZone(zoneId: string): string[]  // entity IDs

// packages/game-engine/src/world/spawn-manager.ts
function getNPCSpawnPoints(zoneId: string): SpawnPoint[]
function getSpawnPoint(type: SpawnType): SpawnPoint | null

// packages/game-engine/src/world/collision-layer.ts
function hasLineOfSight(from: Vec2, to: Vec2): boolean
function getCollisionAt(pos: Vec2): boolean

// packages/game-engine/src/scenes/map-scene.ts — main gameplay scene (entities added here)

// packages/shared/src/types/biome.ts
type Biome = 'rural' | 'city' | 'cruise-ship' | 'office-building' | 'amusement-park'
  | 'shopping-mall' | 'airport' | 'abandoned-asylum' | 'remote-island'
  | 'ghost-town' | 'concert-venue' | 'subway-network'
type Vec2 = { x: number; y: number }
type Zone = { id: string; name: string; bounds: Rect; type: ZoneType }
type SpawnPoint = { id: string; pos: Vec2; type: SpawnType }
```

### Base Entity System

**File**: `packages/game-engine/src/entities/base-entity.ts`

Base class for all game entities (players AND NPCs — critical for the disguise mechanic: both use the same sprite/animation system so human players look identical to NPCs):

```typescript
abstract class BaseEntity {
  readonly id: string           // UUID
  pos: Vec2                     // world position
  velocity: Vec2                // pixels/second
  sprite: Phaser.GameObjects.Sprite
  animState: AnimationState
  collisionBody: Phaser.Physics.Arcade.Body
  health: number | null         // null = invulnerable/irrelevant (pure NPCs)
  maxHealth: number | null
  interactionRadius: number     // pixels, triggers interaction prompt
  isVisible: boolean
  entityType: EntityType

  abstract update(delta: number): void
  takeDamage(amount: number, source: string): void
  heal(amount: number): void
  setAnimation(key: AnimationKey, direction: Direction): void
  getPosition(): Vec2
  getWorldBounds(): Phaser.Geom.Rectangle
  destroy(): void
}
```

### Shared Types

**File**: `packages/shared/src/types/entity.ts`

```typescript
type EntityType = 'NPC' | 'PLAYER' | 'ITEM' | 'INTERACTABLE'
type EntityState = 'IDLE' | 'MOVING' | 'INTERACTING' | 'FLEEING' | 'ALERTED' | 'DEAD'
type AnimationState = { current: AnimationKey; direction: Direction; frame: number }
type AnimationKey = 'walk' | 'run' | 'idle' | 'work' | 'sit' | 'talk' | 'flee' | 'die'
type Direction = 'up' | 'down' | 'left' | 'right'

type NPCBehavior = 'PATROLLING' | 'IDLE' | 'WORKING' | 'COMMUTING' | 'SOCIALIZING' | 'FLEEING' | 'ALERTED'
type NPCRoutine = {
  behavior: NPCBehavior
  destination?: Vec2
  duration?: number        // ms to stay in this behavior before transitioning
  zoneId?: string          // zone to operate within
}
type NPCRole = 'RESIDENT' | 'WORKER' | 'PEDESTRIAN' | 'SHOPKEEPER'
type NPCSuspicionLevel = 'NONE' | 'CURIOUS' | 'SUSPICIOUS' | 'ALARMED'

type Entity = {
  id: string
  type: EntityType
  state: EntityState
  pos: Vec2
}
```

**File**: `packages/shared/src/constants/entities.ts`

```typescript
const NPC_ROLES: Record<NPCRole, { label: string; spriteVariants: number }>
const NPC_BEHAVIORS: Record<NPCBehavior, { label: string }>
const ANIMATION_KEYS: Record<AnimationKey, string>
const NPC_AI_TICK_MS = 150   // NPC AI updates every 150ms (not every frame)
const NPC_INTERACTION_RADIUS = 48  // pixels
const NPC_PERCEPTION_RADIUS = 192  // pixels, max distance NPC can "notice" events
const NPC_LINE_OF_SIGHT_ANGLE = 120  // degrees forward cone for perception
```

### NPC Class

**File**: `packages/game-engine/src/entities/npc.ts`

Extends `BaseEntity`. Adds AI behavior tree controller, routine scheduler, and suspicion state:

```typescript
class NPC extends BaseEntity {
  role: NPCRole
  routineSchedule: NPCRoutine[]  // ordered list of routines to cycle through
  currentRoutineIndex: number
  behaviorTree: BehaviorTree
  suspicion: NPCSuspicionLevel
  witnessLog: WitnessEvent[]     // what suspicious things this NPC has seen
  isWitness: boolean             // true if this NPC witnessed a crime-relevant event
  canBeInterviewed: boolean      // true if the fed can interview this NPC

  constructor(config: NPCConfig, scene: Phaser.Scene): NPC
  update(delta: number): void    // runs behavior tree at NPC_AI_TICK_MS rate
  onSuspiciousEvent(event: SuspiciousEvent): void  // called by perception system
  startFleeing(from: Vec2): void
  becomeAlerted(cause: string): void
  getWitnessStatement(): WitnessStatement | null
}

type NPCConfig = {
  id: string
  role: NPCRole
  spriteKey: string
  startPos: Vec2
  zoneId: string
  routineSchedule: NPCRoutine[]
}

type WitnessEvent = {
  eventType: 'VIOLENCE' | 'BREAK_IN' | 'SUSPICIOUS_BEHAVIOR' | 'BODY_FOUND'
  pos: Vec2
  timestamp: number
  description: string
}

type WitnessStatement = {
  npcId: string
  events: WitnessEvent[]
  reliability: number  // 0-1, randomized per NPC — unreliable witnesses add false leads
}
```

### Behavior Tree Engine

**File**: `packages/game-engine/src/ai/behavior-tree.ts`

Lightweight behavior tree for NPC decision-making. Provides four node types:

- **Selector**: Tries child nodes left-to-right, returns SUCCESS on first success
- **Sequence**: Runs child nodes left-to-right, returns FAILURE on first failure
- **Condition**: Tests a predicate, returns SUCCESS/FAILURE
- **Action**: Executes a function, returns SUCCESS/FAILURE/RUNNING

```typescript
type NodeStatus = 'SUCCESS' | 'FAILURE' | 'RUNNING'

interface BehaviorNode {
  tick(context: BTContext): NodeStatus
}

class Selector implements BehaviorNode {
  constructor(children: BehaviorNode[])
  tick(context: BTContext): NodeStatus
}

class Sequence implements BehaviorNode {
  constructor(children: BehaviorNode[])
  tick(context: BTContext): NodeStatus
}

class Condition implements BehaviorNode {
  constructor(predicate: (ctx: BTContext) => boolean)
  tick(context: BTContext): NodeStatus
}

class Action implements BehaviorNode {
  constructor(action: (ctx: BTContext) => NodeStatus)
  tick(context: BTContext): NodeStatus
}

class BehaviorTree {
  constructor(root: BehaviorNode)
  tick(context: BTContext): NodeStatus
}

type BTContext = {
  npc: NPC
  pathGrid: PathGrid
  zoneManager: typeof zoneManager
  scene: Phaser.Scene
  delta: number
}
```

### NPC Routines

**Directory**: `packages/game-engine/src/ai/routines/`

Each routine is a BehaviorNode subtree that can be composed into the behavior tree:

- **`patrol.ts`**: NPC walks between 2-4 waypoints in a loop within assigned zone. Pauses briefly at each. `createPatrolRoutine(waypoints: Vec2[]): BehaviorNode`
- **`idle.ts`**: NPC stands still, plays idle animation, occasionally looks around. `createIdleRoutine(duration: number): BehaviorNode`
- **`work.ts`**: NPC moves to work station tile, plays work animation, stays for duration. `createWorkRoutine(workstationPos: Vec2, duration: number): BehaviorNode`
- **`commute.ts`**: NPC pathfinds from one zone to another zone. `createCommuteRoutine(destinationZoneId: string): BehaviorNode`
- **`socialize.ts`**: NPC approaches nearest idle NPC within zone, faces them, idles. Simulates conversation. `createSocializeRoutine(): BehaviorNode`
- **`flee.ts`**: NPC pathfinds away from threat position at max speed. `createFleeRoutine(threatPos: Vec2): BehaviorNode`

### NPC Role Compositions

**Directory**: `packages/game-engine/src/ai/roles/`

Each file exports a factory that creates a full routine schedule for that role:

- **`resident.ts`**: Home → idle inside → walk outside → socialize → return home
- **`worker.ts`**: Commute to work zone → work routine → break (idle/socialize) → commute home
- **`pedestrian.ts`**: Patrol between 3-5 street waypoints, occasionally socialize
- **`shopkeeper.ts`**: Stay near shop zone, work routine at counter, brief idle breaks

```typescript
// Example signature pattern (all roles follow this pattern)
function createResidentSchedule(config: ResidentConfig): NPCRoutine[]
function createWorkerSchedule(config: WorkerConfig): NPCRoutine[]
function createPedestrianSchedule(config: PedestrianConfig): NPCRoutine[]
function createShopkeeperSchedule(config: ShopkeeperConfig): NPCRoutine[]
```

### Behavioral Variation

**File**: `packages/game-engine/src/ai/variation.ts`

Prevents robotic-looking patterns by randomizing per-NPC timing, path offsets, and idle durations:

```typescript
// All variation is seeded from run seed + NPC ID (deterministic per run, varied across NPCs)
function randomizeRoutineDuration(base: number, npcId: string, runSeed: string): number
function randomizeWaypoints(base: Vec2[], npcId: string, jitterRadius: number): Vec2[]
function shouldSocialize(npcId: string, frame: number): boolean
function getIdleVariantDuration(npcId: string): number
```

### Interaction System

**File**: `packages/game-engine/src/entities/interaction-manager.ts`

Proximity-based interaction detection. Player approaching within `interactionRadius` of an entity triggers an interaction prompt. Resolving the interaction calls the entity's interaction handler:

```typescript
class InteractionManager {
  register(entity: BaseEntity, handler: InteractionHandler): void
  unregister(entityId: string): void
  update(playerPos: Vec2): void  // checks proximity, emits events
  resolveInteraction(entityId: string, actor: BaseEntity): InteractionResult
}

type InteractionHandler = (actor: BaseEntity) => InteractionResult

type InteractionResult = {
  success: boolean
  type: 'TALK' | 'EXAMINE' | 'PICKUP' | 'USE' | 'ATTACK'
  data?: Record<string, unknown>
}
```

Emits EventBus events:
- `INTERACTION_AVAILABLE`: `{ entityId: string; entityType: EntityType; interactionTypes: InteractionResult['type'][] }`
- `INTERACTION_CLEARED`: `{ entityId: string }`
- `INTERACTION_RESOLVED`: `{ entityId: string; result: InteractionResult }`

### Sprite Management

**File**: `packages/game-engine/src/entities/sprite-manager.ts`

Manages character sprite atlases. Both NPCs and player use the same atlas keys — this is required for the disguise mechanic:

```typescript
class SpriteManager {
  // Loads character atlas into Phaser cache
  preloadAtlas(scene: Phaser.Scene): void
  // Creates a sprite with correct animation config for given role/variant
  createCharacterSprite(scene: Phaser.Scene, role: NPCRole, variant: number): Phaser.GameObjects.Sprite
  // Registers all animation configs for a character type
  registerAnimations(scene: Phaser.Scene): void
  // Returns animation key for given action+direction combo
  getAnimationKey(action: AnimationKey, direction: Direction, variant: number): string
}

// Sprite variants per role: 3-5 clothing color/style variations
// Animation atlas: 8-directional movement (simplified to 4) + all action animations
```

### NPC Perception System

**File**: `packages/game-engine/src/ai/perception.ts`

NPCs can notice suspicious events within their perception radius AND within their line-of-sight cone. An NPC that witnesses a suspicious event becomes a "witness" and may flee, become alerted, or both:

```typescript
class PerceptionSystem {
  // Call each NPC AI tick — checks all registered suspicious events against each NPC
  update(npcs: NPC[], events: SuspiciousEvent[]): void
  // Register a one-frame suspicious event (kill, break-in, running, etc.)
  registerSuspiciousEvent(event: SuspiciousEvent): void
}

type SuspiciousEvent = {
  id: string
  type: 'VIOLENCE' | 'BREAK_IN' | 'BODY_FOUND' | 'RUNNING' | 'WEAPON_DRAWN'
  pos: Vec2
  radius: number      // how far the event's "visibility" extends
  timestamp: number
  actorId: string     // who caused the event
}

// Perception check: NPC notices event if:
// 1. distance(npc.pos, event.pos) <= NPC_PERCEPTION_RADIUS
// 2. hasLineOfSight(npc.pos, event.pos) == true
// 3. event.pos is within NPC's forward cone (NPC_LINE_OF_SIGHT_ANGLE)
```

When an NPC perceives an event:
- `VIOLENCE` or `BODY_FOUND`: NPC becomes `ALARMED`, logs witness event, begins FLEE routine
- `BREAK_IN`: NPC becomes `SUSPICIOUS`, may approach or flee depending on role (shopkeeper approaches, resident flees)
- `RUNNING` or `WEAPON_DRAWN`: NPC suspicion increases to `CURIOUS` then `SUSPICIOUS`

### NPC Spawner

**File**: `packages/game-engine/src/entities/npc-spawner.ts`

Populates map zones with role-appropriate NPCs using spawn points from the world system:

```typescript
class NPCSpawner {
  spawnForMap(scene: Phaser.Scene, biome: Biome, runSeed: string): NPC[]
  spawnForZone(scene: Phaser.Scene, zoneId: string, count: number, role: NPCRole): NPC[]
  despawnNPC(npcId: string): void
  getNPCById(npcId: string): NPC | null
  getAllNPCs(): NPC[]
}

// Spawn rules per biome (examples):
// city: 60% pedestrians, 20% workers, 20% residents — 25-35 total NPCs
// rural: 40% residents, 30% workers, 30% pedestrians — 15-20 total NPCs
// office-building: 70% workers, 20% pedestrians, 10% shopkeepers — 20-30 total NPCs
// NPC count ranges per biome balance believability vs performance
```

### EventBus Integration

New events added to `packages/shared/src/types/events.ts` and `packages/shared/src/constants/events.ts`:

```typescript
// Events emitted by entity/NPC system
NEARBY_NPC_CHANGED: { npcIds: string[]; interactable: boolean }
INTERACTION_AVAILABLE: { entityId: string; entityType: EntityType; types: string[] }
INTERACTION_CLEARED: { entityId: string }
INTERACTION_RESOLVED: { entityId: string; result: InteractionResult }
NPC_ALERTED: { npcId: string; cause: string; pos: Vec2 }
NPC_BECAME_WITNESS: { npcId: string; eventType: string; pos: Vec2 }
NPC_FLEEING: { npcId: string; fromPos: Vec2 }
SUSPICIOUS_EVENT: { type: string; pos: Vec2; actorId: string }
```

### Performance Budget

- NPC AI tick rate: every 150ms (not every render frame) — use Phaser TimerEvent
- Entity pooling: reuse NPC instances when NPCs are despawned/respawned
- Perception checks: only run against NPCs within 3x NPC_PERCEPTION_RADIUS of the registered event (spatial cull)
- Behavior tree depth: max 4 levels deep — keep trees shallow for performance

### Edge Cases

- NPCs must not clip into walls when following patrol paths — validate waypoints against collision layer before assigning
- NPC fleeing must use pathfinding (not just "run away from threat position") to avoid getting stuck
- If all NPCs in a zone flee (due to body discovery), the zone should register as "disturbed" for evidence system use
- NPC witness reliability (0.0-1.0 float) is seeded from NPC ID + run seed — same NPC is always the same reliability level per run, enabling consistent false-lead designs
- An NPC that is a witness MUST remain interviewable by the fed until the run ends, even if the NPC has fled

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

All entity/NPC code lives in `packages/game-engine/src/`. No React imports anywhere in this package. State that the React HUD needs (nearby NPC count, interaction prompts) flows out via EventBus events, which Zustand stores in `apps/web/src/stores/player.ts` (extended) subscribe to.

The base entity class must be abstract. Both NPC and the future player controller (piece 07) extend it. This shared hierarchy is what makes the disguise mechanic work: a human player using the same `BaseEntity.setAnimation()` system looks identical to an NPC from a renderer perspective.

### NPC Count vs Performance

Target NPC counts per biome stay within Phaser's comfortable range for Arcade physics objects:
- Small biomes (rural, office-building): 15-20 NPCs
- Medium biomes (city, shopping-mall): 25-35 NPCs
- Large biomes (airport, concert-venue): 30-40 NPCs

AI updates at 150ms intervals means even 40 NPCs run behavior trees ~7 times per second, not 60. Keep behavior trees shallow (max 4 levels) and avoid expensive operations in condition nodes.

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| Phaser | 3.90.0 | Arcade physics for entity bodies and collision |
| TypeScript | 5.9.3 | Strict mode, all entities fully typed |
| neverthrow | latest | Result<T,E> for spawner/interaction return types |

### Behavior Tree Design Guidance

Use a simple top-level structure for most NPCs:

```
Selector (root)
├── Sequence (flee if alarmed)
│   ├── Condition: isAlarmed?
│   └── Action: executeFlee
├── Sequence (alert reaction)
│   ├── Condition: isSuspicious?
│   └── Selector
│       ├── Action: investigateIfBrave
│       └── Action: startFlee
└── Sequence (normal routine)
    ├── Condition: isRoutineValid?
    └── Action: executeCurrentRoutine
```

### Sprite Atlas Strategy

Use a single character atlas with multiple NPC "skins" (clothing color/pattern variations). Animation frames are identical across skins. Each skin is a separate row in the atlas. This way, `SpriteManager.createCharacterSprite()` just swaps which row it reads from.

Player controller (piece 07) will call `SpriteManager.createCharacterSprite()` with the same interface, making player sprites visually identical to NPCs of the same role variant.

### Testing Strategy

- Unit tests for behavior tree nodes (Selector, Sequence, Condition, Action logic)
- Unit tests for perception check geometry (line-of-sight angle, distance culling)
- Unit tests for behavioral variation seeding (same seed = same variation, different seeds differ)
- Unit tests for witness statement generation
- Integration tests for NPC spawner (correct counts per biome, no wall spawns)
- Phaser scene tests are complex — defer visual integration tests to Playwright E2E

### Constitution Compliance

- [x] No barrel files — direct imports to specific files
- [x] No React in game-engine package
- [x] EventBus for one-time signals (NPC alerted, witness event)
- [x] Zustand for continuous state (player.ts extended — not NPC state, NPCs are fully Phaser-side)
- [x] Singleton pattern for SpriteManager, InteractionManager, PerceptionSystem, NPCSpawner
- [x] Result<T,E> for spawner functions that can fail (zone not found, invalid spawn point)
- [x] Tests in `tests/` at package root, mirroring `src/` structure

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

When this piece is fully implemented:

- `packages/game-engine/src/entities/base-entity.ts` — abstract base class
- `packages/game-engine/src/entities/npc.ts` — NPC class with AI
- `packages/game-engine/src/entities/npc-spawner.ts` — zone population
- `packages/game-engine/src/entities/interaction-manager.ts` — proximity interactions
- `packages/game-engine/src/entities/sprite-manager.ts` — character sprites
- `packages/game-engine/src/ai/behavior-tree.ts` — tree engine
- `packages/game-engine/src/ai/variation.ts` — behavioral randomization
- `packages/game-engine/src/ai/perception.ts` — line-of-sight suspicion
- `packages/game-engine/src/ai/routines/patrol.ts`, `idle.ts`, `work.ts`, `commute.ts`, `socialize.ts`, `flee.ts`
- `packages/game-engine/src/ai/roles/resident.ts`, `worker.ts`, `pedestrian.ts`, `shopkeeper.ts`
- `packages/shared/src/types/entity.ts` — all entity/NPC types
- `packages/shared/src/constants/entities.ts` — entity constants

### Dependencies (Consumed from Earlier Pieces)

- Piece 01: neverthrow Result utilities, shared types/constants scaffold, Pino logger
- Piece 04: EventBus, Phaser game config, scene keys, game constants (tick rate)
- Piece 05: Pathfinding, zone manager, spawn manager, collision layer (line-of-sight), map scene

### Success Criteria

- [ ] 20+ NPCs spawn and follow routines without wall clipping
- [ ] Behavior tree executes correctly (flee overrides routine, routine resumes after alert expires)
- [ ] Perception system correctly applies line-of-sight — NPC behind a wall does NOT witness events on the other side
- [ ] All NPCs of the same role type use the same sprite animations as the player controller will
- [ ] Behavioral variation produces visibly different NPC timing even with same role type
- [ ] InteractionManager correctly shows/hides interaction prompts based on player proximity
- [ ] EventBus events fire correctly for all NPC state changes

### Alignment Notes

The disguise mechanic is the most critical design constraint in this piece. If NPC routines are too robotic (perfectly timed, no variation), the fed can identify the human player by their unnatural movement patterns. The behavioral variation system must make NPC movement feel organic enough that a human player following the same general pattern is not immediately obvious.

The NPC witness system is the primary data source for the evidence system (piece 09). Every `WitnessEvent` logged on an NPC becomes a potential clue the fed can uncover by interviewing that NPC. The reliability field on `WitnessStatement` is essential for the fed's gameplay loop — unreliable witnesses add genuine uncertainty, forcing the fed to cross-reference multiple sources.
