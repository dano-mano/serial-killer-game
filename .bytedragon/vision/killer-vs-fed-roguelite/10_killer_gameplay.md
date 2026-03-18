---
vision: killer-vs-fed-roguelite
sequence: 10
name: killer-gameplay
group: Role Systems
group_order: 4
status: pending
depends_on:
  - "01: Result utilities, Pino logger, shared types scaffold, environment config"
  - "03: Design system components for KillerHUD React component"
  - "04: EventBus, Phaser game config, scene keys, Zustand game and player stores"
  - "05: World/map data, biome types, zone manager, pathfinding"
  - "06: BaseEntity, NPCSpawner, PerceptionSystem, entity and NPC types"
  - "07: PlayerController, RoleInterface, RoleRegistry, RunManager, inventory types, run types"
  - "08: Combat system (AttackSystem, HealthSystem, AbilitySystem, StatusEffectSystem, StatModifierSystem, ContentRegistry, Effect types)"
  - "09: Evidence manager, evidence modifiers, evidence types and constants"
produces:
  - "Killer role implementation: objectives, abilities, win/lose conditions"
  - "Killer types: KillerObjective, KillMethod, DisposalMethod, KillerAbility, StealthState"
  - "Killer constants: kill methods with evidence profiles, disposal methods and evidence reduction values"
  - "Target manager: assigns targets per run, tracks status, generates new targets if needed"
  - "Stealth system: visibility/detection spectrum, noise generation, NPC awareness, heat meter"
  - "Kill system: proximity-based kill trigger, method selection, animation, evidence generation call"
  - "Disposal system: body disposal methods with requirements and evidence reduction"
  - "Expanded killer skill trees: 3 trees (Stealth, Brutality, Deception), 10 skills each, 5-rank progression with prerequisites and tier gating"
  - "12 active abilities (KA-1 through KA-12) with rank progressions, default and skill-tree-unlocked"
  - "Adjusted skill costs: R1:2, R2:4, R3:7+1GT, R4:12+2GT, R5:18+4GT primary/ghost token costs"
  - "Expanded weapons catalog: 13 killer weapons across BLADE/BLUNT/GARROTE/RANGED/POISON/TASER/EXPLOSIVE categories"
  - "Killer tools catalog: lockpick, cleaning supplies, disguise kit, shovel, acid jar, noise maker, smoke canister, bribery gift"
  - "7 MYTHIC boss items (KB-1 through KB-7) with unique CUSTOM effect handlers and obtain conditions"
  - "Crafting system — The Workshop: 10 killer recipes (KR-1 through KR-10) across Tier 1-3, upgrade slot system, salvage parts"
  - "Counter-play abilities integrated into Deception tree (KA-8 through KA-12)"
  - "Build archetypes: Shadow Assassin, Berserker, Manipulator, Balanced"
  - "Killer HUD: target list, stealth indicator, heat meter, disposal options"
  - "Killer Zustand store: targets, stealth level, kills, disposals"
  - "Boss item custom handlers at packages/game-engine/src/effects/boss-item-handlers.ts"
  - "Workshop UI: CraftingStation, RecipeList, RecipeCard, ModSlotViewer, DismantleConfirm"
  - "DB tables: crafting_recipes, user_equipment_mods"
created: 2026-03-17
last_aligned: never
---

# Vision Piece 10: Killer Gameplay

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: project-scaffold, design-system, game-engine-bootstrap, world-and-maps, entity-and-npc-system, player-and-roles, combat-system, evidence-system

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Implement the complete killer role gameplay loop. The killer must identify and eliminate specific NPC targets within a run, dispose of bodies to reduce evidence, manage their "heat" level (how suspicious they appear to NPCs and the fed), and actively counteract the fed's investigation using deception abilities. The killer wins by completing all required eliminations. The killer loses if arrested by the fed or if the fed achieves an airtight case before the killer can escape.

The killer's power grows through three ranked skill trees (Stealth, Brutality, Deception), 12 active abilities with rank progressions, a catalog of weapons and tools, MYTHIC-rarity boss items with unique mechanics, and a crafting system ("The Workshop") for equipment modifications.

### Dependency Context (Inline)

This piece depends on all earlier pieces. These are reproduced here in full so this document is self-contained:

**From project-scaffold**:
```
packages/shared/src/utils/result.ts:
  - ok<T>(value: T): Ok<T, never>
  - err<E>(error: E): Err<never, E>
  - type AppError = { code: string; message: string }
apps/web/src/lib/logger/pino.ts — Pino singleton
```

**From design-system**:
```
apps/web/src/components/app/common/ — AppButton, AppCard, AppDialog, AppToast
Tailwind v4 CSS custom properties in globals.css @theme inline
```

**From game-engine-bootstrap**:
```typescript
// packages/game-engine/src/events/event-bus.ts
eventBus.emit<K>(event: K, payload: GameEvents[K]): void
eventBus.on<K>(event: K, handler: (payload: GameEvents[K]) => void): void
// packages/shared/src/constants/game.ts — TICK_RATE, PLAYER_BASE_SPEED, PLAYER_SNEAK_SPEED
// apps/web/src/stores/game.ts — { isRunning, isPaused, currentScene }
```

**From world-and-maps**:
```typescript
// packages/game-engine/src/world/zone-manager.ts
getZone(pos: Vec2): Zone | null
getZoneById(id: string): Zone | null
function jamCameras(zoneId: string, durationMs: number): void  // added by evidence-system
// packages/game-engine/src/world/spawn-manager.ts — getSpawnPoint()
// packages/game-engine/src/scenes/map-scene.ts — gameplay scene
// packages/shared/src/types/biome.ts — Biome, Vec2, Zone
```

**From entity-and-npc-system**:
```typescript
// packages/game-engine/src/entities/npc.ts
class NPC extends BaseEntity {
  role: NPCRole; isWitness: boolean; witnessLog: WitnessEvent[]
  canBeInterviewed: boolean
  silenceAsWitness(): void   // added by evidence-system
  onSuspiciousEvent(event: SuspiciousEvent): void
}
// packages/game-engine/src/entities/npc-spawner.ts
getNPCById(npcId: string): NPC | null
getAllNPCs(): NPC[]
convertToInformant(npcId: string): void    // added by evidence-system
convertToEntrapmentBait(npcId: string, alertRadius: number): void  // added by evidence-system
// packages/game-engine/src/entities/interaction-manager.ts — register(), resolveInteraction()
// packages/game-engine/src/ai/perception.ts — registerSuspiciousEvent()
// packages/shared/src/types/entity.ts — NPCRole, EntityType
// packages/shared/src/constants/entities.ts — NPC_PERCEPTION_RADIUS, NPC_LINE_OF_SIGHT_ANGLE
```

**From player-and-roles**:
```typescript
// packages/game-engine/src/player/roles/role-interface.ts
interface RoleInterface {
  role: PlayerRole
  getObjectives(): RoleObjective[]
  getAbilities(): PlayerAbility[]
  getHUDConfig(): HUDConfig
  checkWinCondition(state: RunState): boolean
  checkLoseCondition(state: RunState): boolean
  onRunStart(config: RunConfig): void
  onRunEnd(result: RunResult): void
  onPlayerAction(action: PlayerAction): void
}
// packages/game-engine/src/player/roles/role-registry.ts — roleRegistry.register()
// packages/game-engine/src/player/player-controller.ts — PlayerController
// packages/game-engine/src/player/inventory.ts — Inventory
// packages/game-engine/src/player/player-actions.ts — PlayerAction, PlayerActionType
// packages/game-engine/src/run/run-manager.ts — RunManager, RunConfig, RunState, RunResult
// packages/shared/src/types/player.ts — PlayerRole, PlayerAbility, RoleObjective, HUDConfig
// packages/shared/src/types/inventory.ts — InventoryItem, ItemType, ItemRarity, ItemEffect
// packages/shared/src/types/run.ts — RunConfig, RunState, RunResult, RunOutcome
// apps/web/src/stores/player.ts — player Zustand store
// apps/web/src/stores/hud.ts — HUDStore.addNotification()
```

**From combat-system**:
```typescript
// packages/game-engine/src/combat/combat-controller.ts — initiateCombat()
// packages/game-engine/src/combat/health-system.ts — applyDamage(), handleDeath()
// packages/game-engine/src/combat/ability-system.ts — useAbility(), registerAbilities()
// packages/game-engine/src/combat/status-effects.ts — applyEffect(), getSpeedMultiplier(), getDetectionMultiplier()
// packages/game-engine/src/combat/stat-modifier-system.ts — StatModifierSystem, STAT_CAPS
// packages/game-engine/src/combat/boss-manager.ts — initBossEncounter(), BossConfig
// packages/game-engine/src/effects/effect-processor.ts — EffectProcessor, registerCustomHandler()
// packages/shared/src/registry/registries.ts — weaponRegistry, abilityRegistry, skillRegistry
// packages/shared/src/effects/effect-types.ts — Effect, StatId
// packages/shared/src/constants/balance.ts — STAT_CAPS
// packages/shared/src/types/combat.ts — StatusEffect, Ability, AbilityEffect, DamageTypeId
// packages/shared/src/constants/combat.ts — STEALTH_DETECTION_MULTIPLIER, BASE_MELEE_DAMAGE
// apps/web/src/stores/combat.ts — combat Zustand store
```

