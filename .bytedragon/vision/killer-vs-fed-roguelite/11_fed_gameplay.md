---
vision: killer-vs-fed-roguelite
sequence: 11
name: fed-gameplay
group: Role Systems
group_order: 4
status: pending
depends_on:
  - "03: Design system components for FedHUD React component and fed-specific UI"
  - "05: World/map data, biome types, zone manager for investigation area scanning"
  - "06: NPC witness system (WitnessStatement, canBeInterviewed), NPCSpawner, entity types"
  - "07: PlayerController, RoleInterface, RoleRegistry, RunManager, inventory types, run types"
  - "08: Combat system (AttackSystem, HealthSystem, AbilitySystem, StatusEffectSystem, StatModifierSystem, ContentRegistry, Effect types)"
  - "09: Evidence manager, discovery mechanics, case file tracker, evidence types and constants"
produces:
  - "packages/game-engine/src/player/roles/fed-role.ts — implements role interface"
  - "packages/shared/src/types/fed.ts — FedObjective, InvestigationTool, SuspectProfile, ArrestCondition, InterrogationResult, CounterPlayAbility, FedSkillTree, FedAbilityDef"
  - "packages/shared/src/constants/fed.ts — evidence thresholds, tool effectiveness, interrogation rates, counter-play costs"
  - "packages/shared/src/data/skills/fed-forensics.ts — Forensics tree (F-F1 through F-F10)"
  - "packages/shared/src/data/skills/fed-interrogation.ts — Interrogation tree (F-I1 through F-I10)"
  - "packages/shared/src/data/skills/fed-tactics.ts — Tactics tree (F-T1 through F-T10)"
  - "packages/shared/src/data/abilities/fed-abilities.ts — FA-1 through FA-12 definitions with ranks"
  - "packages/shared/src/data/weapons/fed-weapons.ts — 6 fed weapon definitions"
  - "packages/shared/src/data/boss-items/fed-boss-items.ts — FB-1 through FB-7 MYTHIC items"
  - "packages/shared/src/data/crafting/fed-recipes.ts — FR-1 through FR-10 crafting recipes"
  - "packages/game-engine/src/fed/investigation-system.ts — area scanning, crime scene analysis, forensic examination"
  - "packages/game-engine/src/fed/witness-system.ts — NPC interviews, reliability scoring, false leads"
  - "packages/game-engine/src/fed/suspect-tracker.ts — suspect list management, evidence linking, pool narrowing"
  - "packages/game-engine/src/fed/arrest-system.ts — evidence-gated arrest, combat fallback, outcomes"
  - "packages/game-engine/src/fed/vigilante-system.ts — direct combat option with reduced rewards"
  - "packages/game-engine/src/fed/fed-abilities.ts — enhanced scanning, witness compulsion, forensic analysis, counter-play abilities"
  - "packages/game-engine/src/fed/fed-items.ts — forensic kits, interview tools, tracking devices, counter-play tools"
  - "packages/game-engine/src/effects/boss-item-handlers.ts — custom handlers for FB-1 through FB-7"
  - "apps/web/src/components/app/game/hud/FedHUD.tsx — evidence panel, suspect board, case meter, arrest readiness"
  - "apps/web/src/components/app/game/hud/SuspectBoard.tsx — visual detective board with photo/string connections"
  - "apps/web/src/stores/fed.ts — fed-specific Zustand state"
created: 2026-03-17
last_aligned: never
---

# Vision Piece 11: Fed Gameplay

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: combat-system (08), evidence-system (09)

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Implement the federal investigator role's complete gameplay loop. The fed player gathers evidence, interviews witnesses, builds a suspect profile among all map NPCs, and ultimately identifies and arrests (or fights) the killer. The fed must gather enough evidence to distinguish the killer from innocent NPCs while the killer actively undermines the investigation through counter-play. This piece runs in parallel with killer-gameplay (piece 10) — both roles share the same maps, NPC pool, evidence system, and combat framework.

### Role Overview

The fed is the investigative counterpart to the killer. Where the killer plays offensively and tries to minimize their evidence trail, the fed plays defensively and reactively — building knowledge over time. The asymmetry is intentional: the killer acts, the fed reacts. But the fed has counter-play tools to force the killer out of their comfort zone.

**Win condition**: Arrest the killer with sufficient evidence (`STRONG` or `AIRTIGHT` arrest viability for a clean arrest, or `MODERATE`/`WEAK` with successful combat backup), or defeat the killer in direct combat (vigilante path — lower score reward).

**Lose condition**: All targets eliminated AND disposed (killer wins) before arrest can be made, OR fed player health reaches zero in combat.

### Dependency Details (Inline — Do Not Reference Other Documents)

#### From packages/shared/src/types/common.ts
```typescript
type ID = string;          // UUID format
type Timestamp = string;   // ISO 8601
```

#### From packages/shared/src/utils/result.ts (neverthrow)
```typescript
import { Result, ok, err } from 'neverthrow';
type AppError = { code: string; message: string; context?: Record<string, unknown> };
type ValidationError = AppError & { code: 'VALIDATION_ERROR'; fields: Record<string, string> };
type NotFoundError = AppError & { code: 'NOT_FOUND' };
type UnauthorizedError = AppError & { code: 'UNAUTHORIZED' };
type DatabaseError = AppError & { code: 'DATABASE_ERROR' };
```

#### From packages/shared/src/types/player.ts (piece 07)
```typescript
type PlayerRole = 'KILLER' | 'FED'
interface PlayerAbility { id: ID; name: string; cooldownMs: number; cost: number; isUnlocked: boolean }
interface RoleConfig { role: PlayerRole; startingAbilities: PlayerAbility[]; startingItems: InventoryItem[] }
```

#### From packages/game-engine/src/player/roles/role-interface.ts (piece 07)
```typescript
interface RoleInterface {
  getObjectives(): Objective[];
  getAbilities(): PlayerAbility[];
  getHUDConfig(): HUDConfig;
  checkWinCondition(state: RunState): boolean;
  checkLoseCondition(state: RunState): boolean;
}
```

#### From packages/shared/src/types/run.ts (piece 07)
```typescript
interface RunConfig { seed: string; biome: Biome; role: PlayerRole; loadout: Loadout }
interface RunState { phase: 'ACTIVE' | 'COMPLETE'; tickCount: number; startTime: Timestamp }
interface RunResult { outcome: 'WIN' | 'LOSE'; score: number; durationSeconds: number; materialsEarned: Record<string, number> }
```

#### From packages/shared/src/types/inventory.ts (piece 07)
```typescript
interface InventoryItem { id: ID; itemType: ItemType; name: string; rarity: ItemRarity; effect: ItemEffect }
type ItemType = 'WEAPON' | 'TOOL' | 'CONSUMABLE' | 'KEY_ITEM' | 'EVIDENCE_MOD' | 'DISGUISE'
type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY' | 'MYTHIC'
interface ItemEffect { statModifiers?: Record<string, number>; abilityUnlock?: string; evidenceModifier?: number }
```

#### From packages/shared/src/types/combat.ts (piece 08)
```typescript
interface CombatState { phase: 'INIT' | 'ACTIVE' | 'RESOLVING' | 'ENDED'; participantIds: ID[] }
interface Ability { id: ID; name: string; cooldownMs: number; effects: AbilityEffect[] }
interface AbilityEffect { type: 'DAMAGE' | 'HEAL' | 'BUFF' | 'DEBUFF' | 'CC'; magnitude: number; durationMs?: number }
interface StatusEffect { id: ID; name: string; type: 'BUFF' | 'DEBUFF'; remainingMs: number }
```

#### From packages/shared/src/types/evidence.ts (piece 09)
```typescript
type EvidenceType =
  | 'FOOTPRINT'
  | 'DNA'
  | 'WEAPON_TRACE'
  | 'BODY'
  | 'WITNESS'
  | 'SURVEILLANCE'
  | 'BROKEN_LOCK'
  | 'DISTURBED_SCENE'
  | 'FALSE_EVIDENCE'
  | 'INFORMANT_REPORT'

type EvidenceState = 'HIDDEN' | 'DISCOVERABLE' | 'DISCOVERED' | 'DESTROYED' | 'DISCREDITED'
// DISCREDITED: fed discovered it was FALSE_EVIDENCE; no longer counts toward case

type EvidenceQuality = 'LOW' | 'MEDIUM' | 'HIGH' | 'IRREFUTABLE'
// IRREFUTABLE: cannot be reduced below HIGH by any killer counter-play

type Evidence = {
  id: string
  type: EvidenceType
  state: EvidenceState
  quality: EvidenceQuality
  pos: Vec2
  zoneId: string
  linkedEntityId: string | null
  generatedBy: string
  generatedAt: number
  decayStartAt: number | null
  decayDurationMs: number | null
  isFalse: boolean
  discoveredBy: string | null
  discoveredAt: number | null
  notes: string
}

type CaseFile = {
  runId: string
  fedPlayerId: string
  discoveredEvidence: Evidence[]
  witnessStatements: WitnessStatement[]
  suspectIds: string[]
  arrestViability: number
  arrestViabilityTier: ArrestViabilityTier
  lastUpdatedAt: number
}

type ArrestViabilityTier = 'INSUFFICIENT' | 'WEAK' | 'MODERATE' | 'STRONG' | 'AIRTIGHT'
// INSUFFICIENT (<20): arrest not possible
// WEAK (20-39): arrest attempt triggers combat with target
// MODERATE (40-59): arrest is possible but target may resist
// STRONG (60-79): arrest attempt succeeds with minor resistance
// AIRTIGHT (80-100): clean arrest, no resistance, bonus score
```

#### From packages/game-engine/src/evidence/evidence-manager.ts (piece 09)
```typescript
// Key methods available on EvidenceManager singleton:
discoverEvidence(evidenceId: ID, discoveredBy: PlayerRole): Result<Evidence, AppError>
getDiscoverableNearPosition(x: number, y: number, radius: number): Evidence[]
getEvidenceById(id: ID): Evidence | undefined
```

