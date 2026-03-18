---
vision: killer-vs-fed-roguelite
sequence: 12
name: session-economy
group: Progression
group_order: 5
status: pending
depends_on:
  - "10: KillerObjective scoring types, KillerStore state (kills, disposals, evidenceDestroyed) for run scoring"
  - "11: FedRunState, ArrestCondition, FedStore state (evidenceCollected, interrogationsPerformed, arrestCondition) for run scoring"
  - "02: Supabase server client for DAL (run_history, daily_bonus persistence)"
  - "07: PlayerRole, RunConfig, Loadout, RunManager lifecycle hooks, inventory types"
produces:
  - "packages/game-engine/src/economy/session-economy.ts — session coins earn/spend/reset"
  - "packages/shared/src/types/economy.ts — SessionCurrency, PersistentCurrency, ShopOffering, RandomEncounter, EncounterChoice, EncounterOutcome, GhostTokenBonus, SalvagePartDrop"
  - "packages/shared/src/constants/economy.ts — coin rewards, shop prices, encounter probabilities, ghost token earn rates, salvage rates"
  - "packages/game-engine/src/economy/session-shop.ts — random temp powerup shop with reroll"
  - "packages/game-engine/src/scenes/shop-scene.ts — in-game shop overlay scene"
  - "packages/game-engine/src/economy/temp-powerups.ts — run-only buff definitions via status effects"
  - "packages/shared/src/types/powerups.ts — TempPowerup, PowerupEffect, PowerupDuration"
  - "packages/game-engine/src/economy/random-encounters.ts — encounter trigger system and resolution"
  - "packages/game-engine/src/economy/encounters/killer-encounters.ts — killer-specific encounter definitions"
  - "packages/game-engine/src/economy/encounters/fed-encounters.ts — fed-specific encounter definitions"
  - "packages/game-engine/src/economy/encounters/shared-encounters.ts — neutral encounter definitions"
  - "packages/game-engine/src/economy/ghost-token-tracker.ts — daily/weekly bonus tracking, earn rate calculation"
  - "packages/game-engine/src/run/run-scoring.ts — run performance score calculation"
  - "packages/game-engine/src/run/run-results.ts — end-of-run summary and material rewards including ghost tokens"
  - "apps/web/src/app/game/results/page.tsx — post-run results screen"
  - "apps/web/src/components/app/game/hud/ShopPanel.tsx — in-game shop interface"
  - "apps/web/src/components/app/game/hud/EncounterDialog.tsx — choice dialog for encounters"
  - "apps/web/src/stores/economy.ts — session coins, shop state, active powerups"
  - "apps/web/src/stores/run-results.ts — end-of-run data for results page"
  - "supabase/migrations/XXX_run_history.sql — run_history table with RLS"
  - "supabase/migrations/XXX_daily_bonus.sql — user_daily_bonus table for first-win tracking"
  - "apps/web/src/dal/runs/history.ts — saveRunResult(), getRunHistory()"
  - "apps/web/src/dal/economy/daily-bonus.ts — checkAndClaimDailyBonus()"
  - "apps/web/src/app/actions/runs/save-result.ts — validated server action for run persistence"
  - "apps/web/src/app/actions/economy/claim-daily-bonus.ts — server action for first-win daily bonus"
created: 2026-03-17
last_aligned: never
---

# Vision Piece 12: Session Economy

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: killer-gameplay (10), fed-gameplay (11)

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Implement the within-run economy that completes the single-run gameplay loop. Session coins are earned through role-appropriate actions, spent at an in-run shop offering random temporary powerups, and consumed in random encounter events. At run end, a scoring system computes performance and awards persistent materials — including the scarce ghost_token currency and new salvage_parts material — used by meta-progression (the persistent-progression feature). Run results are saved to the database. This piece transforms isolated role systems into a cohesive run loop with clear start, middle, and end.

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
type DatabaseError = AppError & { code: 'DATABASE_ERROR' };
```

#### From packages/shared/src/types/player.ts (piece 07)
```typescript
type PlayerRole = 'KILLER' | 'FED'
```

#### From packages/shared/src/types/run.ts (piece 07)
```typescript
interface RunConfig { seed: string; biome: Biome; role: PlayerRole; loadout: Loadout }
interface RunState { phase: 'ACTIVE' | 'COMPLETE'; tickCount: number; startTime: Timestamp }
interface RunResult { outcome: 'WIN' | 'LOSE'; score: number; durationSeconds: number; materialsEarned: Record<string, number> }
```

#### From packages/game-engine/src/run/run-manager.ts (piece 07)
```typescript
// Run lifecycle hooks this piece extends:
onRunStart(config: RunConfig): void    // session-economy initializes here
onRunEnd(result: RunResult): void      // scoring runs here, results persisted
```

#### From packages/shared/src/types/inventory.ts (piece 07)
```typescript
interface InventoryItem { id: ID; itemType: ItemType; name: string; rarity: ItemRarity; effect: ItemEffect }
type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY' | 'MYTHIC'
```

#### From packages/game-engine/src/player/inventory.ts (piece 07)
```typescript
addItem(item: InventoryItem): Result<void, AppError>
removeItem(itemId: ID): Result<void, AppError>
```

#### From packages/shared/src/types/combat.ts (piece 08)
```typescript
interface StatusEffect { id: ID; name: string; type: 'BUFF' | 'DEBUFF'; remainingMs: number }
```

#### From packages/game-engine/src/combat/status-effects.ts (piece 08)
```typescript
// Temp powerups applied as status effects via:
applyStatusEffect(entityId: ID, effect: StatusEffect): void
removeStatusEffect(entityId: ID, effectId: ID): void
```

#### From packages/shared/src/types/killer.ts (piece 10)
```typescript
// Killer scoring criteria consumed from:
interface KillerObjective { targetsEliminated: number; targetsDisposed: number; evidenceDestroyed: number }
```

#### From packages/shared/src/types/fed.ts (piece 11)
```typescript
// Fed scoring criteria consumed from:
interface FedRunState { evidenceCollected: number; interrogationsPerformed: number; arrestAttempts: number }
type ArrestCondition = 'INSUFFICIENT' | 'WEAK' | 'MODERATE' | 'STRONG' | 'AIRTIGHT'
```

#### From apps/web/src/stores/killer.ts (piece 10)
```typescript
// Killer Zustand store — economy reads:
interface KillerStore { targets: KillerTarget[]; kills: number; disposals: number; evidenceDestroyed: number }
```

#### From apps/web/src/stores/fed.ts (piece 11)
```typescript
// Fed Zustand store — economy reads:
interface FedStore { evidenceCollected: number; interrogationsPerformed: number; arrestCondition: ArrestCondition }
```

#### From packages/game-engine/src/utils/event-bus.ts (piece 04)
```typescript
EventBus.emit(event: string, data: unknown): void
EventBus.on(event: string, callback: (data: unknown) => void): void
```

#### From apps/web/src/components/app/common/ (piece 03)
```typescript
AppButton, AppCard, AppDialog, AppInput, AppToast
PageLayout, GameLayout
```

#### From apps/web/src/lib/supabase/server.ts (piece 02)
```typescript
// Server-side Supabase client for DAL:
createServerClient(): SupabaseClient
```

#### From apps/web/src/lib/logger/pino.ts (piece 01)
```typescript
import logger from '@/lib/logger/pino';
logger.info({ context }, 'message');
logger.error({ error, context }, 'message');
```

#### From apps/web/src/config/env.ts (piece 01)
```typescript
// All env vars accessed through this module, never process.env directly
import { env } from '@/config/env';
```

### New Types to Create

**`packages/shared/src/types/economy.ts`**:

```typescript
import { ID, Timestamp } from './common';