**From evidence-system**:
```typescript
// packages/game-engine/src/evidence/evidence-manager.ts
class EvidenceManager {
  addEvidence(evidence: Evidence): void
  destroy(evidenceId: string): Result<void, NotFoundError>
  plantFalseEvidence(type: EvidenceType, pos: Vec2, linkedNpcId: string | null): Evidence
  plantFalseWitnessEvidence(npcId: string, alibiLocation: Vec2, timestamp: number): Evidence
  createDecayZone(pos: Vec2, radius: number, durationMs: number, decayMultiplier: number): void
  setKillEvidenceReduction(killerId: string, reduction: number): void
  enableAutoTag(entityId: string, radius: number, chance: number): void
}
// packages/game-engine/src/evidence/evidence-modifiers.ts — EvidenceModifiers.addModifier()
// packages/game-engine/src/evidence/evidence-generator.ts — EvidenceGenerator (subscribes to events)
// packages/shared/src/types/evidence.ts — Evidence, EvidenceType, EvidenceState, EvidenceQuality
// packages/shared/src/constants/evidence.ts — EVIDENCE_GENERATION rules
// apps/web/src/stores/evidence.ts — evidenceStore (generatedEvidence for killer awareness)
```

### Killer Role Overview

The killer's gameplay loop per run:

1. **Identify targets**: Run starts with 1-3 randomly assigned NPC targets (seeded from run seed for multiplayer consistency)
2. **Observe and plan**: Study target's routine, identify opportunities for unobserved kills
3. **Execute**: Approach target, use preferred kill method, generate minimum evidence
4. **Dispose**: Move body to disposal location (dumpster, lake, etc.) to reduce evidence
5. **Manage heat**: Monitor heat meter; if too hot, lay low, change disguise, clean evidence
6. **Counter-play**: Actively mislead the fed using deception abilities when heat is rising
7. **Win**: All required targets eliminated. Optional: escape zone trigger for bonus score

### Shared Types

**File**: `packages/shared/src/types/killer.ts`

```typescript
type KillMethod =
  | 'STRANGULATION'    // silent, melee range, slow — generates DNA (contact), no noise
  | 'BLADED_WEAPON'    // silent, melee range, fast — generates DNA + WEAPON_TRACE + blood
  | 'BLUNT_TRAUMA'     // moderate noise, melee range — generates DNA + DISTURBED_SCENE
  | 'POISON'           // delayed, can be done via interaction (spiked drink) — DNA (trace only)
  | 'RANGED'           // loud, ranged — generates WEAPON_TRACE (shell casing) + noise witnesses
  | 'COMBAT_KILL'      // target fought back (boss fight) — generates all evidence types (most forensic)

type DisposalMethod =
  | 'DUMPSTER'         // common in city/office biomes; easy, moderate evidence reduction
  | 'LAKE'             // rural/island biomes; good evidence reduction, body rarely found
  | 'BURIAL'           // rural biomes; requires shovel item; excellent evidence reduction
  | 'ACID_DISSOLVE'    // rare; requires acid item from black market; near-total evidence reduction
  | 'CONCEALMENT'      // urban; hide body in closet/under bed; low evidence reduction, body stays on map

type KillerAbility = {
  id: KillerAbilityId
  name: string
  description: string
  cooldownMs: number
  resourceCost: number
  tier: number           // 1 = default, 2-3 = skill tree unlocks
}

type KillerAbilityId =
  | 'SILENT_MOVEMENT'          // KA-1: tier 1 default toggle
  | 'LOCKPICK'                 // KA-2: tier 1 default
  | 'DISGUISE_CHANGE'          // KA-3: tier 1 default
  | 'EVIDENCE_CLEANUP'         // KA-4: tier 1 default
  | 'DISTRACTION_THROW'        // KA-5: tier 1 default
  | 'SMOKE_BOMB'               // KA-6: skill tree (K-S7)
  | 'QUICK_DISPOSAL'           // KA-7: skill tree (K-B7)
  | 'FAKE_EVIDENCE_PLANT'      // KA-8: skill tree (K-D4)
  | 'DECOY_TRAIL'              // KA-9: skill tree (K-D5)
  | 'WITNESS_INTIMIDATION'     // KA-10: skill tree (K-D6)
  | 'SURVEILLANCE_JAMMING'     // KA-11: skill tree (K-D7)
  | 'FALSE_ALIBI_CONSTRUCTION' // KA-12: skill tree (K-D8)

type StealthState = {
  heatLevel: number          // 0-100; the aggregate suspicion across all NPCs who've seen the killer
  isDetected: boolean        // true when any NPC is in ALARMED state from the killer
  noiseLevel: number         // current noise output 0-100 (affects nearby NPC awareness)
  isSneaking: boolean
  detectionRadius: number    // how close NPCs must be to notice player (modified by skills)
}

type TargetStatus = 'ALIVE' | 'KILLED' | 'KILLED_AND_DISPOSED' | 'ESCAPED'

// Boss item rarity — extends existing ItemRarity
type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY' | 'MYTHIC'
```

**File**: `packages/shared/src/types/disposal.ts`

```typescript
type DisposalLocation = {
  id: string
  method: DisposalMethod
  pos: Vec2
  zoneId: string
  isAvailable: boolean      // false if location is full or already used
  requiredItems: ItemType[] // items that must be in inventory
}

type DisposalRequirement = {
  method: DisposalMethod
  requiredItems: ItemType[]
  requiredProximity: number  // must carry body to within this radius of disposal point
  timeToDisposeSec: number   // animation duration
  evidenceReductionFactor: number  // 0-1; fraction of body-related evidence destroyed
}

type DisposalResult = {
  success: boolean
  method: DisposalMethod
  evidenceDestroyed: string[]   // evidence IDs destroyed by disposal
  evidenceRemaining: string[]   // evidence IDs that survive disposal
}
```

**File**: `packages/shared/src/constants/killer.ts`

```typescript
const KILL_METHOD_EVIDENCE_PROFILES: Record<KillMethod, KillEvidenceProfile> = {
  STRANGULATION: { types: ['DNA'], noiseRadiusPx: 0, timeToKillMs: 3000 },
  BLADED_WEAPON: { types: ['DNA', 'WEAPON_TRACE'], noiseRadiusPx: 64, timeToKillMs: 1500 },
  BLUNT_TRAUMA: { types: ['DNA', 'DISTURBED_SCENE'], noiseRadiusPx: 128, timeToKillMs: 2000 },
  POISON: { types: ['DNA'], noiseRadiusPx: 0, timeToKillMs: 30000, isDelayed: true },
  RANGED: { types: ['WEAPON_TRACE'], noiseRadiusPx: 512, timeToKillMs: 500 },
  COMBAT_KILL: { types: ['DNA', 'WEAPON_TRACE', 'DISTURBED_SCENE'], noiseRadiusPx: 256, timeToKillMs: 0 },
}

const DISPOSAL_REQUIREMENTS: Record<DisposalMethod, DisposalRequirement> = {
  DUMPSTER: { requiredItems: [], requiredProximity: 96, timeToDisposeSec: 4, evidenceReductionFactor: 0.60 },
  LAKE: { requiredItems: [], requiredProximity: 64, timeToDisposeSec: 6, evidenceReductionFactor: 0.75 },
  BURIAL: { requiredItems: ['TOOL'], requiredProximity: 80, timeToDisposeSec: 12, evidenceReductionFactor: 0.85 },
  ACID_DISSOLVE: { requiredItems: ['CONSUMABLE'], requiredProximity: 48, timeToDisposeSec: 8, evidenceReductionFactor: 0.95 },
  CONCEALMENT: { requiredItems: [], requiredProximity: 32, timeToDisposeSec: 3, evidenceReductionFactor: 0.30 },
}

const HEAT_THRESHOLDS = { LOW: 0, MEDIUM: 33, HIGH: 66, CRITICAL: 90 }
const HEAT_DECAY_RATE = 2           // heat units per second when lying low
const HEAT_INCREASE_WITNESSED = 30  // heat increase when NPC witnesses suspicious behavior
const HEAT_INCREASE_BODY_FOUND = 50 // heat increase when body is found (NPCs spread alarm)
const TARGETS_PER_RUN = { min: 1, max: 3 }  // scaled by biome difficulty
```

