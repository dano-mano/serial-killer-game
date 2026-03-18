---
vision: killer-vs-fed-roguelite
sequence: "12"
name: killer-content
group: Gameplay
group_order: 4
status: pending
depends_on:
  - "08: ContentRegistry<T> with abilityRegistry, weaponRegistry, itemRegistry, skillRegistry, trophyRegistry instances; Effect union type; _register-all.ts scaffold"
  - "11: KillerRole, KillerAbilityId type, KillMethod type, DisposalMethod type, killer constants — content data files reference these types"
produces:
  - "Killer Stealth skill tree data at packages/shared/src/data/skills/killer-stealth.ts — K-S1 through K-S10 (10 skills)"
  - "Killer Brutality skill tree data at packages/shared/src/data/skills/killer-brutality.ts — K-B1 through K-B10 (10 skills)"
  - "Killer Deception skill tree data at packages/shared/src/data/skills/killer-deception.ts — K-D1 through K-D10 (10 skills, counter-play)"
  - "Killer abilities data at packages/shared/src/data/abilities/killer-abilities.ts — KA-1 through KA-12 with rank progressions"
  - "Killer weapons data at packages/shared/src/data/weapons/killer-weapons.ts — 13 weapons across 7 categories"
  - "Killer items data at packages/shared/src/data/items/killer-items.ts — 8 tool/consumable definitions"
  - "Killer boss items data at packages/shared/src/data/boss-items/killer-boss-items.ts — KB-1 through KB-7 MYTHIC items"
  - "Killer boss item custom handlers at packages/game-engine/src/effects/killer-boss-item-handlers.ts — 7 custom effect handlers"
  - "Killer crafting recipes data at packages/shared/src/data/crafting/killer-recipes.ts — KR-1 through KR-10"
  - "Workshop UI page at apps/web/src/app/progression/workshop/page.tsx — Killer crafting page (The Workshop)"
  - "Boot registration additions — killer content registered in _register-all.ts"
created: 2026-03-18
last_aligned: v1.2.0
---

# Vision Piece 12: Killer Content

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: content-architecture, killer-core-mechanics

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Create all the content data for the killer role: three ranked skill trees with 10 skills each, 12 active abilities with rank progressions, 13 weapons, 8 tools, 7 MYTHIC boss items with unique mechanics, and 10 crafting recipes for The Workshop. This piece also creates the Workshop UI page where the killer modifies their equipment between runs.

All content is defined as typed data objects registered in content registries at boot — no engine code changes are needed when adding new entries to existing categories.

### Dependency Context (Inline)

**Content architecture** provides the generic ContentRegistry class with typed registry instances (abilityRegistry, weaponRegistry, itemRegistry, skillRegistry), the universal Effect type union covering all game mechanics, and the boot registration scaffold that this piece extends. Every data object created here is validated at registration time against a Zod schema.

**Killer core mechanics** provides the KillerAbilityId union type (used in ability data entries to reference the correct ability slot), KillMethod and DisposalMethod types (used in kill method evidence profiles), and the killer constants that data entries reference for consistency.

### Skill Trees

The killer has three skill trees with 10 skills each. Core trees (Stealth, Brutality) use a 0.8x cost multiplier. The Deception counter-play tree uses a 1.3x cost multiplier. Tier progression: Tier N requires at least 2 skills from Tier N-1 before unlocking.

Base skill costs per rank: R1 = 2 blood marks, R2 = 4 blood marks, R3 = 7 blood marks + 1 ghost token, R4 = 12 blood marks + 2 ghost tokens, R5 = 18 blood marks + 4 ghost tokens. Core tree multiplier (0.8x) makes early investment accessible. Counter-play multiplier (1.3x) reflects that these abilities directly affect the opponent's experience.

Rank progression uses diminishing returns: effectiveValue = baseValue × rank × (1 / (1 + 0.15 × (rank − 1))). This ensures rank 1 is the best value-per-material, encouraging breadth over depth.

**Stealth tree**: Shadow Steps (footprint reduction, move speed), Soft Landing (fall/jump noise reduction), Peripheral Awareness (NPC detection warning radius), Quiet Killer (stealth kill noise reduction), Blend In (heat decay when stationary), Ghost Presence (NPC awareness radius reduction), Vanishing Act (unlocks Smoke Bomb ability), Shadow Dash (short-range dash with no footprints at rank 5), Invisible Predator (disguise longevity), Perfect Shadow (capstone — unlocks 15-second full invisibility with 4-minute cooldown).

