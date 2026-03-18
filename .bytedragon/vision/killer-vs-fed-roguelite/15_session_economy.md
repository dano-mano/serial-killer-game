---
vision: killer-vs-fed-roguelite
sequence: "15"
name: session-economy
group: Progression
group_order: 5
status: pending
depends_on:
  - "11: KillerObjective scoring types, KillerStore state (kills, disposals, evidenceDestroyed) for run scoring"
  - "13: FedRunState, ArrestCondition, FedStore state (evidenceCollected, interrogationsPerformed, arrestCondition) for run scoring"
  - "02: Supabase server client for DAL (run_history, daily_bonus persistence)"
  - "07: PlayerRole, RunConfig, Loadout, RunManager lifecycle hooks, inventory types"
  - "01: Pino logger singleton, Result<T,E> utilities, env config module"
  - "03: AppButton, AppCard, AppDialog, AppInput, AppToast shared UI components"
  - "04: EventBus for game event communication, Phaser scene lifecycle"
  - "09: StatusEffectSystem for applying temp powerups as status effects"
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
last_aligned: v1.2.0
---

# Vision Piece 15: Session Economy

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: killer-gameplay (11), fed-gameplay (13)

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Implement the within-run economy that completes the single-run gameplay loop. Session coins are earned through role-appropriate actions, spent at an in-run shop offering random temporary powerups, and consumed in random encounter events. At run end, a scoring system computes performance and awards persistent materials — including the scarce ghost_token currency and new salvage_parts material — used by meta-progression (the persistent-progression feature). Run results are saved to the database. This piece transforms isolated role systems into a cohesive run loop with clear start, middle, and end.

### Dependency Overview

**Foundation infrastructure**: Structured logging (Pino) available via a shared logger module. All environment variables accessed through a typed env config module — never directly via process.env.

**Auth and database infrastructure**: Server-side Supabase client for database access (DAL functions). Used for persisting run history and daily bonus tracking.

**Design system**: Shared UI components (buttons, cards, dialogs, inputs, toasts) and layout components for the shop panel, encounter dialog, and results page.

**Game engine bootstrap**: EventBus for emitting and receiving game events between the Phaser game engine and React stores.

**Player and role framework**: Player role (KILLER or FED), run configuration (seed, biome, role, loadout), run state (phase, tick count, start time), run result (outcome, score, duration, materials earned). Run manager lifecycle hooks: `onRunStart` (where session economy initializes) and `onRunEnd` (where scoring and persistence happen). Inventory types: item ID, type, name, rarity (COMMON through MYTHIC), effect. Inventory actions: add item, remove item.

**Combat system**: Status effect type (ID, name, buff/debuff type, remaining duration in milliseconds). Status effect system functions: apply and remove status effects on entities. Temp powerups are applied as status effects.

**Killer gameplay**: Killer run state data consumed for scoring: targets eliminated, targets disposed, evidence destroyed. Killer Zustand store with kill count, disposal count, and evidence destroyed count.

**Fed gameplay**: Fed run state data consumed for scoring: evidence collected, interrogations performed, arrest attempts, arrest condition (INSUFFICIENT/WEAK/MODERATE/STRONG/AIRTIGHT). Fed Zustand store with those same fields plus current arrest condition tier.

### New Data Entities

**Session currency**: A transient coin balance earned during a run and reset at run end. Tracks total earned and total spent for scoring breakdown.

**Persistent currency**: A map of material type names to integer amounts. Material types: evidence_dust (fed wins), blood_marks (killer wins), ghost_tokens (good/excellent wins + bonuses), case_files (fed investigation bonuses), shadow_coins (killer evasion bonuses), salvage_parts (equipment dismantling only). All material type keys are validated server-side before any database insert.

**Shop offering**: A single item available in the in-run shop. Has a powerup reference, display name, description, icon key, session coin price, applicable role (KILLER/FED/SHARED), and rarity (COMMON/UNCOMMON/RARE).

**Random encounter**: A scripted event that may trigger on zone transitions. Has a title, description, a list of player choices, a trigger probability per zone crossing (0–1), and a cooldown zone count (how many zones before the same encounter can repeat).