### Killer Skill Trees

The killer has three skill trees, each with 10 skills. Skill ranks follow the **diminishing returns formula** and hard cap system from the combat system's `STAT_CAPS`. All skill definitions live in data files at `packages/shared/src/data/skills/` and register in `skillRegistry` at boot.

**Rank system rules**:
- Every skill has 1-5 ranks (configured per skill)
- **Diminishing returns formula**: `effectiveValue = baseValue * rank * (1 / (1 + 0.15 * (rank - 1)))`
  - Rank 1: 100% of base per rank | Rank 2: 87% | Rank 3: 77% | Rank 4: 69% | Rank 5: 63%
- **Hard cap**: No single skill provides more than 50% improvement in any one stat. Total from all sources caps at 75% via `STAT_CAPS`.
- **Tier gating**: Tier N requires at least 2 skills from Tier N-1

**Adjusted cost per rank (revised)**:

| Rank | Primary (blood_marks) | Ghost Tokens | Design Intent |
|------|-----------------------|--------------|---------------|
| 1 | 2 | 0 | Accessible: one run covers 1-2 rank-ups |
| 2 | 4 | 0 | Moderate: one good run covers a rank-up |
| 3 | 7 | 1 | Investment: introduces ghost token gate |
| 4 | 12 | 2 | Significant: requires 2-3 dedicated runs |
| 5 | 18 | 4 | Achievement: capstone milestone, ~4 focused runs |

**Core trees** (Stealth, Brutality) use a **0.8x cost multiplier** — cheaper, rewarding early investment. The **Deception tree** uses a **1.3x cost multiplier** — counter-play abilities are earned privileges, not defaults.

---

#### KILLER TREE 1: STEALTH (`packages/shared/src/data/skills/killer-stealth.ts`)

Movement, evasion, and detection avoidance.

| ID | Skill Name | Tier | Max Rank | Rank Progression | Prerequisites |
|----|-----------|------|----------|-----------------|---------------|
| K-S1 | Shadow Steps | 1 | 5 | R1: footprint gen -8%, move speed +3% / R2: -14%, +5% / R3: -19%, +7% / R4: -23%, +8% / R5: -26%, +9% | None |
| K-S2 | Soft Landing | 1 | 3 | R1: fall/jump noise -30% / R2: -50% / R3: -70% | None |
| K-S3 | Peripheral Awareness | 1 | 5 | R1: NPC detection warning radius +15px / R2: +28px / R3: +38px / R4: +46px / R5: +52px | None |
| K-S4 | Quiet Killer | 2 | 5 | R1: stealth kill noise radius -10% / R2: -18% / R3: -24% / R4: -29% / R5: -33% | K-S1(R2) |
| K-S5 | Blend In | 2 | 3 | R1: heat decay rate +15% when stationary / R2: +25% / R3: +33% | K-S1(R1), K-S3(R1) |
| K-S6 | Ghost Presence | 2 | 5 | R1: NPC awareness radius -6% / R2: -11% / R3: -15% / R4: -18% / R5: -20% | K-S4(R1) |
| K-S7 | Vanishing Act | 3 | 3 | R1: UNLOCKS smoke bomb (12s detection break, 90s CD) / R2: CD -20s / R3: CD -35s, breaks combat tracking 3s | K-S5(R2), K-S6(R1) |
| K-S8 | Shadow Dash | 3 | 5 | R1: dash 150px, 30s CD / R2: +30px, -3s CD / R3: +25px, -3s CD / R4: +20px, -2s CD / R5: +15px, -2s CD, no footprints during dash | K-S6(R2) |
| K-S9 | Invisible Predator | 4 | 3 | R1: disguise lasts 50% longer / R2: +80% longer / R3: +100% longer, disguise not consumed on close inspection | K-S7(R2), K-S8(R2) |
| K-S10 | Perfect Shadow | 5 | 1 | R1: UNLOCKS 15s full INVISIBILITY status (4min CD). Cannot attack while invisible. Footprints at 30% rate. | K-S9(R2) |

**Hard caps**: Shadow Steps speed bonus caps at +9%. Ghost Presence detection reduction caps at -20%. No combination can reduce footprint generation below 15% of base rate (minimum evidence trail always exists).

---

#### KILLER TREE 2: BRUTALITY (`packages/shared/src/data/skills/killer-brutality.ts`)

Combat effectiveness, kill efficiency, and body handling.

| ID | Skill Name | Tier | Max Rank | Rank Progression | Prerequisites |
|----|-----------|------|----------|-----------------|---------------|
| K-B1 | Iron Grip | 1 | 5 | R1: melee damage +4 / R2: +7 / R3: +10 / R4: +12 / R5: +14 (cap: +14 flat) | None |
| K-B2 | Lethal Efficiency | 1 | 5 | R1: kill animation speed +8% / R2: +14% / R3: +19% / R4: +23% / R5: +26% | None |
| K-B3 | Tough Skin | 1 | 5 | R1: damage taken -3% / R2: -6% / R3: -8% / R4: -10% / R5: -11% (cap: -11%) | None |
| K-B4 | Clean Strike | 2 | 5 | R1: combat kills generate 6% less DNA evidence / R2: -11% / R3: -15% / R4: -18% / R5: -20% | K-B1(R2) |
| K-B5 | Efficient Disposal | 2 | 5 | R1: disposal time -8% / R2: -14% / R3: -19% / R4: -23% / R5: -26% | K-B2(R1) |
| K-B6 | Bone Breaker | 2 | 3 | R1: stun duration on enemies +20% / R2: +35% / R3: +45%, targets cannot call for help while stunned | K-B1(R3), K-B3(R1) |
| K-B7 | Quick Disposal | 3 | 3 | R1: UNLOCKS instant concealment ability (120s CD, evidence reduction 0.20) / R2: reduction 0.30, CD -20s / R3: reduction 0.40, CD -30s | K-B5(R2) |
| K-B8 | Combat Frenzy | 3 | 5 | R1: after killing, +5% attack speed 10s / R2: +9%, 12s / R3: +12%, 14s / R4: +14%, 15s / R5: +15%, 16s | K-B4(R2), K-B6(R1) |
| K-B9 | Unstoppable | 4 | 3 | R1: stun immunity 3s after taking damage / R2: 5s / R3: 8s + slow immunity | K-B6(R3), K-B8(R2) |
| K-B10 | Apex Predator | 5 | 1 | R1: passive 1HP/2s health regen in combat. All kill methods -1s execution time. Boss targets start at 90% HP. | K-B9(R2) |

**Hard caps**: Iron Grip maxes at +14 flat damage. Tough Skin maxes at -11% damage reduction. Combat Frenzy attack speed caps at +15%. No combination allows one-hit kills on bosses.

---

#### KILLER TREE 3: DECEPTION (`packages/shared/src/data/skills/killer-deception.ts`)

Counter-play, misdirection, and evidence manipulation. **1.3x cost multiplier** vs base.

