---
vision: killer-vs-fed-roguelite
sequence: 08
name: combat-system
group: Core Gameplay
group_order: 3
status: pending
depends_on:
  - "01: Result utilities, Pino logger, shared types scaffold"
  - "03: Design system components (AppButton, AppCard) for CombatHUD React component"
  - "04: EventBus, Phaser game config (Arcade physics), scene keys, Zustand game store"
  - "05: World/map data, biome types, collision layer (melee arc wall-gating)"
  - "06: BaseEntity (takeDamage, heal, setAnimation), PerceptionSystem.registerSuspiciousEvent(), entity types"
  - "07: PlayerController, PlayerAction types, Inventory.useItem(), RoleConfig, player and HUD Zustand stores"
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

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Build the real-time combat system shared by both roles. Combat in this game supports two contexts: regular encounters (player vs NPC guards, hostile NPCs) that occur in the map scene without scene transitions, and structured encounters (killer confronting a target that fights back, or fed directly confronting the killer) that use a more deliberate pacing. The system must emit enough detail in its events that the evidence system (piece 09) can generate appropriate forensic traces from combat actions.

The combat system is built on a data-driven content architecture. All status effects, damage types, and abilities are defined as typed data objects and registered in content registries at boot. The engine processes effects generically — adding new damage types, status effects, or abilities requires only a new data file entry, not code changes.

### Dependency Context (Inline)

This piece depends on several earlier systems. These are described here so this document is self-contained.

**Project scaffold** provides the shared Result type for fallible operations and a Pino logger singleton.

**Game engine bootstrap** provides the EventBus (emit and subscribe typed events), the physics tick rate constant, and the game Zustand store.

**Entity and NPC system** provides the base entity class (which has health values and damage/heal methods the combat system calls), the perception system (for registering suspicious events caused by combat), and the entity type definitions.

**Player and roles** provides the player controller (extends base entity), player action types, the inventory class (combat can trigger item use), the run manager (for querying current run state), player types (role, ability, role config), inventory item types, and the player and HUD Zustand stores.

### Combat Overview

Combat is real-time action with no turn-based mode. The player attacks using input-bound ability slots and movement. Enemies use combat AI to select and execute attacks. The system integrates seamlessly into the open map scene for regular encounters and supports more deliberate structured encounters for boss moments.

Combat emits detailed EventBus events so the evidence system can reconstruct what happened: who attacked whom, with what weapon, at what position, and who was nearby as a witness. The combat system does not generate evidence directly — it provides the raw data that the evidence system acts on.

### Data-Driven Content Architecture

All combat content (status effects, damage types, abilities) is defined in typed data objects and registered in a generic content registry at game boot. The engine never hardcodes specific effect IDs in switch statements — it looks up definitions by ID at runtime. This means:

- Adding a new status effect requires only a new entry in the status effects data file and zero code changes (if using standard effect types)
- Adding a new damage type works the same way
- Adding new abilities follows the same pattern
- Novel mechanics that cannot be expressed by standard effect types use a custom handler registration pattern — one handler function registered once covers any number of abilities that share that mechanic

The content registry is a generic class parameterized on the content type. It stores typed definitions keyed by string ID, validates entries against a Zod schema at registration time, rejects duplicate IDs, and provides fail-fast lookup (throws on unknown ID). A single boot registration function imports all data files and registers them with their respective registries before any gameplay begins.

Each content type has its own registry instance: status effects, damage types, abilities, items, weapons, trophies, and skills.

The hardcoded damage type union is replaced by a string ID that is validated against the damage type registry at runtime. This trades compile-time exhaustiveness checking for runtime validation and unlimited content extensibility.

### Universal Effect System

Every game mechanic that modifies state is expressed as an Effect. Skills, abilities, trophies, weapons, status effects, and crafting modifications all produce arrays of Effects. The EffectProcessor applies Effect arrays to the appropriate game systems without knowing about specific content IDs.

The Effect union covers: stat modifications (flat or percent), damage, damage per tick, healing, applying or removing status effects, cleansing a status category, knockback, teleport, preventing movement or attacks, ability unlock and cooldown modification, evidence reduction and generation, heat modification, item granting, and a custom escape hatch for novel mechanics.

