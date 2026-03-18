---
vision: killer-vs-fed-roguelite
sequence: 13
name: persistent-progression
group: Progression
group_order: 5
status: pending
depends_on:
  - "12: PersistentCurrency types, material type constants, RunHistoryDTO and getRunHistory for unlock condition resolution"
produces:
  - "supabase/migrations/XXX_progression.sql — skill_trees, skills, user_skills, trophies, user_trophies, equipment, user_equipment, user_loadouts, user_materials, crafting_recipes, user_equipment_mods tables with RLS"
  - "supabase/migrations/XXX_run_history.sql — run_history table with RLS (inlined from session economy dependency)"
  - "packages/shared/src/types/progression.ts — SkillTree, Skill, SkillEffect, SkillRank, Trophy, TrophyEffect, Equipment, EquipmentStats, Loadout, Material, UnlockCondition"
  - "packages/shared/src/types/crafting.ts — CraftingRecipe, CraftingCategory, CraftingUnlockCondition, EquipmentMod"
  - "packages/shared/src/constants/progression.ts — material types, equipment slots, trophy limits, skill tree names, counter-play branch ids"
  - "packages/shared/src/constants/balance.ts — STAT_CAPS enforced by StatModifierSystem"
  - "packages/shared/src/constants/crafting.ts — salvage rates, mod slot counts per rarity"
  - "packages/shared/src/schemas/progression.ts — Zod schemas for all progression mutations"
  - "packages/shared/src/schemas/crafting-schemas.ts — Zod schemas for crafting types"
  - "packages/shared/src/registry/content-registry.ts — generic ContentRegistry<T> class"
  - "packages/shared/src/registry/registries.ts — registry instances (skill, trophy, equipment, craftingRecipe)"
  - "packages/shared/src/effects/effect-types.ts — universal Effect type, StatId"
  - "packages/shared/src/data/skills/killer-stealth.ts — Killer Stealth tree: 10 skills with ranks, costs, effects"
  - "packages/shared/src/data/skills/killer-brutality.ts — Killer Brutality tree: 10 skills"
  - "packages/shared/src/data/skills/killer-deception.ts — Killer Deception tree: 10 skills (counter-play)"
  - "packages/shared/src/data/skills/fed-forensics.ts — Fed Forensics tree: 10 skills"
  - "packages/shared/src/data/skills/fed-interrogation.ts — Fed Interrogation tree: 10 skills (counter-play)"
  - "packages/shared/src/data/skills/fed-tactics.ts — Fed Tactics tree: 10 skills (counter-play)"
  - "packages/shared/src/data/trophies/killer-trophies.ts — 18 killer trophies"
  - "packages/shared/src/data/trophies/fed-trophies.ts — 18 fed trophies"
  - "packages/shared/src/data/trophies/shared-trophies.ts — 6 shared trophies"
  - "packages/shared/src/data/boss-items/killer-boss-items.ts — 7 killer MYTHIC boss items"
  - "packages/shared/src/data/boss-items/fed-boss-items.ts — 7 fed MYTHIC boss items"
  - "packages/shared/src/data/crafting/killer-recipes.ts — 10 Workshop modification recipes"
  - "packages/shared/src/data/crafting/fed-recipes.ts — 10 Armory requisition recipes"
  - "packages/shared/src/data/_register-all.ts — registers all content at boot"
  - "packages/game-engine/src/progression/progression-effects.ts — ProgressionEffectsEngine applying skills + trophies + equipment + crafting mods at run start"
  - "packages/game-engine/src/progression/unlock-resolver.ts — checks unlock conditions against run history"
  - "packages/game-engine/src/effects/effect-processor.ts — EffectProcessor handling all Effect types generically"
  - "packages/game-engine/src/effects/boss-item-handlers.ts — 14 custom effect handlers for boss items"
  - "packages/game-engine/src/effects/crafting-handlers.ts — custom effect handlers for crafting mods"
  - "apps/web/src/dal/progression/skills.ts — skill CRUD returning Result<DTO>"
  - "apps/web/src/dal/progression/trophies.ts — trophy CRUD returning Result<DTO>"
  - "apps/web/src/dal/progression/equipment.ts — equipment CRUD returning Result<DTO>"
  - "apps/web/src/dal/progression/loadouts.ts — loadout CRUD returning Result<DTO>"
  - "apps/web/src/dal/progression/materials.ts — material balance CRUD returning Result<DTO>"
  - "apps/web/src/dal/crafting/recipes.ts — recipe data access"
  - "apps/web/src/dal/crafting/mods.ts — user mod data access"
  - "apps/web/src/app/actions/progression/unlock-skill.ts — validated skill unlock server action"
  - "apps/web/src/app/actions/progression/equip-trophy.ts — validated trophy equip server action"
  - "apps/web/src/app/actions/progression/save-loadout.ts — validated loadout save server action"
  - "apps/web/src/app/actions/progression/spend-materials.ts — validated material spend server action"
  - "apps/web/src/app/actions/crafting/apply-mod.ts — validated crafting apply server action"
  - "apps/web/src/app/actions/crafting/remove-mod.ts — validated mod remove server action"
  - "apps/web/src/app/actions/crafting/dismantle-equipment.ts — dismantle for salvage server action"
  - "apps/web/src/app/progression/skills/page.tsx — skill tree browser"
  - "apps/web/src/app/progression/trophies/page.tsx — trophy collection page"
  - "apps/web/src/app/progression/equipment/page.tsx — equipment and loadout page"
  - "apps/web/src/app/progression/workshop/page.tsx — Killer crafting page (The Workshop)"
  - "apps/web/src/app/progression/armory/page.tsx — Fed crafting page (The Armory)"
  - "apps/web/src/components/app/progression/SkillTreeView.tsx — visual tree with nodes and connections"
  - "apps/web/src/components/app/progression/SkillNode.tsx — individual skill node"
  - "apps/web/src/components/app/progression/SkillTooltip.tsx — skill detail tooltip"
  - "apps/web/src/components/app/progression/TrophyGrid.tsx — trophy collection grid"
  - "apps/web/src/components/app/progression/TrophyCard.tsx — individual trophy card"
  - "apps/web/src/components/app/progression/EquipmentGrid.tsx — equipment grid"
  - "apps/web/src/components/app/progression/LoadoutBuilder.tsx — drag-and-drop loadout builder"
  - "apps/web/src/components/app/progression/MaterialCounter.tsx — persistent currency display"
  - "apps/web/src/components/app/crafting/CraftingStation.tsx — main crafting UI"
  - "apps/web/src/components/app/crafting/RecipeList.tsx — recipe browser"
  - "apps/web/src/components/app/crafting/RecipeCard.tsx — individual recipe"
  - "apps/web/src/components/app/crafting/ModSlotViewer.tsx — equipment mod slot display"
  - "apps/web/src/components/app/crafting/DismantleConfirm.tsx — dismantle confirmation dialog"
  - "apps/web/src/stores/progression.ts — client-side progression Zustand store"
  - "apps/web/src/stores/crafting.ts — client-side crafting Zustand store"
created: 2026-03-17
last_aligned: never
---

# Vision Piece 13: Persistent Progression

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: session-economy (12)

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Build the complete meta-progression systems that persist between runs. This piece owns: ranked skill trees (3 per role, 10 skills each, 1-5 ranks per skill with diminishing returns), trophies/keepsakes with passive abilities (42 total, single-tier), equipment loadouts (4 slots per loadout, MYTHIC rarity tier for boss items), the crafting/modification system (The Workshop for Killer, The Armory for Fed), persistent material currency including ghost tokens, and the permanent unlock system. The data-driven ContentRegistry and universal Effect system are also defined here — they provide the extensible backbone for all content.

Counter-play abilities (introduced in pieces 10-11) are gated behind this progression system. They are not available in default loadouts. New players start with base abilities only; counter-play is a mid-to-late-game reward requiring meaningful material investment.

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
```

#### From packages/shared/src/types/run.ts (piece 07)
```typescript
interface RunConfig { seed: string; biome: Biome; role: PlayerRole; loadout: Loadout }
```

#### From packages/game-engine/src/run/run-manager.ts (piece 07)
```typescript
// Run initialization hook — progression effects applied here:
onRunStart(config: RunConfig): void
```

#### From packages/shared/src/types/combat.ts (piece 08)
```typescript
interface StatusEffect { id: ID; name: string; type: 'BUFF' | 'DEBUFF'; remainingMs: number }
```

#### From packages/game-engine/src/combat/status-effects.ts (piece 08)
```typescript
applyStatusEffect(entityId: ID, effect: StatusEffect): void
```

#### From packages/shared/src/types/killer.ts (piece 10)
```typescript
type KillerAbilityId =
  | 'LOCKPICK'
  | 'DISGUISE_CHANGE'
  | 'EVIDENCE_CLEANUP'
  | 'SILENT_MOVEMENT'
  | 'DISTRACTION_THROW'
  | 'SMOKE_BOMB'
  | 'QUICK_DISPOSAL'
  | 'FAKE_EVIDENCE_PLANT'
  | 'DECOY_TRAIL'
  | 'WITNESS_INTIMIDATION'
  | 'SURVEILLANCE_JAMMING'
  | 'FALSE_ALIBI_CONSTRUCTION'
```

#### From packages/shared/src/types/fed.ts (piece 11)
```typescript
type FedAbilityId =
  | 'ENHANCED_SCAN'
  | 'WITNESS_COMPULSION'
  | 'FORENSIC_ANALYSIS'
  | 'SURVEILLANCE_ACCESS'
  | 'AREA_LOCKDOWN'
  | 'EVIDENCE_PRESERVATION'
  | 'PROFILE_ANALYSIS'
  | 'ILLEGAL_SURVEILLANCE'
  | 'ROUGH_INTERROGATION'
  | 'PLANTED_INFORMANT'
  | 'ENTRAPMENT_SETUP'
  | 'OFFBOOKS_FORENSICS'
