---
vision: killer-vs-fed-roguelite
sequence: "11a"
name: fed-core-mechanics
group: Gameplay
group_order: 4
status: pending
depends_on:
  - "01: Result utilities, Pino logger, shared types scaffold"
  - "03: Design system components (AppButton, AppCard, AppDialog, AppToast) for FedHUD React component"
  - "04: EventBus (emit/subscribe typed events), Phaser game config, scene keys, Zustand game and player stores"
  - "05: World/map data, biome types, zone manager — investigation area scanning, zone-based evidence clustering"
  - "06: NPC witness system (WitnessStatement, canBeInterviewed), NPCSpawner, entity types — witness interviews depend on NPC state"
  - "07: PlayerController, RoleInterface, RoleRegistry, RunManager, inventory types, run types — fed role registers with role registry"
  - "08a: ContentRegistry<T> with abilityRegistry, itemRegistry instances; Effect union type; StatId; EffectProcessor; StatModifierSystem; STAT_CAPS"
  - "08b: CombatController, HealthSystem, AbilitySystem, StatusEffectSystem — fed can engage killer in direct combat"
  - "09: EvidenceManager (discoverEvidence, upgradeQuality, getEvidenceInRadius), CaseFileTracker (arrestViabilityScore, addEvidence), evidence types and constants"
produces:
  - "FedRole class at packages/game-engine/src/roles/fed/fed-role-handler.ts — implements RoleInterface, composes investigation sub-systems"
  - "InvestigationSystem at packages/game-engine/src/roles/fed/investigation-system.ts — area scan, crime scene analysis, forensic examination"
  - "WitnessSystem at packages/game-engine/src/roles/fed/witness-system.ts — witness interviews, rough interrogation, planted informants"
  - "SuspectTracker at packages/game-engine/src/roles/fed/suspect-tracker.ts — suspect profiles, suspicion scores, elimination"
  - "ArrestSystem at packages/game-engine/src/roles/fed/arrest-system.ts — arrest viability tiers, arrest flow, inadmissible evidence penalty"
  - "VigilanteSystem at packages/game-engine/src/roles/fed/vigilante-system.ts — direct combat path as alternative to arrest"
  - "FedHUD component at apps/web/src/components/app/game/fed-hud/ — case strength meter, IA scrutiny meter, suspect board overlay"
  - "Fed Zustand store at apps/web/src/stores/fed.ts — suspects, interrogation results, fed heat, arrest condition"
  - "Fed shared types at packages/shared/src/types/fed.ts — FedObjective, ArrestCondition, SuspectProfile, InterrogationResult, FedRunState"
  - "Fed constants at packages/shared/src/constants/fed.ts — evidence thresholds, arrest viability tiers, fed heat thresholds, interrogation rates"
  - "Fed EventBus event constants at packages/shared/src/constants/events/fed.ts — FED_ARREST_ATTEMPTED, SUSPECT_IDENTIFIED, etc."
  - "Core fed abilities (FA-1 through FA-7) — 7 default investigation abilities defined as code-backed systems"
created: 2026-03-18
last_aligned: never
---

# Vision Piece 11a: Fed Core Mechanics

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: project-scaffold, design-system, game-engine-bootstrap, world-and-maps, entity-and-npc-system, player-and-roles, content-architecture, combat-system, evidence-system

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Implement the fed role's core gameplay systems: investigation through area scanning and evidence collection, witness interviews, suspect tracking, arrest mechanics, and the optional vigilante path. This piece does not include content data (skills, weapons, boss items, crafting recipes) — those are in the next piece. This piece implements the engine systems that power the fed's investigation loop.

The fed must gather sufficient evidence to identify and arrest the killer before the killer completes their objectives. The fed wins by achieving a successful arrest (or vigilante kill). The fed loses if their health reaches zero or the killer completes all their objectives.

### Dependency Context (Inline)

**Project scaffold** provides the shared Result type and the Pino logger.

**Design system** provides the shared component library (buttons, cards, dialogs, toasts) used by the fed HUD and suspect board overlay.

**Game engine bootstrap** provides the EventBus, game constants, and the Zustand game store.

**World and maps** provides the zone manager for investigation area scanning. Evidence clusters within zones. The fed uses zone-level analysis to aggregate related evidence.