**Encounter choice**: One option within an encounter. Has a label, description, optional coin cost, and an outcome describing what happens when selected (coin change, powerup granted, evidence modifier, heat modifier, suspicion modifier, item granted, narrative text).

**Ghost token bonus**: A record of an additional ghost token award from a special source (first win of day, biome first-clear, achievement milestone, weekly challenge). Tracks source, amount, and when claimed. Server-side tracking required — never trust client.

**Salvage part drop**: Records how many salvage parts a piece of equipment yields when dismantled. Rates by rarity: COMMON 1, UNCOMMON 2, RARE 4, LEGENDARY 8. MYTHIC equipment cannot be dismantled.

**Temporary powerup**: A run-only buff applied as a status effect. Has role applicability, rarity, a list of stat effects (each with a stat name, modifier value, modifier type FLAT/PERCENT, and duration: full-run/one-zone/timed-milliseconds), and a status effect identifier used to apply/remove it from entities.

### Database Tables

**run_history table**: Records the outcome of each completed run. One row per run. Fields: run ID (UUID primary key), user ID (foreign key, cascade delete), role played (KILLER or FED, validated server-side), biome name, final score (integer, default 0), duration in seconds (integer, default 0), targets eliminated (nullable integer — killer only), evidence collected (nullable integer — fed only), outcome (WIN, LOSE, or ABANDONED), materials earned (JSONB map of material type to integer amount), created timestamp. Indexed by user ID + created timestamp descending. Row-level security: users can SELECT and INSERT their own rows. Run history is immutable — no UPDATE or DELETE.

**user_daily_bonus table**: Tracks when each user last claimed the first-win-of-the-day ghost token bonus. One row per user per role. Fields: user ID (foreign key, cascade delete), role (KILLER or FED), last claimed date (DATE, not timestamp — server uses UTC date for comparison). Unique constraint on (user_id, role). Row-level security: users can read their own rows. All writes done by server-side service role — no client-side insert allowed.

### Session Economy Manager

The session economy manager tracks coin state during a run. It is entirely client-side during play; the server validates final totals when the run result is saved.

State tracked: current coin balance, total earned this run, total spent this run, and coins earned broken down by category (for the scoring breakdown display).

Coin earning rates:

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

### In-Session Shop

The shop appears at fixed locations within each biome map (1–2 per map, marked on the minimap). Players open the shop overlay, browse a randomly-selected pool of temporary powerups, and buy them with session coins.

Offering pool: 1 RARE role-specific, 1 UNCOMMON role-specific, 1 UNCOMMON shared, 1 COMMON shared. Price scaling: base prices increase 20% per shop visit after the second visit. Reroll costs: 10 → 20 → 40 → 80 per reroll (doubling). Shop offerings are seed-generated for multiplayer consistency — use run seed + visit number as RNG seed.

### Random Encounters

Random encounters trigger on zone transitions. Each zone crossing has a 15% chance of triggering an encounter (rising to 25% after zone 4). At most one encounter triggers per zone. A cooldown prevents the same encounter from repeating within a configured number of zone transitions.

Encounter dialog must have a 30-second timeout — auto-selects first option to avoid blocking gameplay.

### Run Scoring

Score is computed at run end from the session economy's coin-earned-by-category breakdown and role-specific run data.

**Killer scoring formula**: base = kills×500 + disposed×300 + evidenceDestroyed×50. Bonuses: bonusObjectives×200 + evasion×150. Time bonus: max(0, (600s − actual) × 2). Penalties: evidenceLeft×−30, witnessesAlive×−20. Final = (base + bonuses + time + penalties) × biome difficulty multiplier.

**Fed scoring formula**: base = evidenceCollected×100 + witnessesInterviewed×80. Arrest bonus by tier: STRONG 2000, MODERATE 1200, combat 800, vigilante 400. Investigation bonus: suspectsEliminated×50 + bonusObjectives×200. Penalties: wrongArrest×−300, inadmissible×−20. Final = (base + arrest + investigation + penalties) × biome difficulty multiplier.

