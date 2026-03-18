---
vision: killer-vs-fed-roguelite
sequence: 09
name: evidence-system
group: Core Gameplay
group_order: 3
status: pending
depends_on:
  - project-scaffold
  - design-system
  - game-engine-bootstrap
  - world-and-maps
  - entity-and-npc-system
  - player-and-roles
  - combat-system
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

## Feature Specification

> **Usage**: Copy everything below this line through the next `---` separator, then
> paste after typing `/speckit.specify `

Implement the evidence and clue system that is the central asymmetric mechanic connecting killer and fed gameplay. Killer actions generate forensic traces (footprints, DNA, witness accounts, weapon marks, bodies). The fed discovers and interprets these traces to build a case. The system also implements counter-play abilities: the killer can actively plant false evidence and disrupt the investigation, while the fed can use off-the-books tactics to gather evidence faster but with consequences. Evidence quantity and quality determine whether an arrest is viable.

### Dependency Context (Inline)

This piece depends on outputs from earlier pieces. These are reproduced here in full so this document is self-contained:

**From project-scaffold**:
```
packages/shared/src/utils/result.ts:
  - ok<T>(value: T): Ok<T, never>
  - err<E>(error: E): Err<never, E>
  - type AppError = { code: string; message: string }
  - type ValidationError extends AppError
  - type DatabaseError extends AppError
apps/web/src/lib/logger/pino.ts — Pino singleton
apps/web/src/config/env.ts — Zod-validated env vars
```

**From design-system**:
```typescript
// apps/web/src/components/app/common/
// AppButton, AppCard, AppDialog, AppInput, AppToast — branded wrappers
// Tailwind v4 CSS custom properties available in all React components
```

**From game-engine-bootstrap**:
```typescript
// packages/game-engine/src/events/event-bus.ts
eventBus.emit<K>(event: K, payload: GameEvents[K]): void
eventBus.on<K>(event: K, handler: (payload: GameEvents[K]) => void): void
// apps/web/src/stores/game.ts — { isRunning, isPaused, currentScene }
// packages/shared/src/constants/game.ts — TICK_RATE
```

**From world-and-maps**:
```typescript
// packages/game-engine/src/world/zone-manager.ts
getZone(pos: Vec2): Zone | null
getZoneById(id: string): Zone | null
// packages/game-engine/src/world/tile-manager.ts
getTileAt(pos: Vec2): Tile | null
// packages/shared/src/types/biome.ts — Vec2, Zone, Tile, Biome
```

**From entity-and-npc-system**:
```typescript
// packages/game-engine/src/entities/npc.ts
class NPC extends BaseEntity {
  isWitness: boolean
  witnessLog: WitnessEvent[]
  canBeInterviewed: boolean
  getWitnessStatement(): WitnessStatement | null
}
type WitnessEvent = { eventType: string; pos: Vec2; timestamp: number; description: string }
type WitnessStatement = { npcId: string; events: WitnessEvent[]; reliability: number }
// packages/game-engine/src/entities/npc-spawner.ts
getNPCById(npcId: string): NPC | null
getAllNPCs(): NPC[]
// packages/game-engine/src/ai/perception.ts — registerSuspiciousEvent()
```

**From player-and-roles**:
```typescript
// packages/game-engine/src/player/player-actions.ts
type PlayerAction = { type: PlayerActionType; targetId?: string; pos?: Vec2; data?: Record<string, unknown> }
type PlayerActionType = 'INTERACT' | 'USE_ABILITY' | 'USE_ITEM' | ...
// packages/game-engine/src/player/inventory.ts — Inventory (evidence-modifying items)
// packages/shared/src/types/player.ts — PlayerRole
// packages/shared/src/types/inventory.ts — InventoryItem, ItemEffect
// apps/web/src/stores/player.ts — player Zustand store (role determines evidence perspective)
// EventBus: PLAYER_ACTION, DAMAGE_DEALT (with witnesses[])
```