**Brutality tree**: Iron Grip (melee damage flat bonus), Lethal Efficiency (kill animation speed), Tough Skin (damage taken reduction), Clean Strike (combat kills generate less DNA), Efficient Disposal (disposal time reduction), Bone Breaker (stun duration, targets cannot call for help), Quick Disposal (unlocks instant body concealment ability), Combat Frenzy (post-kill attack speed buff), Unstoppable (stun immunity after taking damage), Apex Predator (capstone — passive health regen in combat, all kill methods -1 second, boss targets start at 90% HP).

**Deception tree**: Evidence Awareness (killer sees own evidence trail, age at rank 5), Witness Reader (see NPC alert states, informants visible at rank 3), Cleanup Specialist (evidence cleanup radius and speed), Fake Evidence Plant (unlocks ability, quality scales with rank), Decoy Trail (unlocks ability, footprint count and duration scale with rank), Witness Intimidation (unlocks ability, range scales with rank), Surveillance Jamming (unlocks ability, duration scales with rank, fake feed at rank 5), False Alibi Construction (unlocks ability, detection chance decreases with rank), Master Forger (fake evidence starts higher quality, extended decay, immune to passive detection), Phantom Identity (capstone — once-per-run ability to frame an innocent NPC with complete false evidence package).

Counter-play tree visually distinct: dark background, red accent border on skill nodes and tree frame.

### Active Abilities

Twelve abilities with up to 5 ranks each. Five default (available from run start): Silent Movement, Lockpick, Disguise Change, Evidence Cleanup, Distraction Throw. Seven unlocked via skill tree: Smoke Bomb (K-S7), Quick Disposal (K-B7), Fake Evidence Plant (K-D4), Decoy Trail (K-D5), Witness Intimidation (K-D6), Surveillance Jamming (K-D7), False Alibi Construction (K-D8).

Rank progression extends range, reduces cooldown, or adds secondary effects without changing the fundamental mechanic. All ability ranks are defined in the data file as arrays of Effect objects.

### Weapons Catalog (13 Weapons)

Across 7 categories: blades (Kitchen Knife COMMON, Serrated Knife UNCOMMON, Surgical Scalpel RARE), blunt weapons (Lead Pipe COMMON, Baseball Bat UNCOMMON), garrotes (Piano Wire UNCOMMON, Professional Garrote RARE), ranged (Silenced Pistol RARE, Compact Crossbow RARE), poison (Poison Vial RARE, Fast-Acting Toxin LEGENDARY), Taser UNCOMMON, and Pipe Bomb LEGENDARY.

Each weapon specifies kill method, damage value, noise radius, rarity, and any status effect applied on hit. Registered in weaponRegistry at boot.

### Killer Tools (8 Items)

Lockpick Set, Cleaning Supplies (stackable x3), Disguise Kit (stackable x2), Shovel, Acid Jar (black market), Noise Maker (stackable x5), Smoke Canister (stackable x2), Bribery Gift (black market). Registered in itemRegistry at boot.

### MYTHIC Boss Items (7)

Seven unique items obtainable through specific challenges. Each requires one-time ghost token attunement (5 tokens) before equipping. Each uses a custom effect handler for behavior that cannot be expressed by standard Effect types.

