---
vision: killer-vs-fed-roguelite
sequence: "09"
name: combat-system
group: Gameplay
group_order: 3
status: pending
depends_on:
  - "01: Result utilities, Pino logger, shared types scaffold"
  - "04: EventBus (emit/subscribe typed events), Phaser game config (Arcade physics), scene keys, Zustand game store"
  - "06: BaseEntity (takeDamage, heal, setAnimation), PerceptionSystem.registerSuspiciousEvent(), entity types"
  - "07: PlayerController, PlayerAction types, Inventory.useItem(), RoleConfig, player and HUD Zustand stores"
  - "08: ContentRegistry<T> (statusEffectRegistry, abilityRegistry, damageTypeRegistry, itemRegistry, weaponRegistry), Effect union type, StatId, EffectProcessor, StatModifierSystem, STAT_CAPS in balance.ts, content Zod schemas, status effect and damage type data entries, _register-all.ts scaffold"
produces:
  - "CombatController — initiates, manages, and resolves combat encounters at packages/game-engine/src/combat/combat-controller.ts"
  - "HealthSystem — HP pool, damage calculation, healing, death/knockout, invincibility frames at packages/game-engine/src/combat/health-system.ts"
  - "AttackSystem — melee arc sweeps, ranged projectiles, hitbox detection at packages/game-engine/src/combat/attack-system.ts"
  - "AbilitySystem — active abilities with cooldowns, resource costs, and Effect delegation at packages/game-engine/src/combat/ability-system.ts"
  - "StatusEffectSystem — applies, ticks, and expires status effects via registry lookup at packages/game-engine/src/combat/status-effect-system.ts"
  - "CombatAI — NPC/boss attack patterns and difficulty scaling at packages/game-engine/src/combat/combat-ai.ts"
  - "BossManager — phase transitions, special attacks, data-driven boss configs at packages/game-engine/src/combat/boss-manager.ts"
  - "CombatAnimations — attack sequences, hit flashes, death animations, floating damage numbers at packages/game-engine/src/combat/combat-animations.ts"
  - "Boss config JSON files at packages/game-engine/src/combat/boss-configs/target-boss.json and fed-boss.json"
  - "Combat HUD component at apps/web/src/components/app/game/combat-hud/ — enemy HP, ability cooldowns, status icons, flee hint"
  - "Combat Zustand store at apps/web/src/stores/combat.ts — combat state for React HUD"
  - "Combat shared types at packages/shared/src/types/combat.ts — CombatState, Attack, CombatResult, StatusEffect, Ability, AbilityEffect"
  - "Combat constants at packages/shared/src/constants/combat.ts — base damage, dodge chance, invincibility windows, max status effects"
  - "Combat EventBus event constants at packages/shared/src/constants/events/combat.ts — COMBAT_STARTED, DAMAGE_DEALT, ENTITY_DIED, etc."
created: 2026-03-18
last_aligned: never
---

# Vision Piece 09: Combat System

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: project-scaffold, game-engine-bootstrap, entity-and-npc-system, player-and-roles, content-architecture

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Build the real-time combat system shared by both roles. Combat supports two contexts: regular encounters (player vs NPC guards, hostile NPCs) that occur in the map scene without scene transitions, and structured encounters (killer confronting a target that fights back, or fed directly confronting the killer) that use more deliberate pacing. The system must emit enough detail in its events that the evidence system can generate appropriate forensic traces from combat actions.

### Dependency Context (Inline)

This piece depends on several earlier systems and the content architecture piece.

**Project scaffold** provides the shared Result type for fallible operations and a Pino logger singleton.

**Game engine bootstrap** provides the EventBus (emit and subscribe typed events), the Arcade physics tick rate constant, and the Zustand game store. All combat events are emitted through the EventBus.

**Entity and NPC system** provides the base entity class (which has health values and damage/heal methods), the perception system (for registering suspicious events caused by combat), and entity type definitions.

**Player and roles** provides the player controller (extends base entity), player action types, the inventory class (combat can trigger item use), the run manager (for querying current run state), all player types, and the player and HUD Zustand stores.

**Content architecture** provides the ContentRegistry generic class (with statusEffectRegistry, abilityRegistry, damageTypeRegistry, itemRegistry, and weaponRegistry instances), the universal Effect type union, the StatId string type, the EffectProcessor class, the StatModifierSystem with STAT_CAPS enforcement, and the 25 registered status effects and damage type entries. This combat piece USES these registries and the EffectProcessor — it does not create them.

