---
vision: killer-vs-fed-roguelite
sequence: "11"
name: killer-core-mechanics
group: Gameplay
group_order: 4
status: pending
depends_on:
  - "01: Result utilities, Pino logger, shared types scaffold, environment config"
  - "03: Design system components (AppButton, AppCard, AppDialog, AppToast) for KillerHUD React component"
  - "04: EventBus (emit/subscribe typed events), Phaser game config, scene keys, Zustand game and player stores"
  - "05: World/map data, biome types, zone manager, pathfinding — disposal locations are zone-based, camera jamming targets zones"
  - "06: BaseEntity, NPCSpawner, PerceptionSystem, entity and NPC types — NPC has witness flag, witness event log, interviewable flag"
  - "07: PlayerController, RoleInterface, RoleRegistry, RunManager, inventory types, run types — killer role registers with role registry"
  - "08: ContentRegistry<T> instances (abilityRegistry, weaponRegistry, itemRegistry, statusEffectRegistry), Effect union type, StatId, EffectProcessor, StatModifierSystem, STAT_CAPS"
  - "09: CombatController, HealthSystem, AbilitySystem, StatusEffectSystem, StatModifierSystem, BossManager — killer targets can resist, triggering boss encounters"
  - "10: EvidenceManager (generateEvidence, plantFalseEvidence, setKillEvidenceReduction), EvidenceModifiers, evidence types and constants — kill events generate evidence"
produces:
  - "KillerRole class at packages/game-engine/src/roles/killer/killer-role-handler.ts — implements RoleInterface, composes sub-systems"
  - "TargetManager at packages/game-engine/src/roles/killer/target-manager.ts — assigns and tracks NPC targets per run"
  - "StealthSystem at packages/game-engine/src/roles/killer/stealth-system.ts — heat meter, noise generation, NPC awareness, detection radius"
  - "KillSystem at packages/game-engine/src/roles/killer/kill-system.ts — proximity kill trigger, method selection, evidence generation call"
  - "DisposalSystem at packages/game-engine/src/roles/killer/disposal-system.ts — body carrying, disposal locations, evidence reduction"
  - "KillerHUD component at apps/web/src/components/app/game/killer-hud/ — target list, heat meter, carrying indicator, counter-play ability slots"
  - "Killer Zustand store at apps/web/src/stores/killer.ts — targets, stealth state, carrying status, nearby disposals"
  - "Killer shared types at packages/shared/src/types/killer.ts — KillerObjective, KillMethod, DisposalMethod, KillerAbilityId, StealthState, KillerTarget, DisposalLocation, DisposalResult"
  - "Killer constants at packages/shared/src/constants/killer.ts — kill method evidence profiles, disposal requirements, heat thresholds"
  - "Killer EventBus event constants at packages/shared/src/constants/events/killer.ts — KILL_EXECUTED, BODY_DISPOSED, HEAT_CHANGED, etc."
  - "Core killer abilities (KA-1 through KA-7) — 5 default abilities and 2 skill-tree-unlocked abilities defined as code-backed systems"
created: 2026-03-18
last_aligned: never
---

# Vision Piece 11: Killer Core Mechanics

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: project-scaffold, design-system, game-engine-bootstrap, world-and-maps, entity-and-npc-system, player-and-roles, content-architecture, combat-system, evidence-system

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Implement the killer role's core gameplay systems: target management, stealth and heat mechanics, the kill execution flow, and body disposal. This piece does not include the content data (skills, weapons, boss items, crafting recipes) — those are in the next piece. This piece implements the engine systems that consume that content at run time.

The killer must identify and eliminate specific NPC targets within a run, dispose of bodies to reduce evidence, manage their heat level (aggregate suspicion from all NPCs who have witnessed suspicious behavior), and avoid arrest by the fed. The killer wins by completing all required eliminations before the fed builds an airtight case.

### Dependency Context (Inline)

**Project scaffold** provides the shared Result type for fallible operations and the Pino logger.

