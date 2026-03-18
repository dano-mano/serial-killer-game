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

### Dependency Overview

**From piece 01 (foundation)**: Structured logging (Pino) available via a shared logger module. All environment variables accessed through a typed env config module — never directly via process.env.

**From piece 02 (Supabase)**: Server-side Supabase client for database access (DAL functions). Used for persisting run history and daily bonus tracking.

**From piece 03 (design system)**: Shared UI components (buttons, cards, dialogs, inputs, toasts) and layout components for the shop panel, encounter dialog, and results page.

**From piece 04 (infrastructure)**: EventBus for emitting and receiving game events between the Phaser game engine and React stores.

**From piece 07 (player/role framework)**: Player role (KILLER or FED), run configuration (seed, biome, role, loadout), run state (phase, tick count, start time), run result (outcome, score, duration, materials earned). Run manager lifecycle hooks: `onRunStart` (where session economy initializes) and `onRunEnd` (where scoring and persistence happen). Inventory types: item ID, type, name, rarity (COMMON through MYTHIC), effect. Inventory actions: add item, remove item.

**From piece 08 (combat)**: Status effect type (ID, name, buff/debuff type, remaining duration in milliseconds). Status effect system functions: apply and remove status effects on entities. Temp powerups are applied as status effects.

**From piece 10 (killer gameplay)**: Killer run state data consumed for scoring: targets eliminated, targets disposed, evidence destroyed. Killer Zustand store with kill count, disposal count, and evidence destroyed count.

**From piece 11 (fed gameplay)**: Fed run state data consumed for scoring: evidence collected, interrogations performed, arrest attempts, arrest condition (INSUFFICIENT/WEAK/MODERATE/STRONG/AIRTIGHT). Fed Zustand store with those same fields plus current arrest condition tier.

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

**run_history table**: Records the outcome of each completed run. One row per run. Fields:
- Run ID (UUID primary key)
- User ID (foreign key to auth.users, cascade delete)
- Role played (KILLER or FED, validated server-side)
- Biome name
- Final score (integer, default 0)
- Duration in seconds (integer, default 0)
- Targets eliminated (nullable integer — relevant for killer only)
- Evidence collected (nullable integer — relevant for fed only)
- Outcome (WIN, LOSE, or ABANDONED)
- Materials earned (JSONB map of material type to integer amount — e.g., `{"evidence_dust": 3, "ghost_tokens": 2}`)
- Created timestamp

Indexed by user ID + created timestamp descending (for run history queries ordered most-recent first). Row-level security: users can SELECT and INSERT their own rows. Run history is immutable — no UPDATE or DELETE.

**user_daily_bonus table**: Tracks when each user last claimed the first-win-of-the-day ghost token bonus. One row per user per role. Fields:
- User ID (foreign key to auth.users, cascade delete)
- Role (KILLER or FED)
- Last claimed date (DATE, not timestamp — server uses UTC date for comparison)

Unique constraint on (user_id, role). Row-level security: users can read their own rows. All writes done by server-side service role — no client-side insert allowed.

### Session Economy Manager

The session economy manager tracks coin state during a run. It is entirely client-side during play; the server validates final totals when the run result is saved.

State tracked: current coin balance, total earned this run, total spent this run, and coins earned broken down by category (for the scoring breakdown display).

Actions: initialize (called at run start, optional starting coins), earn coins (amount + category), spend coins (fails gracefully if insufficient — never allows negative balance), check if player can afford an amount, get current balance, get a state snapshot, reset (called at run end).

**Coin earning rates**:

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

The shop appears at fixed locations within each biome map (1–2 per map, marked on the minimap). Players can open the shop overlay, browse a randomly-selected pool of temporary powerups, and buy them with session coins.

**Offering pool composition**:
- 1 RARE offering (role-specific, ~25% reroll chance to see)
- 1 UNCOMMON offering (role-specific)
- 1 UNCOMMON offering (shared)
- 1 COMMON offering (shared)

**Price scaling**: Base prices increase 20% per shop visit after the second visit. Prices are computed at generation time (not recalculated on purchase).