| ID | Skill Name | Tier | Max Rank | Rank Progression | Prerequisites |
|----|-----------|------|----------|-----------------|---------------|
| K-D1 | Evidence Awareness | 1 | 5 | R1: killer sees own evidence trail +10% visibility radius / R2: +18% / R3: +24% / R4: +29% / R5: +33%, evidence shows age (color-coded freshness) | None |
| K-D2 | Witness Reader | 1 | 3 | R1: see NPC alert state icons / R2: icons show witness confidence level / R3: killer sees which NPCs are informants (fed's planted informants glow) | None |
| K-D3 | Cleanup Specialist | 1 | 5 | R1: evidence cleanup radius +10px / R2: +18px / R3: +24px / R4: +29px / R5: +32px, cleanup speed +20% | None |
| K-D4 | Fake Evidence Plant | 2 | 5 | R1: UNLOCKS ability, planted evidence quality = LOW / R2: quality = MEDIUM / R3: quality = HIGH, 10% harder to detect / R4: +18% harder to detect / R5: +25% harder to detect | K-D1(R2), K-D3(R1) |
| K-D5 | Decoy Trail | 2 | 5 | R1: UNLOCKS ability, 5 footprints, last 90s / R2: 7 footprints, 120s / R3: 9 footprints, 150s / R4: 11 footprints, 180s, +10% harder to detect / R5: 13 footprints, 210s, +18% harder to detect | K-D1(R1) |
| K-D6 | Witness Intimidation | 2 | 5 | R1: UNLOCKS ability, 48px range, 2s animation / R2: 64px range / R3: 80px range, 1.5s animation / R4: 96px range / R5: 112px range, 1s animation, works with 1 NPC in LOS | K-D2(R2) |
| K-D7 | Surveillance Jamming | 3 | 5 | R1: UNLOCKS ability, 45s jam duration / R2: 60s / R3: 75s / R4: 90s / R5: 105s, jammed cameras show fake "all clear" feed | K-D4(R2), K-D5(R1) |
| K-D8 | False Alibi Construction | 3 | 3 | R1: UNLOCKS ability, 40% detection chance / R2: 30% detection chance / R3: 20% detection chance | K-D6(R3) |
| K-D9 | Master Forger | 4 | 3 | R1: all fake evidence starts +1 quality tier / R2: fake evidence decay time +50% / R3: fake evidence immune to passive detection (requires active forensic analysis) | K-D7(R2), K-D8(R1) |
| K-D10 | Phantom Identity | 5 | 1 | R1: UNLOCKS once-per-run ability: creates false DNA + weapon trace + witness statement pointing to one innocent NPC. Costs all 3 counter-play resources. 35s setup time. Adds +25 false arrest viability against target NPC if undetected. | K-D9(R3) |

**Hard caps**: Fake evidence detection reduction caps at 25% harder (rank 5 + trophy stacking max 40%). Decoy trail max 13 footprints. Witness intimidation range caps at 112px regardless of trophies. Phantom Identity is once-per-run.

---

### Killer Active Abilities (12)

Abilities are defined in `packages/shared/src/data/abilities/killer-abilities.ts` and registered in `abilityRegistry` at boot. Each ability specifies its ranks as an array of `Effect` objects (from the universal Effect system). Rank progression improves effectiveness without changing the fundamental mechanic.

| ID | Ability | Default? | Cooldown | Rank 1 | Rank 3 | Rank 5 | Hard Cap |
|----|---------|----------|----------|--------|--------|--------|----------|
| KA-1 | Silent Movement | Yes | Toggle | No footprints while sneaking, noise -30% | noise -42%, stamina drain -15% | noise -50%, stamina drain -25%, NPC hearing range -15% | noise reduction max -50% |
| KA-2 | Lockpick | Yes | 5s CD | Opens locked doors in 3s | 2.2s, BROKEN_LOCK at LOW-1 quality | 1.7s, 30% chance no evidence | min time 1.7s |
| KA-3 | Disguise Change | Yes | 45s CD | Changes sprite, heat -20 | heat -29, CD -8s | heat -35, CD -13s, 40% chance close inspection fails | heat reduction max -35 |
| KA-4 | Evidence Cleanup | Yes | 30s CD | 10s window, destroys 1 evidence/2s in 64px | 1 per 1.5s in 78px | 1 per 1s in 90px, also reduces evidence quality 1 tier | max radius 90px |
| KA-5 | Distraction Throw | Yes | 15s CD | Throw to position, 128px noise radius, NPCs investigate 8s | 160px radius, 11s | 192px radius, 14s, choose "suspicious sound" or "call for help" variant | max radius 192px |
| KA-6 | Smoke Bomb | Tree (K-S7) | 90s CD | 12s detection break, 96px cloud | 14s, 120px | 16s, 144px, applies SLOW to NPCs in cloud 3s | max duration 16s |
| KA-7 | Quick Disposal | Tree (K-B7) | 120s CD | Instant concealment, evidence reduction 0.20 | 0.30, CD -20s | 0.40, CD -30s | max reduction 0.40 |
| KA-8 | Fake Evidence Plant | Tree (K-D4) | 60s CD | Place 1 false evidence, LOW quality | MEDIUM, CD -10s | HIGH, CD -15s, +25% harder to detect | max CD reduction 15s |
| KA-9 | Decoy Trail | Tree (K-D5) | 90s CD | 5 footprints, 90s duration | 9 footprints, 150s | 13 footprints, 210s, harder to detect | max 13 footprints |
| KA-10 | Witness Intimidation | Tree (K-D6) | 45s CD | Silence 1 witness, 48px range | 80px, 1.5s anim | 112px, 1s anim, works with 1 NPC in LOS | max range 112px |
| KA-11 | Surveillance Jamming | Tree (K-D7) | 120s CD | Jam cameras 45s in 1 zone | 75s, CD -15s | 105s, CD -25s, fake "all clear" feed | max jam 105s |
| KA-12 | False Alibi Construction | Tree (K-D8) | 180s CD | Create alibi, 40% detection by fed forensics | 8s animation, 30% detection | 6s animation, 20% detection | min detection 20% |

### Expanded Weapons Catalog

Killer weapons are defined in `packages/shared/src/data/weapons/killer-weapons.ts` and registered in `weaponRegistry`. Each weapon specifies `damageTypeId` (registry string, not union), `onHitEffects` (Effect array), and optionally a `killMethodId`.

| Category | ID | Name | Rarity | Damage | Kill Method | Special |
|----------|-----|------|--------|--------|------------|---------|
| BLADE | knife_basic | Kitchen Knife | COMMON | 15 | BLADED_WEAPON | Standard blade |
| BLADE | knife_serrated | Serrated Knife | UNCOMMON | 18 | BLADED_WEAPON | +10% bleed chance |
| BLADE | scalpel | Surgical Scalpel | RARE | 12 | BLADED_WEAPON | -30% DNA evidence from cuts |
| BLUNT | pipe | Lead Pipe | COMMON | 20 | BLUNT_TRAUMA | Standard blunt |
| BLUNT | bat | Baseball Bat | UNCOMMON | 22 | BLUNT_TRAUMA | +15% stun duration |
| GARROTE | wire_basic | Piano Wire | UNCOMMON | 10 | STRANGULATION | Silent, slow |
| GARROTE | garrote_pro | Professional Garrote | RARE | 10 | STRANGULATION | -1s kill time |
| RANGED | pistol | Silenced Pistol | RARE | 18 | RANGED | 256px noise radius (vs 512 base) |
| RANGED | crossbow | Compact Crossbow | RARE | 16 | RANGED | 64px noise radius, 1 bolt |
| POISON | vial_basic | Poison Vial | RARE | 0 | POISON | Standard 30s delay |
| POISON | vial_fast | Fast-Acting Toxin | LEGENDARY | 0 | POISON | 15s delay |
| TASER | taser | Taser | UNCOMMON | 8 | MELEE | Applies ELECTROCUTION status (3s stun + 5 DOT) |
| EXPLOSIVE | pipe_bomb | Pipe Bomb | LEGENDARY | 35 | ENVIRONMENTAL | 192px AoE, massive noise (1024px), destroys all evidence in blast zone |

### Killer Tools Catalog

Defined in `packages/shared/src/data/items/killer-items.ts`, registered in `itemRegistry`.

| ID | Name | Rarity | Effect |
|----|------|--------|--------|
| lockpick_set | Lockpick Set | COMMON | Required for LOCKPICK ability (KA-2) |
| cleaning_supplies | Cleaning Supplies | COMMON | Required for EVIDENCE_CLEANUP (KA-4); stackable x3 |
| disguise_kit | Disguise Kit | UNCOMMON | Required for DISGUISE_CHANGE (KA-3); stackable x2 |
| shovel | Shovel | UNCOMMON | Required for BURIAL disposal method |
| acid_jar | Acid Jar | RARE | Required for ACID_DISSOLVE disposal (from black market) |
| noise_maker | Noise Maker | COMMON | Used by DISTRACTION_THROW (KA-5); stackable x5 |
| smoke_canister | Smoke Canister | UNCOMMON | Used by SMOKE_BOMB (KA-6); stackable x2 |
| bribery_gift | Bribery Gift | RARE | Required for FALSE_ALIBI_CONSTRUCTION (KA-12); from black market |

### MYTHIC Boss Items (7)

Boss items are MYTHIC rarity — one tier above LEGENDARY. They register in `weaponRegistry` (weapon-slot items) or `itemRegistry` (tool/armor/accessory-slot items) with `rarity: 'MYTHIC'`. Each uses a `CUSTOM` effect handler registered in `packages/game-engine/src/effects/boss-item-handlers.ts`. Each has a meaningful trade-off and build-defining playstyle impact.

**MYTHIC rarity** requires updating the equipment rarity CHECK constraint in the DB (add 'MYTHIC'). Boss items require **attunement** (5 ghost_tokens, one-time) before use.

#### KB-1: Reaper's Thread
- **Slot**: WEAPON (Garrote)
- **Unique Effect**: After a strangulation kill, a 128px "death zone" forms at the kill location for 10s. All evidence in the zone decays at 5x normal rate. If the fed enters the zone, their scan accuracy is reduced by 30%.
- **Custom Handler**: `reapers_thread_kill_zone` — creates a timed area effect at kill position, modifies evidence decay rates for evidence in radius, applies SCAN debuff to fed entities entering zone.
- **Obtain**: Defeat "The Watcher" boss on Hard difficulty with strangulation-only kill challenge.
- **Trade-off**: Garrote kills are slow (3s close contact). Sacrifices faster kill methods. Zone is small and temporary.
- **Synergy**: Stealth tree (silent approach). Conflicts with Brutality (speed-focused).

#### KB-2: Phantom Blade
- **Slot**: WEAPON (Blade)
- **Unique Effect**: Kills with this blade cause the body to become "ethereal" for 20s — invisible to NPCs and the fed's scan. After 20s the body reappears normally.
- **Custom Handler**: `phantom_blade_ethereal_kill` — sets entity ethereal flag on death, preventing detection and interaction for duration.
- **Obtain**: Score 10,000+ in a single run as Killer (must be a win).
- **Trade-off**: Only 10 base damage (lower than other blades). Body eventually appears — delay, not destruction.
- **Synergy**: Works with any skill build.

#### KB-3: The Puppeteer's Strings
- **Slot**: ACCESSORY
- **Unique Effect**: Once per run, can "puppeteer" a killed NPC — the dead NPC's sprite continues their routine for 60s. Witnesses see a normal NPC. After 60s the NPC collapses as a normal body.
- **Custom Handler**: `puppeteer_dead_npc` — creates a ghost entity following the dead NPC's patrol route, temporarily replaces the body, re-spawns body after duration.
- **Obtain**: Win 5 runs where zero NPCs enter ALARMED state (stealth perfection).
- **Trade-off**: Once per run. Takes accessory slot. Puppeteered NPC cannot speak to the fed — itself suspicious.
- **Synergy**: Stealth tree. Conflicts with Brutality builds.

#### KB-4: Crimson Catalyst
- **Slot**: TOOL
- **Unique Effect**: Every kill made within 60s of the previous kill grants a stacking "bloodlust" buff: +8% move speed, +5% attack speed, -10% noise generation per stack. Max 3 stacks. Stacks decay after 30s without a kill.
- **Custom Handler**: `crimson_catalyst_bloodlust` — tracks kill timestamps, applies/removes stacking STAT_MOD effects via StatModifierSystem.
- **Obtain**: Eliminate 4 targets in a single run within 3 minutes total.
- **Trade-off**: Encourages risky rapid killing (more evidence, witnesses). Takes tool slot — no lockpick, no cleaning supplies.
- **Synergy**: Brutality tree. Anti-synergy with Stealth.

#### KB-5: The Hollow Mask
- **Slot**: ARMOR
- **Unique Effect**: While disguised, 100% success rate on NPC close inspections. Witnesses who see the killer commit a crime while disguised remember the disguise identity — reducing heat by 15 instead of gaining heat.
- **Custom Handler**: `hollow_mask_disguise_master` — overrides disguise inspection logic, modifies heat delta on witnessed crimes while disguised.
- **Obtain**: Complete 3 different biomes using only disguise-based gameplay (all kills while disguised, no direct combat).
- **Trade-off**: 0 armor stats (0 damage reduction). If disguise is removed mid-crime, effect is lost.
- **Synergy**: Deception tree. Weak with Brutality.

#### KB-6: Nightfall Cloak
- **Slot**: ARMOR
- **Unique Effect**: During night phases: killer becomes semi-transparent (detection radius -40% instead of normal night bonus). Footprint evidence generated at night has quality reduced by 2 tiers. No effect during day phases.
- **Custom Handler**: `nightfall_cloak_night_power` — hooks into day/night cycle events, dynamically adjusts detection and evidence quality modifiers.
- **Obtain**: Win 3 runs where all kills happen during night phases.
- **Trade-off**: No effect during day phases. No armor stats. Useless in biomes without a night cycle.
- **Synergy**: Stealth tree, time-dependent planning.

#### KB-7: Memento Mori
- **Slot**: ACCESSORY
- **Unique Effect**: After each kill, spend 5s to "collect a trophy" (unique animation). Each collected trophy grants a permanent (for the run) +3% to all stat bonuses. Max 5 trophies per run. At 5 trophies, gain a one-time 10s INVISIBILITY activation.
- **Custom Handler**: `memento_mori_collect` — adds interactable action at kill sites, tracks trophy count, applies scaling STAT_MOD modifier, grants INVISIBILITY status at cap.
- **Obtain**: Win 10 runs with maximum score (all optional objectives completed).
- **Trade-off**: Spending 5s at a kill site is risky (evidence-rich location). Uses accessory slot. Modest stat bonus — requires all 5 for significant impact.
- **Synergy**: Reward-risk playstyle; works with any tree.

### Crafting System — "The Workshop"

The killer's crafting system is presented as **The Workshop** — a thematically dark, utilitarian workbench where weapons and tools are modified. It is a tab within the Equipment/Loadout page accessible between runs.

**Route**: `apps/web/src/app/progression/workshop/page.tsx`

#### Upgrade Slot System

Each piece of equipment has 1-3 upgrade slots based on rarity:
- COMMON: 1 slot | UNCOMMON: 1 slot | RARE: 2 slots | LEGENDARY: 2 slots | MYTHIC: 3 slots

Modifications are persistent (survive between runs). Removing a mod empties the slot but does NOT refund materials. Cost to remove: 2 salvage_parts.

#### Salvage Parts Material

Equipment can be dismantled for `salvage_parts` — a new crafting-specific material:
- COMMON: 1 salvage | UNCOMMON: 2 | RARE: 4 | LEGENDARY: 8 | MYTHIC: Cannot be dismantled

#### Killer Crafting Recipes — 10 Total (`packages/shared/src/data/crafting/killer-recipes.ts`)

**Tier 1: Basic Modifications (Available by default)**

| ID | Recipe Name | Category | Effects | Cost | Compatible With |
|----|------------|----------|---------|------|-----------------|
| KR-1 | Whetstone Edge | BLADE_MOD | STAT_MOD meleeDamage +3 FLAT | 8 BM + 2 salvage | WEAPON (BLADE only) |
| KR-2 | Weighted Handle | BLUNT_MOD | STAT_MOD meleeDamage +2 FLAT + APPLY_STATUS STUN durationMs:500 | 8 BM + 2 salvage | WEAPON (BLUNT only) |
| KR-3 | Reinforced Padding | ARMOR_MOD | STAT_MOD maxHealth +10 FLAT | 6 BM + 3 salvage | ARMOR |
| KR-4 | Silent Soles | TOOL_MOD | STAT_MOD noiseGeneration -5% PERCENT | 10 BM + 2 salvage | ARMOR, ACCESSORY |

**Tier 2: Advanced Modifications (Skill-gated)**

| ID | Recipe Name | Category | Effects | Cost | Compatible With | Unlock |
|----|------------|----------|---------|------|-----------------|--------|
| KR-5 | Serrated Filing | BLADE_MOD | APPLY_STATUS BLEED durationMs:4000 | 15 BM + 4 salvage + 1 GT | WEAPON (BLADE) | K-B1 rank 3 |
| KR-6 | Toxin Coating | BLADE_MOD | APPLY_STATUS POISON durationMs:6000 | 15 BM + 4 salvage + 2 GT | WEAPON (BLADE, GARROTE) | K-B4 rank 2 |
| KR-7 | Shadow Lining | ARMOR_MOD | STAT_MOD detectionRadius -8% PERCENT | 12 BM + 3 salvage + 1 GT | ARMOR | K-S6 rank 2 |
| KR-8 | Quick-Release Sheath | TOOL_MOD | STAT_MOD killAnimSpeed +10% PERCENT | 14 BM + 3 salvage + 2 GT | WEAPON (all) | K-B2 rank 3 |

**Tier 3: Master Modifications (Achievement-gated)**

| ID | Recipe Name | Category | Effects | Cost | Compatible With | Unlock |
|----|------------|----------|---------|------|-----------------|--------|
| KR-9 | Evidence-Dissolving Compound | BLADE_MOD | EVIDENCE_REDUCTION evidenceTypeId:DNA percent:0.15 | 25 BM + 8 salvage + 5 GT | WEAPON (all) | Trophy: Clean Hands |
| KR-10 | Phantom Grip | GARROTE_MOD | CUSTOM handler:phantom_grip_silent_kill params:{noiseReduction:0.90, evidenceReduction:0.30} | 30 BM + 10 salvage + 8 GT | WEAPON (GARROTE) | K-S10 unlocked (capstone) |

All recipe effects use the universal `Effect` type system. Standard effects (STAT_MOD, APPLY_STATUS, EVIDENCE_REDUCTION) require no code changes to add. KR-10 uses the CUSTOM handler pattern — `phantom_grip_silent_kill` is registered once in `crafting-handlers.ts`.

**Crafting custom handlers** live at `packages/game-engine/src/effects/crafting-handlers.ts`. Registered in game-init alongside boss item handlers.

### Build Archetypes

| Build | Primary Tree | Secondary | Trophy | Playstyle |
|-------|-------------|-----------|--------|-----------|
| Shadow Assassin | Stealth (maxed) | Deception (T1-2) | Ghost Protocol | Never detected, minimal evidence, timing over force |
| Berserker | Brutality (maxed) | Stealth (T1-2) | Butcher's Apron | Fast kills, combat strength, evidence control via speed |
| Manipulator | Deception (maxed) | Stealth (T1-2) | Frame Artist | Plants false leads, confuses fed, wins by misdirection |
| Balanced Killer | Stealth (T1-3) + Brutality (T1-3) | Deception (T1) | Clean Hands | Jack of all trades, adapts to situation |

Counter-play interactions:
- **Shadow Assassin** is strong against Tactical Commander (hard to corner), weak against Forensic Expert (thorough evidence finding)
- **Berserker** is strong against Forensic Expert (kills before case builds), weak against Tactical Commander (lockdowns, ambush)
- **Manipulator** is strong against Forensic Expert (false evidence overwhelms), weak against Intelligence Agent (informants see through)

### Target Manager

**File**: `packages/game-engine/src/killer/target-manager.ts`

Assigns specific NPCs as targets for the run. Targets are selected deterministically from the run seed (ensures multiplayer consistency — both players see the same NPC as target):

```typescript
class TargetManager {
  // Initialize targets for the run from seeded random selection of NPCs
  initTargets(allNPCs: NPC[], runSeed: string, biome: Biome): KillerTarget[]
  // Get all targets for current run
  getTargets(): KillerTarget[]
  // Get a specific target by NPC ID
  getTarget(npcId: string): KillerTarget | null
  // Mark target as killed (trigger body spawn, evidence generation)
  markTargetKilled(npcId: string, method: KillMethod): void
  // Mark target as disposed (body removed from map)
  markTargetDisposed(npcId: string, method: DisposalMethod): void
  // Check if all required targets are eliminated (for win condition)
  areAllRequiredTargetsEliminated(): boolean
  // Get current objective descriptions for HUD
  getObjectiveSummary(): RoleObjective[]
}

type KillerTarget = {
  npcId: string
  displayName: string
  status: TargetStatus
  isRequired: boolean           // optional targets give bonus score but don't block win
  killMethod: KillMethod | null // null until killed
  disposalMethod: DisposalMethod | null
  killedAt: number | null
  disposedAt: number | null
}
```

Target selection rules:
- Targets are NPCs with roles RESIDENT or WORKER (never PEDESTRIAN — they move too randomly)
- Targets are spread across different zones (no two targets in the same zone)
- Target NPCs have slightly more complex routines than ordinary NPCs of the same role (subtle behavioral tell)
- Required targets: biome difficulty `EASY` = 1, `NORMAL` = 2, `HARD` = 3

### Stealth System

**File**: `packages/game-engine/src/killer/stealth-system.ts`

```typescript
class StealthSystem {
  // Compute current stealth state from all active factors
  computeState(
    player: PlayerController,
    npcs: NPC[],
    statusEffects: StatusEffect[]
  ): StealthState
  // Generate noise event (footsteps, combat sounds) — triggers NPC awareness
  generateNoise(pos: Vec2, radiusPx: number, cause: string): void
  // Check if killer is in line-of-sight of any alerted NPC
  checkDetection(playerPos: Vec2, npcs: NPC[]): boolean
  // Apply heat increase to current heat level
  increaseHeat(amount: number, reason: string): void
  // Natural heat decay over time when player is not suspicious
  decayHeat(delta: number): void
  // Returns effective detection radius considering skills and status effects
  getEffectiveDetectionRadius(baseRadius: number, modifiers: StealthModifiers): number
  update(delta: number): void
}

type StealthModifiers = {
  detectionMultiplier: number      // from STEALTH status effect or skills
  noiseReductionMultiplier: number // from SILENT_MOVEMENT ability or items
  footprintReductionMultiplier: number  // from gloves/items affecting evidence generation
}

// Heat level drives NPC behavior:
// 0-32 (LOW): NPCs follow normal routines; player appears as ordinary NPC
// 33-65 (MEDIUM): NPCs in killer's zone show CURIOUS behavior; occasional double-takes
// 66-89 (HIGH): NPCs are SUSPICIOUS; may approach and "stare"; fed gets ambient alert hint
// 90-100 (CRITICAL): NPCs become ALERTED in killer's zone; fed receives HEAT_CRITICAL event
```

Skill modifiers are read from `StatModifierSystem.getEffectiveStat()`, not hardcoded — skills like Ghost Presence and Shadow Steps modify `detectionRadius` and `noiseGeneration` stats respectively, and the stealth system reads effective values at compute time.

### Kill System

**File**: `packages/game-engine/src/killer/kill-system.ts`

```typescript
class KillSystem {
  // Check if player is close enough to target for kill interaction
  canKill(playerPos: Vec2, targetNPC: NPC): boolean
  // Initiate kill with selected method
  executeKill(
    player: PlayerController,
    targetNPC: NPC,
    method: KillMethod,
    inventory: Inventory
  ): Result<KillResult, 'TARGET_NOT_IN_RANGE' | 'INSUFFICIENT_ITEMS' | 'TARGET_RESISTED'>
  // Handle target resistance (triggers boss encounter for specific targets)
  handleResistance(player: PlayerController, targetNPC: NPC): void
}

type KillResult = {
  targetId: string
  method: KillMethod
  bodyPos: Vec2
  evidenceGenerated: Evidence[]   // list of what was generated (for killer HUD awareness)
  wasWitnessed: boolean
  witnessIds: string[]
}

// Kill execution sequence:
// 1. Validate range and requirements
// 2. Check target resistance (some targets are boss encounters — target fights back)
// 3. Play kill animation (player + target sprites)
// 4. Call EvidenceGenerator.onEntityDied() — generates BODY + method-specific evidence
// 5. Register SuspiciousEvent with PerceptionSystem — nearby NPCs may witness
// 6. Increase heat level based on noise radius and witness count
// 7. Emit KILL_EXECUTED EventBus event
// 8. Spawn "body" interactable entity (for disposal)
```

### Disposal System

**File**: `packages/game-engine/src/killer/disposal-system.ts`

```typescript
class DisposalSystem {
  // Get available disposal locations near player position (within carry range)
  getAvailableLocations(playerPos: Vec2, biome: Biome): DisposalLocation[]
  // Begin carrying body (player movement slowed while carrying)
  pickUpBody(player: PlayerController, bodyEntityId: string): Result<void, 'NOT_IN_RANGE' | 'ALREADY_CARRYING'>
  // Drop body at current position (without disposal)
  dropBody(player: PlayerController): void
  // Attempt disposal at nearest valid disposal location
  disposeBody(
    player: PlayerController,
    location: DisposalLocation
  ): Result<DisposalResult, 'NOT_IN_RANGE' | 'MISSING_REQUIRED_ITEMS' | 'LOCATION_FULL'>
  update(delta: number): void
}

// While carrying a body:
// - Player movement speed reduced to 40% of WALK speed
// - Heat increases gradually (suspicious to nearby NPCs)
// - If NPC has line-of-sight to player while carrying: immediate ALARMED state
// - Player cannot use abilities other than DISGUISE_CHANGE while carrying
```

Disposal speed uses `StatModifierSystem.getEffectiveStat('disposalSpeed')` — the Efficient Disposal skill (K-B5) improves this stat.

### Counter-Play Abilities (KA-8 through KA-12)

The counter-play abilities are part of the Deception skill tree and use the same ability slot system as other abilities. Their mechanical effects call into evidence and NPC systems:

**KA-8 (Fake Evidence Plant)**: Calls `EvidenceManager.plantFalseEvidence()`. Risk: if fed has line-of-sight during planting, they see "suspicious crouching behavior." Costs 1 DISGUISE_KIT (repurposed for fake materials).

**KA-9 (Decoy Trail)**: Generates 5-13 FOOTPRINT FALSE_EVIDENCE objects (count scales with rank) along a path toward chosen zone. Costs 1 CLEANING_SUPPLIES.

**KA-10 (Witness Intimidation)**: Calls `NPC.silenceAsWitness()` and sets `canBeInterviewed=false` on target NPC. Requires proximity (range scales with rank). Cannot be used if another NPC has line-of-sight — unless rank 5 (can be used with 1 NPC in LOS).

**KA-11 (Surveillance Jamming)**: Calls `ZoneManager.jamCameras()`. Requires LOCKPICK_SET tool in inventory (not consumed). At rank 5, jammed cameras show fake "all clear" feed (using CUSTOM handler `surveillance_jam_fake_feed`).

**KA-12 (False Alibi Construction)**: Calls `EvidenceManager.plantFalseWitnessEvidence()` on target NPC. Requires proximity (64px) and an empty witnessLog. Fails silently if NPC is a fed informant (informants have internal state that rejects alibi). Costs 1 BRIBERY_GIFT consumable.

### Killer Role Implementation

**File**: `packages/game-engine/src/player/roles/killer-role.ts`

Implements `RoleInterface`:

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
  checkWinCondition(state: RunState): boolean
  checkLoseCondition(state: RunState): boolean
  onRunStart(config: RunConfig): void
  onRunEnd(result: RunResult): void
  onPlayerAction(action: PlayerAction): void
}

