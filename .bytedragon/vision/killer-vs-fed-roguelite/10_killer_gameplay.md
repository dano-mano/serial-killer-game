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

Implement the complete killer role gameplay loop. The killer must identify and eliminate specific NPC targets within a run, dispose of bodies to reduce evidence, manage their heat level (how suspicious they appear to NPCs and the fed), and actively counteract the fed's investigation using deception abilities. The killer wins by completing all required eliminations before the fed builds an airtight case. The killer loses if arrested by the fed, killed in combat, or if the run time limit expires in hard difficulty biomes.

The killer's power grows through three ranked skill trees (Stealth, Brutality, Deception), 12 active abilities with rank progressions, a catalog of weapons and tools, MYTHIC-rarity boss items with unique mechanics, and a crafting system called The Workshop for equipment modifications.

### Dependency Context (Inline)

This piece depends on all earlier pieces. These are described here so this document is self-contained.

**Project scaffold** provides the shared Result type for error-typed returns, the Pino logger singleton, and Zod-validated environment config.

**Design system** provides the shared component library (AppButton, AppCard, AppDialog, AppToast) used by the killer HUD and Workshop crafting UI components.

**Game engine bootstrap** provides the EventBus (emit and subscribe typed events), global game constants for tick rate and player speeds, and the Zustand game store.

**World and maps** provides the zone manager (disposal locations are zone-based, camera jamming targets zones), the spawn manager (for exit zone spawn points), the gameplay scene, and shared position, zone, and biome types. The evidence system added camera jamming support to the zone manager.

**Entity and NPC system** provides the NPC class (with witness flag, witness event log, interviewable flag, and suspicious event handler), the NPC spawner (for querying all NPCs and by ID), the interaction manager, and the perception system. The evidence system added methods to convert NPCs to informants and entrapment bait and to silence their witness log.

**Player and roles** provides the role interface (the contract this piece must implement), the role registry (where the killer role registers itself on module load), the player controller, the inventory class, player action and action type definitions, the run manager, and all shared player/run/inventory types and the player Zustand store.

**Combat system** provides the combat controller (for target resistance encounters), health system, ability system, status effect system, stat modifier system and global stat caps, boss manager, effect processor (including custom handler registration), all content registries, the universal Effect type system, combat types, and combat constants.

**Evidence system** provides the evidence manager (including planting false evidence, planting false witness evidence, creating decay zones, and setting kill evidence reduction), the evidence modifiers system (for adding reduction modifiers), the evidence generator (which subscribes to kill events), and all evidence types, constants, and the evidence Zustand store.

### Killer Role Overview

The killer's gameplay loop per run:

1. **Identify targets**: Run starts with one to three randomly assigned NPC targets seeded from the run seed for multiplayer consistency
2. **Observe and plan**: Study the target's patrol routine and identify opportunities for unobserved kills
3. **Execute**: Approach the target, use the preferred kill method, and generate minimum evidence
4. **Dispose**: Move the body to a disposal location (dumpster, lake, burial site, etc.) to reduce evidence
5. **Manage heat**: Monitor the heat meter; if too hot, lay low, change disguise, or clean evidence
6. **Counter-play**: Actively mislead the fed using deception abilities when heat is rising
7. **Win**: All required targets eliminated; optionally reach the escape zone for bonus score

### Kill Methods

Six kill methods define the trade-offs between speed, noise, and evidence generated:

- **Strangulation**: Silent, melee range, slow execution. Generates only DNA from contact. Produces no noise. Requires sustained close contact with the target.
- **Bladed weapon**: Silent, melee range, fast execution. Generates DNA and a weapon trace. Low noise radius. The most efficient method for evidence minimization.
- **Blunt trauma**: Moderate noise, melee range. Generates DNA and a disturbed scene trace. Noise radius warns nearby NPCs.
- **Poison**: Delayed effect. Can be administered remotely (spiked drink interaction). Generates only a trace DNA reading. The death happens 30 seconds after the kill action — timing the run exit is critical.
- **Ranged**: Loud, long range. Generates a weapon trace (shell casing). Very large noise radius that can alert NPCs and the fed across zones.
- **Combat kill**: Target fought back (boss encounter). Generates the full range of evidence types and is the hardest to cover up. Unavoidable when targets resist.

### Disposal Methods

Five disposal methods reduce evidence after a kill. Each has location and item requirements:

- **Dumpster**: Common in city and office biomes. No item required. Moderate evidence reduction. Body is gone from the map.
- **Lake**: Rural and island biomes. No item required. Good evidence reduction. Body rarely resurfaces.
- **Burial**: Rural biomes. Requires a shovel in inventory. Excellent evidence reduction. Takes the longest.
- **Acid dissolve**: Rare. Requires an acid jar from the black market. Near-total evidence elimination. Fastest complete disposal.
- **Concealment**: Urban environments. No item required. Low evidence reduction. Body remains on the map hidden in a closet or under a bed — can still be found by thorough NPC investigation.

### Stealth and Heat System