#### From packages/game-engine/src/evidence/discovery-mechanics.ts (piece 09)
```typescript
// Functions used by fed investigation:
scanArea(origin: { x: number; y: number }, radius: number, fedScanPower: number): Evidence[]
analyzeEvidenceQuality(evidence: Evidence, forensicSkillLevel: number): EvidenceQuality
```

#### From packages/game-engine/src/evidence/case-file.ts (piece 09)
```typescript
// CaseFileTracker instance methods:
addEvidence(evidence: Evidence): void
linkEvidenceToSuspect(evidenceId: ID, suspectId: ID): void
calculateArrestViability(): number   // 0-100 score
eliminateSuspect(suspectId: ID): void
getTopSuspect(): ID | undefined
```

#### From packages/game-engine/src/entities/npc.ts (piece 06)
```typescript
class NPC extends BaseEntity {
  role: NPCRole;
  behavior: NPCBehavior;
  hasWitnessedEvent: boolean;
  witnessedEventType?: string;
  witnessedSuspectDescription?: string;
  isSilenced: boolean;  // set true by killer's witness intimidation
}
```

#### From packages/game-engine/src/entities/interaction-manager.ts (piece 06)
```typescript
// Fed interacts with NPCs and crime scenes via:
triggerInteraction(entityId: ID, playerRole: PlayerRole): InteractionResult
getInteractablesNearPosition(x: number, y: number): InteractableEntity[]
```

#### From packages/game-engine/src/combat/combat-controller.ts (piece 08)
```typescript
// Fed can initiate combat with killer (vigilante) via:
initiateCombat(attackerId: ID, defenderId: ID, config: CombatConfig): CombatState
```

#### From packages/game-engine/src/combat/ability-system.ts (piece 08)
```typescript
useAbility(abilityId: ID, userId: ID, targetId?: ID): Result<AbilityEffect[], AppError>
isAbilityReady(abilityId: ID, userId: ID): boolean
```

#### From apps/web/src/stores/evidence.ts (piece 09)
```typescript
// Zustand evidence store — fed reads:
interface EvidenceStore {
  discoveredEvidence: Evidence[];
  caseFile: CaseFile | null;
  arrestViability: number;
  arrestViabilityTier: ArrestViabilityTier;
}
```

#### From apps/web/src/stores/player.ts (piece 07)
```typescript
// Zustand player store — fed reads/writes via EventBus:
interface PlayerStore {
  role: PlayerRole;
  health: number;
  position: { x: number; y: number };
  inventory: InventoryItem[];
  abilities: PlayerAbility[];
  objectives: Objective[];
}
```

#### From apps/web/src/components/app/common/ (piece 03)
```typescript
// Available app-layer wrapper components:
AppButton, AppCard, AppDialog, AppInput, AppToast
// Layouts:
PageLayout, GameLayout, AuthLayout
```

#### From packages/game-engine/src/utils/event-bus.ts (piece 04)
```typescript
// EventBus for Phaser→React signals:
EventBus.emit(event: string, data: unknown): void
EventBus.on(event: string, callback: (data: unknown) => void): void
EventBus.off(event: string, callback: (data: unknown) => void): void
```

#### From packages/shared/src/registry/registries.ts (piece 13 architecture)
```typescript
// Content registries — all skill, ability, item, weapon, trophy, crafting definitions
// register here at boot via registerAllContent()
export const abilityRegistry: ContentRegistry<AbilityDef>;
export const skillRegistry: ContentRegistry<SkillDef>;
export const itemRegistry: ContentRegistry<ItemDef>;
export const weaponRegistry: ContentRegistry<WeaponDef>;
export const craftingRecipeRegistry: ContentRegistry<CraftingRecipe>;
```

#### From packages/shared/src/effects/effect-types.ts (piece 13 architecture)
```typescript
// Universal Effect type — all skill/item/ability effects expressed as Effects
export type Effect =
  | { type: 'STAT_MOD'; stat: StatId; value: number; modType: 'FLAT' | 'PERCENT' }
  | { type: 'SCAN_RADIUS_MOD'; percent: number }
  | { type: 'DISCOVERY_SPEED_MOD'; multiplier: number }
  | { type: 'FALSE_EVIDENCE_DETECTION_MOD'; percent: number }
  | { type: 'ARREST_VIABILITY_MOD'; flat: number }
  | { type: 'HEAT_GENERATION_MOD'; percent: number }
  | { type: 'HEAT_DECAY_MOD'; percent: number }
  | { type: 'HEAT_COST_MOD'; percent: number }
  | { type: 'HEAT_CAP_MOD'; flat: number }
  | { type: 'APPLY_STATUS'; statusId: string; durationMs?: number; magnitude?: number }
  | { type: 'ABILITY_UNLOCK'; abilityId: string }
  | { type: 'CUSTOM'; handler: string; params: Record<string, number | string | boolean> }
  // ... full union in effect-types.ts
```

### New Types to Create

**`packages/shared/src/types/fed.ts`**:

```typescript
import { ID, Timestamp } from './common';

export type FedObjective =
  | 'GATHER_EVIDENCE'
  | 'IDENTIFY_SUSPECT'
  | 'MAKE_ARREST'
  | 'PREVENT_KILLS'

export type ArrestCondition =
  | 'INSUFFICIENT'  // <20 viability — arrest not possible
  | 'WEAK'          // 20-39 — attempt triggers combat with target at full strength
  | 'MODERATE'      // 40-59 — arrest possible but target may resist
  | 'STRONG'        // 60-79 — arrest attempt succeeds with minor resistance
  | 'AIRTIGHT'      // 80-100 — clean arrest, no resistance, bonus score

export type InvestigationTool =
  | 'FORENSIC_KIT'
  | 'INTERVIEW_BADGE'
  | 'TRACKING_DEVICE'
  | 'EVIDENCE_BAG'
  | 'HANDCUFFS'
  // Counter-play tools (unlocked via skill tree):
  | 'WIRETAP_KIT'        // illegal surveillance
  | 'INFORMANT_BADGE'    // planted informants
  | 'ENTRAPMENT_KIT'     // entrapment setup
  | 'OFFBOOKS_LAB'       // off-the-books forensics

export interface SuspectProfile {
  entityId: ID;
  displayName: string;
  linkedEvidenceIds: ID[];
  suspicionScore: number;      // 0-100, higher = more likely killer
  isEliminated: boolean;
  notes: string[];
}

export interface InterrogationResult {
  npcId: ID;
  infoType: 'LOCATION' | 'TIME' | 'DESCRIPTION' | 'ACTION' | 'FABRICATED';
  content: string;
  reliability: number;         // 0-1, affects suspicion score weight
  isCoerced: boolean;          // true if rough interrogation used
}

// Counter-play abilities (unlocked via skill tree progression)
export type CounterPlayAbility =
  | 'ILLEGAL_SURVEILLANCE'   // off-the-books camera access — faster but inadmissible
  | 'ROUGH_INTERROGATION'    // coerce NPCs for better intel — risk of complaint
  | 'PLANTED_INFORMANT'      // turn NPC into active watcher
  | 'ENTRAPMENT_SETUP'       // stage a scene to draw killer out
  | 'OFFBOOKS_FORENSICS'     // faster evidence analysis — inadmissible but actionable

export interface CounterPlayEffect {
  ability: CounterPlayAbility;
  successChance: number;           // 0-1 probability of full effect
  heatGenerated: number;           // risk cost — fed "heat" from IA scrutiny
  evidenceQualityModifier: number; // positive for faster/better, negative for inadmissibility
  // inadmissible evidence still gives suspicion score boost but not arrest viability
}

export interface FedRunState {
  discoveredSuspects: SuspectProfile[];
  activeCounterPlayEffects: CounterPlayEffect[];
  fedHeatLevel: number;             // 0-100: IA scrutiny from abusing counter-play
  interrogationsPerformed: number;
  evidenceCollected: number;
  arrestAttempts: number;
}
```

### Fed Skill Trees

The fed has three skill trees with 10 skills each (30 total). All trees follow the same rank system as the killer. Definitions are data-driven via the ContentRegistry — no hardcoded switch statements.

#### Rank System Rules (Universal)

- Every skill has 1-5 ranks (configured per skill)
- Each rank costs materials (scaling cost per rank)
- **Diminishing returns formula** for percentage bonuses: `effectiveValue = baseValue * rank * (1 / (1 + 0.15 * (rank - 1)))`
  - Rank 1: 100% of base per rank
  - Rank 2: 87% of base per rank (total ~187% of rank 1)
  - Rank 3: 77% of base per rank (total ~231% of rank 1)
  - Rank 4: 69% of base per rank (total ~276% of rank 1)
  - Rank 5: 63% of base per rank (total ~313% of rank 1)
- **Hard cap**: No single skill can provide more than 50% improvement in any one stat. Total from all sources (skills + trophies + equipment) caps at 75%.
- Flat bonuses scale linearly and are individually modest.
- **Tier gating**: Tier N requires at least 2 skills from Tier N-1.

#### Adjusted Skill Costs (Revised — Piece 13 Integration)

| Rank | Primary Material (evidence_dust) | Ghost Tokens | Total Materials | Design Intent |
|------|----------------------------------|--------------|-----------------|---------------|
| 1 | 2 | 0 | 2 | Accessible: one average run covers 1-2 rank-ups |
| 2 | 4 | 0 | 4 | Moderate: one good run covers a rank-up |
| 3 | 7 | 1 | 8 | Investment: introduces rare currency gate |
| 4 | 12 | 2 | 14 | Significant: requires 2-3 dedicated runs |
| 5 | 18 | 4 | 22 | Achievement: capstone milestone, ~4 runs of focused earning |