Stats that can be modified are identified by string IDs (not a closed union) for extensibility: movement speed, max health, melee damage, ranged damage, attack speed, dodge chance, block reduction, stamina regen rate, detection radius, noise generation, footprint rate, kill animation speed, disposal speed, carry speed, scan radius, interview reliability, evidence quality modifier, evidence decay rate, and others added by future content.

The EffectProcessor receives an array of Effects and a source/target entity pair, then delegates to the appropriate subsystem: health system for damage and healing, status effect system for status application, stat modifier system for stat changes, evidence manager for evidence effects, and ability system for ability-related effects. The custom handler type receives a named handler lookup — if no handler is found for a given name, the processor logs a warning rather than throwing (forward compatibility).

Custom handlers are registered once in the game initialization file and referenced by name string in ability and item data entries. This means adding a new ability that shares an existing mechanic requires zero code — just the data entry.

### Status Effects

The game has 25 status effects across four categories, all defined as data objects registered at boot.

**Combat effects (9):** Poison (damage over time, stacks up to 3), Bleeding (damage over time, stacks up to 5, stops on healing), Burning (damage over time with a chance to generate evidence each tick, stacks up to 2), Electrocution (damage over time plus movement and attack prevention, does not stack), Stun (no movement or attacks for a duration, refreshes on re-application), Slow (reduced movement speed multiplier), Knockback (forced displacement in a single pulse), Disoriented (reversed controls), and Exposed (increased damage taken, stacks up to 2).

**Movement and stealth effects (6):** Stealthed (reduced detection radius until the player takes an action), Invisible (NPCs completely ignore the player, very short duration, broken by attacking), Speed Boost, Haste (faster attack speed and cooldown reduction), Snared (cannot move but can still attack), and Crippled (reduced movement speed with no sprinting).

**Stat modifier effects (5):** Damage Up (stackable damage bonus), Defense Up (stackable damage reduction), Focused (cooldown reduction), Weakened (stackable damage penalty), and Vulnerable (no dodging or blocking).

**Investigation and evidence effects (5, non-combat):** Heightened Awareness (evidence discovery radius increase for fed), Tunnel Vision (discovery radius reduction from overusing interrogation tactics), Panicked (heat generation increase for killer spotted by many NPCs), Composed (heat generation reduction from successful disposal), and Forensic Focus (instant evidence quality upgrade for fed at crime scenes).

Stacking rules: same-ID effects stack up to their configured maximum, with each stack adding the full magnitude. Different-ID effects in the same category stack independently. Crowd control effects do not stack with each other — the most recent replaces the current. Opposing buff and debuff effects on the same stat cancel partially. Applying an effect that is already active refreshes its duration.

### Stat Modifier System with Hard Caps

All stat modifications from all sources (skills, equipment, trophies, crafting, status effects) flow through a single stat modifier system. The system accumulates all modifiers for a given stat and clamps the total result against per-stat hard caps. This prevents any combination of upgrades from crossing design boundaries.

Hard cap values: movement speed bonus is capped at 15% increase; footprint generation cannot be reduced below 15% of the base rate; NPC detection radius cannot be reduced below 50%; noise generation cannot be reduced below 50%; total melee damage is capped; total ranged damage is capped; fed scan radius bonus is capped at 40% increase; witness reliability improvement is capped at 15%; heat cost reduction is capped at 40%; false evidence passive detection chance is capped at 50%.

Modifiers can be permanent for a run or temporary with a duration. Temporary modifiers support stack limits.

### Health System

Both player and NPC entities use the same health system. It applies damage with modifiers (armor reduction, dodge chance, damage multiplier), applies healing capped at max health, manages invincibility windows (entities cannot be hit again for a short period after taking damage), handles death (triggers the ENTITY_DIED event, drops loot, triggers NPC reactions), and handles knockout for non-lethal encounters. Damage callbacks can be registered for boss item effects that trigger on any damage received.

### Attack System