// Win condition:
// - All required targets have status KILLED or KILLED_AND_DISPOSED
// - Optional: player has reached exit zone (for escape bonus)

// Lose condition:
// - Player health reaches 0 (killed in combat)
// - Fed achieves AIRTIGHT arrest viability AND player is in arrest range
// - Run time limit exceeded (optional — depends on biome difficulty config)
```

Registered with role registry at module initialization:
```typescript
roleRegistry.register('KILLER', () => new KillerRole())
```

### Killer HUD

**File**: `apps/web/src/components/app/game/hud/KillerHUD.tsx`

React component, "use client". Only rendered when player role is KILLER. Reads from `killerStore` and `playerStore`:

- **Target list**: cards for each target NPC showing name, status (ALIVE / KILLED / DISPOSED), location hint ("Last seen: Market District")
- **Stealth indicator**: radial heat meter (0-100, color-coded: green→yellow→red→critical flash)
- **Heat status text**: "Laying Low" | "Suspicious Activity" | "High Alert" | "CRITICAL — Change Disguise"
- **Carrying indicator**: shows when body is being carried + nearest disposal locations
- **Disposal options**: list of nearby valid disposal spots when carrying body (distance + method name)
- **Counter-play ability slot**: visual indicator for available counter-play abilities (separate from combat abilities to emphasize their unique role)
- **Evidence trail count**: small counter showing "X evidence items in your trail" (prompts cleanup)

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
  counterPlayUsage: Record<KillerAbilityId, number>  // how many times each was used
  // Actions
  updateTargets: (targets: KillerTarget[]) => void
  updateStealthState: (state: StealthState) => void
  setCarryingBody: (bodyId: string | null) => void
  updateNearbyDisposals: (locations: DisposalLocation[]) => void
  incrementKillCount: () => void
  incrementDisposalCount: () => void
  recordCounterPlayUsage: (abilityId: KillerAbilityId) => void
}
```