**From combat-system**:
```typescript
// packages/shared/src/types/combat.ts
type Attack = { id: string; attackerId: string; defenderId: string; damageType: DamageType; weaponId: string | null; pos: Vec2; timestamp: number }
// EventBus DAMAGE_DEALT: { attack: Attack; witnesses: string[] }
// EventBus ENTITY_DIED: { entityId: string; killedById: string; weapon: string | null; pos: Vec2; isPlayer: boolean }
```

### Evidence Types and State

**File**: `packages/shared/src/types/evidence.ts`

```typescript
type EvidenceType =
  | 'FOOTPRINT'           // killer walked through area; more visible on soft surfaces
  | 'DNA'                 // blood, skin cells; generated by wounds and violence
  | 'WEAPON_TRACE'        // marks left by weapons (blade marks, bullet casings)
  | 'BODY'                // victim's body; highest-value evidence, generates sub-clues
  | 'WITNESS'             // an NPC who saw something (links to WitnessStatement)
  | 'SURVEILLANCE'        // camera footage capturing the killer; requires camera in zone
  | 'BROKEN_LOCK'         // forced entry trace
  | 'DISTURBED_SCENE'     // overturned furniture, spilled items — signs of struggle
  | 'FALSE_EVIDENCE'      // planted by killer's counter-play abilities (FAKE — can be detected)
  | 'INFORMANT_REPORT'    // planted by fed's informant counter-play ability

type EvidenceState = 'HIDDEN' | 'DISCOVERABLE' | 'DISCOVERED' | 'DESTROYED' | 'DISCREDITED'
// DISCREDITED: fed discovered it was FALSE_EVIDENCE; no longer counts toward case

type EvidenceQuality = 'LOW' | 'MEDIUM' | 'HIGH' | 'IRREFUTABLE'
// Quality affects how much the evidence contributes to arrest viability score
// IRREFUTABLE: cannot be reduced below HIGH by any killer counter-play

type Evidence = {
  id: string
  type: EvidenceType
  state: EvidenceState
  quality: EvidenceQuality
  pos: Vec2
  zoneId: string
  linkedEntityId: string | null  // the NPC or player entity this evidence relates to
  generatedBy: string            // player action or event that created this
  generatedAt: number            // timestamp ms
  decayStartAt: number | null    // null = no decay; otherwise timestamp when decay started
  decayDurationMs: number | null
  isFalse: boolean               // true for counter-play planted evidence
  discoveredBy: string | null    // fed player ID if discovered
  discoveredAt: number | null
  notes: string                  // human-readable description for evidence log
}

type CaseFile = {
  runId: string
  fedPlayerId: string
  discoveredEvidence: Evidence[]
  witnessStatements: WitnessStatement[]
  suspectIds: string[]            // NPC IDs narrowed down as suspects
  arrestViability: number         // 0-100 score
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

**File**: `packages/shared/src/constants/evidence.ts`

```typescript
const EVIDENCE_GENERATION: Record<string, EvidenceGenerationRule[]>
// action type → array of evidence to generate

const EVIDENCE_DECAY_TIMERS: Record<EvidenceType, number | null> = {
  FOOTPRINT: 120_000,       // 2 minutes
  DNA: null,                // never decays (permanent forensic trace)
  WEAPON_TRACE: null,
  BODY: null,               // bodies don't decay during a run
  WITNESS: null,            // witnesses persist
  SURVEILLANCE: null,
  BROKEN_LOCK: null,
  DISTURBED_SCENE: 90_000,  // 1.5 minutes
  FALSE_EVIDENCE: null,     // planted evidence persists until detected
  INFORMANT_REPORT: null,
}