export interface SessionCurrency {
  coins: number;           // earned/spent within run, resets at run end
}

export interface PersistentCurrency {
  materials: Record<string, number>;
  // Keys: 'evidence_dust', 'blood_marks', 'ghost_tokens', 'case_files',
  //       'shadow_coins', 'salvage_parts'
  // All material type constants defined in constants/economy.ts
  // Material type validation server-side before any DB insert
}

export interface ShopOffering {
  id: ID;
  powerupId: string;          // references TempPowerup by id
  name: string;
  description: string;
  iconKey: string;
  price: number;              // session coins
  role: 'KILLER' | 'FED' | 'SHARED';
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE';
}

export interface PriceTag {
  amount: number;
  currency: 'SESSION_COINS';
}

export interface RandomEncounter {
  id: string;
  role: 'KILLER' | 'FED' | 'SHARED';
  title: string;
  description: string;
  choices: EncounterChoice[];
  triggerProbability: number;   // 0-1 per zone crossing
  cooldownZones: number;        // zones before same encounter can appear again
}

export interface EncounterChoice {
  label: string;
  description: string;
  cost?: PriceTag;
  outcome: EncounterOutcome;
}

export interface EncounterOutcome {
  coinsChange?: number;
  powerupGranted?: string;      // TempPowerup id
  evidenceModifier?: number;
  heatModifier?: number;        // fed heat level change
  suspicionModifier?: number;   // killer suspicion level change
  itemGranted?: string;         // InventoryItem id
  narrativeText: string;
}

// Ghost token bonus sources (server-side tracking required)
export interface GhostTokenBonus {
  source: 'FIRST_WIN_OF_DAY' | 'BIOME_FIRST_CLEAR' | 'ACHIEVEMENT_MILESTONE' | 'WEEKLY_CHALLENGE';
  amount: number;
  claimedAt: Timestamp;
}

// Salvage parts awarded when player dismantles equipment
export interface SalvagePartDrop {
  equipmentId: ID;
  equipmentRarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
  // MYTHIC cannot be dismantled
  salvageAmount: number;
}
```

**`packages/shared/src/types/powerups.ts`**:

```typescript
export type PowerupDuration = 'RUN' | 'ZONE' | 'TIMED_MS';

export interface PowerupEffect {
  stat: string;                    // e.g. 'moveSpeed', 'damageOutput', 'scanRadius'
  modifier: number;                // flat or percentage (determined by modifierType)
  modifierType: 'FLAT' | 'PERCENT';
  duration: PowerupDuration;
  durationMs?: number;             // required if duration === 'TIMED_MS'
}

export interface TempPowerup {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  role: 'KILLER' | 'FED' | 'SHARED';
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE';
  effects: PowerupEffect[];
  statusEffectId: string;          // maps to status-effects.ts for application
}
```

### Database Schema

**`supabase/migrations/XXX_run_history.sql`**:

```sql
CREATE TABLE run_history (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('KILLER', 'FED')),
  biome            TEXT NOT NULL,
  score            INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  targets_eliminated INTEGER,       -- nullable: only relevant for killer role
  evidence_collected INTEGER,       -- nullable: only relevant for fed role
  outcome          TEXT NOT NULL CHECK (outcome IN ('WIN', 'LOSE', 'ABANDONED')),
  materials_earned JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user run history queries (most recent first)
CREATE INDEX idx_run_history_user_id_created_at
  ON run_history (user_id, created_at DESC);

-- Row-Level Security
ALTER TABLE run_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own run history
CREATE POLICY "run_history_select_own"
  ON run_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own run results (via server action — service role bypasses)
CREATE POLICY "run_history_insert_own"
  ON run_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No update or delete: run history is immutable
```

The `materials_earned` JSONB column stores material type keys mapped to integer amounts, e.g.:
```json
{ "evidence_dust": 3, "blood_marks": 1, "ghost_tokens": 2, "salvage_parts": 0 }
```

Material type constants are defined in `packages/shared/src/constants/economy.ts` and validated server-side before insert. Valid keys: `evidence_dust`, `blood_marks`, `ghost_tokens`, `case_files`, `shadow_coins`, `salvage_parts`.

**`supabase/migrations/XXX_daily_bonus.sql`**:

```sql
-- Tracks when a user last claimed their first-win-of-the-day bonus
-- Required for server-side daily bonus validation (cannot trust client timestamps)
CREATE TABLE user_daily_bonus (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('KILLER', 'FED')),
  last_claimed  DATE NOT NULL,
  -- Date (not timestamp) so timezone-aware comparison is correct at the server level
  -- Server uses UTC date; client display converts to local timezone
  UNIQUE (user_id, role)
  -- One daily bonus record per user per role
);