The killer's heat level is a 0–100 score representing aggregate suspicion across all NPCs who have witnessed the killer. Heat has four behavioral tiers:

- **Low (0–32)**: NPCs follow normal routines; the killer appears as an ordinary NPC
- **Medium (33–65)**: NPCs in the killer's zone exhibit curious behavior — occasional double-takes and watchfulness
- **High (66–89)**: NPCs become suspicious; may approach and stare; the fed receives an ambient alert hint (no exact position)
- **Critical (90–100)**: NPCs in the killer's zone enter an alarmed state; the fed receives a critical heat event

Heat decays naturally while the killer maintains low-profile behavior. NPC witnessing a suspicious event increases heat. Finding a body increases heat significantly. Skills in the Stealth tree reduce heat accumulation and increase decay rate.

### Kill Window Design

The killer cannot attempt a kill when three or more NPCs have line-of-sight to the target and the kill would be visible. The HUD shows "Too many witnesses" and cancels the attempt. This forces the killer to observe and create windows: using Distraction Throw to move NPCs, waiting for the target to enter a building or side area, or using disguise and stealth positioning.

### Target Assignment

At run start, the run manager assigns one to three NPC targets seeded from the run's random seed. The same seed always produces the same target selection — this ensures multiplayer consistency so both players see the same NPC as the target. Targets are always NPCs with resident or worker roles (never pedestrians, who move too unpredictably). Targets are spread across different zones so no two share a location. Required target count scales with biome difficulty.

Targets have slightly more complex patrol routines than ordinary NPCs of the same role — a subtle behavioral tell for attentive killers to notice.

### Skill Trees

Three skill trees provide progression. Each tree has 10 skills with one to five ranks. Ranks follow a diminishing returns formula and cannot exceed global stat caps. Tier progression requires at least two skills from the previous tier. Stealth and Brutality trees use a reduced cost multiplier (more accessible for early investment). The Deception tree uses a higher cost multiplier — counter-play abilities are earned privileges, not defaults.

**Stealth tree**: Focuses on movement invisibility, detection avoidance, NPC awareness, and disguise longevity. Advanced skills unlock smoke bombs, shadow dash, and extended disguise mechanics. The capstone unlocks a full invisibility status effect.

**Brutality tree**: Focuses on combat effectiveness, kill speed, damage resistance, and body handling efficiency. Advanced skills unlock combat frenzy buffs and stun immunity. The capstone provides passive health regeneration and faster kill execution against all targets.

**Deception tree**: Focuses on evidence awareness, counter-play ability access, and misdirection. Unlocks the five counter-play abilities (fake evidence plant, decoy trail, witness intimidation, surveillance jamming, false alibi construction) as tree skills, each improving with rank. The capstone unlocks Phantom Identity, a once-per-run ability to frame an innocent NPC with a complete evidence package.

### Active Abilities (12)

Five default abilities are available to all killers from the start: Silent Movement (stealth toggle), Lockpick (forced entry), Disguise Change (heat reduction), Evidence Cleanup (destroy nearby evidence), and Distraction Throw (noise-based NPC redirect).

Seven abilities are unlocked via skill tree progression: Smoke Bomb (detection break via Stealth tree), Quick Disposal (instant concealment via Brutality tree), and the five counter-play deception abilities via the Deception tree. All abilities improve across five ranks — rank progression extends range, reduces cooldown, or adds secondary effects without changing the fundamental mechanic.

### Weapons Catalog

Thirteen weapons across six categories: blades (kitchen knife, serrated knife, surgical scalpel), blunt weapons (lead pipe, baseball bat), garrotes (piano wire, professional garrote), ranged (silenced pistol, compact crossbow), poison (poison vial, fast-acting toxin), taser, and an explosive (pipe bomb). Each weapon specifies a kill method, damage value, noise radius, and any special effects (bleed, stun, evidence reduction on hit).

Rarity ranges from common through legendary. All weapons register in the weapon content registry at boot.

### Killer Tools

Eight tool items support killer abilities and disposal: lockpick set (required for lockpick ability), cleaning supplies (required for evidence cleanup, stackable three times), disguise kit (required for disguise change, stackable twice), shovel (required for burial disposal), acid jar (required for acid dissolve disposal, from black market), noise maker (used by distraction throw, stackable five times), smoke canister (used by smoke bomb, stackable twice), and bribery gift (required for false alibi construction, from black market).

### MYTHIC Boss Items

Seven MYTHIC-rarity boss items drop from boss encounters or special achievement conditions. Each requires attunement (a one-time ghost token cost) before equipping. Each uses a custom effect handler that produces behavior not expressible by the standard effect type system. Every boss item has a meaningful trade-off — none is universally best.

