---
vision: killer-vs-fed-roguelite
sequence: "13b"
name: progression-content
group: Meta
group_order: 5
status: pending
depends_on:
  - "08a: ContentRegistry<T> instances (trophyRegistry, weaponRegistry, itemRegistry), Effect union type, StatId, STAT_CAPS, _register-all.ts scaffold"
  - "10b: Killer content data files (killer-boss-items.ts, killer-recipes.ts) available for registration; killer-recipes.ts created but craftingRecipeRegistry defined in 13a"
  - "11b: Fed content data files (fed-boss-items.ts, fed-recipes.ts) available for registration; fed-recipes.ts created but craftingRecipeRegistry defined in 13a"
  - "13a: DAL modules (trophies-dal.ts, equipment-dal.ts, loadouts-dal.ts, crafting-dal.ts), Server Actions (unlock-trophy.ts, equip-item.ts, save-loadout.ts, craft-item.ts, apply-mod.ts, remove-mod.ts, dismantle-equipment.ts), Progression Zustand store, Crafting Zustand store, craftingRecipeRegistry instance, user_trophy_unlocks/user_equipment/user_loadouts/user_equipment_mods/user_materials tables"
produces:
  - "Shared trophy catalog at packages/shared/src/data/trophies/shared-trophies.ts — ST-1 through ST-6 (6 shared trophies)"
  - "Killer trophy catalog at packages/shared/src/data/trophies/killer-trophies.ts — KT-1 through KT-18 (18 killer trophies)"
  - "Fed trophy catalog at packages/shared/src/data/trophies/fed-trophies.ts — FT-1 through FT-18 (18 fed trophies)"
  - "Equipment catalog at packages/shared/src/data/equipment/ — 24 equipment items across all rarities and roles"
  - "Crafting UI components at apps/web/src/components/app/progression/crafting/ — CraftingPanel, RecipeCard, ModSlotGrid, MaterialCostDisplay"
  - "Skill trees UI page at apps/web/src/app/progression/skills/page.tsx"
  - "Trophies UI page at apps/web/src/app/progression/trophies/page.tsx"
  - "Equipment UI page at apps/web/src/app/progression/equipment/page.tsx"
  - "Loadouts UI page at apps/web/src/app/progression/loadouts/page.tsx"
  - "Leaderboard page at apps/web/src/app/leaderboard/page.tsx"
  - "Progression layout at apps/web/src/app/progression/layout.tsx"
  - "Boot registration extensions — trophies + equipment + crafting recipes added to _register-all.ts"
created: 2026-03-18
last_aligned: never
---

# Vision Piece 13b: Progression Content

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: content-architecture, killer-content, fed-content, progression-infrastructure

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Build all the content data and user-facing pages for the meta-progression system: the full trophy catalog, equipment catalog, and all five progression UI pages where players view and manage their permanent unlocks between runs.

### Dependency Context (Inline)

**Content architecture** provides a generic content registry system that stores typed game content objects and validates them at boot. Every trophy and equipment item defined here is validated against a Zod schema when the application starts — any malformed entry causes a boot error. The content registry is the authoritative in-memory store for all game content definitions.

**Killer content** provides the killer role's boss items and crafting recipes that were created as data files in the killer content piece and are registered into the content registry by the boot registration extension created here.

**Fed content** provides the fed role's boss items and crafting recipes, likewise registered here.

**Progression infrastructure** provides the database tables, server-side data access layer, and server actions used by these UI pages. It also provides the crafting recipe registry instance, the progression Zustand store (holding trophy/equipment unlock state, material balances, saved loadouts), and the crafting Zustand store (holding recipe definitions and applied mods). The UI pages created here read from these stores and call the server actions provided by the progression infrastructure system — they do not own any server-side logic.

### Trophy Catalog

Trophies are persistent cosmetic and passive reward items. Every player starts with access to zero trophies. Each trophy is unlocked after meeting a specific run-based condition — a minimum score, a certain number of wins, a kill method, or a combination. Once unlocked, a trophy is permanently available. Players equip exactly one trophy per run using the loadout screen.

A trophy provides one of: a passive ability (persistent effect active during every run), a starting bonus (materials at run start, a hint, or a score multiplier), or a cosmetic change (character appearance, HUD skin, kill animation variant).

