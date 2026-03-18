---
vision: killer-vs-fed-roguelite
sequence: "11b"
name: fed-content
group: Gameplay
group_order: 4
status: pending
depends_on:
  - "08a: ContentRegistry<T> with abilityRegistry, weaponRegistry, itemRegistry, skillRegistry instances; Effect union type; _register-all.ts scaffold"
  - "11a: FedRole, FedObjective type, ArrestCondition type, FedRunState — content data files reference these types"
produces:
  - "Fed Forensics skill tree data at packages/shared/src/data/skills/fed-forensics.ts — F-F1 through F-F10 (10 skills)"
  - "Fed Interrogation skill tree data at packages/shared/src/data/skills/fed-interrogation.ts — F-I1 through F-I10 (10 skills, counter-play)"
  - "Fed Tactics skill tree data at packages/shared/src/data/skills/fed-tactics.ts — F-T1 through F-T10 (10 skills, counter-play)"
  - "Fed abilities data at packages/shared/src/data/abilities/fed-abilities.ts — FA-1 through FA-12 with rank progressions"
  - "Fed weapons data at packages/shared/src/data/weapons/fed-weapons.ts — 6 weapons across 3 categories"
  - "Fed tools data at packages/shared/src/data/items/fed-items.ts — 11 tool/consumable definitions"
  - "Fed boss items data at packages/shared/src/data/boss-items/fed-boss-items.ts — FB-1 through FB-7 MYTHIC items"
  - "Fed boss item custom handlers at packages/game-engine/src/effects/fed-boss-item-handlers.ts — 7 custom effect handlers"
  - "Fed crafting recipes data at packages/shared/src/data/crafting/fed-recipes.ts — FR-1 through FR-10"
  - "Armory UI page at apps/web/src/app/progression/armory/page.tsx — Fed crafting page (The Armory)"
  - "Boot registration additions — fed content registered in _register-all.ts"
created: 2026-03-18
last_aligned: never
---

# Vision Piece 11b: Fed Content

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: content-architecture, fed-core-mechanics

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Create all content data for the fed role: three ranked skill trees with 10 skills each, 12 active abilities with rank progressions, 6 weapons, 11 tools, 7 MYTHIC boss items with unique mechanics, and 10 crafting recipes for The Armory. This piece also creates the Armory UI page where the fed modifies their equipment between runs.

All content is defined as typed data objects registered in content registries at boot. The Armory is the fed's thematic counterpart to the killer's Workshop — institutionally styled, reflecting an agency equipment locker.

### Dependency Context (Inline)

**Content architecture** provides the generic ContentRegistry class with typed registry instances (abilityRegistry, weaponRegistry, itemRegistry, skillRegistry), the universal Effect type union, and the boot registration scaffold that this piece extends.

**Fed core mechanics** provides the fed's type definitions referenced in data entries: FedObjective, ArrestCondition, and the FedRunState fields that skill rank effects modify.

### Skill Trees

The fed has three skill trees with 10 skills each. The Forensics core tree uses a 0.8x cost multiplier. The Interrogation and Tactics counter-play trees use a 1.3x cost multiplier — counter-play abilities are earned privileges. Tier progression requires at least 2 skills from the previous tier.

**Forensics tree** (core, 0.8x cost): Sharp Eye (scan radius), Quick Scan (scan cooldown reduction), Evidence Preservation (evidence decay timer), Trace Analysis (quality upgrade speed), Pattern Recognition (passive fake evidence auto-flagging), Crime Scene Specialist (crime scene analysis bonus and hidden evidence reveal), Forensic Intuition (active forensic analysis fake evidence detection), Evidence Networking (same-type evidence auto-linking and suspect elimination), Forensic Expert (quality upgrades gain bonus tier, reconstruct destroyed evidence at rank 3), Master Analyst (capstone — scans reveal ALL evidence including hidden, passive fake detection on first examination, quality upgrades never fail).