ALTER TABLE user_daily_bonus ENABLE ROW LEVEL SECURITY;

-- Users can read their own daily bonus state
CREATE POLICY "user_daily_bonus_select_own"
  ON user_daily_bonus FOR SELECT
  USING (auth.uid() = user_id);

-- Server action upserts via service role (bypasses RLS)
-- No client-side insert allowed
```

### Session Economy Manager

**`packages/game-engine/src/economy/session-economy.ts`**

Manages session coin state during a run. Entirely client-side during play; server validates final totals via the run result save action.

```typescript
interface SessionEconomyState {
  coins: number;
  totalEarned: number;
  totalSpent: number;
  coinsEarnedByCategory: Record<string, number>;
}

class SessionEconomyManager {
  private state: SessionEconomyState;

  initialize(startingCoins?: number): void;    // called by run-manager on run start
  earn(amount: number, category: string): void; // category for scoring breakdown
  spend(amount: number): Result<void, AppError>; // returns err if insufficient coins
  canAfford(amount: number): boolean;
  getBalance(): number;
  getSnapshot(): SessionEconomyState;
  reset(): void;                                // called by run-manager on run end
}
```

**Coin earning rates** (defined in `constants/economy.ts`):

| Killer Action | Coins | Category |
|---------------|-------|---------|
| Kill (clean, disposed) | 25 | `kill_clean` |
| Kill (messy, no disposal) | 8 | `kill_messy` |
| Evidence destroyed | 5/piece | `evidence_cleanup` |
| Escape fed pursuit | 15 | `evasion` |
| Bonus objective complete | 30 | `bonus` |

| Fed Action | Coins | Category |
|------------|-------|---------|
| Evidence discovered | 8/piece | `evidence_found` |
| Witness interviewed | 10 | `interview` |
| Suspect eliminated (narrowed) | 5 | `elimination` |
| Arrest (STRONG) | 50 | `arrest_clean` |
| Arrest (MODERATE) | 30 | `arrest_moderate` |
| Arrest (combat-resolved) | 20 | `arrest_combat` |
| Vigilante kill | 15 | `vigilante` |

Events listened on EventBus to trigger coin earning:
- `killer:target-eliminated` — earns kill coins
- `killer:evidence-destroyed` — earns cleanup coins
- `fed:evidence-discovered` — earns discovery coins
- `fed:witness-interviewed` — earns interview coins
- `fed:arrest-succeeded` — earns arrest coins

### In-Session Shop

**`packages/game-engine/src/economy/session-shop.ts`**

The shop appears at fixed locations within each biome map (1-2 per map, marked on minimap). Players can open the shop overlay, browse a randomly-selected pool of temporary powerups, and buy them with session coins.

```typescript
interface ShopState {
  currentOfferings: ShopOffering[];   // 3-4 offerings at a time
  rerollCount: number;
  rerollCost: number;                 // increases per reroll: 10, 20, 40, 80
  isOpen: boolean;
}

