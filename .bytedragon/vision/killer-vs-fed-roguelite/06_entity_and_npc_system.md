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

This piece depends on three earlier systems. These are described here so this document is self-contained.

**Project scaffold** provides the shared Result type for error-returning operations (used in spawner functions that can fail), a Pino logger singleton, and the monorepo package structure. Game engine code must not import React.

**Game engine bootstrap** provides an EventBus for emitting and subscribing to typed game events. It also provides the shared game constants (physics tick rate, world dimensions), scene key identifiers, and initial Zustand stores for game state and player state that this piece extends by emitting events into.

**World and maps** provides the pathfinding API (find a walkable path between two positions), the zone manager (query which named zone a world position falls in, get all entities in a zone), the spawn manager (get available spawn points by type), the collision and line-of-sight API (check whether two positions have unobstructed sight), and the main map scene where entities are added. It also defines the shared 2D position type, zone descriptor type, and the full list of biome names the game supports.

### Base Entity System

Every game entity — both NPCs and the player character — extends a shared abstract base class. This shared hierarchy is fundamental to the disguise mechanic: since player and NPC share the same sprite and animation system, a human player mimicking an NPC is visually indistinguishable.

The base entity holds:
- A unique ID, world position, velocity, and a directional facing
- A Phaser sprite with an associated animation state (current animation key and facing direction)
- A physics collision body for movement and overlap detection
- Optional health values (NPCs used only as background crowd do not need a health pool)
- An interaction radius — when the player comes within this distance, an interaction prompt may appear
- A visibility flag and entity type classification

The base entity defines the interface that all entities share: an update loop called each frame, methods to apply damage and healing, set the current animation, and query position and world bounds.

### Entity and NPC Data Model

Entities are classified by type: NPC, Player, Item, and Interactable objects. Each entity has a current state: idle, moving, interacting, fleeing, alerted, or dead.

Animation states represent which animation is playing (walk, run, idle, work, sit, talk, flee, die) and the cardinal direction the entity is facing (up, down, left, right).

NPCs have four roles: **Resident** (lives in the map, follows home/outside cycle), **Worker** (commutes to a work location, follows work/break/commute cycle), **Pedestrian** (walks between street waypoints, occasionally socializes), and **Shopkeeper** (stays near their shop, works at counter, takes brief breaks). Each role has a defined routine schedule that the NPC cycles through.

NPC behavior states: patrolling, idle, working, commuting, socializing, fleeing, alerted.

NPCs have a suspicion level that escalates in response to witnessed events: none, curious, suspicious, alarmed.

A collection of constants defines the operational parameters for the NPC system:
- The role metadata and number of sprite appearance variants per role (3-5 per role)
- Named constants for all animation keys
- The AI tick interval: NPC decision-making runs on a throttled schedule rather than every render frame, keeping many NPCs performant
- The interaction detection radius: how close the player must be before an NPC becomes interactable
- The perception radius: maximum distance at which an NPC can notice suspicious events
- The line-of-sight forward cone angle: the angular width of the NPC's field of perception

### NPC Class

An NPC extends the base entity with:
- Its assigned role and sprite key
- An ordered routine schedule (list of behaviors to cycle through)
- A behavior tree that drives moment-to-moment decisions
- A suspicion level and a log of suspicious events this NPC has witnessed
- A witness flag (set when this NPC has seen something crime-relevant)
- An interviewable flag (the fed can interview this NPC to gather testimony)