**Interrogation tree** (counter-play, 1.3x cost): Silver Tongue (witness reliability bonus), Body Language Reader (interview reveals NPC suspicion level at accuracy scaling with rank), Off-Books Forensics (unlocks ability — discovery time acceleration at heat cost), Rough Interrogation (unlocks ability — forces high reliability at heat cost), Planted Informant (unlocks ability — NPC becomes automatic reporter), Network Builder (shared informant reporting and suspicion scoring), Illegal Surveillance (unlocks ability — bypasses jammed cameras at heat cost), Heat Management (counter-play heat costs reduction), Deep Cover Operations (informant immunity below suspicion threshold), Shadow Network (capstone — passive NPC reporting chance, stacking heat cost reduction).

**Tactics tree** (counter-play, 1.3x cost): Rapid Response (area lockdown cooldown reduction), Pursuit Training (move speed during active investigation), Zone Profiling (entering zones reveals evidence count and type breakdown), Entrapment Setup (unlocks ability — decoy NPC lures killer), Tactical Positioning (lockdown zone exit seal duration and map reveal), Predictive Analysis (HUD shows predicted zone for next kill), Ambush Specialist (directional indicator when sharing zone with killer), Evidence Cordon (unlocks ability — area where evidence cannot be destroyed), Clean Operation (Severe fedHeat threshold raised), Ghost Agent (capstone — counter-play evidence is admissible, heat accumulation reduced, once-per-run inadmissible retroactive fix).

Both counter-play trees are visually distinct: dark blue institutional background, official badge/seal accent border.

### Active Abilities

Twelve abilities. Seven default (available from run start): Enhanced Scan, Witness Compulsion, Forensic Analysis, Surveillance Access, Area Lockdown, Evidence Preservation, Profile Analysis. Five counter-play abilities unlocked via skill tree: Illegal Surveillance (F-I7), Rough Interrogation (F-I4), Planted Informant (F-I5), Entrapment Setup (F-T4), Off-Books Forensics (F-I3).

### Weapons Catalog (6 Weapons)

Across 3 categories: sidearms (Service Pistol COMMON, Upgraded Service Pistol UNCOMMON, Tactical Pistol RARE), melee (Telescopic Baton COMMON with non-lethal stun option, Stun Gun UNCOMMON applying ELECTROCUTION status), shield (Riot Shield RARE with +20% block reduction and movement speed penalty).

All weapons registered in weaponRegistry at boot.

### Fed Tools (11 Items)

Standard Forensic Kit (evidence quality +0.10 on examine), Advanced Forensic Kit (quality +0.25, reveals hidden evidence), Interview Badge (+15% witness reliability), Tracking Device (plants tracker on NPC revealing minimap position), Evidence Bags (prevents decay, stackable x5), Handcuffs (required for arrest animation — always in default loadout), Wiretap Kit (enables phone wiretap on zone — counter-play), Informant Badge (increases planted informant reliability +0.15 — counter-play), Entrapment Kit (decoy NPC lasts +60 seconds — counter-play), Off-Books Lab Kit (reduces forensic analysis time 80% — counter-play), Digital Evidence Collector (processes all evidence in zone instantly, half inadmissible — LEGENDARY).

Counter-play tools are RARE or higher and not in starting loadouts unless unlocked via equipment progression.

### MYTHIC Boss Items (7)

Seven unique items obtainable through specific challenges. Each requires one-time ghost token attunement (5 tokens). Each uses a custom effect handler for unique behavior.