```

#### From packages/shared/src/types/economy.ts (piece 12)
```typescript
interface PersistentCurrency { materials: Record<string, number> }
```

#### From apps/web/src/dal/runs/history.ts (piece 12)
```typescript
// Unlock resolver queries run history to check conditions:
interface RunHistoryDTO {
  id: string; userId: string; role: 'KILLER' | 'FED'; biome: string;
  score: number; durationSeconds: number; targetsEliminated: number | null;
  evidenceCollected: number | null; outcome: 'WIN' | 'LOSE' | 'ABANDONED';
  materialsEarned: Record<string, number>; createdAt: string;
}
getRunHistory(userId: string, limit?: number, offset?: number): Promise<Result<RunHistoryDTO[], DatabaseError>>;
```

#### From packages/shared/src/constants/economy.ts (piece 12)
```typescript
const MATERIAL_TYPES = {
  EVIDENCE_DUST: 'evidence_dust',   // fed wins
  BLOOD_MARKS: 'blood_marks',       // killer wins
  GHOST_TOKENS: 'ghost_tokens',     // any high score — universal premium gate
  CASE_FILES: 'case_files',         // fed investigation bonuses
  SHADOW_COINS: 'shadow_coins',     // killer evasion bonuses
  SALVAGE_PARTS: 'salvage_parts',   // from dismantling equipment
} as const;
```

#### From apps/web/src/lib/supabase/server.ts (piece 02)
```typescript
createServerClient(): SupabaseClient
```

#### From apps/web/src/lib/supabase/client.ts (piece 02)
```typescript
createBrowserClient(): SupabaseClient
```

#### From apps/web/src/lib/logger/pino.ts (piece 01)
```typescript
import logger from '@/lib/logger/pino';
```

#### From apps/web/src/components/app/common/ (piece 03)
```typescript
AppButton, AppCard, AppDialog, AppInput, AppToast
PageLayout
```

### Database Schema

**`supabase/migrations/XXX_run_history.sql`** (inlined from session economy dependency):

```sql
-- Run history (owned by session economy; reproduced here for unlock resolver reference)
CREATE TABLE run_history (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role                TEXT NOT NULL CHECK (role IN ('KILLER', 'FED')),
  biome               TEXT NOT NULL,
  score               INTEGER NOT NULL DEFAULT 0,
  duration_seconds    INTEGER NOT NULL DEFAULT 0,
  targets_eliminated  INTEGER,
  evidence_collected  INTEGER,
  outcome             TEXT NOT NULL CHECK (outcome IN ('WIN', 'LOSE', 'ABANDONED')),
  materials_earned    JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_run_history_user ON run_history(user_id);
ALTER TABLE run_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "run_history_own" ON run_history FOR ALL USING (auth.uid() = user_id);
```

**`supabase/migrations/XXX_progression.sql`**:

```sql
-- Skill tree definitions (global, seeded from TypeScript const objects)
CREATE TABLE skill_trees (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role        TEXT NOT NULL CHECK (role IN ('KILLER', 'FED')),
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  branch_type TEXT NOT NULL CHECK (branch_type IN ('CORE', 'COUNTER_PLAY')),
  -- CORE = standard progression, COUNTER_PLAY = abilities that undermine opponent
  -- Counter-play trees cost 1.3x base material cost. Core trees cost 0.8x.
  cost_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  icon_key    TEXT NOT NULL,
  sort_order  INTEGER NOT NULL
);

-- Individual skill nodes within trees (10 per tree, 60 total)
CREATE TABLE skills (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tree_id        UUID NOT NULL REFERENCES skill_trees(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT NOT NULL,
  tier           INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 5),
  max_rank       INTEGER NOT NULL DEFAULT 1 CHECK (max_rank BETWEEN 1 AND 5),
  -- rank cost array: index 0 = rank 1 cost, index 4 = rank 5 cost
  -- e.g. [[{material:"blood_marks",amount:2}],[{material:"blood_marks",amount:4}],
  --        [{material:"blood_marks",amount:7},{material:"ghost_tokens",amount:1}],
  --        [{material:"blood_marks",amount:12},{material:"ghost_tokens",amount:2}],
  --        [{material:"blood_marks",amount:18},{material:"ghost_tokens",amount:4}]]
  cost_per_rank  JSONB NOT NULL,
  -- prerequisites: array of {skillId, minRank} objects
  prerequisites  JSONB NOT NULL DEFAULT '[]',
  -- ranks array: each entry is the TOTAL effect at that rank (not incremental)
  -- e.g. [{"rank":1,"effects":[{"type":"STAT_MOD","stat":"footprintRate","value":-0.08,"modType":"PERCENT"}]}, ...]
  ranks          JSONB NOT NULL,
  icon_key       TEXT NOT NULL,
  position_x     INTEGER NOT NULL,  -- grid column for visual layout
  position_y     INTEGER NOT NULL   -- grid row for visual layout
);

-- User's skill unlock state
CREATE TABLE user_skills (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id     UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  current_rank INTEGER NOT NULL DEFAULT 0 CHECK (current_rank >= 0),
  unlocked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, skill_id)
);
CREATE INDEX idx_user_skills_user ON user_skills(user_id);

-- Trophy definitions (global, 42 total: 18 killer, 18 fed, 6 shared)
-- Trophies are single-tier (no ranks). Power comes from unlock condition difficulty.
CREATE TABLE trophies (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role             TEXT NOT NULL CHECK (role IN ('KILLER', 'FED', 'SHARED')),
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  -- passive_effect: array of Effect objects (same schema as skill ranks.effects)
  passive_effect   JSONB NOT NULL,
  unlock_condition JSONB NOT NULL,
  -- e.g. {"type":"WIN_COUNT","role":"FED","count":5}
  -- or   {"type":"SCORE_THRESHOLD","score":5000}
  -- or   {"type":"BIOME_COMPLETE","biome":"city","role":"KILLER"}
  -- or   {"type":"CUMULATIVE_STAT","stat":"targets_eliminated","threshold":20}
  icon_key         TEXT NOT NULL,
  rarity           TEXT NOT NULL CHECK (rarity IN ('COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY'))
);

-- User's trophy collection
CREATE TABLE user_trophies (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trophy_id   UUID NOT NULL REFERENCES trophies(id) ON DELETE CASCADE,
  unlocked    BOOLEAN NOT NULL DEFAULT FALSE,
  equipped    BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, trophy_id)
);
CREATE INDEX idx_user_trophies_user ON user_trophies(user_id);

-- Equipment definitions (global)
-- Upgrade slots per rarity: COMMON 1, UNCOMMON 1, RARE 2, LEGENDARY 2, MYTHIC 3
CREATE TABLE equipment (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role             TEXT NOT NULL CHECK (role IN ('KILLER', 'FED', 'SHARED')),
  slot             TEXT NOT NULL CHECK (slot IN ('WEAPON', 'ARMOR', 'TOOL', 'ACCESSORY')),
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  stats            JSONB NOT NULL,
  -- e.g. {"damageBonus":10,"startingItem":"advanced_forensic_kit"}
  -- or   {"startingItems":["wiretap_kit","informant_badge"]}
  unlock_condition JSONB NOT NULL,
  icon_key         TEXT NOT NULL,
  rarity           TEXT NOT NULL CHECK (rarity IN ('COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY', 'MYTHIC')),
  -- upgrade_slots: derived from rarity at application time; stored for query efficiency
  upgrade_slots    INTEGER NOT NULL DEFAULT 1,
  -- obtain_condition for MYTHIC items (boss items)
  obtain_condition JSONB
  -- e.g. {"type":"BOSS_KILL","bossId":"the_watcher","difficulty":"HARD"}
  -- or   {"type":"SCORE_SINGLE_RUN","role":"KILLER","minScore":10000,"mustWin":true}
  -- or   {"type":"CUMULATIVE_STAT","stat":"wins_as_killer","threshold":25}
);

-- User's equipment collection
CREATE TABLE user_equipment (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id  UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  unlocked      BOOLEAN NOT NULL DEFAULT FALSE,
  attuned       BOOLEAN NOT NULL DEFAULT FALSE,  -- MYTHIC items require attunement (5 ghost tokens, one-time)
  unlocked_at   TIMESTAMPTZ,
  PRIMARY KEY (user_id, equipment_id)
);
CREATE INDEX idx_user_equipment_user ON user_equipment(user_id);

-- User saved loadouts (4 equipment slots per loadout)
CREATE TABLE user_loadouts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('KILLER', 'FED')),
  name          TEXT NOT NULL,
  trophy_id     UUID REFERENCES trophies(id) ON DELETE SET NULL,
  equipment_ids UUID[] NOT NULL DEFAULT '{}',  -- max 4, one per slot (WEAPON/ARMOR/TOOL/ACCESSORY)
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_loadouts_user_role ON user_loadouts(user_id, role);

-- User material balances
CREATE TABLE user_materials (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL,
  -- valid types: evidence_dust, blood_marks, ghost_tokens, case_files, shadow_coins, salvage_parts
  amount        INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0),
  PRIMARY KEY (user_id, material_type)
);

-- Crafting recipe definitions (global, seeded from code)
-- The Workshop (Killer) and The Armory (Fed) use this same table with role field
CREATE TABLE crafting_recipes (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role                  TEXT NOT NULL CHECK (role IN ('KILLER', 'FED', 'SHARED')),
  name                  TEXT NOT NULL,
  description           TEXT NOT NULL,
  category              TEXT NOT NULL,
  -- e.g. 'BLADE_MOD', 'FORENSIC_MOD', 'ARMOR_MOD', 'TOOL_MOD', 'GARROTE_MOD', etc.
  effects               JSONB NOT NULL,
  -- Array of Effect objects
  cost                  JSONB NOT NULL,
  -- e.g. [{"material":"blood_marks","amount":15},{"material":"salvage_parts","amount":4}]
  unlock_condition      JSONB NOT NULL DEFAULT '{"type":"DEFAULT"}',
  -- e.g. {"type":"SKILL_RANK","skillId":"K-B4","minRank":2}
  -- or   {"type":"TROPHY_OWNED","trophyId":"clean_hands"}
  -- or   {"type":"DEFAULT"}
  compatible_slots      TEXT[] NOT NULL DEFAULT '{}',
  -- e.g. ['WEAPON','TOOL'] — equipment slot types this recipe can be applied to
  compatible_categories TEXT[] NOT NULL DEFAULT '{}',
  -- e.g. ['BLADE','BLUNT'] — empty = all categories in the slot
  tier                  INTEGER NOT NULL DEFAULT 1 CHECK (tier BETWEEN 1 AND 3),
  -- Tier 1: default. Tier 2: skill-gated. Tier 3: achievement-gated.
  icon_key              TEXT NOT NULL
);

-- User's applied modifications per equipment (persistent between runs)
CREATE TABLE user_equipment_mods (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id  UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  slot_index    INTEGER NOT NULL CHECK (slot_index >= 0),
  recipe_id     UUID NOT NULL REFERENCES crafting_recipes(id) ON DELETE CASCADE,
  applied_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, equipment_id, slot_index)
  -- One mod per slot per equipment per user
);
CREATE INDEX idx_user_equipment_mods_user ON user_equipment_mods(user_id);

-- RLS
ALTER TABLE skill_trees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills                ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills           ENABLE ROW LEVEL SECURITY;
ALTER TABLE trophies              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trophies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipment        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loadouts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_materials        ENABLE ROW LEVEL SECURITY;
ALTER TABLE crafting_recipes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipment_mods   ENABLE ROW LEVEL SECURITY;

-- Global definitions: readable by all authenticated users
CREATE POLICY "skill_trees_read_all"      ON skill_trees      FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "skills_read_all"           ON skills           FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "trophies_read_all"         ON trophies         FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "equipment_read_all"        ON equipment        FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "crafting_recipes_read_all" ON crafting_recipes FOR SELECT USING (auth.role() = 'authenticated');