**Shared trophies** (6 items, available to both roles):
- Survivor's Medal — unlocked after completing 10 runs of any outcome. Passive: +5% score on any win.
- Iron Resolve — unlocked after abandoning 0 runs for 5 consecutive wins. Passive: all stat penalties from injuries reduced by 20%.
- Speed Runner's Tag — unlocked after completing a run under 8 minutes. Starting bonus: +10 evidence_dust.
- Perfectionist's Seal — unlocked after achieving a win with zero evidence left behind. Starting bonus: +1 ghost token.
- Veteran's Crest — unlocked after completing 50 total runs. Passive: material earn rates +10% across all types.
- Blood Moon Relic — unlocked after winning as both roles in the same calendar week. Passive: counter-play heat cost reduced by 5%.

**Killer trophies** (18 items, killer role only):
These range from early-game unlocks (first kill, completing a run with only knife kills) through mid-game achievements (5 consecutive stealth kills, perfect disposal with zero body collection fails) to late-game mastery items (completing a run without triggering any alerts, using every kill method in a single run, winning against a fed player with 5+ investigation skills equipped). Each killer trophy provides a passive stat boost or a starting item relevant to the killer's gameplay — stealth speed bonuses, kill animation time reductions, starting consumables (spare lockpick, decoy footprints), or score multipliers on specific kill conditions.

**Fed trophies** (18 items, fed role only):
Range from early unlocks (first arrest, completing a run using only forensic evidence) through mid-game milestones (arresting a target with 4+ witness testimonies, completing a run without any inadmissible evidence) to late-game mastery trophies (winning with 100% evidence admissibility, achieving vigilante justice on 3 targets in one run, arresting a killer mid-kill-animation). Each fed trophy provides stat bonuses relevant to investigation and arrest — evidence collection speed, witness reliability bonuses, interrogation duration reductions, or starting materials (spare case files, evidence markers).

### Equipment Catalog

Equipment items are slot-based unlockables worn by the player during a run. Each item occupies one of four equipment slots: Weapon, Armor, Tool, or Accessory. Players can equip one item per slot type in their loadout. Equipment items have rarities from Common through Mythic — higher rarity items have more upgrade slots (up to 3 for Mythic), more powerful base effects, and stricter unlock conditions.

Each equipment item defines:
- Slot type (which of the 4 slots it occupies)
- Role (killer-only, fed-only, or shared)
- Rarity (Common, Uncommon, Rare, Legendary, Mythic)
- Base effects (stat modifiers applied when equipped)
- Upgrade slot count (how many crafting mods can be applied; 1 for Common/Uncommon, 2 for Rare/Legendary, 3 for Mythic)
- Unlock condition (how the player earns this item)

**Shared equipment** (available to both roles):
- Deceiver's Kit (Accessory, Rare) — reduces counter-play ability heat cost by 12%. Unlocked after successfully using counter-play abilities 20 times total.
- Shadow Cloak (Armor, Uncommon) — reduces detection radius by 8%. Unlocked after 5 wins.
- Adrenaline Syringe (Tool, Uncommon) — adds one-time 30% movement speed burst per run, activated when health drops below 25%. Unlocked after surviving 3 near-death situations.
- Reinforced Vest (Armor, Rare) — reduces all damage taken by 10%. Unlocked after losing 10 runs.
- The Analyst's Notebook (Accessory, Legendary) — reveals 2 random target locations at run start. Unlocked after winning 20 runs.
- Prototype Earpiece (Accessory, Mythic, requires 5 GT attunement) — passively shows alert radius of all NPCs in current zone. Unlocked after completing a run at maximum difficulty with zero alerts.

**Killer equipment** (12 items):
Weapons (3 items across rarities), armor pieces providing movement noise reduction and DNA contamination resistance, tool items including a pre-placed body bag (starts the run with one body already bagged), and accessories that boost kill efficiency or stealth approach. The highest-rarity killer equipment — a Legendary "Phantom Gloves" accessory (leaves no fingerprint evidence on any action) and a Mythic "Off-Books Briefcase" (starts the run with a complete false evidence package already planted, worth 3 fake evidence items) — require either a score threshold or specific challenge completion to unlock.

**Fed equipment** (6 items):
Forensics tools providing evidence quality bonuses, armor with heat decay resistance, a "Handler's Badge" accessory (Legendary — starts each run with a pre-briefed informant already placed in the zone), and a Mythic "Crime Lab Uplink" that reveals all evidence decay timers in real time. Fed equipment unlock conditions center on arrest performance and evidence collection mastery.

### Crafting UI

