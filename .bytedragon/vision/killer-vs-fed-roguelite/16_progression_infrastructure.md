---
vision: killer-vs-fed-roguelite
sequence: "16"
name: progression-infrastructure
group: Meta
group_order: 5
status: pending
depends_on:
  - "01: Result utilities, Pino logger, shared types scaffold, environment config, Zod-validated env"
  - "02: Supabase Auth (server-side and browser-side clients), authenticated user sessions"
  - "03: Design system components (AppButton, AppCard, AppDialog, AppToast, AppInput) for progression pages"
  - "08: ContentRegistry<T> instances (skillRegistry, trophyRegistry, weaponRegistry, itemRegistry), Effect union type, StatId, EffectProcessor, STAT_CAPS in balance.ts"
  - "11: KillerRole types — KillerAbilityId, KillMethod (for loadout validation)"
  - "12: Killer content data files created and available for registration"
  - "13: FedRole types — ArrestCondition, FedRunState (for progression effects application)"
  - "14: Fed content data files created and available for registration"
  - "15: PersistentCurrency types, material type constants (evidence_dust, blood_marks, ghost_tokens, case_files, shadow_coins, salvage_parts), RunHistoryDTO and getRunHistory, run_history table (consumed by UnlockResolver for evaluating unlock conditions)"
produces:
  - "Database migrations — skill_unlocks, trophy_unlocks, equipment_inventory, materials, loadouts, loadout_skills, loadout_equipment, crafting_unlocks, leaderboard tables with RLS"
  - "DAL modules — apps/web/src/dal/progression/ — skills-dal.ts, trophies-dal.ts, equipment-dal.ts, materials-dal.ts, loadouts-dal.ts, crafting-dal.ts, history-dal.ts"
  - "Server Actions — apps/web/src/app/actions/progression/ — unlock-skill.ts, unlock-trophy.ts, equip-item.ts, spend-materials.ts, save-loadout.ts, craft-item.ts, submit-score.ts"
  - "Progression shared types at packages/shared/src/types/progression.ts — SkillTree, Skill, SkillEffect, SkillRank, Trophy, TrophyEffect, Equipment, EquipmentStats, Loadout, Material, UnlockCondition"
  - "Progression Zod schemas at packages/shared/src/schemas/progression.ts — all server action input validation schemas"
  - "Crafting Zod schemas at packages/shared/src/schemas/crafting-schemas.ts"
  - "Progression constants at packages/shared/src/constants/progression.ts — material types, equipment slots, trophy limits, tree names"
  - "Crafting constants at packages/shared/src/constants/crafting.ts — salvage rates, mod slot counts per rarity"
  - "Progression Zustand store at apps/web/src/stores/progression.ts"
  - "Crafting Zustand store at apps/web/src/stores/crafting.ts"
  - "Material currency system — material balance tracking, anti-cheat atomic deduction"
  - "Unlock resolver utility at packages/game-engine/src/progression/unlock-resolver.ts"
  - "Loadout validation logic at packages/game-engine/src/progression/loadout-validator.ts"
  - "Progression effects engine at packages/game-engine/src/progression/progression-effects.ts — applies skills + trophies + equipment + crafting mods at run start"
  - "craftingRecipeRegistry instance — added to registries.ts"
created: 2026-03-18
last_aligned: 2026-03-20
---

# Vision Piece 16: Progression Infrastructure

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: project-scaffold, auth, design-system, content-architecture, killer-core-mechanics, killer-content, fed-core-mechanics, fed-content, session-economy

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Build the server-side infrastructure for all meta-progression: the database tables, data access layer (DAL), and server actions for skills, trophies, equipment, materials, loadouts, and crafting. This piece owns the database and server layer. The UI pages, trophy catalog, and equipment catalog content are in the next piece.

### Dependency Context (Inline)

**Project scaffold** provides the shared Result type for all DAL functions (they never throw — they return Result types), the Pino logger, and Zod-validated environment config.

**Auth** provides the server-side and browser-side Supabase clients. All DAL functions use the server-side client. All server actions validate authentication before any database operation.

**Design system** provides the shared component library used by progression pages built in the next piece.