**Reroll**: Costs session coins (10 → 20 → 40 → 80 per reroll, doubling). Generates new offerings from the same seed pool (deterministic — both multiplayer players see the same reroll sequence regardless of when they visit).

### Temporary Powerups

All powerups are applied as status effects. They persist for the run duration unless explicitly scoped to one zone or a timed duration in milliseconds.

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

Random encounters trigger on zone transitions. Each zone crossing has a 15% chance of triggering an encounter (rising to 25% after zone 4). At most one encounter triggers per zone. A cooldown prevents the same encounter from repeating within a configured number of zone transitions.

**Encounter trigger flow**:
1. Player crosses a zone boundary — a zone-entered event fires
2. The economy manager performs a probability check
3. If triggered: the system selects a valid encounter for the current role with no active cooldown
4. The encounter dialog renders in the React UI
5. The player selects a choice — the outcome is applied, and an encounter-resolved event fires

**Killer encounters**:

| Encounter | Description | Choices |
|-----------|-------------|---------|
| Black Market Dealer | A shady figure offers off-the-books goods | Buy evidence cleanup kit (25 coins), Buy disguise kit (30 coins), Leave |
| Corrupt Cop | A dirty officer knows you're operating | Pay bribe (40 coins) — heat reduced, Refuse — heat increased +20, Fight — enters combat |
| Opportunist Thief | Someone saw you and wants payment | Pay off (20 coins), Silence them (kills NPC, +1 body, +evidence), Chase away (50% succeed) |
| Underground Fence | Sell excess items | Sell item for 150% value, Pass |
| False Lead Tip | Anonymous tip about a "suspicious NPC" | Plant evidence near tip NPC (costs cleanup kit), Ignore |

**Fed encounters**:

| Encounter | Description | Choices |
|-----------|-------------|---------|
| Informant Call | Anonymous tip about suspicious activity | Follow up (travel to marked zone, find evidence), Dismiss |
| Anonymous Package | Untraceable evidence delivered to you | Accept (receives UNCOMMON evidence, +5 arrest viability), Report to chain of command (lose evidence, +15 clean score) |
| Fellow Officer | Off-duty cop offers unofficial help | Accept illegal surveillance device (free WIRETAP_KIT, +8 heat), Decline |
| Evidence Locker | Unsecured evidence from old case | Take it (receives relevant evidence, +30 arrest viability, +10 heat — technically illegal), Secure and tag (+15 score bonus, no evidence) |
| Witness in Danger | A witness NPC is being approached by suspect | Rush to protect (+15 viability if saved), Set up surveillance (entrapment-lite, +10 viability, +12 heat) |

**Shared encounters**:

| Encounter | Description | Choices |
|-----------|-------------|---------|
| Locked Room | Door to useful zone is locked | Lockpick (costs lockpick tool), Break down (loud, generates noise evidence), Leave |
| Storm Approaching | Environmental hazard incoming | Shelter (skip 1 zone, no penalty), Push through (movement speed -30% for zone, no time lost) |
| Crowd Event | Sudden public gathering | Blend in (faster movement through crowd), Avoid (longer route, +2 minutes) |

### Run Scoring

Score is computed at run end from the session economy's coin-earned-by-category breakdown and role-specific run data.

**Killer scoring formula**:
- Base score: kills × 500, disposed kills × 300, evidence destroyed × 50
- Bonuses: bonus objectives × 200, evasion bonus × 150
- Time bonus: max(0, (600 seconds − actual seconds) × 2) — rewards fast runs
- Penalties: evidence left on map × −30, witnesses still alive × −20
- Final score: (base + bonuses + time bonus + penalties) × biome difficulty multiplier

**Fed scoring formula**:
- Base score: evidence collected × 100, witnesses interviewed × 80
- Arrest bonus by tier: STRONG 2000, MODERATE 1200, combat-resolved 800, vigilante 400
- Investigation bonus: suspects eliminated × 50, bonus objectives × 200
- Penalties: wrong arrest × −300, inadmissible evidence count × −20
- Final score: (base + arrest bonus + investigation bonus + penalties) × biome difficulty multiplier

The biome difficulty multiplier is defined in the biome configuration.

**Performance tier thresholds** (used for material earn rate calculations):