- **The Lie Detector** (Tool): During interviews, activate "deep reading" (+10 fedHeat) to reveal whether witness was intimidated, whether testimony is about real or planted evidence, and exact suspicion scores per nearby NPC. Handler: `lie_detector_deep_read`. Obtain: identify killer correctly in 10 runs without false arrests.
- **Quantum Scanner** (Tool): Scan gains alt-fire quantum mode — pulses 360-degree across entire zone revealing all evidence, entities, and cameras for 5 seconds (180s cooldown). Evidence revealed is tagged QUANTUM_SCANNED with quality -1 tier. Handler: `quantum_scanner_pulse`. Obtain: discover 500 total evidence pieces.
- **The Profiler's Notebook** (Accessory): Passively tracks killer zone visit history. After 3+ evidence discoveries, generates a delayed zone-level heat map on the minimap (60-second delay from real-time, updated every 30s). Handler: `profiler_notebook_heatmap`. Obtain: win 15 runs as Fed with STRONG or better arrest viability.
- **Aegis Badge** (Armor): When fed takes damage, 25% chance to generate MEDIUM quality evidence at damage location. If health drops below 25%, all nearby cameras (2 zones) auto-activate for 30 seconds. Zero base armor stats. Handler: `aegis_badge_damage_evidence`. Obtain: win 5 runs where fed was attacked by killer but still won.
- **Chain of Command** (Accessory): Doubles max planted informants (requires FA-10 unlocked). All informants share intel — when one reports, all others gain doubled watch radius for 15 seconds. Handler: `chain_of_command_network`. Obtain: use Planted Informant in 25 different runs.
- **Forensic Resonance Lens** (Weapon — replaces sidearm): Non-lethal resonance weapon (5 damage). On hit applies "Forensic Tag" (60 seconds) — tagged entities leave a trail visible only to fed. If the tagged entity is the killer, all evidence they generate while tagged is auto-discovered at +1 quality tier. Handler: `forensic_resonance_tag`. Obtain: achieve 3 AIRTIGHT arrests.
- **The Archives** (Tool): Once per run, 15-second channel reveals: kill method used for most recent kill, approximate time since last kill (±30s accuracy), and one random trait of killer's loadout. Cannot move while channeling. Handler: `archives_consult`. Obtain: win 20 runs as Fed.

### Crafting Recipes — The Armory (10 Recipes)

Tier 1 (default): Improved Sights (sidearm damage +3 flat), Extended Mag (attack speed +8%), Tactical Vest Upgrade (max health +12 flat), Enhanced Lens Assembly (scan radius +5%).

Tier 2 (skill-gated): Trace Amplifier (evidence quality upgrade speed +10% — F-F4 rank 2), Reinforced Cuffs (arrest viability +3 flat — F-T4 rank 1), Scramble-Proof Radio (50% resistance to killer surveillance jamming — custom handler, F-I7 rank 2), Low-Light Optics (passive false evidence detection +5% — F-F5 rank 3).

Tier 3 (achievement-gated): Forensic Neural Link (15% chance to auto-tag entities touching evidence within 64px — custom handler, requires Master Detective trophy), Adaptive Armor Weave (+20 max health plus damage resistance stacks on hit up to 5 stacks at 3% each — custom handler, F-T9 unlocked).

All crafting bonuses count toward global stat caps.

### Edge Cases

- Counter-play abilities (FA-8 through FA-12) are locked by default; they only appear in the HUD slot after their tree skill reaches the required rank
- Interrogation and Tactics skill nodes visually distinguished with institutional blue accent theme
- The Profiler's Notebook reads from server-authoritative delayed data in multiplayer — it cannot be used for real-time position tracking
- Custom effect handlers for FR-7 (Scramble-Proof Radio), FR-9, and FR-10 must be registered in the EffectProcessor before any scene loads

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

All content data lives in `packages/shared/src/data/`. The `_register-all.ts` scaffold (from the content architecture system) is extended to include fed content. Fed boss item handlers live in `packages/game-engine/src/effects/fed-boss-item-handlers.ts`. This is explicitly a SEPARATE file from the killer's `killer-boss-item-handlers.ts` — they can be built in parallel without merge conflicts.

### File Organization