**Design system** provides the shared component library (buttons, cards, dialogs, toasts) used by the killer HUD.

**Game engine bootstrap** provides the EventBus, global game constants, and the Zustand game store.

**World and maps** provides the zone manager (disposal locations are zone-based, camera jamming targets zones), the spawn manager, and the gameplay scene. Biome types define which disposal methods are available.

**Entity and NPC system** provides the NPC class (with witness flag, witness event log, and suspicious event handler), the NPC spawner (for querying all NPCs and by ID), the interaction manager, and the perception system. The evidence system added methods to silence NPCs as witnesses.

**Player and roles** provides the role interface (the contract this piece implements), the role registry (where the killer role registers itself), the player controller, the inventory class, player action and action type definitions, the run manager, and all shared player/run/inventory types.

**Content architecture** provides the ContentRegistry generic class with abilityRegistry, weaponRegistry, and itemRegistry instances, the universal Effect type union, the StatId string type, the EffectProcessor, and the StatModifierSystem with STAT_CAPS enforcement. All killer abilities and weapons are defined as data and registered using these registries.

**Combat system** provides the CombatController (for target resistance encounters where the target fights back), HealthSystem, AbilitySystem, StatusEffectSystem, StatModifierSystem, and BossManager. When a target resists, the KillSystem delegates to the CombatController to run a boss encounter.

**Evidence system** provides the EvidenceManager (including `generateEvidence`, `plantFalseEvidence`, `setKillEvidenceReduction`, and `plantFalseWitnessEvidence`), the EvidenceModifiers system (for adding reduction modifiers), and the EvidenceGenerator (which subscribes to kill events to produce forensic traces). The killer's kill actions trigger the evidence system — the killer does not generate evidence directly.

### Killer Role Overview

The killer's gameplay loop per run:
1. Identify targets — one to three assigned NPC targets seeded from the run seed for multiplayer consistency
2. Observe and plan — study the target's patrol routine, identify windows with few witnesses
3. Execute — approach, use the preferred kill method, minimize evidence generated
4. Dispose — carry the body to a disposal location to reduce remaining evidence
5. Manage heat — monitor the heat meter; lay low, change disguise, or clean evidence if heat rises
6. Win — all required targets eliminated; optionally reach the escape zone for bonus score

### Kill Methods

Six kill methods define the trade-offs between speed, noise, and evidence generated:
- **Strangulation**: Silent, melee range, slow execution (3 seconds). Generates only contact DNA. No noise. Requires sustained close contact.
- **Bladed weapon**: Silent, melee range, fast execution (1.5 seconds). Generates DNA and a weapon trace. Low noise radius.
- **Blunt trauma**: Moderate noise, melee range (2 seconds). Generates DNA and a disturbed scene trace. Noise radius warns nearby NPCs.
- **Poison**: Delayed effect (30 seconds). Administered via spiked drink interaction. Generates only trace DNA. Death happens after the kill action — timing the run exit is critical.
- **Ranged**: Loud, long range (0.5 seconds). Generates a weapon trace (shell casing). Very large noise radius that can alert NPCs across zones.
- **Combat kill**: Target fought back (boss encounter). Generates the full range of evidence types. Unavoidable when specific targets resist.

### Disposal Methods

Five disposal methods reduce evidence after a kill:
- **Dumpster**: Common in city and office biomes. No item required. 60% evidence reduction. Body removed from map.
- **Lake**: Rural and island biomes. No item required. 75% evidence reduction. Body rarely resurfaces.
- **Burial**: Rural biomes. Requires a shovel in inventory. 85% evidence reduction. Slowest method.
- **Acid dissolve**: Rare. Requires an acid jar (black market). 95% evidence reduction. Fastest complete disposal.
- **Concealment**: Urban environments. No item required. 30% evidence reduction. Body stays on map hidden — can still be found.

### Stealth and Heat System

Heat is a 0–100 score representing aggregate suspicion. Four behavioral tiers: Low (0–32) NPCs follow normal routines; Medium (33–65) NPCs exhibit curious behavior; High (66–89) NPCs become suspicious and the fed receives an ambient alert hint (no exact position); Critical (90–100) NPCs enter alarmed state and the fed receives a critical heat event.