- **Reaper's Thread** (Garrote): After strangulation kill, creates a 128px death zone for 10 seconds — evidence decays 5x faster, fed scan accuracy -30% inside zone. Handler: `reapers_thread_kill_zone`. Obtain: defeat "The Watcher" boss on Hard using only strangulation.
- **Phantom Blade** (Blade): Kills make the body invisible to NPCs and fed scan for 20 seconds, then body reappears. Handler: `phantom_blade_ethereal_kill`. Obtain: score 10,000+ in a single killer win.
- **The Puppeteer's Strings** (Accessory): Once per run, a killed NPC continues their patrol route for 60 seconds before collapsing. Witnesses see normal NPC behavior. Handler: `puppeteer_dead_npc`. Obtain: win 5 runs with zero NPCs in ALARMED state.
- **Crimson Catalyst** (Tool): Each kill within 60 seconds of the previous grants a stacking bloodlust buff (+8% move speed, +5% attack speed, -10% noise per stack, max 3). Handler: `crimson_catalyst_bloodlust`. Obtain: eliminate 4 targets in a single run within 3 minutes.
- **The Hollow Mask** (Armor): While disguised, NPC close inspections always pass. Crimes witnessed while disguised reduce heat -15 instead of increasing it. Zero armor stats. Handler: `hollow_mask_disguise_master`. Obtain: complete 3 biomes using only disguise-based kills.
- **Nightfall Cloak** (Armor): During night phases, detection radius -40% extra and footprint evidence quality drops 2 tiers. No effect during day phases. Handler: `nightfall_cloak_night_power`. Obtain: win 3 runs with all kills during night phases.
- **Memento Mori** (Accessory): After each kill, 5-second "collect trophy" animation grants permanent +3% to all stat bonuses for the run (max 5). At 5 trophies, grants one-time 10-second INVISIBILITY. Handler: `memento_mori_collect`. Obtain: win 10 runs with maximum score (all optional objectives completed).

### Crafting Recipes — The Workshop (10 Recipes)

The Workshop is the killer's equipment modification page. Tier 1 recipes available by default. Tier 2 gated by skill rank. Tier 3 gated by achievement/trophy.

Tier 1 (default, no gate): Whetstone Edge (blade damage +3 flat), Weighted Handle (blunt damage +2 flat plus 500ms stun on kill), Reinforced Padding (max health +10 flat), Silent Soles (noise generation -5%).

Tier 2 (skill-gated): Serrated Filing (bleed on hit for blades — unlock K-B1 rank 3), Toxin Coating (poison on hit for blades and garrotes — unlock K-B4 rank 2), Shadow Lining (NPC detection radius -8% for armor — unlock K-S6 rank 2), Quick-Release Sheath (kill animation speed +10% for all weapons — unlock K-B2 rank 3).

Tier 3 (achievement-gated): Evidence-Dissolving Compound (blade kills generate 15% less DNA — requires Clean Hands trophy), Phantom Grip (garrote kills generate 90% less noise and 30% less evidence — requires K-S10 capstone unlocked, uses custom handler).

All recipe effects use the standard Effect type system. Tier 3's Phantom Grip uses one custom handler registered in the crafting handlers file. All crafting bonuses count toward global stat caps.

### Edge Cases

- Skill tree prerequisites form a chain — the unlock resolver validates the full chain server-side on every unlock attempt
- Counter-play abilities (KA-8 through KA-12) are locked by default; they only appear in the HUD after their tree skill reaches the required rank
- MYTHIC boss items use CUSTOM effect handlers — if the handler is not registered in the EffectProcessor at game boot, the effect logs a warning and is skipped
- Phantom Identity (K-D10 capstone) requires all three counter-play consumables — if any is missing, the ability fails with a clear error message
- The Deception tree's visual treatment (dark background, red accent border) is applied at the component level, not the data level — data entries have a `branchType: 'COUNTER_PLAY'` flag that the component reads

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

All content data lives in `packages/shared/src/data/`. Each file exports a typed const array. The `_register-all.ts` scaffold (from the content architecture system) is extended to import these files and call `registerAll()` on each registry. No game engine code changes are required for new entries to existing content types.

Boss item custom handlers live in `packages/game-engine/src/effects/killer-boss-item-handlers.ts`. They are registered with the EffectProcessor during game initialization.

### File Organization

```
packages/shared/src/data/
  skills/
    killer-stealth.ts     # K-S1 through K-S10
    killer-brutality.ts   # K-B1 through K-B10
    killer-deception.ts   # K-D1 through K-D10
  abilities/
    killer-abilities.ts   # KA-1 through KA-12, all rank Effect arrays
  weapons/
    killer-weapons.ts     # 13 killer weapons
  items/
    killer-items.ts       # 8 killer tool/consumable definitions
  boss-items/
    killer-boss-items.ts  # KB-1 through KB-7 (MYTHIC)
  crafting/
    killer-recipes.ts     # KR-1 through KR-10

packages/game-engine/src/effects/
  killer-boss-item-handlers.ts  # 7 custom handlers

apps/web/src/app/progression/
  workshop/page.tsx       # Killer crafting page (The Workshop)
```

