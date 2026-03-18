---
vision: killer-vs-fed-roguelite
sequence: "08"
name: content-architecture
group: Gameplay
group_order: 3
status: pending
depends_on:
  - "01: Result utilities, Pino logger, shared types scaffold (UUID type, ISO 8601 timestamps, error discriminated union)"
  - "04: EventBus (emit/subscribe typed events), Phaser game config, scene keys, Zustand game store"
  - "07: PlayerController, PlayerAction types, RoleConfig, player Zustand store — the engine processes effects on player entities"
produces:
  - "ContentRegistry<T> generic class at packages/shared/src/registry/content-registry.ts — validates, stores, and retrieves typed content by ID"
  - "Registry instances at packages/shared/src/registry/registries.ts — statusEffectRegistry, damageTypeRegistry, abilityRegistry, itemRegistry, weaponRegistry, trophyRegistry, skillRegistry"
  - "Universal Effect union type at packages/shared/src/effects/effect-types.ts — covers stat mods, damage, healing, status, knockback, evidence, heat, ability unlock, and custom escape hatch"
  - "StatId string union at packages/shared/src/effects/effect-types.ts — all stat identifiers the system can modify"
  - "EffectProcessor class at packages/game-engine/src/effects/effect-processor.ts — applies Effect arrays to game systems generically"
  - "STAT_CAPS balance constants at packages/shared/src/constants/balance.ts — hard limits per stat enforced across all modifier sources"
  - "Content Zod schemas at packages/shared/src/schemas/content.ts — validates registry entries at registration time"
  - "Boot registration scaffold at packages/shared/src/data/_register-all.ts — imports all data files and registers at game start"
  - "Status effect data entries at packages/shared/src/data/status-effects/ — 25 status effect definitions"
  - "Damage type data entries at packages/shared/src/data/damage-types/ — all damage type definitions"
created: 2026-03-18
last_aligned: never
---

# Vision Piece 08: Content Architecture

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: project-scaffold, game-engine-bootstrap, player-and-roles

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Build the content architecture that all downstream gameplay systems depend on. This piece is infrastructure — it does not produce any player-visible features on its own, but it is the foundation that makes all game content data-driven and extensible.

The content architecture solves a specific problem: as the game adds new status effects, damage types, abilities, skills, trophies, weapons, and items, implementing each one should require only adding a data file entry, not changing engine code. This piece creates the generic registry, the universal effect language, and the boot-time registration system that make that extensibility possible.

### Dependency Context (Inline)

This piece depends on three earlier systems.

**Project scaffold** provides the shared Result type for fallible operations and a Pino logger singleton for all warning and error logging. All string-based UUID identifiers and ISO 8601 timestamp types come from here.

**Game engine bootstrap** provides the EventBus for typed event emission and subscription, the Phaser game configuration, and the Zustand game store. The EffectProcessor created by this piece receives references to game systems at construction time — those systems are initialized by the engine bootstrap.

**Player and roles** provides the PlayerController, PlayerAction types, and the player Zustand store. The effect processor applies effects to player entities; the player role type is referenced in ability definitions to constrain which abilities a given role can use.

### Content Registry

The content registry is a generic, parameterized data store for any game content type. Registering an entry validates it against a Zod schema (rejecting invalid data at boot, not at runtime), rejects duplicate IDs with a clear error, and stores the entry. Lookups by ID are fast and fail-fast: requesting a non-existent ID throws immediately rather than returning undefined silently. All entries can be retrieved or filtered by a predicate.

One registry instance exists per content type: status effects, damage types, abilities, items, weapons, trophies, and skills. Each instance is a module-level singleton created once and imported wherever content is needed.

### Universal Effect System

Every game mechanic that modifies state expresses itself as an Effect. Skills at each rank, trophy passives, equipment stats, crafting modifications, and status effects all produce arrays of Effects. The engine processes these generically without knowing about specific content IDs.