Heat decays naturally while the killer maintains low-profile behavior. Finding a body increases heat significantly (+50). Witnessing suspicious behavior increases heat (+30). Skills in the Stealth tree reduce heat accumulation and increase decay rate.

### Kill Window Design

The killer cannot attempt a kill when three or more NPCs have line-of-sight to the target. The HUD shows "Too many witnesses" and cancels the attempt. This forces the killer to create windows: using Distraction Throw to move NPCs, waiting for the target to enter a building, or using disguise and stealth positioning.

### Target Assignment

At run start, the run manager assigns one to three NPC targets seeded from the run seed. Targets are always NPCs with resident or worker roles. Targets are spread across different zones. Required target count scales with biome difficulty: Easy=1, Normal=2, Hard=3.

### Default Abilities (Core Mechanics)

Five default abilities are available to all killers from the start (defined in this piece as code-backed systems, not pure data):
- **Silent Movement** (KA-1): Stealth toggle — reduces footprints and noise generation while active
- **Lockpick** (KA-2): Opens locked doors, consumes lockpick set from inventory
- **Disguise Change** (KA-3): Changes sprite identity, reduces heat, consumes disguise kit
- **Evidence Cleanup** (KA-4): Destroys nearby evidence objects in a radius, requires cleaning supplies
- **Distraction Throw** (KA-5): Creates a noise event at a target position to redirect NPC patrol

Two additional abilities unlock via skill tree (Smoke Bomb via K-S7, Quick Disposal via K-B7). Their mechanics are defined here as part of the ability system; their stats and unlock conditions are data entries in the killer content piece.

### KillerHUD

A React client component rendered only when the player role is KILLER. Displays: target status cards (name, ALIVE/KILLED/DISPOSED, last known zone), a radial heat meter with color-coded tier and status text, a carrying indicator with nearby valid disposal locations when carrying a body, counter-play ability slots with availability indicators, and an evidence trail counter.

### Edge Cases

- A kill attempt is blocked when three or more NPCs have line-of-sight — the HUD shows "Too many witnesses" and the action is cancelled
- Poison kill has a 30-second delay — if the run ends before the target collapses, the kill is scored incomplete
- A body uncollected for five minutes transitions to fully discoverable — the HUD shows a countdown timer
- Carrying a body while any NPC has line-of-sight triggers immediate alarmed state with no grace period
- Disguise change during critical heat reduces to High, not Low — the killer must sustain low-profile behavior to drop further
- MYTHIC boss items cannot be equipped without one-time attunement

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

The killer role is self-contained in `packages/game-engine/src/roles/killer/` plus its role implementation `killer-role-handler.ts`. It registers with the role registry on module load. The four core sub-systems (TargetManager, StealthSystem, KillSystem, DisposalSystem) are composed by KillerRole — none of them know about each other directly.

Skills, abilities, weapons, and trophies are all data-driven via the ContentRegistry pattern (content architecture system). The ProgressionEffectsEngine (progression infrastructure system) applies progression effects at run start. This piece provides the engine systems; the killer content piece provides the data files.

### Core Types

**File**: `packages/shared/src/types/killer.ts`