**Entity and NPC system** provides the NPC class with witness state (WitnessStatement, canBeInterviewed, isInformant), the NPC spawner, and the perception system. Witness interviews draw from the NPC's witness event log. The killer's Witness Intimidation ability can silence NPCs, making them unavailable for normal interview.

**Player and roles** provides the role interface, the role registry, the player controller, inventory, run manager, and all shared player/run types.

**Content architecture** provides the ContentRegistry with abilityRegistry and itemRegistry instances, the Effect union type, the StatId type, the EffectProcessor, and the StatModifierSystem with STAT_CAPS. Fed abilities are data-driven.

**Combat system** provides the CombatController, HealthSystem, and AbilitySystem for direct combat encounters. If the fed attempts a vigilante kill or faces a resisting arrest, the combat system handles the encounter.

**Evidence system** provides the EvidenceManager (for discovering, upgrading, and querying evidence), the CaseFileTracker (for tracking arrest viability and linking evidence to suspects), and all evidence types. The investigation system calls into the evidence system — it does not manage evidence directly.

### Investigation System

The fed gathers evidence through three investigation actions:

**Area Scan**: Active ability — pings a radius around the player, revealing discoverable evidence as highlighted interactables. Cooldown scales with Forensics tree skills.

**Crime Scene Analysis**: Triggered when the fed enters a zone with multiple evidence pieces linked to the same entity. Auto-aggregates evidence into the case file. Provides a +10 arrest viability bonus for coherent crime scenes (increased by Crime Scene Specialist skill F-F6).

**Forensic Examination**: Interact with individual discovered evidence to increase its quality rating (LOW → MEDIUM → HIGH). Higher quality evidence contributes more to arrest viability.

Evidence gathered via illegal counter-play means (Illegal Surveillance FA-8, Off-Books Forensics FA-12) is flagged as inadmissible. Inadmissible evidence raises suspicion scores but does NOT increase arrest viability. This creates meaningful risk/reward tension.

### Witness System

NPCs that witnessed a crime and have not been silenced by the killer can be interviewed. The fed walks up to the NPC and triggers the interview.

Interview outcome: a random sample from what the NPC actually witnessed. Witness reliability ranges 0.4–1.0 by NPC role (shopkeeper = 0.9, intoxicated NPC = 0.4). Unreliable witnesses may generate FABRICATED information pointing to innocent NPCs (false leads). Reliability modifiers from Forensics and Interrogation skills affect the effective reliability.

Silenced witnesses (those the killer used Witness Intimidation on) show "Witness unavailable — appears frightened." The fed can attempt Rough Interrogation (FA-9 counter-play ability, unlocked via Interrogation tree) on silenced witnesses at double the heat cost.

Planted informants (FA-10 counter-play ability, unlocked via Interrogation tree) are NPCs the fed converts into automatic reporters. The informant reports the next suspicious action within their watch radius. The killer can silence informants with Witness Intimidation.

### Suspect Tracker

All NPCs and the hidden killer player are loaded as suspect profiles at run start. Linking evidence to a suspect raises their suspicion score. Discovering evidence that matches an innocent NPC's routine path clears that NPC from suspicion. A suspect with a score above 70 is flagged as the primary suspect.

The suspect board overlay (Tab key) is a visual cork-board: NPC profile thumbnails connected by string to evidence cards, suspects sorted by suspicion score, a timeline view where fake evidence with timestamp mismatches is visually flagged.

### Arrest System

Arrest is gated by arrest viability score (0–100), mapping to five tiers:
- 0–19 INSUFFICIENT: Arrest button disabled — "More evidence needed"
- 20–39 WEAK: Arrest triggers full combat — killer fights back at full strength
- 40–59 MODERATE: Brief combat — killer starts at 50% health
- 60–79 STRONG: Clean arrest — cinematic takedown, no combat
- 80–100 AIRTIGHT: Perfect arrest — bonus score, cinematic takedown, no resistance

Inadmissible evidence penalty: if more than 30% of case file evidence is inadmissible, the viability score cap is reduced to 59 (cannot achieve STRONG or AIRTIGHT). The Ghost Agent capstone skill (F-T10) can retroactively make inadmissible evidence admissible once per run.