**Content architecture** provides the ContentRegistry class and instances (skillRegistry, trophyRegistry, weaponRegistry, itemRegistry), the universal Effect type union, and the STAT_CAPS balance constants. The progression effects engine reads from these registries to apply progression effects at run start.

**Killer content** provides the killer skill trees, abilities, weapons, boss items, and crafting recipes that are registered in these registries and whose progression data is stored in these tables.

**Fed content** provides the fed skill trees, abilities, weapons, boss items, and crafting recipes.

**Session economy** provides the material type constants (evidence_dust, blood_marks, ghost_tokens, case_files, shadow_coins, salvage_parts), the PersistentCurrency types, the RunHistoryDTO, and the `getRunHistory()` function used by the unlock resolver to evaluate unlock conditions.

### Database Tables

**Skill unlocks**: Records which skill rank a user has achieved. Fields: user ID, skill ID (referencing the skill data by ID string, not a foreign key to a skill table), current rank (1–5), unlock timestamp. One row per (user, skill) pair. Row-level security: users can only access their own rows.

**Trophy unlocks**: Records which trophies a user has unlocked and whether they have equipped them. Fields: user ID, trophy ID (string ID), unlocked flag, equipped flag, unlock timestamp. Row-level security: users can only access their own rows.

**Equipment inventory**: Records which equipment items a user has obtained. Fields: user ID, equipment ID (string ID), unlocked flag, attuned flag (MYTHIC items require one-time ghost token attunement before equipping), unlock timestamp. Row-level security: users own their rows.

**Materials**: Records a user's balance of each material type. Fields: user ID, material type name (one of the 6 material type strings), amount (non-negative). One row per (user, material type) pair. Balance can never go below zero — the server enforces this atomically via transactions. Row-level security: users own their rows.

**Loadouts**: Records saved loadout configurations. Fields: unique ID, user ID, role (KILLER or FED), name, optional trophy ID, list of up to 4 equipment IDs (one per slot type), default flag. Row-level security: users own their loadouts.

**Crafting unlocks**: Records crafting recipe unlock state for a user. Fields: user ID, recipe ID (string), unlocked flag. Row-level security: users own their rows.

**Match history** (provided by session economy, piece 15): Stores completed run results including user ID, role played, biome, final score, duration, targets eliminated, evidence collected, outcome, materials earned, and timestamp. This piece reads match history to evaluate unlock conditions and populate the leaderboard — it does not create this table.

**Leaderboard**: Stores high scores for matchmaking and display. Fields: user ID, role, biome, score, rank achieved, timestamp. Row-level security: read by all authenticated users; users can only insert/update their own rows.

**Equipment mods**: Records crafting modifications applied to a user's equipment. Fields: unique ID, user ID, equipment ID, slot index (0-based), recipe ID, application timestamp. One row per (user, equipment, slot index). Row-level security: users own their rows.

All global definition tables are stored as TypeScript data objects in `packages/shared/src/data/` and seeded into the database using a seed script. They are readable by all authenticated users and writable only by service role.

### JSONB Usage

Effect lists, rank costs, unlock conditions, and equipment stats use JSONB storage for variable schemas. A fixed column schema would require ALTER TABLE for every new effect type. Mitigated by Zod validation on every read path and registry-level validation at boot.

### Rank System

Every skill has 1–5 ranks. Each rank stores total effects at that rank (not incremental) — this prevents floating-point accumulation. Diminishing returns formula: effectiveValue = baseValue × rank × (1 / (1 + 0.15 × (rank − 1))).

### Material Anti-Cheat

The spend-materials server action checks all material balances server-side before deducting. If any material type would go below zero, the entire transaction is rejected. The client store is optimistic but the server is always authoritative — if the server rejects the spend, the store rolls back.

### Progression Effects Engine

Called by the run manager's start hook after loadout is selected. Converts equipped progression (skills at current rank, equipped trophy, equipment with mods) into concrete stat modifiers and ability unlocks applied to the player entity before gameplay begins. Reads from the progression Zustand store (hydrated from server at page load) — no additional server calls at run start.

Produces: map of stat name to cumulative modifier value, list of unlocked ability IDs, list of starting item IDs, list of passive status effects, crafting mod effects, counter-play configuration (heat cost reduction multiplier, starting evidence quality, informant survival chance).