-- User data: own rows only
CREATE POLICY "user_skills_own"          ON user_skills         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_trophies_own"        ON user_trophies       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_equipment_own"       ON user_equipment      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_loadouts_own"        ON user_loadouts       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_materials_own"       ON user_materials      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_equipment_mods_own"  ON user_equipment_mods FOR ALL USING (auth.uid() = user_id);
```

**JSONB usage rationale**: `cost_per_rank`, `ranks`, `passive_effect`, `unlock_condition`, `stats`, `effects`, and `cost` are JSONB because the schema of skill/trophy/equipment/recipe effects is highly variable. A fixed column schema would require ALTER TABLE for every new effect type. Mitigated by Zod validation on every read path and registry-level validation at boot. Plan to add GIN index on `effects` if query patterns warrant.

### Rank System

Every skill has 1-5 ranks (configured per skill, stored as `max_rank`). Each rank costs materials at the rates defined in `cost_per_rank`. Ranks specify their **total** effect at that level, not incremental — this prevents floating-point accumulation and simplifies the engine.

**Diminishing returns formula** for percentage-based bonuses:

```
effectiveValue(rank) = baseValue * rank * (1 / (1 + 0.15 * (rank - 1)))
```

Where `0.15` is the diminishing factor (tunable constant in `packages/shared/src/constants/balance.ts`).

| Rank | Multiplier | Cumulative % vs linear | Example: base 8% per rank |
|------|-----------|----------------------|--------------------------|
| 1    | 1.00      | 100%                 | 8.0%                     |
| 2    | 0.87      | 93%                  | 13.9%                    |
| 3    | 0.77      | 88%                  | 18.5%                    |
| 4    | 0.69      | 84%                  | 22.1%                    |
| 5    | 0.63      | 81%                  | 25.0%                    |

Linear would give 40% at rank 5. Diminishing returns gives 25%. This means rank 1 is the best value-per-material, encouraging breadth over depth.

Flat bonuses (damage, health, pixels) scale linearly with a hard cap enforced by `StatModifierSystem`.

### Adjusted Skill Cost Per Rank

The revised cost table targets approximately 20 runs for competitive viability in one tree, 50 runs to max a core tree, and 100+ runs to max all three trees.

| Rank | Primary Material | Ghost Tokens | Total Materials | Design Intent |
|------|-----------------|--------------|-----------------|---------------|
| 1    | 2               | 0            | 2               | Accessible — one average run covers 1-2 rank-ups |
| 2    | 4               | 0            | 4               | Moderate — one good run covers a rank-up |
| 3    | 7               | 1            | 8               | Investment — introduces ghost token gate |
| 4    | 12              | 2            | 14              | Significant — requires 2-3 dedicated runs |
| 5    | 18              | 4            | 22              | Achievement — capstone milestone |

**Tree cost multipliers**: Core trees (Stealth, Brutality, Forensics) apply 0.8x to the base costs above, making them more accessible. Counter-play trees (Deception, Interrogation, Tactics) apply 1.3x, reflecting that these abilities directly affect the opponent's experience.

**Realistic progression phases**:
- Phase 1 (early game, ~1-20 runs): Unlock all tier 1-2 skills at rank 1-2. Rapid power growth, new abilities every few runs.
- Phase 2 (mid game, ~20-50 runs): Push key skills to rank 3-4, unlock tier 3 abilities. Meaningful specialization choices.
- Phase 3 (late game, ~50-100+ runs): Max capstone skills, unlock counter-play depth. Completionist grind for dedicated players.

Players are already competitive at 20-30 runs. Full tree completion is for dedicated players, not required for competitive viability.

### Stat Cap System

All stats have hard caps enforced by `StatModifierSystem` regardless of source (skills, trophies, equipment, crafting mods). Defined in `packages/shared/src/constants/balance.ts`:

```typescript
export const STAT_CAPS: Record<string, { maxPercent?: number; maxFlat?: number }> = {
  moveSpeed:            { maxPercent: 0.15 },   // max +15% from all sources
  footprintRate:        { maxPercent: -0.85 },  // cannot reduce below 15% of base
  detectionRadius:      { maxPercent: -0.50 },  // NPCs always detect within 50% of base radius
  noiseGeneration:      { maxPercent: -0.50 },  // min 50% noise
  meleeDamage:          { maxFlat: 80 },        // base 25 + max 55 bonus
  rangedDamage:         { maxFlat: 60 },
  scanRadius:           { maxPercent: 0.40 },   // max +40% scan radius
  interviewReliability: { maxPercent: 0.15 },   // max +15% witness reliability
  heatCostReduction:    { maxPercent: -0.40 },  // counter-play heat costs min 60% of base
  falseEvidenceDetection: { maxPercent: 0.50 }, // max 50% passive detection (active analysis adds more)
};
```

Crafting mods count toward these caps — no stacking exploits through multiple sources.

### Skill Tree Catalog

Each role has 3 trees with 10 skills each. Tier gating: Tier N requires at least 2 skills from Tier N-1 (any rank) before unlocking. Data files live at `packages/shared/src/data/skills/`.

#### KILLER TREE 1: STEALTH (CORE — 0.8x cost multiplier)

Movement, evasion, detection avoidance.

| ID   | Name                | Tier | Max Rank | Effect at R1 → R5 | Prerequisites |
|------|---------------------|------|----------|--------------------|---------------|
| K-S1 | Shadow Steps        | 1    | 5        | footprint gen -8%, move speed +3% → -26%, +9% | None |
| K-S2 | Soft Landing        | 1    | 3        | fall/jump noise -30% → -70% | None |
| K-S3 | Peripheral Awareness| 1    | 5        | NPC detection warn radius +15px → +52px | None |
| K-S4 | Quiet Killer        | 2    | 5        | stealth kill noise radius -10% → -33% | K-S1(R2) |
| K-S5 | Blend In            | 2    | 3        | heat decay rate +15% when stationary → +33% | K-S1(R1), K-S3(R1) |
| K-S6 | Ghost Presence      | 2    | 5        | NPC awareness radius toward you -6% → -20% | K-S4(R1) |
| K-S7 | Vanishing Act       | 3    | 3        | UNLOCKS smoke bomb ability. R1: 90s CD → R3: 55s CD, also breaks combat tracking | K-S5(R2), K-S6(R1) |
| K-S8 | Shadow Dash         | 3    | 5        | short-range dash 150px, 30s CD → +90px range, -7s CD, no footprints during dash | K-S6(R2) |
| K-S9 | Invisible Predator  | 4    | 3        | disguise lasts 50% longer → +100%, disguise not consumed on NPC close inspection | K-S7(R2), K-S8(R2) |
| K-S10| Perfect Shadow      | 5    | 1        | UNLOCKS 15s full invisibility (4min CD). NPCs ignore. Footprints still 30% rate. | K-S9(R2) |

Hard caps: Shadow Steps speed bonus cap +9% at rank 5. Ghost Presence detection reduction cap -20%. No combination can reduce footprints below 15% of base rate.

#### KILLER TREE 2: BRUTALITY (CORE — 0.8x cost multiplier)

Combat effectiveness, kill efficiency, body handling.

| ID   | Name              | Tier | Max Rank | Effect at R1 → R5 | Prerequisites |
|------|-------------------|------|----------|--------------------|---------------|
| K-B1 | Iron Grip         | 1    | 5        | melee damage +4 → +14 flat (cap) | None |
| K-B2 | Lethal Efficiency | 1    | 5        | kill animation speed +8% → +26% | None |
| K-B3 | Tough Skin        | 1    | 5        | damage taken -3% → -11% | None |
| K-B4 | Clean Strike      | 2    | 5        | combat kills generate 6% less DNA evidence → -20% | K-B1(R2) |
| K-B5 | Efficient Disposal| 2    | 5        | disposal time -8% → -26% | K-B2(R1) |
| K-B6 | Bone Breaker      | 2    | 3        | stun duration +20% → +45%, targets cannot call for help while stunned | K-B1(R3), K-B3(R1) |
| K-B7 | Quick Disposal    | 3    | 3        | UNLOCKS quick disposal ability. R1: 0.20 evidence reduction, 120s CD → R3: 0.40 reduction, 90s CD | K-B5(R2) |
| K-B8 | Combat Frenzy     | 3    | 5        | after killing, +5% attack speed for 10s → +15%, 16s | K-B4(R2), K-B6(R1) |
| K-B9 | Unstoppable       | 4    | 3        | stun immunity 3s after taking damage → 8s + slow immunity | K-B6(R3), K-B8(R2) |
| K-B10| Apex Predator     | 5    | 1        | passive health regen (1HP/2s) in combat. All kill methods -1s. Boss targets start at 90% HP. | K-B9(R2) |

Hard caps: Iron Grip max +14 flat damage. Tough Skin max -11% damage reduction. Combat Frenzy attack speed cap +15%.

#### KILLER TREE 3: DECEPTION (COUNTER_PLAY — 1.3x cost multiplier)

Abilities that actively undermine fed investigation. Visually distinct (dark background, red accent border) to communicate ethical weight.

| ID   | Name                    | Tier | Max Rank | Effect at R1 → R5 | Prerequisites |
|------|-------------------------|------|----------|--------------------|---------------|
| K-D1 | Evidence Awareness      | 1    | 5        | killer sees own evidence trail +10% radius → +33%, R5 shows age (color-coded freshness) | None |
| K-D2 | Witness Reader          | 1    | 3        | see NPC alert state icons. R2: shows confidence level. R3: shows informants (fed's glow) | None |
| K-D3 | Cleanup Specialist      | 1    | 5        | evidence cleanup radius +10px → +32px, R5 cleanup speed +20% | None |
| K-D4 | Fake Evidence Plant     | 2    | 5        | UNLOCKS ability. R1: LOW quality. R2: MEDIUM. R3: HIGH, 10% harder to detect. R5: 25% harder | K-D1(R2), K-D3(R1) |
| K-D5 | Decoy Trail             | 2    | 5        | UNLOCKS ability. R1: 5 footprints, 90s. R5: 13 footprints, 210s, 18% harder to detect | K-D1(R1) |
| K-D6 | Witness Intimidation    | 2    | 5        | UNLOCKS ability. R1: 48px range, 2s anim → R5: 112px, 1s, works with 1 NPC in LOS | K-D2(R2) |
| K-D7 | Surveillance Jamming    | 3    | 5        | UNLOCKS ability. R1: 45s jam duration → R5: 105s, jammed cameras show fake "all clear" feed | K-D4(R2), K-D5(R1) |
| K-D8 | False Alibi Construction| 3    | 3        | UNLOCKS ability. R1: 40% detection by forensics → R3: 20% detection, 6s animation | K-D6(R3) |
| K-D9 | Master Forger           | 4    | 3        | all fake evidence starts +1 quality tier. R2: decay time +50%. R3: immune to passive detection | K-D7(R2), K-D8(R1) |
| K-D10| Phantom Identity        | 5    | 1        | UNLOCKS once-per-run: create complete false identity package (fake DNA + weapon trace + witness statement) for one innocent NPC. 35s setup. Costs all 3 counter-play resources. +25 false arrest viability if undetected. | K-D9(R3) |

Hard caps: Fake evidence detection reduction cap at 25% harder (trophy stacking max 40%). Decoy trail max 13 footprints. Witness intimidation range cap 112px.

#### FED TREE 1: FORENSICS (CORE — 0.8x cost multiplier)

Evidence gathering, analysis, quality improvement.

| ID   | Name                  | Tier | Max Rank | Effect at R1 → R5 | Prerequisites |
|------|-----------------------|------|----------|--------------------|---------------|
| F-F1 | Sharp Eye             | 1    | 5        | scan radius +8% → +26% | None |
| F-F2 | Quick Scan            | 1    | 5        | scan cooldown -1.5s → -4.8s | None |
| F-F3 | Evidence Preservation | 1    | 5        | evidence decay timer +12% → +39% | None |
| F-F4 | Trace Analysis        | 2    | 5        | evidence quality upgrade speed +10% → +33% | F-F1(R2) |
| F-F5 | Pattern Recognition   | 2    | 5        | passive 5% chance to auto-flag fake evidence on discovery → 17% (max) | F-F1(R1), F-F3(R1) |
| F-F6 | Crime Scene Specialist| 2    | 3        | crime scene analysis bonus +5 arrest viability. R3: reveals hidden evidence in crime scene zone | F-F4(R1) |
| F-F7 | Forensic Intuition    | 3    | 5        | active forensic analysis detects false evidence +4% chance → +14% | F-F4(R3), F-F5(R2) |
| F-F8 | Evidence Networking   | 3    | 3        | evidence of same type within 200px auto-links to same suspect. R3: 360px, auto-eliminate contradicting suspects | F-F5(R3), F-F6(R2) |
| F-F9 | Forensic Expert       | 4    | 3        | all evidence quality upgrades gain +1 bonus tier. R2: IRREFUTABLE contributes +5 extra. R3: reconstruct destroyed evidence (50% quality, 90s CD) | F-F7(R3), F-F8(R1) |
| F-F10| Master Analyst        | 5    | 1        | scan reveals ALL evidence types including HIDDEN. Passive: 25% chance to detect false evidence on first examination. Evidence quality upgrades never fail. | F-F9(R2) |

Hard caps: Scan radius max +26% from skills alone (total all sources +40%). Fake evidence passive detection max 17%.

#### FED TREE 2: INTERROGATION (COUNTER_PLAY — 1.3x cost multiplier)

Witness coercion, intelligence gathering, planted informants.

| ID   | Name                 | Tier | Max Rank | Effect at R1 → R5 | Prerequisites |
|------|----------------------|------|----------|--------------------|---------------|
| F-I1 | Silver Tongue        | 1    | 5        | witness reliability +3% → +10% | None |
| F-I2 | Body Language Reader | 1    | 5        | interview reveals NPC suspicion level at +10% accuracy → +33% | None |
| F-I3 | Off-Books Forensics  | 1    | 5        | UNLOCKS ability. R1: discovery time x0.5, heat +5 → R5: x0.1, heat +3 | None |
| F-I4 | Rough Interrogation  | 2    | 5        | UNLOCKS ability. R1: forces reliability 0.80, heat +15 → R5: 0.90, heat +10, silenced witnesses heat +18 | F-I1(R2), F-I2(R1) |
| F-I5 | Planted Informant    | 2    | 5        | UNLOCKS ability. R1: 1 max, 150px radius, heat +10 → R5: 3 max, 220px, heat +6, survives 1 intimidation | F-I2(R2) |
| F-I6 | Network Builder      | 2    | 3        | when informant reports, +3 suspicion score on reported entity → R3: +7, includes movement direction | F-I5(R1), F-I1(R1) |
| F-I7 | Illegal Surveillance | 3    | 5        | UNLOCKS ability. R1: restores cameras 45s, heat +8 → R5: 85s, heat +5, cameras detect STEALTH entities | F-I4(R2) OR F-I5(R2) |
| F-I8 | Heat Management      | 3    | 5        | all counter-play heat costs -5% → -17% | Two Tier 2 skills in Interrogation |
| F-I9 | Deep Cover Operations| 4    | 3        | informants immune to intimidation if killer suspicion < 50 → < 80, also report nearby ability use | F-I7(R2), F-I8(R2) |
| F-I10| Shadow Network       | 5    | 1        | passive: all NPCs 8% chance to spontaneously report suspicious activity (max 1 per 60s). Counter-play heat costs -25% (stacks with Heat Management, total cap 40%). | F-I9(R2) |

Hard caps: Witness reliability bonus max +10%. Heat cost reduction total cap 40% from all sources. Max informants: 3 (never 4+). Rough Interrogation minimum heat cost: 10.

#### FED TREE 3: TACTICS (COUNTER_PLAY — 1.3x cost multiplier)

Investigation strategy, entrapment, area control.

| ID   | Name                  | Tier | Max Rank | Effect at R1 → R5 | Prerequisites |
|------|-----------------------|------|----------|--------------------|---------------|
| F-T1 | Rapid Response        | 1    | 5        | area lockdown cooldown -10s → -33s | None |
| F-T2 | Pursuit Training      | 1    | 5        | move speed +2% during active investigation → +7% | None |
| F-T3 | Zone Profiling        | 1    | 3        | entering new zone reveals evidence count. R2: type breakdown. R3: flags zones with false evidence | None |
| F-T4 | Entrapment Setup      | 2    | 5        | UNLOCKS ability. R1: decoy 60s, heat +20 → R5: 120s, heat +12, 2 decoys per run | F-T1(R1), F-T2(R1) |
| F-T5 | Tactical Positioning  | 2    | 5        | lockdown zone exit seal duration +5s → +16s, R5 reveals all entities in zone on minimap | F-T1(R2) |
| F-T6 | Predictive Analysis   | 2    | 3        | HUD shows predicted zone for next kill at 30% accuracy → R3: 55% accuracy + time window | F-T3(R2) |
| F-T7 | Ambush Specialist     | 3    | 3        | when in same zone as killer 5s+, get directional indicator. R3: 3s, 45-degree cone, +10% damage | F-T4(R2), F-T5(R2) |
| F-T8 | Evidence Cordon       | 3    | 5        | UNLOCKS ability: mark 256px area, evidence cannot be destroyed 45s, 180s CD → R5: 105s, CD -40s, prevents surveillance jamming | F-T5(R3), F-T6(R1) |
| F-T9 | Clean Operation       | 4    | 3        | fedHeat Severe threshold raised from 81 to 90 → R3: to 100 (effectively removes Severe penalty under 100) | F-T7(R2), F-T8(R2) |
| F-T10| Ghost Agent           | 5    | 1        | counter-play evidence tagged "admissible" (not flagged inadmissible). Heat accumulation 60% of normal. Once-per-run: retroactively make all inadmissible evidence from this run admissible (costs 30 heat). | F-T9(R2) |

Hard caps: Lockdown duration extension max +16s. Entrapment max 2 decoys per run. Ambush indicator never reveals exact position.

### Ghost Token Economy

Ghost tokens are the universal premium gate across all three systems (skills, boss items, crafting). They create the core allocation decision.

**Sources**:

| Source | Amount | Frequency |
|--------|--------|-----------|
| Good win (score 3000-5999) | 1 | Per run |
| Excellent win (score 6000+) | 2 | Per run |
| First win of the day | +1 bonus | Daily |
| Biome first-clear bonus | 3 | Once per biome per role |
| Achievement milestones (every 5th trophy unlocked) | 2 | Milestone |
| Weekly challenge completion | 3-5 | Weekly |

**Sinks**:
- Tier 3 skill ranks: 1 GT per rank
- Tier 4 skill ranks: 2 GT per rank
- Tier 5 skill ranks: 4 GT per rank
- Boss item attunement: 5 GT per item (one-time)
- Crafting Tier 2 recipes: 1-2 GT
- Crafting Tier 3 recipes: 5-8 GT

A typical "good" player earns ~0.7-1.0 GT per run. This creates genuine allocation decisions between skill depth, boss items, and crafting upgrades.

### Trophy System

42 trophies total: 18 killer, 18 fed, 6 shared. Trophies are **single-tier** (no ranks) — power comes from unlock condition difficulty. Equip limit: **1 trophy per role per loadout**. Data files at `packages/shared/src/data/trophies/`.

#### KILLER TROPHIES (18)

| ID   | Trophy              | Rarity    | Passive Effect | Unlock Condition |
|------|---------------------|-----------|---------------|-----------------|
| KT-1 | Beginner's Luck     | COMMON    | +10% material drops from first kill each run | Win 1 run as Killer |
| KT-2 | Stalker's Patience  | COMMON    | Heat decay rate +20% when stationary 5s+ | Complete 5 runs as Killer |
| KT-3 | Butcher's Apron     | UNCOMMON  | BLADED_WEAPON kills generate 15% less DNA evidence | Kill 20 targets with bladed weapons |
| KT-4 | Silent Threatener   | UNCOMMON  | Witness Intimidation range +30px (if unlocked) | Use Witness Intimidation in 10 different runs |
| KT-5 | Poisoner's Ring     | UNCOMMON  | Poison kill delay reduced by 8s (30s to 22s) | Kill 10 targets with Poison method |
| KT-6 | Gloves of the Trade | UNCOMMON  | DNA evidence quality reduced 1 tier (minimum LOW) | Complete 15 runs with 0 DNA discovered by fed |
| KT-7 | Frame Artist        | RARE      | Fake Evidence Plant: planted evidence starts at MEDIUM quality instead of LOW | Plant fake evidence in 15 runs |
| KT-8 | Signal Breaker      | RARE      | Surveillance Jamming duration +20s, jammed cameras show "maintenance mode" | Complete city biome 5 times as Killer |
| KT-9 | Body Bag            | RARE      | Carrying body speed penalty reduced 60% to 40% | Dispose of 25 bodies total |
| KT-10 | Clean Hands        | RARE      | Start each run with 1x Cleaning Supplies (free) | Win 10 runs with 0 evidence discovered |
| KT-11 | Night Owl          | RARE      | During night phases: detection radius -15%, footprint gen -20% | Win 5 runs without being detected by any NPC |
| KT-12 | Quick Change Artist| RARE      | Disguise Change cooldown -15s, 25% chance not consuming disguise kit | Use Disguise Change 50 times total |
| KT-13 | Acid Touch         | RARE      | ACID_DISSOLVE disposal evidence reduction increased to 0.98 (from 0.95) | Use ACID_DISSOLVE disposal 10 times |
| KT-14 | The Setup          | LEGENDARY | False Alibi detection chance -15% (stacks with skill tree, floor: 10%) | Win 25 runs as Killer |
| KT-15 | Ghost Protocol     | LEGENDARY | Start each run with 15s of INVISIBILITY status effect | Win 10 runs with zero NPCs entering ALARMED state |
| KT-16 | Master of Disguise | LEGENDARY | Disguise change resets all NPC witness memories of last 30s | Win 5 runs using only STRANGULATION kill method |
| KT-17 | Phantom Killer     | LEGENDARY | All non-BODY, non-IRREFUTABLE evidence decays 30% faster | Achieve score >8000 in a single Killer run |
| KT-18 | Trophy Collector   | LEGENDARY | +25% material drops from all sources. +1 optional target per run (bonus score only). | Unlock 15 other Killer trophies |

#### FED TROPHIES (18)

| ID   | Trophy              | Rarity    | Passive Effect | Unlock Condition |
|------|---------------------|-----------|---------------|-----------------|
| FT-1 | Rookie Badge        | COMMON    | +10% material drops from first evidence discovered each run | Win 1 run as Fed |
| FT-2 | Keen Observer       | COMMON    | Passive evidence discovery radius +15px | Complete 5 runs as Fed |
| FT-3 | Forensic Enthusiast | UNCOMMON  | Evidence quality upgrade speed +10% | Upgrade 50 evidence pieces total |
| FT-4 | Off the Record      | UNCOMMON  | Off-Books Forensics fedHeat cost -2 per use | Use Off-Books Forensics 20 times |
| FT-5 | Witness Whisperer   | UNCOMMON  | All witness reliability +5% | Interview 50 witnesses total |
| FT-6 | Bloodhound          | UNCOMMON  | FOOTPRINT evidence discovery radius +30px | Discover 100 footprint evidence pieces |
| FT-7 | Hard-Nosed          | RARE      | Rough Interrogation on silenced witnesses costs same heat as normal | Arrest with STRONG evidence 5 times |
| FT-8 | Deep Mole           | RARE      | Planted informants survive killer intimidation with 40% chance (stacks with skill tree) | Use Planted Informant in 15 runs |
| FT-9 | Case Builder        | RARE      | Crime scene analysis bonus +5 arrest viability | Build 20 case files with STRONG or better rating |
| FT-10 | Cold Reader        | RARE      | Profile Analysis reveals if NPC has been bribed or alibi'd by killer | Identify killer correctly in 10 runs without false arrests |
| FT-11 | Iron Will          | RARE      | fedHeat decay rate +15% when not using counter-play abilities | Complete 5 runs with fedHeat never exceeding 40 |
| FT-12 | Camera Expert      | RARE      | Surveillance Access duration +15s, also shows evidence locations on camera feed | Access surveillance cameras 30 times |
| FT-13 | Evidence Vault     | RARE      | Start each run with 2x Evidence Bags (free) | Preserve 30 evidence pieces from decay |
| FT-14 | The Sting          | LEGENDARY | Entrapment Setup can be used twice per run. Triggers generate MEDIUM quality evidence at decoy location. | Win 25 runs as Fed |
| FT-15 | Perfect Record     | LEGENDARY | Arrest viability score +5 baseline. All evidence contributes +2 extra to viability. | Achieve 5 AIRTIGHT arrests |
| FT-16 | Master Detective   | LEGENDARY | Passive: 10% chance per evidence discovery to also reveal 1 additional nearby HIDDEN evidence piece. | Win 10 runs with zero false arrests and zero inadmissible evidence |
| FT-17 | Relentless Pursuit | LEGENDARY | If killer in same zone 3s+, receive subtle screen-edge glow indicator (direction only, 90-degree precision). | Arrest killer within 5 minutes of run start, 3 times |
| FT-18 | Trophy Hunter      | LEGENDARY | +25% material drops from all sources. +1 bonus objective per run. | Unlock 15 other Fed trophies |

#### SHARED TROPHIES (6)

| ID   | Trophy          | Rarity    | Passive Effect | Unlock Condition |
|------|-----------------|-----------|---------------|-----------------|
| ST-1 | Veteran         | COMMON    | Start with +15 max health | Win 3 runs in any role |
| ST-2 | Strategist      | UNCOMMON  | +1 free shop reroll per run | Complete 20 runs in any role |
| ST-3 | Survivor        | UNCOMMON  | When health drops below 20%, gain +20% move speed for 5s (once per run) | Survive 10 runs below 30% health |
| ST-4 | Ghost           | RARE      | 5s invincibility at run start | Score >5000 in any single run |
| ST-5 | Marathon Runner | RARE      | Stamina regen rate +15% | Complete 50 runs total |
| ST-6 | Completionist   | LEGENDARY | All equipped trophies grant an additional +5% to their primary effect | Unlock 30 trophies across both roles |

### Equipment System

4 equipment slots per loadout: WEAPON, ARMOR, TOOL, ACCESSORY.

Weapon categories — Killer: BLADE, BLUNT, GARROTE, RANGED, POISON, TASER, EXPLOSIVE
Weapon categories — Fed: SIDEARM, MELEE, SHIELD

Upgrade slots per rarity: COMMON: 1, UNCOMMON: 1, RARE: 2, LEGENDARY: 2, MYTHIC: 3

Selected equipment items that unlock counter-play starting items:

**Killer counter-play equipment**:
- **Deceiver's Kit** (ACCESSORY, RARE) — starts run with 1x fake evidence bundle + 1x decoy trail marker
  - `startingItems: ['fake_evidence_bundle', 'decoy_trail_marker']`
  - Unlock: used FAKE_EVIDENCE_PLANT in 5 runs

**Fed counter-play equipment**:
- **Off-Books Briefcase** (TOOL, RARE) — starts run with WIRETAP_KIT + OFFBOOKS_LAB_KIT
  - `startingItems: ['wiretap_kit', 'offbooks_lab_kit']`
  - Unlock: used ILLEGAL_SURVEILLANCE in 5 runs
- **Handler's Badge** (ACCESSORY, RARE) — starts run with INFORMANT_BADGE + ENTRAPMENT_KIT
  - `startingItems: ['informant_badge', 'entrapment_kit']`
  - Unlock: used PLANTED_INFORMANT in 8 runs

### Boss Items (MYTHIC Tier)

Boss items are hand-crafted MYTHIC-rarity artifacts with unique CUSTOM effect handlers. 14 total: 7 killer (KB-1 through KB-7), 7 fed (FB-1 through FB-7). Data files at `packages/shared/src/data/boss-items/`. Custom handlers at `packages/game-engine/src/effects/boss-item-handlers.ts`.

Attunement cost: **5 ghost tokens** per boss item (one-time). Once attuned, the item equips freely.

#### Killer Boss Items (7)

**KB-1: Reaper's Thread** (WEAPON — Garrote)
- Effect: After strangulation kill, 128px "death zone" forms at kill location for 10s. Evidence in zone decays 5x faster. Fed entering zone has scan accuracy -30%.
- Handler: `reapers_thread_kill_zone`
- Obtain: Defeat "The Watcher" boss on Hard with strangulation-only challenge.
- Trade-off: Garrote kills require 3s close contact. Sacrifices faster kill methods.

**KB-2: Phantom Blade** (WEAPON — Blade)
- Effect: Kills cause body to become "ethereal" for 20s — invisible to NPCs and fed scan. Body reappears normally after 20s.
- Handler: `phantom_blade_ethereal_kill`
- Obtain: Score 10,000+ in a single run as Killer (must win).
- Trade-off: Only 10 base damage. Body eventually appears — delay, not destruction.

**KB-3: The Puppeteer's Strings** (ACCESSORY)
- Effect: Once per run, "puppeteer" a killed NPC — their sprite continues their routine for 60s as if alive. Cannot be interacted with (interview, examine). After 60s, they collapse.
- Handler: `puppeteer_dead_npc`
- Obtain: Win 5 runs where zero NPCs enter ALARMED state.
- Trade-off: Once per run. Puppeteered NPC cannot speak if fed tries to interview — itself suspicious.

**KB-4: Crimson Catalyst** (TOOL)
- Effect: Every kill within 60s of previous grants stacking "bloodlust": +8% move speed, +5% attack speed, -10% noise per stack. Max 3 stacks. Stacks decay after 30s without a kill.
- Handler: `crimson_catalyst_bloodlust`
- Obtain: Eliminate 4 targets in a single run within 3 minutes.
- Trade-off: Encourages rapid killing (more evidence, more witnesses). Takes tool slot.

**KB-5: The Hollow Mask** (ARMOR)
- Effect: While disguised, killer passes NPC close inspection checks with 100% success. Witnesses who see a crime while killer is disguised remember the disguise identity — heat -15 instead of gained heat.
- Handler: `hollow_mask_disguise_master`
- Obtain: Complete 3 different biomes using only disguise-based gameplay (no combat kills, all kills while disguised).
- Trade-off: 0 armor stats — physically vulnerable. Effect lost if disguise removed mid-crime.

**KB-6: Nightfall Cloak** (ARMOR)
- Effect: During night phases, killer is semi-transparent (detection radius -40% extra). Footprint evidence during night phases has quality reduced by 2 tiers. Day phases: no effect.
- Handler: `nightfall_cloak_night_power`
- Obtain: Win 3 runs where all kills happen during night phases.
- Trade-off: No effect during day (roughly half the run). Useless in biomes without a night cycle.

**KB-7: Memento Mori** (ACCESSORY)
- Effect: After each kill, can "collect a trophy" (5s animation). Each collected trophy gives permanent +3% to all stat bonuses for the rest of the run. Max 5 trophies. At 5 trophies, gain a one-time 10s INVISIBILITY.
- Handler: `memento_mori_collect`
- Obtain: Win 10 runs with maximum score (all optional objectives completed).
- Trade-off: 5s at an evidence-rich kill site is extremely risky. Modest per-trophy bonus requires all 5 for significant impact.

#### Fed Boss Items (7)

**FB-1: The Lie Detector** (TOOL)
- Effect: During witness interviews, can activate "deep reading" (costs +10 fedHeat). Reveals: whether witness was intimidated, whether testimony is about real or planted evidence, exact suspicion score the witness holds for each nearby NPC.
- Handler: `lie_detector_deep_read`
- Obtain: Correctly identify killer in 10 runs without any false arrests.
- Trade-off: High heat cost per use. Takes tool slot. Requires getting close to witnesses.

**FB-2: Quantum Scanner** (TOOL)
- Effect: Scan has two modes. "Quantum" mode (alt-fire) scans entire current zone in 360-degree pulse, revealing all evidence/entities/cameras for 5s. 180s cooldown. Evidence revealed via quantum is tagged "QUANTUM_SCANNED" and quality reduced 1 tier.
- Handler: `quantum_scanner_pulse`
- Obtain: Discover 500 total evidence pieces across all runs.
- Trade-off: 180s cooldown. Discovered evidence is lower quality. Zone-wide scan can overwhelm.

**FB-3: The Profiler's Notebook** (ACCESSORY)
- Effect: Passively tracks killer movement patterns. After discovering 3+ evidence pieces, generates a zone-level heat map overlay on minimap showing where killer has spent most time (updated every 30s, 60s delay from real-time).
- Handler: `profiler_notebook_heatmap`
- Obtain: Win 15 runs as Fed with arrest viability STRONG or better.
- Trade-off: Takes accessory slot. 60s delay (historical, not real-time). Requires 3+ discoveries before activating.

**FB-4: Aegis Badge** (ARMOR)
- Effect: When fed takes damage, 25% chance to generate MEDIUM quality evidence at damage location (attacker DNA/trace). If fed health drops below 25%, all cameras within 2 zones auto-activate for 30s.
- Handler: `aegis_badge_damage_evidence`
- Obtain: Win 5 runs where the fed was attacked by killer but still won.
- Trade-off: Requires taking damage to trigger. No base armor stats. Counter-intuitive: rewards getting hit.

**FB-5: Chain of Command** (ACCESSORY)
- Effect: Doubles max planted informants (if skill unlocked). All informants share intel — when one spots something suspicious, all informants become "alert" with doubled watch radius for 15s.
- Handler: `chain_of_command_network`
- Obtain: Use Planted Informant ability in 25 different runs.
- Trade-off: Useless without Interrogation tree investment. More informants means more heat cost per run.

**FB-6: Forensic Resonance Lens** (WEAPON — replaces sidearm)
- Effect: Non-lethal resonance weapon, 5 damage. On hit: applies "Forensic Tag" (60s). Tagged entities leave a faint trail visible only to fed. If the tagged entity is the killer, ALL evidence they generate while tagged is auto-discovered and starts +1 quality tier.
- Handler: `forensic_resonance_tag`
- Obtain: Achieve 3 AIRTIGHT arrests.
- Trade-off: Only 5 damage (much lower than any sidearm). Must successfully hit killer — requires engagement.

**FB-7: The Archives** (TOOL)
- Effect: Once per run, can "consult the archives" (15s channel, cannot move). Reveals: kill method used for most recent kill, approximate time since last kill (±30s accuracy), and one random trait of killer's loadout.
- Handler: `archives_consult`
- Obtain: Win 20 runs total as Fed.
- Trade-off: Once per run. 15s channel time — very vulnerable. Information is partial (random trait disclosure).

### Crafting System (The Workshop / The Armory)

Each role has a thematic crafting system: **Killer = "The Workshop"** (dark, utilitarian workbench), **Fed = "The Armory"** (institutional equipment locker). Mechanically identical; differ only in thematic framing and recipe pool.

**Upgrade slots by rarity**: COMMON: 1, UNCOMMON: 1, RARE: 2, LEGENDARY: 2, MYTHIC: 3. Mods are persistent between runs. Mods can be removed but materials are NOT refunded. Removal costs 2 salvage_parts flat fee.

**New material — Salvage Parts** (`salvage_parts`): obtained by dismantling unwanted equipment.
- COMMON dismantled: 1 salvage
- UNCOMMON: 2 salvage
- RARE: 4 salvage
- LEGENDARY: 8 salvage
- MYTHIC: cannot be dismantled

Recipe data files at `packages/shared/src/data/crafting/`. All crafting bonuses count toward STAT_CAPS.

#### Killer Workshop Recipes (10)

**Tier 1 — Basic Modifications (default, no gate)**:

| ID   | Recipe Name      | Category  | Effects | Cost |
|------|-----------------|-----------|---------|------|
| KR-1 | Whetstone Edge  | BLADE_MOD | `[{ type: 'STAT_MOD', stat: 'meleeDamage', value: 3, modType: 'FLAT' }]` | 8 BM + 2 salvage — WEAPON (BLADE only) |
| KR-2 | Weighted Handle | BLUNT_MOD | `[{ type: 'STAT_MOD', stat: 'meleeDamage', value: 2, modType: 'FLAT' }, { type: 'APPLY_STATUS', statusId: 'STUN', durationMs: 500 }]` | 8 BM + 2 salvage — WEAPON (BLUNT only) |
| KR-3 | Reinforced Padding | ARMOR_MOD | `[{ type: 'STAT_MOD', stat: 'maxHealth', value: 10, modType: 'FLAT' }]` | 6 BM + 3 salvage — ARMOR |
| KR-4 | Silent Soles    | TOOL_MOD  | `[{ type: 'STAT_MOD', stat: 'noiseGeneration', value: -0.05, modType: 'PERCENT' }]` | 10 BM + 2 salvage — ARMOR, ACCESSORY |

**Tier 2 — Advanced Modifications (skill-gated)**:

| ID   | Recipe Name       | Category  | Effects | Cost | Unlock |
|------|-------------------|-----------|---------|------|--------|
| KR-5 | Serrated Filing   | BLADE_MOD | `[{ type: 'APPLY_STATUS', statusId: 'BLEED', durationMs: 4000 }]` | 15 BM + 4 salvage + 1 GT | K-B1 rank 3 |
| KR-6 | Toxin Coating     | BLADE_MOD | `[{ type: 'APPLY_STATUS', statusId: 'POISON', durationMs: 6000 }]` | 15 BM + 4 salvage + 2 GT | K-B4 rank 2 |
| KR-7 | Shadow Lining     | ARMOR_MOD | `[{ type: 'STAT_MOD', stat: 'detectionRadius', value: -0.08, modType: 'PERCENT' }]` | 12 BM + 3 salvage + 1 GT | K-S6 rank 2 |
| KR-8 | Quick-Release Sheath | TOOL_MOD | `[{ type: 'STAT_MOD', stat: 'killAnimSpeed', value: 0.10, modType: 'PERCENT' }]` | 14 BM + 3 salvage + 2 GT | K-B2 rank 3 |

**Tier 3 — Master Modifications (achievement-gated)**:

| ID    | Recipe Name                   | Category  | Effects | Cost | Unlock |
|-------|-------------------------------|-----------|---------|------|--------|
| KR-9  | Evidence-Dissolving Compound  | BLADE_MOD | `[{ type: 'EVIDENCE_REDUCTION', evidenceTypeId: 'DNA', percent: 0.15 }]` | 25 BM + 8 salvage + 5 GT | Trophy: Clean Hands |
| KR-10 | Phantom Grip                  | GARROTE_MOD | `[{ type: 'CUSTOM', handler: 'phantom_grip_silent_kill', params: { noiseReduction: 0.90, evidenceReduction: 0.30 } }]` | 30 BM + 10 salvage + 8 GT | K-S10 unlocked |

#### Fed Armory Recipes (10)

**Tier 1 — Standard Issue Upgrades (default, no gate)**:

| ID   | Recipe Name            | Category     | Effects | Cost |
|------|------------------------|--------------|---------|------|
| FR-1 | Improved Sights        | SIDEARM_MOD  | `[{ type: 'STAT_MOD', stat: 'rangedDamage', value: 3, modType: 'FLAT' }]` | 8 ED + 2 salvage — WEAPON (SIDEARM) |
| FR-2 | Extended Mag           | SIDEARM_MOD  | `[{ type: 'STAT_MOD', stat: 'attackSpeed', value: 0.08, modType: 'PERCENT' }]` | 8 ED + 2 salvage — WEAPON (SIDEARM) |
| FR-3 | Tactical Vest Upgrade  | ARMOR_MOD    | `[{ type: 'STAT_MOD', stat: 'maxHealth', value: 12, modType: 'FLAT' }]` | 6 ED + 3 salvage — ARMOR |
| FR-4 | Enhanced Lens Assembly | FORENSIC_MOD | `[{ type: 'SCAN_RADIUS_MOD', percent: 0.05 }]` | 10 ED + 2 salvage — TOOL |

**Tier 2 — Specialist Upgrades (skill-gated)**:

| ID   | Recipe Name            | Category      | Effects | Cost | Unlock |
|------|------------------------|---------------|---------|------|--------|
| FR-5 | Trace Amplifier        | FORENSIC_MOD  | `[{ type: 'STAT_MOD', stat: 'evidenceQualityMod', value: 0.10, modType: 'PERCENT' }]` | 15 ED + 4 salvage + 1 GT | F-F4 rank 2 |
| FR-6 | Reinforced Cuffs       | TACTICAL_MOD  | `[{ type: 'ARREST_VIABILITY_MOD', flat: 3 }]` | 12 ED + 3 salvage + 1 GT | F-T4 rank 1 |
| FR-7 | Scramble-Proof Radio   | TACTICAL_MOD  | `[{ type: 'CUSTOM', handler: 'scramble_proof_radio', params: { jammingResistPercent: 0.50 } }]` | 14 ED + 3 salvage + 2 GT | F-I7 rank 2 |
| FR-8 | Low-Light Optics       | FORENSIC_MOD  | `[{ type: 'FALSE_EVIDENCE_DETECTION_MOD', percent: 0.05 }]` | 15 ED + 4 salvage + 2 GT | F-F5 rank 3 |

**Tier 3 — Bureau-Level Requisitions (achievement-gated)**:

| ID    | Recipe Name               | Category     | Effects | Cost | Unlock |
|-------|---------------------------|--------------|---------|------|--------|
| FR-9  | Forensic Neural Link      | FORENSIC_MOD | `[{ type: 'CUSTOM', handler: 'neural_link_auto_tag', params: { autoTagRadius: 64, autoTagChance: 0.15 } }]` | 25 ED + 8 salvage + 5 GT | Trophy: Master Detective |
| FR-10 | Adaptive Armor Weave      | ARMOR_MOD    | `[{ type: 'STAT_MOD', stat: 'maxHealth', value: 20, modType: 'FLAT' }, { type: 'CUSTOM', handler: 'adaptive_armor_damage_resist', params: { stackPerHit: 0.03, maxStacks: 5, duration: 10 } }]` | 30 ED + 10 salvage + 8 GT | F-T9 unlocked |

### Types to Create

**`packages/shared/src/types/progression.ts`**:

```typescript
import { ID, Timestamp } from './common';

