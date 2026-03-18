---
vision: killer-vs-fed-roguelite
sequence: 08
name: combat-system
group: Core Gameplay
group_order: 3
status: pending
depends_on:
  - project-scaffold
  - game-engine-bootstrap
  - entity-and-npc-system
  - player-and-roles
  - world-and-maps
  - design-system
produces:
  - "Combat controller: initiates, manages, and resolves combat encounters"
  - "Combat types: CombatState, Attack, DamageType, CombatResult, Ability, AbilityEffect, StatusEffect"
  - "Combat constants: base damage, dodge chance, block reduction, status effect durations"
  - "Health system: HP pool, damage calculation, healing, death/knockout, invincibility frames"
  - "Attack system: melee (arc, range, cooldown), ranged (projectile, accuracy), hitbox detection"
  - "Ability system: active abilities with cooldowns, resource costs, and effects"
  - "Status effects system: buff/debuff system with 25 status effects across 4 categories, stacking rules, hard caps"
  - "Stat modifier system: StatModifierSystem with STAT_CAPS enforcement at packages/shared/src/constants/balance.ts"
  - "Content registry: ContentRegistry<T> generic pattern at packages/shared/src/registry/"
  - "Universal Effect type system: Effect union at packages/shared/src/effects/effect-types.ts; EffectProcessor at packages/game-engine/src/effects/effect-processor.ts"
  - "Data-driven content: all status effects, damage types, and abilities defined in packages/shared/src/data/ and registered at boot"
  - "Combat AI: NPC/boss attack patterns and difficulty scaling"
  - "Boss framework: phase transitions, special attack patterns, data-driven configs"
  - "Combat HUD: enemy health bar, ability cooldowns, damage numbers, status indicators"
  - "Combat Zustand store: combat state for React HUD"
  - "Combat animations: attack sequences, hit effects, death animations"
created: 2026-03-17
last_aligned: never
---

# Vision Piece 08: Combat System

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: project-scaffold, game-engine-bootstrap, entity-and-npc-system, player-and-roles

---

## Feature Specification

> **Usage**: Copy everything below this line through the next `---` separator, then
> paste after typing `/speckit.specify `

Build the real-time combat system shared by both roles. Combat in this game supports two contexts: regular encounters (player vs NPC guards, hostile NPCs) that occur in the map scene without scene transitions, and structured encounters (killer confronting a target that fights back, or fed directly confronting the killer) that use a more deliberate pacing. The system must emit enough detail in its events that the evidence system (piece 09) can generate appropriate forensic traces from combat actions.

The combat system is built on a data-driven content architecture. All status effects, damage types, and abilities are defined as typed data objects in `packages/shared/src/data/` and registered in content registries at boot. The engine processes effects generically through the universal Effect type — adding new damage types, status effects, or abilities requires only a new data file entry, not code changes.

### Dependency Context (Inline)

This piece depends on outputs from earlier pieces. These are reproduced here in full so this document is self-contained:

**From project-scaffold**:
```
packages/shared/src/utils/result.ts:
  - ok<T>(value: T): Ok<T, never>
  - err<E>(error: E): Err<never, E>
  - type AppError = { code: string; message: string }
apps/web/src/lib/logger/pino.ts — Pino singleton
```

**From game-engine-bootstrap**:
```typescript
// packages/game-engine/src/events/event-bus.ts
eventBus.emit<K>(event: K, payload: GameEvents[K]): void
eventBus.on<K>(event: K, handler: (payload: GameEvents[K]) => void): void

// packages/shared/src/constants/game.ts
TICK_RATE: number
// packages/game-engine/src/scenes/scene-keys.ts — SceneKey enum
// apps/web/src/stores/game.ts — { isRunning, isPaused, currentScene }
```

**From entity-and-npc-system**:
```typescript
// packages/game-engine/src/entities/base-entity.ts
abstract class BaseEntity {
  id: string; pos: Vec2; velocity: Vec2
  health: number | null; maxHealth: number | null
  entityType: EntityType
  takeDamage(amount: number, source: string): void
  heal(amount: number): void
  setAnimation(key: AnimationKey, direction: Direction): void
}
// packages/game-engine/src/ai/perception.ts
perceptionSystem.registerSuspiciousEvent(event: SuspiciousEvent): void
// packages/shared/src/types/entity.ts — Entity, EntityType, EntityState
```

**From player-and-roles**:
```typescript
// packages/game-engine/src/player/player-controller.ts
class PlayerController extends BaseEntity {
  role: PlayerRole
  movementMode: MovementMode
  stamina: number
  inventory: Inventory
  useAbility(abilityId: string): boolean
  performAction(action: PlayerAction): void
}
// packages/game-engine/src/player/player-actions.ts — PlayerAction, PlayerActionType
// packages/game-engine/src/player/inventory.ts — Inventory.useItem()
// packages/game-engine/src/run/run-manager.ts — RunManager.getCurrentState()
// packages/shared/src/types/player.ts — PlayerRole, PlayerAbility, RoleConfig
// packages/shared/src/types/inventory.ts — InventoryItem, ItemEffect
// apps/web/src/stores/player.ts — player Zustand store
// apps/web/src/stores/hud.ts — HUDStore.addNotification()
```

### Combat System Overview

Combat is **real-time action**, Hades-style. There is no turn-based mode. The player attacks using their input-bound ability slots and movement. Enemies use the combat AI to pick attacks and abilities. The system is designed for integration with both the open map scene (no transition for regular encounters) and more deliberate confrontation scenes for role-specific boss moments.