### Unlock Resolver

Runs post-run (after results are shown) to check which trophies and equipment newly meet unlock conditions. Evaluates against run history. Unlock condition checks are client-side for fast UX notification. Server actions re-validate unlock conditions before writing any unlock to the database — the client notification is optimistic, the server is authoritative.

### Counter-Play Ghost Token Economy

Ghost tokens are the universal premium gate across skills, boss items, and crafting. Typical player earns ~0.7–1.0 ghost tokens per run. Allocation decision: skill rank depth (1–4 GT per rank), boss item attunement (5 GT one-time), crafting tier 2–3 (1–8 GT per recipe). No single dominant strategy.

### Edge Cases

- New player has no progression unlocked: default loadout with base abilities, no trophy, no mods
- If prerequisite chain integrity fails server-side, dependent skills remain unlocked but UI shows a warning badge
- Material balance anti-cheat: client store is optimistic, server is authoritative
- Effect stacking cap: all effects from skill + trophy + equipment + crafting go through StatModifierSystem which enforces STAT_CAPS
- MYTHIC item attunement gate: a player who earns a boss item but lacks ghost tokens cannot use it until they attune
- Mod removal costs 2 salvage_parts flat fee; materials not refunded
- craftingRecipeRegistry is added to the registry instances in this piece (not the content architecture system)

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

Progression data is server-owned (Supabase PostgreSQL). The client fetches all progression state at session start. Mutations go through Server Actions with full validation. The game engine consumes progression state via Zustand stores at run start — no additional server calls during a run.

Dual-source sync: TypeScript const objects in `packages/shared/src/data/` are the source of truth. The seed script (`supabase/seed/seed-content.ts`) reads these and upserts into DB. Adding new content = add data file entry + run seed. No schema migration unless adding a new Effect type discriminant.

### Database Schema (SQL DDL)

```sql
-- Skill unlock state (user progression through skill trees)
CREATE TABLE user_skill_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  current_rank INT NOT NULL CHECK (current_rank BETWEEN 1 AND 5),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_id)
);
ALTER TABLE user_skill_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their skill unlocks" ON user_skill_unlocks
  FOR ALL USING (auth.uid() = user_id);

-- Trophy unlock and equip state
CREATE TABLE user_trophy_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trophy_id TEXT NOT NULL,
  unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  equipped BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  UNIQUE(user_id, trophy_id)
);
ALTER TABLE user_trophy_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their trophies" ON user_trophy_unlocks
  FOR ALL USING (auth.uid() = user_id);

-- Equipment inventory
CREATE TABLE user_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id TEXT NOT NULL,
  attuned BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, equipment_id)
);
ALTER TABLE user_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their equipment" ON user_equipment
  FOR ALL USING (auth.uid() = user_id);

-- Material balances (per-user per-material-type)
CREATE TABLE user_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL,
  amount INT NOT NULL DEFAULT 0 CHECK (amount >= 0),
  UNIQUE(user_id, material_type)
);
ALTER TABLE user_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their materials" ON user_materials
  FOR ALL USING (auth.uid() = user_id);

-- Saved loadout configurations
CREATE TABLE user_loadouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('KILLER', 'FED')),
  name TEXT NOT NULL,
  trophy_id TEXT,
  equipment_ids JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE user_loadouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their loadouts" ON user_loadouts
  FOR ALL USING (auth.uid() = user_id);

-- Applied crafting modifications
CREATE TABLE user_equipment_mods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id TEXT NOT NULL,
  slot_index INT NOT NULL CHECK (slot_index BETWEEN 0 AND 2),
  recipe_id TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, equipment_id, slot_index)
);
ALTER TABLE user_equipment_mods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their mods" ON user_equipment_mods
  FOR ALL USING (auth.uid() = user_id);

-- Run history is owned by piece 15 (session economy) — consumed here by UnlockResolver.
-- See run_history table in supabase/migrations/XXX_run_history.sql (produced by piece 15).
-- getRunHistory() and RunHistoryDTO are imported from apps/web/src/dal/runs/history.ts.
```

### Progression Effects Engine

**File**: `packages/game-engine/src/progression/progression-effects.ts`