export interface SkillTree {
  id: ID;
  role: 'KILLER' | 'FED';
  name: string;
  description: string;
  branchType: 'CORE' | 'COUNTER_PLAY';
  costMultiplier: number;   // 0.8 for CORE, 1.3 for COUNTER_PLAY
  iconKey: string;
  sortOrder: number;
}

export interface Skill {
  id: ID;
  treeId: ID;
  name: string;
  description: string;
  tier: 1 | 2 | 3 | 4 | 5;
  maxRank: 1 | 2 | 3 | 4 | 5;
  costPerRank: Array<Array<{ material: string; amount: number }>>;
  prerequisites: Array<{ skillId: ID; minRank: number }>;
  ranks: Array<{ rank: number; effects: SkillEffect[] }>;
  iconKey: string;
  positionX: number;
  positionY: number;
}

export type SkillEffect =
  | { type: 'STAT_MOD'; stat: string; value: number; modType: 'FLAT' | 'PERCENT' }
  | { type: 'ABILITY_UNLOCK'; abilityId: string }
  | { type: 'COOLDOWN_REDUCTION'; abilityId: string; percent: number }
  | { type: 'HEAT_REDUCTION'; percent: number }
  | { type: 'EVIDENCE_MODIFIER'; value: number }
  | { type: 'COUNTER_PLAY_ENHANCE'; abilityId: string; enhancement: Record<string, number> };