Combat produces detailed EventBus events so the evidence system can reconstruct what happened: who attacked whom, with what weapon, where, and who was nearby as a witness.

### Data-Driven Content Architecture

All combat content (status effects, damage types, abilities) follows the **ContentRegistry pattern**. The engine never hardcodes specific effect IDs in switch statements — it processes definitions generically through their `effects` arrays.

**File**: `packages/shared/src/registry/content-registry.ts`

```typescript
/**
 * Generic content registry. Stores typed definitions keyed by string ID.
 * All game content registers here at module load time. The engine looks up
 * definitions by ID at runtime.
 *
 * ADDING NEW CONTENT: Create a new entry in the appropriate data file
 * (e.g., packages/shared/src/data/status-effects.ts). The registry
 * validates the entry against its Zod schema at registration time.
 * No other code changes needed for standard effect types.
 */
export class ContentRegistry<T extends { id: string }> {
  private entries = new Map<string, T>();
  private schema: ZodSchema<T>;
  private name: string;

  constructor(name: string, schema: ZodSchema<T>) { ... }

  register(entry: T): void          // validates via Zod, throws on duplicate
  registerAll(entries: T[]): void
  get(id: string): T | undefined
  getOrThrow(id: string): T         // throws on unknown ID (fail fast)
  has(id: string): boolean
  getAll(): T[]
  getByFilter(predicate: (entry: T) => boolean): T[]
}
```

**File**: `packages/shared/src/registry/registries.ts`

One registry instance per content type:

```typescript
export const statusEffectRegistry = new ContentRegistry('StatusEffect', statusEffectDefSchema);
export const damageTypeRegistry   = new ContentRegistry('DamageType', damageTypeDefSchema);
export const abilityRegistry      = new ContentRegistry('Ability', abilityDefSchema);
export const itemRegistry         = new ContentRegistry('Item', itemDefSchema);
export const weaponRegistry       = new ContentRegistry('Weapon', weaponDefSchema);
export const trophyRegistry       = new ContentRegistry('Trophy', trophyDefSchema);
export const skillRegistry        = new ContentRegistry('Skill', skillDefSchema);
```

**Boot registration**: `packages/shared/src/data/_register-all.ts` exports a `registerAllContent()` function that imports all data files and calls `registry.registerAll()` for each content type. Called once in `packages/game-engine/src/game-init.ts` before any gameplay begins.

**Type evolution**: The hardcoded `type DamageType = 'MELEE' | 'RANGED' | ...` union is replaced by `type DamageTypeId = string` (validated against the registry at runtime). Compile-time exhaustiveness checking is traded for runtime validation via `getOrThrow()` and Zod schemas at registration.

### Universal Effect System

Every game mechanic that modifies state is expressed as an `Effect`. Skills, abilities, trophies, weapons, status effects, and crafting modifications all produce Effects.

**File**: `packages/shared/src/effects/effect-types.ts`

```typescript
export type Effect =
  // Stat modifications
  | { type: 'STAT_MOD'; stat: StatId; value: number; modType: 'FLAT' | 'PERCENT' }
  // Damage effects
  | { type: 'DAMAGE'; damageTypeId: string; value: number }
  | { type: 'DAMAGE_PER_TICK'; value: number }
  | { type: 'HEAL'; value: number }
  // Status effect application
  | { type: 'APPLY_STATUS'; statusId: string; durationMs?: number; magnitude?: number }
  | { type: 'REMOVE_STATUS'; statusId: string }
  | { type: 'CLEANSE_CATEGORY'; category: string }
  // Movement effects
  | { type: 'KNOCKBACK'; force: number; directionFromSource: boolean }
  | { type: 'TELEPORT'; distance: number; direction: 'FORWARD' | 'BACKWARD' | 'RANDOM' }
  | { type: 'PREVENT_MOVEMENT' }
  | { type: 'PREVENT_ATTACK' }
  // Ability effects
  | { type: 'ABILITY_UNLOCK'; abilityId: string }
  | { type: 'COOLDOWN_REDUCTION'; abilityId: string; percent: number }
  | { type: 'COOLDOWN_REDUCTION_ALL'; percent: number }
  // Evidence effects (killer)
  | { type: 'EVIDENCE_REDUCTION'; evidenceTypeId: string | null; percent: number }
  | { type: 'GENERATE_EVIDENCE'; evidenceType: string; quality: string; probability: number }
  | { type: 'DESTROY_EVIDENCE'; radius: number; maxCount: number }
  // Investigation effects (fed)
  | { type: 'SCAN_RADIUS_MOD'; percent: number }
  | { type: 'DISCOVERY_SPEED_MOD'; multiplier: number }
  | { type: 'FALSE_EVIDENCE_DETECTION_MOD'; percent: number }
  | { type: 'ARREST_VIABILITY_MOD'; flat: number }
  // Heat effects
  | { type: 'HEAT_GENERATION_MOD'; percent: number }
  | { type: 'HEAT_DECAY_MOD'; percent: number }
  | { type: 'HEAT_COST_MOD'; percent: number }
  | { type: 'HEAT_CAP_MOD'; flat: number }
  // Item effects
  | { type: 'START_WITH_ITEM'; itemId: string }
  | { type: 'ITEM_STACK_MOD'; itemId: string; amount: number }
  // Meta effects
  | { type: 'MATERIAL_DROP_MOD'; percent: number }
  | { type: 'DURATION_MOD'; targetEffectId: string; percent: number }
  // Custom escape hatch for truly novel mechanics
  | { type: 'CUSTOM'; handler: string; params: Record<string, number | string | boolean> };

export type StatId =
  | 'moveSpeed' | 'maxHealth' | 'meleeDamage' | 'rangedDamage' | 'attackSpeed'
  | 'dodgeChance' | 'blockReduction' | 'staminaRegenRate'
  | 'detectionRadius' | 'noiseGeneration' | 'footprintRate'
  | 'killAnimSpeed' | 'disposalSpeed' | 'carrySpeed'
  | 'scanRadius' | 'interviewReliability' | 'evidenceQualityMod' | 'evidenceDecayRate'
  | string;  // extensible — new stats added as strings, no code changes
```