An NPC can receive a suspicious event notification from the perception system, start a flee routine from a threat position, become alerted with a cause, and produce a witness statement. The witness statement includes the list of events witnessed and a reliability score (a 0–1 float seeded from the NPC's ID and the run seed — so the same NPC is always the same reliability level within a run, enabling consistent unreliable-witness gameplay).

To create an NPC, a configuration object specifies its ID, role, starting position, assigned zone, and initial routine schedule.

### Behavior Tree Engine

NPC decisions are driven by a lightweight behavior tree. The tree provides four node types:

- **Selector**: evaluates children left-to-right, returns success on the first child that succeeds
- **Sequence**: evaluates children left-to-right, returns failure on the first child that fails
- **Condition**: tests a predicate against the NPC's current context, returns success or failure
- **Action**: executes a behavior function, returns success, failure, or "running" (still in progress)

The tree root ticks each AI update cycle. The context passed to each node contains the NPC being evaluated, the pathfinding grid, the zone manager, the current Phaser scene, and the time delta. Behavior tree depth is capped to keep evaluation fast.

### NPC Routines

Six routines are implemented as composable behavior tree subtrees:

- **Patrol**: NPC walks between a set of waypoints in a loop within their assigned zone, pausing briefly at each stop
- **Idle**: NPC stands still, plays the idle animation, and occasionally looks around
- **Work**: NPC moves to a specific workstation position, plays the work animation, and stays for a set duration
- **Commute**: NPC pathfinds from their current zone to a destination zone
- **Socialize**: NPC approaches the nearest idle NPC in their zone and faces them, simulating conversation
- **Flee**: NPC pathfinds away from a threat position at maximum movement speed

Each routine is a factory function accepting the relevant parameters (waypoints, duration, destination zone, etc.) and returning a behavior node subtree ready to be inserted into a behavior tree.

### NPC Role Compositions

Each NPC role has a factory that builds a full routine schedule:

- **Resident**: starts at home, idles inside, walks outside, socializes, returns home
- **Worker**: commutes to work zone, works, takes a break (idle or socialize), commutes home
- **Pedestrian**: patrols between 3–5 street waypoints, occasionally socializes
- **Shopkeeper**: stays in their shop zone, works at the counter, takes brief idle breaks

These factories accept a role-specific configuration and return the ordered routine schedule for that NPC.

### Behavioral Variation

Without variation, NPCs with the same role follow identical timing, making it trivial to spot a human player whose timing differs slightly. A behavioral variation module prevents this by randomizing per-NPC timing, path offsets, and idle durations.

All variation is seeded from the run seed plus the NPC's ID, making variation deterministic within a run (the same NPC always has the same behavioral quirks per run) while ensuring different NPCs behave differently. The module exposes functions to randomize routine durations, jitter waypoints within a small radius, decide whether an NPC should break into a socialize routine at a given moment, and compute idle duration variants.

### Interaction System

When the player comes within an entity's interaction radius, an interaction becomes available. The interaction system maintains a registry of entities and their associated interaction handlers. Each frame, it checks the player's proximity to registered entities and emits events when interactions become available or are cleared.

When the player triggers an interaction (via the input key), the system calls the entity's registered handler and emits an event with the result. Interaction results describe the type of interaction (talk, examine, pick up, use, or attack) and any associated data.

Three events flow through the EventBus: interaction available (specifying the entity and available interaction types), interaction cleared (entity is no longer in range), and interaction resolved (the interaction was triggered, with its result).

### Sprite Management

A sprite manager handles character atlases for both NPCs and the player character. Using the same atlas for both is required by the disguise mechanic — a player calling the same sprite creation function as an NPC looks visually identical.

The manager preloads the character atlas into Phaser's cache, creates sprites with the correct animation configuration for a given role and appearance variant (variant is a numbered clothing variation within the role's sprite rows), registers all animation configurations, and returns the animation key for any combination of action and direction.

Each NPC role has 3–5 appearance variants. The animation atlas covers 4 cardinal directions and all action animations (walk, run, idle, work, sit, talk, flee, die).

### NPC Perception System

NPCs can notice suspicious events that occur within their perception radius AND within their forward-facing detection cone. An NPC that notices a suspicious event becomes a witness and may transition to fleeing or alerted states.

The perception system receives registrations of one-frame suspicious events (a kill, a break-in, someone running, a weapon drawn, a body discovered). Each AI tick, it checks which NPCs have line-of-sight to each recent event and whether the event falls within their perception cone. Checks are spatially culled — only NPCs reasonably near the event are considered.

Suspicious events carry a type, position, visibility radius, timestamp, and the ID of the entity that caused them.

NPC reactions by event type:
- Violence or body discovered: NPC becomes alarmed, logs the witness event, begins fleeing
- Break-in: NPC becomes suspicious and either approaches (shopkeeper) or flees (resident), depending on role
- Running or weapon drawn: NPC suspicion escalates from curious to suspicious over time

### NPC Spawner