class SessionShop {
  // Seed-based offering generation (deterministic for multiplayer)
  generateOfferings(runSeed: string, visitNumber: number, role: PlayerRole): ShopOffering[];
  purchase(offeringId: ID, economy: SessionEconomyManager): Result<TempPowerup, AppError>;
  reroll(economy: SessionEconomyManager): Result<ShopOffering[], AppError>;
}
```

**Offering pool composition**:
- 1 RARE offering (role-specific, ~25% reroll chance to see)
- 1 UNCOMMON offering (role-specific)
- 1 UNCOMMON offering (shared)
- 1 COMMON offering (shared)

**Price scaling**: Base prices increase 20% per shop visit after the second visit. Prices are pre-baked into `ShopOffering.price` at generation time.

**Reroll**: Costs session coins (10 → 20 → 40 → 80 per reroll, doubling). Generates new offerings from same seed pool (deterministic). Reroll is seeded so both multiplayer players see same reroll sequence — neither can see the other's shop visit timing.

### Temporary Powerups

**`packages/game-engine/src/economy/temp-powerups.ts`**

All powerups are `TempPowerup` objects applied via `status-effects.ts`. They persist for the run duration (unless `ZONE` or `TIMED_MS` scoped).

**Killer powerups** (sample — full set in implementation):

| Powerup | Rarity | Effect |
|---------|--------|--------|
| Shadow Steps | RARE | Move speed +25%, footprint generation -60% for 120s |
| Clean Hands | UNCOMMON | DNA evidence generation -50% for this run |
| Blade Sharpener | COMMON | Melee damage +20% for this run |
| Ghost Protocol | RARE | Stealth detection radius -40% for this run |
| Quick Disposal | UNCOMMON | Disposal time -50% for this run |

**Fed powerups** (sample):

| Powerup | Rarity | Effect |
|---------|--------|--------|
| Eagle Eye | RARE | Scan radius +80%, reveals HIDDEN evidence for 90s |
| Silver Tongue | UNCOMMON | Witness reliability +30% for all interviews this run |
| Steel Nerves | COMMON | Incoming damage -15% for this run |
| Evidence Magnet | RARE | Auto-discover nearest evidence every 30s for this run |
| Rapid Analysis | UNCOMMON | Forensic examination time -70% for this run |

**Shared powerups**:

| Powerup | Rarity | Effect |
|---------|--------|--------|
| Adrenaline Rush | COMMON | Move speed +15% for 60s |
| Health Boost | COMMON | Restore 30% max health |
| Coin Magnet | UNCOMMON | Coin earnings +25% for this run |
| Combat Edge | UNCOMMON | All damage +15% for this run |

Powerups are applied by calling `status-effects.ts applyStatusEffect()`. Run-duration powerups are cleared by `SessionEconomyManager.reset()` at run end.

### Random Encounters

**`packages/game-engine/src/economy/random-encounters.ts`**

Random encounters trigger on zone transitions. Each zone crossing rolls against `encounter.triggerProbability` (default 0.15, increases to 0.25 after zone 4). One encounter per zone maximum. A cooldown system prevents repeating the same encounter within `cooldownZones` transitions.

**Encounter trigger flow**:
1. Player crosses zone boundary → EventBus `zone:player-entered` fires
2. Economy manager rolls probability check
3. If triggered: select valid encounter for current role with no active cooldown
4. Emit EventBus `encounter:triggered` with encounter data
5. React `EncounterDialog.tsx` renders the choice UI
6. Player choice resolves → `EncounterOutcome` applied → EventBus `encounter:resolved`

**Killer encounters** (`killer-encounters.ts`):

| Encounter | Description | Choices |
|-----------|-------------|---------|
| Black Market Dealer | A shady figure offers off-the-books goods | Buy evidence cleanup kit (25 coins), Buy disguise kit (30 coins), Leave |
| Corrupt Cop | A dirty officer knows you're operating | Pay bribe (40 coins) — heat reduced, Refuse — heat increased +20, Fight — enters combat |
| Opportunist Thief | Someone saw you and wants payment | Pay off (20 coins), Silence them (kills NPC, +1 body, +evidence), Chase away (50% succeed) |
| Underground Fence | Sell excess items | Sell item for 150% value, Pass |
| False Lead Tip | Anonymous tip about a "suspicious NPC" | Plant evidence near tip NPC (costs cleanup kit), Ignore |

**Fed encounters** (`fed-encounters.ts`):

| Encounter | Description | Choices |
|-----------|-------------|---------|
| Informant Call | Anonymous tip about suspicious activity | Follow up (travel to marked zone, find evidence), Dismiss |
| Anonymous Package | Untraceable evidence delivered to you | Accept (receives UNCOMMON evidence, +5 arrest viability), Report to chain of command (lose evidence, +15 clean score) |
| Fellow Officer | Off-duty cop offers unofficial help | Accept illegal surveillance device (free WIRETAP_KIT, +8 heat), Decline |
| Evidence Locker | Unsecured evidence from old case | Take it (receives relevant evidence, +30 arrest viability, +10 heat — technically illegal), Secure and tag (+15 score bonus, no evidence) |
| Witness in Danger | A witness NPC is being approached by suspect | Rush to protect (+15 viability if saved), Set up surveillance (entrapment-lite, +10 viability, +12 heat) |

**Shared encounters** (`shared-encounters.ts`):

| Encounter | Description | Choices |
|-----------|-------------|---------|
| Locked Room | Door to useful zone is locked | Lockpick (costs lockpick tool), Break down (loud, generates noise evidence), Leave |
| Storm Approaching | Environmental hazard incoming | Shelter (skip 1 zone, no penalty), Push through (movement speed -30% for zone, no time lost) |
| Crowd Event | Sudden public gathering | Blend in (faster movement through crowd), Avoid (longer route, +2 minutes) |

### Run Scoring

**`packages/game-engine/src/run/run-scoring.ts`**

Score is computed at run end from `SessionEconomyState.coinsEarnedByCategory` and role-specific run data.

**Killer scoring formula**:
```
baseScore = (kills × 500) + (disposed_kills × 300) + (evidence_destroyed × 50)
bonuses = (bonus_objectives × 200) + (evasion_bonus × 150)
timeBonus = max(0, (TARGET_TIME - actual_seconds) × 2)   // TARGET_TIME = 600s (10 min)
penalties = (evidence_left_count × -30) + (witnesses_alive × -20)
finalScore = (baseScore + bonuses + timeBonus + penalties) × difficultyMultiplier
```

**Fed scoring formula**:
```
baseScore = (evidence_collected × 100) + (witnesses_interviewed × 80)
arrestBonus = { STRONG: 2000, MODERATE: 1200, WEAK_COMBAT: 800, VIGILANTE: 400 }[arrestOutcome]
investigationBonus = (suspects_eliminated × 50) + (bonus_objectives × 200)
penalties = (wrong_arrest_penalty × -300) + (inadmissible_evidence_count × -20)
finalScore = (baseScore + arrestBonus + investigationBonus + penalties) × difficultyMultiplier
```

`difficultyMultiplier` is set by biome difficulty configuration from `types/biome.ts BiomeDifficulty`.

**Performance tier thresholds** (used for material earn rate calculations):

| Tier | Score Range | Outcome |
|------|-------------|---------|
| Poor | < 1000 | LOSS |
| Average (loss) | 1000-2999 | LOSS |
| Average (win) | 1000-2999 | WIN |
| Good (win) | 3000-5999 | WIN |
| Excellent (win) | >= 6000 | WIN |

### Run Results and Material Rewards

**`packages/game-engine/src/run/run-results.ts`**

Material rewards are computed from `finalScore` and `outcome`. Ghost tokens are now a central gating currency with multiple sources. Salvage parts are a new material type from equipment dismantling (awarded separately by the crafting system — not via runs directly, but the material type appears in the same `materialsEarned` map).

```typescript
function computeMaterialRewards(
  score: number,
  outcome: 'WIN' | 'LOSE',
  role: PlayerRole,
  biome: Biome
): Record<string, number> {
  // Base materials from score tiers
  // WIN: full materials, LOSE: 40% materials
  // Role-specific material types
  // Biome bonus materials (rare materials from specific biomes)
  // Ghost tokens: only on good/excellent WIN outcomes
}
```

**Material types** (defined in `constants/economy.ts`):

| Material | Source | Used For |
|----------|--------|---------|
| `evidence_dust` | Fed wins | Fed skill tree unlocks (R1-R5), fed crafting recipes |
| `blood_marks` | Killer wins | Killer skill tree unlocks (R1-R5), killer crafting recipes |
| `ghost_tokens` | Good/excellent wins + bonuses | Tier 3-5 skill ranks, boss item attunement (5 GT), legendary crafting recipes (5-10 GT) |
| `case_files` | Fed investigation bonuses | Fed trophies |
| `shadow_coins` | Killer evasion bonuses | Killer trophies |
| `salvage_parts` | Equipment dismantling (Armory/Workshop) | Crafting recipe material cost |

**Updated material earn rates per performance tier**:

| Performance Tier | Score Range | Outcome | Primary Mat | Secondary Mat | Ghost Tokens | Total |
|-----------------|-------------|---------|-------------|---------------|--------------|-------|
| Poor | < 1000 | LOSS | 1 | 0 | 0 | 1 |
| Average (loss) | 1000-2999 | LOSS | 2 | 1 | 0 | 3 |
| Average (win) | 1000-2999 | WIN | 4 | 1 | 0 | 5 |
| Good (win) | 3000-5999 | WIN | 5 | 2 | 1 | 8 |
| Excellent (win) | >= 6000 | WIN | 7 | 3 | 2 | 12 |
| WIN bonus | any WIN | WIN | +2 primary | — | — | — |

**Ghost token bonuses** (additional sources beyond run performance):

| Source | Amount | Frequency | Implementation |
|--------|--------|-----------|----------------|
| First win of the day | +1 | Daily per role | Server-side via `user_daily_bonus` table |
| Biome first-clear | +3 | Once per biome per role | Checked against `run_history` post-run |
| Achievement milestones (every 5th trophy unlocked) | +2 | Milestone | Triggered by `unlock-resolver.ts` |
| Weekly challenge completion | +3 to +5 | Weekly | Requires weekly challenge system (future feature) |

**Salvage parts** (new material type):
- Earned by dismantling equipment in the Armory/Workshop — NOT from runs directly
- Dismantling rates by rarity: COMMON: 1 salvage, UNCOMMON: 2, RARE: 4, LEGENDARY: 8, MYTHIC: cannot dismantle
- Salvage parts are spent on crafting recipes (cost varies by tier: 2-10 salvage per recipe)
- Salvage parts have no other sink — they are purely a crafting material

**Material allocation decision (design intent)**:

Ghost tokens are the primary allocation tension point. A competent player earns approximately 0.7-1.0 ghost tokens per run. They must choose:
- Spend on tier 3-5 skill ranks (1-4 GT per rank)
- Save for boss item attunement (5 GT per item, one-time)
- Invest in tier 2-3 crafting recipes (1-8 GT per recipe)

This creates meaningful resource tension with no single dominant strategy. Players who rush to boss items delay skill progression; players who focus on skill ranks delay crafting access.

### Ghost Token Tracker

**`packages/game-engine/src/economy/ghost-token-tracker.ts`**

Handles calculation of ghost token bonuses that require server-side state (daily bonus, biome first-clear). The tracker calls server actions to check and claim bonuses — never trusts client-side claims.

```typescript
class GhostTokenTracker {
  // Called at run end to check all applicable ghost token bonuses
  async calculateBonuses(
    userId: string,
    runResult: RunResult,
    role: PlayerRole,
    biome: string
  ): Promise<GhostTokenBonus[]>;