**File**: `packages/game-engine/src/effects/effect-processor.ts`

```typescript
/**
 * Processes an array of Effects against a target entity.
 * The processor is generic — it does not know about specific content IDs.
 * It interprets effect types and applies them to the appropriate systems.
 */
export class EffectProcessor {
  constructor(
    private healthSystem: HealthSystem,
    private statusEffectSystem: StatusEffectSystem,
    private statModifierSystem: StatModifierSystem,
    private evidenceManager: EvidenceManager,
    private abilitySystem: AbilitySystem,
  ) {}

  applyEffects(effects: Effect[], sourceId: string, targetId: string, context: EffectContext): void
  registerCustomHandler(name: string, handler: CustomEffectHandler): void
  // Registered handlers are called for Effect objects with type: 'CUSTOM'
}

type EffectContext = {
  pos: Vec2;
  scene: Phaser.Scene;
  evidenceManager: EvidenceManager;
  statModifierSystem: StatModifierSystem;
  entityManager: EntityManager;
  surveillanceSystem: SurveillanceSystem;
  healthSystem: HealthSystem;
};
```

The `CUSTOM` effect type is the escape hatch for novel mechanics (e.g., boss item kill zones, NPC lure abilities). Custom handlers are registered in `game-init.ts` and kept in dedicated files (`boss-item-handlers.ts`, `crafting-handlers.ts`). Standard effect types (STAT_MOD, APPLY_STATUS, DAMAGE, etc.) require zero code changes when adding new content.

### Shared Types

**File**: `packages/shared/src/types/combat.ts`

```typescript
// DamageType is now a string ID validated against damageTypeRegistry
type DamageTypeId = string

type Attack = {
  id: string
  attackerId: string
  defenderId: string
  damageTypeId: DamageTypeId
  rawDamage: number
  finalDamage: number     // after reductions applied
  weaponId: string | null
  pos: Vec2               // impact position (for evidence spawning)
  timestamp: number
}

type CombatResult = {
  winner: string | null   // entity ID, null if combat abandoned
  loser: string | null
  durationMs: number
  attacks: Attack[]
  isLethal: boolean
  lootDropped: InventoryItem[]
}

type StatusEffect = {
  id: string
  name: string
  statusDefId: string     // ID in statusEffectRegistry
  durationMs: number
  remainingMs: number
  magnitude: number       // damage per tick, speed reduction %, etc.
  sourceId: string        // entity that applied this effect
  stackIndex: number      // 0 for first stack, 1 for second, etc.
}

type CombatState = {
  isInCombat: boolean
  currentTargetId: string | null
  activeEffects: StatusEffect[]
  lastAttackMs: number
  combatStartMs: number
}

type AbilityEffect = {
  type: 'DAMAGE' | 'HEAL' | 'APPLY_STATUS' | 'REMOVE_STATUS' | 'KNOCKBACK' | 'TELEPORT'
  value: number
  statusType?: string
  durationMs?: number
  radius?: number         // AoE radius in pixels
}

type Ability = {
  id: string
  name: string
  description: string
  cooldownMs: number
  currentCooldownMs: number
  resourceCost: number
  effects: AbilityEffect[]
  range: number           // pixels; 0 = self-cast
  animKey: string
  role: PlayerRole | 'ANY'
  tier: number
}
```

**File**: `packages/shared/src/constants/combat.ts`

```typescript
const BASE_MELEE_DAMAGE = 25
const BASE_RANGED_DAMAGE = 18
const DODGE_CHANCE_BASE = 0.10        // 10% base dodge
const BLOCK_DAMAGE_REDUCTION = 0.40  // 40% reduction when blocking
const INVINCIBILITY_FRAMES_MS = 500  // after taking damage
const POISON_TICK_MS = 1000
const BLEED_TICK_MS = 750
const STUN_DURATION_MS = 2000
const SLOW_MOVEMENT_MULTIPLIER = 0.40
const STEALTH_DETECTION_MULTIPLIER = 0.20  // while stealthed, detection radius 20% of normal
const MAX_STATUS_EFFECTS = 5
const BOSS_HEALTH_MULTIPLIER = Record<BiomeDifficulty, number>  // scales boss HP per biome
const COMBAT_ESCAPE_DISTANCE_PX = 512  // distance to auto-resolve as "fled"
```

### Expanded Status Effects Catalog

All 25 status effects are defined as data objects in `packages/shared/src/data/status-effects.ts` and registered in `statusEffectRegistry` at boot. The `StatusEffectSystem` looks up definitions by ID — no hardcoded switch statements.

#### Combat Status Effects