**Tree multipliers**: Core tree (Forensics) uses a **0.8x cost multiplier** (cheaper — bread-and-butter skills). Counter-play trees (Interrogation, Tactics) use a **1.3x cost multiplier** (more expensive — earned privileges).

**Player progression curve**:
- Tiers 1-2 competitive: ~12-15 runs
- Core tree maxed: ~48 runs (good player)
- One core + Tactics competitive: ~40 runs
- All trees maxed: ~140+ runs

#### FED TREE 1: FORENSICS (Evidence Gathering, Analysis, Quality)

Defined in `packages/shared/src/data/skills/fed-forensics.ts`. Registered via `skillRegistry` at boot.

| # | Skill Name | Tier | Max Rank | Rank Progression | Prerequisites |
|---|-----------|------|----------|-----------------|---------------|
| F-F1 | Sharp Eye | 1 | 5 | R1: scan radius +8% | R2: +14% | R3: +19% | R4: +23% | R5: +26% | None |
| F-F2 | Quick Scan | 1 | 5 | R1: scan cooldown -1.5s | R2: -2.6s | R3: -3.5s | R4: -4.2s | R5: -4.8s | None |
| F-F3 | Evidence Preservation | 1 | 5 | R1: evidence decay timer +12% | R2: +21% | R3: +28% | R4: +34% | R5: +39% | None |
| F-F4 | Trace Analysis | 2 | 5 | R1: evidence quality upgrade speed +10% | R2: +18% | R3: +24% | R4: +29% | R5: +33% | F-F1(R2) |
| F-F5 | Pattern Recognition | 2 | 5 | R1: passive 5% chance to auto-flag fake evidence on discovery | R2: 9% | R3: 12% | R4: 15% | R5: 17% (max) | F-F1(R1), F-F3(R1) |
| F-F6 | Crime Scene Specialist | 2 | 3 | R1: crime scene analysis bonus +5 arrest viability (from +10 base) | R2: +8 | R3: +10, also reveals hidden evidence in crime scene zone | F-F4(R1) |
| F-F7 | Forensic Intuition | 3 | 5 | R1: active forensic analysis detects false evidence +4% chance | R2: +7% | R3: +10% | R4: +12% | R5: +14% | F-F4(R3), F-F5(R2) |
| F-F8 | Evidence Networking | 3 | 3 | R1: evidence of same type within 200px auto-links to same suspect | R2: 280px | R3: 360px, auto-eliminate suspects with contradicting evidence | F-F5(R3), F-F6(R2) |
| F-F9 | Forensic Expert | 4 | 3 | R1: all evidence quality upgrades gain +1 bonus tier | R2: IRREFUTABLE evidence contributes +5 extra to arrest viability | R3: can "reconstruct" destroyed evidence (50% quality of original, 90s cooldown) | F-F7(R3), F-F8(R1) |
| F-F10 | Master Analyst | 5 | 1 | R1: scan reveals ALL evidence types in radius including HIDDEN. Passive: 25% chance to detect false evidence on first examination (before analysis). Evidence quality upgrades never fail. | F-F9(R2) |

**Hard caps**: Scan radius max +26%. Fake evidence auto-detection max 17% passive (requires active analysis for higher chance). Evidence quality upgrade speed max +33%. No combination allows instant full-map reveal.

#### FED TREE 2: INTERROGATION (Witnesses, Intel, Counter-Play)

Defined in `packages/shared/src/data/skills/fed-interrogation.ts`.

| # | Skill Name | Tier | Max Rank | Rank Progression | Prerequisites |
|---|-----------|------|----------|-----------------|---------------|
| F-I1 | Silver Tongue | 1 | 5 | R1: witness reliability +3% | R2: +6% | R3: +8% | R4: +9% | R5: +10% | None |
| F-I2 | Body Language Reader | 1 | 5 | R1: interview reveals NPC suspicion level at +10% accuracy | R2: +18% | R3: +24% | R4: +29% | R5: +33% | None |
| F-I3 | Off-Books Forensics | 1 | 5 | R1: UNLOCKS ability FA-12. Discovery time x0.5, fedHeat +5/use | R2: x0.4, heat +5 | R3: x0.3, heat +4 | R4: x0.2, heat +4 | R5: x0.1, heat +3 | None |
| F-I4 | Rough Interrogation | 2 | 5 | R1: UNLOCKS ability FA-9. Forces reliability 0.80, fedHeat +15 | R2: reliability 0.83, heat +14 | R3: reliability 0.85, heat +13, can extract from silenced witnesses at heat +25 | R4: reliability 0.88, heat +12, silenced heat +22 | R5: reliability 0.90, heat +10, silenced heat +18 | F-I1(R2), F-I2(R1) |
| F-I5 | Planted Informant | 2 | 5 | R1: UNLOCKS ability FA-10. Max 1 informant, 150px watch radius, fedHeat +10 | R2: max 2, heat +9 | R3: 190px radius, heat +8 | R4: max 3, heat +7 | R5: 220px radius, heat +6, informant survives 1 intimidation attempt | F-I2(R2) |
| F-I6 | Network Builder | 2 | 3 | R1: when informant reports, +3 suspicion score on reported entity | R2: +5 | R3: +7, informant reports include direction of movement | F-I5(R1), F-I1(R1) |
| F-I7 | Illegal Surveillance | 3 | 5 | R1: UNLOCKS ability FA-8. Restores jammed cameras 45s, fedHeat +8 | R2: 55s, heat +7 | R3: 65s, heat +7 | R4: 75s, heat +6 | R5: 85s, heat +5, cameras also detect STEALTH status entities | F-I4(R2) OR F-I5(R2) |
| F-I8 | Heat Management | 3 | 5 | R1: all counter-play fedHeat costs -5% | R2: -9% | R3: -12% | R4: -15% | R5: -17% | Two Tier 2 skills in Interrogation |
| F-I9 | Deep Cover Operations | 4 | 3 | R1: planted informants immune to intimidation if killer suspicion < 50 | R2: threshold < 65 | R3: threshold < 80, informants also report if killer uses abilities nearby | F-I7(R2), F-I8(R2) |
| F-I10 | Shadow Network | 5 | 1 | R1: UNLOCKS passive: all NPCs have 8% chance to spontaneously report suspicious activity they witness. Max 1 spontaneous report per 60s. Counter-play heat costs reduced by 25% (stacks with Heat Management, total cap at 40%). | F-I9(R2) |

**Hard caps**: Witness reliability bonus max +10%. Heat cost reduction cap at 40% total (from all sources). Informant radius max 220px. Max informants: 3 (even with trophies, cap at 4). Rough Interrogation min heat cost: 10 (rank 5, never free).

#### FED TREE 3: TACTICS (Area Control, Entrapment, Strategic Play)

Defined in `packages/shared/src/data/skills/fed-tactics.ts`. Uses 1.3x cost multiplier (counter-play gating).

| # | Skill Name | Tier | Max Rank | Rank Progression | Prerequisites |
|---|-----------|------|----------|-----------------|---------------|
| F-T1 | Rapid Response | 1 | 5 | R1: area lockdown cooldown -10s | R2: -18s | R3: -24s | R4: -29s | R5: -33s | None |
| F-T2 | Pursuit Training | 1 | 5 | R1: move speed +2% during active investigation | R2: +4% | R3: +5% | R4: +6% | R5: +7% | None |
| F-T3 | Zone Profiling | 1 | 3 | R1: entering a new zone reveals evidence count (number only, not locations) | R2: also reveals evidence type breakdown | R3: also flags zones with false evidence present | None |
| F-T4 | Entrapment Setup | 2 | 5 | R1: UNLOCKS ability FA-11. Decoy lasts 60s, fedHeat +20 | R2: 75s, heat +18 | R3: 90s, heat +16 | R4: 105s, heat +14, decoy mimics target NPC behavior more convincingly | R5: 120s, heat +12, can place 2 decoys per run | F-T1(R1), F-T2(R1) |
| F-T5 | Tactical Positioning | 2 | 5 | R1: lockdown zone exit seal duration +5s | R2: +9s | R3: +12s | R4: +14s | R5: +16s, lockdown also reveals all entities in zone on minimap | F-T1(R2) |
| F-T6 | Predictive Analysis | 2 | 3 | R1: HUD shows predicted zone for next kill based on evidence pattern (30% accuracy) | R2: 45% accuracy | R3: 55% accuracy, also predicts time window (30min game-time accuracy) | F-T3(R2) |
| F-T7 | Ambush Specialist | 3 | 3 | R1: when in same zone as killer for 5s+, get directional indicator (general direction) | R2: 4s, indicator is more precise (60-degree cone) | R3: 3s, 45-degree cone, +10% damage against killer in first attack | F-T4(R2), F-T5(R2) |
| F-T8 | Evidence Cordon | 3 | 5 | R1: UNLOCKS ability. Mark a 256px area; evidence in area cannot be destroyed by killer for 45s, 180s CD | R2: 60s duration, CD -20s | R3: 75s, CD -30s | R4: 90s, CD -35s, area also prevents NPC intimidation | R5: 105s, CD -40s, also prevents surveillance jamming in zone | F-T5(R3), F-T6(R1) |
| F-T9 | Clean Operation | 4 | 3 | R1: fedHeat Severe threshold raised from 81 to 90 | R2: to 95 | R3: to 100 (effectively removes Severe penalty if heat stays under 100) | F-T7(R2), F-T8(R2) |
| F-T10 | Ghost Agent | 5 | 1 | R1: UNLOCKS passive: counter-play abilities generate evidence that is technically "admissible" (not flagged inadmissible). Fed heat accumulation reduced to 60% of normal. Once-per-run: can retroactively make all inadmissible evidence from this run admissible (costs 30 fedHeat). | F-T9(R2) |