  // Returns ghost tokens earned from bonuses (for inclusion in materialsEarned)
  async getTotalBonusTokens(bonuses: GhostTokenBonus[]): Promise<number>;
}
```

The tracker emits no ghost tokens from bonuses until the server action confirms the claim. Ghost tokens from run performance (good/excellent wins) are computed deterministically from score and included in the base `materialsEarned` calculation.

### DAL and Server Actions

**`apps/web/src/dal/runs/history.ts`**:

```typescript
import { Result } from 'neverthrow';
import { AppError, DatabaseError } from '@repo/shared/src/utils/result';

export interface RunHistoryDTO {
  id: string;
  userId: string;
  role: 'KILLER' | 'FED';
  biome: string;
  score: number;
  durationSeconds: number;
  targetsEliminated: number | null;
  evidenceCollected: number | null;
  outcome: 'WIN' | 'LOSE' | 'ABANDONED';
  materialsEarned: Record<string, number>;
  createdAt: string;
}

export interface SaveRunInput {
  role: 'KILLER' | 'FED';
  biome: string;
  score: number;
  durationSeconds: number;
  targetsEliminated?: number;
  evidenceCollected?: number;
  outcome: 'WIN' | 'LOSE' | 'ABANDONED';
  materialsEarned: Record<string, number>;
}

export async function saveRunResult(
  userId: string,
  input: SaveRunInput
): Promise<Result<RunHistoryDTO, DatabaseError>>;

export async function getRunHistory(
  userId: string,
  limit?: number,
  offset?: number
): Promise<Result<RunHistoryDTO[], DatabaseError>>;

export async function getRunById(
  runId: string,
  userId: string
): Promise<Result<RunHistoryDTO, AppError>>;
```

**`apps/web/src/dal/economy/daily-bonus.ts`**:

```typescript
// Check and claim first-win-of-the-day ghost token bonus
// Called by claim-daily-bonus.ts server action
// Returns true if bonus was successfully claimed (not already claimed today)
export async function checkAndClaimDailyBonus(
  userId: string,
  role: 'KILLER' | 'FED'
): Promise<Result<boolean, DatabaseError>>;
```

**`apps/web/src/app/actions/runs/save-result.ts`**:

Server Action using `next-safe-action`. Validates input with Zod, authenticates user, calls DAL, returns typed result.

```typescript
'use server';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const VALID_MATERIAL_TYPES = [
  'evidence_dust', 'blood_marks', 'ghost_tokens',
  'case_files', 'shadow_coins', 'salvage_parts'
] as const;

const saveRunResultSchema = z.object({
  role: z.enum(['KILLER', 'FED']),
  biome: z.string().min(1),
  score: z.number().int().min(0),
  durationSeconds: z.number().int().min(0),
  targetsEliminated: z.number().int().min(0).optional(),
  evidenceCollected: z.number().int().min(0).optional(),
  outcome: z.enum(['WIN', 'LOSE', 'ABANDONED']),
  materialsEarned: z.record(z.enum(VALID_MATERIAL_TYPES), z.number().int().min(0)),
});