False arrest: arresting an innocent NPC dismisses the case and resets arrest viability to 0 with +25 fed heat. Only one false arrest is allowed per run.

### Fed Heat System

Fed heat is a per-run accumulator (0–100, does not persist between runs) representing Internal Affairs scrutiny. Thresholds: 0–40 no effect; 41–60 NPCs less cooperative (+20% interview failure chance); 61–80 arrest viability capped at 79 (cannot achieve AIRTIGHT); 81–100 arrest viability capped at 59 (cannot achieve STRONG or AIRTIGHT, all arrests trigger brief combat).

### Vigilante System

The fed can skip investigation and fight the killer directly without any evidence requirement. Win = fed wins run. Score multiplier: 0.5× (vs 1.0× for clean arrest). Materials earned: 60% of normal. No "arrest" trophies unlock — only "vigilante" trophies. Encourages investigation-first gameplay for maximum rewards.

### Default Abilities (Core Mechanics)

Seven default abilities available from the start (defined here as code-backed systems):
- **Enhanced Scan** (FA-1): Active area scan revealing discoverable evidence
- **Witness Compulsion** (FA-2): Triggers witness interview interaction
- **Forensic Analysis** (FA-3): Interacts with evidence to increase its quality rating
- **Surveillance Access** (FA-4): Views camera feeds in the current zone
- **Area Lockdown** (FA-5): Seals zone exits and alerts NPCs
- **Evidence Preservation** (FA-6): Prevents evidence decay for a short duration
- **Profile Analysis** (FA-7): Highlights suspect NPC behavioral anomalies

Five counter-play abilities (FA-8 through FA-12) unlock via Interrogation and Tactics skill tree progression. Their mechanics are defined here as part of the ability system; their stats and unlock conditions are data entries in the fed content piece.

### FedHUD

A React client component rendered only when the player role is FED. Layout: top-center Case Strength Meter (0–100, color-coded), top-right IA Scrutiny Meter (fed heat, glows red above 60), bottom-center active ability cooldown display, minimap with evidence markers (blue dots). Tab key toggles the Suspect Board overlay.

### Edge Cases

- All witnesses silenced: fed must rely solely on physical evidence; Illegal Surveillance (FA-8) can compensate
- More than 30% inadmissible evidence: suspect board shows "Investigation Compromised" warning
- Fed heat maxed before arrest: combat-based or vigilante path only
- Wrong suspect arrested: run continues with reset viability and +25 heat; one false arrest allowed per run
- In multiplayer, the killer's actual position is never sent to the fed's client — only the evidence trail reveals presence

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

Fed gameplay lives in `packages/game-engine/src/roles/fed/`. The FedRole class composes the five sub-systems (InvestigationSystem, WitnessSystem, SuspectTracker, ArrestSystem, VigilanteSystem). None of the sub-systems know about each other directly.

The React HUD (in `apps/web/`) reads from the fedStore via Zustand. Engine systems emit EventBus events; the fedStore subscribes and updates accordingly.

Skills, abilities, and items are all data-driven via the ContentRegistry pattern. This piece defines the engine code that processes them; the fed content piece defines the data entries.

### Core Types

**File**: `packages/shared/src/types/fed.ts`

```typescript
type ArrestCondition = 'INSUFFICIENT' | 'WEAK' | 'MODERATE' | 'STRONG' | 'AIRTIGHT';

interface SuspectProfile {
  entityId: string;
  displayName: string;
  suspicionScore: number;     // 0–100
  isEliminated: boolean;
  isPrimarySuspect: boolean;  // suspicionScore > 70
  linkedEvidenceIds: string[];
}

interface InterrogationResult {
  npcId: string;
  infoType: 'LOCATION' | 'TIMING' | 'DESCRIPTION' | 'FABRICATED';
  reliability: number;        // 0.4–1.0
  targetEntityId: string | null;
  timestamp: number;
}

interface FedRunState {
  arrestViability: number;
  arrestCondition: ArrestCondition;
  fedHeatLevel: number;       // session-scoped, never persists
  arrestAttempts: number;
  arrestSucceeded: boolean;
  vigilanteWin: boolean;
  inadmissibleEvidenceCount: number;
  totalEvidenceCount: number;
}
```