| ID | Name | Category | Duration | Tick Rate | Effect | Stacks? | Max Stacks | Counter |
|----|------|----------|----------|-----------|--------|---------|------------|---------|
| POISON | Poison | DOT | 8s | 1000ms | 4 damage/tick | Yes | 3 (12 dmg/tick max) | ANTIDOTE item, CLEANSE ability |
| BLEED | Bleeding | DOT | 6s | 750ms | 3 damage/tick | Yes | 5 (15 dmg/tick max) | BANDAGE item, stops on heal |
| BURN | Burning | DOT | 5s | 1000ms | 5 damage/tick, leaves SCORCH_MARK evidence (30% probability per tick) | Yes | 2 (10 dmg/tick max) | WATER interaction, roll action |
| ELECTROCUTION | Electrocution | CC_DOT | 3s | 500ms | 2 damage/tick + cannot move or attack | No | 1 | Wears off, INSULATED_EQUIPMENT |
| STUN | Stunned | CC | 2s | — | Cannot move or attack | No | 1 (refreshes duration) | STUN_RESIST skill |
| SLOW | Slowed | DEBUFF | 4s | — | Movement speed x0.40 | No | 1 (refreshes duration) | SPEED_BOOST cancels |
| KNOCKBACK | Knocked Back | CC | 0.5s | — | Forced movement 128px from source | No | 1 | Cannot be resisted |
| DISORIENTED | Disoriented | DEBUFF | 3s | — | Controls reversed (left=right, up=down) | No | 1 | Wears off only |
| EXPOSED | Exposed | DEBUFF | 6s | — | Damage taken +20% | Yes | 2 (+40% max) | Wears off |

#### Movement/Stealth Status Effects

| ID | Name | Category | Duration | Effect | Stacks? | Counter |
|----|------|----------|----------|--------|---------|---------|
| STEALTH | Stealthed | BUFF | Until action | Detection radius 20% of normal | No | NPC ALARMED breaks stealth |
| INVISIBILITY | Invisible | BUFF | 15s (from Perfect Shadow skill) | NPCs completely ignore, detection radius 0% | No | Attacking breaks invisibility |
| SPEED_BOOST | Speed Boost | BUFF | 10s | Movement speed x1.30 | No | — |
| HASTE | Haste | BUFF | 8s | Attack speed +20%, ability cooldowns tick 20% faster | No | — |
| SNARED | Snared | CC | 3s | Cannot move, can still attack | No | Wears off |
| CRIPPLED | Crippled | DEBUFF | 10s | Movement speed x0.60, cannot sprint | No | HEAL removes |

#### Stat Modifier Status Effects

| ID | Name | Category | Duration | Effect | Stacks? | Max |
|----|------|----------|----------|--------|---------|-----|
| DAMAGE_BOOST | Damage Up | BUFF | 10s | Damage dealt +15% | Yes | 3 (+45%) |
| DEFENSE_BOOST | Defense Up | BUFF | 10s | Damage taken -15% | Yes | 3 (-45%) |
| FOCUS | Focused | BUFF | 15s | Ability cooldowns -20% | No | 1 |
| WEAKENED | Weakened | DEBUFF | 8s | Damage dealt -15% | Yes | 2 (-30%) |
| VULNERABLE | Vulnerable | DEBUFF | 6s | Cannot dodge or block | No | 1 |

#### Investigation/Evidence Status Effects (non-combat)

| ID | Name | Category | Duration | Effect | Applied To |
|----|------|----------|----------|--------|------------|
| HEIGHTENED_AWARENESS | Heightened Awareness | BUFF | 20s | Evidence discovery radius +30% | Fed only |
| TUNNEL_VISION | Tunnel Vision | DEBUFF | 10s | Evidence discovery radius -30% | Fed (rough interrogation overuse) |
| PANIC | Panicked | DEBUFF | 15s | Heat generation +50% | Killer (spotted by multiple NPCs) |
| COMPOSED | Composed | BUFF | 20s | Heat generation -30% | Killer (successful disposal) |
| FORENSIC_FOCUS | Forensic Focus | BUFF | 30s | Evidence quality upgrade instant | Fed (crime scene analysis) |

#### Stacking Rules (Universal)

1. Effects of the **same ID** stack according to their `maxStacks` value. Each stack adds the full effect magnitude.
2. Effects of **different IDs** in the same category always stack (e.g., POISON + BLEED both do DOT simultaneously).
3. **CC effects** (STUN, KNOCKBACK, ELECTROCUTION, SNARED) do NOT stack with each other — the most recent replaces the current. Duration does not extend.
4. **BUFF + DEBUFF** of the same stat cancel partially: if DAMAGE_BOOST (+15%) and WEAKENED (-15%) are both active, net is 0%.
5. **Duration refresh**: applying the same effect while active refreshes duration to full. Stacks refresh independently.

### StatModifierSystem with Hard Caps

**File**: `packages/shared/src/constants/balance.ts`

```typescript
export const STAT_CAPS: Record<string, { maxPercent?: number; maxFlat?: number }> = {
  moveSpeed:            { maxPercent: 0.15 },   // max +15% from all sources
  footprintRate:        { maxPercent: -0.85 },  // cannot reduce below 15% of base
  detectionRadius:      { maxPercent: -0.50 },  // NPCs always detect within 50% of base radius
  noiseGeneration:      { maxPercent: -0.50 },  // min 50% noise
  meleeDamage:          { maxFlat: 80 },         // total melee damage (base 25 + max 55)
  rangedDamage:         { maxFlat: 60 },
  scanRadius:           { maxPercent: 0.40 },   // max +40% fed scan radius
  interviewReliability: { maxPercent: 0.15 },   // max +15% witness reliability
  heatCostReduction:    { maxPercent: -0.40 },  // counter-play heat costs min 60% of base
  falseEvidenceDetection: { maxPercent: 0.50 }, // max 50% passive detection
};
```

**File**: `packages/game-engine/src/combat/stat-modifier-system.ts`