- **Reaper's Thread** (garrote weapon): After a strangulation kill, creates a death zone at the kill location for 10 seconds where evidence decays at five times normal speed and the fed's scan accuracy is reduced. Trade-off: garrote kills are slow and require sustained proximity.
- **Phantom Blade** (blade weapon): Kills cause the body to become invisible to NPCs and the fed's scan for 20 seconds. Trade-off: low damage; the body eventually reappears normally.
- **The Puppeteer's Strings** (accessory): Once per run, a killed NPC's sprite continues their patrol route for 60 seconds before collapsing. Witnesses see a normal NPC during that window. Trade-off: once per run; the puppeteered NPC cannot speak to the fed, which is suspicious if the fed tries to interact.
- **Crimson Catalyst** (tool): Killing within 60 seconds of the previous kill stacks a bloodlust buff (movement speed, attack speed, noise reduction bonuses, up to three stacks). Trade-off: encourages fast serial killing which generates more evidence and witnesses.
- **The Hollow Mask** (armor): While disguised, NPC close inspections always succeed and witnessed crimes while disguised reduce heat rather than increase it. Trade-off: zero armor stats; losing the disguise mid-crime removes the effect.
- **Nightfall Cloak** (armor): During night phases, detection radius is significantly reduced and footprint evidence quality drops two tiers. Trade-off: completely inert during day phases; useless in biomes without a day/night cycle.
- **Memento Mori** (accessory): After each kill, spending five seconds to collect a trophy grants a stacking stat bonus for the run (up to five trophies). At five trophies, a one-time invisibility activation is granted. Trade-off: spending time at evidence-rich kill sites is risky.

### Crafting System — The Workshop

The Workshop is a tab in the Equipment/Loadout page accessible between runs. Equipment has one to three upgrade slots based on rarity. Modifications are persistent between runs — removing a mod empties the slot without refunding materials.

Equipment can be dismantled for salvage parts. MYTHIC items cannot be dismantled.

Ten crafting recipes across three tiers:

**Tier 1** (four recipes, available by default): blade damage increase, blunt damage and stun duration increase, armor health increase, armor/accessory noise reduction.

**Tier 2** (four recipes, skill-gated): bleed-on-hit for blades, poison-on-hit for blades and garrotes, detection radius reduction for armor, kill animation speed increase for all weapons.

**Tier 3** (two recipes, achievement-gated): DNA evidence reduction compound for all weapons (requires the Clean Hands trophy), phantom grip for garrotes with near-total silence and evidence reduction (requires the Stealth tree capstone).

All recipe effects use the universal Effect type system. Standard effects (stat modification, status application, evidence reduction) require no new code. One tier 3 recipe uses a custom handler registered with the effect processor.

### Counter-Play Abilities

The five counter-play abilities (KA-8 through KA-12) in the Deception skill tree call directly into the evidence manager and NPC systems:

- **Fake Evidence Plant**: Calls the evidence manager's plant false evidence method. Risk: if the fed has line of sight during planting, the crouching animation is visible. Costs a disguise kit item.
- **Decoy Trail**: Generates five to thirteen footprint false evidence objects (count scales with skill rank) leading toward a chosen zone. Costs cleaning supplies.
- **Witness Intimidation**: Calls the NPC silence-as-witness method and marks the NPC as no longer interviewable. Requires proximity scaled by rank. Cannot be used if another NPC has line of sight unless at rank five.
- **Surveillance Jamming**: Calls the zone manager camera jam method. Requires lockpick set in inventory (not consumed). At rank five, jammed cameras show a fake all-clear feed using a custom effect handler.
- **False Alibi Construction**: Calls the evidence manager's plant false witness evidence method on a target NPC. Requires the NPC to have an empty witness log. Fails silently on fed informants. Costs a bribery gift consumable.

### KillerHUD

A React client component rendered only when the player role is KILLER. Shows: target status cards (name, alive/killed/disposed, last known zone), a radial heat meter with color-coded tier and status text, a carrying indicator with nearby valid disposal locations when carrying a body, counter-play ability slots with availability indicators, and an evidence trail counter showing how many evidence objects the killer has generated.

### Edge Cases

- A kill attempt is blocked when three or more NPCs have line-of-sight to the interaction — the HUD shows "Too many witnesses" and the action is cancelled; the killer must create a window
- Poison kill has a 30-second delay — if the run ends before the target collapses, the kill is scored as incomplete
- A body uncollected for five minutes transitions to fully discoverable — the HUD shows a countdown timer while an active body is on the map
- Carrying a body while any NPC has line-of-sight triggers an immediate alarmed state with no grace period
- Disguise change during critical heat reduces to high, not low — the killer must sustain low-profile behavior to drop further
- False alibi construction fails silently on fed informants — informants have internal state that rejects alibi planting
- Crafted modifications count toward global stat caps — combining crafting, skill tree, and equipment bonuses cannot exceed the stat cap values
- MYTHIC boss items cannot be dismantled and cannot be equipped without one-time attunement
- All counter-play abilities have risk/reward trade-offs by design — none should be used unconditionally

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

The killer role is self-contained in `packages/game-engine/src/killer/` plus its role implementation in `packages/game-engine/src/player/roles/killer-role.ts`. It registers itself with the role registry on module load. The run manager calls `roleRegistry.create('KILLER')` and from that point the role handler manages objectives, win/lose conditions, and reacts to player actions.