The attack system executes melee sweeps and fires projectiles using Phaser Arcade physics hitboxes. Melee attacks define a damage value, damage type ID, range in pixels, arc angle, cooldown, optional weapon ID, and knockback force. Ranged attacks define a damage value, damage type ID, projectile speed and maximum range, accuracy, optional weapon ID, and a projectile sprite key.

Hitboxes for melee attacks are created as invisible physics bodies at attack start and destroyed at attack end — this is simpler and more performant than geometric arc intersection math.

### Ability System

Abilities are defined in data files and registered in the ability registry at boot. The ability system tracks registered abilities per entity, evaluates cooldown and resource cost before allowing use, delegates effect application to the EffectProcessor, ticks cooldown timers, and provides current cooldown state for the HUD. Standard abilities need no code — their Effects are data. Novel abilities use the custom handler pattern.

### Status Effect System

The status effect system applies effects by looking up their definition from the status effect registry, evaluates stacking and CC rules, processes per-tick effects (damage over time) and ticks down remaining durations, and exposes composite multipliers for movement speed, damage output, and detection radius that other systems query each frame.

### Combat AI

NPC and boss combat uses a simpler decision tree optimized for combat cadence rather than the full behavior tree. Combat AI is configured with an attack pattern (a weighted list of attacks with range requirements and cooldowns), an aggression level, an optional flee threshold by HP percentage, and a difficulty multiplier that scales damage and reaction speed.

### Boss Framework

Boss encounters are structured confrontations with multiple phases triggered by HP thresholds. Each phase defines different attack patterns, special ability unlocks, and a speed multiplier. Boss configurations are data-driven JSON files so content can be added without code changes. The boss manager initializes an encounter, monitors HP for phase transitions (transition animations play to completion before resuming combat), and resolves the encounter with a win, loss, or flee outcome.

Two boss configs exist: one for when a killer target fights back, one for when the fed directly confronts the killer.

### Combat HUD

A React client component reads from the combat Zustand store and displays: the current enemy's name and health percentage, the player's ability slots with cooldown overlay indicators, active status effect icons with remaining duration, and a flee hint when the player is far enough from the enemy.

Floating damage numbers are Phaser text objects (not React), pooled for performance.

The combat Zustand store tracks: whether combat is active, the current enemy's ID, name, and health, the player's active abilities with cooldowns, active status effects on both player and enemy, and whether the player can flee.

### Combat Animations

A combat animations class manages attack animation playback on entity sprites, a brief red flash on the sprite when the entity takes a hit, death and knockout animations, hit particles at the impact position, and floating damage number text objects spawned in the Phaser scene.

### Evidence Integration

The DAMAGE_DEALT event includes the IDs of all NPCs that had line-of-sight to the attack impact position. This is the sole coupling between the combat system and the evidence system — the combat system provides witness IDs, and the evidence system subscribes to that event and creates appropriate forensic traces. The combat system knows nothing about evidence mechanics.

### Edge Cases

- Invincibility frames prevent damage stacking during combo attacks
- Dodge is calculated per attack, not per frame — a failed dodge on one attack does not affect the next
- Boss phase transitions are not interrupted by player attacks — the transition animation completes before combat resumes
- If both player and target reach zero HP simultaneously, the player is treated as the winner (they delivered the killing blow)
- Status effects from trophies must be applied before combat starts, not mid-combat
- Combat AI must use pathfinding when chasing the player, not direct-line movement
- Floating damage numbers must be object-pooled, not instantiated fresh on each hit
- If any data file entry fails schema validation at boot, the registration function throws — this is caught in CI before reaching production

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

All combat logic lives in `packages/game-engine/src/combat/`. The combat controller is the orchestrator. The attack, health, ability, stat modifier, and status effect systems are components the controller coordinates. The boss manager is a higher-level coordinator for structured encounters. The EffectProcessor is the universal translation layer between Effect data objects and system calls.

The damage pipeline flows through: `AttackSystem (hitbox check)` → `HealthSystem.applyDamage (modifiers)` → `EventBus DAMAGE_DEALT (evidence system gets witnesses)` → `CombatAnimations.playHitFlash` → Zustand `combatStore` update → `CombatHUD` re-renders.

### Shared Types

**File**: `packages/shared/src/types/combat.ts`