export interface SkillRank {
  userId: ID;
  skillId: ID;
  currentRank: number;
  unlockedAt: Timestamp;
}

export interface Trophy {
  id: ID;
  role: 'KILLER' | 'FED' | 'SHARED';
  name: string;
  description: string;
  passiveEffect: TrophyEffect[];
  unlockCondition: UnlockCondition;
  iconKey: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
}

export type TrophyEffect =
  | { type: 'STAT_MOD'; stat: string; value: number; modType: 'FLAT' | 'PERCENT' }
  | { type: 'ABILITY_UNLOCK'; abilityId: string }
  | { type: 'COUNTER_PLAY_ENHANCE'; abilityId: string; heatReduction?: number; effectBoost?: number }
  | { type: 'START_WITH_ITEM'; itemId: string }
  | { type: 'HEAT_CAP_INCREASE'; amount: number }
  | { type: 'MATERIAL_DROP_MOD'; percent: number };

export type UnlockCondition =
  | { type: 'WIN_COUNT'; role: 'KILLER' | 'FED'; count: number }
  | { type: 'SCORE_THRESHOLD'; role?: 'KILLER' | 'FED'; score: number }
  | { type: 'BIOME_COMPLETE'; biome: string; role?: 'KILLER' | 'FED' }
  | { type: 'ARREST_STRONG'; count: number }
  | { type: 'TARGETS_ELIMINATED'; count: number }
  | { type: 'COUNTER_PLAY_USE'; ability: string; count: number }
  | { type: 'MATERIAL_SPENT'; material: string; totalAmount: number }
  | { type: 'CUMULATIVE_STAT'; stat: string; threshold: number }
  | { type: 'BOSS_KILL'; bossId: string; difficulty?: string }
  | { type: 'SCORE_SINGLE_RUN'; role: 'KILLER' | 'FED'; minScore: number; mustWin: boolean }
  | { type: 'TROPHY_COUNT'; minCount: number }
  | { type: 'DEFAULT' };  // always unlocked (starter items)