The Effect type covers:
- **Stat modifications**: flat value or percentage applied to a named stat
- **Damage and healing**: deal damage of a type, heal for a value, or apply damage over time
- **Status application/removal**: apply or remove a named status effect, or cleanse a category
- **Movement effects**: knockback with force and direction, or teleport a fixed distance
- **Prevention effects**: prevent movement, prevent attacks
- **Ability effects**: unlock an ability, reduce cooldown on a specific ability or all abilities
- **Evidence effects**: reduce generation of a named evidence type, generate evidence, destroy evidence in a radius
- **Heat and scan effects**: modify heat generation rate, heat decay rate, heat cost, heat cap, scan radius
- **Investigation effects**: modify evidence quality, evidence decay rate, false evidence detection chance, arrest viability score
- **Economy effects**: grant a starting item, modify item stack size, modify material drop rate
- **Duration modification**: extend the duration of another named effect
- **Custom escape hatch**: a named handler string plus a parameters map, for mechanics that cannot be expressed by the standard types

Stats that can be modified are identified by string IDs (not a closed union) so new stats can be added without changing the Effect type: movement speed, maximum health, melee damage, ranged damage, attack speed, dodge chance, block reduction, stamina regen rate, detection radius, noise generation, footprint rate, kill animation speed, disposal speed, carry speed, scan radius, witness interview reliability, evidence quality modifier, evidence decay rate, and others added by future pieces.

### Effect Processor

The EffectProcessor receives an array of Effects and a source/target entity pair, then delegates to the appropriate subsystem: the health system for damage and healing, the status effect system for status application and removal, the stat modifier system for stat changes, the evidence manager for evidence effects, and the ability system for ability-related effects. The custom handler type receives a named handler lookup — if no handler is registered for a given name, the processor logs a warning rather than throwing, preserving forward compatibility with future content not yet in the handler set.

Custom handlers are registered once in the game initialization file and referenced by handler name string in ability and item data entries. This means adding a new ability that shares an existing mechanic requires zero code — just a data entry.

### STAT_CAPS System

All stat modifications from all sources (skills, equipment, trophies, crafting, status effects) flow through the stat modifier system, which clamps the total result against per-stat hard caps. Hard caps prevent any combination of upgrades from crossing design boundaries.

Hard cap values: movement speed bonus is capped at 15% increase; footprint generation cannot be reduced below 15% of the base rate; NPC detection radius cannot be reduced below 50%; noise generation cannot be reduced below 50%; total melee damage is capped at 80; total ranged damage is capped at 60; fed scan radius bonus is capped at 40% increase; witness reliability improvement is capped at 15%; heat cost reduction is capped at 40%; false evidence passive detection chance is capped at 50%.

### Boot Registration

All content data files import into a single registration function called once before any scene loads. This function imports every data file and calls `registerAll()` on each registry in sequence. If any entry fails schema validation, the registration function throws immediately — this is caught in CI before reaching production. A boot test verifies that all registries reach their expected minimum entry counts.

### Status Effects (25 Entries)

All 25 status effects are defined as data objects and registered at boot. Nine combat effects: Poison (damage over time, stacks to 3), Bleeding (damage over time, stacks to 5, stops on healing), Burning (damage over time with chance to generate evidence each tick, stacks to 2), Electrocution (damage over time plus movement and attack prevention, no stack), Stun (no movement or attacks, refreshes on re-application), Slow (reduced movement speed), Knockback (forced displacement pulse), Disoriented (reversed controls), Exposed (increased damage taken, stacks to 2). Six movement and stealth effects: Stealthed (reduced detection radius until action), Invisible (NPCs ignore player, broken by attacking), Speed Boost, Haste (faster attack and cooldown), Snared (cannot move but can attack), Crippled (reduced speed, no sprint). Five stat modifier effects: Damage Up (stacking damage bonus), Defense Up (stacking damage reduction), Focused (cooldown reduction), Weakened (stacking damage penalty), Vulnerable (no dodging or blocking). Five investigation and evidence effects: Heightened Awareness (evidence discovery radius increase), Tunnel Vision (discovery radius reduction), Panicked (heat generation increase), Composed (heat generation reduction), Forensic Focus (instant evidence quality upgrade).

Stacking rules: same-ID effects stack up to their configured maximum. Crowd control effects do not stack — the most recent replaces the current. Applying an active effect refreshes its duration.

### Data-Driven Extension Model