```typescript
export type KillMethod =
  | 'STRANGULATION'    // silent, melee range, slow — DNA only
  | 'BLADED_WEAPON'    // silent, fast — DNA + WEAPON_TRACE
  | 'BLUNT_TRAUMA'     // moderate noise — DNA + DISTURBED_SCENE
  | 'POISON'           // delayed — trace DNA only
  | 'RANGED'           // loud — WEAPON_TRACE (shell casing)
  | 'COMBAT_KILL';     // target resisted (boss encounter) — all evidence types

export type DisposalMethod =
  | 'DUMPSTER' | 'LAKE' | 'BURIAL' | 'ACID_DISSOLVE' | 'CONCEALMENT';

export type KillerAbilityId =
  | 'SILENT_MOVEMENT' | 'LOCKPICK' | 'DISGUISE_CHANGE'
  | 'EVIDENCE_CLEANUP' | 'DISTRACTION_THROW' | 'SMOKE_BOMB' | 'QUICK_DISPOSAL'
  | 'FAKE_EVIDENCE_PLANT' | 'DECOY_TRAIL' | 'WITNESS_INTIMIDATION'
  | 'SURVEILLANCE_JAMMING' | 'FALSE_ALIBI_CONSTRUCTION';

export interface StealthState {
  heatLevel: number;          // 0–100
  isDetected: boolean;
  noiseLevel: number;
  isSneaking: boolean;
  detectionRadius: number;    // effective radius after skill mods
}

export type TargetStatus = 'ALIVE' | 'KILLED' | 'KILLED_AND_DISPOSED' | 'ESCAPED';

export interface KillerTarget {
  npcId: string;
  displayName: string;
  status: TargetStatus;
  isRequired: boolean;
  killMethod: KillMethod | null;
  disposalMethod: DisposalMethod | null;
  killedAt: number | null;
  disposedAt: number | null;
}

export interface DisposalLocation {
  id: string;
  method: DisposalMethod;
  pos: Vec2;
  zoneId: string;
  isAvailable: boolean;
  requiredItems: ItemType[];
}

export interface DisposalResult {
  success: boolean;
  method: DisposalMethod;
  evidenceDestroyed: string[];
  evidenceRemaining: string[];
}
```

**File**: `packages/shared/src/constants/killer.ts`

```typescript
export interface KillEvidenceProfile {
  types: EvidenceType[];
  noiseRadiusPx: number;
  timeToKillMs: number;
  isDelayed?: boolean;
}

export const KILL_METHOD_EVIDENCE_PROFILES: Record<KillMethod, KillEvidenceProfile> = {
  STRANGULATION:  { types: ['DNA'],                                    noiseRadiusPx: 0,   timeToKillMs: 3000 },
  BLADED_WEAPON:  { types: ['DNA', 'WEAPON_TRACE'],                    noiseRadiusPx: 64,  timeToKillMs: 1500 },
  BLUNT_TRAUMA:   { types: ['DNA', 'DISTURBED_SCENE'],                 noiseRadiusPx: 128, timeToKillMs: 2000 },
  POISON:         { types: ['DNA'],                                    noiseRadiusPx: 0,   timeToKillMs: 30000, isDelayed: true },
  RANGED:         { types: ['WEAPON_TRACE'],                           noiseRadiusPx: 512, timeToKillMs: 500  },
  COMBAT_KILL:    { types: ['DNA', 'WEAPON_TRACE', 'DISTURBED_SCENE'], noiseRadiusPx: 256, timeToKillMs: 0    },
} as const;

export const DISPOSAL_REQUIREMENTS: Record<DisposalMethod, DisposalRequirement> = {
  DUMPSTER:     { requiredItems: [],             requiredProximity: 96, timeToDisposeSec: 4,  evidenceReductionFactor: 0.60 },
  LAKE:         { requiredItems: [],             requiredProximity: 64, timeToDisposeSec: 6,  evidenceReductionFactor: 0.75 },
  BURIAL:       { requiredItems: ['TOOL'],       requiredProximity: 80, timeToDisposeSec: 12, evidenceReductionFactor: 0.85 },
  ACID_DISSOLVE:{ requiredItems: ['CONSUMABLE'], requiredProximity: 48, timeToDisposeSec: 8,  evidenceReductionFactor: 0.95 },
  CONCEALMENT:  { requiredItems: [],             requiredProximity: 32, timeToDisposeSec: 3,  evidenceReductionFactor: 0.30 },
} as const;

export const HEAT_THRESHOLDS = { LOW: 0, MEDIUM: 33, HIGH: 66, CRITICAL: 90 } as const;
export const HEAT_DECAY_RATE = 2;             // heat per second when low-profile
export const HEAT_INCREASE_WITNESSED = 30;
export const HEAT_INCREASE_BODY_FOUND = 50;
export const TARGETS_PER_RUN = { min: 1, max: 3 } as const;
export const BODY_COLLECTION_DEADLINE_MS = 300_000; // 5 minutes
export const BODY_CARRY_SPEED_FACTOR = 0.40;         // 40% of walk speed
export const MIN_WITNESSES_BLOCK_KILL = 3;
```