**File**: `packages/shared/src/constants/fed.ts`

```typescript
export const ARREST_VIABILITY_TIERS = {
  INSUFFICIENT: { min: 0,  max: 19 },
  WEAK:         { min: 20, max: 39 },
  MODERATE:     { min: 40, max: 59 },
  STRONG:       { min: 60, max: 79 },
  AIRTIGHT:     { min: 80, max: 100 },
} as const;

export const FED_HEAT_THRESHOLDS = {
  NONE:     { min: 0,  max: 40 },
  MINOR:    { min: 41, max: 60 },  // +20% interview failure chance
  MODERATE: { min: 61, max: 80 },  // arrest viability cap: 79
  SEVERE:   { min: 81, max: 100 }, // arrest viability cap: 59, all arrests trigger combat
} as const;

export const INADMISSIBLE_PENALTY_THRESHOLD = 0.30;  // 30% triggers cap-down
export const INADMISSIBLE_PENALTY_CAP = 59;
export const FALSE_ARREST_HEAT_PENALTY = 25;
export const CRIME_SCENE_ANALYSIS_BONUS = 10;         // arrest viability bonus
export const VIGILANTE_SCORE_MULTIPLIER = 0.5;
export const VIGILANTE_MATERIAL_MULTIPLIER = 0.6;
export const MAX_INFORMANTS_DEFAULT = 1;              // extended by F-I5 skill rank
```

### EventBus Event Constants

**File**: `packages/shared/src/constants/events/fed.ts`

```typescript
FED_EVIDENCE_DISCOVERED: { evidenceId: string; type: EvidenceType; quality: EvidenceQuality }
FED_WITNESS_INTERVIEWED: { npcId: string; result: InterrogationResult }
FED_SUSPECT_IDENTIFIED: { entityId: string; suspicionScore: number }
FED_ARREST_ATTEMPTED: { targetId: string; condition: ArrestCondition }
FED_ARREST_SUCCEEDED: { targetId: string; viabilityScore: number }
FED_ARREST_FAILED: { targetId: string; reason: string }
FED_COUNTER_PLAY_ACTIVATED: { abilityId: string; heatGenerated: number }
FED_INFORMANT_REPORT: { npcId: string; reportedEntityId: string; eventType: string }
FED_ENTRAPMENT_TRIGGERED: { decoyNpcId: string; suspectId: string }
FED_HEAT_THRESHOLD_CROSSED: { level: number; newArrestCap: number }
```

### Core Sub-System Signatures

**InvestigationSystem** (`packages/game-engine/src/roles/fed/investigation-system.ts`):
```typescript
class InvestigationSystem {
  performAreaScan(player: PlayerController, scene: Phaser.Scene): DiscoveredEvidence[]
  analyzeCrimeScene(zone: Zone): CrimeSceneResult  // returns viability bonus if coherent
  examineEvidence(evidenceId: string): Result<void, 'ALREADY_MAX_QUALITY' | 'NOT_DISCOVERED'>
  checkInadmissibleRatio(): number  // returns ratio 0.0–1.0
  update(delta: number): void
}
```

**WitnessSystem** (`packages/game-engine/src/roles/fed/witness-system.ts`):
```typescript
class WitnessSystem {
  interviewWitness(npc: NPC, playerAbilityRank: number): Result<InterrogationResult, 'SILENCED' | 'UNCOOPERATIVE' | 'ALREADY_INTERVIEWED'>
  roughInterrogate(npc: NPC, heatCost: number): Result<InterrogationResult, 'INSUFFICIENT_RANK' | 'HEAT_CAP_REACHED'>
  plantInformant(npc: NPC, watchRadius: number): Result<void, 'ALREADY_INFORMANT' | 'MAX_INFORMANTS_REACHED'>
  removeInformant(npcId: string): void
  getInformantCount(): number
}
```

**SuspectTracker** (`packages/game-engine/src/roles/fed/suspect-tracker.ts`):
```typescript
class SuspectTracker {
  initSuspects(allNPCIds: string[], killerPlayerId: string): void
  linkEvidence(evidenceId: string, entityId: string): void
  raiseSuspicion(entityId: string, amount: number): void
  clearSuspicion(entityId: string, amount: number): void
  eliminateSuspect(entityId: string): void
  getPrimarySuspect(): SuspectProfile | null
  getSuspects(): SuspectProfile[]
  detectFakeEvidenceTimestamp(evidenceId: string): boolean  // returns true if timestamp is implausible
}
```