The four core killer sub-systems (TargetManager, StealthSystem, KillSystem, DisposalSystem) are coordinated by KillerRole — it composes them together. None of them know about each other directly.

Skills, abilities, weapons, and trophies are all data-driven via the ContentRegistry pattern (`packages/shared/src/registry/content-registry.ts`). The ProgressionEffectsEngine applies progression effects at run start by looking up registered definitions and running effects through the EffectProcessor. This piece provides the data files; the combat system and progression system wire up the execution.

### Core Types

```typescript
// packages/shared/src/types/killer.ts

export type KillMethod =
  | 'STRANGULATION'    // silent, melee range, slow — generates DNA (contact), no noise
  | 'BLADED_WEAPON'    // silent, melee range, fast — generates DNA + WEAPON_TRACE + blood
  | 'BLUNT_TRAUMA'     // moderate noise, melee range — generates DNA + DISTURBED_SCENE
  | 'POISON'           // delayed, administered via spiked drink interaction — DNA (trace only)
  | 'RANGED'           // loud, ranged — generates WEAPON_TRACE (shell casing) + noise witnesses
  | 'COMBAT_KILL';     // target fought back (boss fight) — generates all evidence types

export type DisposalMethod =
  | 'DUMPSTER'         // city/office biomes; no item required; moderate evidence reduction
  | 'LAKE'             // rural/island biomes; no item required; good evidence reduction
  | 'BURIAL'           // rural biomes; requires SHOVEL; excellent evidence reduction
  | 'ACID_DISSOLVE'    // requires ACID_JAR (black market); near-total evidence reduction
  | 'CONCEALMENT';     // urban; no item required; low reduction; body stays on map

export type KillerAbilityId =
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
  | 'FALSE_ALIBI_CONSTRUCTION'; // KA-12: skill tree (K-D8)

export interface KillerAbility {
  id: KillerAbilityId;
  name: string;
  description: string;
  cooldownMs: number;
  resourceCost: number;
  tier: number;           // 1 = default, 2–3 = skill tree unlocks
}

export interface StealthState {
  heatLevel: number;          // 0–100
  isDetected: boolean;        // true when any NPC is in ALARMED state
  noiseLevel: number;         // current noise output 0–100
  isSneaking: boolean;
  detectionRadius: number;    // effective radius (modified by skills)
}

export type TargetStatus = 'ALIVE' | 'KILLED' | 'KILLED_AND_DISPOSED' | 'ESCAPED';

// Extends existing ItemRarity — add 'MYTHIC' to union and DB CHECK constraint
export type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY' | 'MYTHIC';
```

```typescript
// packages/shared/src/types/disposal.ts

export interface DisposalLocation {
  id: string;
  method: DisposalMethod;
  pos: Vec2;
  zoneId: string;
  isAvailable: boolean;        // false if full or already used
  requiredItems: ItemType[];
}

export interface DisposalRequirement {
  method: DisposalMethod;
  requiredItems: ItemType[];
  requiredProximity: number;   // carry body within this radius of disposal point (px)
  timeToDisposeSec: number;    // animation duration
  evidenceReductionFactor: number; // 0–1 fraction of body-related evidence destroyed
}

export interface DisposalResult {
  success: boolean;
  method: DisposalMethod;
  evidenceDestroyed: string[];  // evidence IDs destroyed by disposal
  evidenceRemaining: string[];  // evidence IDs that survive disposal
}

export interface KillerTarget {
  npcId: string;
  displayName: string;
  status: TargetStatus;
  isRequired: boolean;          // optional targets give bonus score but don't block win
  killMethod: KillMethod | null;
  disposalMethod: DisposalMethod | null;
  killedAt: number | null;
  disposedAt: number | null;
}
```

### Killer Constants

```typescript
// packages/shared/src/constants/killer.ts

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
  DUMPSTER:     { requiredItems: [],            requiredProximity: 96, timeToDisposeSec: 4,  evidenceReductionFactor: 0.60 },
  LAKE:         { requiredItems: [],            requiredProximity: 64, timeToDisposeSec: 6,  evidenceReductionFactor: 0.75 },
  BURIAL:       { requiredItems: ['TOOL'],      requiredProximity: 80, timeToDisposeSec: 12, evidenceReductionFactor: 0.85 },
  ACID_DISSOLVE:{ requiredItems: ['CONSUMABLE'],requiredProximity: 48, timeToDisposeSec: 8,  evidenceReductionFactor: 0.95 },
  CONCEALMENT:  { requiredItems: [],            requiredProximity: 32, timeToDisposeSec: 3,  evidenceReductionFactor: 0.30 },
} as const;

export const HEAT_THRESHOLDS = { LOW: 0, MEDIUM: 33, HIGH: 66, CRITICAL: 90 } as const;
export const HEAT_DECAY_RATE = 2;            // heat units per second when low-profile
export const HEAT_INCREASE_WITNESSED = 30;   // heat increase when NPC witnesses suspicious behavior
export const HEAT_INCREASE_BODY_FOUND = 50;  // heat increase when body is found
export const TARGETS_PER_RUN = { min: 1, max: 3 } as const; // scaled by biome difficulty
export const BODY_COLLECTION_DEADLINE_MS = 300_000; // 5 minutes before body becomes fully discoverable
export const BODY_CARRY_SPEED_FACTOR = 0.40; // 40% of WALK speed while carrying
export const MIN_WITNESSES_BLOCK_KILL = 3;   // "too many witnesses" threshold
```