const EVIDENCE_QUALITY_WEIGHTS: Record<EvidenceType, EvidenceQuality> = {
  BODY: 'IRREFUTABLE',
  DNA: 'HIGH',
  SURVEILLANCE: 'HIGH',
  WITNESS: 'MEDIUM',   // modified by witness reliability
  WEAPON_TRACE: 'MEDIUM',
  FOOTPRINT: 'LOW',
  BROKEN_LOCK: 'LOW',
  DISTURBED_SCENE: 'LOW',
  FALSE_EVIDENCE: 'HIGH',   // initially appears HIGH quality — deception
  INFORMANT_REPORT: 'MEDIUM',
}

const ARREST_VIABILITY_THRESHOLDS: Record<ArrestViabilityTier, number> = {
  INSUFFICIENT: 0,
  WEAK: 20,
  MODERATE: 40,
  STRONG: 60,
  AIRTIGHT: 80,
}

const DISCOVERY_SEARCH_RADIUS_PX = 128   // base radius for proximity search
const EVIDENCE_SPATIAL_HASH_CELL_SIZE = 256
```

### Evidence Generator

**File**: `packages/game-engine/src/evidence/evidence-generator.ts`

Rules mapping game events and player actions to evidence objects. Subscribes to EventBus events:

```typescript
class EvidenceGenerator {
  constructor(evidenceManager: EvidenceManager, modifiers: EvidenceModifiers)
  // Called when PLAYER_ACTION event fires — generates evidence for relevant actions
  onPlayerAction(action: PlayerAction, role: PlayerRole, pos: Vec2): Evidence[]
  // Called when DAMAGE_DEALT event fires — generates violence-related evidence
  onDamageDealt(attack: Attack, witnesses: string[]): Evidence[]
  // Called when ENTITY_DIED event fires — generates body and related evidence
  onEntityDied(entityId: string, killedById: string, weapon: string | null, pos: Vec2): Evidence[]
  // Called when NPC perceives suspicious event — creates WITNESS evidence object
  onNPCWitnessEvent(npc: NPC, suspiciousEvent: SuspiciousEvent): Evidence | null
}

type EvidenceGenerationRule = {
  eventType: string       // action type or event type that triggers generation
  evidenceType: EvidenceType
  baseQuality: EvidenceQuality
  probability: number     // 0-1: chance this evidence is generated
  // position offset relative to action position
  positionOffset: Vec2
  conditions?: EvidenceCondition[]  // additional conditions required
}

type EvidenceCondition = {
  type: 'TILE_TYPE' | 'ZONE_HAS_CAMERA' | 'TIME_OF_DAY' | 'WEATHER'
  value: string | number
}

// Example generation rules:
// INTERACT (with target → kill): BODY (irrefutable), DNA (high), WEAPON_TRACE (medium)
// INTERACT (with lock → break in): BROKEN_LOCK (low), FOOTPRINT (low if soft floor)
// DAMAGE_DEALT (combat): DNA at impact pos (high), WEAPON_TRACE (medium)
// RUNNING: FOOTPRINT trail every 3 tiles (low quality)
```

### Evidence Modifiers

**File**: `packages/game-engine/src/evidence/evidence-modifiers.ts`

Tracks active modifiers from killer skills, items, and trophies. Applied during evidence generation to reduce quality or probability:

```typescript
class EvidenceModifiers {
  // Register a modifier from an equipped item, skill, or trophy
  addModifier(mod: EvidenceMod): void
  removeModifier(modId: string): void
  // Apply all active mods to a candidate evidence object; returns modified version or null (suppressed)
  applyToEvidence(candidate: Evidence): Evidence | null
  // Get current modifier summary for HUD display
  getModifierSummary(): EvidenceModSummary
}

type EvidenceMod = {
  id: string
  source: 'ITEM' | 'SKILL' | 'TROPHY' | 'ABILITY'
  name: string
  // Target which evidence types are affected (null = all types)
  targetTypes: EvidenceType[] | null
  // Probability reduction (0.5 = 50% less likely to generate)
  probabilityReduction: number
  // Quality downgrade steps (1 = HIGH becomes MEDIUM, 2 = HIGH becomes LOW)
  qualityDowngrade: number
}