```typescript
type DamageTypeId = string  // validated against damageTypeRegistry at runtime

type Attack = {
  id: string
  attackerId: string
  defenderId: string
  damageTypeId: DamageTypeId
  rawDamage: number
  finalDamage: number
  weaponId: string | null
  pos: Vec2
  timestamp: number
}

type CombatResult = {
  winner: string | null
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
  magnitude: number
  sourceId: string
  stackIndex: number
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
  radius?: number
}

type Ability = {
  id: string
  name: string
  description: string
  cooldownMs: number
  currentCooldownMs: number
  resourceCost: number
  effects: AbilityEffect[]
  range: number
  animKey: string
  role: PlayerRole | 'ANY'
  tier: number
}
```

**File**: `packages/shared/src/constants/combat.ts`

```typescript
const BASE_MELEE_DAMAGE = 25
const BASE_RANGED_DAMAGE = 18
const DODGE_CHANCE_BASE = 0.10
const BLOCK_DAMAGE_REDUCTION = 0.40
const INVINCIBILITY_FRAMES_MS = 500
const POISON_TICK_MS = 1000
const BLEED_TICK_MS = 750
const STUN_DURATION_MS = 2000
const SLOW_MOVEMENT_MULTIPLIER = 0.40
const STEALTH_DETECTION_MULTIPLIER = 0.20
const MAX_STATUS_EFFECTS = 5
const BOSS_HEALTH_MULTIPLIER: Record<BiomeDifficulty, number>
const COMBAT_ESCAPE_DISTANCE_PX = 512
```

### Universal Effect Type

**File**: `packages/shared/src/effects/effect-types.ts`

```typescript
export type Effect =
  | { type: 'STAT_MOD'; stat: StatId; value: number; modType: 'FLAT' | 'PERCENT' }
  | { type: 'DAMAGE'; damageTypeId: string; value: number }
  | { type: 'DAMAGE_PER_TICK'; value: number }
  | { type: 'HEAL'; value: number }
  | { type: 'APPLY_STATUS'; statusId: string; durationMs?: number; magnitude?: number }
  | { type: 'REMOVE_STATUS'; statusId: string }
  | { type: 'CLEANSE_CATEGORY'; category: string }
  | { type: 'KNOCKBACK'; force: number; directionFromSource: boolean }
  | { type: 'TELEPORT'; distance: number; direction: 'FORWARD' | 'BACKWARD' | 'RANDOM' }
  | { type: 'PREVENT_MOVEMENT' }
  | { type: 'PREVENT_ATTACK' }
  | { type: 'ABILITY_UNLOCK'; abilityId: string }
  | { type: 'COOLDOWN_REDUCTION'; abilityId: string; percent: number }
  | { type: 'COOLDOWN_REDUCTION_ALL'; percent: number }
  | { type: 'EVIDENCE_REDUCTION'; evidenceTypeId: string | null; percent: number }
  | { type: 'GENERATE_EVIDENCE'; evidenceType: string; quality: string; probability: number }
  | { type: 'DESTROY_EVIDENCE'; radius: number; maxCount: number }
  | { type: 'SCAN_RADIUS_MOD'; percent: number }
  | { type: 'DISCOVERY_SPEED_MOD'; multiplier: number }
  | { type: 'FALSE_EVIDENCE_DETECTION_MOD'; percent: number }
  | { type: 'ARREST_VIABILITY_MOD'; flat: number }
  | { type: 'HEAT_GENERATION_MOD'; percent: number }
  | { type: 'HEAT_DECAY_MOD'; percent: number }
  | { type: 'HEAT_COST_MOD'; percent: number }
  | { type: 'HEAT_CAP_MOD'; flat: number }
  | { type: 'START_WITH_ITEM'; itemId: string }
  | { type: 'ITEM_STACK_MOD'; itemId: string; amount: number }
  | { type: 'MATERIAL_DROP_MOD'; percent: number }
  | { type: 'DURATION_MOD'; targetEffectId: string; percent: number }
  | { type: 'CUSTOM'; handler: string; params: Record<string, number | string | boolean> };

export type StatId =
  | 'moveSpeed' | 'maxHealth' | 'meleeDamage' | 'rangedDamage' | 'attackSpeed'
  | 'dodgeChance' | 'blockReduction' | 'staminaRegenRate'
  | 'detectionRadius' | 'noiseGeneration' | 'footprintRate'
  | 'killAnimSpeed' | 'disposalSpeed' | 'carrySpeed'
  | 'scanRadius' | 'interviewReliability' | 'evidenceQualityMod' | 'evidenceDecayRate'
  | string;
```