```typescript
class StatModifierSystem {
  addModifier(entityId: string, stat: StatId, value: number, modType: 'FLAT' | 'PERCENT'): void
  addTemporaryModifier(entityId: string, stat: StatId, value: number, modType: 'FLAT' | 'PERCENT', durationMs: number, maxStacks?: number): void
  removeModifier(entityId: string, modifierId: string): void
  getEffectiveStat(entityId: string, stat: StatId, baseValue: number): number
  // Enforces STAT_CAPS: percent bonuses clamped, flat bonuses capped
  update(delta: number): void  // ticks temporary modifier durations
}
```

The `getEffectiveStat` method accumulates all flat and percent modifiers for an entity's stat, then clamps against the relevant `STAT_CAPS` entry. Skills, equipment, trophies, and crafting modifications all flow through this system — caps apply to total across ALL sources.

### Health System

**File**: `packages/game-engine/src/combat/health-system.ts`

Manages HP, invincibility frames, death/knockout. Both players and NPC entities use this:

```typescript
class HealthSystem {
  // Applies damage to entity, respecting armor, invincibility frames
  applyDamage(entity: BaseEntity, attack: Attack, modifiers: DamageModifiers): DamageResult
  // Heals entity, capped at maxHealth
  applyHeal(entity: BaseEntity, amount: number, sourceId: string): number
  // Returns true if entity is in invincibility window
  isInvincible(entityId: string): boolean
  // Starts invincibility frames for entity
  startInvincibility(entityId: string, durationMs: number): void
  // Handles entity death — triggers ENTITY_DIED event, loot drops, NPC reactions
  handleDeath(entity: BaseEntity, killedBy: Attack): void
  // Handles knockout (for non-lethal encounters) — entity is incapacitated, not dead
  handleKnockout(entity: BaseEntity, durationMs: number): void
  // Registers a callback fired whenever this entity takes damage (used by boss items)
  registerDamageCallback(entityId: string, callback: () => void): void
  update(delta: number): void  // ticks invincibility windows
}

type DamageModifiers = {
  armorReduction: number   // 0-1 flat reduction
  dodgeChance: number      // 0-1 probability
  damageMultiplier: number // from status effects / skills
}

type DamageResult = {
  finalDamage: number
  wasDodged: boolean
  wasBlocked: boolean
  remainingHealth: number
  isDead: boolean
}
```

### Attack System

**File**: `packages/game-engine/src/combat/attack-system.ts`

Handles melee and ranged attack execution using Phaser Arcade physics hitboxes:

```typescript
class AttackSystem {
  // Execute a melee attack arc around attacker
  meleeSweep(attacker: BaseEntity, config: MeleeConfig): Attack[]
  // Fire a projectile toward target position
  fireProjectile(attacker: BaseEntity, targetPos: Vec2, config: RangedConfig): void
  // Check if attacker's hitbox overlaps defender — called each frame during attack animation
  checkHitbox(attacker: BaseEntity, defender: BaseEntity, hitbox: Phaser.Geom.Rectangle): boolean
  update(scene: Phaser.Scene, delta: number): void
}

type MeleeConfig = {
  damage: number
  damageTypeId: string    // registry ID, not hardcoded union
  range: number           // pixels from attacker center
  arc: number             // degrees — 90 = frontal quarter-circle, 360 = all directions
  cooldownMs: number
  weaponId: string | null
  knockbackForce: number
}

type RangedConfig = {
  damage: number
  damageTypeId: string    // registry ID
  speed: number           // projectile pixels/second
  range: number           // max travel distance before despawn
  accuracy: number        // 0-1: 1.0 = perfect aim, lower = angular spread
  weaponId: string | null
  spriteKey: string       // projectile sprite
}
```

### Ability System

**File**: `packages/game-engine/src/combat/ability-system.ts`

```typescript
class AbilitySystem {
  // Register abilities for an entity (called when role is set or loadout applied)
  registerAbilities(entityId: string, abilities: Ability[]): void
  // Attempt to use an ability — checks cooldown, resource cost
  useAbility(entityId: string, abilityId: string, targetPos: Vec2): Result<AbilityEffect[], 'ON_COOLDOWN' | 'INSUFFICIENT_RESOURCE'>
  // Apply effects to target entity — delegates to EffectProcessor
  applyEffects(effects: AbilityEffect[], caster: BaseEntity, target: BaseEntity | null, targetPos: Vec2): void
  // Tick cooldowns
  update(delta: number): void
  // Get current cooldown state for HUD
  getAbilityCooldowns(entityId: string): Record<string, number>
}
```

Abilities are defined in data files (`packages/shared/src/data/abilities/`) and registered in `abilityRegistry` at boot. The ability system reads definitions from the registry to resolve effects — no hardcoded ability logic for standard effect types. Novel abilities (lure NPC, area reveal) use the `CUSTOM` effect handler pattern.

### Status Effects System

**File**: `packages/game-engine/src/combat/status-effects.ts`

```typescript
class StatusEffectSystem {
  applyEffect(entityId: string, effect: StatusEffect): void
  applyFromDefinition(entityId: string, def: StatusEffectDef, durationMs?: number, magnitude?: number): void
  removeEffect(entityId: string, effectId: string): void
  getEffects(entityId: string): StatusEffect[]
  hasEffect(entityId: string, statusDefId: string): boolean
  // Process per-tick effects (poison damage, bleed damage) and tick down durations
  update(entities: BaseEntity[], delta: number): void
  // Returns current movement speed multiplier for entity
  getSpeedMultiplier(entityId: string): number
  // Returns current damage multiplier for entity
  getDamageMultiplier(entityId: string): number
  // Returns detection radius multiplier for entity (accounts for STEALTH, INVISIBILITY)
  getDetectionMultiplier(entityId: string): number
}
```