### Core System Classes

#### TargetManager (`packages/game-engine/src/killer/target-manager.ts`)

Assigns specific NPCs as targets for the run. Targets are selected deterministically from the run seed (ensures multiplayer consistency — both players see the same NPC as the target).

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
```

Target selection rules: RESIDENT or WORKER roles only (never PEDESTRIAN — they move too randomly), spread across different zones (no two targets in the same zone), slightly more complex patrol routines than ordinary NPCs of the same role (subtle behavioral tell). Required count: biome `EASY` = 1, `NORMAL` = 2, `HARD` = 3.

#### StealthSystem (`packages/game-engine/src/killer/stealth-system.ts`)

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
  detectionMultiplier: number           // from STEALTH status effect or skills
  noiseReductionMultiplier: number      // from SILENT_MOVEMENT ability or items
  footprintReductionMultiplier: number  // from gloves/items affecting evidence generation
}
```

Skill modifiers are read from `StatModifierSystem.getEffectiveStat()` at compute time — skills like Ghost Presence and Shadow Steps modify `detectionRadius` and `noiseGeneration` stats respectively.

#### KillSystem (`packages/game-engine/src/killer/kill-system.ts`)

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
  evidenceGenerated: Evidence[]  // list of what was generated (for killer HUD awareness)
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

#### DisposalSystem (`packages/game-engine/src/killer/disposal-system.ts`)

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

Disposal speed reads from `StatModifierSystem.getEffectiveStat('disposalSpeed')` — the Efficient Disposal skill (K-B5) improves this stat.

#### KillerRole (`packages/game-engine/src/player/roles/killer-role.ts`)

Implements `RoleInterface`. Composes the four sub-systems (TargetManager, StealthSystem, KillSystem, DisposalSystem) — none of them know about each other directly. Registered with the role registry on module initialization so the run manager can call `roleRegistry.create('KILLER')`.

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

// Registration at module load:
roleRegistry.register('KILLER', () => new KillerRole())