The NPC spawner populates map zones with role-appropriate NPCs using spawn points from the world system. It can spawn NPCs for an entire map (respecting biome-appropriate role distributions) or for a specific zone with explicit role and count parameters. It also provides lookup by NPC ID and enumeration of all active NPCs, and handles despawning when NPCs are no longer needed.

Spawn population per biome is calibrated to balance believability against performance:
- Small biomes (rural, office building): approximately 15–20 NPCs
- Medium biomes (city, shopping mall): approximately 25–35 NPCs
- Large biomes (airport, concert venue): approximately 30–40 NPCs

Role distributions reflect the biome's character — a city has mostly pedestrians; an office building is dominated by workers; a rural area has more residents.

### EventBus Integration

This piece adds events to the shared GameEvents type. These events notify the React HUD and other game systems of NPC state changes:

- Nearby NPC changed: which NPCs are close enough to interact with
- Interaction available: an entity is within interaction range, with the interaction types it supports
- Interaction cleared: the player has moved out of interaction range
- Interaction resolved: an interaction was completed, with its result
- NPC alerted: a specific NPC has entered the alerted state, with cause and position
- NPC became witness: a specific NPC witnessed a suspicious event
- NPC fleeing: a specific NPC has begun fleeing, with the threat position
- Suspicious event registered: a suspicious event entered the system (position and actor)

### Performance Requirements

NPC AI runs on a throttled tick rate rather than every render frame, using Phaser's timer system. Entity pooling reuses NPC instances rather than destroying and recreating them. Perception checks are spatially culled — only NPCs within a reasonable distance of an event are evaluated. Behavior tree depth is kept shallow.

### Edge Cases

- NPCs must not clip into walls when following patrol paths — validate waypoints against the collision layer before assigning
- NPC fleeing must use pathfinding (not just "run away from threat position") to avoid getting stuck against walls
- If all NPCs in a zone flee (due to body discovery), the zone should register as "disturbed" for evidence system use
- NPC witness reliability is seeded from NPC ID plus run seed — the same NPC is always the same reliability level per run, enabling consistent false-lead designs
- An NPC that is a witness MUST remain interviewable by the fed until the run ends, even if the NPC has fled

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

All entity/NPC code lives in `packages/game-engine/src/`. No React imports anywhere in this package. State that the React HUD needs (nearby NPC count, interaction prompts) flows out via EventBus events, which Zustand stores in `apps/web/src/stores/player.ts` (extended) subscribe to.

The base entity class must be abstract. Both NPC and the future player controller (piece 07) extend it. This shared hierarchy is what makes the disguise mechanic work: a human player using the same `BaseEntity.setAnimation()` system looks identical to an NPC from a renderer perspective.

### Shared Types and Constants

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

### BaseEntity Signature

**File**: `packages/game-engine/src/entities/base-entity.ts`

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

### NPC Class Signature

**File**: `packages/game-engine/src/entities/npc.ts`

```typescript
class NPC extends BaseEntity {
  role: NPCRole
  routineSchedule: NPCRoutine[]
  currentRoutineIndex: number
  behaviorTree: BehaviorTree
  suspicion: NPCSuspicionLevel
  witnessLog: WitnessEvent[]
  isWitness: boolean
  canBeInterviewed: boolean

  constructor(config: NPCConfig, scene: Phaser.Scene): NPC
  update(delta: number): void    // runs behavior tree at NPC_AI_TICK_MS rate
  onSuspiciousEvent(event: SuspiciousEvent): void
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
  reliability: number  // 0-1, seeded from NPC ID + run seed
}
```

### Behavior Tree Engine Signature

**File**: `packages/game-engine/src/ai/behavior-tree.ts`

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

### NPC Routine Signatures

**Directory**: `packages/game-engine/src/ai/routines/`

```typescript
// patrol.ts
function createPatrolRoutine(waypoints: Vec2[]): BehaviorNode
// idle.ts
function createIdleRoutine(duration: number): BehaviorNode
// work.ts
function createWorkRoutine(workstationPos: Vec2, duration: number): BehaviorNode
// commute.ts
function createCommuteRoutine(destinationZoneId: string): BehaviorNode
// socialize.ts
function createSocializeRoutine(): BehaviorNode
// flee.ts
function createFleeRoutine(threatPos: Vec2): BehaviorNode
```