**ArrestSystem** (`packages/game-engine/src/roles/fed/arrest-system.ts`):
```typescript
class ArrestSystem {
  getArrestCondition(): ArrestCondition
  getArrestViability(): number
  attemptArrest(targetEntityId: string): Result<ArrestResult, 'INSUFFICIENT_EVIDENCE' | 'FALSE_ARREST' | 'COMBAT_TRIGGERED'>
  applyInadmissiblePenalty(): void  // called when inadmissible ratio exceeds threshold
  canMakeCleanArrest(): boolean
}
type ArrestResult = { success: boolean; condition: ArrestCondition; viabilityScore: number; requiresCombat: boolean }
```

**VigilanteSystem** (`packages/game-engine/src/roles/fed/vigilante-system.ts`):
```typescript
class VigilanteSystem {
  initiateVigilante(target: BaseEntity): void
  resolveVigilanteWin(): void  // sets vigilanteWin = true, applies score penalty
}
```

### FedRole (Role Handler)

**File**: `packages/game-engine/src/roles/fed/fed-role-handler.ts`

```typescript
class FedRole implements RoleInterface {
  readonly role: PlayerRole = 'FED'
  private investigationSystem: InvestigationSystem
  private witnessSystem: WitnessSystem
  private suspectTracker: SuspectTracker
  private arrestSystem: ArrestSystem
  private vigilanteSystem: VigilanteSystem

  getObjectives(): RoleObjective[]
  getAbilities(): PlayerAbility[]
  getHUDConfig(): HUDConfig
  checkWinCondition(state: RunState): boolean    // arrestSucceeded OR vigilanteWin
  checkLoseCondition(state: RunState): boolean   // player HP=0 OR killer objectives complete
  onRunStart(config: RunConfig): void
  onRunEnd(result: RunResult): void
  onPlayerAction(action: PlayerAction): void
}

// Registration at module load:
roleRegistry.register('FED', () => new FedRole())
```

### Fed Zustand Store

**File**: `apps/web/src/stores/fed.ts`

```typescript
interface FedStore {
  suspects: SuspectProfile[]
  interrogationResults: InterrogationResult[]
  activeAbilityCooldowns: Record<string, number>
  fedHeatLevel: number
  arrestCondition: ArrestCondition
  activeCounterPlayEffects: CounterPlayEffect[]
  plantedInformants: string[]
  arrestAttempts: number
  arrestSucceeded: boolean
  vigilanteWin: boolean
  addSuspect: (profile: SuspectProfile) => void
  updateSuspect: (entityId: string, update: Partial<SuspectProfile>) => void
  eliminateSuspect: (entityId: string) => void
  addInterrogationResult: (result: InterrogationResult) => void
  setAbilityCooldown: (abilityId: string, ms: number) => void
  incrementHeat: (amount: number) => void
  setArrestCondition: (condition: ArrestCondition) => void
  activateCounterPlay: (effect: CounterPlayEffect) => void
  addPlantedInformant: (npcId: string) => void
  removePlantedInformant: (npcId: string) => void
  setArrestSucceeded: (value: boolean) => void
  setVigilanteWin: (value: boolean) => void
  reset: () => void
}
```

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| Phaser | 3.90.0 | Scene-level integration for scanning and evidence interaction |
| Zustand | latest | fedStore in apps/web |
| TypeScript | 5.9.3 | Strict types, all fed types exported from shared |
| Vitest | 4.1.0 | Unit tests |

### Testing Strategy

- Unit tests for ArrestSystem: viability tier transitions, inadmissible penalty application, false arrest penalty
- Unit tests for WitnessSystem: interview reliability sampling, silenced witness rejection, informant cap enforcement
- Unit tests for SuspectTracker: suspect initiation, suspicion score changes, primary suspect threshold
- Unit tests for InvestigationSystem: inadmissible ratio calculation, scan result emission
- Unit tests for fed heat thresholds: correct arrest cap applied per heat level
- E2E: fed discovers evidence, interviews witness, builds case to STRONG, arrests killer (Playwright)