```
packages/shared/src/data/
  skills/
    fed-forensics.ts       # F-F1 through F-F10
    fed-interrogation.ts   # F-I1 through F-I10
    fed-tactics.ts         # F-T1 through F-T10
  abilities/
    fed-abilities.ts       # FA-1 through FA-12
  weapons/
    fed-weapons.ts         # 6 fed weapons
  items/
    fed-items.ts           # 11 fed tools/consumables
  boss-items/
    fed-boss-items.ts      # FB-1 through FB-7 (MYTHIC)
  crafting/
    fed-recipes.ts         # FR-1 through FR-10

packages/game-engine/src/effects/
  fed-boss-item-handlers.ts  # 7 custom handlers (separate file from killer handlers)

apps/web/src/app/progression/
  armory/page.tsx            # Fed crafting page (The Armory)
```

### Skill Tree Data Structure

Skill entries follow the `SkillDef` type (validated by `skillDefSchema` from the content architecture system). Counter-play trees have `branchType: 'COUNTER_PLAY'` which the UI uses to apply the institutional blue accent styling.

```typescript
// packages/shared/src/data/skills/fed-forensics.ts
export const FED_FORENSICS_SKILLS: SkillDef[] = [
  {
    id: 'F-F1',
    treeId: 'fed-forensics',
    name: 'Sharp Eye',
    description: 'Increases active scan discovery radius.',
    tier: 1,
    maxRank: 5,
    prerequisites: [],
    branchType: 'CORE',
    costMultiplier: 0.8,
    costPerRank: [
      { evidenceDust: Math.round(2 * 0.8), ghostTokens: 0 },   // R1
      { evidenceDust: Math.round(4 * 0.8), ghostTokens: 0 },   // R2
      { evidenceDust: Math.round(7 * 0.8), ghostTokens: 1 },   // R3
      { evidenceDust: Math.round(12 * 0.8), ghostTokens: 2 },  // R4
      { evidenceDust: Math.round(18 * 0.8), ghostTokens: 4 },  // R5
    ],
    rankEffects: [
      [{ type: 'SCAN_RADIUS_MOD', percent: 0.08 }],   // R1 total
      [{ type: 'SCAN_RADIUS_MOD', percent: 0.14 }],   // R2 total
      [{ type: 'SCAN_RADIUS_MOD', percent: 0.19 }],   // R3 total
      [{ type: 'SCAN_RADIUS_MOD', percent: 0.23 }],   // R4 total
      [{ type: 'SCAN_RADIUS_MOD', percent: 0.26 }],   // R5 total (cap: +40% all sources)
    ],
    iconKey: 'skill_sharp_eye',
    gridX: 0, gridY: 0,
  },
  // F-F2 through F-F10...
];
```

Counter-play ability unlock skills use `ABILITY_UNLOCK` Effect type:
```typescript
// F-I3 Off-Books Forensics (unlocks FA-12)
rankEffects: [
  [{ type: 'ABILITY_UNLOCK', abilityId: 'OFF_BOOKS_FORENSICS' }, { type: 'HEAT_COST_MOD', percent: -0.05 }],
  // ranks 2-5 improve ability rank
]
```

### Ability Data Structure

Counter-play abilities include heat cost defined as a parameter:
```typescript
// packages/shared/src/data/abilities/fed-abilities.ts
export const FED_ABILITIES: AbilityDef[] = [
  {
    id: 'FA-8',
    name: 'Illegal Surveillance',
    role: 'FED',
    tier: 3,
    isDefault: false,
    unlockCondition: { treeSkillId: 'F-I7', minRank: 1 },
    cooldownMs: 60000,
    rankEffects: [
      [{ type: 'HEAT_GENERATION_MOD', percent: 0.08 }, /* restore cameras 45s */],  // R1
      // ranks 2-5...
    ],
    heatCostPerRank: [8, 7, 6, 6, 5],
    iconKey: 'ability_illegal_surveillance',
  },
  // FA-1 through FA-7 (defaults), FA-9 through FA-12 (counter-play)...
];
```