### Combat Overview

Combat is real-time action with no turn-based mode. The player attacks using input-bound ability slots and movement. Enemies use combat AI to select and execute attacks. The system integrates seamlessly into the open map scene for regular encounters and supports more deliberate structured encounters for boss moments.

Combat emits detailed EventBus events so the evidence system can reconstruct what happened: who attacked whom, with what weapon, at what position, and who was nearby as a witness. The combat system does not generate evidence directly — it provides the raw data that the evidence system acts on.

### Health System

Both player and NPC entities use the same health system. It applies damage with modifiers (armor reduction, dodge chance, damage multiplier from stat modifier system), applies healing capped at max health, manages invincibility windows (entities cannot be hit again for 500ms after taking damage), handles death (triggers the ENTITY_DIED event, drops loot, triggers NPC reactions), and handles knockout for non-lethal encounters. Damage callbacks can be registered for boss item effects that trigger on any damage received.

### Attack System

The attack system executes melee sweeps and fires projectiles using Phaser Arcade physics hitboxes. Melee attacks define a damage value, damage type ID, range in pixels, arc angle, cooldown, optional weapon ID, and knockback force. Ranged attacks define a damage value, damage type ID, projectile speed and maximum range, accuracy, optional weapon ID, and a projectile sprite key.

Hitboxes for melee attacks are created as invisible physics bodies at attack start and destroyed at attack end — this is simpler and more performant than geometric arc intersection math.

### Ability System

Abilities are defined in data files and registered in the ability registry at boot. The ability system tracks registered abilities per entity, evaluates cooldown and resource cost before allowing use, delegates effect application to the EffectProcessor, ticks cooldown timers, and provides current cooldown state for the HUD. Standard abilities need no code — their Effects are data. Novel abilities use the custom handler pattern.

### Status Effect System

The status effect system applies effects by looking up their definition from the status effect registry, evaluates stacking and crowd control rules (same-ID effects stack to their configured maximum; crowd control effects do not stack — the most recent replaces the current), processes per-tick effects (damage over time) and ticks down remaining durations, and exposes composite multipliers for movement speed, damage output, and detection radius that other systems query each frame.

### Combat AI

NPC and boss combat uses a decision tree optimized for combat cadence rather than the full behavior tree. Combat AI is configured with an attack pattern (a weighted list of attacks with range requirements and cooldowns), an aggression level, an optional flee threshold by HP percentage, and a difficulty multiplier that scales damage and reaction speed.

### Boss Framework

Boss encounters are structured confrontations with multiple phases triggered by HP thresholds. Each phase defines different attack patterns, special ability unlocks, and a speed multiplier. Boss configurations are data-driven JSON files so content can be added without code changes. The boss manager initializes an encounter, monitors HP for phase transitions (transition animations play to completion before resuming combat), and resolves the encounter with a win, loss, or flee outcome.

Two boss configs exist: one for when a killer target fights back, one for when the fed directly confronts the killer.

### Combat HUD

A React client component reads from the combat Zustand store and displays: the current enemy's name and health percentage, the player's ability slots with cooldown overlay indicators, active status effect icons with remaining duration, and a flee hint when the player is far enough from the enemy.

Floating damage numbers are Phaser text objects (not React), pooled for performance.

### Evidence Integration

The DAMAGE_DEALT event includes the IDs of all NPCs that had line-of-sight to the attack impact position. This is the sole coupling between the combat system and the evidence system — the combat system provides witness IDs, and the evidence system subscribes to that event and creates appropriate forensic traces. The combat system knows nothing about evidence mechanics.

### Edge Cases

- Invincibility frames prevent damage stacking during combo attacks
- Dodge is calculated per attack, not per frame — a failed dodge on one attack does not affect the next
- Boss phase transitions are not interrupted by player attacks — the transition animation completes before combat resumes
- If both player and target reach zero HP simultaneously, the player is treated as the winner
- Status effects from trophies must be applied before combat starts, not mid-combat
- Combat AI must use pathfinding when chasing the player, not direct-line movement
- Floating damage numbers must be object-pooled, not instantiated fresh on each hit

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