### ContentRegistry Signature

**File**: `packages/shared/src/registry/content-registry.ts`

```typescript
export class ContentRegistry<T extends { id: string }> {
  constructor(name: string, schema: ZodSchema<T>) {}
  register(entry: T): void          // validates via Zod, throws on duplicate
  registerAll(entries: T[]): void
  get(id: string): T | undefined
  getOrThrow(id: string): T
  has(id: string): boolean
  getAll(): T[]
  getByFilter(predicate: (entry: T) => boolean): T[]
}
```

**File**: `packages/shared/src/registry/registries.ts`

```typescript
export const statusEffectRegistry = new ContentRegistry('StatusEffect', statusEffectDefSchema);
export const damageTypeRegistry   = new ContentRegistry('DamageType', damageTypeDefSchema);
export const abilityRegistry      = new ContentRegistry('Ability', abilityDefSchema);
export const itemRegistry         = new ContentRegistry('Item', itemDefSchema);
export const weaponRegistry       = new ContentRegistry('Weapon', weaponDefSchema);
export const trophyRegistry       = new ContentRegistry('Trophy', trophyDefSchema);
export const skillRegistry        = new ContentRegistry('Skill', skillDefSchema);
```

### EffectProcessor Signature

**File**: `packages/game-engine/src/effects/effect-processor.ts`

```typescript
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

### StatModifierSystem with Hard Caps

**File**: `packages/shared/src/constants/balance.ts`

```typescript
export const STAT_CAPS: Record<string, { maxPercent?: number; maxFlat?: number }> = {
  moveSpeed:            { maxPercent: 0.15 },
  footprintRate:        { maxPercent: -0.85 },
  detectionRadius:      { maxPercent: -0.50 },
  noiseGeneration:      { maxPercent: -0.50 },
  meleeDamage:          { maxFlat: 80 },
  rangedDamage:         { maxFlat: 60 },
  scanRadius:           { maxPercent: 0.40 },
  interviewReliability: { maxPercent: 0.15 },
  heatCostReduction:    { maxPercent: -0.40 },
  falseEvidenceDetection: { maxPercent: 0.50 },
};
```

**File**: `packages/game-engine/src/combat/stat-modifier-system.ts`

```typescript
class StatModifierSystem {
  addModifier(entityId: string, stat: StatId, value: number, modType: 'FLAT' | 'PERCENT'): void
  addTemporaryModifier(entityId: string, stat: StatId, value: number, modType: 'FLAT' | 'PERCENT', durationMs: number, maxStacks?: number): void
  removeModifier(entityId: string, modifierId: string): void
  getEffectiveStat(entityId: string, stat: StatId, baseValue: number): number
  update(delta: number): void
}
```

### Health System Signature

**File**: `packages/game-engine/src/combat/health-system.ts`

```typescript
class HealthSystem {
  applyDamage(entity: BaseEntity, attack: Attack, modifiers: DamageModifiers): DamageResult
  applyHeal(entity: BaseEntity, amount: number, sourceId: string): number
  isInvincible(entityId: string): boolean
  startInvincibility(entityId: string, durationMs: number): void
  handleDeath(entity: BaseEntity, killedBy: Attack): void
  handleKnockout(entity: BaseEntity, durationMs: number): void
  registerDamageCallback(entityId: string, callback: () => void): void
  update(delta: number): void
}

type DamageModifiers = {
  armorReduction: number
  dodgeChance: number
  damageMultiplier: number
}