```typescript
interface ProgressionEffectBundle {
  statModifiers: Record<StatId, number>;
  unlockedAbilityIds: string[];
  startingItemIds: string[];
  passiveStatusEffects: StatusEffectApplication[];
  equipmentModEffects: Effect[];
  counterPlayConfig: {
    heatCostMultiplier: number;   // capped at 0.60 (40% reduction max)
    startingEvidenceQuality: 'LOW' | 'MEDIUM' | 'HIGH';
    informantSurvivalChance: number;
  };
}

class ProgressionEffectsEngine {
  computeBundle(
    skillRanks: SkillRank[],
    equippedTrophy: TrophyUnlock | null,
    equippedItems: Equipment[],
    appliedMods: EquipmentMod[]
  ): ProgressionEffectBundle

  applyBundle(bundle: ProgressionEffectBundle, player: PlayerController): void
}
```

### Server Actions

**File**: `apps/web/src/app/actions/progression/unlock-skill.ts`
- Validates: authenticated, prerequisites met, materials sufficient, skill not at max rank
- Transaction: deduct materials (user_materials UPDATE), upsert user_skill_unlocks row
- Returns: `Result<SkillRank, 'PREREQ_NOT_MET' | 'INSUFFICIENT_MATERIALS' | 'ALREADY_MAX_RANK'>`

**File**: `apps/web/src/app/actions/progression/spend-materials.ts`
- Validates: sufficient balance per material type (no type goes below 0)
- Atomically deducts all specified materials in a transaction
- Returns: `Result<void, 'INSUFFICIENT_MATERIALS'>`

**File**: `apps/web/src/app/actions/progression/save-loadout.ts`
- Validates: all equipment IDs owned and attuned if MYTHIC, trophy owned and unlocked, slot uniqueness, role match
- Upserts loadout row
- Returns: `Result<Loadout, 'INVALID_EQUIPMENT' | 'INVALID_TROPHY' | 'SLOT_CONFLICT'>`

**File**: `apps/web/src/app/actions/crafting/apply-mod.ts`
- Validates: user owns equipment, empty slot at slot_index, recipe compatible, unlock condition met, sufficient materials
- Transaction: deduct materials, insert user_equipment_mods row
- Returns: `Result<void, 'SLOT_OCCUPIED' | 'INCOMPATIBLE_RECIPE' | 'UNLOCK_CONDITION_NOT_MET' | 'INSUFFICIENT_MATERIALS'>`

**File**: `apps/web/src/app/actions/crafting/remove-mod.ts`
- Validates: user owns equipment and mod
- Deducts 2 salvage_parts flat fee
- Deletes user_equipment_mods row (materials NOT refunded)
- Returns: `Result<void, 'MOD_NOT_FOUND' | 'INSUFFICIENT_SALVAGE'>`

**File**: `apps/web/src/app/actions/crafting/dismantle-equipment.ts`
- Validates: user owns equipment, not in any active loadout, not MYTHIC
- Removes all applied mods first, then deletes from user_equipment, grants salvage_parts
- Returns: `Result<void, 'IN_ACTIVE_LOADOUT' | 'MYTHIC_CANNOT_DISMANTLE'>`

### craftingRecipeRegistry

This piece adds `craftingRecipeRegistry` to the registries file from the content architecture system:

```typescript
// Extends packages/shared/src/registry/registries.ts:
export const craftingRecipeRegistry = new ContentRegistry('CraftingRecipe', craftingRecipeDefSchema);
```

### Testing Strategy

- Unit tests for ProgressionEffectsEngine: correct stat modifier aggregation, STAT_CAPS enforcement, ability unlock list generation
- Unit tests for UnlockResolver: each unlock condition type evaluated correctly against run history
- Integration tests for Server Actions: unlock-skill atomic transaction, spend-materials negative balance rejection
- Unit tests for Zustand stores: optimistic update and rollback pattern

### Constitution Compliance

- [x] No barrel files — all imports direct to specific files
- [x] Server-side only in DAL and Server Actions (server-only import in all DAL files)
- [x] All mutations through Server Actions with Zod validation
- [x] Result<T,E> for all DAL functions and Server Actions — never throw
- [x] JSONB fields validated with Zod on every read path
- [x] Material balance is atomically enforced at the database transaction level
- [x] RLS on all user tables

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