All combat logic lives in `packages/game-engine/src/combat/`. The CombatController is the orchestrator. The attack, health, ability, stat modifier, and status effect systems are components the controller coordinates. The BossManager is a higher-level coordinator for structured encounters. The EffectProcessor (from the content architecture system) is the universal translation layer between Effect data objects and system calls.

The damage pipeline: `AttackSystem (hitbox check)` → `HealthSystem.applyDamage (modifiers)` → `EventBus DAMAGE_DEALT (evidence system gets witnesses)` → `CombatAnimations.playHitFlash` → Zustand `combatStore` update → `CombatHUD` re-renders.

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

### EventBus Event Constants

**File**: `packages/shared/src/constants/events/combat.ts`

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

type DamageModifiers = { armorReduction: number; dodgeChance: number; damageMultiplier: number }
type DamageResult = { finalDamage: number; wasDodged: boolean; wasBlocked: boolean; remainingHealth: number; isDead: boolean }
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

type MeleeConfig = { damage: number; damageTypeId: string; range: number; arc: number; cooldownMs: number; weaponId: string | null; knockbackForce: number }
type RangedConfig = { damage: number; damageTypeId: string; speed: number; range: number; accuracy: number; weaponId: string | null; spriteKey: string }
```

Use `scene.physics.add.overlap(attackerHitbox, defenderGroup, callback)` for hitbox detection. Create invisible rectangle physics bodies for melee arc sweeps — created at attack animation start, destroyed at animation end.

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

**File**: `packages/game-engine/src/combat/status-effect-system.ts`

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

The StatusEffectSystem calls `statusEffectRegistry.getOrThrow(statusDefId)` when applying or processing any effect — it does not hold hardcoded effect logic.

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

type AttackPattern = { attackId: string; weight: number; minRange: number; maxRange: number; cooldownMs: number }
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
  id: string; entityId: string; displayName: string
  phases: BossPhase[]; lootTable: BossLoot[]
}
type BossPhase = {
  phaseNumber: number; triggerHpPercent: number
  attackPatterns: AttackPattern[]; specialAbilities: string[]; speedMultiplier: number; onPhaseStart?: string
}
```

Boss config JSON files:
- `packages/game-engine/src/combat/boss-configs/target-boss.json` — killer target that fights back
- `packages/game-engine/src/combat/boss-configs/fed-boss.json` — fed confronting killer directly

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

Floating damage numbers are Phaser text objects in an object pool — never instantiated fresh on each hit.

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

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| Phaser | 3.90.0 | Arcade physics for hitbox overlap detection |
| Zustand | latest | combatStore in apps/web |
| TypeScript | 5.9.3 | Strict types, all combat types exported from shared |
| Zod | latest | Schema validation consumed from the content architecture's content registry |

### Testing Strategy

- Unit tests for HealthSystem: damage calculation, invincibility windows, death trigger
- Unit tests for StatusEffectSystem: effect application by registry lookup, tick-down, speed/damage multipliers, stacking rules, crowd control replacement
- Unit tests for AbilitySystem: cooldown tracking, resource cost rejection, effect application via EffectProcessor
- Unit tests for AttackSystem: melee arc hitbox creation/destruction, ranged accuracy spread
- Unit tests for BossManager: phase transition at correct HP thresholds
- Component tests for CombatHUD: renders correct enemy name/HP, ability cooldown overlays
- E2E: player engages enemy, takes damage, HUD updates, enemy dies (Playwright)

### Constitution Compliance

- [x] No barrel files — all imports direct to specific files
- [x] No React in game-engine package — all combat logic in game-engine, HUD in apps/web
- [x] EventBus for combat events (DAMAGE_DEALT, ENTITY_DIED, COMBAT_ENDED)
- [x] Zustand combatStore for HUD state
- [x] Result<T,E> for AbilitySystem.useAbility()
- [x] Boss configs data-driven (JSON) not hardcoded
- [x] Object pooling for projectiles and damage number text objects
- [x] ContentRegistry consumed from the content architecture system — no duplicate creation

### Art Style Integration

Combat VFX must follow the comic-book aesthetic defined in the art style guide: onomatopoeia sprites (POW, CRACK, THUD) as image assets for impact moments, speed lines as drawn overlays (not procedurally generated), and impact frames (brief one-frame freeze on hit) to sell the comic-book feel. Damage number text uses the Bangers display font. Hit flash uses a shader pass timed for one to two frames. See `art-style-guide.md` in the vision directory for full combat VFX specifications.

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