type DamageResult = {
  finalDamage: number
  wasDodged: boolean
  wasBlocked: boolean
  remainingHealth: number
  isDead: boolean
}
```

### Attack System Signature

**File**: `packages/game-engine/src/combat/attack-system.ts`

```typescript
class AttackSystem {
  meleeSweep(attacker: BaseEntity, config: MeleeConfig): Attack[]
  fireProjectile(attacker: BaseEntity, targetPos: Vec2, config: RangedConfig): void
  checkHitbox(attacker: BaseEntity, defender: BaseEntity, hitbox: Phaser.Geom.Rectangle): boolean
  update(scene: Phaser.Scene, delta: number): void
}

type MeleeConfig = {
  damage: number
  damageTypeId: string
  range: number
  arc: number
  cooldownMs: number
  weaponId: string | null
  knockbackForce: number
}

type RangedConfig = {
  damage: number
  damageTypeId: string
  speed: number
  range: number
  accuracy: number
  weaponId: string | null
  spriteKey: string
}
```

### Ability System Signature

**File**: `packages/game-engine/src/combat/ability-system.ts`

```typescript
class AbilitySystem {
  registerAbilities(entityId: string, abilities: Ability[]): void
  useAbility(entityId: string, abilityId: string, targetPos: Vec2): Result<AbilityEffect[], 'ON_COOLDOWN' | 'INSUFFICIENT_RESOURCE'>
  applyEffects(effects: AbilityEffect[], caster: BaseEntity, target: BaseEntity | null, targetPos: Vec2): void
  update(delta: number): void
  getAbilityCooldowns(entityId: string): Record<string, number>
}
```

### Status Effect System Signature

**File**: `packages/game-engine/src/combat/status-effects.ts`

```typescript
class StatusEffectSystem {
  applyEffect(entityId: string, effect: StatusEffect): void
  applyFromDefinition(entityId: string, def: StatusEffectDef, durationMs?: number, magnitude?: number): void
  removeEffect(entityId: string, effectId: string): void
  getEffects(entityId: string): StatusEffect[]
  hasEffect(entityId: string, statusDefId: string): boolean
  update(entities: BaseEntity[], delta: number): void
  getSpeedMultiplier(entityId: string): number
  getDamageMultiplier(entityId: string): number
  getDetectionMultiplier(entityId: string): number
}
```

### Status Effects Catalog (Data File)

All 25 status effects defined in `packages/shared/src/data/status-effects.ts` and registered at boot:

**Combat (9):** POISON (8s, 1000ms tick, 4 dmg/tick, stacks 3), BLEED (6s, 750ms tick, 3 dmg/tick, stacks 5), BURN (5s, 1000ms tick, 5 dmg/tick + evidence generation, stacks 2), ELECTROCUTION (3s, 500ms tick, 2 dmg/tick + no move/attack, no stack), STUN (2s, no move/attack, refreshes), SLOW (4s, speed x0.40), KNOCKBACK (0.5s, 128px force), DISORIENTED (3s, reversed controls), EXPOSED (6s, dmg taken +20%, stacks 2).

**Movement/Stealth (6):** STEALTH (until action, detection 20%), INVISIBILITY (15s, detection 0%, broken by attack), SPEED_BOOST (10s, x1.30), HASTE (8s, attack speed +20% + cooldowns tick 20% faster), SNARED (3s, no move), CRIPPLED (10s, x0.60, no sprint).

**Stat modifiers (5):** DAMAGE_BOOST (10s, +15% dmg, stacks 3), DEFENSE_BOOST (10s, -15% dmg taken, stacks 3), FOCUS (15s, cooldowns -20%), WEAKENED (8s, -15% dmg, stacks 2), VULNERABLE (6s, no dodge/block).

**Investigation/evidence (5):** HEIGHTENED_AWARENESS (20s, scan +30%, fed only), TUNNEL_VISION (10s, scan -30%, fed), PANIC (15s, heat gen +50%, killer), COMPOSED (20s, heat gen -30%, killer), FORENSIC_FOCUS (30s, instant evidence quality upgrade, fed).

### Combat AI Signature

**File**: `packages/game-engine/src/combat/combat-ai.ts`

```typescript
class CombatAI {
  setupCombatant(entity: BaseEntity, config: CombatAIConfig): void
  tick(entity: BaseEntity, player: PlayerController, delta: number): void
}