### EventBus Event Constants

**File**: `packages/shared/src/constants/events/killer.ts`

```typescript
KILL_EXECUTED: { targetId: string; method: KillMethod; pos: Vec2; evidenceCount: number; wasWitnessed: boolean; witnessIds: string[] }
BODY_PICKUP: { bodyId: string; killerId: string }
BODY_DISPOSED: { bodyId: string; method: DisposalMethod; evidenceDestroyed: number }
HEAT_CHANGED: { level: number; tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; reason: string }
HEAT_CRITICAL: { killerPos: Vec2 }
TARGET_STATUS_CHANGED: { targetId: string; status: TargetStatus }
KILLER_WIN_CONDITION_MET: { targetsKilled: number; targetsDisposed: number }
KILLER_LOSE_CONDITION_MET: { reason: 'ARRESTED' | 'KILLED' | 'TIME_LIMIT' }
COUNTER_PLAY_USED: { abilityId: KillerAbilityId; pos: Vec2 }
```

### Core Sub-System Signatures

**TargetManager** (`packages/game-engine/src/roles/killer/target-manager.ts`):
```typescript
class TargetManager {
  initTargets(allNPCs: NPC[], runSeed: string, biome: Biome): KillerTarget[]
  getTargets(): KillerTarget[]
  getTarget(npcId: string): KillerTarget | null
  markTargetKilled(npcId: string, method: KillMethod): void
  markTargetDisposed(npcId: string, method: DisposalMethod): void
  areAllRequiredTargetsEliminated(): boolean
  getObjectiveSummary(): RoleObjective[]
}
```

Target selection uses seeded RNG: `new SeededRandom(seed + 'targets')`. Selects RESIDENT or WORKER roles only. Spreads targets across different zones. Required count: EASY=1, NORMAL=2, HARD=3.

**StealthSystem** (`packages/game-engine/src/roles/killer/stealth-system.ts`):
```typescript
class StealthSystem {
  computeState(player: PlayerController, npcs: NPC[], statusEffects: StatusEffect[]): StealthState
  generateNoise(pos: Vec2, radiusPx: number, cause: string): void
  checkDetection(playerPos: Vec2, npcs: NPC[]): boolean
  increaseHeat(amount: number, reason: string): void
  decayHeat(delta: number): void
  getEffectiveDetectionRadius(baseRadius: number, modifiers: StealthModifiers): number
  update(delta: number): void
}
```

Skill modifiers are read from `StatModifierSystem.getEffectiveStat()` at compute time — the `detectionRadius` and `noiseGeneration` stats are modified by Stealth tree skills.

**KillSystem** (`packages/game-engine/src/roles/killer/kill-system.ts`):
```typescript
class KillSystem {
  canKill(playerPos: Vec2, targetNPC: NPC): boolean
  executeKill(player: PlayerController, targetNPC: NPC, method: KillMethod, inventory: Inventory): Result<KillResult, 'TARGET_NOT_IN_RANGE' | 'INSUFFICIENT_ITEMS' | 'TARGET_RESISTED'>
  handleResistance(player: PlayerController, targetNPC: NPC): void
}
// Kill execution sequence:
// 1. Validate range and requirements
// 2. Check target resistance (triggers boss encounter if resists)
// 3. Play kill animation
// 4. Call EvidenceGenerator.onEntityDied() — generates BODY + method-specific evidence
// 5. Register SuspiciousEvent with PerceptionSystem
// 6. Increase heat based on noise radius and witness count
// 7. Emit KILL_EXECUTED EventBus event
// 8. Spawn "body" interactable entity for disposal
```