type EvidenceModSummary = {
  totalReduction: Record<EvidenceType, number>  // aggregate probability reduction per type
  activeModCount: number
}
```

### Counter-Play Abilities

Counter-play is the strategic layer where each role actively undermines the other's objective. These abilities are gated behind skill tree progression and trophy unlocks (piece 13). Most powerful ones are Tier 2-3. All have risk/reward tradeoffs.

#### Killer Counter-Play Abilities

These abilities manipulate the evidence trail to mislead the fed:

**`FAKE_EVIDENCE_PLANT`** (Tier 2 skill, Deception tree)
- Killer places a `FALSE_EVIDENCE` object of chosen type (FOOTPRINT, DNA, WEAPON_TRACE) at a target position pointing toward an innocent NPC
- The evidence appears as `EvidenceQuality.HIGH` to the fed initially (indistinguishable from real)
- Detection: Fed can use forensic analysis ability (`FORENSIC_ANALYSIS`) to detect inconsistencies; detected FALSE_EVIDENCE is DISCREDITED and removed from arrest viability score
- Fed also has a passive chance (skill-modified) to notice false evidence during thorough examination
- Risk: If fed detects planted evidence, arrest viability is NOT penalized but killer is flagged as sophisticated (alert level increases)
- Implementation: `KillerAbility.FAKE_EVIDENCE_PLANT` → calls `EvidenceManager.plantFalseEvidence(type, pos, linkedNpcId)`

**`DECOY_TRAIL`** (Tier 2 skill, Deception tree)
- Creates a series of FOOTPRINT evidence objects in a path leading away from the kill site toward an innocent zone
- Costs 1 inventory item (disguise kit or consumable) per use
- Risk: Decoys are slightly lower quality than genuine footprints — a skilled fed with FORENSIC_ANALYSIS can tell the difference
- Implementation: Generates 5-8 FOOTPRINT objects with `isFalse: true` along a specified path

**`WITNESS_INTIMIDATION`** (Tier 1 skill, all Killer trees)
- Killer interacts with a specific NPC witness (proximity required) and silences them before the fed can interview
- Silenced NPC: `canBeInterviewed = false`, `witnessLog` is cleared
- Risk: If fed was already tracking that NPC (had proximity), the fed sees the NPC was "silenced" (logged as `DISTURBED_SCENE` evidence near the NPC's last known position)
- Risk: Using intimidation on the wrong NPC (one the fed hadn't found yet) wastes the action
- Implementation: `KillerAbility.WITNESS_INTIMIDATION` → calls `NPC.silenceAsWitness()` + emits `WITNESS_SILENCED` event

**`SURVEILLANCE_JAMMING`** (Tier 2 skill, Stealth tree)
- Disables surveillance cameras in a zone for a duration (default: 60 seconds)
- Prevents `SURVEILLANCE` evidence from being generated in that zone during the window
- Jammed cameras are visible to the fed (camera icon shows "offline") — fed knows someone jammed it
- Risk: Jammed camera is itself a clue that something happened in that zone
- Implementation: `KillerAbility.SURVEILLANCE_JAMMING` → calls `ZoneManager.jamCameras(zoneId, durationMs)`

**`FALSE_ALIBI_CONSTRUCTION`** (Tier 3 skill, Deception tree — highest tier counter-play)
- Killer interacts with a specific NPC to construct a false alibi event
- Creates a `FALSE_EVIDENCE` object of type `WITNESS` — appears as if that NPC "saw" the killer in a different location at the time of the kill
- Fed interviewing that NPC gets false location data
- Risk: High — if fed cross-references with real witness accounts that contradict the alibi, the false witness is DISCREDITED. Using on an NPC who already witnessed the crime is impossible (system checks `witnessLog`)
- Implementation: `KillerAbility.FALSE_ALIBI` → `EvidenceManager.plantFalseWitnessEvidence(npcId, alibiLocation, timestamp)`

#### Fed Counter-Play Abilities

These abilities accelerate or broaden evidence gathering, at the cost of legal or political consequences:

**`ILLEGAL_SURVEILLANCE`** (Tier 2 skill, Forensics tree)
- Fed accesses camera feeds for a zone without authorization (off-the-books)
- Instantly reveals all `SURVEILLANCE` evidence in that zone, bypassing normal discovery proximity
- Consequence: If the run ends with an arrest, evidence gathered via illegal surveillance is flagged — reduces final score bonus but does NOT affect arrest viability for gameplay purposes
- If killer's lawyer gets the evidence suppressed (flavor text outcome), score penalty applies
- Risk: If fed uses this too aggressively (>3 times in a run), receives a "reprimand" status — reduces arrest viability bonus from AIRTIGHT tier
- Implementation: `FedAbility.ILLEGAL_SURVEILLANCE` → `EvidenceManager.revealZoneSurveillance(zoneId, isIllegal: true)`

**`ROUGH_INTERROGATION`** (Tier 1 skill, Interrogation tree)
- Fed uses coercive tactics when interviewing an NPC witness — forces full WitnessStatement regardless of NPC reliability
- Effect: NPC reliability is overridden to 1.0 for this statement (full detail, no omissions)
- Consequence: Generates a `DISTURBED_SCENE` minor evidence trail at interrogation location (the NPC was roughed up — visible to the killer if they return to that area)
- Consequence: If used >2 times in a run, fed gets a "misconduct warning" — slight arrest viability cap reduction (max 90 instead of 100)
- Risk: NPC "breaks" under pressure and gives accurate but extreme information — if it was a false alibi planted by the killer, the false statement is delivered with 1.0 reliability, making it harder to detect
- Implementation: `FedAbility.ROUGH_INTERROGATION` → `WitnessSystem.forceInterview(npcId)` with reliability override

**`PLANTED_INFORMANTS`** (Tier 2 skill, Tactics tree)
- Fed converts a specific NPC into an active informant — they will report suspicious activity they witness to the fed automatically
- Effect: Creates an `INFORMANT_REPORT` evidence object whenever the informant NPC's perception system triggers
- Reports arrive as EventBus messages `INFORMANT_REPORT` with position and description
- Killer can detect that an NPC is an informant by observing them (looking at their route, noticing they "report" to a fixed spot) — this is a behavioral tell
- Risk: If killer intimidates or kills the informant, the informant's status becomes known to the fed via `WITNESS_SILENCED` event
- Max 2 active informants per run at Tier 2; Tier 3 allows 3
- Implementation: `FedAbility.PLANT_INFORMANT` → `NPCSpawner.convertToInformant(npcId)`

**`ENTRAPMENT_SETUP`** (Tier 3 skill, Tactics tree — highest tier fed counter-play)
- Fed stages a scenario to draw the killer out — places a fake "target" NPC in a location with high NPC traffic
- If the killer approaches and interacts with the fake target (proximity trigger), fed is alerted to killer's position
- Killer sees a normal NPC. Fed sees the NPC highlighted as "bait"
- Risk: Entrapment evidence is legally questionable — if killer is arrested and entrapment is the primary evidence, arrest viability score capped at MODERATE even with AIRTIGHT physical evidence
- Timing: Fed must be within 3 zones of the trap to receive the alert (otherwise signal degrades)
- Implementation: `FedAbility.ENTRAPMENT_SETUP` → `NPCSpawner.convertToEntrapmentBait(npcId, alertRadius)`

**`OFF_THE_BOOKS_FORENSICS`** (Tier 1 skill, Forensics tree)
- Fed processes evidence faster than standard protocol allows — reduces discovery time from evidence objects (instant discovery on approach vs slow scan animation)
- Evidence gathered is admissible but flagged as "expedited processing" — minor score reduction
- Consequence: None for arrest viability; score adjustment only
- Risk: If used on FALSE_EVIDENCE, the expedited processing reduces chance to detect it's false (false detection probability reduced by 50% while this is active)
- Implementation: `FedAbility.OFF_THE_BOOKS_FORENSICS` → discovery time multiplier 0.1 (10% of normal)

### Evidence Manager

**File**: `packages/game-engine/src/evidence/evidence-manager.ts`

Central store for all evidence objects. Uses spatial hashing for efficient proximity queries:

```typescript
class EvidenceManager {
  // Add new evidence to the map
  addEvidence(evidence: Evidence): void
  // Retrieve evidence near a position (within radius)
  getNearby(pos: Vec2, radius: number): Evidence[]
  // Fed discovers evidence (transitions HIDDEN/DISCOVERABLE → DISCOVERED)
  discover(evidenceId: string, discoveredBy: string): Evidence
  // Killer destroys evidence (transitions → DESTROYED)
  destroy(evidenceId: string): Result<void, NotFoundError>
  // Plant false evidence (killer counter-play)
  plantFalseEvidence(type: EvidenceType, pos: Vec2, linkedNpcId: string | null): Evidence
  // Plant false witness evidence (false alibi construction)
  plantFalseWitnessEvidence(npcId: string, alibiLocation: Vec2, timestamp: number): Evidence
  // Reveal all surveillance evidence in zone (fed illegal surveillance ability)
  revealZoneSurveillance(zoneId: string, isIllegal: boolean): Evidence[]
  // Get all evidence of a type in a zone
  getByZone(zoneId: string, type?: EvidenceType): Evidence[]
  // Tick decay timers, transition decayed evidence to DESTROYED
  update(delta: number): void
  // Discredit false evidence (fed detected a plant)
  discreditEvidence(evidenceId: string): void
}
```

### Discovery Mechanics

**File**: `packages/game-engine/src/evidence/discovery-mechanics.ts`

How the fed finds evidence:

```typescript
class DiscoveryMechanics {
  // Passive proximity: fed walking near DISCOVERABLE evidence triggers discovery
  // Radius: DISCOVERY_SEARCH_RADIUS_PX (modified by skills/items)
  checkProximityDiscovery(fedPos: Vec2, role: PlayerRole, modifiers: DiscoveryModifiers): Evidence[]
  // Active area scan ability: reveals all HIDDEN evidence in range instantly
  performAreaScan(fedPos: Vec2, radius: number): Evidence[]
  // Forensic analysis: examine specific evidence for higher detail + false evidence detection
  analyzeEvidence(evidenceId: string, skill: ForensicSkillLevel): ForensicAnalysisResult
  // Surveillance review: manually access camera footage for a zone
  reviewSurveillance(zoneId: string, isIllegal: boolean): Evidence[]
}