### Constitution Compliance

- [x] No barrel files — all imports direct to specific files
- [x] No React in game-engine package — all role logic in game-engine, HUD in apps/web
- [x] EventBus for fed events (FED_ARREST_SUCCEEDED, FED_SUSPECT_IDENTIFIED, etc.)
- [x] Zustand fedStore for HUD state
- [x] Result<T,E> for WitnessSystem.interviewWitness() and ArrestSystem.attemptArrest()
- [x] ContentRegistry consumed from the content architecture system — no duplicate creation
- [x] Fed heat is session-scoped only — never persists to DB

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

- `packages/game-engine/src/roles/fed/fed-role-handler.ts`
- `packages/game-engine/src/roles/fed/investigation-system.ts`
- `packages/game-engine/src/roles/fed/witness-system.ts`
- `packages/game-engine/src/roles/fed/suspect-tracker.ts`
- `packages/game-engine/src/roles/fed/arrest-system.ts`
- `packages/game-engine/src/roles/fed/vigilante-system.ts`
- `packages/shared/src/types/fed.ts`
- `packages/shared/src/constants/fed.ts`
- `packages/shared/src/constants/events/fed.ts`
- `apps/web/src/stores/fed.ts`
- `apps/web/src/components/app/game/fed-hud/FedHUD.tsx` (and sub-components including SuspectBoard overlay)

### Dependencies (Consumed from Earlier Pieces)

**From piece 08a (Content Architecture)**:
- `ContentRegistry` instances: `abilityRegistry`, `itemRegistry` from `packages/shared/src/registry/registries`
- `Effect` union and `StatId`: `packages/shared/src/effects/effect-types`
- `EffectProcessor`, `StatModifierSystem`: from game-engine effects/combat paths
- `STAT_CAPS`: `packages/shared/src/constants/balance`

**From piece 08b (Combat System)**:
- `CombatController`, `BossManager` for vigilante and contested arrest encounters
- `StatusEffectSystem.applyFromDefinition()`

**From piece 09 (Evidence System)**:
- `EvidenceManager.discoverEvidence()`, `.upgradeQuality()`, `.getEvidenceInRadius()`
- `CaseFileTracker.getArrestViabilityScore()`, `.addEvidence()`
- `EvidenceType` enum and quality levels

**From piece 07 (Player and Roles)**:
- `RoleInterface` — this piece implements it
- `RoleRegistry` — this piece registers with it

**From piece 06 (Entity and NPC System)**:
- `NPC.canBeInterviewed()`, `.getWitnessLog()`, `.isInformant`
- `NPCSpawner.getAllNPCs()`

### Success Criteria

- [ ] Area scan reveals correct evidence within radius, scaled by skill rank
- [ ] Witness interviews return reliability-weighted information; silenced witnesses show correct UI state
- [ ] Suspect board lists all NPCs at run start; suspicion scores update as evidence is linked
- [ ] Arrest viability transitions between tiers correctly as evidence is gathered
- [ ] Inadmissible evidence penalty caps arrest viability to 59 when ratio exceeds 30%
- [ ] False arrest dismisses case and applies +25 heat penalty
- [ ] Fed heat threshold transitions apply correct arrest caps
- [ ] Vigilante win applies 0.5× score multiplier and 60% material yield
- [ ] FedHUD Case Strength Meter and IA Scrutiny Meter update in real-time from fedStore

### Alignment Notes

This piece owns the fed's game loop engine code. Piece 11b owns all content data (skills, abilities, weapons, boss items, crafting recipes).

The fed heat system never persists between runs — it is always reset to 0 on run start. This is a design constraint that prevents the progression system from making it persistent.

The SuspectTracker starts with ALL NPCs as potential suspects (including the hidden killer player's NPC identity). In multiplayer (piece 14), the killer's real player identity is never revealed to the fed's client until the arrest succeeds or the run ends.

The inadmissible evidence tracking is per-evidence-object: each `Evidence` entity in the EvidenceManager has an `isInadmissible` flag set by the counter-play abilities. The ratio is calculated by the InvestigationSystem querying the CaseFileTracker.