export type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY' | 'MYTHIC';

export interface Equipment {
  id: ID;
  role: 'KILLER' | 'FED' | 'SHARED';
  slot: 'WEAPON' | 'ARMOR' | 'TOOL' | 'ACCESSORY';
  name: string;
  description: string;
  stats: EquipmentStats;
  unlockCondition: UnlockCondition;
  iconKey: string;
  rarity: ItemRarity;
  upgradeSlots: number;       // 1 (COMMON/UNCOMMON), 2 (RARE/LEGENDARY), 3 (MYTHIC)
  obtainCondition?: UnlockCondition; // for MYTHIC boss items
}

export interface EquipmentStats {
  damageBonus?: number;
  healthBonus?: number;
  startingItem?: string;
  startingItems?: string[];
  statModifiers?: Record<string, number>;
}

export interface Loadout {
  id: ID;
  userId: ID;
  role: 'KILLER' | 'FED';
  name: string;
  trophyId: ID | null;
  equipmentIds: ID[];     // max 4, one per slot
  isDefault: boolean;
  createdAt: Timestamp;
}

export interface Material {
  userId: ID;
  materialType: string;
  amount: number;
}
```

**`packages/shared/src/types/crafting.ts`**:

```typescript
import { ID, Timestamp } from './common';
import { UnlockCondition } from './progression';

export interface CraftingRecipe {
  id: ID;
  role: 'KILLER' | 'FED' | 'SHARED';
  name: string;
  description: string;
  category: CraftingCategory;
  effects: Effect[];
  cost: Array<{ material: string; amount: number }>;
  unlockCondition: UnlockCondition | CraftingUnlockCondition;
  compatibleSlots: string[];
  compatibleCategories: string[];
  tier: 1 | 2 | 3;
  iconKey: string;
}

export type CraftingCategory =
  | 'BLADE_MOD'
  | 'BLUNT_MOD'
  | 'GARROTE_MOD'
  | 'RANGED_MOD'
  | 'POISON_MOD'
  | 'ARMOR_MOD'
  | 'TOOL_MOD'
  | 'ACCESSORY_MOD'
  | 'FORENSIC_MOD'
  | 'SIDEARM_MOD'
  | 'TACTICAL_MOD';

export type CraftingUnlockCondition =
  | { type: 'SKILL_RANK'; skillId: string; minRank: number }
  | { type: 'TROPHY_OWNED'; trophyId: string }
  | { type: 'RUN_COUNT'; minRuns: number }
  | { type: 'DEFAULT' };

export interface EquipmentMod {
  id: ID;
  userId: ID;
  equipmentId: ID;
  slotIndex: number;
  recipeId: ID;
  appliedAt: Timestamp;
}
```

### ContentRegistry and Effect System

The ContentRegistry is a generic, type-safe registry for all game content. Adding new skills, trophies, items, or status effects requires only adding a data file entry — no code changes needed (unless introducing a new Effect type, which requires an EffectProcessor handler).

**`packages/shared/src/registry/content-registry.ts`**:

```typescript
import { type ZodSchema } from 'zod';

export class ContentRegistry<T extends { id: string }> {
  private entries = new Map<string, T>();

  constructor(
    private name: string,
    private schema: ZodSchema<T>,
  ) {}

  register(entry: T): void {
    const parsed = this.schema.parse(entry);  // throws if invalid
    if (this.entries.has(parsed.id)) {
      throw new Error(`${this.name} registry: duplicate ID "${parsed.id}"`);
    }
    this.entries.set(parsed.id, parsed);
  }

  registerAll(entries: T[]): void {
    for (const entry of entries) this.register(entry);
  }

  get(id: string): T | undefined { return this.entries.get(id); }

  getOrThrow(id: string): T {
    const entry = this.entries.get(id);
    if (!entry) throw new Error(`${this.name} registry: unknown ID "${id}"`);
    return entry;
  }

  has(id: string): boolean { return this.entries.has(id); }
  getAll(): T[] { return Array.from(this.entries.values()); }
  getByFilter(predicate: (entry: T) => boolean): T[] { return this.getAll().filter(predicate); }
  get size(): number { return this.entries.size; }
}
```

Data files live at `packages/shared/src/data/`. All content registered at boot via `packages/shared/src/data/_register-all.ts`'s `registerAllContent()`, called once in `packages/game-engine/src/game-init.ts`.

The universal `Effect` type (defined in `packages/shared/src/effects/effect-types.ts`) is the shared language for all game mechanics. Every skill rank, trophy, equipment stat, and crafting mod produces effects. The `EffectProcessor` in `packages/game-engine/src/effects/effect-processor.ts` handles all known types generically. Unknown types are logged as warnings (forward compatibility).

Key Effect types used by this piece:
- `STAT_MOD`: percentage or flat stat modification
- `ABILITY_UNLOCK`: grants an ability
- `COOLDOWN_REDUCTION`: reduces cooldown for a specific ability
- `HEAT_COST_MOD`: reduces counter-play heat costs (subject to 40% total cap)
- `EVIDENCE_REDUCTION`: reduces evidence generation
- `START_WITH_ITEM`: grants item at run start
- `CUSTOM`: escape hatch for novel boss item and crafting mod mechanics

### Dual-Source Sync Strategy

Content definitions exist in both TypeScript const objects (source of truth) and database seed data. The seed script at `supabase/seed/seed-content.ts` reads from TypeScript const objects and upserts into the DB. This is a one-way sync: code → DB. Server actions validate against the DB tables.

Adding new content: add entry to data file → run seed script → done. No schema migration needed unless adding a new Effect type discriminant (which requires an EffectProcessor handler addition).

### Progression Effects Engine

**`packages/game-engine/src/progression/progression-effects.ts`**

Called by `run-manager.ts onRunStart()` after loadout is selected. Converts equipped progression (skills at current rank, equipped trophy, equipment with mods) into concrete stat modifiers and ability unlocks applied to the player entity.

```typescript
interface ProgressionEffectBundle {
  statModifiers: Record<string, number>;
  abilityUnlocks: string[];
  startingItems: string[];
  passiveStatusEffects: StatusEffect[];
  equipmentModEffects: Effect[];   // from crafting mods on equipped items
  counterPlayConfig: {
    heatCostReduction: number;       // 0-1 multiplier on all heat costs (capped at 0.40)
    evidencePlantQuality: string;    // starting quality for planted evidence
    informantSurvivalChance: number; // 0-1 chance informant survives intimidation
  };
}