type DiscoveryModifiers = {
  radiusMultiplier: number       // skill-modified search radius
  hiddenDiscoveryChance: number  // chance to discover HIDDEN (normally requires ability)
  discoverySpeed: number         // multiplier for time-gated discovery (1.0 = normal)
  falsEvidenceDetectionChance: number  // chance to notice FALSE_EVIDENCE during analysis
}

type ForensicAnalysisResult = {
  evidence: Evidence
  additionalDetails: string        // richer description from analysis
  isFalseDetected: boolean         // true if false evidence was detected
  confidence: number               // 0-1 confidence in analysis result
}

type ForensicSkillLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
```

### Case File Tracker

**File**: `packages/game-engine/src/evidence/case-file.ts`

Aggregates all discovered evidence into a prosecutable case. Recalculated on every evidence discovery:

```typescript
class CaseFileTracker {
  computeCaseFile(
    runId: string,
    fedPlayerId: string,
    discoveredEvidence: Evidence[],
    witnessStatements: WitnessStatement[]
  ): CaseFile

  // Calculate arrest viability score 0-100 from evidence set
  // IRREFUTABLE: +25, HIGH: +15, MEDIUM: +8, LOW: +3
  // FALSE_EVIDENCE before discrediting: +15 (misleads calculation)
  // DISCREDITED evidence: -0 (removed from scoring)
  calculateArrestViability(evidence: Evidence[], statements: WitnessStatement[]): number