### Material Rewards

| Performance Tier | Score Range | Outcome | Primary Mat | Ghost Tokens | Total |
|-----------------|-------------|---------|-------------|--------------|-------|
| Poor | < 1000 | LOSS | 1 | 0 | 1 |
| Average (loss) | 1000-2999 | LOSS | 2 | 0 | 3 |
| Average (win) | 1000-2999 | WIN | 4 | 0 | 5 |
| Good (win) | 3000-5999 | WIN | 5 | 1 | 8 |
| Excellent (win) | >= 6000 | WIN | 7 | 2 | 12 |

Ghost token bonuses: first win of day (+1, daily per role), biome first-clear (+3, once per biome per role), achievement milestones (+2, every 5th trophy). All bonus sources validated server-side.

Salvage parts have only one source (equipment dismantling) and must always be 0 in run save submissions — the server validates this.

### Edge Cases

- Insufficient coins at shop: Buy and reroll buttons disabled; balance never goes negative
- Run abandoned mid-session: beforeunload fires save attempt with ABANDONED outcome — 40% materials if score > 0; ghost token bonuses not awarded on abandoned runs
- Score anti-cheat failure: run saved with score 0 and discrepancy logged; player receives minimum materials
- Encounter during shop: encounter queued until shop closes — two overlays never display simultaneously
- Multiplayer coin sync: session coins are per-player and not synced; only final scores and materials sync at run end
- Daily bonus race condition: upsert uses conflict handling to ensure bonus awarded at most once per day per role
- Ghost token cap exceeded: server rejects submission and saves corrected amount
- Biome first-clear: check-then-insert must be atomic (check before current run inserted)

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
- Ghost token economy is scarce by design (~0.7-1.0 per run). Multiple sinks (skills, boss items, crafting) ensure meaningful allocation decisions
- Salvage parts have only one source (dismantling) and one sink (crafting). NOT in the run reward path

### Class Signatures

```typescript
// packages/game-engine/src/economy/session-economy.ts
class SessionEconomyManager {
  initialize(startingCoins?: number): void;
  earn(amount: number, category: string): void;
  spend(amount: number): Result<void, AppError>;
  canAfford(amount: number): boolean;
  getBalance(): number;
  getSnapshot(): SessionCurrency;
  reset(): void;
}

// packages/game-engine/src/economy/session-shop.ts
class SessionShop {
  generateOfferings(runSeed: string, visitNumber: number, role: PlayerRole): ShopOffering[];
  purchase(offeringId: ID, economy: SessionEconomyManager): Result<TempPowerup, AppError>;
  reroll(economy: SessionEconomyManager): Result<ShopOffering[], AppError>;
}

// packages/game-engine/src/economy/ghost-token-tracker.ts
class GhostTokenTracker {
  async calculateBonuses(userId: string, runResult: RunResult, role: PlayerRole, biome: string): Promise<GhostTokenBonus[]>;
  async getTotalBonusTokens(bonuses: GhostTokenBonus[]): Promise<number>;
}
```

### DAL and Server Actions

**File**: `apps/web/src/dal/runs/history.ts`
- `saveRunResult(input: SaveRunInput): Promise<Result<RunHistoryDTO, DatabaseError>>`
- `getRunHistory(userId: string, pagination): Promise<Result<RunHistoryDTO[], DatabaseError>>`

**File**: `apps/web/src/app/actions/runs/save-result.ts`
- Anti-cheat: score/duration ratio check, material consistency, known material type keys only, role-data consistency, ghost token cap
- Returns: `Result<{ runId: string; materialsEarned: Record<string, number> }, SaveResultError>`

**File**: `apps/web/src/app/actions/economy/claim-daily-bonus.ts`
- Post-WIN only. Server-side check and atomic upsert. Returns: `Result<{ ghostTokens: number }, ClaimBonusError>`

### Testing Strategy