Status effect behavior is driven by the definition object retrieved from `statusEffectRegistry`. The system processes effects generically: DOT effects deal `DAMAGE_PER_TICK`, CC effects set movement/attack flags, BUFF/DEBUFF effects delegate to `StatModifierSystem`. The `GENERATE_EVIDENCE` effect type (used by BURN) calls `evidenceManager.addEvidence()`.

### Extensibility: Adding New Content

**Adding a new status effect** (e.g., BURN — already in catalog):
1. Add definition to `packages/shared/src/data/status-effects.ts`
2. If using only standard effect types (DAMAGE_PER_TICK, GENERATE_EVIDENCE, STAT_MOD): zero code changes. Redeploy.
3. If the effect requires novel behavior not covered by existing effect types: add a new `type` discriminant to the `Effect` union in `effect-types.ts` and a handler in `EffectProcessor`. This is the only code change needed.

**Adding a new damage type** (e.g., FIRE):
1. Add definition to `packages/shared/src/data/damage-types.ts`
2. Define `onHitEffects` (e.g., APPLY_STATUS for BURN) using existing effect types
3. Zero code changes if effects are standard. Redeploy.

**CUSTOM effect handler pattern** for novel mechanics:
```typescript
// One-time registration in game-init.ts:
effectProcessor.registerCustomHandler('lure_npc', (params, sourceId, targetId, context) => {
  const npcsInRadius = npcSpawner.getNPCsInRadius(context.pos, params.radius as number);
  const targets = npcsInRadius.slice(0, params.maxTargets as number);
  for (const npc of targets) {
    npc.setLureTarget(context.pos, params.duration as number * 1000);
  }
});
// After this handler exists, any future "lure" ability references it:
// { type: 'CUSTOM', handler: 'lure_npc', params: { radius: 128, duration: 10, maxTargets: 1 } }
```

### Combat AI

**File**: `packages/game-engine/src/combat/combat-ai.ts`

NPC and boss combat behavior. Uses a simpler decision tree than the full behavior tree (optimized for combat cadence):

```typescript
class CombatAI {
  // Initialize combat AI for a target entity (NPC or boss)
  setupCombatant(entity: BaseEntity, config: CombatAIConfig): void
  // Run one AI decision cycle for entity
  tick(entity: BaseEntity, player: PlayerController, delta: number): void
}

type CombatAIConfig = {
  attackPattern: AttackPattern[]  // ordered or weighted list of attacks to use
  aggressionLevel: number         // 0-1: how often AI attacks vs waits
  fleeThresholdHp: number | null  // null = never flees; otherwise % HP to flee at
  difficultyMultiplier: number    // scales damage and reaction speed
}

type AttackPattern = {
  attackId: string
  weight: number        // probability weight in pool
  minRange: number      // only use this attack within this range
  maxRange: number
  cooldownMs: number
}
```

### Boss Framework

**File**: `packages/game-engine/src/combat/boss-manager.ts`

```typescript
class BossManager {
  // Create a boss encounter for a specific entity
  initBossEncounter(bossConfig: BossConfig, player: PlayerController, scene: Phaser.Scene): void
  // Check for phase transitions based on boss HP
  update(bossEntity: BaseEntity, delta: number): void
  // End boss encounter
  endEncounter(result: 'PLAYER_WIN' | 'PLAYER_LOSS' | 'PLAYER_FLED'): CombatResult
}

type BossConfig = {
  id: string
  entityId: string
  displayName: string
  phases: BossPhase[]
  lootTable: BossLoot[]
}

type BossPhase = {
  phaseNumber: number
  triggerHpPercent: number    // triggers when HP drops below this %
  attackPatterns: AttackPattern[]
  specialAbilities: string[]  // ability IDs unlocked in this phase
  speedMultiplier: number
  onPhaseStart?: string       // animation/event key
}

type BossLoot = {
  itemId: string
  dropChance: number          // 0-1
  quantity: [number, number]  // min, max
}
```

Boss configs are data-driven JSON files in `packages/game-engine/src/combat/boss-configs/`:
- `target-boss.json` — used when a killer target fights back
- `fed-boss.json` — used when fed directly confronts the killer (vigilante mode)

### Combat HUD

**File**: `apps/web/src/components/app/game/hud/CombatHUD.tsx`