Adding a new status effect: add an entry to the status effects data directory, with an ID, name, category, duration, magnitude, stacking rules, and an array of Effects. Run the boot registration. No code changes unless the effect uses an Effect type not yet in the union.

Adding a new damage type: add an entry to the damage types data directory. The damage type ID is a validated string, not a hardcoded union — this gives unlimited extensibility at the cost of compile-time exhaustiveness checking, mitigated by runtime registry validation.

### Edge Cases

- If any data file entry fails schema validation at boot, the registration function throws and CI fails — malformed data never reaches production
- Duplicate content IDs cause an immediate throw at registration time with a clear error message
- The custom handler name in a CUSTOM Effect must be registered before any game scene loads — unregistered handlers log a warning and are skipped, not thrown, to preserve forward compatibility
- The STAT_CAPS system enforces caps across all modifier sources — a combination of skill, trophy, equipment, and crafting bonuses cannot exceed the cap for any stat
- Registry lookups that fail throw immediately — calling code is expected to validate IDs at registration time, not at runtime

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

All content architecture lives in `packages/shared/src/` (registry, effects, schemas, data) and `packages/game-engine/src/effects/` (processor). No application-layer code. The EffectProcessor is constructed once in the game initialization file with references to all subsystems it delegates to.

The StatModifierSystem lives in `packages/game-engine/src/combat/stat-modifier-system.ts` — it is built in this piece as the enforcement layer for STAT_CAPS, even though the combat mechanics that call it are built in the combat mechanics piece.

### ContentRegistry Signature

**File**: `packages/shared/src/registry/content-registry.ts`

```typescript
export class ContentRegistry<T extends { id: string }> {
  constructor(name: string, schema: ZodSchema<T>) {}
  register(entry: T): void          // validates via Zod, throws on duplicate
  registerAll(entries: T[]): void
  get(id: string): T | undefined
  getOrThrow(id: string): T         // throws if not found
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

### STAT_CAPS Constants

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

### StatModifierSystem Signature

**File**: `packages/game-engine/src/combat/stat-modifier-system.ts`

```typescript
class StatModifierSystem {
  addModifier(entityId: string, stat: StatId, value: number, modType: 'FLAT' | 'PERCENT'): void
  addTemporaryModifier(entityId: string, stat: StatId, value: number, modType: 'FLAT' | 'PERCENT', durationMs: number, maxStacks?: number): void
  removeModifier(entityId: string, modifierId: string): void
  getEffectiveStat(entityId: string, stat: StatId, baseValue: number): number  // applies STAT_CAPS
  update(delta: number): void
}
```

### EffectProcessor Signature

**File**: `packages/game-engine/src/effects/effect-processor.ts`

```typescript
type CustomEffectHandler = (
  params: Record<string, number | string | boolean>,
  sourceId: string,
  targetId: string,
  context: EffectContext
) => void;