The crafting panel is displayed on the equipment detail screen and the Workshop/Armory pages. When the player selects a piece of equipment, the crafting panel shows its upgrade slots (1–3 depending on rarity), what mod is applied in each slot (if any), and all compatible crafting recipes for empty slots with material costs and requirement status.

The player can apply a mod to an empty slot if they own the equipment, the slot is empty, the recipe is compatible with the equipment's slot type and role, the recipe's unlock condition is met, and they have sufficient materials. Removing a mod costs 2 salvage_parts flat and does not refund the materials spent to apply it. Dismantling a piece of equipment (not available for Mythic items or equipment in an active loadout) destroys it and grants salvage_parts based on rarity.

### Progression Pages

Five pages form the progression hub, accessible from the main menu between runs.

**Skill Trees page** — displays the three skill trees for the player's currently selected role. Shows each skill node with its current rank, max rank (5), and next rank cost. Locked skills show prerequisite requirements. Tier progress tracker at the top. Clicking a skill node opens a detail panel with full effect description per rank. "Unlock rank" button calls the unlock-skill server action. The counter-play tree is visually distinct (darker background, red accent border on nodes and tree frame).

**Trophies page** — grid of all trophies available to the player's current role (18 role-specific + 6 shared = 24 cards). Each card shows: trophy name, unlock condition, status (locked/unlocked), and a brief effect description. Locked trophies show progress toward unlock condition where measurable (e.g., "7 of 10 runs completed"). Unlocked trophies have an "Equip" button (single-select per run).

**Equipment page** — catalog of all equipment items the player has unlocked, organized by slot type. Each item card shows: name, rarity (color-coded), base effects, upgrade slots with applied mods. Clicking an item opens the crafting panel. Locked items show their unlock condition with progress where measurable.

**Loadouts page** — up to 5 saved loadouts per role. Each loadout card shows the selected trophy and 4 equipment slots. Players can create, edit, rename, set default, and delete loadouts. The "Set Default" button sets the loadout that auto-equips when entering a run without manually selecting. Saving a loadout calls the save-loadout server action.

**Leaderboard page** — shows top 100 scores globally per role and biome combination. The player's personal best is highlighted. Scores are submitted automatically at run end via the submit-score server action. The leaderboard table shows rank, display name, score, biome, role, and run date. Score data is read-only; the page does not call any mutating server actions.

### Boot Registration

The `_register-all.ts` extension in this piece adds trophies, equipment catalog items, and crafting recipes (killer + fed) into their respective content registries. Killer and fed crafting recipes (defined in the role content pieces) are registered here using the craftingRecipeRegistry instance created in the progression infrastructure system. Trophies and equipment defined in this piece register into trophyRegistry and itemRegistry.

### Security

All progression page mutations go through server actions defined in the progression infrastructure system. The UI pages are client components that call server actions — they never query the database directly. All server actions validate authentication before any DB operation. Unlock conditions are re-validated server-side even when the client optimistically shows an unlock notification. MYTHIC equipment cannot be equipped unless the attunement flag is true in the database — the client cannot bypass this.

### Performance

Progression pages load with data server-rendered and passed to client components. No additional round trips at page open. Crafting panel filter operations are client-side (recipe compatibility, material affordability). Leaderboard page uses React Server Component with a 60-second revalidation interval — data may be up to 60 seconds stale, which is acceptable for a leaderboard display.

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

This piece is purely data and UI. All server-side infrastructure (DB tables, DAL, Server Actions, Zustand stores, ContentRegistry instances) already exists from the progression infrastructure system. This piece:

1. Defines trophy and equipment content data files in `packages/shared/src/data/`
2. Creates React components for crafting UI in `apps/web/src/components/app/progression/crafting/`
3. Creates five progression pages in `apps/web/src/app/progression/` and `apps/web/src/app/leaderboard/`
4. Extends `_register-all.ts` to register trophies, equipment, and crafting recipes

The progression pages use a hybrid rendering approach: Server Components for initial data fetch (passed as props), Client Components for interactivity (calling Server Actions, updating Zustand stores). No React hooks in Server Components.

### Shared Types (From 13a — Inline)

These types are already defined in `packages/shared/src/types/progression.ts` by the progression infrastructure system. All data files and UI components import from this path.