- `supabase/migrations/YYYYMMDD_progression.sql` — all progression tables
- `supabase/seed/seed-content.ts` — upserts all content from TypeScript const objects
- `packages/shared/src/types/progression.ts`
- `packages/shared/src/schemas/progression.ts`
- `packages/shared/src/schemas/crafting-schemas.ts`
- `packages/shared/src/constants/progression.ts`
- `packages/shared/src/constants/crafting.ts`
- `apps/web/src/dal/progression/skills.ts`
- `apps/web/src/dal/progression/trophies.ts`
- `apps/web/src/dal/progression/equipment.ts`
- `apps/web/src/dal/progression/materials.ts`
- `apps/web/src/dal/progression/loadouts.ts`
- `apps/web/src/dal/crafting/recipes.ts`
- `apps/web/src/dal/crafting/mods.ts`
- `apps/web/src/app/actions/progression/unlock-skill.ts`
- `apps/web/src/app/actions/progression/unlock-trophy.ts`
- `apps/web/src/app/actions/progression/equip-item.ts`
- `apps/web/src/app/actions/progression/spend-materials.ts`
- `apps/web/src/app/actions/progression/save-loadout.ts`
- `apps/web/src/app/actions/crafting/apply-mod.ts`
- `apps/web/src/app/actions/crafting/remove-mod.ts`
- `apps/web/src/app/actions/crafting/dismantle-equipment.ts`
- `apps/web/src/stores/progression.ts`
- `apps/web/src/stores/crafting.ts`
- `packages/game-engine/src/progression/progression-effects.ts`
- `packages/game-engine/src/progression/unlock-resolver.ts`

### Dependencies (Consumed from Earlier Pieces)

**From piece 08 (Content Architecture)**:
- Registry instances: `skillRegistry`, `trophyRegistry`, `weaponRegistry`, `itemRegistry` from `packages/shared/src/registry/registries`
- `Effect` union and `StatId`: `packages/shared/src/effects/effect-types`
- `EffectProcessor`: `packages/game-engine/src/effects/effect-processor`
- `StatModifierSystem` with `STAT_CAPS`: `packages/game-engine/src/combat/stat-modifier-system`, `packages/shared/src/constants/balance`

**From piece 15 (Session Economy)**:
- Material type constants: `MATERIAL_TYPES` from `packages/shared/src/constants/economy`
- `RunHistoryDTO` type and `getRunHistory()` function

**From pieces 12 and 14 (Content)**:
- All data files exist and are importable for the seed script

### Success Criteria

- [ ] All progression tables created with correct columns, constraints, and RLS policies
- [ ] `unlock-skill.ts` server action is atomic — materials deducted and skill rank updated in a single transaction
- [ ] `spend-materials.ts` rejects any transaction that would take any material balance below zero
- [ ] `save-loadout.ts` rejects loadouts with duplicate equipment slots or unowned/unattuned MYTHIC items
- [ ] ProgressionEffectsEngine correctly aggregates all modifier sources (skills + trophy + equipment + mods) with STAT_CAPS enforcement
- [ ] UnlockResolver correctly evaluates all unlock condition types against run history
- [ ] Zustand progression store initializes from server-rendered data and rolls back on server action rejection
- [ ] craftingRecipeRegistry added to registries.ts and imported by _register-all.ts

### Alignment Notes

This piece owns all database tables, DAL modules, and server actions for progression. Piece 17 owns the UI pages and the trophy/equipment content data.

The `craftingRecipeRegistry` instance is added in this piece (to `registries.ts`) because it requires the crafting schema infrastructure defined here. Piece 12 creates `killer-recipes.ts` and piece 14 creates `fed-recipes.ts` — those files are registered in piece 17's extension of `_register-all.ts`.

The ProgressionEffectsEngine is the critical integration point between the meta-progression layer and the game engine. It runs at run start via the run manager's hook from piece 07. It must complete synchronously (reading from the already-hydrated Zustand store) before any gameplay begins.

Piece 07 creates the `_register-all.ts` scaffold referenced throughout. Piece 16's `craftingRecipeRegistry` adds to `registries.ts`. Piece 17 extends `_register-all.ts` to register trophies, equipment, and crafting recipes from pieces 12 and 14.