- Unit tests for SessionEconomyManager: coin earning, spending (insufficient balance rejection), reset
- Unit tests for SessionShop: seed-deterministic offering generation, price scaling, reroll cost progression
- Unit tests for run scoring: killer and fed formulas with known inputs produce expected scores
- Unit tests for material reward tiers: correct material amounts per score range and outcome
- Integration tests for save-result server action: score plausibility rejection, ghost token cap rejection, immutable run_history enforcement
- E2E: full run loop — start as killer, earn coins, buy shop item, run ends, results page shows materials earned (Playwright)

### Constitution Compliance

- [x] No barrel files — all imports direct to specific files
- [x] SessionEconomyManager has no React import — emits to EventBus only
- [x] All mutations through Server Actions with Zod validation
- [x] Result<T,E> for all DAL functions and Server Actions
- [x] Material rewards computed server-side from score — client cannot supply material amounts
- [x] Daily bonus tracking server-side only — never trust client date

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

- `packages/game-engine/src/economy/session-economy.ts`
- `packages/shared/src/types/economy.ts`
- `packages/shared/src/constants/economy.ts`
- `packages/game-engine/src/economy/session-shop.ts`
- `packages/game-engine/src/scenes/shop-scene.ts`
- `packages/game-engine/src/economy/temp-powerups.ts`
- `packages/shared/src/types/powerups.ts`
- `packages/game-engine/src/economy/random-encounters.ts`
- `packages/game-engine/src/economy/ghost-token-tracker.ts`
- `packages/game-engine/src/run/run-scoring.ts`
- `packages/game-engine/src/run/run-results.ts`
- `apps/web/src/app/game/results/page.tsx`
- `apps/web/src/stores/economy.ts`
- `apps/web/src/stores/run-results.ts`
- `supabase/migrations/XXX_run_history.sql`
- `supabase/migrations/XXX_daily_bonus.sql`
- `apps/web/src/dal/runs/history.ts`
- `apps/web/src/dal/economy/daily-bonus.ts`
- `apps/web/src/app/actions/runs/save-result.ts`
- `apps/web/src/app/actions/economy/claim-daily-bonus.ts`

### Dependencies (Consumed from Earlier Pieces)

**From piece 11 (Killer Core Mechanics)**:
- `KillerObjective` scoring types, `KillerStore` state (kills, disposals, evidenceDestroyed)

**From piece 13 (Fed Core Mechanics)**:
- `FedRunState`, `ArrestCondition`, `FedStore` state (evidenceCollected, interrogationsPerformed, arrestCondition)

**From piece 09 (Combat System)**:
- `StatusEffectSystem` for applying temp powerups as status effects

**From piece 07 (Player and Roles)**:
- `PlayerRole`, `RunConfig`, `Loadout`, `RunManager` lifecycle hooks

### Success Criteria

- [ ] Session coins earn and spend correctly with EventBus integration; balance never goes negative
- [ ] Shop offerings generated deterministically from run seed — same seed produces same offerings on both multiplayer clients
- [ ] Random encounters trigger at correct probabilities, respect cooldowns, and never display over the shop overlay
- [ ] Killer scoring formula: clean kill + disposal + time bonus produces expected total
- [ ] Fed scoring formula: evidence + STRONG arrest + investigation bonus produces expected total
- [ ] Performance tier boundaries correctly assign material reward amounts
- [ ] Ghost token daily bonus claimed exactly once per role per UTC day
- [ ] Biome first-clear bonus: +3 ghost tokens only on first WIN for that biome+role combination
- [ ] save-result server action rejects score/material manipulation; immutable run_history enforced
- [ ] Results page shows per-category score breakdown and material rewards with ghost token source labels

### Alignment Notes

This piece introduces the `RunHistoryDTO` type and `getRunHistory()` function consumed by piece 16 (progression infrastructure). The `run_history` table is created here but also referenced by piece 16's UnlockResolver for evaluating unlock conditions.

The material type constants introduced here (`MATERIAL_TYPES` from `packages/shared/src/constants/economy`) are imported by piece 16 (progression infrastructure) for the materials DAL and server actions.

Salvage parts must always be 0 in run save submissions — earned only via equipment dismantling in the Workshop/Armory (piece 17). The material type exists in the schema for consistency with the shared PersistentCurrency type.