### EventBus Integration

New events added to GameEvents:

```typescript
KILL_EXECUTED: {
  targetId: string
  method: KillMethod
  pos: Vec2
  evidenceCount: number
  wasWitnessed: boolean
  witnessIds: string[]
}
BODY_PICKUP: { bodyId: string; killerId: string }
BODY_DISPOSED: { bodyId: string; method: DisposalMethod; evidenceDestroyed: number }
HEAT_CHANGED: { level: number; tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; reason: string }
HEAT_CRITICAL: { killerPos: Vec2 }   // fed receives ambient alert hint (not exact position)
TARGET_STATUS_CHANGED: { targetId: string; status: TargetStatus }
KILLER_WIN_CONDITION_MET: { targetsKilled: number; targetsDisposed: number }
KILLER_LOSE_CONDITION_MET: { reason: 'ARRESTED' | 'KILLED' | 'TIME_LIMIT' }
COUNTER_PLAY_USED: { abilityId: KillerAbilityId; pos: Vec2 }
```

### Edge Cases

- Target NPC cannot be killed while they are in a public zone with 3+ NPCs with line-of-sight — system shows "Too many witnesses" message in HUD and cancels kill attempt (player must wait for better opportunity)
- Poison kill method has a 30-second delay — if the run ends (fed makes arrest) before the target collapses, the kill is registered as incomplete for scoring purposes
- Body must be picked up within 5 minutes of kill or it becomes fully DISCOVERABLE (weather/NPC spread effects) — timer shown in KillerHUD when body is active
- Carrying a body while another NPC has line-of-sight is an immediate ALARMED state — no grace period
- DISGUISE_CHANGE during CRITICAL heat reduces to HIGH (not LOW) — requires sustained low-profile behavior to drop further
- `FALSE_ALIBI_CONSTRUCTION` fails silently (NPC refuses interaction) if the targeted NPC is an informant placed by the fed — informants cannot be alibi'd (they have internal state that rejects it)
- If killer uses all counter-play abilities and heat remains CRITICAL, the run tips toward loss — this is intentional pressure design
- Crafted modifications count toward STAT_CAPS via StatModifierSystem — crafting bonuses cannot exceed the global caps even when combined with skill tree and equipment bonuses
- MYTHIC boss items cannot be dismantled for salvage_parts
- Boss items require attunement (5 ghost_tokens) before first equip — attunement is one-time; after that, free to equip/unequip

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