**Hard caps**: Lockdown duration extension max +16s. Entrapment max 2 decoys per run. Pursuit speed max +7%. Ambush directional indicator never reveals exact position. Ghost Agent's retroactive admissibility costs 30 heat, preventing abuse.

### Fed Active Abilities (12)

All abilities implement the `AbilityDef` schema and register in `abilityRegistry`. Default abilities are available at run start. Counter-play abilities (FA-8 through FA-12) are gated behind Interrogation and Tactics tree investment. Each ability has 1-5 ranks that improve effectiveness.

| # | Ability | Default? | Cooldown | Rank 1 | Rank 3 | Rank 5 | Hard Cap |
|---|---------|----------|----------|--------|--------|--------|----------|
| FA-1 | Enhanced Scan | Yes | 15s CD | 150% scan radius, reveals DISCOVERABLE | 175% radius, CD -3s | 200% radius, CD -5s, reveals HIDDEN with 15% chance | max 200% radius |
| FA-2 | Witness Compulsion | Yes | 30s CD | Nearby NPCs stop and can be interviewed for 8s | 10s, radius +20% | 13s, radius +35%, NPCs provide +5% reliability | max 13s duration |
| FA-3 | Forensic Analysis | Yes | 20s CD | Upgrade evidence quality 1 tier, 15% false detection | 20% false detection, CD -4s | 25% false detection, CD -6s, auto-links evidence to suspect | max 25% detection (base, skills add more) |
| FA-4 | Surveillance Access | Yes | 45s CD | View camera feeds in zone 30s | 40s, reveals entity movement paths | 50s, reveals entity movement paths, highlights suspicious behavior | max 50s duration |
| FA-5 | Area Lockdown | Yes | 120s CD | Seal zone exits 45s, alert NPCs | 50s, CD -15s | 55s, CD -25s, killer takes 5% more damage in locked zone | max 55s seal |
| FA-6 | Evidence Preservation | Yes | 60s CD | Prevent decay on 1 evidence piece for 120s | 2 pieces, 150s | 3 pieces, 180s, preserved evidence gains +1 quality tier | max 3 pieces |
| FA-7 | Profile Analysis | Yes | 45s CD | Highlight suspect NPC behavioral anomalies for 15s | 20s, also shows routine deviations | 25s, also reveals if NPC was recently intimidated or alibi'd | max 25s duration |
| FA-8 | Illegal Surveillance | Tree (F-I7) | 60s CD | Restore cameras 45s, heat +8 | 65s, heat +7 | 85s, heat +5, detects STEALTH entities | max 85s restore |
| FA-9 | Rough Interrogation | Tree (F-I4) | 45s CD | Force reliability 0.80, heat +15 | reliability 0.85, heat +13 | reliability 0.90, heat +10 | min heat 10 |
| FA-10 | Planted Informant | Tree (F-I5) | 90s CD | 1 informant, 150px radius, heat +10 | 190px, heat +8 | 220px, heat +6, survives 1 intimidation | max radius 220px |
| FA-11 | Entrapment Setup | Tree (F-T4) | 180s CD | Decoy 60s, heat +20 | 90s, heat +16 | 120s, heat +12, 2 per run | max 2 per run |
| FA-12 | Off-Books Forensics | Tree (F-I3) | 10s CD | Discovery time x0.5, heat +5 | x0.3, heat +4 | x0.1, heat +3 | min discovery time x0.1 |

Ability rank effects are expressed as `Effect[]` arrays in the data file (using `STAT_MOD`, `SCAN_RADIUS_MOD`, `HEAT_GENERATION_MOD`, etc.). Counter-play abilities use `ABILITY_UNLOCK` effects that fire when the prerequisite skill reaches the required rank.

### Fed Weapons

Defined in `packages/shared/src/data/weapons/fed-weapons.ts`. Registered via `weaponRegistry`.

| Category | ID | Name | Rarity | Damage | Special |
|----------|-----|------|--------|--------|---------|
| SIDEARM | service_pistol | Service Pistol | COMMON | 15 | Standard fed weapon |
| SIDEARM | upgraded_pistol | Upgraded Service Pistol | UNCOMMON | 18 | +10% accuracy |
| SIDEARM | tactical_pistol | Tactical Pistol | RARE | 20 | +15% accuracy, +10% fire rate |
| MELEE | baton | Telescopic Baton | COMMON | 12 | +20% stun duration, non-lethal option |
| MELEE | taser_fed | Stun Gun | UNCOMMON | 8 | Applies ELECTROCUTION status effect (3s stun + DOT), non-lethal |
| SHIELD | riot_shield | Riot Shield | RARE | 0 | Block damage reduction +20% (60% total), move speed -10% |

### Fed Tools

Defined in `packages/shared/src/data/items/fed-items.ts`. Registered via `itemRegistry`.

| ID | Name | Rarity | Effect |
|----|------|--------|--------|
| forensic_kit_basic | Standard Forensic Kit | COMMON | +0.10 quality on examine |
| forensic_kit_advanced | Advanced Forensic Kit | UNCOMMON | +0.25 quality, reveals hidden evidence |
| interview_badge | Interview Badge | COMMON | +15% reliability on interviews |
| tracking_device | Tracking Device | UNCOMMON | Plants tracker on NPC — reveals position on minimap |
| evidence_bags | Evidence Bags | COMMON | Preserves evidence from decay, stackable x5 |
| handcuffs | Handcuffs | COMMON | Required for arrest animation (always in default loadout) |
| wiretap_kit | Wiretap Kit | RARE | Counter-play tool — enables phone wiretap on zone |
| informant_badge | Informant Badge | RARE | Counter-play — increases planted informant reliability +0.15 |
| entrapment_kit | Entrapment Kit | RARE | Counter-play — decoy NPC lasts +60s |
| offbooks_lab | Off-Books Lab Kit | UNCOMMON | Counter-play — reduces forensics time 80% |
| digital_collector | Digital Evidence Collector | LEGENDARY | Processes all evidence in zone instantly, half inadmissible |

Counter-play tools are RARE or higher — they appear rarely in the session shop and are not in starting loadouts unless unlocked via equipment progression (piece 13). Counter-play tools and abilities are always thematically justified as operating outside normal procedure, which is why they generate fedHeat.

### Fed Boss Items (MYTHIC Tier)

Seven unique hand-crafted items obtainable through specific challenges. Defined in `packages/shared/src/data/boss-items/fed-boss-items.ts`. Registered via `itemRegistry` with `rarity: 'MYTHIC'`. Each requires attunement (5 ghost_tokens, one-time cost). All unique effects use the `CUSTOM` effect handler pattern, registered in `packages/game-engine/src/effects/boss-item-handlers.ts`.

#### FB-1: The Lie Detector
- **Slot**: TOOL | **Rarity**: MYTHIC
- **Unique Effect**: When interviewing a witness, can activate "deep reading" (costs +10 fedHeat). Reveals: (1) whether the witness has been intimidated, (2) whether their testimony is about real or planted evidence, (3) the exact suspicion score the witness has for each nearby NPC. Normal interviews only show reliability.
- **Custom Handler**: `lie_detector_deep_read` — unlocks extended interview data, applies heat cost, returns enriched NPC state.
- **Obtain**: Correctly identify the killer in 10 runs without any false arrests. (`{ type: 'CUMULATIVE_STAT', stat: 'correct_identifications', threshold: 10 }`)
- **Trade-off**: High heat cost per use. Takes tool slot. Encourages heat accumulation.
- **Synergy**: Strong with Interrogation tree (Heat Management offsets cost). Weak alone.

#### FB-2: Quantum Scanner
- **Slot**: TOOL | **Rarity**: MYTHIC
- **Unique Effect**: Scan ability gains a "quantum mode" alt-fire that pulses 360 degrees across the ENTIRE current zone, revealing all evidence, entities, and camera locations for 5s. 180s cooldown. Evidence revealed this way is tagged "QUANTUM_SCANNED" — quality reduced by 1 tier.
- **Custom Handler**: `quantum_scanner_pulse` — performs zone-wide entity/evidence reveal, tags discovered evidence with quality reduction.
- **Obtain**: Discover 500 total evidence pieces across all runs. (`{ type: 'CUMULATIVE_STAT', stat: 'evidence_discovered', threshold: 500 }`)
- **Trade-off**: 180s cooldown. Discovered evidence is lower quality. Takes tool slot.
- **Synergy**: Strong with Forensics tree (quality upgrade skills compensate). Good for Tactics tree.

#### FB-3: The Profiler's Notebook
- **Slot**: ACCESSORY | **Rarity**: MYTHIC
- **Unique Effect**: Passively tracks killer movement patterns. After discovering 3+ evidence pieces from the same killer, generates a "profile" showing a zone-level heat map on the minimap indicating where the killer has spent the most time (updated every 30s, with 60s delay from real-time). Not exact position — zone-level only.
- **Custom Handler**: `profiler_notebook_heatmap` — aggregates killer zone visit history (server-authoritative), renders delayed heat map on fed minimap.
- **Obtain**: Win 15 runs as Fed with STRONG or better arrest viability. (`{ type: 'WIN_COUNT', role: 'FED', count: 15, condition: 'STRONG_ARREST' }`)
- **Trade-off**: Takes accessory slot. 60s delay (historical, not real-time). Requires 3+ evidence discoveries to activate.
- **Synergy**: Strong with Forensics tree (find evidence faster to activate). General-purpose.