type CombatAIConfig = {
  attackPattern: AttackPattern[]
  aggressionLevel: number
  fleeThresholdHp: number | null
  difficultyMultiplier: number
}

type AttackPattern = {
  attackId: string
  weight: number
  minRange: number
  maxRange: number
  cooldownMs: number
}
```

### Boss Framework Signature

**File**: `packages/game-engine/src/combat/boss-manager.ts`

```typescript
class BossManager {
  initBossEncounter(bossConfig: BossConfig, player: PlayerController, scene: Phaser.Scene): void
  update(bossEntity: BaseEntity, delta: number): void
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
  triggerHpPercent: number
  attackPatterns: AttackPattern[]
  specialAbilities: string[]
  speedMultiplier: number
  onPhaseStart?: string
}

type BossLoot = {
  itemId: string
  dropChance: number
  quantity: [number, number]
}
```

Boss config JSON files: `packages/game-engine/src/combat/boss-configs/target-boss.json` and `fed-boss.json`.

### Combat Animations Signature

**File**: `packages/game-engine/src/combat/combat-animations.ts`

```typescript
class CombatAnimations {
  playAttack(entity: BaseEntity, attackKey: string): void
  playHitFlash(entity: BaseEntity): void
  playDeath(entity: BaseEntity, isKnockout: boolean): void
  spawnHitParticle(scene: Phaser.Scene, pos: Vec2, damageTypeId: string): void
  spawnDamageNumber(scene: Phaser.Scene, pos: Vec2, amount: number, isCritical: boolean): void
}
```

### Combat Zustand Store

**File**: `apps/web/src/stores/combat.ts`

```typescript
type CombatStore = {
  isInCombat: boolean
  enemyId: string | null
  enemyName: string | null
  enemyHealth: number
  enemyMaxHealth: number
  playerAbilities: Ability[]
  playerEffects: StatusEffect[]
  enemyEffects: StatusEffect[]
  canFlee: boolean
  setCombatTarget: (id: string, name: string, maxHp: number) => void
  updateEnemyHealth: (health: number) => void
  updateAbilityCooldown: (abilityId: string, cooldownMs: number) => void
  addEffect: (effect: StatusEffect, target: 'player' | 'enemy') => void
  removeEffect: (effectId: string, target: 'player' | 'enemy') => void
  clearCombat: () => void
}
```

### EventBus Event Types

Added to `packages/shared/src/types/events.ts`:

```typescript
COMBAT_STARTED: { attackerId: string; defenderId: string; pos: Vec2 }
DAMAGE_DEALT: {
  attack: Attack
  finalDamage: number
  wasDodged: boolean
  defenderRemainingHealth: number
  witnesses: string[]  // NPC IDs with line-of-sight to impact — for evidence system
}
ENTITY_DIED: { entityId: string; killedById: string; weapon: string | null; pos: Vec2; isPlayer: boolean }
ENTITY_KNOCKED_OUT: { entityId: string; knockedOutById: string; pos: Vec2 }
COMBAT_ENDED: { result: CombatResult }
STATUS_EFFECT_APPLIED: { entityId: string; effect: StatusEffect }
STATUS_EFFECT_REMOVED: { entityId: string; effectId: string }
BOSS_PHASE_CHANGED: { bossId: string; newPhase: number }
ABILITY_USED_IN_COMBAT: { entityId: string; abilityId: string; targetId: string | null; pos: Vec2 }
```

### Custom Effect Handler Pattern

```typescript
// One-time registration in game-init.ts:
effectProcessor.registerCustomHandler('lure_npc', (params, sourceId, targetId, context) => {
  const npcsInRadius = npcSpawner.getNPCsInRadius(context.pos, params.radius as number);
  const targets = npcsInRadius.slice(0, params.maxTargets as number);
  for (const npc of targets) {
    npc.setLureTarget(context.pos, params.duration as number * 1000);
  }
});
// Future ability uses it by reference:
// { type: 'CUSTOM', handler: 'lure_npc', params: { radius: 128, duration: 10, maxTargets: 1 } }
```

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

----

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