The killer role is self-contained in `packages/game-engine/src/killer/` plus its role implementation in `packages/game-engine/src/player/roles/killer-role.ts`. It registers itself with the role registry on module load. The run manager calls `roleRegistry.create('KILLER')` and from that point the role handler manages objectives, win/lose conditions, and reacts to player actions.

The four core killer sub-systems (TargetManager, StealthSystem, KillSystem, DisposalSystem) are coordinated by KillerRole — it composes them together. None of them know about each other directly.

Skills, abilities, weapons, and trophies are all data-driven via the ContentRegistry pattern (`packages/shared/src/registry/content-registry.ts`). The ProgressionEffectsEngine applies progression effects at run start by looking up registered definitions and running effects through the EffectProcessor. This piece provides the data files; the combat system and progression system wire up the execution.

### Skill Data File Organization

```
packages/shared/src/data/
  skills/
    killer-stealth.ts     # K-S1 through K-S10
    killer-brutality.ts   # K-B1 through K-B10
    killer-deception.ts   # K-D1 through K-D10
  abilities/
    killer-abilities.ts   # KA-1 through KA-12, all ranks
  weapons/
    killer-weapons.ts     # 13 killer weapons
  items/
    killer-items.ts       # Killer tool definitions
  boss-items/
    killer-boss-items.ts  # KB-1 through KB-7 (MYTHIC)
  trophies/
    killer-trophies.ts    # 18 killer trophies (KT-1 through KT-18)
  crafting/
    killer-recipes.ts     # KR-1 through KR-10
```

Each file exports a typed const array that is registered in `_register-all.ts`.

### Boss Item Custom Handler Registration

Boss item handlers are defined in `packages/game-engine/src/effects/boss-item-handlers.ts` and registered with the EffectProcessor during game initialization:

```typescript
import { BOSS_ITEM_HANDLERS } from './effects/boss-item-handlers';

// In game initialization:
for (const [name, handler] of Object.entries(BOSS_ITEM_HANDLERS)) {
  effectProcessor.registerCustomHandler(name, handler);
}
```

Each handler is keyed by the same string used in the `CUSTOM` effect's `handler` field. Adding a new boss item only requires adding the data entry and (if the handler doesn't already exist) one handler function. Existing handlers can be reused — e.g., a second boss item that creates a decay zone would reference `reapers_thread_kill_zone` if the params match.

### Crafting Recipe Data Structure

Recipes are defined in `packages/shared/src/data/crafting/killer-recipes.ts` with the `CraftingRecipe` type from `packages/shared/src/types/crafting.ts`. They register in `craftingRecipeRegistry`. The `apply-mod.ts` Server Action validates:
1. User owns the equipment
2. Equipment has an empty slot at the requested index
3. Recipe is compatible with equipment category/slot
4. User meets unlock condition (checked against `user_skills` or `user_trophies` in DB)
5. User has sufficient materials (checked in `user_materials`)
6. Atomically deducts materials and inserts `user_equipment_mods` row

### Progression Effects Engine Integration

At run start, the ProgressionEffectsEngine reads the player's equipped items and their applied mods from `user_equipment_mods`. For each mod, it looks up the recipe in `craftingRecipeRegistry` and adds the recipe's effects to the `ProgressionEffectBundle.equipmentModEffects` array. All effects are then applied through the EffectProcessor, subject to the same STAT_CAPS as skill and trophy effects.

### Target Seeding Strategy

Targets are selected via seeded random:
```typescript
function selectTargets(allNPCs: NPC[], seed: string, count: number): NPC[] {
  const rng = new SeededRandom(seed + 'targets')
  const eligibleNPCs = allNPCs.filter(npc => npc.role === 'RESIDENT' || npc.role === 'WORKER')
  return rng.sample(eligibleNPCs, count)
}
```

