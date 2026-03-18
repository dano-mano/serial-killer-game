---
vision: killer-vs-fed-roguelite
sequence: 09
name: evidence-system
group: Core Gameplay
group_order: 3
status: pending
depends_on:
  - "01: Result utilities, Zod, Pino logger, shared type/schema scaffold, environment config"
  - "03: Design system components (AppButton, AppCard, AppDialog) for EvidencePanel React component"
  - "04: EventBus, game constants, Zustand game store"
  - "05: Zone manager (evidence placed in zones), tile manager, biome types, Vec2"
  - "06: NPC witness system (WitnessStatement, getWitnessStatement()), NPCSpawner, perception system"
  - "07: Player actions (PLAYER_ACTION events), inventory (evidence-modifying items), role (evidence visibility differs by role), player Zustand store"
  - "08b: DAMAGE_DEALT event (with witnesses[]), ENTITY_DIED event, Attack type"
produces:
  - "Evidence manager: tracks all evidence, handles generation, decay, and discovery"
  - "Evidence types: Evidence, EvidenceType, EvidenceState, EvidenceQuality, CaseFile"
  - "Evidence constants: generation rates, discovery difficulty, decay timers, quality thresholds"
  - "Evidence generator: rules mapping killer actions to evidence objects"
  - "Evidence modifiers: skill/item effects that reduce or manipulate evidence"
  - "Discovery mechanics: proximity search, area scan, witness interview, surveillance review"
  - "Case file tracker: aggregates discovered evidence, calculates arrest viability score"
  - "Evidence renderer: visual representation on map (fed-visible layer)"
  - "Evidence Zustand store: case file progress, evidence count, arrest viability"
  - "Evidence HUD (Fed): evidence log, case strength meter, evidence detail popup"
  - "Evidence schemas: Zod validation for server-side multiplayer verification"
  - "Server-side evidence validation DAL"
  - "Counter-play abilities: killer fake evidence and fed off-the-books tactics"
created: 2026-03-17
last_aligned: never
---

# Vision Piece 09: Evidence System

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: project-scaffold, design-system, game-engine-bootstrap, world-and-maps, entity-and-npc-system, player-and-roles

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Implement the evidence and clue system that is the central asymmetric mechanic connecting killer and fed gameplay. Killer actions generate forensic traces (footprints, DNA, witness accounts, weapon marks, bodies). The fed discovers and interprets these traces to build a case. The system also implements counter-play abilities: the killer can actively plant false evidence and disrupt the investigation, while the fed can use off-the-books tactics to gather evidence faster but with consequences. Evidence quantity and quality determine whether an arrest is viable.

### Dependency Context (Inline)

This piece depends on several earlier systems. These are described here so this document is self-contained.

**Project scaffold** provides the shared Result type, Zod for schema validation, a Pino logger singleton, and Zod-validated environment config.

**Design system** provides the shared component library (AppButton, AppCard, AppDialog, AppInput, AppToast) used by the evidence panel React component.

**Game engine bootstrap** provides the EventBus (emit and subscribe typed events) and game constants.

**World and maps** provides the zone manager (evidence objects are placed in zones), the tile manager (tile type affects evidence generation, e.g. soft surfaces generate more visible footprints), and the shared position, zone, tile, and biome types.

**Entity and NPC system** provides the NPC class (has a witness flag, a witness event log, an interviewable flag, and a method to produce a witness statement), the NPC spawner (for querying NPCs by ID), and the perception system (for registering suspicious events).

**Player and roles** provides player action types and the PLAYER_ACTION event that the evidence generator subscribes to. It also provides the inventory class (some items modify evidence generation), player role type, inventory item types, and the player Zustand store.

**Combat system** provides the DAMAGE_DEALT event (which includes a list of NPC witness IDs with line-of-sight to the impact position) and the ENTITY_DIED event, both of which the evidence generator subscribes to. It also provides the Attack type used in combat event payloads.

### Evidence Data Model

Ten types of evidence can exist on the map:

- **Footprint**: the killer walked through the area; more visible on soft surfaces; decays after approximately 2 minutes
- **DNA**: blood or skin cells from wounds and violence; never decays
- **Weapon trace**: marks left by weapons (blade cuts, bullet casings); never decays
- **Body**: the victim's body; the highest-value evidence and the source of many sub-clues; never decays within a run
- **Witness**: a reference to an NPC who witnessed something crime-relevant; never decays
- **Surveillance**: camera footage capturing the killer; only generated in zones with cameras; never decays
- **Broken lock**: traces of forced entry; never decays
- **Disturbed scene**: overturned furniture or spilled items indicating a struggle; decays after approximately 1.5 minutes
- **False evidence**: planted by the killer's counter-play abilities; appears real until analyzed
- **Informant report**: created by the fed's planted informant ability when an informant NPC witnesses an event