**DisposalSystem** (`packages/game-engine/src/roles/killer/disposal-system.ts`):
```typescript
class DisposalSystem {
  getAvailableLocations(playerPos: Vec2, biome: Biome): DisposalLocation[]
  pickUpBody(player: PlayerController, bodyEntityId: string): Result<void, 'NOT_IN_RANGE' | 'ALREADY_CARRYING'>
  dropBody(player: PlayerController): void
  disposeBody(player: PlayerController, location: DisposalLocation): Result<DisposalResult, 'NOT_IN_RANGE' | 'MISSING_REQUIRED_ITEMS' | 'LOCATION_FULL'>
  update(delta: number): void
}
// While carrying: player speed 40% of walk, heat increases gradually, NPCs in LOS trigger immediate ALARMED state
```

Disposal speed reads from `StatModifierSystem.getEffectiveStat('disposalSpeed')`.

### KillerRole (Role Handler)

**File**: `packages/game-engine/src/roles/killer/killer-role-handler.ts`

```typescript
class KillerRole implements RoleInterface {
  readonly role: PlayerRole = 'KILLER'
  private targetManager: TargetManager
  private stealthSystem: StealthSystem
  private killSystem: KillSystem
  private disposalSystem: DisposalSystem

  getObjectives(): RoleObjective[]
  getAbilities(): PlayerAbility[]
  getHUDConfig(): HUDConfig
  checkWinCondition(state: RunState): boolean    // all required targets KILLED or DISPOSED
  checkLoseCondition(state: RunState): boolean   // player HP=0, fed AIRTIGHT arrest, or time limit
  onRunStart(config: RunConfig): void
  onRunEnd(result: RunResult): void
  onPlayerAction(action: PlayerAction): void
}

// Registration at module load:
roleRegistry.register('KILLER', () => new KillerRole())
```

### Killer Zustand Store

**File**: `apps/web/src/stores/killer.ts`

```typescript
type KillerStore = {
  targets: KillerTarget[]
  stealthState: StealthState
  isCarryingBody: boolean
  carriedBodyId: string | null
  nearbyDisposalLocations: DisposalLocation[]
  killCount: number
  disposalCount: number
  counterPlayUsage: Record<KillerAbilityId, number>
  updateTargets: (targets: KillerTarget[]) => void
  updateStealthState: (state: StealthState) => void
  setCarryingBody: (bodyId: string | null) => void
  updateNearbyDisposals: (locations: DisposalLocation[]) => void
  incrementKillCount: () => void
  incrementDisposalCount: () => void
  recordCounterPlayUsage: (abilityId: KillerAbilityId) => void
}
```

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| Phaser | 3.90.0 | Scene-level game loop integration |
| Zustand | latest | killerStore in apps/web |
| TypeScript | 5.9.3 | Strict types, all killer types exported from shared |
| Vitest | 4.1.0 | Unit tests for game logic |

### Testing Strategy

- Unit tests for TargetManager: seeded target selection produces deterministic results, spread-across-zones constraint, win condition check
- Unit tests for StealthSystem: heat increase on suspicious event, heat decay, heat tier transitions, STAT_CAPS applied to detection radius mods
- Unit tests for KillSystem: range check, witness count check, evidence profile selection per method, resistance handling
- Unit tests for DisposalSystem: location availability by biome, proximity check, evidence reduction calculation
- E2E: killer executes strangulation kill on target, disposes body, heat meter updates in HUD (Playwright)

### Art Style Integration

Stealth kill actions display a silence effect VFX. Kill actions show comic-style onomatopoeia (CRUNCH!/SNAP!). Ink-splatter particles accompany stealth actions. See `art-style-guide.md` in the vision directory for full visual specifications including stealth kill silence effect, kill VFX, and ink-splatter particle style.

### Constitution Compliance