// Validation: score must be plausible given duration (anti-cheat: max 50 coins/second)
// Validation: if KILLER role, targetsEliminated required; if FED role, evidenceCollected required
// Validation: ghost_tokens must not exceed max possible for score tier + eligible bonuses
// Validation: salvage_parts in materialsEarned must be 0 (salvage earned via dismantling only)
```

**`apps/web/src/app/actions/economy/claim-daily-bonus.ts`**:

```typescript
'use server';
// Called after a win is recorded, before final materials are returned to client
// Checks server-side whether first-win-of-the-day bonus applies
// Upserts user_daily_bonus table
// Returns additional ghost tokens to add to materialsEarned (0 or 1)
// Client cannot claim this bonus directly — only valid post-win
```

**Anti-cheat validations** in server action:
- Score plausibility: `score / durationSeconds <= MAX_SCORE_RATE` (server-defined constant)
- Material consistency: `sum(materialsEarned.values)` must match expected reward for given score tier
- Known material types only: only `VALID_MATERIAL_TYPES` keys accepted; unknown keys rejected (not silently stripped — reject the request to surface bugs)
- Role-data consistency: killer without `targetsEliminated` or fed without `evidenceCollected` is rejected
- Ghost token cap: ghost tokens in `materialsEarned` must not exceed `scoreBasedTokens + eligibleBonusTokens`; the server independently calculates eligible bonuses using `user_daily_bonus` and `run_history` tables

### HUD Components

**`apps/web/src/components/app/game/hud/ShopPanel.tsx`**

React component, "use client". Renders when `economyStore.shopState.isOpen === true`.

Layout:
- Header: "Shop — [N] coins" with coin icon
- Offerings grid: 2×2 card layout (ShopOffering cards with rarity border colors)
- Each card: icon, name, description, price badge, "Buy" button (disabled if insufficient coins)
- Footer: "Reroll — [N] coins" button, close button
- Powerup cards show rarity with color border: grey (COMMON), blue (UNCOMMON), gold (RARE)

**`apps/web/src/components/app/game/hud/EncounterDialog.tsx`**

React component using `AppDialog`. Renders when `economyStore.activeEncounter` is set.

Layout:
- Title: encounter title
- Body: encounter description narrative text
- Choice buttons (2-3): each shows label, description, cost (if any), outcome hint
- No "cancel" — player must choose. Timer: 30 seconds to choose (auto-selects first option on timeout)

**Results Page** — `apps/web/src/app/game/results/page.tsx`

Server Component that reads `run-results.ts` store data (passed via searchParams or via client component hydration).

Sections:
- Outcome banner: WIN / LOSE with role-appropriate imagery
- Score breakdown: table showing each scoring category and its contribution
- Materials earned: icon + amount per material type, including ghost tokens with explicit label
- Ghost token bonuses applied this run (daily bonus, biome first-clear) shown separately with source label
- Best moments: top 3 actions (highest single-action coin earns)
- Continue button: → progression page or main menu
- Play Again button: → role selection with same biome

### Zustand Stores

**`apps/web/src/stores/economy.ts`**:

```typescript
interface EconomyStore {
  coins: number;
  totalEarned: number;
  shopState: {
    isOpen: boolean;
    offerings: ShopOffering[];
    rerollCount: number;
    rerollCost: number;
  };
  activePowerups: TempPowerup[];
  activeEncounter: RandomEncounter | null;
  // Actions
  earnCoins: (amount: number, category: string) => void;
  spendCoins: (amount: number) => boolean;   // returns false if insufficient
  openShop: (offerings: ShopOffering[]) => void;
  closeShop: () => void;
  purchasePowerup: (offeringId: string) => void;
  setRerollCost: (cost: number) => void;
  addPowerup: (powerup: TempPowerup) => void;
  removePowerup: (powerupId: string) => void;
  setActiveEncounter: (encounter: RandomEncounter | null) => void;
  reset: () => void;
}
```

**`apps/web/src/stores/run-results.ts`**:

```typescript
interface RunResultsStore {
  isComplete: boolean;
  outcome: 'WIN' | 'LOSE' | 'ABANDONED' | null;
  score: number;
  durationSeconds: number;
  scoreBreakdown: Record<string, number>;
  materialsEarned: Record<string, number>;  // includes ghost_tokens from run + bonuses
  ghostTokenBonuses: GhostTokenBonus[];     // daily/biome/achievement bonuses for display
  savedToServer: boolean;
  // Actions
  setResult: (result: RunResult, breakdown: Record<string, number>) => void;
  setMaterialsEarned: (materials: Record<string, number>) => void;
  setGhostTokenBonuses: (bonuses: GhostTokenBonus[]) => void;
  markSaved: () => void;
  reset: () => void;
}
```

### EventBus Events

Events emitted by this piece:
- `shop:opened` — `{ offerings: ShopOffering[] }`
- `shop:item-purchased` — `{ powerup: TempPowerup, coinsSpent: number }`
- `shop:rerolled` — `{ newOfferings: ShopOffering[], coinsSpent: number }`
- `encounter:triggered` — `{ encounter: RandomEncounter }`
- `encounter:resolved` — `{ encounterId: string, choiceIndex: number, outcome: EncounterOutcome }`
- `economy:coins-earned` — `{ amount: number, category: string, newBalance: number }`
- `economy:coins-spent` — `{ amount: number, newBalance: number }`
- `run:scoring-complete` — `{ score: number, breakdown: Record<string, number> }`
- `run:materials-calculated` — `{ materials: Record<string, number> }`
- `run:ghost-token-bonuses-claimed` — `{ bonuses: GhostTokenBonus[], total: number }`
- `run:saved-to-server` — `{ runId: string }`

### Edge Cases

- **Insufficient coins at shop**: "Buy" buttons disabled; reroll button disabled if can't afford reroll cost. Never allow negative coin balance.
- **Run abandoned mid-session**: If player closes tab or disconnects, emit `run:abandoned` via beforeunload. Server Action still fires with `outcome: 'ABANDONED'` — awards 40% materials if score > 0. Ghost token bonuses (daily, biome first-clear) are NOT awarded on abandoned runs.
- **Score anti-cheat failure**: If server action rejects score as implausible, save with `score = 0` and log warning. Do not block run history creation — silently correct. Player receives minimum materials (1 primary, 0 ghost tokens).
- **Encounter during shop**: If encounter triggers while shop is open, queue the encounter and show after shop closes. Never layer two overlays.
- **Multiplayer coin sync**: In multiplayer, session coins are per-player and NOT synced to opponent. Each player's economy runs independently. Only final scores and materials are synced at run end.
- **Material type validation failure**: Unknown `materialsEarned` keys from client cause the entire request to be rejected (not silently stripped). This surfaces bugs in the reward calculation code rather than hiding them.
- **Daily bonus race condition**: If two run-end save requests arrive within the same second (unlikely but possible), `user_daily_bonus` upsert with `ON CONFLICT DO UPDATE` handles idempotency. The bonus is awarded at most once per day per role regardless.
- **Ghost token cap exceeded**: If client sends more ghost tokens than are theoretically possible for the score tier + eligible bonuses, the server rejects the materialsEarned field with a validation error and saves with corrected ghost token amount. This protects the ghost token economy from client manipulation.
- **Biome first-clear check**: Checked server-side by querying `run_history` for any prior WIN on the given biome+role combination. The 3 GT bonus fires only if no prior WIN exists. This requires the biome first-clear check to happen BEFORE the current run is inserted (or within the same transaction). Use a database transaction: check → insert run → conditionally award bonus.
- **Salvage parts in run materialsEarned**: `salvage_parts` in the `materialsEarned` field must always be 0 when submitted from a run save (salvage comes from dismantling, not runs). The server action validates this and rejects non-zero values. The material type exists in the map for schema consistency but is earned through a different flow.

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

Session economy is client-side during a run (Phaser + Zustand). Server interaction happens only at run end (Server Action saves to `run_history`). This keeps the run loop fast and offline-tolerant. Anti-cheat happens server-side at save time, not during play.

Ghost token bonuses (daily, biome first-clear) require server-side verification and cannot be computed client-side. The `claim-daily-bonus.ts` server action and `ghost-token-tracker.ts` handle this cleanly at run end without slowing the run itself.

### Key Implementation Decisions

- `SessionEconomyManager` is a Phaser-side class (no React import), emits to EventBus
- Shop offerings are seed-generated for multiplayer consistency — use run seed + visit number as RNG seed
- Encounter dialog must have a timeout (30s) — don't block gameplay indefinitely
- Run scoring is deterministic — same actions always produce same score (verifiable server-side)
- Material rewards computed server-side from score — client sends score, server computes materials
- `run_history` table is intentionally immutable (no update/delete) — append-only audit log
- Daily bonus uses a DATE (not TIMESTAMP) column in `user_daily_bonus` — server UTC date, never client date
- Ghost token economy is scarce by design (~0.7-1.0 per run for competent players). The multiple sinks (skills, boss items, crafting) ensure players always have meaningful allocation decisions even after many runs.
- Salvage parts have only one source (dismantling) and one sink (crafting). They are NOT in the run reward path and must be validated as zero in run save requests.

### Ghost Token Economy Design

**Why ghost tokens matter**: Ghost tokens are the premium gate on the most powerful content:
- Skill ranks R3-R5 require 1-4 GT each (the ranks that unlock tier 4-5 skills and capstones)
- Boss item attunement costs 5 GT per item (one-time)
- Tier 2-3 crafting recipes cost 1-8 GT each

At ~0.7-1.0 GT per run baseline, plus daily bonuses (~7 GT/week for daily players), a player accumulates roughly 10-15 GT per week. This means:
- Unlocking one skill to R5: ~4 GT (≈ 3-6 days of play)
- Attuning one boss item: 5 GT (≈ 4-7 days of play)
- Tier 3 crafting recipe: 5-8 GT (≈ 4-8 days of play)

Players choose their priority. This is the core meta-progression tension.

**Daily bonus implementation**: The `user_daily_bonus` table tracks `last_claimed` date per user per role. At run end, if the outcome is WIN, the server checks if `last_claimed < today (UTC)`. If so: award +1 GT and upsert `last_claimed = today`. This is atomic via the server action — no client involvement.

**Biome first-clear check**: Uses `run_history` query: `SELECT 1 FROM run_history WHERE user_id = $1 AND biome = $2 AND role = $3 AND outcome = 'WIN' LIMIT 1`. If no results: award +3 GT. This must happen before the current run is inserted to avoid awarding the bonus for the current run that is completing.

### Salvage Parts System Integration

Salvage parts are a crafting-only material:
1. Player navigates to Armory/Workshop (between runs)
2. Selects equipment they own but no longer use
3. Clicks "Dismantle" → confirmation dialog (DismantleConfirm.tsx)
4. `dismantle-equipment.ts` Server Action: validates user owns equipment, equipment is not currently equipped, equipment is not MYTHIC. Deducts equipment from inventory, awards salvage parts to `user_materials`.
5. Salvage parts can then be spent in crafting recipes

The `salvage_parts` material appears in `user_materials` table (same table as all other materials) and in the `PersistentCurrency` type. It does NOT appear in `run_history.materials_earned` (always 0 there).

### Daily/Weekly Bonus Implementation Notes

**Daily bonus** (`first win of the day`):
- Server-side tracking in `user_daily_bonus` table
- Date comparison in UTC to avoid timezone issues
- Idempotent upsert: safe to call multiple times, bonus awarded only once
- Triggered by: run end where `outcome = 'WIN'`, checked by `claim-daily-bonus.ts` action

**Weekly challenges** (future feature):
- Not implemented in this piece — ghost token amounts from weekly challenges (3-5 GT) are specified here as design targets
- Implementation deferred to a future piece focused on the challenge/achievement system
- The economy constants table should include weekly challenge amounts so the system can be wired up without changing constants

### File Structure

```
packages/game-engine/src/
  economy/
    session-economy.ts
    session-shop.ts
    temp-powerups.ts
    random-encounters.ts
    ghost-token-tracker.ts
    encounters/
      killer-encounters.ts
      fed-encounters.ts
      shared-encounters.ts
  run/
    run-scoring.ts
    run-results.ts
  scenes/
    shop-scene.ts