| Tier | Score Range | Outcome |
|------|-------------|---------|
| Poor | < 1000 | LOSS |
| Average (loss) | 1000-2999 | LOSS |
| Average (win) | 1000-2999 | WIN |
| Good (win) | 3000-5999 | WIN |
| Excellent (win) | >= 6000 | WIN |

### Run Results and Material Rewards

Material rewards are computed from the final score and run outcome. Ghost tokens are the central gating currency with multiple sources. Salvage parts are a separate material type earned through equipment dismantling (not from runs directly — the material type appears in the same materials map for consistency but must always be 0 in run save submissions).

**Material types**:

| Material | Source | Used For |
|----------|--------|---------|
| evidence_dust | Fed wins | Fed skill tree unlocks (R1–R5), fed crafting recipes |
| blood_marks | Killer wins | Killer skill tree unlocks (R1–R5), killer crafting recipes |
| ghost_tokens | Good/excellent wins + bonuses | Tier 3–5 skill ranks, boss item attunement (5 GT), legendary crafting recipes (5–10 GT) |
| case_files | Fed investigation bonuses | Fed trophies |
| shadow_coins | Killer evasion bonuses | Killer trophies |
| salvage_parts | Equipment dismantling (Armory/Workshop) | Crafting recipe material cost |

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

| Source | Amount | Frequency | Verification |
|--------|--------|-----------|--------------|
| First win of the day | +1 | Daily per role | Server-side — tracked in daily bonus table (date-based, UTC) |
| Biome first-clear | +3 | Once per biome per role | Server-side — checked against run history for prior WIN on that biome+role |
| Achievement milestones (every 5th trophy unlocked) | +2 | Milestone | Server-side — triggered by the unlock resolver at trophy grant time |
| Weekly challenge completion | +3 to +5 | Weekly | Future feature — not implemented in this piece |

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

The ghost token tracker handles bonus ghost token sources that require server-side state validation (first-win-of-the-day, biome first-clear). It calls server actions to check and claim bonuses — never trusts client-side claims.

At run end the tracker: (1) receives the run result and role information, (2) calls server actions to check each applicable bonus source, (3) aggregates the confirmed bonus amounts, (4) adds them to the final materials earned map.

Ghost tokens from run performance (good/excellent WIN outcomes) are computed deterministically from the score and do not require server-side bonus validation. Bonus tokens from special sources (daily/biome) are validated and claimed server-side before being included in the materials earned display.

### DAL and Server Actions

**Run history DAL**: Provides functions to save a run result (inserts one row into run_history), retrieve a user's run history (paginated, most recent first), and retrieve a single run by ID. Input fields: role, biome, score, duration in seconds, targets eliminated (killer only), evidence collected (fed only), outcome, and the materials earned map.