- [x] No barrel files — all imports direct to specific files
- [x] No React in game-engine package — all role logic in game-engine, HUD in apps/web
- [x] EventBus for killer events (KILL_EXECUTED, HEAT_CHANGED, TARGET_STATUS_CHANGED)
- [x] Zustand killerStore for HUD state
- [x] Result<T,E> for KillSystem.executeKill() and DisposalSystem methods
- [x] ContentRegistry consumed from the content architecture system — no duplicate creation
- [x] Seeded RNG for target selection — deterministic for multiplayer consistency

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

- `packages/game-engine/src/roles/killer/killer-role-handler.ts`
- `packages/game-engine/src/roles/killer/target-manager.ts`
- `packages/game-engine/src/roles/killer/stealth-system.ts`
- `packages/game-engine/src/roles/killer/kill-system.ts`
- `packages/game-engine/src/roles/killer/disposal-system.ts`
- `packages/shared/src/types/killer.ts`
- `packages/shared/src/constants/killer.ts`
- `packages/shared/src/constants/events/killer.ts`
- `apps/web/src/stores/killer.ts`
- `apps/web/src/components/app/game/killer-hud/KillerHUD.tsx` (and sub-components)

### Dependencies (Consumed from Earlier Pieces)

**From piece 08 (Content Architecture)**:
- `ContentRegistry` instances: `abilityRegistry`, `weaponRegistry`, `itemRegistry` from `packages/shared/src/registry/registries`
- `Effect` union and `StatId`: `packages/shared/src/effects/effect-types`
- `EffectProcessor`: `packages/game-engine/src/effects/effect-processor`
- `StatModifierSystem`: `packages/game-engine/src/combat/stat-modifier-system`
- `STAT_CAPS`: `packages/shared/src/constants/balance`

**From piece 09 (Combat System)**:
- `CombatController`, `BossManager` for target resistance encounters
- `StatusEffectSystem.applyFromDefinition()` for ability effects
- Combat event constants from `packages/shared/src/constants/events/combat`

**From piece 10 (Evidence System)**:
- `EvidenceManager.generateEvidence()`, `.plantFalseEvidence()`, `.setKillEvidenceReduction()`
- `EvidenceGenerator` subscription to kill events

**From piece 07 (Player and Roles)**:
- `RoleInterface` — this piece implements it
- `RoleRegistry` — this piece registers with it
- `PlayerController`, `RunManager`, `Inventory`

**From piece 06 (Entity and NPC System)**:
- `NPC` class with `canBeInterviewed()`, `silenceAsWitness()`, `isInformant` flag
- `NPCSpawner.getAllNPCs()`, `.getNPCById()`
- `PerceptionSystem.registerSuspiciousEvent()`

### Success Criteria

- [ ] Killer targets are selected deterministically from run seed — same seed produces same targets every time
- [ ] All 6 kill methods execute correctly with correct evidence profiles and noise radii
- [ ] Heat transitions between tiers at correct thresholds and decays when low-profile
- [ ] Kill blocked when 3+ NPCs have line-of-sight to target — HUD shows "Too many witnesses"
- [ ] Body becomes fully discoverable after 5 minutes if not disposed — countdown shown in HUD
- [ ] Carrying a body while in NPC line-of-sight triggers immediate alarmed state
- [ ] Disposal reduces evidence by the correct factor per method
- [ ] Win condition triggers when all required targets have status KILLED or KILLED_AND_DISPOSED
- [ ] KillerHUD heat meter updates in real-time with correct color coding per tier

### Alignment Notes

This piece owns the killer's game loop engine code. Piece 12 owns all content data (skills, abilities, weapons, boss items, crafting recipes). The KillSystem's evidence generation call goes to the EvidenceGenerator from piece 10 — the killer never generates evidence directly.

The seeded target selection in TargetManager is critical for multiplayer consistency (piece 18 depends on this). The seed must use the run seed, not Math.random(). The same seed + biome combination must always produce the same targets.

The StealthSystem reads from StatModifierSystem, which is populated by the ProgressionEffectsEngine (piece 16) at run start. The core mechanics here are stat-agnostic — they read effective stat values at runtime.