### Skill Tree Data Structure

Each skill entry conforms to the `SkillDef` type validated by `skillDefSchema` from the content architecture system:

```typescript
// packages/shared/src/data/skills/killer-stealth.ts
export const KILLER_STEALTH_SKILLS: SkillDef[] = [
  {
    id: 'K-S1',
    treeId: 'killer-stealth',
    name: 'Shadow Steps',
    description: 'Reduces footprint generation and increases move speed.',
    tier: 1,
    maxRank: 5,
    prerequisites: [],
    costPerRank: [
      { bloodMarks: Math.round(2 * 0.8), ghostTokens: 0 },   // R1
      { bloodMarks: Math.round(4 * 0.8), ghostTokens: 0 },   // R2
      { bloodMarks: Math.round(7 * 0.8), ghostTokens: 1 },   // R3
      { bloodMarks: Math.round(12 * 0.8), ghostTokens: 2 },  // R4
      { bloodMarks: Math.round(18 * 0.8), ghostTokens: 4 },  // R5
    ],
    rankEffects: [
      // Rank 1 total effect (not incremental):
      [{ type: 'STAT_MOD', stat: 'footprintRate', value: -0.08, modType: 'PERCENT' }, { type: 'STAT_MOD', stat: 'moveSpeed', value: 0.03, modType: 'PERCENT' }],
      // Rank 2 total effect:
      [{ type: 'STAT_MOD', stat: 'footprintRate', value: -0.14, modType: 'PERCENT' }, { type: 'STAT_MOD', stat: 'moveSpeed', value: 0.05, modType: 'PERCENT' }],
      // ... ranks 3-5
    ],
    iconKey: 'skill_shadow_steps',
    gridX: 0, gridY: 0,
  },
  // ...K-S2 through K-S10
];
```

Key detail: `rankEffects` stores TOTAL effects at each rank (not incremental). This prevents floating-point accumulation when reading effective values.

### Ability Data Structure

```typescript
// packages/shared/src/data/abilities/killer-abilities.ts
export const KILLER_ABILITIES: AbilityDef[] = [
  {
    id: 'SILENT_MOVEMENT',
    name: 'Silent Movement',
    description: 'Toggle stealth mode, reducing footprints and noise.',
    role: 'KILLER',
    tier: 1,
    isDefault: true,
    cooldownMs: 0,  // toggle
    resourceCost: 1,  // stamina per second while active
    rankEffects: [
      [{ type: 'STAT_MOD', stat: 'noiseGeneration', value: -0.30, modType: 'PERCENT' }],  // R1
      [{ type: 'STAT_MOD', stat: 'noiseGeneration', value: -0.38, modType: 'PERCENT' }, { type: 'STAT_MOD', stat: 'staminaRegenRate', value: -0.15, modType: 'PERCENT' }],  // R3
      // ranks 4-5
    ],
    iconKey: 'ability_silent_movement',
  },
  // KA-2 through KA-12...
];
```

Counter-play abilities (KA-8 through KA-12) include `unlockCondition: { treeSkillId: 'K-D4', minRank: 1 }` (or their respective unlock skill). The ABILITY_UNLOCK effect in the corresponding tree skill triggers the unlock.

### Boss Item Data and Handler Structure

```typescript
// packages/shared/src/data/boss-items/killer-boss-items.ts
export const KILLER_BOSS_ITEMS: ItemDef[] = [
  {
    id: 'KB-1',
    name: "Reaper's Thread",
    rarity: 'MYTHIC',
    slot: 'WEAPON',
    weaponCategory: 'GARROTE',
    damage: 10,
    effects: [{ type: 'CUSTOM', handler: 'reapers_thread_kill_zone', params: { radius: 128, duration: 10000, evidenceDecayMultiplier: 5, fedScanReduction: 0.30 } }],
    obtainCondition: { type: 'BOSS_KILL_METHOD', bossId: 'the_watcher', difficulty: 'HARD', killMethod: 'STRANGULATION' },
    attunementCost: 5,  // ghost tokens
    iconKey: 'item_reapers_thread',
  },
  // KB-2 through KB-7...
];
```