#### FB-4: Aegis Badge
- **Slot**: ARMOR | **Rarity**: MYTHIC
- **Unique Effect**: When the fed takes damage, 25% chance to generate MEDIUM quality evidence at the damage location (attacker's DNA/trace). If fed health drops below 25%, all nearby cameras (within 2 zones) automatically activate and record for 30s.
- **Custom Handler**: `aegis_badge_damage_evidence` — hooks into damage received events, probabilistically generates evidence, triggers camera activation on low-health threshold.
- **Obtain**: Win 5 runs where the fed was attacked by the killer but still won. (`{ type: 'CONSECUTIVE_WINS', role: 'FED', count: 5, condition: 'ATTACKED_AND_WON' }`)
- **Trade-off**: Requires taking damage to trigger. No base armor stats. Camera activation only useful if killer is near cameras.
- **Synergy**: Rewards risky play. Synergizes with Tactics tree (area control near cameras).

#### FB-5: Chain of Command
- **Slot**: ACCESSORY | **Rarity**: MYTHIC
- **Unique Effect**: Doubles the maximum number of planted informants (if FA-10 is unlocked). All informants share information — when one informant reports, ALL others become "alert" and have their watch radius doubled for 15s.
- **Custom Handler**: `chain_of_command_network` — modifies informant cap, creates inter-informant event relay, temporarily buffs all informants on any single trigger.
- **Obtain**: Use Planted Informant ability in 25 different runs. (`{ type: 'CUMULATIVE_STAT', stat: 'informant_placements_runs', threshold: 25 }`)
- **Trade-off**: Only useful if FA-10 is unlocked from skill tree. Takes accessory slot. More informants = more heat cost per run.
- **Synergy**: Requires Interrogation tree investment. Most build-dependent boss item.

#### FB-6: Forensic Resonance Lens
- **Slot**: WEAPON (replaces sidearm) | **Rarity**: MYTHIC
- **Unique Effect**: Replaces the fed's standard sidearm with a non-lethal "resonance" weapon. On hit: deals 5 damage + applies "Forensic Tag" status (60s). Tagged entities leave a faint glowing trail visible only to the fed. If the tagged entity is the killer, ALL evidence they generate while tagged is automatically discovered (no scan needed) and starts at +1 quality tier.
- **Custom Handler**: `forensic_resonance_tag` — applies unique tracking status, modifies evidence generation for tagged entities.
- **Obtain**: Achieve 3 AIRTIGHT arrests. (`{ type: 'CUMULATIVE_STAT', stat: 'airtight_arrests', threshold: 3 }`)
- **Trade-off**: Only 5 damage (much lower than any sidearm). Non-lethal only. Must successfully HIT the killer to apply the tag. 60s duration.
- **Synergy**: Strong with Forensics tree. Requires combat engagement which most fed builds avoid.

#### FB-7: The Archives
- **Slot**: TOOL | **Rarity**: MYTHIC
- **Unique Effect**: Once per run, the fed can "consult the archives" (15s channel, cannot move). Reveals: the kill method used for the most recent kill, approximate time since last kill (within 30s accuracy), and one random trait of the killer's loadout (e.g., "the suspect is using a bladed weapon" or "the suspect has counter-play abilities").
- **Custom Handler**: `archives_consult` — reads current match state server-side, reveals select killer loadout information with randomized partial disclosure.
- **Obtain**: Win 20 runs total as Fed. (`{ type: 'WIN_COUNT', role: 'FED', count: 20 }`)
- **Trade-off**: Once per run. 15s channel time (very vulnerable). Information is partial. Takes tool slot.
- **Synergy**: General-purpose. Most useful early in the run to guide investigation strategy.

### Crafting System — "The Armory"

The fed's crafting system is called "The Armory" — the fed requisitions equipment upgrades through their agency. Defined in `packages/shared/src/data/crafting/fed-recipes.ts`. Registered via `craftingRecipeRegistry`. Custom handlers in `packages/game-engine/src/effects/crafting-handlers.ts`.

**Upgrade Slots per Equipment Rarity**:
- COMMON: 1 slot | UNCOMMON: 1 slot | RARE: 2 slots | LEGENDARY: 2 slots | MYTHIC: 3 slots

**Salvage Parts** (new material type): Obtained by dismantling unused equipment.
- COMMON: 1 salvage | UNCOMMON: 2 | RARE: 4 | LEGENDARY: 8 | MYTHIC: cannot dismantle

**Removing Mods**: Mods can be removed (slot freed) but materials are NOT refunded. Costs 2 salvage_parts flat fee. This makes choices meaningful.

#### Tier 1: Standard Issue Upgrades (Available by default)

| # | Recipe Name | Category | Effects | Cost | Compatible With |
|---|------------|----------|---------|------|-----------------|
| FR-1 | Improved Sights | SIDEARM_MOD | `[{ type: 'STAT_MOD', stat: 'rangedDamage', value: 3, modType: 'FLAT' }]` | 8 evidence_dust + 2 salvage | WEAPON (SIDEARM) |
| FR-2 | Extended Mag | SIDEARM_MOD | `[{ type: 'STAT_MOD', stat: 'attackSpeed', value: 0.08, modType: 'PERCENT' }]` | 8 evidence_dust + 2 salvage | WEAPON (SIDEARM) |
| FR-3 | Tactical Vest Upgrade | ARMOR_MOD | `[{ type: 'STAT_MOD', stat: 'maxHealth', value: 12, modType: 'FLAT' }]` | 6 evidence_dust + 3 salvage | ARMOR |
| FR-4 | Enhanced Lens Assembly | FORENSIC_MOD | `[{ type: 'SCAN_RADIUS_MOD', percent: 0.05 }]` | 10 evidence_dust + 2 salvage | TOOL |

#### Tier 2: Specialist Upgrades (Skill-gated)

| # | Recipe Name | Category | Effects | Cost | Compatible With | Unlock Condition |
|---|------------|----------|---------|------|-----------------|------------------|
| FR-5 | Trace Amplifier | FORENSIC_MOD | `[{ type: 'STAT_MOD', stat: 'evidenceQualityMod', value: 0.10, modType: 'PERCENT' }]` | 15 ED + 4 salvage + 1 GT | TOOL | F-F4 rank 2 |
| FR-6 | Reinforced Cuffs | TACTICAL_MOD | `[{ type: 'ARREST_VIABILITY_MOD', flat: 3 }]` | 12 ED + 3 salvage + 1 GT | ACCESSORY | F-T4 rank 1 |
| FR-7 | Scramble-Proof Radio | TACTICAL_MOD | `[{ type: 'CUSTOM', handler: 'scramble_proof_radio', params: { jammingResistPercent: 0.50 } }]` | 14 ED + 3 salvage + 2 GT | ACCESSORY | F-I7 rank 2 |
| FR-8 | Low-Light Optics | FORENSIC_MOD | `[{ type: 'FALSE_EVIDENCE_DETECTION_MOD', percent: 0.05 }]` | 15 ED + 4 salvage + 2 GT | TOOL | F-F5 rank 3 |

#### Tier 3: Bureau-Level Requisitions (Achievement-gated)

| # | Recipe Name | Category | Effects | Cost | Compatible With | Unlock Condition |
|---|------------|----------|---------|------|-----------------|------------------|
| FR-9 | Forensic Neural Link | FORENSIC_MOD | `[{ type: 'CUSTOM', handler: 'neural_link_auto_tag', params: { autoTagRadius: 64, autoTagChance: 0.15 } }]` | 25 ED + 8 salvage + 5 GT | TOOL | Trophy: Master Detective |
| FR-10 | Adaptive Armor Weave | ARMOR_MOD | `[{ type: 'STAT_MOD', stat: 'maxHealth', value: 20, modType: 'FLAT' }, { type: 'CUSTOM', handler: 'adaptive_armor_damage_resist', params: { stackPerHit: 0.03, maxStacks: 5, duration: 10 } }]` | 30 ED + 10 salvage + 8 GT | ARMOR | F-T9 unlocked |

**Crafted bonuses count toward existing stat caps.** The `StatModifierSystem` enforces all caps universally — crafted effects flow through the same system as skill/trophy/equipment effects.

**Ghost token allocation decision**: Players must choose between spending ghost tokens on skill ranks (2-4 GT each at R3-R5), boss item attunement (5 GT), or Tier 2-3 crafting recipes (1-8 GT). This creates meaningful resource tension with no single dominant strategy.

### Investigation System

**`packages/game-engine/src/fed/investigation-system.ts`**

The investigation system drives the fed's core evidence-gathering loop. The fed moves through the map performing three types of investigation actions:

1. **Area Scan**: Active ability — pings a radius around the player, revealing `DISCOVERABLE` evidence as highlighted interactables. Costs ability cooldown. Uses `discovery-mechanics.ts scanArea()`.

2. **Crime Scene Analysis**: Triggered when fed enters a zone with multiple evidence pieces of the same linked entity. Auto-aggregates evidence into the case file. Provides bonus `+10` to arrest viability for coherent scenes (increased by F-F6 Crime Scene Specialist skill).

3. **Forensic Examination**: Interact with individual discovered evidence to increase quality rating (LOW → MEDIUM → HIGH). Uses `discovery-mechanics.ts analyzeEvidenceQuality()`. Higher quality evidence contributes more to arrest viability.

Evidence discovered via illegal means (counter-play abilities FA-8 `ILLEGAL_SURVEILLANCE`, FA-12 `OFFBOOKS_FORENSICS`) sets `Evidence.isInadmissible = true`. Inadmissible evidence still increases `SuspectProfile.suspicionScore` but does NOT increase `CaseFile.arrestViability`. This creates a meaningful risk/reward: counter-play gives investigative speed at the cost of arrest purity.

### Witness System

**`packages/game-engine/src/fed/witness-system.ts`**

NPCs that have `NPC.hasWitnessedEvent = true` and `NPC.isSilenced = false` can be interviewed. The fed player walks up to a witness NPC and triggers the interview interaction.

**Interview outcome** (`InterrogationResult`):
- `infoType` is randomly drawn from what the NPC actually saw (`witnessedEventType`)
- `reliability` ranges 0.4–1.0 based on NPC role (shopkeeper = 0.9, drunk NPC = 0.4)
- Unreliable witnesses may generate `FABRICATED` info pointing at innocent NPCs (false leads)

**Rough interrogation** (counter-play, FA-9 `ROUGH_INTERROGATION`):
- Unlocked at Interrogation skill tree F-I4 tier 2
- Rank determines forced reliability (R1: 0.80, R3: 0.85, R5: 0.90) and heat cost (R1: +15, R5: +10)
- Generates `fedHeatLevel` increase per use
- Can extract from silenced witnesses at F-I4 R3+ (double heat cost at lower ranks, decreasing at higher ranks)
- If `fedHeatLevel > 80`: subsequent arrests are contested even with `STRONG` or `AIRTIGHT` evidence

**Planted informants** (counter-play, FA-10 `PLANTED_INFORMANT`):
- Unlocked at Interrogation skill tree F-I5 tier 2
- Converts a specific NPC into an active watcher — will automatically report the next suspicious player action within its watch radius to the fed player via EventBus `informant-report` event
- Max informants scales with F-I5 rank (1→3) and is capped at 4 with all sources combined
- The NPC continues their routine; notification arrives via EventBus
- Costs fedHeat per placement (scaling down with skill rank)
- If killer uses `witness-intimidation` on the informant NPC before it reports: informant is silenced (counter-countered). F-I9 Deep Cover Operations provides immunity when killer suspicion is below threshold.

**Silenced witnesses**: When the killer uses `witness-intimidation` on an NPC before the fed can interview them, `NPC.isSilenced = true`. The fed interaction prompt changes to "Witness unavailable — appears frightened." Fed can attempt FA-9 `ROUGH_INTERROGATION` on silenced witnesses at double the heat cost to extract partial information (F-I4 R3+ reduces this penalty).

### Suspect Tracker

**`packages/game-engine/src/fed/suspect-tracker.ts`**

At run start, all NPCs + the hidden killer player are loaded as suspect profiles. The fed's task is to narrow this pool by linking evidence to suspects and eliminating innocents.

**Narrowing mechanics**:
- Evidence with `linkedEntityId` links to a specific NPC/player — adds to their `suspicionScore`
- FOOTPRINT/DNA evidence near an NPC's routine path eliminates that NPC from suspicion
- A `SuspectProfile.suspicionScore > 70` flags them as "primary suspect" in HUD
- `CaseFileTracker.eliminateSuspect()` marks a profile as `isEliminated = true`, removing from active board

**Killer's fake evidence counter-play** (`EvidenceType.FAKE_EVIDENCE`):
- Fake evidence planted by the killer will have `linkedEntityId` pointing to an innocent NPC
- Fake evidence passes normal discovery and adds to the innocent NPC's `suspicionScore`
- Fed can detect fake evidence by: (a) examining quality at HIGH tier with forensic analysis — transitions state to `DISCREDITED`, or (b) cross-referencing with timeline (fake evidence timestamps don't match NPC routines)
- The `SuspectBoard.tsx` UI should visually flag evidence pieces where timeline doesn't fit the linked suspect's recorded routine
- F-F5 Pattern Recognition provides passive auto-flagging (5-17% chance per rank)
- F-F7 Forensic Intuition adds active detection bonus during forensic analysis

### Arrest System

**`packages/game-engine/src/fed/arrest-system.ts`**

Arrest is gated by `CaseFile.arrestViability` (0-100), mapped to `ArrestViabilityTier` / `ArrestCondition`:

| Score | `ArrestCondition` | Outcome |
|-------|-------------------|---------|
| 0-19  | `INSUFFICIENT` | Arrest button disabled — "More evidence needed" |
| 20-39 | `WEAK` | Attempt triggers full combat — killer fights back at full strength |
| 40-59 | `MODERATE` | Brief combat — killer at 50% health, escapes on win |
| 60-79 | `STRONG` | Clean arrest — no combat, cinematic takedown |
| 80-100 | `AIRTIGHT` | Perfect arrest — bonus score, cinematic takedown, no resistance |

**Arrest attempt flow**:
1. Fed selects "Arrest" from interaction with a suspect
2. System checks `ArrestCondition` against current `arrestViability` score from `CaseFile`
3. If `AIRTIGHT`: play perfect arrest animation, run ends with fed win + bonus score
4. If `STRONG`: play arrest animation, run ends with fed win
5. If `MODERATE`/`WEAK`: combat scene initiates — killer is the boss
6. If fed wins combat with `WEAK` evidence: partial win (lower score, no "clean arrest" trophy)
7. If fed wins combat with `MODERATE` evidence: arrest succeeds with normal scoring

**Inadmissible evidence penalty**: If `>30%` of case file evidence is `isInadmissible = true`, the viability score cap is reduced to 59 (cannot achieve `STRONG` or `AIRTIGHT` — only `MODERATE` at best). This prevents counter-play-only strategies from trivializing arrest. The F-T10 Ghost Agent capstone skill can retroactively make inadmissible evidence admissible (costs 30 fedHeat, once per run).

### Vigilante System

**`packages/game-engine/src/fed/vigilante-system.ts`**

The fed can skip the investigation and fight the killer directly if they can find them. Uses `combat-controller.ts initiateCombat()`. No evidence requirement for combat initiation.

Trade-offs:
- Win = fed wins run (killer eliminated)
- Score multiplier: 0.5× (vs 1.0× for clean arrest, 0.75× for combat arrest)
- No "arrest" trophies unlock — only "vigilante" trophies
- Materials earned: 60% of normal
- Encourages investigation-first gameplay for maximum rewards

### Counter-Play Abilities (Fed)

These abilities actively undermine the killer's ability to operate. They are gated behind Interrogation and Tactics skill tree progression. Each has explicit risk/reward trade-offs expressed as `Effect[]` arrays in the data files.

**`FA-8 ILLEGAL_SURVEILLANCE`** (Unlocked via F-I7 Interrogation tier 3):
- Off-the-books access to surveillance cameras the killer may have jammed
- Bypasses `surveillance-jamming` counter-play from killer side
- Effect: Restores camera coverage in one zone for 45-85s (scales with F-I7 rank)
- `fedHeatLevel += 8` (decreasing to +5 at rank 5)
- Evidence gathered from illegal cameras is `isInadmissible = true`
- At rank 5: restored cameras also detect entities with STEALTH status

**`FA-9 ROUGH_INTERROGATION`** (Unlocked via F-I4 Interrogation tier 2):
- Coerce an NPC into providing high-quality intel regardless of reliability
- Effect: Forces `InterrogationResult.reliability` to 0.80-0.90 (scales with F-I4 rank), guarantees non-FABRICATED infoType
- Can extract information from silenced witnesses at F-I4 R3+ (at additional heat cost)
- `fedHeatLevel += 10-15` (decreasing with rank)
- If `fedHeatLevel > 80`: NPC files complaint, max `arrestViability` capped at 59 for this run

**`FA-10 PLANTED_INFORMANT`** (Unlocked via F-I5 Interrogation tier 2):
- Turn a civilian NPC into a one-time automatic reporter
- Effect: NPC reports next suspicious action within 150-220px radius (scales with F-I5 rank) via EventBus
- `fedHeatLevel += 6-10` (decreasing with rank)
- At F-I5 R5: informant survives 1 killer intimidation attempt before being silenced
- F-I9 Deep Cover Operations adds immunity threshold when killer suspicion is below configured value

**`FA-11 ENTRAPMENT_SETUP`** (Unlocked via F-T4 Tactics tier 2):
- Stage a tempting scenario (fake target walking alone, unguarded disposal site) to draw killer out
- Effect: Spawns a decoy NPC marked as high-priority target in killer HUD for 60-120s (scales with F-T4 rank)
- If killer approaches decoy: triggers proximity alert to fed player via EventBus `entrapment-triggered`
- Killer can detect entrapment by observing decoy NPC lacks the usual target indicators (higher ranks mimic behavior better)
- `fedHeatLevel += 12-20` — entrapment carries legal risk (decreasing with rank)
- At F-T4 R5: 2 decoys per run

**`FA-12 OFF-BOOKS FORENSICS`** (Unlocked via F-I3 Interrogation tier 1):
- Faster forensic processing — skips standard chain-of-custody
- Effect: Forensic examination time reduced to 10-50% of normal (scales with F-I3 rank), evidence quality boost immediate
- Evidence processed this way marked `isInadmissible = true`
- Gives early investigative speed at cost of clean arrest potential
- `fedHeatLevel += 3-5` per use (decreasing with rank)

**Fed Heat System**:
- `fedHeatLevel` is a per-run accumulator (0-100)
- Displayed as an IA Scrutiny meter in `FedHUD.tsx`
- Thresholds:
  - 0-40: No effect
  - 41-60: Minor — some NPCs become uncooperative (+20% interview failure chance)
  - 61-80: Moderate — `arrestViability` cap reduced to 79 (cannot achieve AIRTIGHT)
  - 81-100: Severe — cap reduced to 59 (cannot achieve STRONG or AIRTIGHT), arrest attempts always trigger brief combat even with strong evidence
- The F-T9 Clean Operation skill raises the Severe threshold (81 → 90/95/100 at R1/R2/R3)
- Heat does NOT persist between runs (session-scoped only)

### Build Archetypes

These archetypes emerge from investing in different primary trees. Players can realistically max one tree (~48 runs for a good player) and partially invest in a second.

| Build | Primary Tree | Secondary Investment | Trophy | Playstyle |
|-------|-------------|---------------------|--------|-----------|
| Forensic Expert | Forensics (maxed) | Interrogation (T1-2) | Master Detective | Methodical evidence gathering, high-quality case, clean arrests. Counters Manipulator killer. Weak against Berserker who kills before case builds. |
| Intelligence Agent | Interrogation (maxed) | Tactics (T1-2) | Deep Mole | Witness network, informants, aggressive intel gathering. Counters Manipulator through informant network. |
| Tactical Commander | Tactics (maxed) | Forensics (T1-2) | The Sting | Area control, entrapment, ambush-oriented. Hard counters Shadow Assassin. Weak against Manipulator who avoids traps. |
| Clean Agent | Forensics (T1-3) + Interrogation (T1-2) | Tactics (T1) | Perfect Record | Avoids counter-play heat entirely, relies on pure investigation. Cannot achieve AIRTIGHT arrest if counter-play abilities are used carelessly. |

### HUD Components

**`apps/web/src/components/app/game/hud/FedHUD.tsx`**

React component, "use client", reads from `stores/fed.ts` and `stores/evidence.ts` via Zustand selectors.

Layout regions:
- Top-left: HealthBar (from common HUD, piece 07)
- Top-center: Case Strength Meter (0-100 bar, color-coded: red/yellow/green by threshold)
- Top-right: IA Scrutiny Meter (0-100 fedHeatLevel, glows red above 60)
- Left: ObjectiveTracker (from common HUD, piece 07) — current investigation steps
- Bottom-left: InventoryPanel (from common HUD, piece 07)
- Bottom-center: Active ability cooldown display (7 ability slots — FA-1 through FA-7 defaults + any unlocked counter-play)
- Bottom-right: Investigation Tools quick-access tray
- Minimap (from common HUD, piece 07) — overlaid with evidence markers (blue dots)

**`apps/web/src/components/app/game/hud/SuspectBoard.tsx`**

The suspect board is a togglable overlay (default: hidden, press Tab to open). It visually mimics a detective's cork board with:
- NPC profile photos (sprite thumbnails) connected by string/lines to evidence cards
- Suspects sorted by `suspicionScore` descending
- Eliminated suspects greyed out
- Active primary suspect highlighted with pulsing border
- Evidence cards show: type icon, quality badge, timestamp, linked-suspect name
- Timeline view: horizontal axis showing time, evidence events plotted — mismatched timestamps on fake evidence are visually distinct (red flag icon)
- "Arrest" button anchored bottom-right, disabled/enabled by `ArrestCondition`

### Zustand Store

**`apps/web/src/stores/fed.ts`**

```typescript
interface FedStore {
  // State
  suspects: SuspectProfile[];
  interrogationResults: InterrogationResult[];
  activeAbilityCooldowns: Record<string, number>; // abilityId → ms remaining
  fedHeatLevel: number;
  arrestCondition: ArrestCondition;  // alias for ArrestViabilityTier in fed context
  activeCounterPlayEffects: CounterPlayEffect[];
  plantedInformants: ID[];   // NPC IDs currently acting as informants
  arrestAttempts: number;

  // Actions (called via EventBus from Phaser, or directly from React HUD)
  addSuspect: (profile: SuspectProfile) => void;
  updateSuspect: (entityId: ID, update: Partial<SuspectProfile>) => void;
  eliminateSuspect: (entityId: ID) => void;
  addInterrogationResult: (result: InterrogationResult) => void;
  setAbilityCooldown: (abilityId: string, ms: number) => void;
  incrementHeat: (amount: number) => void;
  setArrestCondition: (condition: ArrestCondition) => void;
  activateCounterPlay: (effect: CounterPlayEffect) => void;
  addPlantedInformant: (npcId: ID) => void;
  removePlantedInformant: (npcId: ID) => void;
  reset: () => void;
}
```

### EventBus Events

Events emitted by this piece (consumed by React stores and piece 12+):
- `fed:evidence-discovered` — `{ evidenceId, type, quality }`
- `fed:witness-interviewed` — `{ npcId, result: InterrogationResult }`
- `fed:suspect-identified` — `{ entityId, suspicionScore }`
- `fed:arrest-attempted` — `{ targetId, condition: ArrestCondition }`
- `fed:arrest-succeeded` — `{ targetId, viabilityScore }`
- `fed:arrest-failed` — `{ targetId, reason: string }`
- `fed:counter-play-activated` — `{ ability: CounterPlayAbility, heatGenerated: number }`
- `fed:informant-report` — `{ npcId, reportedEntityId, eventType: string }`
- `fed:entrapment-triggered` — `{ decoyNpcId, suspectId }`
- `fed:heat-threshold-crossed` — `{ level: number, newCap: number }`

### Win/Lose Condition Implementation

In `fed-role.ts`:

```typescript
checkWinCondition(state: RunState): boolean {
  // Win if: arrest succeeded OR vigilante kill succeeded
  return fedStore.getState().arrestSucceeded || fedStore.getState().vigilanteWin;
}

checkLoseCondition(state: RunState): boolean {
  // Lose if: player health zero OR all targets eliminated and disposed (killer wins)
  const playerDead = playerStore.getState().health <= 0;
  const killerWon = runState.killerObjectivesComplete === true;
  return playerDead || killerWon;
}
```

### Edge Cases

- **All witnesses silenced**: If killer intimidates all NPCs with `hasWitnessedEvent = true`, the fed must rely solely on physical evidence (footprints, DNA, cameras). This is a valid killer strategy — fed must counter with FA-8 `ILLEGAL_SURVEILLANCE` or FA-12 `OFFBOOKS_FORENSICS` to maintain investigative pressure.
- **Fake evidence saturation**: If >50% of case file evidence links to innocent NPCs, `SuspectBoard.tsx` highlights a "Investigation Compromised" warning. Fed should use forensic analysis to separate real from fake.
- **Heat maxed before arrest**: If `fedHeatLevel = 100`, the fed must proceed with combat-based arrest or vigilante path — clean arrest is locked. This is a risk of over-relying on counter-play tools early.
- **No witnesses + no cameras + no DNA**: Every killer action generates at minimum FOOTPRINT evidence unless silent movement ability + quiet shoes are both active. Footprints cannot be fully eliminated. The fed always has a starting evidence trail.
- **Arrested wrong NPC**: If fed arrests an innocent NPC (wrong suspect), the arrest animation plays but resolves to "Wrong suspect — case dismissed." Run continues but arrest viability resets to 0 and `fedHeatLevel += 25`. Only one false arrest attempt allowed per run.
- **Multiplayer sync**: In multiplayer (piece 14), the actual killer player's position data is withheld from the fed player's client — only the evidence trail reveals their presence. Anti-cheat validation server-side ensures the fed cannot query the opponent's position directly. The Profiler's Notebook boss item reads from a server-authoritative, time-delayed record of zone visits — never from real-time position state.
- **Boss item custom handlers**: If a handler name in a CUSTOM effect does not have a registered handler at runtime, the EffectProcessor logs a warning and skips the effect (forward compatibility). All boss item handlers must be registered in `boss-item-handlers.ts` and loaded at game initialization.

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

Fed gameplay is built as a role implementation on top of established frameworks. All investigation-specific systems live in `packages/game-engine/src/fed/`. The React HUD lives in `apps/web/src/components/app/game/hud/`. State bridging uses Zustand stores updated via EventBus signals from Phaser.

Skill trees, abilities, weapons, boss items, and crafting recipes are all data-driven via the ContentRegistry pattern. The engine processes effects generically — no switch statements on content IDs. Adding new fed content (a new weapon, ability, crafting recipe) requires adding a data file entry and redeploying.

The suspect board is the fed's most complex React component — invest in making it feel like a real detective tool.

### Key Implementation Decisions

- Suspect tracker starts with ALL NPCs as potential suspects — never reveal which is the "real" killer until evidence accumulates
- Witness reliability system is critical for tension — some witnesses lie or misremember
- Counter-play abilities must degrade cleanly (inadmissible evidence tracked per Evidence object)
- Fed heat is a per-run accumulator that NEVER persists to next run (session-scoped only)
- Entrapment and planted informant systems interact with killer's counter-play — design these as reactive loops
- Boss item custom handlers must be registered at game initialization (`game-init.ts`) or effects silently skip (no crash)
- Crafting mods flow through the existing `ProgressionEffectsEngine` alongside skill/trophy effects — no special handling
- The Armory UI shares component structure with the killer's Workshop, differing only in role-specific theming and recipe filtering

### File Structure

```
packages/game-engine/src/
  player/roles/fed-role.ts
  fed/
    investigation-system.ts
    witness-system.ts
    suspect-tracker.ts
    arrest-system.ts
    vigilante-system.ts
    fed-abilities.ts
    fed-items.ts
  effects/
    boss-item-handlers.ts      # CUSTOM handlers for FB-1 through FB-7
    crafting-handlers.ts       # CUSTOM handlers for FR-7, FR-9, FR-10
packages/shared/src/
  types/fed.ts
  constants/fed.ts
  data/
    skills/
      fed-forensics.ts         # F-F1 through F-F10 with Effects arrays
      fed-interrogation.ts     # F-I1 through F-I10 with Effects arrays
      fed-tactics.ts           # F-T1 through F-T10 with Effects arrays
    abilities/
      fed-abilities.ts         # FA-1 through FA-12 with rank Effects
    weapons/
      fed-weapons.ts           # 6 fed weapon definitions
    boss-items/
      fed-boss-items.ts        # FB-1 through FB-7 MYTHIC items
    crafting/
      fed-recipes.ts           # FR-1 through FR-10 crafting recipes
apps/web/src/
  components/app/game/hud/FedHUD.tsx
  components/app/game/hud/SuspectBoard.tsx
  components/app/crafting/
    CraftingStation.tsx        # Shared with killer's Workshop, different theme
    RecipeList.tsx
    RecipeCard.tsx
    ModSlotViewer.tsx
    DismantleConfirm.tsx
  app/progression/armory/page.tsx   # Fed crafting page (Server Component)
  app/actions/crafting/
    apply-mod.ts               # Server Action: apply recipe to equipment
    remove-mod.ts              # Server Action: remove mod from slot
    dismantle-equipment.ts     # Server Action: dismantle for salvage parts
  dal/crafting/
    recipes.ts                 # Recipe data access
    mods.ts                    # User mod data access
  stores/fed.ts
  stores/crafting.ts
```

### Data File Locations for Fed Content

All fed content definitions live under `packages/shared/src/data/`:
- `skills/fed-forensics.ts` — F-F1 through F-F10 with full rank Effects arrays
- `skills/fed-interrogation.ts` — F-I1 through F-I10 (counter-play skill unlocks via `ABILITY_UNLOCK` effects)
- `skills/fed-tactics.ts` — F-T1 through F-T10 with 1.3x cost multiplier applied
- `abilities/fed-abilities.ts` — FA-1 through FA-12, marking counter-play abilities with `isDefault: false` and `unlockSource: 'SKILL_TREE'`
- `weapons/fed-weapons.ts` — 6 fed weapons
- `boss-items/fed-boss-items.ts` — FB-1 through FB-7 with `rarity: 'MYTHIC'` and `CUSTOM` effects
- `crafting/fed-recipes.ts` — FR-1 through FR-10 with tier and unlock conditions

### Boss Item Custom Handler Registration

Boss item handlers are defined in `packages/game-engine/src/effects/boss-item-handlers.ts` and registered in `packages/game-engine/src/game-init.ts`:

```typescript
import { BOSS_ITEM_HANDLERS } from './effects/boss-item-handlers';
for (const [name, handler] of Object.entries(BOSS_ITEM_HANDLERS)) {
  effectProcessor.registerCustomHandler(name, handler);
}
```

Required custom handlers for fed boss items:
- `lie_detector_deep_read` — FB-1
- `quantum_scanner_pulse` — FB-2
- `profiler_notebook_heatmap` — FB-3 (reads server-authoritative, delayed zone visit history)
- `aegis_badge_damage_evidence` — FB-4
- `chain_of_command_network` — FB-5
- `forensic_resonance_tag` — FB-6
- `archives_consult` — FB-7 (reads match state server-side via a validated server action call)

### Crafting System Integration

1. The fed navigates to `apps/web/src/app/progression/armory/page.tsx` between runs
2. Selects equipment from their collection
3. Sees available upgrade slots (based on equipment rarity)
4. Browses compatible recipes filtered by equipment slot and category
5. `apply-mod.ts` Server Action validates: user owns equipment, slot is empty, recipe compatible with equipment, user meets unlock condition (skill rank via `user_skills` query, or trophy via `user_trophies`), user has sufficient materials (primary + salvage + ghost tokens)
6. Atomically: deduct materials, insert `user_equipment_mods` row
7. On next run, `ProgressionEffectsEngine.applyProgression()` reads mods via `getUserEquipmentMods()` and adds mod Effects to the bundle — all subject to stat caps

**Crafting recipe data structure**:
```typescript
// Example from fed-recipes.ts
{
  id: 'FR-5',
  role: 'FED',
  name: 'Trace Amplifier',
  description: 'Enhanced lens assembly that improves trace evidence quality analysis',
  category: 'FORENSIC_MOD',
  effects: [{ type: 'STAT_MOD', stat: 'evidenceQualityMod', value: 0.10, modType: 'PERCENT' }],
  cost: [{ material: 'evidence_dust', amount: 15 }, { material: 'salvage_parts', amount: 4 }, { material: 'ghost_tokens', amount: 1 }],
  unlockCondition: { type: 'SKILL_RANK', skillId: 'F-F4', minRank: 2 },
  compatibleSlots: ['TOOL'],
  compatibleCategories: [],  // empty = all tools
  tier: 2,
  iconKey: 'recipe_trace_amplifier',
}
```

### fedHeat Integration with Counter-Play Abilities

Counter-play abilities generate fedHeat via `HEAT_GENERATION_MOD` effects and explicit heat costs in their data definitions. The F-I8 Heat Management skill applies a `HEAT_COST_MOD` effect that reduces all counter-play heat costs (capped at -40% total). F-T9 Clean Operation raises the Severe heat threshold via a `HEAT_CAP_MOD` effect.

The `fedHeatLevel` in `stores/fed.ts` drives the IA Scrutiny meter in `FedHUD.tsx` and is read by `arrest-system.ts` to apply viability caps. Heat never persists between runs — `FedStore.reset()` is called by `run-manager.ts` on run end.

### Testing Strategy

- Unit test `arrest-system.ts`: verify all five `ArrestCondition` thresholds trigger correct outcomes (INSUFFICIENT/WEAK/MODERATE/STRONG/AIRTIGHT)
- Unit test `witness-system.ts`: verify reliability scoring, silenced witness handling, rough interrogation heat accumulation at each rank
- Unit test `suspect-tracker.ts`: verify fake evidence detection via timeline analysis
- Unit test counter-play heat thresholds: verify `fedHeatLevel` caps arrest viability correctly at each threshold (40/60/80)
- Unit test Forensics skill tree: verify scan radius hard cap (+26% max), pattern recognition probability scaling
- Unit test Interrogation skill tree: verify heat cost reduction cap (40% total), informant max cap (4 total)
- Unit test Tactics skill tree: verify entrapment max 2 decoys per run, lockdown extension hard cap (+16s)
- Unit test boss item custom handlers: unit test each handler against mock context objects (lie_detector_deep_read, quantum_scanner_pulse, etc.)
- Unit test crafting: verify Server Action validates unlock conditions (skill rank + trophy requirements), material deduction, slot availability
- Component test `SuspectBoard.tsx`: render suspect profiles, verify "Arrest" button disabled below 20 viability (INSUFFICIENT tier)
- Integration: full fed run — gather evidence → identify suspect → arrest with STRONG condition

### Constitution Compliance Checklist

- [x] I: No barrel files — all imports are direct file paths
- [x] VI: Domain-based organization — fed/ directory, fed.ts store, data files by content type
- [x] VII: Phaser/React boundary — Phaser systems emit via EventBus, React reads Zustand
- [x] XI: Zod validation — all content definitions validated at registry boot, `packages/shared/src/schemas/fed.ts` for server payloads
- [x] XIII: Server Actions for mutations — arrest validation in piece 12, crafting mutations via apply-mod.ts/remove-mod.ts/dismantle-equipment.ts
- [x] XVI: Zero-trust — killer position NEVER in fed client state, boss item `archives_consult` reads via server action only
- [x] XIX: Input validation at every boundary — InterrogationResult validated before store update, crafting actions validated server-side
- [x] XXVIII: WCAG AA — SuspectBoard keyboard-navigable (Tab through suspects, Enter to select), Armory recipe browser keyboard accessible

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

When this piece is fully implemented:
- `fed-role.ts` registers with `role-registry.ts` (piece 07)
- `FedHUD.tsx` renders over game canvas when role = FED
- `SuspectBoard.tsx` toggles on Tab keypress
- Investigation and arrest flow is fully playable in single-player with AI killer
- Armory (crafting) page accessible at `/progression/armory` with all 10 fed recipes
- All 7 fed boss items defined in registry; obtain conditions checked by `unlock-resolver.ts` post-run

### Dependencies (Consumed from Earlier Pieces)

Critical systems from earlier pieces that this piece extends:
- Evidence system (piece 09) — fed's primary data source
- Combat system (piece 08) — arrest resistance and vigilante path, status effects
- NPC system (piece 06) — witness interviews
- Player/role framework (piece 07) — role interface contract
- Design system (piece 03) — UI components
- ContentRegistry pattern (piece 13 architecture) — all skill/ability/item/crafting definitions

### Counter-Play Integration with Killer (Piece 10)

This piece and killer-gameplay (piece 10) form a counter-play loop:
- Killer plants fake evidence → Fed detects via timeline forensics (F-F5, F-F7, FA-3)
- Killer intimidates witness → Fed uses rough interrogation FA-9 (at heat cost)
- Killer jams surveillance → Fed uses illegal surveillance FA-8 (camera restore)
- Fed plants informant → Killer intimidates that specific NPC (F-I9/F-I5 R5 provide resistance)
- Fed sets entrapment → Killer observes decoy lacks normal target markers and avoids (higher F-T4 ranks better mimic)

Each counter-play layer reduces effectiveness but never fully negates the original action. Skill investment improves odds but never to 100%.

### Success Criteria

- [ ] Fed role registers with role framework — role selection page shows FED option
- [ ] Investigation loop playable: scan → discover evidence → analyze → case file updates
- [ ] Witness interview resolves correctly (reliability, silenced handling, rough interrogation heat)
- [ ] Suspect board renders all NPCs, narrows correctly as evidence accumulates
- [ ] All four arrest conditions trigger correct outcomes
- [ ] Counter-play abilities available, gated correctly (base abilities default, counter-play locked behind skill tree)
- [ ] FedHUD shows all required elements with correct data binding
- [ ] Fed heat accumulates from counter-play use and affects arrest cap at correct thresholds
- [ ] Fake evidence detectable via timeline analysis in SuspectBoard
- [ ] All 3 skill trees visible in progression UI with correct tier gating and prerequisites
- [ ] Adjusted skill costs (R3: 7+1GT, R4: 12+2GT, R5: 18+4GT) applied to all fed skills
- [ ] Armory crafting page shows 10 fed recipes with correct tier/unlock gating
- [ ] Boss item attunement (5 ghost_tokens) required before equipping MYTHIC items
- [ ] Boss item custom handlers registered at game initialization and tested

### Alignment Notes

This piece runs in parallel with killer-gameplay (piece 10). Both pieces modify the same evidence store (piece 09) and both implement the same role interface (piece 07). The interaction between killer counter-play and fed counter-play is the core strategic layer — ensure the event types emitted by both pieces are compatible for piece 14 (multiplayer sync).

The data files (`fed-forensics.ts`, `fed-interrogation.ts`, `fed-tactics.ts`, `fed-abilities.ts`, `fed-weapons.ts`, `fed-boss-items.ts`, `fed-recipes.ts`) must all be imported in `packages/shared/src/data/_register-all.ts` so the ContentRegistry is populated at boot. A boot integration test should verify all registered content passes Zod validation.