```typescript
export interface Trophy {
  id: string;
  role: 'KILLER' | 'FED' | 'SHARED';
  name: string;
  description: string;
  flavorText?: string;
  unlockCondition: UnlockCondition;
  effects: TrophyEffect[];
  cosmetic?: TrophyCosmetic;
}

export interface TrophyEffect {
  type: 'PASSIVE' | 'STARTING_BONUS';
  effect: Effect;  // Universal Effect union from packages/shared/src/effects/effect-types.ts
}

export interface TrophyCosmetic {
  hudSkin?: string;
  killAnimationVariant?: string;
  characterAppearance?: string;
}

export interface Equipment {
  id: string;
  role: 'KILLER' | 'FED' | 'SHARED';
  slot: 'WEAPON' | 'ARMOR' | 'TOOL' | 'ACCESSORY';
  name: string;
  description: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY' | 'MYTHIC';
  upgradeSlots: number;  // 1=COMMON/UNCOMMON, 2=RARE/LEGENDARY, 3=MYTHIC
  obtainCondition: UnlockCondition;
  effects: Effect[];     // Universal Effect union from packages/shared/src/effects/effect-types.ts
}

export type UnlockCondition =
  | { type: 'DEFAULT' }
  | { type: 'WIN_COUNT'; role: PlayerRole; count: number }
  | { type: 'SCORE_THRESHOLD'; minScore: number; role?: PlayerRole }
  | { type: 'BOSS_KILL'; bossId: string; difficulty?: string; killMethod?: string }
  | { type: 'TROPHY_OWNED'; trophyId: string }
  | { type: 'SKILL_RANK'; skillId: string; minRank: number }
  | { type: 'COUNTER_PLAY_USES'; abilityId: string; count: number }
  | { type: 'TOTAL_TROPHIES'; count: number }
  | { type: 'RUN_COUNT'; count: number };

export type PlayerRole = 'KILLER' | 'FED';
```

### Content Registry Types (From 08a — Inline)

```typescript
// packages/shared/src/registry/content-registry.ts
class ContentRegistry<T extends { id: string }> {
  register(item: T): void
  get(id: string): T | undefined
  getAll(): T[]
  has(id: string): boolean
}

// packages/shared/src/registry/registries.ts (instances from 08a)
export const trophyRegistry: ContentRegistry<Trophy>;
export const itemRegistry: ContentRegistry<Equipment>;
// craftingRecipeRegistry added by the progression infrastructure system:
export const craftingRecipeRegistry: ContentRegistry<CraftingRecipe>;
```

### Data File Structure

**File**: `packages/shared/src/data/trophies/shared-trophies.ts`

```typescript
import type { Trophy } from '../../types/progression';

export const SHARED_TROPHIES: Trophy[] = [
  {
    id: 'ST-1',
    role: 'SHARED',
    name: "Survivor's Medal",
    description: '+5% score on any win',
    unlockCondition: { type: 'RUN_COUNT', count: 10 },
    effects: [{ type: 'PASSIVE', effect: { type: 'STAT_MOD', stat: 'scoreMultiplier', value: 0.05, modType: 'PERCENT' } }],
  },
  {
    id: 'ST-2',
    role: 'SHARED',
    name: 'Iron Resolve',
    description: 'Injury stat penalties reduced by 20%',
    unlockCondition: { type: 'WIN_COUNT', role: 'KILLER', count: 5 },  // 5 consecutive no-abandon wins
    effects: [{ type: 'PASSIVE', effect: { type: 'STAT_MOD', stat: 'injuryPenaltyReduction', value: 0.20, modType: 'PERCENT' } }],
  },
  {
    id: 'ST-3',
    role: 'SHARED',
    name: "Speed Runner's Tag",
    description: 'Start with +10 evidence_dust',
    unlockCondition: { type: 'SCORE_THRESHOLD', minScore: 3000 },  // proxy for sub-8min win
    effects: [{ type: 'STARTING_BONUS', effect: { type: 'STAT_MOD', stat: 'startingEvidenceDust', value: 10, modType: 'FLAT' } }],
  },
  {
    id: 'ST-4',
    role: 'SHARED',
    name: "Perfectionist's Seal",
    description: 'Start with +1 ghost_token',
    unlockCondition: { type: 'SCORE_THRESHOLD', minScore: 5000 },  // proxy for zero-evidence win
    effects: [{ type: 'STARTING_BONUS', effect: { type: 'STAT_MOD', stat: 'startingGhostTokens', value: 1, modType: 'FLAT' } }],
  },
  {
    id: 'ST-5',
    role: 'SHARED',
    name: "Veteran's Crest",
    description: '+10% material earn rates across all types',
    unlockCondition: { type: 'RUN_COUNT', count: 50 },
    effects: [{ type: 'PASSIVE', effect: { type: 'STAT_MOD', stat: 'materialEarnRate', value: 0.10, modType: 'PERCENT' } }],
  },
  {
    id: 'ST-6',
    role: 'SHARED',
    name: 'Blood Moon Relic',
    description: 'Counter-play heat cost reduced by 5%',
    unlockCondition: { type: 'TOTAL_TROPHIES', count: 3 },  // proxy for dual-role week wins
    effects: [{ type: 'PASSIVE', effect: { type: 'STAT_MOD', stat: 'heatCostMultiplier', value: -0.05, modType: 'PERCENT' } }],
  },
];
```