Each evidence object has five states: hidden (exists but not yet detectable), discoverable (can be found by proximity), discovered (the fed has found it), destroyed (cleaned up by killer or decayed), and discredited (the fed proved it was false evidence — no longer counts toward the case).

Evidence quality has four levels: low, medium, high, and irrefutable. Quality determines how much each piece contributes to the arrest viability score. Irrefutable evidence cannot have its quality reduced by any killer counter-play.

Each evidence object also carries: a unique ID, the type, state, and quality; its world position and zone ID; the entity it relates to (optional); what generated it and when; decay timing (null means no decay); a flag marking it as planted false evidence; who discovered it and when; and a human-readable description note for the evidence log.

Default quality by evidence type: body is irrefutable; DNA and surveillance are high; witness and weapon trace are medium (witness quality is also modified by the NPC's reliability score); footprint, broken lock, and disturbed scene are low. False evidence initially appears at high quality to deceive the fed.

### Case File

The case file aggregates everything the fed has discovered into a prosecutable case. It contains: the run ID, the fed player's ID, the list of all discovered evidence objects, all collected witness statements, a narrowed-down suspect list (NPC IDs), an arrest viability score from 0 to 100, a tier classification of that score, and a last-updated timestamp.

Arrest viability tiers define what actions the fed can take:
- **Insufficient** (below 20): arrest is not possible
- **Weak** (20–39): attempting arrest triggers active resistance from the target
- **Moderate** (40–59): arrest is possible but the target may resist
- **Strong** (60–79): arrest succeeds with minor resistance
- **Airtight** (80–100): clean arrest, no resistance, and bonus score

### Evidence Generation

Killer actions automatically generate forensic traces based on generation rules. The evidence generator subscribes to EventBus events (player actions, damage dealt, entity deaths, NPC witness events) and applies the appropriate rules:

- An interaction kill generates a body (irrefutable), DNA (high quality), and a weapon trace (medium quality)
- Breaking into a locked location generates a broken lock (low quality) and a footprint on soft flooring (low quality)
- Combat damage generates DNA at the impact position and a weapon trace
- Running generates a footprint trail at regular intervals (low quality)
- An NPC witnessing a suspicious event generates a witness evidence object linked to that NPC

Each generation rule specifies: which event type triggers it, the evidence type to generate, the base quality, the probability (0–1 chance), a position offset from the action position, and optional conditions (tile type, whether the zone has a camera, etc.). The killer's evidence modifier system is applied to each candidate evidence object before it is added, potentially reducing quality or suppressing generation entirely.

### Evidence Modifiers

The killer can equip skills, items, and trophies that reduce the evidence their actions generate. An evidence modifier system tracks these active modifiers and applies them during generation. Each modifier specifies which evidence types it targets (null means all types), a probability reduction (e.g. 50% less likely to generate), and a quality downgrade step count (each step drops quality one tier).

The system exposes a summary of total reduction per evidence type and the active modifier count, which the killer's HUD uses to show the current evidence trail reduction.

### Counter-Play Abilities

Counter-play abilities are the strategic depth layer. Each role has active tools to undermine the other's objectives. These abilities are unlocked through skill tree progression. All have risk and reward trade-offs — none should be "always use this."

#### Killer Counter-Play

**Fake evidence plant** (Deception tree, Tier 2): The killer places a false evidence object of a chosen type (footprint, DNA, weapon trace) at a target position, linked to an innocent NPC. The false evidence initially appears at high quality — visually and data-identical to real evidence. The fed's forensic analysis ability gives a probability-based chance to detect inconsistencies. If detected, the evidence is discredited. If the fed detects planted evidence, the killer is flagged as sophisticated (alert level increases) but the fed's arrest viability is not penalized. Using a disguise kit consumable is required.

**Decoy trail** (Deception tree, Tier 2): Creates a series of 5–13 footprint false evidence objects leading away from the kill site toward an innocent zone. Decoy footprints are slightly lower quality than genuine ones — a skilled fed with forensic analysis can notice the difference. Costs a cleaning supplies consumable.

**Witness intimidation** (Deception tree, Tier 1): The killer approaches a specific NPC witness and silences them — the NPC's interview flag is cleared and their witness log is erased. If the fed was already tracking that NPC, the sudden silencing registers as a disturbed scene evidence near the NPC's last known position. Wasted on NPCs the fed has not found yet.

**Surveillance jamming** (Stealth tree, Tier 2): Disables cameras in a zone for a duration (45–105 seconds depending on skill rank), preventing surveillance evidence from generating during that window. Jammed cameras show as "offline" to the fed — the jammed camera itself is a clue that something happened in that zone. Requires a lockpick set in inventory (not consumed).

**False alibi construction** (Deception tree, Tier 3): The killer interacts with a specific NPC to create a false witness evidence object — the NPC appears to have seen the killer at a different location at the time of the kill. The fed interviewing that NPC receives false location data. If the fed cross-references with real witness accounts that contradict the alibi, the false statement is discredited. Cannot be used on an NPC who already witnessed the crime. Costs a bribery gift consumable.

#### Fed Counter-Play

**Illegal surveillance** (Forensics tree, Tier 2): Instantly reveals all surveillance evidence in a zone, bypassing normal proximity discovery. Evidence gathered this way is flagged as illegally obtained — a score penalty applies at the end of the run, but arrest viability is unaffected. Using this more than 3 times in a run generates a reprimand status that caps the arrest viability bonus from the airtight tier.

**Rough interrogation** (Interrogation tree, Tier 1): When interviewing a witness NPC, the fed forces a full statement regardless of the NPC's reliability score — reliability is overridden to 1.0 for this statement. A disturbed scene evidence object is generated at the interrogation location. Using this more than twice in a run generates a misconduct warning that slightly reduces the maximum achievable arrest viability. Risk: if the target NPC carries a killer-planted false alibi, that false statement is now delivered with full reliability, making it harder to detect.

**Planted informants** (Tactics tree, Tier 2): The fed converts a specific NPC into an active informant — that NPC automatically reports suspicious events they perceive to the fed. Each report creates an informant report evidence object. The killer can detect informants by observing unusual NPC behavior (noticing they report to a fixed location). If the killer intimidates or kills an informant, the silencing event notifies the fed. Maximum of 2 active informants per run at rank 2, 3 at rank 3.

**Entrapment setup** (Tactics tree, Tier 3): The fed converts an NPC into entrapment bait placed in a high-traffic area. If the killer approaches and interacts with the bait NPC, the fed is alerted to the killer's position. The killer sees a normal NPC; the fed sees it highlighted as bait. If entrapment is the primary evidence in an arrest, the arrest viability is capped at moderate regardless of physical evidence strength. The fed must be within 3 zones of the trap to receive the alert.

**Off-the-books forensics** (Forensics tree, Tier 1): Reduces discovery time dramatically — evidence is discovered instantly on proximity rather than requiring a slow scan animation. Evidence gathered this way is admissible but flagged with a minor score penalty. Risk: expedited processing on false evidence reduces the chance to detect it's false by 50% while this is active.

### Evidence Discovery

The fed finds evidence through several mechanisms:

- **Passive proximity**: Walking within the base discovery radius of a discoverable evidence object automatically transitions it to discovered. Skills and items can expand this radius.
- **Area scan ability**: The fed can actively scan an area to instantly reveal all hidden evidence in range.
- **Forensic analysis**: Examining a specific evidence object provides richer detail and gives a probability-based chance to detect false evidence. Detection probability starts low at base skill level and can reach high levels with advanced forensic skills.
- **Surveillance review**: Manually accessing camera footage for a zone reveals all surveillance evidence in that zone.

### Case Strength Calculation

The arrest viability score is computed from the collected evidence set. Each quality level contributes a fixed score increment: irrefutable evidence contributes the most, then high, medium, and low. False evidence before it is discredited contributes the same as high-quality real evidence — this is how it misleads the calculation. Discredited evidence contributes nothing and is removed from scoring.

The suspect list is derived by starting with all NPCs on the map and narrowing based on evidence chains and witness statements.

### Evidence Rendering

Evidence objects are rendered in the Phaser scene on a dedicated layer above the map. Visibility rules:
- Fed: always sees all discoverable and discovered evidence
- Killer: can see their own generated evidence (a stealth awareness feature allowing them to track and clean up their trail)

Visual indicators: proximity highlight ring when the fed is near discoverable evidence, a discovered badge when found, a discredited indicator (crossed out) when false evidence is exposed.

### Evidence HUD (Fed Only)

A React client component rendered only when the player role is fed. It shows:
- A case strength meter from 0–100, color-coded by arrest viability tier
- A scrollable evidence log with type icon, quality badge, and brief note for each discovered piece
- An evidence detail popup (click to expand) showing full description, location, and associated suspect if known
- An arrest readiness indicator that activates at the weak tier and glows at strong and airtight
- Discredited evidence shown crossed out in the log

### Server-Side Validation

A server-only data access layer validates evidence state for multiplayer anti-cheat:
1. The killer cannot submit a run with zero evidence generated (impossible if actions were taken)
2. The fed cannot fabricate evidence — submitted evidence IDs must match server-known action records
3. The arrest viability score is recalculated server-side from the submitted evidence set and must match within a small tolerance

The server validation function accepts the run ID, the submitted case file, and a log of run actions, and returns a validation report with the computed viability score and any discrepancies.

### EventBus Events

New events added for the evidence system: evidence generated (object and source), evidence discovered (object, discoverer, and position), evidence destroyed (ID and destroyer), evidence discredited (ID and detective), case file updated (full case file), arrest viable (current tier and score), witness silenced (killer used intimidation), informant report (informant NPC reported an event), entrapment triggered (bait activated with killer position), surveillance jammed (zone and duration), and false evidence planted (killer-perspective only event).

### Edge Cases

- False evidence must be completely indistinguishable from real evidence in all visual and data representations; only the forensic analysis result and the internal flag distinguish them
- Rough interrogation on an already-intimidated witness (interview flag cleared) returns an empty result — what was erased cannot be forced back
- If the killer destroys evidence the fed has already discovered, the in-memory object is marked destroyed but it remains in the fed's case file and continues counting toward arrest viability
- Surveillance jamming applied after the fed already collected surveillance evidence does not retroactively remove it
- The spatial hash must be updated when evidence is added, destroyed, or moved
- False witness evidence must reference a real NPC ID — the system validates the NPC exists in the current run before allowing the plant

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

The evidence system is entirely passive from the killer's perspective (evidence is generated automatically by their actions via EventBus listeners) and active from the fed's perspective (fed must physically explore and trigger discovery mechanics).

Counter-play abilities are implemented as PlayerAbility objects that call EvidenceManager and NPC methods directly — no new evidence systems needed. The combat ability system handles cooldowns and resource costs; evidence methods implement the actual effect.

### Core Types

```typescript
// packages/shared/src/types/evidence.ts

export type EvidenceType =
  | 'FOOTPRINT'
  | 'DNA'
  | 'WEAPON_TRACE'
  | 'BODY'
  | 'WITNESS'
  | 'SURVEILLANCE'
  | 'BROKEN_LOCK'
  | 'DISTURBED_SCENE'
  | 'FALSE_EVIDENCE'
  | 'INFORMANT_REPORT';

export type EvidenceState =
  | 'HIDDEN'
  | 'DISCOVERABLE'
  | 'DISCOVERED'
  | 'DESTROYED'
  | 'DISCREDITED';

export type EvidenceQuality = 'LOW' | 'MEDIUM' | 'HIGH' | 'IRREFUTABLE';

export type ArrestViabilityTier =
  | 'INSUFFICIENT'   // 0–19
  | 'WEAK'           // 20–39
  | 'MODERATE'       // 40–59
  | 'STRONG'         // 60–79
  | 'AIRTIGHT';      // 80–100

export interface Evidence {
  id: string;
  type: EvidenceType;
  state: EvidenceState;
  quality: EvidenceQuality;
  position: Vec2;
  zoneId: string;
  relatedEntityId?: string;            // NPC or player entity ID
  generatedBy: string;                 // player ID or system
  generatedAt: number;                 // game timestamp (ms)
  decaysAt: number | null;             // null = never decays
  isPlanted: boolean;                  // true = killer-placed false evidence
  discoveredBy?: string;               // fed player ID
  discoveredAt?: number;               // game timestamp (ms)
  note: string;                        // human-readable description for evidence log
}

export interface WitnessStatement {
  npcId: string;
  reliability: number;                 // 0.0–1.0
  statement: string;
  observedAt: number;
  observedPosition: Vec2;
}

export interface CaseFile {
  runId: string;
  fedPlayerId: string;
  evidence: Evidence[];
  witnessStatements: WitnessStatement[];
  suspectList: string[];               // NPC entity IDs
  arrestViability: number;             // 0–100
  viabilityTier: ArrestViabilityTier;
  updatedAt: number;
}
```

### Evidence Constants

```typescript
// packages/shared/src/constants/evidence.ts

export const EVIDENCE_DECAY_MS = {
  FOOTPRINT: 120_000,      // 2 minutes
  DISTURBED_SCENE: 90_000, // 1.5 minutes
} as const;

export const EVIDENCE_BASE_QUALITY: Record<EvidenceType, EvidenceQuality> = {
  BODY: 'IRREFUTABLE',
  DNA: 'HIGH',
  SURVEILLANCE: 'HIGH',
  WITNESS: 'MEDIUM',
  WEAPON_TRACE: 'MEDIUM',
  INFORMANT_REPORT: 'MEDIUM',
  FOOTPRINT: 'LOW',
  BROKEN_LOCK: 'LOW',
  DISTURBED_SCENE: 'LOW',
  FALSE_EVIDENCE: 'HIGH',  // appears identical to high-quality real evidence
} as const;

export const EVIDENCE_QUALITY_SCORE: Record<EvidenceQuality, number> = {
  LOW: 5,
  MEDIUM: 10,
  HIGH: 20,
  IRREFUTABLE: 35,
} as const;

export const ARREST_VIABILITY_THRESHOLDS: Record<ArrestViabilityTier, number> = {
  INSUFFICIENT: 0,
  WEAK: 20,
  MODERATE: 40,
  STRONG: 60,
  AIRTIGHT: 80,
} as const;

export const EVIDENCE_DISCOVERY_RADIUS = 64;         // px — base proximity radius
export const EVIDENCE_SPATIAL_HASH_CELL_SIZE = 256;  // px — grid cell size
export const FORENSIC_ANALYSIS_BASE_CHANCE = 0.2;    // 20% base false-evidence detection
export const FORENSIC_ANALYSIS_MAX_CHANCE = 0.7;     // 70% with max skill
export const MAX_ACTIVE_INFORMANTS = 2;              // rank 2; 3 at rank 3
export const ENTRAPMENT_ALERT_ZONE_RADIUS = 3;       // zones
export const ILLEGAL_SURVEILLANCE_REPRIMAND_THRESHOLD = 3; // uses before reprimand
export const ROUGH_INTERROGATION_MISCONDUCT_THRESHOLD = 2; // uses before misconduct warning
export const DECOY_TRAIL_MIN_FOOTPRINTS = 5;
export const DECOY_TRAIL_MAX_FOOTPRINTS = 13;
export const SURVEILLANCE_JAM_MIN_MS = 45_000;
export const SURVEILLANCE_JAM_MAX_MS = 105_000;
```

### EvidenceGenerator

```typescript
// packages/game-engine/src/evidence/evidence-generator.ts

export interface EvidenceGenerationRule {
  triggerEvent: string;                // EventBus event type key
  evidenceType: EvidenceType;
  baseQuality: EvidenceQuality;
  probability: number;                 // 0.0–1.0
  positionOffset?: Vec2;
  conditions?: EvidenceCondition[];
}

export interface EvidenceCondition {
  type: 'TILE_TYPE' | 'ZONE_HAS_CAMERA' | 'NPC_HAS_LOS';
  value: string | boolean;
}

export class EvidenceGenerator {
  constructor(
    private readonly evidenceManager: EvidenceManager,
    private readonly evidenceModifiers: EvidenceModifiers,
    private readonly eventBus: EventBus,
    private readonly zoneManager: ZoneManager,
    private readonly tileManager: TileManager,
    private readonly npcSpawner: NPCSpawner,
  ) {}

  initialize(): void;                  // subscribe to EventBus events
  destroy(): void;                     // unsubscribe all listeners

  private applyRule(rule: EvidenceGenerationRule, payload: unknown): void;
  private meetsConditions(conditions: EvidenceCondition[], context: GenerationContext): boolean;
  private generateEvidence(
    type: EvidenceType,
    quality: EvidenceQuality,
    position: Vec2,
    context: GenerationContext,
  ): Evidence | null;                  // null if suppressed by modifiers
}
```

### EvidenceModifiers

```typescript
// packages/game-engine/src/evidence/evidence-modifiers.ts

export interface EvidenceMod {
  targetTypes: EvidenceType[] | null;  // null = applies to all types
  probabilityReduction: number;        // 0.0–1.0; subtracted from generation probability
  qualityDowngradeSteps: number;       // steps; each step drops quality one tier
}

export interface EvidenceModSummary {
  perType: Record<EvidenceType, { totalProbabilityReduction: number; totalQualityDowngrade: number }>;
  activeModCount: number;
}

export class EvidenceModifiers {
  addModifier(mod: EvidenceMod): void;
  removeModifier(mod: EvidenceMod): void;
  applyToCandidate(evidence: Evidence): Evidence | null;  // null = suppressed
  getSummary(): EvidenceModSummary;
}
```

### EvidenceManager

```typescript
// packages/game-engine/src/evidence/evidence-manager.ts

export class EvidenceManager {
  constructor(
    private readonly eventBus: EventBus,
    private readonly logger: Logger,
  ) {}

  addEvidence(evidence: Evidence): void;
  getById(id: string): Evidence | undefined;
  getNearby(pos: Vec2, radius: number): Evidence[];   // spatial hash lookup
  markDiscovered(id: string, discoveredBy: string): void;
  markDestroyed(id: string, destroyedBy: string): void;
  markDiscredited(id: string, detectedBy: string): void;
  updateDecay(now: number): void;                     // call each game tick
  getAllForRole(role: PlayerRole): Evidence[];         // respects visibility rules
  destroy(): void;
}
```

### DiscoveryMechanics

```typescript
// packages/game-engine/src/evidence/discovery-mechanics.ts

export interface DiscoveryModifiers {
  proximityRadiusBonus: number;         // px added to base radius
  scanRadiusBonus: number;
  forensicDetectionBonus: number;       // 0.0–1.0 added to base chance
  offTheBooks: boolean;                 // instant discovery mode
  offTheBooksDetectionPenalty: number;  // 0.0–1.0 reduction to false-evidence detection
}

export interface ForensicAnalysisResult {
  evidenceId: string;
  isPlanted: boolean;                  // true = false evidence detected
  wasDetected: boolean;                // false = analysis found nothing suspicious
  detectionChance: number;             // the computed probability used
}

export class DiscoveryMechanics {
  constructor(
    private readonly evidenceManager: EvidenceManager,
    private readonly eventBus: EventBus,
  ) {}

  checkProximity(fedPosition: Vec2, modifiers: DiscoveryModifiers): Evidence[];
  performAreaScan(center: Vec2, radius: number, modifiers: DiscoveryModifiers): Evidence[];
  performForensicAnalysis(
    evidenceId: string,
    modifiers: DiscoveryModifiers,
  ): ForensicAnalysisResult;
  reviewSurveillance(zoneId: string, isIllegal: boolean): Evidence[];
}
```

### CaseFileTracker

```typescript
// packages/game-engine/src/evidence/case-file.ts

export class CaseFileTracker {
  constructor(
    private readonly evidenceManager: EvidenceManager,
    private readonly eventBus: EventBus,
    private readonly npcSpawner: NPCSpawner,
  ) {}

  getCaseFile(): CaseFile;
  addWitnessStatement(statement: WitnessStatement): void;
  recalculateViability(): void;
  getViabilityTier(): ArrestViabilityTier;
  getSuspectList(): string[];          // derived from evidence chains + witness statements
  applyScorePenalty(amount: number, reason: string): void;
}
```

### EvidenceRenderer

```typescript
// packages/game-engine/src/evidence/evidence-renderer.ts

export class EvidenceRenderer {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly evidenceManager: EvidenceManager,
    private readonly eventBus: EventBus,
  ) {}

  initialize(): void;                  // create evidence layer above map tiles
  update(role: PlayerRole, fedPosition: Vec2): void;
  destroy(): void;
  private renderEvidence(evidence: Evidence, role: PlayerRole): void;
  private updateProximityHighlight(fedPosition: Vec2): void;
}
```

### Zod Schemas

```typescript
// packages/shared/src/schemas/evidence.ts

import { z } from 'zod';

export const evidenceTypeSchema = z.enum([
  'FOOTPRINT', 'DNA', 'WEAPON_TRACE', 'BODY', 'WITNESS',
  'SURVEILLANCE', 'BROKEN_LOCK', 'DISTURBED_SCENE',
  'FALSE_EVIDENCE', 'INFORMANT_REPORT',
]);

export const evidenceStateSchema = z.enum([
  'HIDDEN', 'DISCOVERABLE', 'DISCOVERED', 'DESTROYED', 'DISCREDITED',
]);

export const evidenceQualitySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'IRREFUTABLE']);

export const evidenceSchema = z.object({
  id: z.string().uuid(),
  type: evidenceTypeSchema,
  state: evidenceStateSchema,
  quality: evidenceQualitySchema,
  position: z.object({ x: z.number(), y: z.number() }),
  zoneId: z.string(),
  relatedEntityId: z.string().optional(),
  generatedBy: z.string(),
  generatedAt: z.number(),
  decaysAt: z.number().nullable(),
  isPlanted: z.boolean(),
  discoveredBy: z.string().optional(),
  discoveredAt: z.number().optional(),
  note: z.string(),
});

export const witnessStatementSchema = z.object({
  npcId: z.string(),
  reliability: z.number().min(0).max(1),
  statement: z.string(),
  observedAt: z.number(),
  observedPosition: z.object({ x: z.number(), y: z.number() }),
});

export const caseFileSchema = z.object({
  runId: z.string().uuid(),
  fedPlayerId: z.string(),
  evidence: z.array(evidenceSchema),
  witnessStatements: z.array(witnessStatementSchema),
  suspectList: z.array(z.string()),
  arrestViability: z.number().min(0).max(100),
  viabilityTier: z.enum(['INSUFFICIENT', 'WEAK', 'MODERATE', 'STRONG', 'AIRTIGHT']),
  updatedAt: z.number(),
});

export type EvidenceInput = z.infer<typeof evidenceSchema>;
export type CaseFileInput = z.infer<typeof caseFileSchema>;
```

### Server-Side Validation

```typescript
// apps/web/src/dal/evidence/validation.ts
// server-only — never imported from client bundle

import { Result, ok, err } from 'neverthrow';

export interface ValidationReport {
  valid: boolean;
  computedViability: number;
  submittedViability: number;
  discrepancies: string[];
}

export async function validateRunEvidence(
  runId: string,
  submittedCaseFile: CaseFileInput,
  runActionLog: RunActionLog,
): Promise<Result<ValidationReport, ValidationError>>;
```

### Zustand Store

```typescript
// apps/web/src/stores/evidence.ts

export interface EvidenceStore {
  // State
  caseFile: CaseFile | null;
  evidenceCount: number;
  arrestViability: number;
  viabilityTier: ArrestViabilityTier;
  illegalSurveillanceUses: number;
  roughInterrogationUses: number;
  activeInformantCount: number;

  // Actions
  updateCaseFile: (caseFile: CaseFile) => void;
  incrementIllegalSurveillance: () => void;
  incrementRoughInterrogation: () => void;
  setActiveInformantCount: (count: number) => void;
  reset: () => void;
}
```

### EventBus Event Types

New events added to the shared EventBus map in `packages/game-engine/src/events/event-types.ts`:

```typescript
EVIDENCE_GENERATED: { evidence: Evidence; sourceEvent: string };
EVIDENCE_DISCOVERED: { evidence: Evidence; discoveredBy: string; position: Vec2 };
EVIDENCE_DESTROYED: { evidenceId: string; destroyedBy: string };
EVIDENCE_DISCREDITED: { evidenceId: string; detectedBy: string };
CASE_FILE_UPDATED: { caseFile: CaseFile };
ARREST_VIABLE: { tier: ArrestViabilityTier; score: number };
WITNESS_SILENCED: { npcId: string; killerPosition: Vec2 };
INFORMANT_REPORT: { informantNpcId: string; eventType: string; position: Vec2 };
ENTRAPMENT_TRIGGERED: { baitNpcId: string; killerPosition: Vec2 };
SURVEILLANCE_JAMMED: { zoneId: string; durationMs: number };
FALSE_EVIDENCE_PLANTED: { evidence: Evidence; plantedBy: string }; // killer-perspective only
```

### Spatial Hashing for Performance

Evidence objects may number in the hundreds per map (each footstep, every bloodstain). Use a spatial hash grid with cell size `EVIDENCE_SPATIAL_HASH_CELL_SIZE` (256px). When `getNearby(pos, radius)` is called, only check cells within range. This reduces proximity checks from O(n) to O(1) for normal search radii.

### False Evidence Detection Balance

The balance between false evidence believability and detectability is the core tension of counter-play:
- All false evidence starts as genuinely indistinguishable (same data structure, same visual)
- Fed's `FORENSIC_ANALYSIS` gives a chance (`falsEvidenceDetectionChance` from skills) to detect inconsistencies
- At base (no skills), chance is 20% per analysis — skilled fed can reach 70%
- Killer can mitigate detection risk by planting false evidence early (before fed develops forensic skills) or by overwhelming the fed with volume

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| Zod | via @repo/shared | evidence schemas for server validation |
| neverthrow | latest | Result<T,E> for all DAL functions |
| TypeScript | 5.9.3 | Strict types |

### Testing Strategy

- Unit tests for EvidenceGenerator: correct evidence objects generated per action type
- Unit tests for CaseFileTracker: viability score calculation, suspect derivation logic
- Unit tests for EvidenceModifiers: probability and quality reductions stack correctly
- Unit tests for DiscoveryMechanics: proximity radius, false evidence detection probability
- Unit tests for false evidence: planted evidence appears in fed's discovery, can be discredited
- Unit tests for counter-play: witness intimidation clears log, illegal surveillance reveals zone
- Component tests for EvidencePanel: renders correct viability tier, evidence log items
- Integration test: full scenario — killer kills, generates evidence, plants false trail, fed discovers both real and false, analyzes, discredits false, achieves AIRTIGHT viability

### Constitution Compliance

- [x] No barrel files — direct imports only
- [x] No React in game-engine package — all evidence game logic in packages/game-engine
- [x] DAL for server-side validation (apps/web/src/dal/evidence/)
- [x] Zod schemas in packages/shared/src/schemas/evidence.ts
- [x] EventBus for one-time signals (EVIDENCE_DISCOVERED, ARREST_VIABLE, WITNESS_SILENCED)
- [x] Zustand for continuous state (evidenceStore)
- [x] RLS: evidence server validation is server-only, never in client bundle
- [x] Result<T,E> for DAL functions
- [x] Zero-trust: arrest viability recalculated server-side, client value is untrustworthy

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

- `packages/game-engine/src/evidence/evidence-manager.ts`
- `packages/game-engine/src/evidence/evidence-generator.ts`
- `packages/game-engine/src/evidence/evidence-modifiers.ts`
- `packages/game-engine/src/evidence/discovery-mechanics.ts`
- `packages/game-engine/src/evidence/case-file.ts`
- `packages/game-engine/src/evidence/evidence-renderer.ts`
- `packages/shared/src/types/evidence.ts`
- `packages/shared/src/constants/evidence.ts`
- `packages/shared/src/schemas/evidence.ts`
- `apps/web/src/stores/evidence.ts`
- `apps/web/src/components/app/game/hud/EvidencePanel.tsx`
- `apps/web/src/dal/evidence/validation.ts`

### Dependencies (Consumed from Earlier Pieces)

- Piece 01: Result utilities, Zod, Pino logger, shared type/schema scaffold
- Piece 03: Design system components for EvidencePanel
- Piece 04: EventBus, game constants, Zustand stores
- Piece 05: Zone manager (evidence placed in zones), tile manager
- Piece 06: NPC witness system (WitnessStatement, getWitnessStatement()), NPCSpawner
- Piece 07: Player actions (PLAYER_ACTION events), inventory (evidence-modifying items), role (evidence visibility differs by role)
- Piece 08: DAMAGE_DEALT event (with witnesses[]), ENTITY_DIED event

### Success Criteria

- [ ] Killer walking generates footprints at correct frequency and positions
- [ ] Kill action generates BODY + DNA + WEAPON_TRACE at kill position
- [ ] Evidence decays at correct timers (FOOTPRINT after 2 minutes, DNA never)
- [ ] Fed proximity to DISCOVERABLE evidence transitions it to DISCOVERED
- [ ] CaseFile viability score updates on each discovery
- [ ] EvidencePanel renders correctly for FED role, is not rendered for KILLER role
- [ ] Killer can see their own evidence trail (as a stealth awareness feature)
- [ ] FALSE_EVIDENCE is indistinguishable from real until analyzed
- [ ] FORENSIC_ANALYSIS correctly detects false evidence at configured probability
- [ ] Witness intimidation clears NPC's canBeInterviewed flag and witnessLog
- [ ] Illegal surveillance grants instant zone discovery with score penalty flag
- [ ] Server-side validation rejects arrest viability scores that don't match submitted evidence set

### Alignment Notes

The counter-play abilities are the strategic depth layer that elevates this game beyond a simple hide-and-seek. The killer has active tools to mislead the fed; the fed has active tools to push through the killer's obfuscation. The risk/reward on each counter-play ability is intentional — no ability should be "always use this." The false evidence detection probability curve (20% base → 70% skilled) means early-game play favors the killer's deception while late-game skilled feds can cut through the noise.

The evidence system outputs (CaseFile, arrest viability) are consumed by piece 11 (fed-gameplay) for the arrest mechanic, and the evidence generation rules are directly modified by piece 10 (killer-gameplay) skill/item configurations.