### Boss Item Custom Handler Structure

```typescript
// packages/game-engine/src/effects/fed-boss-item-handlers.ts
import type { CustomEffectHandler } from './effect-processor';

export const FED_BOSS_ITEM_HANDLERS: Record<string, CustomEffectHandler> = {
  lie_detector_deep_read: (params, sourceId, targetId, context) => {
    // targetId = NPC being interviewed
    const npc = context.entityManager.getById(targetId);
    return {
      wasIntimidated: npc.wasIntimidated,
      testimonyType: npc.lastWitnessedEventType,
      suspicionScores: npc.suspicionScoresByNpc,
    };
  },
  quantum_scanner_pulse: (params, sourceId, targetId, context) => {
    const zoneEvidence = context.evidenceManager.getEvidenceInZone(context.pos);
    const zoneEntities = context.entityManager.getEntitiesInZone(context.pos);
    // Reveal all, tag with QUANTUM_SCANNED, reduce quality 1 tier
    for (const e of zoneEvidence) {
      context.evidenceManager.discover(e.id);
      context.evidenceManager.tagQuantumScanned(e.id);
    }
  },
  // ... 5 more handlers
};
```

### Crafting Recipe Data with Custom Handlers

```typescript
// packages/shared/src/data/crafting/fed-recipes.ts
export const FED_RECIPES: CraftingRecipeDef[] = [
  {
    id: 'FR-7',
    name: 'Scramble-Proof Radio',
    role: 'FED',
    tier: 2,
    category: 'TACTICAL_MOD',
    effects: [{ type: 'CUSTOM', handler: 'scramble_proof_resistance', params: { resistancePercent: 0.50 } }],
    materialCosts: [{ materialType: 'evidence_dust', amount: 14 }, { materialType: 'salvage_parts', amount: 3 }, { materialType: 'ghost_tokens', amount: 2 }],
    unlockCondition: { type: 'SKILL_RANK', skillId: 'F-I7', minRank: 2 },
    compatibleSlots: ['ACCESSORY'],
    compatibleCategories: [],
    iconKey: 'recipe_scramble_proof_radio',
  },
  // FR-1 through FR-6, FR-8 through FR-10
];
```

The custom handlers for crafting (Scramble-Proof Radio, Neural Link, Adaptive Armor) are registered in `packages/game-engine/src/effects/crafting-handlers.ts` (shared file defined by the progression infrastructure system or defined here and imported by that system).

### Boot Registration Extension

Extend `_register-all.ts` to include fed content (alongside killer content added by the killer content piece):

```typescript
// After killer registrations from 10b:
skillRegistry.registerAll([...FED_FORENSICS_SKILLS, ...FED_INTERROGATION_SKILLS, ...FED_TACTICS_SKILLS]);
abilityRegistry.registerAll(FED_ABILITIES);
weaponRegistry.registerAll(FED_WEAPONS);
itemRegistry.registerAll(FED_ITEMS);
itemRegistry.registerAll(FED_BOSS_ITEMS);
// Fed crafting recipes registered in the progression content piece (same as killer recipes)
```

### Armory UI Page

**File**: `apps/web/src/app/progression/armory/page.tsx`

Server Component. Fetches fed equipment and applied mods from the DAL. Renders the shared `CraftingStation` component with institutional styling (official equipment locker aesthetic — grey metal lockers, badge iconography, form fields styled as requisition orders). Functionally identical to the Workshop. User flow: select owned equipment, see upgrade slots, browse compatible recipes, confirm via `apply-mod.ts` Server Action.

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| TypeScript | 5.9.3 | Strict types, all data entries validated against Zod schemas |
| Zod | latest | Schema validation at registration time |
| Vitest | 4.1.0 | Boot test verifies registration counts |

### Testing Strategy