```typescript
// packages/game-engine/src/effects/killer-boss-item-handlers.ts
import type { CustomEffectHandler } from './effect-processor';

export const KILLER_BOSS_ITEM_HANDLERS: Record<string, CustomEffectHandler> = {
  reapers_thread_kill_zone: (params, sourceId, targetId, context) => {
    const radius = params.radius as number;
    const duration = params.duration as number;
    // Create timed decay zone at targetId's current position
    context.evidenceManager.createDecayZone(context.pos, radius, duration, params.evidenceDecayMultiplier as number);
    // Apply scan reduction to fed entering zone
    context.surveillanceSystem.addZoneScanDebuff(context.pos, radius, duration, params.fedScanReduction as number);
  },
  phantom_blade_ethereal_kill: (params, sourceId, targetId, context) => {
    // Mark body as invisible for duration
    context.entityManager.setEtherealState(targetId, params.duration as number);
  },
  // ... 5 more handlers
};
```

### Crafting Recipe Data Structure

```typescript
// packages/shared/src/data/crafting/killer-recipes.ts
export const KILLER_RECIPES: CraftingRecipeDef[] = [
  {
    id: 'KR-1',
    name: 'Whetstone Edge',
    role: 'KILLER',
    tier: 1,
    category: 'BLADE_MOD',
    effects: [{ type: 'STAT_MOD', stat: 'meleeDamage', value: 3, modType: 'FLAT' }],
    materialCosts: [{ materialType: 'blood_marks', amount: 8 }, { materialType: 'salvage_parts', amount: 2 }],
    unlockCondition: { type: 'DEFAULT' },
    compatibleSlots: ['WEAPON'],
    compatibleCategories: ['BLADE'],
    iconKey: 'recipe_whetstone_edge',
  },
  // KR-2 through KR-10...
];
```

### Boot Registration Extension

Extend `packages/shared/src/data/_register-all.ts` to include killer content:

```typescript
import { KILLER_STEALTH_SKILLS, KILLER_BRUTALITY_SKILLS, KILLER_DECEPTION_SKILLS } from './skills/killer-stealth';
// ... other imports

export function registerAllContent(): void {
  // Piece 08 registrations (status effects, damage types) — already here
  statusEffectRegistry.registerAll([...]);
  damageTypeRegistry.registerAll([...]);

  // Piece 12 additions:
  skillRegistry.registerAll([...KILLER_STEALTH_SKILLS, ...KILLER_BRUTALITY_SKILLS, ...KILLER_DECEPTION_SKILLS]);
  abilityRegistry.registerAll(KILLER_ABILITIES);
  weaponRegistry.registerAll(KILLER_WEAPONS);
  itemRegistry.registerAll(KILLER_ITEMS);
  itemRegistry.registerAll(KILLER_BOSS_ITEMS);  // MYTHIC items register with same registry
  // craftingRecipeRegistry added by the progression content piece; killer-recipes.ts imported there
}
```

Note: `craftingRecipeRegistry` is defined in the progression infrastructure piece (as it requires progression DB infrastructure). The killer-recipes.ts file is created here; the registration happens in the progression infrastructure's `registerAllContent()` extension.

### Workshop UI Page

**File**: `apps/web/src/app/progression/workshop/page.tsx`

Server Component. Fetches the killer's equipment collection and applied mods from the DAL. Renders a shared `CraftingStation` component with killer-specific theming (dark, utilitarian workbench aesthetic — tool marks, dark metal UI elements). User flow: select owned equipment piece, see its upgrade slots, browse compatible recipes, review material costs, confirm application via `apply-mod.ts` Server Action. Uses `RecipeList`, `RecipeCard`, `ModSlotViewer`, and `DismantleConfirm` components from the progression content piece.

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| TypeScript | 5.9.3 | Strict types, all data entries validated against Zod schemas from the content architecture system |
| Zod | latest | Schema validation at registration time |
| Vitest | 4.1.0 | Boot test verifies registration counts |

### Testing Strategy