**File**: `packages/shared/src/data/trophies/killer-trophies.ts` — 18 entries (KT-1 through KT-18).

Example high-confidence entries:
- KT-1 (KILLER, first-kill unlock): passive +2% kill speed. `unlockCondition: { type: 'WIN_COUNT', role: 'KILLER', count: 1 }`.
- KT-5 (knife-only run): starting +1 Serrated Knife in inventory. `unlockCondition: { type: 'SCORE_THRESHOLD', minScore: 2000, role: 'KILLER' }`.
- KT-10 (5 consecutive stealth kills in one run): passive detection radius -5%. `unlockCondition: { type: 'WIN_COUNT', role: 'KILLER', count: 5 }`.
- KT-18 (master capstone): passive +5% kill speed + starting Shadow Cloak pre-equipped. `unlockCondition: { type: 'WIN_COUNT', role: 'KILLER', count: 30 }`.

All 18 trophies follow the same `Trophy` interface. Implement the remaining 14 entries with unlock counts progressing from 2–25 wins and effects using the `STAT_MOD` type (`{ type: 'STAT_MOD', stat: StatId, value: number, modType: 'FLAT' | 'PERCENT' }`) with stats from the StatId union defined in the content architecture system (08a).

**File**: `packages/shared/src/data/trophies/fed-trophies.ts` — 18 entries (FT-1 through FT-18).

Example entries:
- FT-1 (first arrest): passive +2% evidence collection speed. `unlockCondition: { type: 'WIN_COUNT', role: 'FED', count: 1 }`.
- FT-5 (forensic-only run): starting +10 case_files. `unlockCondition: { type: 'SCORE_THRESHOLD', minScore: 2000, role: 'FED' }`.
- FT-10 (4-witness arrest): passive witness reliability +8%. `unlockCondition: { type: 'WIN_COUNT', role: 'FED', count: 5 }`.
- FT-18 (master capstone): passive arrest speed +10% + starting pre-briefed informant. `unlockCondition: { type: 'WIN_COUNT', role: 'FED', count: 30 }`.

### Equipment Data Files

**Directory**: `packages/shared/src/data/equipment/`

**Files**:
- `shared-equipment.ts` — 6 shared items
- `killer-equipment.ts` — 12 killer-only items
- `fed-equipment.ts` — 6 fed-only items

All files export typed arrays using the `Equipment` interface. The `upgradeSlots` field must match rarity exactly: COMMON=1, UNCOMMON=1, RARE=2, LEGENDARY=2, MYTHIC=3.

Noteworthy entries to implement explicitly:

```typescript
// packages/shared/src/data/equipment/shared-equipment.ts
{
  id: 'EQ-DECEIVER-KIT',
  role: 'SHARED',
  slot: 'ACCESSORY',
  name: "Deceiver's Kit",
  description: 'Counter-play ability heat cost -12%',
  rarity: 'RARE',
  upgradeSlots: 2,
  obtainCondition: { type: 'COUNTER_PLAY_USES', abilityId: 'any', count: 20 },
  effects: [{ type: 'STAT_MOD', stat: 'heatCostMultiplier', value: -0.12, modType: 'PERCENT' }],
},
{
  id: 'EQ-OFF-BOOKS-BRIEFCASE',
  role: 'KILLER',
  slot: 'ACCESSORY',
  name: 'Off-Books Briefcase',
  description: 'Starts run with a complete false evidence package (3 pre-planted fake evidence items)',
  rarity: 'MYTHIC',
  upgradeSlots: 3,
  obtainCondition: { type: 'WIN_COUNT', role: 'KILLER', count: 25 },
  effects: [{ type: 'ABILITY_UNLOCK', abilityId: 'KA-BRIEFCASE-PRELOAD' }],
},
{
  id: 'EQ-HANDLERS-BADGE',
  role: 'FED',
  slot: 'ACCESSORY',
  name: "Handler's Badge",
  description: 'Starts each run with a pre-briefed informant placed in the zone',
  rarity: 'LEGENDARY',
  upgradeSlots: 2,
  obtainCondition: { type: 'WIN_COUNT', role: 'FED', count: 20 },
  effects: [{ type: 'ABILITY_UNLOCK', abilityId: 'FA-HANDLER-INFORMANT' }],
},
```