The same seed produces the same target selection, ensuring multiplayer consistency (both players see the same NPC as the target).

### Kill Window Design

The "too many witnesses" rule for kill attempts is a deliberate design choice: it forces the killer to observe and plan rather than rushing. The killer must:
1. Learn target's routine
2. Find moments when target is alone or in a low-NPC-density area
3. Create kill windows (e.g., use DISTRACTION to move NPCs away, or wait for target to enter a building)

This is what makes the killer's gameplay cerebral rather than action-reflexes.

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| Zustand | latest | killerStore, craftingStore in apps/web |
| Phaser | 3.90.0 | Kill/disposal animations in game-engine |
| TypeScript | 5.9.3 | Strict types throughout |
| Zod | latest | Content schema validation |

### Testing Strategy

- Unit tests for TargetManager: target selection seeding (same seed = same targets), status tracking
- Unit tests for StealthSystem: heat level calculation, decay rate, detection checks
- Unit tests for KillSystem: range validation, evidence profile per method, witness detection
- Unit tests for DisposalSystem: location availability, requirement validation, evidence reduction math
- Unit tests for counter-play abilities: fake evidence creates isFalse=true object, witness intimidation clears log, alibi fails on informants
- Unit tests for STAT_CAPS: crafting + skill stacking does not exceed caps
- Unit tests for crafting: apply-mod validates all 6 conditions, remove-mod charges 2 salvage
- Component tests for KillerHUD: heat meter renders correct color tier, target list shows correct statuses
- Boot test: all killer skill/ability/weapon/item/boss-item data files register without error
- E2E: full killer run — assign targets, observe routine, execute kill, carry body, dispose, win condition triggers (Playwright)

### Constitution Compliance

- [x] No barrel files — all imports direct to specific files
- [x] No React in game-engine package — all killer logic in packages/game-engine
- [x] KillerHUD in apps/web/src/components/app/game/hud/ reads Zustand
- [x] EventBus for kill signals (KILL_EXECUTED, BODY_DISPOSED, HEAT_CRITICAL)
- [x] Zustand killerStore for continuous killer state
- [x] Role registry pattern — KillerRole self-registers on import
- [x] Data-driven kill methods and disposal requirements (constants file, not hardcoded in systems)
- [x] Result<T,E> for KillSystem.executeKill(), DisposalSystem.disposeBody()
- [x] ContentRegistry for all skill/ability/weapon/item/boss-item definitions
- [x] STAT_CAPS enforced via StatModifierSystem for crafting and skill stacking
- [x] Server Actions for crafting mutations (apply-mod, remove-mod, dismantle-equipment)
- [x] No direct process.env — all config through centralized env.ts

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

- `packages/game-engine/src/killer/target-manager.ts`
- `packages/game-engine/src/killer/stealth-system.ts`
- `packages/game-engine/src/killer/kill-system.ts`
- `packages/game-engine/src/killer/disposal-system.ts`
- `packages/game-engine/src/killer/killer-abilities.ts`
- `packages/game-engine/src/player/roles/killer-role.ts`
- `packages/game-engine/src/effects/boss-item-handlers.ts`
- `packages/game-engine/src/effects/crafting-handlers.ts`
- `packages/shared/src/data/skills/killer-stealth.ts`
- `packages/shared/src/data/skills/killer-brutality.ts`
- `packages/shared/src/data/skills/killer-deception.ts`
- `packages/shared/src/data/abilities/killer-abilities.ts`
- `packages/shared/src/data/weapons/killer-weapons.ts`
- `packages/shared/src/data/items/killer-items.ts`
- `packages/shared/src/data/boss-items/killer-boss-items.ts`
- `packages/shared/src/data/trophies/killer-trophies.ts`
- `packages/shared/src/data/crafting/killer-recipes.ts`
- `packages/shared/src/types/killer.ts`
- `packages/shared/src/types/disposal.ts`
- `packages/shared/src/types/crafting.ts`
- `packages/shared/src/constants/killer.ts`
- `packages/shared/src/schemas/crafting-schemas.ts`
- `apps/web/src/stores/killer.ts`
- `apps/web/src/stores/crafting.ts`
- `apps/web/src/components/app/game/hud/KillerHUD.tsx`
- `apps/web/src/components/app/crafting/CraftingStation.tsx`
- `apps/web/src/components/app/crafting/RecipeList.tsx`
- `apps/web/src/components/app/crafting/RecipeCard.tsx`
- `apps/web/src/components/app/crafting/ModSlotViewer.tsx`
- `apps/web/src/components/app/crafting/DismantleConfirm.tsx`
- `apps/web/src/app/progression/workshop/page.tsx`
- `apps/web/src/app/actions/crafting/apply-mod.ts`
- `apps/web/src/app/actions/crafting/remove-mod.ts`
- `apps/web/src/app/actions/crafting/dismantle-equipment.ts`
- `apps/web/src/dal/crafting/recipes.ts`
- `apps/web/src/dal/crafting/mods.ts`
- `supabase/migrations/XXX_crafting.sql` — crafting_recipes + user_equipment_mods tables
- `supabase/migrations/XXX_mythic_rarity.sql` — equipment rarity constraint update

### Dependencies (Consumed from Earlier Pieces)

- Piece 01: Result utilities, Pino logger
- Piece 03: Design system for KillerHUD and Workshop UI
- Piece 04: EventBus, game constants, Zustand
- Piece 05: ZoneManager (disposal location zones), spawn manager
- Piece 06: NPC class, NPCSpawner, PerceptionSystem, InteractionManager
- Piece 07: RoleInterface, RoleRegistry, PlayerController, Inventory, PlayerAction, RunManager, RunState
- Piece 08: CombatController (target resistance), AbilitySystem, StatusEffectSystem, BossManager, EffectProcessor, ContentRegistry, StatModifierSystem, STAT_CAPS
- Piece 09: EvidenceManager (plantFalseEvidence, createDecayZone), EvidenceModifiers, EvidenceGenerator

### Success Criteria

- [ ] Targets are correctly assigned from seeded random (same seed → same targets across runs)
- [ ] Kill system respects "too many witnesses" rule — blocks kill in public areas
- [ ] Each kill method generates exactly the correct evidence types per `KILL_METHOD_EVIDENCE_PROFILES`
- [ ] Body disposal reduces evidence by the correct `evidenceReductionFactor` per method
- [ ] Heat meter rises and falls correctly; NPC behavior changes at correct thresholds
- [ ] Carrying body correctly reduces movement speed and increases heat generation
- [ ] DISGUISE_CHANGE changes sprite variant and reduces heat by 20 (rank 1)
- [ ] FAKE_EVIDENCE_PLANT creates FALSE_EVIDENCE with isFalse=true in EvidenceManager
- [ ] WITNESS_INTIMIDATION clears targetNPC.witnessLog and sets canBeInterviewed=false
- [ ] All 3 skill trees (K-S, K-B, K-D) have correct tier gating and prerequisite enforcement
- [ ] Adjusted skill costs (R1:2, R2:4, R3:7+1GT, R4:12+2GT, R5:18+4GT) enforced correctly
- [ ] Deception tree uses 1.3x cost multiplier; Stealth/Brutality use 0.8x
- [ ] All 13 killer weapons register in weaponRegistry without error
- [ ] All 7 MYTHIC boss items (KB-1 through KB-7) equip correctly and trigger their CUSTOM handlers
- [ ] Boss item attunement requires 5 ghost_tokens (one-time)
- [ ] Crafting: apply-mod validates 6 conditions and atomically deducts materials
- [ ] KillerHUD renders heat meter, target list, carrying state, nearby disposal options
- [ ] Win condition triggers correctly when all required targets are killed/disposed
- [ ] Crafted mods count toward STAT_CAPS and cannot exceed global limits

### Alignment Notes

The counter-play abilities (fake evidence, decoy trail, witness intimidation, surveillance jamming, false alibi) have their mechanical effects live in the evidence and NPC systems. The killer triggers them as ability activations — the Deception skill tree unlocks each ability and improves its rank (radius, duration, detection chance). This piece implements the killer's access to those abilities.

The stealth system heat meter is the killer's real-time feedback loop. A CRITICAL heat level doesn't mean the fed is about to make an arrest — it means the killer has been too conspicuous and needs to reset. This ambiguity is intentional tension.

Piece 12 (session-economy) will add the black market encounter where killers acquire rare items (acid jars, bribery consumables for false alibi construction). This piece stubs the item definitions; piece 12 defines where they're acquired.

The crafting system (The Workshop) is the killer side of a shared mechanic. The fed's side (The Armory) is defined in piece 11. Both systems use the same ContentRegistry infrastructure, the same `crafting_recipes` and `user_equipment_mods` database tables, and the same Server Actions — only the data files and UI theming differ.