- Boot test extension: `skillRegistry` has 30 killer skills, `abilityRegistry` has 12 killer abilities, `weaponRegistry` has 13 killer weapons
- Unit tests for each boss item custom handler: verify correct system calls, correct parameter passing
- Unit tests for crafting recipe Effect arrays: correct stat IDs, correct values, correct modType
- Unit tests for skill rank effects: rank 5 total effects do not exceed STAT_CAPS for any modified stat

### Constitution Compliance

- [x] No barrel files — all imports direct to specific files
- [x] All content validated via Zod schemas from the content architecture system at registration time
- [x] No hardcoded stat logic — all effects expressed as Effect objects
- [x] Counter-play tree flagged with `branchType: 'COUNTER_PLAY'` in data — visual treatment controlled by component

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

- `packages/shared/src/data/skills/killer-stealth.ts` (K-S1 through K-S10)
- `packages/shared/src/data/skills/killer-brutality.ts` (K-B1 through K-B10)
- `packages/shared/src/data/skills/killer-deception.ts` (K-D1 through K-D10)
- `packages/shared/src/data/abilities/killer-abilities.ts` (KA-1 through KA-12)
- `packages/shared/src/data/weapons/killer-weapons.ts` (13 weapons)
- `packages/shared/src/data/items/killer-items.ts` (8 tools)
- `packages/shared/src/data/boss-items/killer-boss-items.ts` (KB-1 through KB-7)
- `packages/game-engine/src/effects/killer-boss-item-handlers.ts` (7 custom handlers)
- `packages/shared/src/data/crafting/killer-recipes.ts` (KR-1 through KR-10)
- `apps/web/src/app/progression/workshop/page.tsx`

### Dependencies (Consumed from Earlier Pieces)

**From piece 08 (Content Architecture)**:
- `ContentRegistry` instances: `skillRegistry`, `abilityRegistry`, `weaponRegistry`, `itemRegistry` from `packages/shared/src/registry/registries`
- `Effect` union type and `StatId`: `packages/shared/src/effects/effect-types`
- `STAT_CAPS`: `packages/shared/src/constants/balance` — rank 5 effects must not exceed caps
- Zod schemas: `skillDefSchema`, `abilityDefSchema`, `weaponDefSchema`, `itemDefSchema` from `packages/shared/src/schemas/content`
- `_register-all.ts` scaffold at `packages/shared/src/data/_register-all.ts` — this piece extends it

**From piece 11 (Killer Core Mechanics)**:
- `KillerAbilityId` union type: `packages/shared/src/types/killer`
- `KillMethod`, `DisposalMethod` types
- `KillerTarget`, `StealthState` types referenced in data comments

### Success Criteria

- [ ] All 30 killer skills (10 per tree) registered in `skillRegistry` at boot without throwing
- [ ] All 12 killer abilities registered in `abilityRegistry`; counter-play abilities (KA-8 through KA-12) correctly gated by `unlockCondition`
- [ ] All 13 weapons registered in `weaponRegistry`; all damage values within STAT_CAPS
- [ ] All 7 MYTHIC boss items have custom handlers registered in `killer-boss-item-handlers.ts` matching the handler names in data
- [ ] Skill tree tier progression requires 2 skills from previous tier — prerequisites enforced in data entries
- [ ] Rank 5 effects for each skill do not violate STAT_CAPS (validated by unit test)
- [ ] Boot test counts: `skillRegistry` has at least 30 entries after piece 12 registration
- [ ] Workshop page renders equipment collection and compatible recipes for the killer's equipment

### Alignment Notes

This piece is SOLELY responsible for all killer-specific content data files. Piece 16/17 (persistent progression) must NOT re-declare these files. Piece 16 owns the database tables, DAL, and Server Actions; piece 17 owns trophy and equipment catalog data and registration.

The `boss-item-handlers.ts` file for killer content is `killer-boss-item-handlers.ts` — it is NOT the same as the legacy `boss-item-handlers.ts` referenced in the original piece 08. The fed equivalent is `fed-boss-item-handlers.ts` in piece 14. This split prevents merge conflicts when pieces 12 and 14 are built in parallel.

The crafting recipes file (`killer-recipes.ts`) is created here. Its registration with `craftingRecipeRegistry` happens in piece 17's extension of `_register-all.ts` (since `craftingRecipeRegistry` is defined in piece 16).