### Crafting UI Components

**Directory**: `apps/web/src/components/app/progression/crafting/`

All components are Client Components (they read from Zustand stores and call Server Actions).

```
CraftingPanel.tsx         — top-level panel; receives equipment as prop; renders ModSlotGrid + RecipeList
ModSlotGrid.tsx           — renders N slot cards (N = equipment.upgradeSlots); shows applied mod or empty state
RecipeCard.tsx            — single recipe display: name, effects, material cost, affordability, apply button
MaterialCostDisplay.tsx   — renders material cost breakdown (icons + amounts) with red text when unaffordable
```

**CraftingPanel props**:
```typescript
interface CraftingPanelProps {
  equipment: Equipment;
  appliedMods: EquipmentMod[];  // from crafting Zustand store
  selectedSlot: number | null;
  onSlotSelect: (slotIndex: number) => void;
}
```

RecipeCard calls `applyMod` server action on confirm. CraftingPanel reads compatible recipes from crafting Zustand store `getCompatibleRecipes(equipment.id, selectedSlot)`. Material affordability is computed in the store's derived state.

Mod removal: a remove button on each occupied mod slot calls `removeMod` server action after a confirmation dialog using AppDialog from the design system.

### Progression Pages

**Progression layout**: `apps/web/src/app/progression/layout.tsx` — shared nav tabs (Skills | Trophies | Equipment | Loadouts). Server Component. Uses AppCard for tab container.

**Skill Trees page**: `apps/web/src/app/progression/skills/page.tsx`

```typescript
// Server Component — fetches user's skill ranks via trophies-dal
// Passes data to SkillTreesClient Client Component
export default async function SkillsPage() {
  const user = await requireAuth();
  const skillRanks = await getSkillRanks(user.id);  // from apps/web/src/dal/progression/skills.ts
  return <SkillTreesClient initialSkillRanks={skillRanks} />;
}
```

`SkillTreesClient` renders three SkillTree sub-components. Each SkillTree renders a 10-node grid with tier headers. Counter-play tree styled with `className="bg-slate-900 border-red-700"` on container and `className="border-red-600"` on nodes. Clicking a node opens AppDialog with full rank effect descriptions. Unlock button calls `unlockSkill` server action; store updates optimistically.

**Trophies page**: `apps/web/src/app/progression/trophies/page.tsx`

Server Component fetches TrophyUnlock rows. Passes to TrophiesClient. Grid layout 4 columns on desktop. Trophy cards use `AppCard`. Locked trophies grey out with progress indicator where `unlockCondition.type` has a measurable count. Equip button calls `equipTrophy` server action (single-select, unequips previous).

**Equipment page**: `apps/web/src/app/progression/equipment/page.tsx`

Server Component fetches user equipment unlock rows and applied mods. Passes to EquipmentClient. Four tab sections (Weapon / Armor / Tool / Accessory). Each equipment card shows rarity chip (colour-coded: grey/green/blue/purple/gold for COMMON through MYTHIC), upgrade slot indicators, and "Customize" button that opens CraftingPanel in an AppDialog.

**Loadouts page**: `apps/web/src/app/progression/loadouts/page.tsx`

Server Component fetches loadouts. Passes to LoadoutsClient. Up to 5 loadout cards per role. Edit mode allows selecting trophy and equipment per slot from unlocked items only. Save calls `saveLoadout` server action. Default badge on one card per role. "Set Default" button calls `setDefaultLoadout` server action.

**Leaderboard page**: `apps/web/src/app/leaderboard/page.tsx`

```typescript
// React Server Component — revalidates every 60 seconds
export const revalidate = 60;

export default async function LeaderboardPage() {
  const user = await requireAuth();
  const entries = await getLeaderboard({ limit: 100 });  // from dal/leaderboard.ts
  const personalBest = await getPersonalBest(user.id);
  return <LeaderboardTable entries={entries} personalBestId={user.id} personalBest={personalBest} />;
}
```