- Boot test extension: `skillRegistry` has 30 fed skills, `abilityRegistry` has 12 fed abilities, `weaponRegistry` has 6 fed weapons
- Unit tests for each boss item custom handler: verify correct system calls and parameter passing
- Unit tests for skill rank effects: rank 5 total effects do not exceed STAT_CAPS
- Unit tests for counter-play ability heat costs: correct heat cost per rank from data arrays

### Constitution Compliance

- [x] No barrel files — all imports direct to specific files
- [x] All content validated via Zod schemas from the content architecture system at registration time
- [x] No hardcoded stat logic — all effects expressed as Effect objects
- [x] Counter-play trees flagged with `branchType: 'COUNTER_PLAY'` in data
- [x] Fed boss item handlers in SEPARATE file (`fed-boss-item-handlers.ts`) — no merge conflicts with killer handlers

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

- `packages/shared/src/data/skills/fed-forensics.ts` (F-F1 through F-F10)
- `packages/shared/src/data/skills/fed-interrogation.ts` (F-I1 through F-I10)
- `packages/shared/src/data/skills/fed-tactics.ts` (F-T1 through F-T10)
- `packages/shared/src/data/abilities/fed-abilities.ts` (FA-1 through FA-12)
- `packages/shared/src/data/weapons/fed-weapons.ts` (6 weapons)
- `packages/shared/src/data/items/fed-items.ts` (11 tools)
- `packages/shared/src/data/boss-items/fed-boss-items.ts` (FB-1 through FB-7)
- `packages/game-engine/src/effects/fed-boss-item-handlers.ts` (7 custom handlers)
- `packages/shared/src/data/crafting/fed-recipes.ts` (FR-1 through FR-10)
- `apps/web/src/app/progression/armory/page.tsx`

### Dependencies (Consumed from Earlier Pieces)

**From piece 08a (Content Architecture)**:
- `ContentRegistry` instances: `skillRegistry`, `abilityRegistry`, `weaponRegistry`, `itemRegistry`
- `Effect` union type: `packages/shared/src/effects/effect-types`
- `STAT_CAPS`: ensure rank 5 effects do not exceed caps
- Zod schemas: `skillDefSchema`, `abilityDefSchema`, `weaponDefSchema`, `itemDefSchema`
- `_register-all.ts` scaffold — this piece extends it

**From piece 11a (Fed Core Mechanics)**:
- `ArrestCondition` type
- `FedRunState` fields modified by skill effects
- Fed EventBus event constants from `packages/shared/src/constants/events/fed`

### Success Criteria

- [ ] All 30 fed skills (10 per tree) registered in `skillRegistry` at boot without throwing
- [ ] All 12 fed abilities registered; counter-play abilities (FA-8 through FA-12) correctly gated by `unlockCondition`
- [ ] All 6 weapons registered; all damage values within STAT_CAPS
- [ ] All 7 MYTHIC boss items have custom handlers registered in `fed-boss-item-handlers.ts` matching data handler names
- [ ] Skill tree tier prerequisites enforced in data entries
- [ ] Rank 5 effects for each skill do not violate STAT_CAPS (validated by unit test)
- [ ] Boot test counts: `skillRegistry` has at least 60 entries after both 10b and 11b register
- [ ] Armory page renders equipment collection and compatible recipes for the fed's equipment

### Alignment Notes

This piece is SOLELY responsible for all fed-specific content data files. Piece 13 must NOT re-declare these files.

The `fed-boss-item-handlers.ts` file is separate from `killer-boss-item-handlers.ts` — this prevents merge conflicts when pieces 10b and 11b are built in parallel or in sequence.

The Profiler's Notebook (FB-3) handler reads from a server-authoritative time-delayed record of killer zone visits. In multiplayer (piece 14), this data is provided by the Supabase Realtime channel with a server-enforced 60-second delay. The handler must not read from any real-time position state.

Fed crafting recipes (`fed-recipes.ts`) are created here. Their registration with `craftingRecipeRegistry` happens in piece 13b's extension of `_register-all.ts` — same pattern as killer recipes.