// Win condition: all required targets have status KILLED or KILLED_AND_DISPOSED
// Optional: player reaches exit zone for escape bonus
// Lose condition: player health reaches 0 (killed in combat),
//   fed achieves AIRTIGHT arrest viability AND player is in arrest range,
//   or run time limit exceeded (biome difficulty config)
```

#### KillerHUD (`apps/web/src/components/app/game/hud/KillerHUD.tsx`)

React component, `"use client"`. Only rendered when player role is KILLER. Reads from `killerStore` and `playerStore`.

Displays: target status cards (name, ALIVE/KILLED/DISPOSED, last known zone hint), radial heat meter (0–100, color-coded green→yellow→red→critical flash) with status text ("Laying Low" / "Suspicious Activity" / "High Alert" / "CRITICAL — Change Disguise"), carrying indicator with nearby valid disposal locations when carrying a body, counter-play ability slots with availability indicators (separate from combat abilities), evidence trail counter ("X evidence items in your trail").

#### KillerStore (`apps/web/src/stores/killer.ts`)

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

### Skill Trees

**Cost system**: Base costs per rank: R1: 2 BM / R2: 4 BM / R3: 7 BM + 1 GT / R4: 12 BM + 2 GT / R5: 18 BM + 4 GT. Stealth and Brutality trees use 0.8x multiplier. Deception tree uses 1.3x multiplier. Diminishing returns formula: `effectiveValue = baseValue * rank * (1 / (1 + 0.15 * (rank - 1)))`.

#### Stealth Tree (`packages/shared/src/data/skills/killer-stealth.ts`)

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
| K-S10 | Perfect Shadow | 5 | 1 | R1: UNLOCKS 15s full INVISIBILITY (4min CD). Cannot attack while invisible. Footprints at 30% rate. | K-S9(R2) |

**Hard caps**: Shadow Steps speed bonus caps at +9%. Ghost Presence detection reduction caps at -20%. No combination reduces footprint generation below 15% of base rate.

#### Brutality Tree (`packages/shared/src/data/skills/killer-brutality.ts`)

| ID | Skill Name | Tier | Max Rank | Rank Progression | Prerequisites |
|----|-----------|------|----------|-----------------|---------------|
| K-B1 | Iron Grip | 1 | 5 | R1: melee damage +4 / R2: +7 / R3: +10 / R4: +12 / R5: +14 (cap: +14 flat) | None |
| K-B2 | Lethal Efficiency | 1 | 5 | R1: kill animation speed +8% / R2: +14% / R3: +19% / R4: +23% / R5: +26% | None |
| K-B3 | Tough Skin | 1 | 5 | R1: damage taken -3% / R2: -6% / R3: -8% / R4: -10% / R5: -11% (cap: -11%) | None |
| K-B4 | Clean Strike | 2 | 5 | R1: combat kills generate 6% less DNA / R2: -11% / R3: -15% / R4: -18% / R5: -20% | K-B1(R2) |
| K-B5 | Efficient Disposal | 2 | 5 | R1: disposal time -8% / R2: -14% / R3: -19% / R4: -23% / R5: -26% | K-B2(R1) |
| K-B6 | Bone Breaker | 2 | 3 | R1: stun duration +20% / R2: +35% / R3: +45%, targets cannot call for help while stunned | K-B1(R3), K-B3(R1) |
| K-B7 | Quick Disposal | 3 | 3 | R1: UNLOCKS instant concealment (120s CD, evidence reduction 0.20) / R2: reduction 0.30, CD -20s / R3: reduction 0.40, CD -30s | K-B5(R2) |
| K-B8 | Combat Frenzy | 3 | 5 | R1: after killing, +5% attack speed 10s / R2: +9%, 12s / R3: +12%, 14s / R4: +14%, 15s / R5: +15%, 16s | K-B4(R2), K-B6(R1) |
| K-B9 | Unstoppable | 4 | 3 | R1: stun immunity 3s after taking damage / R2: 5s / R3: 8s + slow immunity | K-B6(R3), K-B8(R2) |
| K-B10 | Apex Predator | 5 | 1 | R1: passive 1HP/2s health regen in combat. All kill methods -1s execution time. Boss targets start at 90% HP. | K-B9(R2) |

**Hard caps**: Iron Grip maxes at +14 flat damage. Tough Skin maxes at -11% damage reduction. Combat Frenzy attack speed caps at +15%. No combination allows one-hit kills on bosses.

#### Deception Tree (`packages/shared/src/data/skills/killer-deception.ts`)

| ID | Skill Name | Tier | Max Rank | Rank Progression | Prerequisites |
|----|-----------|------|----------|-----------------|---------------|
| K-D1 | Evidence Awareness | 1 | 5 | R1: killer sees own evidence trail +10% visibility radius / R2: +18% / R3: +24% / R4: +29% / R5: +33%, evidence shows age (color-coded freshness) | None |
| K-D2 | Witness Reader | 1 | 3 | R1: see NPC alert state icons / R2: icons show witness confidence level / R3: killer sees which NPCs are fed informants | None |
| K-D3 | Cleanup Specialist | 1 | 5 | R1: evidence cleanup radius +10px / R2: +18px / R3: +24px / R4: +29px / R5: +32px, cleanup speed +20% | None |
| K-D4 | Fake Evidence Plant | 2 | 5 | R1: UNLOCKS ability, planted quality = LOW / R2: MEDIUM / R3: HIGH, 10% harder to detect / R4: +18% harder / R5: +25% harder | K-D1(R2), K-D3(R1) |
| K-D5 | Decoy Trail | 2 | 5 | R1: UNLOCKS ability, 5 footprints, last 90s / R2: 7 footprints, 120s / R3: 9 footprints, 150s / R4: 11 footprints, 180s, +10% harder / R5: 13 footprints, 210s, +18% harder | K-D1(R1) |
| K-D6 | Witness Intimidation | 2 | 5 | R1: UNLOCKS ability, 48px range, 2s animation / R2: 64px / R3: 80px, 1.5s / R4: 96px / R5: 112px, 1s, works with 1 NPC in LOS | K-D2(R2) |
| K-D7 | Surveillance Jamming | 3 | 5 | R1: UNLOCKS ability, 45s jam duration / R2: 60s / R3: 75s / R4: 90s / R5: 105s, fake "all clear" feed | K-D4(R2), K-D5(R1) |
| K-D8 | False Alibi Construction | 3 | 3 | R1: UNLOCKS ability, 40% detection chance / R2: 30% / R3: 20% | K-D6(R3) |
| K-D9 | Master Forger | 4 | 3 | R1: all fake evidence starts +1 quality tier / R2: fake evidence decay time +50% / R3: fake evidence immune to passive detection (requires active forensic analysis) | K-D7(R2), K-D8(R1) |
| K-D10 | Phantom Identity | 5 | 1 | R1: UNLOCKS once-per-run ability: creates false DNA + weapon trace + witness statement pointing to one innocent NPC. Costs all 3 counter-play resources. 35s setup time. Adds +25 false arrest viability against target NPC if undetected. | K-D9(R3) |

**Hard caps**: Fake evidence detection reduction caps at 25% (rank 5; stacking with trophies max 40%). Decoy trail max 13 footprints. Witness intimidation range caps at 112px. Phantom Identity is once-per-run.

### Active Abilities

Defined in `packages/shared/src/data/abilities/killer-abilities.ts`, registered in `abilityRegistry` at boot.

| ID | Ability | Default? | Cooldown | Rank 1 | Rank 3 | Rank 5 | Hard Cap |
|----|---------|----------|----------|--------|--------|--------|----------|
| KA-1 | Silent Movement | Yes | Toggle | No footprints while sneaking, noise -30% | noise -42%, stamina drain -15% | noise -50%, stamina drain -25%, NPC hearing range -15% | noise reduction max -50% |
| KA-2 | Lockpick | Yes | 5s CD | Opens locked doors in 3s | 2.2s, BROKEN_LOCK at LOW-1 quality | 1.7s, 30% chance no evidence | min time 1.7s |
| KA-3 | Disguise Change | Yes | 45s CD | Changes sprite, heat -20 | heat -29, CD -8s | heat -35, CD -13s, 40% chance close inspection fails | heat reduction max -35 |
| KA-4 | Evidence Cleanup | Yes | 30s CD | 10s window, destroys 1 evidence/2s in 64px | 1 per 1.5s in 78px | 1 per 1s in 90px, also reduces evidence quality 1 tier | max radius 90px |
| KA-5 | Distraction Throw | Yes | 15s CD | 128px noise radius, NPCs investigate 8s | 160px, 11s | 192px, 14s, choose "suspicious sound" or "call for help" variant | max radius 192px |
| KA-6 | Smoke Bomb | Tree (K-S7) | 90s CD | 12s detection break, 96px cloud | 14s, 120px | 16s, 144px, applies SLOW to NPCs in cloud 3s | max duration 16s |
| KA-7 | Quick Disposal | Tree (K-B7) | 120s CD | Instant concealment, evidence reduction 0.20 | 0.30, CD -20s | 0.40, CD -30s | max reduction 0.40 |
| KA-8 | Fake Evidence Plant | Tree (K-D4) | 60s CD | Place 1 false evidence, LOW quality | MEDIUM, CD -10s | HIGH, CD -15s, +25% harder to detect | max CD reduction 15s |
| KA-9 | Decoy Trail | Tree (K-D5) | 90s CD | 5 footprints, 90s duration | 9 footprints, 150s | 13 footprints, 210s | max 13 footprints |
| KA-10 | Witness Intimidation | Tree (K-D6) | 45s CD | Silence 1 witness, 48px range | 80px, 1.5s anim | 112px, 1s anim, works with 1 NPC in LOS | max range 112px |
| KA-11 | Surveillance Jamming | Tree (K-D7) | 120s CD | Jam cameras 45s in 1 zone | 75s, CD -15s | 105s, CD -25s, fake "all clear" feed | max jam 105s |
| KA-12 | False Alibi Construction | Tree (K-D8) | 180s CD | Create alibi, 40% detection by fed forensics | 8s animation, 30% detection | 6s animation, 20% detection | min detection 20% |

### Weapons Catalog

Defined in `packages/shared/src/data/weapons/killer-weapons.ts`, registered in `weaponRegistry`.

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
| EXPLOSIVE | pipe_bomb | Pipe Bomb | LEGENDARY | 35 | ENVIRONMENTAL | 192px AoE, 1024px noise, destroys all evidence in blast zone |

### Tools Catalog

Defined in `packages/shared/src/data/items/killer-items.ts`, registered in `itemRegistry`.

| ID | Name | Rarity | Effect |
|----|------|--------|--------|
| lockpick_set | Lockpick Set | COMMON | Required for LOCKPICK (KA-2) |
| cleaning_supplies | Cleaning Supplies | COMMON | Required for EVIDENCE_CLEANUP (KA-4); stackable x3 |
| disguise_kit | Disguise Kit | UNCOMMON | Required for DISGUISE_CHANGE (KA-3); stackable x2 |
| shovel | Shovel | UNCOMMON | Required for BURIAL disposal |
| acid_jar | Acid Jar | RARE | Required for ACID_DISSOLVE disposal (from black market) |
| noise_maker | Noise Maker | COMMON | Used by DISTRACTION_THROW (KA-5); stackable x5 |
| smoke_canister | Smoke Canister | UNCOMMON | Used by SMOKE_BOMB (KA-6); stackable x2 |
| bribery_gift | Bribery Gift | RARE | Required for FALSE_ALIBI_CONSTRUCTION (KA-12); from black market |

### Boss Items (MYTHIC)

Defined in `packages/shared/src/data/boss-items/killer-boss-items.ts`, registered in `weaponRegistry` or `itemRegistry` with `rarity: 'MYTHIC'`. Custom handlers registered in `packages/game-engine/src/effects/boss-item-handlers.ts`. Attunement cost: 5 ghost tokens (one-time).

| ID | Name | Slot | Custom Handler | Obtain Condition |
|----|------|------|---------------|-----------------|
| KB-1 | Reaper's Thread | WEAPON (Garrote) | `reapers_thread_kill_zone` | Defeat "The Watcher" boss on Hard with strangulation-only kill |
| KB-2 | Phantom Blade | WEAPON (Blade) | `phantom_blade_ethereal_kill` | Score 10,000+ in a single killer win run |
| KB-3 | The Puppeteer's Strings | ACCESSORY | `puppeteer_dead_npc` | Win 5 runs where zero NPCs enter ALARMED state |
| KB-4 | Crimson Catalyst | TOOL | `crimson_catalyst_bloodlust` | Eliminate 4 targets in a single run within 3 minutes |
| KB-5 | The Hollow Mask | ARMOR | `hollow_mask_disguise_master` | Complete 3 different biomes using disguise-only kills |
| KB-6 | Nightfall Cloak | ARMOR | `nightfall_cloak_night_power` | Win 3 runs where all kills occur during night phases |
| KB-7 | Memento Mori | ACCESSORY | `memento_mori_collect` | Win 10 runs with maximum score (all optional objectives completed) |

### Crafting Recipes

Defined in `packages/shared/src/data/crafting/killer-recipes.ts`, registered in `craftingRecipeRegistry`. Slot count per rarity: COMMON/UNCOMMON = 1, RARE/LEGENDARY = 2, MYTHIC = 3. Salvage yield: COMMON = 1, UNCOMMON = 2, RARE = 4, LEGENDARY = 8, MYTHIC = cannot dismantle.

**Tier 1 (default)**

| ID | Recipe Name | Effects | Cost | Compatible With |
|----|------------|---------|------|-----------------|
| KR-1 | Whetstone Edge | STAT_MOD meleeDamage +3 FLAT | 8 BM + 2 salvage | WEAPON (BLADE) |
| KR-2 | Weighted Handle | STAT_MOD meleeDamage +2 FLAT + APPLY_STATUS STUN durationMs:500 | 8 BM + 2 salvage | WEAPON (BLUNT) |
| KR-3 | Reinforced Padding | STAT_MOD maxHealth +10 FLAT | 6 BM + 3 salvage | ARMOR |
| KR-4 | Silent Soles | STAT_MOD noiseGeneration -5% PERCENT | 10 BM + 2 salvage | ARMOR, ACCESSORY |

**Tier 2 (skill-gated)**

| ID | Recipe Name | Effects | Cost | Compatible With | Unlock |
|----|------------|---------|------|-----------------|--------|
| KR-5 | Serrated Filing | APPLY_STATUS BLEED durationMs:4000 | 15 BM + 4 salvage + 1 GT | WEAPON (BLADE) | K-B1 rank 3 |
| KR-6 | Toxin Coating | APPLY_STATUS POISON durationMs:6000 | 15 BM + 4 salvage + 2 GT | WEAPON (BLADE, GARROTE) | K-B4 rank 2 |
| KR-7 | Shadow Lining | STAT_MOD detectionRadius -8% PERCENT | 12 BM + 3 salvage + 1 GT | ARMOR | K-S6 rank 2 |
| KR-8 | Quick-Release Sheath | STAT_MOD killAnimSpeed +10% PERCENT | 14 BM + 3 salvage + 2 GT | WEAPON (all) | K-B2 rank 3 |

**Tier 3 (achievement-gated)**

| ID | Recipe Name | Effects | Cost | Compatible With | Unlock |
|----|------------|---------|------|-----------------|--------|
| KR-9 | Evidence-Dissolving Compound | EVIDENCE_REDUCTION evidenceTypeId:DNA percent:0.15 | 25 BM + 8 salvage + 5 GT | WEAPON (all) | Trophy: Clean Hands |
| KR-10 | Phantom Grip | CUSTOM handler:phantom_grip_silent_kill params:{noiseReduction:0.90, evidenceReduction:0.30} | 30 BM + 10 salvage + 8 GT | WEAPON (GARROTE) | K-S10 (capstone) |

### EventBus Event Types

New events added to `GameEvents` in `packages/game-engine/src/events/event-types.ts`:

```typescript
KILL_EXECUTED: {
  targetId: string;
  method: KillMethod;
  pos: Vec2;
  evidenceCount: number;
  wasWitnessed: boolean;
  witnessIds: string[];
};
BODY_PICKUP: { bodyId: string; killerId: string };
BODY_DISPOSED: { bodyId: string; method: DisposalMethod; evidenceDestroyed: number };
HEAT_CHANGED: { level: number; tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; reason: string };
HEAT_CRITICAL: { killerPos: Vec2 };  // fed receives ambient alert hint (not exact position)
TARGET_STATUS_CHANGED: { targetId: string; status: TargetStatus };
KILLER_WIN_CONDITION_MET: { targetsKilled: number; targetsDisposed: number };
KILLER_LOSE_CONDITION_MET: { reason: 'ARRESTED' | 'KILLED' | 'TIME_LIMIT' };
COUNTER_PLAY_USED: { abilityId: KillerAbilityId; pos: Vec2 };
```

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