type EffectContext = {
  pos: Vec2;
  scene: Phaser.Scene;
  evidenceManager: EvidenceManager;
  statModifierSystem: StatModifierSystem;
  entityManager: EntityManager;
  surveillanceSystem: SurveillanceSystem;
  healthSystem: HealthSystem;
};

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
```

The `applyEffects` switch statement handles all standard Effect types. The CUSTOM case delegates to registered handlers via a `Map<string, CustomEffectHandler>`. Unknown effect types and unregistered handler names are logged at WARN level (forward compatibility).

### Content Schemas

**File**: `packages/shared/src/schemas/content.ts`

Zod schemas for each content type validated at registration time:
- `statusEffectDefSchema` — validates id, name, category, duration, magnitude, maxStacks, effects array
- `damageTypeDefSchema` — validates id, name, description, evidenceTypes array
- `abilityDefSchema` — validates id, name, description, role, cooldownMs, resourceCost, effects array, range, tier
- `itemDefSchema` — validates id, name, rarity, slot, effects array, stackLimit
- `weaponDefSchema` — validates id, name, rarity, category, damage, noiseRadius, effects array
- `trophyDefSchema` — validates id, name, role, rarity, passiveEffects array, unlockCondition
- `skillDefSchema` — validates id, treeId, name, tier, maxRank, costs, prerequisites, rankEffects array

### Status Effects Data Files

**Directory**: `packages/shared/src/data/status-effects/`

One file per logical group:
- `combat.ts` — 9 combat effects: POISON, BLEED, BURN, ELECTROCUTION, STUN, SLOW, KNOCKBACK, DISORIENTED, EXPOSED
- `movement.ts` — 6 movement/stealth effects: STEALTH, INVISIBILITY, SPEED_BOOST, HASTE, SNARED, CRIPPLED
- `stat-modifiers.ts` — 5 stat modifier effects: DAMAGE_BOOST, DEFENSE_BOOST, FOCUS, WEAKENED, VULNERABLE
- `investigation.ts` — 5 investigation/evidence effects: HEIGHTENED_AWARENESS, TUNNEL_VISION, PANIC, COMPOSED, FORENSIC_FOCUS

Example entry shape:
```typescript
export const POISON: StatusEffectDef = {
  id: 'POISON',
  name: 'Poison',
  category: 'COMBAT',
  durationMs: 8000,
  tickIntervalMs: 1000,
  damagePerTick: 4,
  maxStacks: 3,
  effects: [{ type: 'DAMAGE_PER_TICK', value: 4 }],
};
```

### Damage Types Data Files

**Directory**: `packages/shared/src/data/damage-types/`

One file with all damage type definitions:
- `damage-types.ts` — PHYSICAL, BLADED, BLUNT, GARROTE, RANGED, POISON_DMG, EXPLOSIVE, TASER, NONE

Each entry specifies id, name, description, and the evidence types this damage type generates on a kill event.

### Boot Registration Scaffold

**File**: `packages/shared/src/data/_register-all.ts`

```typescript
export function registerAllContent(): void {
  // Status effects
  statusEffectRegistry.registerAll([...combatEffects, ...movementEffects, ...statModEffects, ...investigationEffects]);
  // Damage types
  damageTypeRegistry.registerAll(allDamageTypes);
  // Abilities, items, weapons, trophies, skills — each added by their owning piece (12, 14, 17)
  // This scaffold file is the boot entry point; downstream pieces IMPORT this file and call it
}
```

Downstream pieces (12, 14, 17) extend this by importing and calling their own registration functions inside `registerAllContent()` — they do not create a separate boot function.

### Boot Test

**File**: `packages/shared/tests/registry/boot.test.ts`

```typescript
describe('registerAllContent', () => {
  it('registers all content without throwing', () => {
    expect(() => registerAllContent()).not.toThrow();
  });
  it('statusEffectRegistry has 25 entries', () => {
    expect(statusEffectRegistry.getAll()).toHaveLength(25);
  });
  // After downstream pieces add content:
  // skillRegistry: 60 skills, abilityRegistry: 24 abilities, etc.
});
```

### Custom Handler Pattern

```typescript
// Registration in game-init.ts (once per engine lifecycle):
effectProcessor.registerCustomHandler('lure_npc', (params, sourceId, targetId, context) => {
  const npcsInRadius = context.entityManager.getNPCsInRadius(context.pos, params.radius as number);
  const targets = npcsInRadius.slice(0, params.maxTargets as number);
  for (const npc of targets) {
    npc.setLureTarget(context.pos, (params.duration as number) * 1000);
  }
});