LeaderboardTable is a Client Component for highlight logic. Personal best row has ring highlight (`ring-2 ring-yellow-400`). Filter controls (role and biome dropdowns) are client-side — no round trips.

### Boot Registration Extension

**Extend**: `packages/shared/src/data/_register-all.ts`

```typescript
// New imports added in this piece:
import { SHARED_TROPHIES } from '../data/trophies/shared-trophies';
import { KILLER_TROPHIES } from '../data/trophies/killer-trophies';
import { FED_TROPHIES } from '../data/trophies/fed-trophies';
import { SHARED_EQUIPMENT } from '../data/equipment/shared-equipment';
import { KILLER_EQUIPMENT } from '../data/equipment/killer-equipment';
import { FED_EQUIPMENT } from '../data/equipment/fed-equipment';
import { KILLER_RECIPES } from '../data/crafting/killer-recipes';  // created by killer content piece
import { FED_RECIPES } from '../data/crafting/fed-recipes';        // created by fed content piece

// Registration calls added to registerAll():
[...SHARED_TROPHIES, ...KILLER_TROPHIES, ...FED_TROPHIES].forEach(t => trophyRegistry.register(t));
[...SHARED_EQUIPMENT, ...KILLER_EQUIPMENT, ...FED_EQUIPMENT].forEach(e => itemRegistry.register(e));
[...KILLER_RECIPES, ...FED_RECIPES].forEach(r => craftingRecipeRegistry.register(r));
```

### Constitution Compliance

- [x] No barrel files — all component imports use direct file paths
- [x] Server Components for initial data fetch; Client Components only for interactivity
- [x] Server Actions from the progression infrastructure system handle all mutations — UI never queries DB directly
- [x] Zod validation occurs at content registry boot — malformed entries fail fast
- [x] No `process.env` in data files — all config via centralized env module
- [x] MYTHIC item attunement gating enforced by server action in 13a; UI reflects attuned state from store

### Testing Strategy

- Unit tests for `_register-all.ts` extensions: all trophies, equipment, and recipes register without schema errors
- Unit tests for `UnlockResolver` coverage of UnlockCondition types introduced in this piece's data entries
- Component tests (React Testing Library) for CraftingPanel: apply button disabled when unaffordable, confirmation dialog shown before mod removal
- Component tests for TrophyCard: locked state renders correctly, equip button calls server action
- E2E test (Playwright): full loadout save flow — select trophy, select equipment, save, verify persists after page reload

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

- `packages/shared/src/data/trophies/shared-trophies.ts` — 6 Trophy objects (ST-1 through ST-6)
- `packages/shared/src/data/trophies/killer-trophies.ts` — 18 Trophy objects (KT-1 through KT-18)
- `packages/shared/src/data/trophies/fed-trophies.ts` — 18 Trophy objects (FT-1 through FT-18)
- `packages/shared/src/data/equipment/shared-equipment.ts` — 6 Equipment objects (includes EQ-DECEIVER-KIT)
- `packages/shared/src/data/equipment/killer-equipment.ts` — 12 Equipment objects (includes EQ-OFF-BOOKS-BRIEFCASE)
- `packages/shared/src/data/equipment/fed-equipment.ts` — 6 Equipment objects (includes EQ-HANDLERS-BADGE)
- `apps/web/src/components/app/progression/crafting/CraftingPanel.tsx`
- `apps/web/src/components/app/progression/crafting/ModSlotGrid.tsx`
- `apps/web/src/components/app/progression/crafting/RecipeCard.tsx`
- `apps/web/src/components/app/progression/crafting/MaterialCostDisplay.tsx`
- `apps/web/src/app/progression/layout.tsx`
- `apps/web/src/app/progression/skills/page.tsx` + `SkillTreesClient.tsx`
- `apps/web/src/app/progression/trophies/page.tsx` + `TrophiesClient.tsx`
- `apps/web/src/app/progression/equipment/page.tsx` + `EquipmentClient.tsx`
- `apps/web/src/app/progression/loadouts/page.tsx` + `LoadoutsClient.tsx`
- `apps/web/src/app/leaderboard/page.tsx` + `LeaderboardTable.tsx`
- `packages/shared/src/data/_register-all.ts` extended with trophy, equipment, and crafting recipe registration