  // Derive suspect list from evidence chains
  // Starts with all NPCs + any behavioral observations, narrows based on evidence
  deriveSuspects(evidence: Evidence[], statements: WitnessStatement[], allNPCIds: string[]): string[]

  // Get tier from score
  getViabilityTier(score: number): ArrestViabilityTier
}
```

### Evidence Renderer

**File**: `packages/game-engine/src/evidence/evidence-renderer.ts`

Visual representation in the Phaser scene. Evidence objects are only visible when:
- Player role is FED (always visible to fed)
- Player role is KILLER and they are looking at their own generated evidence (stealth awareness feature — killer can see their own traces to clean them up)

```typescript
class EvidenceRenderer {
  // Renders evidence objects on a dedicated render layer above the map
  renderEvidence(scene: Phaser.Scene, evidence: Evidence[], playerRole: PlayerRole): void
  // Shows highlight ring when fed is near discoverable evidence
  showProximityHighlight(evidenceId: string): void
  // Shows "DISCOVERED" badge when evidence is found
  showDiscoveredMarker(evidenceId: string): void
  // Shows "FALSE" badge when evidence is discredited (visible only to fed)
  showDiscreditedMarker(evidenceId: string): void
  // Remove evidence visual when destroyed/discredited
  removeEvidenceVisual(evidenceId: string): void
}
```

### Evidence Zustand Store

**File**: `apps/web/src/stores/evidence.ts`

```typescript
type EvidenceStore = {
  // Fed-perspective: their discovered evidence and case file
  discoveredEvidence: Evidence[]
  caseFile: CaseFile | null
  arrestViability: number
  arrestViabilityTier: ArrestViabilityTier
  // Killer-perspective: their generated evidence trail (so killer knows what to clean up)
  generatedEvidence: Evidence[]    // populated for KILLER role only
  activeModifiers: EvidenceModSummary
  // Actions
  addDiscoveredEvidence: (evidence: Evidence) => void
  updateCaseFile: (caseFile: CaseFile) => void
  addGeneratedEvidence: (evidence: Evidence) => void
  removeGeneratedEvidence: (evidenceId: string) => void
  discreditEvidence: (evidenceId: string) => void
}
```

### Evidence HUD (Fed)

**File**: `apps/web/src/components/app/game/hud/EvidencePanel.tsx`

React component, "use client". Only rendered when player role is FED. Reads from `evidenceStore`:
- Case strength meter (visual arc/bar from 0-100, color-coded by tier)
- Evidence log: scrollable list of discovered evidence with type icon, quality badge, and brief note
- Evidence detail popup: click on evidence to see full description, location, associated suspect (if known)
- Arrest readiness indicator: prominent button becomes active at WEAK tier, glows at STRONG/AIRTIGHT
- False evidence indicators: DISCREDITED items shown crossed out in the log

### Evidence Schemas

**File**: `packages/shared/src/schemas/evidence.ts`

Zod schemas for server-side validation of evidence state in multiplayer:

```typescript
const evidenceSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['FOOTPRINT', 'DNA', 'WEAPON_TRACE', 'BODY', 'WITNESS', 'SURVEILLANCE', 'BROKEN_LOCK', 'DISTURBED_SCENE', 'FALSE_EVIDENCE', 'INFORMANT_REPORT']),
  state: z.enum(['HIDDEN', 'DISCOVERABLE', 'DISCOVERED', 'DESTROYED', 'DISCREDITED']),
  quality: z.enum(['LOW', 'MEDIUM', 'HIGH', 'IRREFUTABLE']),
  pos: z.object({ x: z.number(), y: z.number() }),
  zoneId: z.string(),
  generatedBy: z.string(),
  generatedAt: z.number(),
  isFalse: z.boolean(),
})