// Usage in a data entry (zero code required for new abilities using same handler):
// { type: 'CUSTOM', handler: 'lure_npc', params: { radius: 128, duration: 10, maxTargets: 1 } }
```

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| TypeScript | 5.9.3 | Strict mode, discriminated union exhaustiveness via `satisfies` |
| Zod | latest | Schema validation for registry entries at registration time |
| Vitest | 4.1.0 | Unit and boot tests |

### Testing Strategy

- Unit tests for ContentRegistry: duplicate ID rejection, Zod validation failure, `getOrThrow` error on missing ID, `getByFilter` predicate correctness
- Unit tests for StatModifierSystem: STAT_CAPS enforcement when multiple modifier sources stack, temporary modifier tick-down, removal by ID
- Unit tests for EffectProcessor: each standard Effect type dispatches to the correct system, CUSTOM handler lookup, WARN log on unregistered handler
- Boot test: `registerAllContent()` succeeds, all registries reach expected counts (25 status effects, 9 damage types at 08 completion; 60 skills + 24 abilities etc. at full sequence completion)

### Constitution Compliance

- [x] No barrel files — all imports direct to specific files
- [x] No React in game-engine package — EffectProcessor is pure TypeScript
- [x] Zod validation in ContentRegistry schemas
- [x] No direct process.env — no environment variables used in this piece
- [x] Result<T,E> pattern from project scaffold available for EffectProcessor return types where needed

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

- `packages/shared/src/registry/content-registry.ts` — ContentRegistry<T> generic class
- `packages/shared/src/registry/registries.ts` — 7 typed registry instances
- `packages/shared/src/effects/effect-types.ts` — Effect union type and StatId
- `packages/game-engine/src/effects/effect-processor.ts` — EffectProcessor class
- `packages/game-engine/src/combat/stat-modifier-system.ts` — StatModifierSystem with STAT_CAPS enforcement
- `packages/shared/src/constants/balance.ts` — STAT_CAPS record
- `packages/shared/src/schemas/content.ts` — Zod schemas for all registry entry types
- `packages/shared/src/data/_register-all.ts` — boot registration scaffold (framework only; downstream pieces add their registrations)
- `packages/shared/src/data/status-effects/combat.ts` — 9 combat status effects
- `packages/shared/src/data/status-effects/movement.ts` — 6 movement/stealth status effects
- `packages/shared/src/data/status-effects/stat-modifiers.ts` — 5 stat modifier status effects
- `packages/shared/src/data/status-effects/investigation.ts` — 5 investigation/evidence status effects
- `packages/shared/src/data/damage-types/damage-types.ts` — all damage type definitions
- `packages/shared/tests/registry/boot.test.ts` — boot test

### Dependencies (Consumed from Earlier Pieces)

**From piece 01 (Project Scaffold)**:
- `Result<T, E>` type for fallible operations: `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }`
- Pino logger singleton: `import { logger } from 'packages/shared/src/lib/logger'`
- Shared UUID string type alias and ISO 8601 timestamp type

**From piece 04 (Game Engine Bootstrap)**:
- EventBus typed emit/subscribe: `import { eventBus } from 'packages/game-engine/src/event-bus'`
- Vec2 position type: `type Vec2 = { x: number; y: number }`
- Phaser.Scene reference (used in EffectContext type)

**From piece 07 (Player and Roles)**:
- `PlayerRole` union type: `'KILLER' | 'FED'`
- PlayerController type reference for EffectContext

### Success Criteria

- [ ] ContentRegistry rejects duplicate IDs immediately with an error message that includes the duplicate ID and registry name
- [ ] ContentRegistry rejects entries that fail Zod schema validation with the full Zod error message
- [ ] `getOrThrow()` throws with a clear message when the ID is not found
- [ ] `StatModifierSystem.getEffectiveStat()` enforces STAT_CAPS correctly when multiple modifiers from different sources stack
- [ ] EffectProcessor handles every standard Effect type without throwing
- [ ] EffectProcessor logs WARN (not throws) when a CUSTOM handler name is not registered
- [ ] `registerAllContent()` completes without throwing for all 25 status effects and 9 damage types
- [ ] Boot test passes in CI: all expected registry entry counts verified
- [ ] TypeScript compilation passes with strict mode: all Effect type variants are exhaustively handled in EffectProcessor switch

### Alignment Notes

The ContentRegistry and Effect type system created here are the dependency foundation for pieces 09 (combat mechanics), 11, 12 (killer), 13, 14 (fed), 16, and 17 (progression). Any change to the Effect type union requires updating EffectProcessor's switch statement and potentially all content data files that use the changed type.

The `_register-all.ts` scaffold is intentionally incomplete at this piece — it only registers status effects and damage types. Downstream pieces (12, 14, 17) add their content registrations by extending this file. This must be communicated clearly when delegating those pieces.

The StatModifierSystem is created here but consumed heavily by 09 (combat). The STAT_CAPS values are the authoritative balance reference for all downstream pieces — changes here cascade everywhere.