class ProgressionEffectsEngine {
  applyProgression(
    userId: ID,
    progression: UserProgressionState,
    loadout: Loadout,
  ): ProgressionEffectBundle;

  applyBundleToPlayer(bundle: ProgressionEffectBundle, playerId: ID): void;
}
```

The engine reads from `stores/progression.ts` (hydrated from server at page load) — no additional server calls at run start. For each equipped item, it also reads `user_equipment_mods` and applies crafting recipe effects via `craftingRecipeRegistry`. All effects subject to STAT_CAPS enforcement.

### Unlock Resolver

**`packages/game-engine/src/progression/unlock-resolver.ts`**

Runs post-run (after run results) to check which trophies and equipment newly meet unlock conditions. Emits `progression:trophy-unlocked` and `progression:equipment-unlocked` events via EventBus for UI notification. Boss item obtain conditions follow the same pattern — evaluated against run history.

```typescript
class UnlockResolver {
  checkTrophyUnlocks(
    userId: ID,
    runHistory: RunHistoryDTO[],
    currentMaterials: Record<string, number>,
    allTrophies: Trophy[],
    userTrophies: UserTrophyState[],
  ): Trophy[];

  checkEquipmentUnlocks(
    userId: ID,
    runHistory: RunHistoryDTO[],
    currentMaterials: Record<string, number>,
    allEquipment: Equipment[],
    userEquipment: UserEquipmentState[],
  ): Equipment[];
}
```

Unlock condition checks are client-side for UX notification. The server action `unlock-skill.ts` is authoritative for persistence.

### React Progression Pages

**`apps/web/src/app/progression/skills/page.tsx`** — Server Component. Fetches user skill state from DAL. Renders `SkillTreeView.tsx` for each tree (role toggle at top of page).

**`SkillTreeView.tsx`** — visual tree with SVG connection lines between `SkillNode` components. Node positions derived from `skill.positionX` / `skill.positionY`. CSS Grid layout with `position: absolute` nodes inside a bounded container. Counter-play branch trees rendered with dark background and red accent border.

**`SkillNode.tsx`** — displays icon, name, current rank / max rank, cost, locked/unlocked/maxed state. Click triggers `unlock-skill` Server Action if prerequisites met and materials sufficient.

**`SkillTooltip.tsx`** — hover tooltip showing full description, effect summary at current and next rank, prerequisite chain.

**`apps/web/src/app/progression/trophies/page.tsx`** — `TrophyGrid.tsx` shows all 42 trophies filtered by current role view. Trophy cards: icon, name, rarity border, lock/unlock state, unlock condition description, passive effect summary.

**`apps/web/src/app/progression/equipment/page.tsx`** — Equipment Collection + Loadout Builder sections. `LoadoutBuilder.tsx` uses HTML5 Drag API (no extra library). Four equipment slots as card zones, trophy slot at top, collection displayed below for drag-to-slot. MYTHIC items display with animated border and distinct visual treatment.

**`apps/web/src/app/progression/workshop/page.tsx`** and **`armory/page.tsx`** — Crafting pages. `CraftingStation.tsx` is the shared component with role-appropriate theming. Flow: select equipment → see upgrade slots → browse compatible recipes → confirm application → Server Action validates.

### DAL Modules

```typescript
// apps/web/src/dal/progression/skills.ts
export async function getUserSkills(userId: string): Promise<Result<SkillRankDTO[], DatabaseError>>;
export async function unlockSkill(userId: string, skillId: string, currentRank: number): Promise<Result<SkillRankDTO, DatabaseError>>;

// apps/web/src/dal/progression/trophies.ts
export async function getUserTrophies(userId: string): Promise<Result<UserTrophyDTO[], DatabaseError>>;
export async function equipTrophy(userId: string, trophyId: string): Promise<Result<UserTrophyDTO, DatabaseError>>;
export async function unequipTrophy(userId: string, trophyId: string): Promise<Result<UserTrophyDTO, DatabaseError>>;
export async function unlockTrophy(userId: string, trophyId: string): Promise<Result<UserTrophyDTO, DatabaseError>>;

// apps/web/src/dal/progression/materials.ts
export async function getMaterials(userId: string): Promise<Result<MaterialDTO[], DatabaseError>>;
export async function spendMaterials(userId: string, costs: Array<{ material: string; amount: number }>): Promise<Result<MaterialDTO[], DatabaseError>>;
export async function addMaterials(userId: string, gains: Record<string, number>): Promise<Result<MaterialDTO[], DatabaseError>>;

// apps/web/src/dal/crafting/recipes.ts
export async function getCraftingRecipes(role: 'KILLER' | 'FED'): Promise<Result<CraftingRecipeDTO[], DatabaseError>>;

// apps/web/src/dal/crafting/mods.ts
export async function getUserEquipmentMods(userId: string, equipmentId: string): Promise<Result<EquipmentModDTO[], DatabaseError>>;
export async function applyMod(userId: string, equipmentId: string, slotIndex: number, recipeId: string): Promise<Result<EquipmentModDTO, DatabaseError>>;
export async function removeMod(userId: string, equipmentId: string, slotIndex: number): Promise<Result<void, DatabaseError>>;
```

All DAL functions: server-only (no "use client"), use `createServerClient()`, return Result<DTO, Error> (never throw).

### Server Actions

**`unlock-skill.ts`**: Validates user authenticated, prerequisites met (query user_skills), materials sufficient (query user_materials), skill not at max rank. If valid: deduct materials (user_materials UPDATE), insert/update user_skills row. All in a Supabase transaction.

**`spend-materials.ts`**: Validates sufficient balance per material type. Atomically deducts. Critical constraint: material balances can never go negative. Server action rejects if any material type would go below 0.

**`equip-trophy.ts`**: Validates user owns trophy and it is unlocked. Unequips any previously equipped trophy for same role (1 trophy per role at a time).

**`save-loadout.ts`**: Validates all equipment IDs owned and unlocked (and attuned if MYTHIC), trophy ID (if set) owned and unlocked, equipment slot uniqueness (no duplicate slots), equipment role matches loadout role.

**`apply-mod.ts`**: Validates: user authenticated, user owns equipment, equipment has empty slot at `slot_index`, recipe compatible with equipment slot/category, user meets unlock condition (skill rank, trophy, etc.), user has sufficient materials. Atomically: deduct materials, insert `user_equipment_mods` row.

**`remove-mod.ts`**: Validates user owns the equipment and mod. Deducts 2 salvage_parts. Removes `user_equipment_mods` row. Materials NOT refunded.

**`dismantle-equipment.ts`**: Validates user owns equipment and it is not currently in any active loadout. Removes all applied mods first. Deletes from `user_equipment`. Grants salvage_parts based on equipment rarity. MYTHIC items cannot be dismantled.

### Zustand Stores

**`apps/web/src/stores/progression.ts`**:

```typescript
interface ProgressionStore {
  skills: Skill[];
  userSkills: SkillRank[];
  trophies: Trophy[];
  userTrophies: UserTrophyState[];
  equipment: Equipment[];
  userEquipment: UserEquipmentState[];
  loadouts: Loadout[];
  materials: Record<string, number>;

  // Computed
  activeLoadout: Loadout | null;
  equippedTrophy: Trophy | null;
  unlockedAbilities: string[];    // from skills + trophy effects

  // Actions
  setSkillRank: (skillId: ID, rank: number) => void;
  setTrophyEquipped: (trophyId: ID, equipped: boolean) => void;
  setActiveLoadout: (loadoutId: ID) => void;
  setMaterials: (materials: Record<string, number>) => void;
  notifyUnlock: (type: 'trophy' | 'equipment', item: Trophy | Equipment) => void;
  reset: () => void;
}
```

**`apps/web/src/stores/crafting.ts`**:

```typescript
interface CraftingStore {
  recipes: CraftingRecipe[];
  userMods: EquipmentMod[];
  salvageParts: number;

  // Computed
  availableRecipes: (equipmentId: string) => CraftingRecipe[];
  getModsForEquipment: (equipmentId: string) => EquipmentMod[];
  canAfford: (recipeId: string) => boolean;
  meetsUnlockCondition: (recipeId: string) => boolean;