- `packages/game-engine/src/combat/combat-controller.ts`
- `packages/game-engine/src/combat/health-system.ts`
- `packages/game-engine/src/combat/attack-system.ts`
- `packages/game-engine/src/combat/ability-system.ts`
- `packages/game-engine/src/combat/status-effect-system.ts`
- `packages/game-engine/src/combat/combat-ai.ts`
- `packages/game-engine/src/combat/boss-manager.ts`
- `packages/game-engine/src/combat/combat-animations.ts`
- `packages/game-engine/src/combat/boss-configs/target-boss.json`
- `packages/game-engine/src/combat/boss-configs/fed-boss.json`
- `packages/shared/src/types/combat.ts`
- `packages/shared/src/constants/combat.ts`
- `packages/shared/src/constants/events/combat.ts`
- `apps/web/src/stores/combat.ts`
- `apps/web/src/components/app/game/combat-hud/CombatHUD.tsx` (and sub-components)

### Dependencies (Consumed from Earlier Pieces)

**From piece 08 (Content Architecture)**:
- `ContentRegistry<T>` class: `import { ContentRegistry } from 'packages/shared/src/registry/content-registry'`
- Registry instances: `statusEffectRegistry`, `abilityRegistry`, `damageTypeRegistry`, `weaponRegistry` from `packages/shared/src/registry/registries`
- `Effect` union type and `StatId`: `import { Effect, StatId } from 'packages/shared/src/effects/effect-types'`
- `EffectProcessor` class: `import { EffectProcessor } from 'packages/game-engine/src/effects/effect-processor'`
- `StatModifierSystem` class: `import { StatModifierSystem } from 'packages/game-engine/src/combat/stat-modifier-system'`
- `STAT_CAPS`: `import { STAT_CAPS } from 'packages/shared/src/constants/balance'`
- 25 status effects pre-registered at boot, 9 damage types pre-registered

**From piece 07 (Player and Roles)**:
- `PlayerController` class with `getInventory()`, `getRole()`, `getStats()` methods
- `Inventory.useItem()` method signature
- `PlayerRole` union: `'KILLER' | 'FED'`
- Player Zustand store for HUD integration

**From piece 06 (Entity and NPC System)**:
- `BaseEntity` class with `takeDamage()`, `heal()`, `setAnimation()`, `getPosition(): Vec2`, `getId(): string`
- `PerceptionSystem.registerSuspiciousEvent(pos: Vec2, radius: number, intensity: number): void`
- `EntityType` union

**From piece 04 (Game Engine Bootstrap)**:
- EventBus: `import { eventBus } from 'packages/game-engine/src/event-bus'`
- `Vec2` type
- Phaser scene reference type

**From piece 01 (Project Scaffold)**:
- `Result<T, E>` type

### Success Criteria

- [ ] Player can attack NPCs and deal correct damage after stat modifiers are applied
- [ ] Melee arc does not hit entities behind walls (line-of-sight gating via collision layer from piece 05)
- [ ] All 25 status effects (apply, tick, expire) work correctly via registry lookup — no hardcoded status logic
- [ ] Boss phases transition at correct HP thresholds; transition animation completes before combat resumes
- [ ] CombatHUD updates reactively during combat (enemy HP, cooldowns, status effect icons)
- [ ] DAMAGE_DEALT event includes correct witness IDs for evidence system integration
- [ ] Invincibility frames prevent hit-stacking during 500ms window
- [ ] Combat flee triggers when player moves COMBAT_ESCAPE_DISTANCE_PX (512px) from enemy
- [ ] Floating damage numbers are pooled — no fresh object creation per hit
- [ ] AbilitySystem returns ON_COOLDOWN error when ability is not ready

### Alignment Notes

The `witnesses` field on `DAMAGE_DEALT` is the coupling point between the combat system and the evidence system (piece 10). The combat system does not generate evidence directly — it emits detailed events and the evidence system subscribes to translate those into forensic traces. This keeps the two systems decoupled.

The StatusEffectSystem is the hook for temporary powerups (piece 15) and trophy passives (piece 16). Those pieces call `StatusEffectSystem.applyFromDefinition()` with long-duration or permanent effects at run initialization — no new mechanism is added, only the same system extended.

This piece does NOT own the ContentRegistry, Effect types, or EffectProcessor (those are owned by 08). If the EffectProcessor constructor signature changes in 08, this piece's CombatController initialization must be updated.