packages/shared/src/
  types/economy.ts
  types/powerups.ts
  constants/economy.ts
apps/web/src/
  app/game/results/page.tsx
  components/app/game/hud/ShopPanel.tsx
  components/app/game/hud/EncounterDialog.tsx
  stores/economy.ts
  stores/run-results.ts
  dal/runs/history.ts
  dal/economy/daily-bonus.ts
  app/actions/runs/save-result.ts
  app/actions/economy/claim-daily-bonus.ts
supabase/migrations/XXX_run_history.sql
supabase/migrations/XXX_daily_bonus.sql
```

### Testing Strategy

- Unit test `session-economy.ts`: earn, spend, insufficient balance, reset
- Unit test `run-scoring.ts`: verify scoring formulas with known inputs produce expected scores
- Unit test `save-result.ts` action: Zod validation, anti-cheat score rate check, material key validation, ghost token cap validation, salvage_parts must-be-zero validation
- Unit test `claim-daily-bonus.ts`: first-win claim succeeds, second claim same day returns false, different role allows second claim
- Unit test `ghost-token-tracker.ts`: biome first-clear awards 3 GT exactly once, subsequent clears award 0
- Unit test encounter trigger probability: 1000 zone crossings, verify encounter rate within tolerance
- Unit test material earn rates: verify all five performance tiers produce correct primary/secondary/ghost token amounts
- Component test `ShopPanel.tsx`: renders offerings, buy button disabled when insufficient coins, reroll increments cost
- Component test `EncounterDialog.tsx`: renders choices, timeout auto-selects first choice at 30s
- Integration test: complete run → scoring → server action → `run_history` row created with correct materials
- Integration test: daily bonus flow — win run → claim bonus → verify ghost tokens added → win again same day → verify no duplicate bonus

### Constitution Compliance Checklist

- [x] I: No barrel files — direct imports throughout
- [x] XI: Zod validation — `save-result.ts` validates all fields before DB insert, including ghost token cap
- [x] XII: DAL for all DB access — `dal/runs/history.ts` and `dal/economy/daily-bonus.ts` are only paths to their respective tables
- [x] XIII: Server Actions for mutations — run save and daily bonus claim use `next-safe-action`
- [x] XV: Database schema — 3NF, JSONB for materials has documented rationale (flexible material types), RLS on all tables
- [x] XVI: Zero-trust — client score is validated server-side, ghost token amounts validated against eligible bonuses, daily bonus checked server-side only
- [x] XXIV: Dependency management — no new dependencies beyond existing stack

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

When this piece is fully implemented:
- Single-player run has a complete loop: start → play → shop/encounters → end → results
- Run results page shows score breakdown, materials earned (including ghost tokens), and ghost token bonuses
- `run_history` table populated after every completed/abandoned run
- `user_daily_bonus` table updated on each first-win-of-the-day
- Shop and encounter systems work for both killer and fed roles
- Ghost token bonuses correctly validated and awarded server-side

### Dependencies (Consumed from Earlier Pieces)

This piece requires both role systems (killer, fed) to be complete so that:
- EventBus events from both roles trigger coin earning correctly
- Role-specific shop offerings and encounters are properly filtered
- Scoring criteria from both roles are available at run end

The ghost token economy directly supports piece 13 (persistent-progression):
- Ghost tokens gate skill tree R3-R5 ranks
- Ghost tokens gate boss item attunement
- Ghost tokens gate Tier 2-3 crafting recipes
- The `run_history` table is queried by piece 13's `unlock-resolver.ts` for achievement/unlock conditions

### Success Criteria

- [ ] Session coins earn correctly from all role-specific EventBus events
- [ ] Shop opens at map shop locations, shows seeded offerings for current role
- [ ] Purchasing a powerup deducts coins and applies status effect
- [ ] Reroll increases cost and generates new offerings from same seed pool
- [ ] Encounter dialog appears on zone crossing, resolves choice correctly
- [ ] Run scoring computes correct score from all categories for both roles
- [ ] Material rewards computed and sent to server action
- [ ] Ghost tokens awarded correctly at each performance tier (good: 1, excellent: 2, others: 0)
- [ ] Daily first-win bonus (+1 GT) awarded exactly once per day per role
- [ ] Biome first-clear bonus (+3 GT) awarded exactly once per biome per role
- [ ] `run_history` row created in database after run completion
- [ ] `user_daily_bonus` row upserted on daily bonus claim
- [ ] Results page renders score breakdown, materials (including ghost tokens with sources), outcome
- [ ] Anti-cheat: ghost tokens in client request cannot exceed server-computed maximum
- [ ] Anti-cheat: salvage_parts in run save request must be 0

### Alignment Notes

This piece is the bridge between role gameplay (pieces 10-11) and meta-progression (piece 13). The `materialsEarned` from this piece feeds directly into piece 13's skill trees, trophies, boss items, and crafting recipes. The ghost token economy specifically:
- Ghost tokens gate the revised skill cost curve (R3: 1GT, R4: 2GT, R5: 4GT from piece 13 architecture)
- Ghost tokens gate boss item attunement (5GT per MYTHIC item)
- Ghost tokens gate Tier 2-3 crafting recipes (1-8GT per recipe)

The `run_history` table is also queried by piece 13's `unlock-resolver.ts` to check conditions like "complete 5 runs as killer" or "achieve score > 3000 in city biome" or "win 10 runs as fed" (FB-7 boss item condition).

The `salvage_parts` material introduced here is earned via the crafting system (piece 13 Armory/Workshop), not from runs. This piece defines the material type and validates it as zero in run saves, but the earning flow is implemented in the crafting server actions.