  // Actions
  applyMod: (equipmentId: string, slotIndex: number, recipeId: string) => void;
  removeMod: (equipmentId: string, slotIndex: number) => void;
  dismantleEquipment: (equipmentId: string) => void;
  setRecipes: (recipes: CraftingRecipe[]) => void;
  setUserMods: (mods: EquipmentMod[]) => void;
}
```

Both stores initialize from server-rendered data (passed as props via Server Component to Client Component boundary). Mutations happen via Server Actions; on success, store is updated optimistically then confirmed.

### Pre-Run Loadout Integration

At the role selection page (piece 07), extend the flow:
1. User selects role (KILLER or FED)
2. Loadout picker shows user's saved loadouts for that role
3. Selected loadout displayed: trophy effect summary, equipment slot items, applied mods on each item, starting items list, counter-play abilities available
4. "Start Run" confirms loadout → passed to `RunConfig.loadout` → `ProgressionEffectsEngine.applyProgression()` at run start

### Counter-Play Balance Matrix

The progression system enforces rock-paper-scissors dynamics between builds:

| Killer Build | Primary Investment | Strong Against Fed | Weak Against Fed |
|-------------|-------------------|-------------------|-----------------|
| Shadow Assassin | Stealth (maxed) + Deception (T1-2) | Tactical Commander | Forensic Expert |
| Berserker | Brutality (maxed) + Stealth (T1-2) | Forensic Expert | Tactical Commander |
| Manipulator | Deception (maxed) + Stealth (T1-2) | Forensic Expert | Intelligence Agent |
| Balanced | Stealth (T1-3) + Brutality (T1-3) | Adapts to situation | — |

| Fed Build | Primary Investment | Strong Against Killer | Weak Against Killer |
|----------|-------------------|-----------------------|---------------------|
| Forensic Expert | Forensics (maxed) + Interrogation (T1-2) | Manipulator | Berserker |
| Intelligence Agent | Interrogation (maxed) + Tactics (T1-2) | Manipulator | Shadow Assassin |
| Tactical Commander | Tactics (maxed) + Forensics (T1-2) | Berserker | Shadow Assassin |
| Clean Agent | Forensics (T1-3) + Interrogation (T1-2) | Avoids heat risks | — |

No build dominates all matchups. Build diversity creates replay value and meta-game.

### Edge Cases

- **New player (no progression unlocked)**: All counter-play abilities locked. Default loadout has no trophy, basic equipment, no mods. Base abilities only. Intentional — counter-play is a mid/late-game reward.
- **Skill prerequisite chain integrity**: If prerequisite data is inconsistent, `unlock-resolver.ts` checks full chain server-side. Dependent skills remain unlocked (no revocation), but UI shows a warning badge.
- **Material anti-cheat**: `spend-materials.ts` checks balance server-side. Client store is optimistic but server is authoritative. If server rejects, store rolls back to confirmed balance.
- **Effect stacking cap**: Trophy + skill heat reduction stacks additively up to 40% total cap. E.g., Rough Interrogation skill -17% + trophy -15% = effective -32% (under cap). Shadow Network skill -25% + trophy -15% = clamped to -40%.
- **Crafting + skill + trophy stacking**: All bonuses counted by `StatModifierSystem` against STAT_CAPS. No stacking exploits possible.
- **MYTHIC item attunement gate**: A player who earns a boss item but lacks ghost tokens cannot use it. The `unlock-skill.ts` and `save-loadout.ts` actions validate attunement status. Attuning is a deliberate commitment (spending 5 ghost tokens that could go toward skill ranks).
- **Mod removal cost**: 2 salvage_parts flat fee prevents free experimentation. If user has no salvage, they cannot remove mods — they must dismantle other equipment first. This makes crafting choices feel consequential.
- **False alibi detectability**: At K-D8 rank 1, detection chance by forensic analysis is 40%. At K-D8 rank 3 + The Setup (LEGENDARY trophy), detection drops to ~25%. At fed with F-F10 (Master Analyst), passive detection is 25% + active adds 14% = 39% total. Counter-play depth preserved: no combination reaches 0% detection.
- **Loadout counter-play equipment without skill tree**: Counter-play equipment (e.g., Off-Books Briefcase) grants starting items. These items function as the activation mechanism even without the ability unlocked in skill tree. This is intentional: equipment provides an alternate gating path for counter-play tools.

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

Progression data is server-owned (Supabase PostgreSQL). The client fetches all progression state at session start. Mutations go through Server Actions with full validation. The game engine consumes progression state via Zustand stores at run start — no additional server calls during a run.

The ContentRegistry pattern (defined in `packages/shared/src/registry/`) is the extensible backbone. All game content (skills, trophies, equipment, boss items, crafting recipes, status effects) registers in typed registries at boot via `registerAllContent()`. Engine code operates on generic interfaces through the Effect system — not on specific content IDs in switch statements.

Counter-play abilities are modeled as ability unlocks within the existing ability system (pieces 10-11). This piece does not duplicate ability logic — it only unlocks and modifies what is already defined there.

### Data-Driven Architecture

- **Dual-source sync**: TypeScript const objects in `packages/shared/src/data/` are the source of truth. The seed script (`supabase/seed/seed-content.ts`) reads these and upserts into DB. Adding new content = add data file entry + run seed. No schema migration unless adding a new Effect type.
- **Skill rank effects**: Each rank specifies total effects at that rank (not incremental). Engine reads effects for current rank and applies. Avoids floating-point accumulation.
- **Boss item handlers**: 14 CUSTOM effect handlers (7 killer, 7 fed) registered in `boss-item-handlers.ts`. Each is self-contained. Registration happens in game init.
- **Crafting handlers**: Custom handlers for Phantom Grip, Scramble-Proof Radio, Neural Link Auto-Tag, and Adaptive Armor registered in `crafting-handlers.ts`.

### Key Implementation Decisions

- Skill tree definitions are seeded data (not hardcoded in frontend)
- Counter-play branches visually distinct (dark theme, red accent) to communicate ethical weight
- Trophy equip limit: 1 per role per loadout (simplicity over flexibility)
- Equipment slot limit: 1 per slot type (WEAPON, ARMOR, TOOL, ACCESSORY)
- Material spending is transactional — materials deducted and skill unlocked atomically
- Progression store hydrates from server-rendered data — no loading states on progression pages
- MYTHIC boss items require attunement (5 ghost tokens) — one-time gate, deliberate commitment
- Crafting mod removal costs 2 salvage_parts but does NOT refund materials — choices are consequential
- Ghost tokens as universal premium gate across skills, boss items, and crafting creates meaningful allocation decisions

### File Structure

```
packages/shared/src/
  registry/
    content-registry.ts      # generic ContentRegistry<T>
    registries.ts            # all registry instances
  effects/
    effect-types.ts          # universal Effect type, StatId
  types/
    progression.ts
    crafting.ts
  constants/
    progression.ts
    balance.ts               # STAT_CAPS
    crafting.ts              # salvage rates, mod slot counts per rarity
  schemas/
    progression.ts
    crafting-schemas.ts
  data/
    skills/
      killer-stealth.ts
      killer-brutality.ts
      killer-deception.ts
      fed-forensics.ts
      fed-interrogation.ts
      fed-tactics.ts
    trophies/
      killer-trophies.ts
      fed-trophies.ts
      shared-trophies.ts
    boss-items/
      killer-boss-items.ts
      fed-boss-items.ts
    crafting/
      killer-recipes.ts
      fed-recipes.ts
    _register-all.ts

packages/game-engine/src/
  progression/
    progression-effects.ts
    unlock-resolver.ts
  effects/
    effect-processor.ts
    boss-item-handlers.ts
    crafting-handlers.ts

apps/web/src/
  dal/progression/
    skills.ts
    trophies.ts
    equipment.ts
    loadouts.ts
    materials.ts
  dal/crafting/
    recipes.ts
    mods.ts
  app/actions/progression/
    unlock-skill.ts
    equip-trophy.ts
    save-loadout.ts
    spend-materials.ts
  app/actions/crafting/
    apply-mod.ts
    remove-mod.ts
    dismantle-equipment.ts
  app/progression/
    skills/page.tsx
    trophies/page.tsx
    equipment/page.tsx
    workshop/page.tsx        # Killer crafting (The Workshop)
    armory/page.tsx          # Fed crafting (The Armory)
  components/app/progression/
    SkillTreeView.tsx
    SkillNode.tsx
    SkillTooltip.tsx
    TrophyGrid.tsx
    TrophyCard.tsx
    EquipmentGrid.tsx
    LoadoutBuilder.tsx
    MaterialCounter.tsx
  components/app/crafting/
    CraftingStation.tsx
    RecipeList.tsx
    RecipeCard.tsx
    ModSlotViewer.tsx
    DismantleConfirm.tsx
  stores/
    progression.ts
    crafting.ts

supabase/
  migrations/
    XXX_progression.sql      # all progression tables
    XXX_run_history.sql      # run_history (owned by session economy)
  seed/
    seed-content.ts          # upserts all content from TypeScript const objects
```

### Testing Strategy

- Boot test: `registerAllContent()` runs without throwing, all registries have expected counts (60 skills, 42 trophies, 14 boss items, 20 crafting recipes)
- Unit test `progression-effects.ts`: given known skill ranks + trophy + equipment mods, verify correct stat modifiers and ability unlocks produced
- Unit test `unlock-resolver.ts`: trophy unlock conditions against mock run history (WIN_COUNT, CUMULATIVE_STAT, BOSS_KILL conditions)
- Unit test `spend-materials.ts` server action: insufficient balance → rejection; sufficient → deduction; balance cannot go negative
- Unit test `unlock-skill.ts` server action: prerequisite chain validation; ghost token gate at rank 3+
- Unit test `apply-mod.ts` server action: compatible slot validation; skill rank gate for tier 2 recipes; trophy gate for tier 3 recipes
- Unit test STAT_CAPS enforcement: crafted + skilled + trophied combination does not exceed caps
- Unit test heat cost reduction cap: multiple sources clamped at 40% total
- Component test `SkillTreeView.tsx`: renders all 10 nodes per tree, locked/unlocked states, SVG connection lines present
- Component test `LoadoutBuilder.tsx`: drag equipment to slot, save loadout fires server action
- Component test crafting flow: recipe selection, cost display, confirmation fires server action
- Integration test: complete skill unlock → materials deducted → ability available in next run
- Integration test: apply crafting mod → mod persists → effects present in ProgressionEffectBundle at run start

### Constitution Compliance Checklist

- [x] I: No barrel files — direct imports only
- [x] VI: Domain-based — `dal/progression/` and `dal/crafting/` per subdomain
- [x] XI: Zod validation — all Server Action inputs validated via schemas
- [x] XII: DAL — all DB access through DAL functions
- [x] XIII: Server Actions — all mutations via next-safe-action
- [x] XV: Database schema — documented JSONB rationale and limitations
- [x] XVI: Zero-trust — material balances and unlock conditions server-verified
- [x] XIX: Input validation at every boundary — Server Actions re-validate even if client pre-validates
- [x] XXVIII: WCAG AA — skill tree keyboard-navigable (arrow keys between nodes), tooltips accessible, crafting UI has aria labels on slot zones

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

When this piece is fully implemented:
- Players can browse 6 skill trees (60 skills) with correct node layouts and tier gating
- Skills have 1-5 ranks with diminishing returns; adjusted cost curve makes rank 3+ feel like genuine investments
- Counter-play branches visually distinct (dark/red theme); abilities gated behind meaningful material investment
- 42 trophies unlock via run history conditions; equipped trophy applies passive at run start
- Equipment with MYTHIC tier; boss items require attunement (5 ghost tokens)
- The Workshop (Killer) and The Armory (Fed) crafting systems with 20 total recipes across 3 tiers
- Crafting mods persist between runs, apply at run start via ProgressionEffectsEngine
- Ghost tokens create allocation decisions between skill ranks, boss item attunement, and crafting upgrades
- Loadout selection integrates into pre-run flow with full mod preview
- ContentRegistry boots without errors; all 60 skills, 42 trophies, 14 boss items, 20 recipes registered

### Dependencies (Consumed from Earlier Pieces)

- Session economy (piece 12): run history table for unlock conditions, materials earned per run, ghost token earn rates
- Killer gameplay (piece 10): ability IDs that Stealth, Brutality, and Deception trees unlock/enhance
- Fed gameplay (piece 11): counter-play ability IDs that Interrogation and Tactics trees gate, fedHeatLevel system
- Combat system (piece 08): status effects for trophy passives, boss item effects (ethereal entity, damage evidence generation)
- Player/role framework (piece 07): loadout integrated into RunConfig, role selection page extended

### Success Criteria

- [ ] All 6 skill trees (3 killer, 3 fed) browsable with correct node layout and tier gating
- [ ] Rank system: diminishing returns formula applied, hard caps enforced by StatModifierSystem
- [ ] Adjusted cost curve: rank 3 requires ghost tokens, ranks 4-5 feel like genuine milestones
- [ ] Counter-play branches visually distinct from core branches
- [ ] Skill unlock requires prerequisites + materials; server validates both atomically
- [ ] Material spend is atomic and cannot go negative
- [ ] All 42 trophies display with correct rarity, unlock condition, and passive effect
- [ ] Trophies unlock from run history conditions; equipped trophy applies passive in next run
- [ ] Equipment loadout grants starting items at run start
- [ ] MYTHIC rarity tier renders with animated border; boss items require attunement before equipping
- [ ] All 14 boss item CUSTOM handlers registered and functional
- [ ] Workshop and Armory pages accessible; crafting recipes filtered correctly by equipment and role
- [ ] All 20 crafting recipes correctly gated (default/skill-rank/achievement)
- [ ] Crafting mods persist between runs and appear in ProgressionEffectBundle at run start
- [ ] Crafting bonuses count toward STAT_CAPS (no stacking exploits)
- [ ] Ghost token economy: sources (daily bonus, biome first-clear, weekly challenge) and sinks (skill ranks, attunement, crafting) all functional
- [ ] Counter-play abilities gated: not available without skill tree OR trophy unlock
- [ ] ProgressionEffectsEngine correctly applies all stat modifiers, ability unlocks, starting items, and crafting mods at run start
- [ ] ContentRegistry boots without errors; CI boot test verifies all content registered
- [ ] WCAG AA: skill tree keyboard-navigable, crafting UI has aria labels

### Alignment Notes

This piece is the meta-progression backbone. Piece 14 (multiplayer sync) depends on loadout data for both players at game start. Piece 15 (polish) adds unlock celebration VFX/audio and introduces counter-play in the tutorial (step 8 of 9 per role, as a "what's coming" preview).

The counter-play progression design must align exactly with pieces 10 and 11 — ability IDs in skill tree unlock effects must match the ability system implementations exactly. The ghost token economy design interacts with piece 12's earn rates — if those rates change, the runs-to-max math changes accordingly.

The ContentRegistry and Effect system established here are referenced by pieces 08, 09, 10, and 11 for their content definitions. These pieces should be updated to move their hardcoded content into the data files structure established here.