const caseFileSchema = z.object({
  runId: z.string().uuid(),
  fedPlayerId: z.string().uuid(),
  discoveredEvidence: z.array(evidenceSchema),
  arrestViability: z.number().min(0).max(100),
})
```

### Server-Side Evidence Validation

**File**: `apps/web/src/dal/evidence/validation.ts`

Server-only DAL for evidence state anti-cheat in multiplayer. Validates that:
1. Killer cannot submit a run with zero evidence generated (impossible if actions were taken)
2. Fed cannot fabricate evidence (evidence IDs must match server-known actions)
3. Arrest viability score matches the submitted evidence set (recalculated server-side)

```typescript
// Server-only (import 'server-only' at top of file)
async function validateRunEvidence(
  runId: string,
  submittedCaseFile: CaseFile,
  runActions: RunAction[]
): Promise<Result<ValidationReport, ValidationError>>

type ValidationReport = {
  isValid: boolean
  computedArrestViability: number
  discrepancies: string[]
}
```

### EventBus Integration

New events added to GameEvents:

```typescript
EVIDENCE_GENERATED: { evidence: Evidence; generatedBy: string }
EVIDENCE_DISCOVERED: { evidence: Evidence; discoveredBy: string; pos: Vec2 }
EVIDENCE_DESTROYED: { evidenceId: string; destroyedBy: string }
EVIDENCE_DISCREDITED: { evidenceId: string; detectedBy: string }
CASE_FILE_UPDATED: { caseFile: CaseFile }
ARREST_VIABLE: { tier: ArrestViabilityTier; viabilityScore: number }
WITNESS_SILENCED: { npcId: string; pos: Vec2 }  // killer used intimidation
INFORMANT_REPORT: { npcId: string; pos: Vec2; description: string }  // fed planted informant
ENTRAPMENT_TRIGGERED: { npcId: string; killerPos: Vec2 }  // fed entrapment bait activated
SURVEILLANCE_JAMMED: { zoneId: string; durationMs: number }
FALSE_EVIDENCE_PLANTED: { evidenceId: string; type: EvidenceType; pos: Vec2 }  // killer perspective only
```

### Edge Cases

- Evidence placed by killer's `FAKE_EVIDENCE_PLANT` must be indistinguishable from real evidence in all visual and data representations; only `ForensicAnalysisResult.isFalseDetected` and the internal `Evidence.isFalse` flag distinguish them
- Fed using `ROUGH_INTERROGATION` on an already-intimidated witness (canBeInterviewed = false) returns empty result — the NPC cannot be forced to remember what was erased
- If killer destroys evidence that the fed had already discovered (already in fed's `discoveredEvidence` list), the in-memory evidence is marked DESTROYED but it remains in the case file — you can't un-ring that bell
- `SURVEILLANCE_JAMMING` applied after fed already collected SURVEILLANCE evidence does not retroactively remove it
- Spatial hash must be updated when evidence is added, destroyed, or moved — movement does not normally occur but false evidence can be "relocated" by edge cases
- `FALSE_EVIDENCE` of type WITNESS must reference a real NPC ID to be plausible — system validates the NPC exists in the run before allowing plant

---

## Planning Guidance

> **Usage**: Copy everything below this line through the next `---` separator, then
> paste after typing `/speckit.plan `

### Architecture Approach

The evidence system is entirely passive from the killer's perspective (evidence is generated automatically by their actions via EventBus listeners) and active from the fed's perspective (fed must physically explore and trigger discovery mechanics).

Counter-play abilities are implemented as PlayerAbility objects that call EvidenceManager and NPC methods directly — no new evidence systems needed. The ability system (piece 08) handles cooldowns and resource costs; evidence methods implement the actual effect.

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

---

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