### NPC Role Factory Signatures

**Directory**: `packages/game-engine/src/ai/roles/`

```typescript
function createResidentSchedule(config: ResidentConfig): NPCRoutine[]
function createWorkerSchedule(config: WorkerConfig): NPCRoutine[]
function createPedestrianSchedule(config: PedestrianConfig): NPCRoutine[]
function createShopkeeperSchedule(config: ShopkeeperConfig): NPCRoutine[]
```

### Behavioral Variation Signatures

**File**: `packages/game-engine/src/ai/variation.ts`

```typescript
// All variation seeded from run seed + NPC ID (deterministic per run, varied across NPCs)
function randomizeRoutineDuration(base: number, npcId: string, runSeed: string): number
function randomizeWaypoints(base: Vec2[], npcId: string, jitterRadius: number): Vec2[]
function shouldSocialize(npcId: string, frame: number): boolean
function getIdleVariantDuration(npcId: string): number
```

### Interaction Manager Signature

**File**: `packages/game-engine/src/entities/interaction-manager.ts`

```typescript
class InteractionManager {
  register(entity: BaseEntity, handler: InteractionHandler): void
  unregister(entityId: string): void
  update(playerPos: Vec2): void
  resolveInteraction(entityId: string, actor: BaseEntity): InteractionResult
}

type InteractionHandler = (actor: BaseEntity) => InteractionResult

type InteractionResult = {
  success: boolean
  type: 'TALK' | 'EXAMINE' | 'PICKUP' | 'USE' | 'ATTACK'
  data?: Record<string, unknown>
}
```

### SpriteManager Signature

**File**: `packages/game-engine/src/entities/sprite-manager.ts`

```typescript
class SpriteManager {
  preloadAtlas(scene: Phaser.Scene): void
  createCharacterSprite(scene: Phaser.Scene, role: NPCRole, variant: number): Phaser.GameObjects.Sprite
  registerAnimations(scene: Phaser.Scene): void
  getAnimationKey(action: AnimationKey, direction: Direction, variant: number): string
}
```

### Perception System Signature

**File**: `packages/game-engine/src/ai/perception.ts`

```typescript
class PerceptionSystem {
  update(npcs: NPC[], events: SuspiciousEvent[]): void
  registerSuspiciousEvent(event: SuspiciousEvent): void
}

type SuspiciousEvent = {
  id: string
  type: 'VIOLENCE' | 'BREAK_IN' | 'BODY_FOUND' | 'RUNNING' | 'WEAPON_DRAWN'
  pos: Vec2
  radius: number
  timestamp: number
  actorId: string
}
```

### NPC Spawner Signature

**File**: `packages/game-engine/src/entities/npc-spawner.ts`

```typescript
class NPCSpawner {
  spawnForMap(scene: Phaser.Scene, biome: Biome, runSeed: string): NPC[]
  spawnForZone(scene: Phaser.Scene, zoneId: string, count: number, role: NPCRole): NPC[]
  despawnNPC(npcId: string): void
  getNPCById(npcId: string): NPC | null
  getAllNPCs(): NPC[]
}
```

Biome spawn distributions:
- `city`: 60% pedestrians, 20% workers, 20% residents — 25–35 NPCs
- `rural`: 40% residents, 30% workers, 30% pedestrians — 15–20 NPCs
- `office-building`: 70% workers, 20% pedestrians, 10% shopkeepers — 20–30 NPCs

### EventBus Event Types

Added to `packages/shared/src/types/events.ts`:

```typescript
NEARBY_NPC_CHANGED: { npcIds: string[]; interactable: boolean }
INTERACTION_AVAILABLE: { entityId: string; entityType: EntityType; types: string[] }
INTERACTION_CLEARED: { entityId: string }
INTERACTION_RESOLVED: { entityId: string; result: InteractionResult }
NPC_ALERTED: { npcId: string; cause: string; pos: Vec2 }
NPC_BECAME_WITNESS: { npcId: string; eventType: string; pos: Vec2 }
NPC_FLEEING: { npcId: string; fromPos: Vec2 }
SUSPICIOUS_EVENT: { type: string; pos: Vec2; actorId: string }
```

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