React component, "use client", reads from `combatStore` Zustand:
- Enemy health bar (name + HP percentage)
- Player ability slots with cooldown overlay (1-4 slots, key hints)
- Damage numbers: floating text animations above hit entities (spawned by Phaser, not React — use Phaser's DynamicBitmapText or similar)
- Active status effect icons (with remaining duration tick-down)
- Combat flee hint (shows when player is far enough from enemy)

**File**: `apps/web/src/stores/combat.ts`

```typescript
type CombatStore = {
  isInCombat: boolean
  enemyId: string | null
  enemyName: string | null
  enemyHealth: number
  enemyMaxHealth: number
  playerAbilities: Ability[]  // with current cooldowns
  playerEffects: StatusEffect[]
  enemyEffects: StatusEffect[]
  canFlee: boolean
  // Actions
  setCombatTarget: (id: string, name: string, maxHp: number) => void
  updateEnemyHealth: (health: number) => void
  updateAbilityCooldown: (abilityId: string, cooldownMs: number) => void
  addEffect: (effect: StatusEffect, target: 'player' | 'enemy') => void
  removeEffect: (effectId: string, target: 'player' | 'enemy') => void
  clearCombat: () => void
}
```

### Combat Animations

**File**: `packages/game-engine/src/combat/combat-animations.ts`

Manages attack animation triggers, hit flash effects, and death animations within the Phaser scene:

```typescript
class CombatAnimations {
  // Play attack animation on entity sprite
  playAttack(entity: BaseEntity, attackKey: string): void
  // Flash entity sprite red briefly on hit
  playHitFlash(entity: BaseEntity): void
  // Play death/knockout animation
  playDeath(entity: BaseEntity, isKnockout: boolean): void
  // Spawn hit particle at position
  spawnHitParticle(scene: Phaser.Scene, pos: Vec2, damageTypeId: string): void
  // Floating damage number (Phaser text object, not React)
  spawnDamageNumber(scene: Phaser.Scene, pos: Vec2, amount: number, isCritical: boolean): void
}
```

### EventBus Integration

New events added to GameEvents:

```typescript
COMBAT_STARTED: { attackerId: string; defenderId: string; pos: Vec2 }
DAMAGE_DEALT: {
  attack: Attack
  finalDamage: number
  wasDodged: boolean
  defenderRemainingHealth: number
  witnesses: string[]  // NPC IDs with line-of-sight to impact pos — for evidence system
}
ENTITY_DIED: { entityId: string; killedById: string; weapon: string | null; pos: Vec2; isPlayer: boolean }
ENTITY_KNOCKED_OUT: { entityId: string; knockedOutById: string; pos: Vec2 }
COMBAT_ENDED: { result: CombatResult }
STATUS_EFFECT_APPLIED: { entityId: string; effect: StatusEffect }
STATUS_EFFECT_REMOVED: { entityId: string; effectId: string }
BOSS_PHASE_CHANGED: { bossId: string; newPhase: number }
ABILITY_USED_IN_COMBAT: { entityId: string; abilityId: string; targetId: string | null; pos: Vec2 }
```

The `DAMAGE_DEALT` event includes `witnesses: string[]` — this is the NPC IDs that had line-of-sight to the attack impact. The evidence system (piece 09) uses this to mark those NPCs as witnesses to violence, without the combat system needing to know about evidence mechanics directly.

### Edge Cases

- Invincibility frames prevent damage stacking during combo attacks — 500ms window
- Dodge is calculated per-attack, not per-frame — a missed dodge can be followed by another dodge opportunity
- Boss phase transitions are not interrupted by player attacks — the transition animation plays to completion before resuming combat
- If both player and target reach 0 HP simultaneously, the player is treated as winner (they delivered the killing blow)
- Status effects from trophies (piece 13) must be applied before combat starts — not mid-combat
- Combat AI must not pathfind through walls when chasing player — use pathfinding grid, not direct-line movement
- Floating damage numbers must be pooled (not instantiated fresh each hit) for performance
- Registry boot validation: if any data file entry fails Zod schema validation, `registerAllContent()` throws. This is caught in CI integration tests before reaching production.

---

## Planning Guidance

> **Usage**: Copy everything below this line through the next `---` separator, then
> paste after typing `/speckit.plan `

### Architecture Approach

All combat logic lives in `packages/game-engine/src/combat/`. The combat controller is the orchestrator. The attack, health, ability, stat modifier, and status effect systems are components the controller coordinates. The boss manager is a higher-level coordinator for structured encounters. The EffectProcessor is the universal translation layer between Effect data objects and system calls.

The damage pipeline flows through: `AttackSystem (hitbox check)` → `HealthSystem.applyDamage (modifiers)` → `EventBus DAMAGE_DEALT (evidence system gets witnesses)` → `CombatAnimations.playHitFlash` → Zustand `combatStore` update → `CombatHUD` re-renders.

### Registry Pattern Implementation

Implement the ContentRegistry as a generic class in `packages/shared/src/registry/content-registry.ts`. Create registry instances in `registries.ts`. Create Zod schemas for each content type in `packages/shared/src/schemas/content-schemas.ts`. Create `_register-all.ts` that imports all data files and registers them. Call `registerAllContent()` in game initialization before any scene loads.

**Boot test requirement**: Write a test in `packages/shared/tests/registry/boot.test.ts` that calls `registerAllContent()` and asserts every registry has expected minimum entry counts. This catches malformed data file entries in CI.

### Effect Processor Architecture

The EffectProcessor switch statement handles all standard Effect types. Each `case` calls into the appropriate system (healthSystem, statusEffectSystem, statModifierSystem, evidenceManager, abilitySystem). The `CUSTOM` case delegates to registered handlers via a `Map<string, CustomEffectHandler>`. Unknown effect types are logged at WARN level (forward compatibility for future content not yet in this version's handler set).

### Status Effects Registration at Boot

All 25 status effects (9 combat, 6 movement/stealth, 5 stat modifier, 5 investigation/evidence) are defined in `packages/shared/src/data/status-effects.ts` as an exported const array. They register in `statusEffectRegistry` during `registerAllContent()`. The `StatusEffectSystem` calls `statusEffectRegistry.getOrThrow(statusDefId)` when applying or processing an effect.

### Phaser Arcade Physics for Hitboxes

Use `scene.physics.add.overlap(attackerHitbox, defenderGroup, callback)` for hitbox detection. Create invisible rectangle physics bodies for melee arc sweeps. These are short-lived: created when attack animation starts, destroyed when it ends. This avoids complex geometric intersection math.

### Data-Driven Boss Configs

Boss configs in JSON allow content to be added without code changes. Structure:
```json
{
  "id": "target-boss",
  "phases": [
    { "phaseNumber": 1, "triggerHpPercent": 1.0, "attackPatterns": [...] },
    { "phaseNumber": 2, "triggerHpPercent": 0.5, "attackPatterns": [...], "speedMultiplier": 1.3 }
  ]
}
```

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| Phaser | 3.90.0 | Arcade physics for hitbox overlap detection |
| Zustand | latest | combatStore in apps/web |
| TypeScript | 5.9.3 | Strict types, all combat types exported from shared |
| Zod | latest | Schema validation for content registry entries |

### Testing Strategy

- Unit tests for HealthSystem: damage calculation, invincibility windows, death trigger
- Unit tests for StatusEffectSystem: effect application by registry lookup, tick-down, speed/damage multipliers, stacking rules
- Unit tests for AbilitySystem: cooldown tracking, resource cost rejection, effect application via EffectProcessor
- Unit tests for AttackSystem: melee arc geometry, ranged accuracy spread
- Unit tests for BossManager: phase transition at correct HP thresholds
- Unit tests for StatModifierSystem: STAT_CAPS enforcement across multiple modifier sources
- Unit tests for ContentRegistry: duplicate ID rejection, Zod validation, getOrThrow error
- Boot test: `registerAllContent()` succeeds and all registries have expected counts
- Component tests for CombatHUD: renders correct enemy name/HP, ability cooldown overlays
- E2E: player engages enemy, takes damage, HUD updates, enemy dies (Playwright)

### Constitution Compliance

- [x] No barrel files — all imports direct to specific files
- [x] No React in game-engine package — all combat logic in game-engine
- [x] EventBus for combat events (DAMAGE_DEALT, ENTITY_DIED, COMBAT_ENDED)
- [x] Zustand combatStore for HUD state
- [x] Result<T,E> for AbilitySystem.useAbility()
- [x] Boss configs data-driven (JSON) not hardcoded
- [x] Object pooling for projectiles and damage number text objects
- [x] Zod validation in ContentRegistry schemas
- [x] No direct process.env — registry uses no env vars; game config through centralized config

---

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

- `packages/game-engine/src/combat/combat-controller.ts`
- `packages/game-engine/src/combat/health-system.ts`
- `packages/game-engine/src/combat/attack-system.ts`
- `packages/game-engine/src/combat/ability-system.ts`
- `packages/game-engine/src/combat/status-effects.ts`
- `packages/game-engine/src/combat/stat-modifier-system.ts`
- `packages/game-engine/src/combat/combat-ai.ts`
- `packages/game-engine/src/combat/boss-manager.ts`
- `packages/game-engine/src/combat/combat-animations.ts`
- `packages/game-engine/src/combat/boss-configs/target-boss.json`, `fed-boss.json`
- `packages/game-engine/src/effects/effect-processor.ts`
- `packages/game-engine/src/effects/boss-item-handlers.ts`
- `packages/game-engine/src/effects/crafting-handlers.ts`
- `packages/shared/src/registry/content-registry.ts`
- `packages/shared/src/registry/registries.ts`
- `packages/shared/src/effects/effect-types.ts`
- `packages/shared/src/constants/balance.ts`
- `packages/shared/src/constants/combat.ts`
- `packages/shared/src/data/status-effects.ts`
- `packages/shared/src/data/damage-types.ts`
- `packages/shared/src/data/_register-all.ts`
- `packages/shared/src/schemas/content-schemas.ts`
- `packages/shared/src/types/combat.ts`
- `apps/web/src/stores/combat.ts`
- `apps/web/src/components/app/game/hud/CombatHUD.tsx`

### Dependencies (Consumed from Earlier Pieces)

- Piece 01: Result utilities, Pino logger
- Piece 04: EventBus, Phaser game config (Arcade physics), scene keys
- Piece 06: BaseEntity (takeDamage, heal), PerceptionSystem.registerSuspiciousEvent()
- Piece 07: PlayerController, PlayerAction types, Inventory.useItem(), RoleConfig, stores

### Success Criteria

- [ ] Player can attack NPCs and damage them correctly
- [ ] Melee arc does not hit entities behind walls (line-of-sight gating)
- [ ] All 25 status effects (apply, tick, expire) work correctly via registry lookup
- [ ] Boss phases transition at correct HP thresholds
- [ ] CombatHUD updates reactively during combat (enemy HP, cooldowns)
- [ ] DAMAGE_DEALT event includes correct witness IDs for evidence system integration
- [ ] Invincibility frames prevent hit-stacking during 500ms window
- [ ] Combat flee triggers when player moves COMBAT_ESCAPE_DISTANCE_PX from enemy
- [ ] STAT_CAPS enforced correctly when multiple modifier sources stack
- [ ] ContentRegistry rejects duplicate IDs and invalid data at boot
- [ ] Boot test passes: `registerAllContent()` succeeds with all registries populated
- [ ] EffectProcessor handles CUSTOM handlers correctly; unknown effect types are WARN-logged, not thrown

### Alignment Notes

The `witnesses` field on `DAMAGE_DEALT` is the coupling point between the combat system and the evidence system (piece 09). The combat system does not generate evidence directly — it emits detailed events and the evidence system subscribes to translate those into forensic traces. This keeps the two systems decoupled.

The status effect system is the hook for temporary powerups (piece 12) and trophy passives (piece 13). Those pieces call `StatusEffectSystem.applyFromDefinition()` with long-duration or permanent effects at run initialization — not adding any new mechanism, just extending the same system.

The ContentRegistry pattern established here is the foundation that all content systems (skills, trophies, equipment, crafting) in pieces 10, 11, and 13 depend on. Changes to the registry interface or Effect type union will cascade to all downstream pieces.