**Daily bonus DAL**: Checks whether a user has already claimed the first-win-of-the-day ghost token bonus for their current role (by querying user_daily_bonus for today's date in UTC). If not yet claimed, upserts the record and returns true (bonus granted). If already claimed, returns false (no bonus). Called by the claim-daily-bonus server action after a win is confirmed.

**Save-result server action**: A validated server action using next-safe-action and Zod. Authenticates the user, validates all input fields, applies anti-cheat logic, then calls the run history DAL to persist the result.

**Claim-daily-bonus server action**: Called after a WIN is saved. Checks server-side whether the first-win-of-the-day bonus applies (queries the daily bonus DAL). Returns 0 or 1 ghost tokens to add to the materials earned. Client cannot claim this directly — only valid as a post-WIN server-side step.

**Anti-cheat validations** in the save-result server action:
- Score plausibility: score divided by duration in seconds must not exceed a server-defined maximum rate (e.g., 50 coins/second equivalent)
- Material consistency: total materials must match the expected reward for the given score tier
- Known material types only: only the six valid material type keys are accepted; unknown keys cause the entire request to be rejected (not silently stripped — rejection surfaces bugs in the reward calculation code)
- Role-data consistency: killer submissions without targets eliminated, or fed submissions without evidence collected, are rejected
- Ghost token cap: ghost tokens in the submission must not exceed score-based tokens plus server-calculated eligible bonuses (verified independently using the daily bonus and run history tables)

### HUD and UI Components

**Shop panel**: Renders when the economy store indicates the shop is open.
- Header: "Shop — [N] coins" with coin icon
- Offerings grid: 2×2 card layout with rarity border colors (grey/blue/gold for COMMON/UNCOMMON/RARE)
- Each card: icon, name, description, price badge, Buy button (disabled if insufficient coins)
- Footer: Reroll button showing current reroll cost, close button

**Encounter dialog**: Renders when an encounter is active. Uses the shared dialog component.
- Title: encounter title
- Body: encounter description narrative text
- Choice buttons (2–3): each shows label, description, cost if any, outcome hint
- No cancel option — player must choose. Auto-selects first option after 30 seconds.

**Post-run results page**: Server Component rendered after run completion.
- Outcome banner: WIN / LOSE with role-appropriate imagery
- Score breakdown: table showing each scoring category and its contribution
- Materials earned: icon + amount per material type, including ghost tokens with explicit label
- Ghost token bonuses shown separately with their source label (daily bonus, biome first-clear, etc.)
- Best moments: top 3 single-action coin earns
- Continue button (to progression page or main menu) and Play Again button (same biome)

### Economy State

**Economy store** tracks:
- Current coin balance and total earned this run
- Shop state: open/closed, current offerings (3–4 items), reroll count, current reroll cost
- Active temporary powerups applied this run
- Active encounter waiting for player choice (null if none)

Actions: earn coins (with category), spend coins (returns false if insufficient), open/close shop, purchase a powerup offering, update reroll cost, add/remove active powerups, set/clear active encounter, reset.

**Run results store** tracks:
- Whether the run is complete, outcome, score, duration, score breakdown by category
- Materials earned (including ghost tokens from run performance plus bonuses)
- Ghost token bonuses by source (for display on results screen)
- Whether the result has been saved to the server

### Events Emitted

Events fired by the session economy systems (consumed by React stores and piece 14):
- Shop opened (with current offerings)
- Shop item purchased (powerup acquired, coins spent)
- Shop rerolled (new offerings, coins spent)
- Encounter triggered (encounter data)
- Encounter resolved (encounter ID, choice made, outcome)
- Coins earned (amount, category, new balance)
- Coins spent (amount, new balance)
- Scoring complete (final score, breakdown)
- Materials calculated (materials earned map)
- Ghost token bonuses claimed (bonuses list, total amount)
- Result saved to server (run ID)

### Edge Cases

- **Insufficient coins at shop**: Buy buttons are disabled; reroll button is disabled if player cannot afford the current reroll cost. The coin balance never goes negative.
- **Run abandoned mid-session**: If the player closes the tab or disconnects, a beforeunload handler fires a save attempt with outcome ABANDONED. An abandoned run awards 40% of materials if score > 0. Ghost token bonuses (daily, biome first-clear) are not awarded on abandoned runs.
- **Score anti-cheat failure**: If the server action rejects the score as implausible, the run is saved with score 0 and the discrepancy is logged. Run history creation is not blocked. Player receives minimum materials (1 primary, 0 ghost tokens).
- **Encounter during shop**: If an encounter triggers while the shop is open, the encounter is queued and shown after the shop closes. Two overlays never display simultaneously.
- **Multiplayer coin sync**: In multiplayer, session coins are per-player and not synced to the opponent. Each player's economy runs independently. Only final scores and materials are synced at run end.
- **Material type validation failure**: Unknown material type keys from the client cause the entire save request to be rejected (not silently stripped). This surfaces bugs in the reward calculation code.
- **Daily bonus race condition**: If two save requests arrive within the same second (e.g., double-submit), the daily bonus upsert uses conflict handling to ensure the bonus is awarded at most once per day per role.
- **Ghost token cap exceeded**: If the client submits more ghost tokens than theoretically possible for the score tier plus eligible bonuses, the server rejects with a validation error and saves with the corrected amount. This protects the ghost token economy from client manipulation.
- **Biome first-clear check**: Checked server-side by querying run_history for any prior WIN on the given biome + role combination. The 3 ghost token bonus fires only if no prior WIN exists. The check must happen before the current run is inserted (use a database transaction: check → insert → conditionally award bonus).
- **Salvage parts in run submission**: Salvage parts in the materials earned map must always be 0 in a run save submission (salvage comes from dismantling, not runs). The server action validates this and rejects non-zero values. The material type exists in the schema for consistency but is earned through a different flow.

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

### Session Economy Manager and Shop

Key class signatures for the game engine side:

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

### TypeScript Types

Core types for `packages/shared/src/types/economy.ts`:

```typescript
import { ID, Timestamp } from './common';

export interface SessionCurrency {
  coins: number;           // earned/spent within run, resets at run end
  totalEarned: number;
  totalSpent: number;
  coinsEarnedByCategory: Record<string, number>;
}

export interface PersistentCurrency {
  materials: Record<string, number>;
  // Keys: 'evidence_dust', 'blood_marks', 'ghost_tokens', 'case_files',
  //       'shadow_coins', 'salvage_parts'
}

export interface ShopOffering {
  id: ID;
  powerupId: string;
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
  cooldownZones: number;
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
  heatModifier?: number;
  suspicionModifier?: number;
  itemGranted?: string;         // InventoryItem id
  narrativeText: string;
}

export interface GhostTokenBonus {
  source: 'FIRST_WIN_OF_DAY' | 'BIOME_FIRST_CLEAR' | 'ACHIEVEMENT_MILESTONE' | 'WEEKLY_CHALLENGE';
  amount: number;
  claimedAt: Timestamp;
}

export interface SalvagePartDrop {
  equipmentId: ID;
  equipmentRarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
  salvageAmount: number;
}
```

Types for `packages/shared/src/types/powerups.ts`:

```typescript
export type PowerupDuration = 'RUN' | 'ZONE' | 'TIMED_MS';

export interface PowerupEffect {
  stat: string;
  modifier: number;
  modifierType: 'FLAT' | 'PERCENT';
  duration: PowerupDuration;
  durationMs?: number;          // required if duration === 'TIMED_MS'
}

export interface TempPowerup {
  id: string;
  name: string;
  description: string;
  iconKey: string;
  role: 'KILLER' | 'FED' | 'SHARED';
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE';
  effects: PowerupEffect[];
  statusEffectId: string;       // maps to status-effects.ts for application
}
```

### DAL Signatures

For `apps/web/src/dal/runs/history.ts`:

```typescript
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

export async function saveRunResult(userId: string, input: SaveRunInput): Promise<Result<RunHistoryDTO, DatabaseError>>;
export async function getRunHistory(userId: string, limit?: number, offset?: number): Promise<Result<RunHistoryDTO[], DatabaseError>>;
export async function getRunById(runId: string, userId: string): Promise<Result<RunHistoryDTO, AppError>>;
```

### Zustand Store Interfaces

For `apps/web/src/stores/economy.ts`:

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
  spendCoins: (amount: number) => boolean;
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

For `apps/web/src/stores/run-results.ts`:

```typescript
interface RunResultsStore {
  isComplete: boolean;
  outcome: 'WIN' | 'LOSE' | 'ABANDONED' | null;
  score: number;
  durationSeconds: number;
  scoreBreakdown: Record<string, number>;
  materialsEarned: Record<string, number>;
  ghostTokenBonuses: GhostTokenBonus[];
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

```typescript
'shop:opened'                    → { offerings: ShopOffering[] }
'shop:item-purchased'            → { powerup: TempPowerup, coinsSpent: number }
'shop:rerolled'                  → { newOfferings: ShopOffering[], coinsSpent: number }
'encounter:triggered'            → { encounter: RandomEncounter }
'encounter:resolved'             → { encounterId: string, choiceIndex: number, outcome: EncounterOutcome }
'economy:coins-earned'           → { amount: number, category: string, newBalance: number }
'economy:coins-spent'            → { amount: number, newBalance: number }
'run:scoring-complete'           → { score: number, breakdown: Record<string, number> }
'run:materials-calculated'       → { materials: Record<string, number> }
'run:ghost-token-bonuses-claimed'→ { bonuses: GhostTokenBonus[], total: number }
'run:saved-to-server'            → { runId: string }
```

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