### Dependencies (Consumed from Earlier Pieces)

**From 08a**:
- `ContentRegistry<T>` class at `packages/shared/src/registry/content-registry.ts`
- `trophyRegistry`, `itemRegistry` instances at `packages/shared/src/registry/registries.ts`
- `Effect` union type at `packages/shared/src/effects/effect-types.ts`
- `StatId` union at `packages/shared/src/effects/effect-types.ts`
- `_register-all.ts` scaffold at `packages/shared/src/data/_register-all.ts`

**From 10b**:
- `KILLER_RECIPES` exported from `packages/shared/src/data/crafting/killer-recipes.ts`
- `KillerBossItem` IDs KB-1 through KB-7 (for trophy unlock condition references)

**From 11b**:
- `FED_RECIPES` exported from `packages/shared/src/data/crafting/fed-recipes.ts`
- `FedBossItem` IDs FB-1 through FB-7 (for trophy unlock condition references)

**From 13a**:
- `craftingRecipeRegistry` at `packages/shared/src/registry/registries.ts`
- `Trophy`, `Equipment`, `TrophyEffect`, `TrophyCosmetic`, `UnlockCondition` types at `packages/shared/src/types/progression.ts`
- `getSkillRanks`, `getTrophyUnlocks`, `getEquipmentUnlocks`, `getLoadouts`, `getAppliedMods`, `getLeaderboard`, `getPersonalBest` DAL functions at `apps/web/src/dal/progression/`
- Server Actions: `unlockTrophy`, `equipTrophy`, `equipItem`, `saveLoadout`, `setDefaultLoadout`, `applyMod`, `removeMod`, `dismantleEquipment` at `apps/web/src/app/actions/progression/` and `apps/web/src/app/actions/crafting/`
- Progression Zustand store at `apps/web/src/stores/progression.ts`
- Crafting Zustand store at `apps/web/src/stores/crafting.ts`
- `AppButton`, `AppCard`, `AppDialog`, `AppToast`, `AppInput` design system components from piece 03

### Success Criteria

- [ ] All 42 trophies (6 shared + 18 killer + 18 fed) register without schema errors at boot
- [ ] All 24 equipment items (6 shared + 12 killer + 6 fed) register without schema errors at boot
- [ ] Killer and fed crafting recipes (KR-1..KR-10 and FR-1..FR-10) register into craftingRecipeRegistry at boot
- [ ] Skill trees page renders three trees for killer role and three for fed role, with correct unlock states
- [ ] Trophy equip flow: clicking equip on an unlocked trophy calls equipTrophy server action and updates store; previously equipped trophy becomes unequipped
- [ ] CraftingPanel apply button is disabled (not just unclickable) when player lacks sufficient materials
- [ ] Mod removal triggers AppDialog confirmation before calling removeMod server action
- [ ] Loadout save flow persists after page reload (server-side confirmation via Supabase)
- [ ] MYTHIC equipment items display "Requires Attunement (5 GT)" UI state when owned but not attuned
- [ ] Leaderboard page revalidates every 60 seconds (Next.js `export const revalidate = 60`)
- [ ] No barrel file imports anywhere in this piece's files

### Alignment Notes

- Trophy catalog is the only source of trophy definitions — if the number of trophies changes (e.g., adding seasonal trophies), `_register-all.ts` is the only file that changes in this piece.
- Equipment unlock conditions reference `WIN_COUNT` and `SCORE_THRESHOLD` condition types. If new `UnlockCondition` discriminants are added in piece 13a, killer-trophies.ts and fed-trophies.ts may need updated entries.
- The `EQ-OFF-BOOKS-BRIEFCASE` and `EQ-HANDLERS-BADGE` equipment items unlock abilities (KA-BRIEFCASE-PRELOAD and FA-HANDLER-INFORMANT). These ability IDs must be registered in the abilityRegistry by pieces 10a and 11a respectively — if ability IDs change there, they must be updated here.
- CraftingPanel reads from crafting Zustand store's `getCompatibleRecipes`. If the recipe compatibility predicate in the store changes (e.g., new equipment category constraints), CraftingPanel automatically reflects the correct recipe list.
- Leaderboard uses `export const revalidate = 60` (Next.js ISR). If real-time leaderboard becomes a requirement, this page would need to be converted to a Supabase Realtime subscription — downstream impact is isolated to `leaderboard/page.tsx` only.
