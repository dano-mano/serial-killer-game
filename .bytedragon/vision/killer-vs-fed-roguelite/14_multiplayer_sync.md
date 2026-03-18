---
vision: killer-vs-fed-roguelite
sequence: 14
name: multiplayer-sync
group: Multiplayer
group_order: 6
status: pending
depends_on: [13_persistent_progression]
produces:
  - "supabase/migrations/XXX_multiplayer.sql — game_sessions and game_events tables with RLS"
  - "apps/web/src/lib/supabase/realtime.ts — Supabase Realtime channel management"
  - "packages/shared/src/types/multiplayer.ts — GameSession, LobbyState, SyncPayload, PlayerPresence, GameEvent, MatchmakingRequest"
  - "packages/shared/src/constants/multiplayer.ts — sync tick rate, max latency, event types"
  - "packages/shared/src/schemas/multiplayer.ts — Zod schemas for multiplayer payloads"
  - "packages/game-engine/src/multiplayer/state-sync.ts — delta-based state synchronization with interpolation"
  - "packages/game-engine/src/multiplayer/opponent-renderer.ts — renders opponent as NPC with interpolation"
  - "packages/game-engine/src/multiplayer/network-manager.ts — connection lifecycle, reconnection, latency"
  - "packages/game-engine/src/multiplayer/bot-controller.ts — AI bot using existing role systems"
  - "packages/game-engine/src/multiplayer/spectator-mode.ts — read-only state subscription"
  - "apps/web/src/app/game/lobby/page.tsx — create/join lobby, role selection, settings"
  - "apps/web/src/components/app/game/lobby/LobbyRoom.tsx — lobby room UI"
  - "apps/web/src/components/app/game/lobby/PlayerSlot.tsx — player slot display"
  - "apps/web/src/components/app/game/lobby/GameSettings.tsx — map seed, biome, bot toggle"
  - "apps/web/src/components/app/game/lobby/MatchmakingSpinner.tsx — matchmaking wait state"
  - "apps/web/src/dal/multiplayer/sessions.ts — createSession, joinSession, getActiveSession, endSession"
  - "apps/web/src/dal/multiplayer/matchmaking.ts — queue-based matchmaking"
  - "apps/web/src/app/actions/multiplayer/create-game.ts — validated session creation"
  - "apps/web/src/app/actions/multiplayer/join-game.ts — validated session join"
  - "apps/web/src/app/actions/multiplayer/start-game.ts — validated game start"
  - "apps/web/src/app/actions/multiplayer/end-game.ts — validated game end"
  - "supabase/functions/validate-game-event/index.ts — Edge Function for server-side event validation"
  - "apps/web/src/stores/multiplayer.ts — connection state, opponent presence, lobby state"
created: 2026-03-17
last_aligned: never
---

# Vision Piece 14: Multiplayer Sync

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: persistent-progression (13)

---

## Feature Specification

> **Usage**: Copy everything below this line through the next `---` separator, then
> paste after typing `/speckit.specify `

Implement real-time multiplayer using Supabase Realtime — transforming the single-player roguelite into a competitive 1v1 asymmetric experience. The two players (killer and fed) occupy the same map but see different information: the killer's position is never sent to the fed client (only the evidence trail reveals them). The core multiplayer challenge is that the opponent renders as an NPC — preserving the game's social deduction mechanic. A bot controller provides single-player experience with the same systems. An optional spectator mode allows observers after the game ends.

### Core Multiplayer Design Principle

The opponent is rendered using the NPC sprite system (piece 06). The fed player's client receives only the opponent's **aggregated effect on the game world** (evidence generated, NPC states changed) — not the opponent's position. The killer player's client similarly does not receive the fed's exact scan locations. This is enforced architecturally: the sync payload for killer → fed carries only evidence state and NPC witness state changes, never raw player position. The fed → killer sync carries only fed ability triggers (area lockdown, entrapment), never the fed's exact location.

Position data IS synced for rendering purposes but only after an in-game reveal condition is met (e.g., killer enters fed's line-of-sight by failing a stealth check, or fed announces an arrest attempt). Until then, both players experience the tension of knowing the opponent is somewhere on the map.

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
type DatabaseError = AppError & { code: 'DATABASE_ERROR' };
type NotFoundError = AppError & { code: 'NOT_FOUND' };
type UnauthorizedError = AppError & { code: 'UNAUTHORIZED' };
```

#### From packages/shared/src/types/player.ts (piece 07)
```typescript
type PlayerRole = 'KILLER' | 'FED'
```

#### From packages/shared/src/types/run.ts (piece 07)
```typescript
interface RunConfig { seed: string; biome: Biome; role: PlayerRole; loadout: Loadout }
interface RunResult { outcome: 'WIN' | 'LOSE'; score: number; durationSeconds: number; materialsEarned: Record<string, number> }
```

#### From packages/game-engine/src/run/run-manager.ts (piece 07)
```typescript
// Multiplayer extends run initialization:
initializeMultiplayerRun(config: RunConfig, isHost: boolean, opponentUserId: ID): void
```

#### From packages/game-engine/src/world/map-generator.ts (piece 05)
```typescript
// Seed-based generation ensures both clients produce identical world:
generateMap(seed: string, biome: Biome): MapData
// Same seed + biome = identical map on both clients (deterministic)
```

#### From packages/game-engine/src/entities/npc.ts (piece 06)
```typescript
// NPCs run from shared seed — both clients generate identical NPC routines:
class NPC { role: NPCRole; behavior: NPCBehavior; isSilenced: boolean; hasWitnessedEvent: boolean }
```

#### From packages/game-engine/src/entities/sprite-manager.ts (piece 06)
```typescript
// Opponent rendered using same sprites as NPCs:
loadCharacterSprite(config: SpriteConfig): Phaser.GameObjects.Sprite
```

#### From packages/game-engine/src/ai/behavior-tree.ts (piece 06)
```typescript
// Bot controller reuses NPC behavior tree structure:
class BehaviorTree { tick(context: BehaviorContext): NodeResult }
```

#### From packages/shared/src/types/evidence.ts (piece 09)
```typescript
type EvidenceType =
  | 'FOOTPRINT'
  | 'DNA'
  | 'WEAPON_TRACE'
  | 'BODY'
  | 'WITNESS'
  | 'SURVEILLANCE'
  | 'BROKEN_LOCK'
  | 'DISTURBED_SCENE'
  | 'FALSE_EVIDENCE'
  | 'INFORMANT_REPORT'

type EvidenceState = 'HIDDEN' | 'DISCOVERABLE' | 'DISCOVERED' | 'DESTROYED' | 'DISCREDITED'

type Evidence = { id: ID; type: EvidenceType; state: EvidenceState; pos: { x: number; y: number }; zoneId: ID; isFalse: boolean }
```

#### From packages/game-engine/src/evidence/evidence-manager.ts (piece 09)
```typescript
// Server-side evidence state is authoritative in multiplayer:
getFullEvidenceState(): Evidence[]
syncRemoteEvidenceUpdate(update: EvidenceStateUpdate): void
```

#### From packages/shared/src/types/killer.ts (piece 10)
```typescript
type KillerAbilityId =
  | 'FAKE_EVIDENCE_PLANT'
  | 'DECOY_TRAIL'
  | 'WITNESS_INTIMIDATION'
  | 'SURVEILLANCE_JAMMING'
  | 'FALSE_ALIBI_CONSTRUCTION'
```

#### From packages/shared/src/types/fed.ts (piece 11)
```typescript
type CounterPlayAbility =
  | 'ILLEGAL_SURVEILLANCE'
  | 'ROUGH_INTERROGATION'
  | 'PLANTED_INFORMANT'
  | 'ENTRAPMENT_SETUP'
  | 'OFFBOOKS_FORENSICS'

type ArrestCondition = 'INSUFFICIENT' | 'WEAK' | 'MODERATE' | 'STRONG' | 'AIRTIGHT'
```

#### From packages/shared/src/types/progression.ts (piece 13)
```typescript
interface Loadout { id: ID; userId: ID; role: 'KILLER' | 'FED'; trophyId: ID | null; equipmentIds: ID[] }
```

#### From apps/web/src/dal/runs/history.ts (piece 12)
```typescript
saveRunResult(userId: string, input: SaveRunInput): Promise<Result<RunHistoryDTO, DatabaseError>>;
```

#### From apps/web/src/lib/supabase/client.ts (piece 02)
```typescript
createBrowserClient(): SupabaseClient
```

#### From apps/web/src/lib/supabase/server.ts (piece 02)
```typescript
createServerClient(): SupabaseClient
```

#### From apps/web/src/lib/logger/pino.ts (piece 01)
```typescript
import logger from '@/lib/logger/pino';
```

#### From apps/web/src/components/app/common/ (piece 03)
```typescript
AppButton, AppCard, AppDialog, AppToast
PageLayout
```

#### From packages/shared/src/types/auth.ts (piece 02)
```typescript
interface User { id: ID; email: string }
interface UserProfile { id: ID; displayName: string; avatarUrl: string | null }
```

### Database Schema

**`supabase/migrations/XXX_multiplayer.sql`**:

```sql
CREATE TABLE game_sessions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'LOBBY'
    CHECK (status IN ('LOBBY', 'STARTING', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED')),
  map_seed          TEXT NOT NULL,
  biome             TEXT NOT NULL,
  host_role         TEXT NOT NULL CHECK (host_role IN ('KILLER', 'FED')),
  guest_role        TEXT,            -- NULL until guest joins
  -- guest_role is always the opposite of host_role (enforced by join-game action)
  spectators_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at        TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ
);

CREATE INDEX idx_game_sessions_host    ON game_sessions(host_user_id);
CREATE INDEX idx_game_sessions_guest   ON game_sessions(guest_user_id);
CREATE INDEX idx_game_sessions_status  ON game_sessions(status);

-- Authoritative event log (anti-cheat)
CREATE TABLE game_events (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id       UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type       TEXT NOT NULL,
  event_data       JSONB NOT NULL DEFAULT '{}',
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  sequence_number  BIGINT NOT NULL  -- monotonically increasing per session, for ordering
);

CREATE INDEX idx_game_events_session   ON game_events(session_id, sequence_number);
CREATE INDEX idx_game_events_user      ON game_events(user_id);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events   ENABLE ROW LEVEL SECURITY;

-- Session read: participants only (host or guest)
CREATE POLICY "game_sessions_select_participant"
  ON game_sessions FOR SELECT
  USING (auth.uid() = host_user_id OR auth.uid() = guest_user_id);

-- Session insert: authenticated users (own host_user_id)
CREATE POLICY "game_sessions_insert_own"
  ON game_sessions FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

-- Session update: host only (for status, started_at, ended_at)
CREATE POLICY "game_sessions_update_host"
  ON game_sessions FOR UPDATE
  USING (auth.uid() = host_user_id);

-- Events read: session participants
CREATE POLICY "game_events_select_participant"
  ON game_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions gs
      WHERE gs.id = session_id
        AND (gs.host_user_id = auth.uid() OR gs.guest_user_id = auth.uid())
    )
  );

-- Events insert: session participants (client-reported events, validated by Edge Function)
CREATE POLICY "game_events_insert_participant"
  ON game_events FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM game_sessions gs
      WHERE gs.id = session_id
        AND (gs.host_user_id = auth.uid() OR gs.guest_user_id = auth.uid())
        AND gs.status = 'IN_PROGRESS'
    )
  );
```

### New Types to Create

**`packages/shared/src/types/multiplayer.ts`**:

```typescript
import { ID, Timestamp } from './common';

export type SessionStatus = 'LOBBY' | 'STARTING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export interface GameSession {
  id: ID;
  hostUserId: ID;
  guestUserId: ID | null;
  status: SessionStatus;
  mapSeed: string;
  biome: string;
  hostRole: 'KILLER' | 'FED';
  guestRole: 'KILLER' | 'FED' | null;
  spectatorsAllowed: boolean;
  createdAt: Timestamp;
  startedAt: Timestamp | null;
  endedAt: Timestamp | null;
}

export interface LobbyState {
  session: GameSession;
  hostProfile: { userId: ID; displayName: string; avatarUrl: string | null };
  guestProfile: { userId: ID; displayName: string; avatarUrl: string | null } | null;
  hostLoadout: LoadoutSummary | null;
  guestLoadout: LoadoutSummary | null;
  botEnabled: boolean;
}

export interface LoadoutSummary {
  trophyName: string | null;
  equipmentNames: string[];
  hasCounterPlayAbilities: boolean;   // display warning/info that player has counter-play
}

// Supabase Broadcast payloads — sent over Realtime channel
export type SyncPayload =
  | { type: 'EVIDENCE_UPDATE'; data: EvidenceSyncData }
  | { type: 'NPC_STATE_UPDATE'; data: NPCStateSyncData }
  | { type: 'ABILITY_TRIGGERED'; data: AbilitySyncData }
  | { type: 'REVEAL'; data: RevealSyncData }          // position reveal on detect
  | { type: 'GAME_OVER'; data: GameOverSyncData };

export interface EvidenceSyncData {
  evidenceId: ID;
  newState: 'DISCOVERABLE' | 'DISCOVERED' | 'DESTROYED' | 'PLANTED';
  location?: { zoneId: ID; x: number; y: number };    // included on creation
}

export interface NPCStateSyncData {
  npcId: ID;
  isSilenced?: boolean;
  hasWitnessedEvent?: boolean;
  isDead?: boolean;
}

export interface AbilitySyncData {
  abilityId: string;
  userId: ID;
  targetZoneId?: ID;    // for area-effect abilities (lockdown, surveillance jam, entrapment)
  // NEVER includes player position for killer abilities to fed, or fed scan location to killer
}

export interface RevealSyncData {
  revealedUserId: ID;
  position: { x: number; y: number };
  reason: 'STEALTH_FAILED' | 'ARREST_ANNOUNCED' | 'COMBAT_INITIATED';
  durationMs: number;     // how long position is revealed before re-hidden
}

export interface GameOverSyncData {
  outcome: 'KILLER_WIN' | 'FED_WIN';
  winnerUserId: ID;
  finalScore: { killer: number; fed: number };
}

export interface PlayerPresence {
  userId: ID;
  displayName: string;
  role: 'KILLER' | 'FED';
  status: 'IN_LOBBY' | 'IN_GAME' | 'DISCONNECTED';
  lastSeen: Timestamp;
}

export interface GameEvent {
  id: ID;
  sessionId: ID;
  userId: ID;
  eventType: string;
  eventData: Record<string, unknown>;
  serverTimestamp: Timestamp;
  sequenceNumber: number;
}

export interface MatchmakingRequest {
  userId: ID;
  preferredRole: 'KILLER' | 'FED' | 'ANY';
  biomePreference: string | null;
  requestedAt: Timestamp;
}
```

### Supabase Realtime Architecture

**Channel structure**:

Each game session uses one Supabase Realtime Broadcast channel:
- Channel name: `game-session-{sessionId}`
- Both players subscribe on game start
- Spectators subscribe as read-only (Presence only, no Broadcast send)

**Three Realtime primitives used**:

1. **Broadcast** — low-latency game state sync (no persistence)
   - Used for: `EVIDENCE_UPDATE`, `NPC_STATE_UPDATE`, `ABILITY_TRIGGERED`, `REVEAL`
   - Fire-and-forget, up to 200ms latency acceptable (social deduction not twitch-reflex)
   - Never sent to database — ephemeral by design

2. **Presence** — player online status and lobby state
   - Used for: player join/leave, connection status, lobby ready state
   - Presence state per user: `PlayerPresence` object
   - Both lobby and in-game phases use Presence

3. **Database Realtime** (Postgres Changes) — authoritative state
   - Used for: `game_sessions` status changes (LOBBY → IN_PROGRESS → COMPLETED)
   - Both clients subscribe to `game_sessions` change for their session ID
   - Ensures both clients see authoritative game lifecycle transitions

**`apps/web/src/lib/supabase/realtime.ts`**:

```typescript
import { createBrowserClient } from '@/lib/supabase/client';
import type { SyncPayload, PlayerPresence } from '@repo/shared/src/types/multiplayer';

export class RealtimeService {
  private channel: ReturnType<SupabaseClient['channel']> | null = null;

  subscribe(sessionId: string, userId: string, handlers: RealtimeHandlers): void;
  broadcast(payload: SyncPayload): void;
  updatePresence(state: PlayerPresence): void;
  disconnect(): void;

  // Internal: channel cleanup, reconnection with exponential backoff
}

export interface RealtimeHandlers {
  onBroadcast: (payload: SyncPayload) => void;
  onPresenceSync: (presences: PlayerPresence[]) => void;
  onSessionStatusChange: (newStatus: SessionStatus) => void;
  onDisconnect: () => void;
  onReconnect: () => void;
}
```

### State Sync Engine

**`packages/game-engine/src/multiplayer/state-sync.ts`**

Manages what to send, when to send it, and how to apply received updates.

**Delta-only principle**: Only changed state is broadcast. A full state snapshot is sent once when the game starts; subsequent messages are deltas.

**What killer sends to fed** (via `EVIDENCE_UPDATE` and `NPC_STATE_UPDATE`):
- When killer creates evidence: `EVIDENCE_UPDATE { newState: DISCOVERABLE, location }`
- When killer destroys evidence: `EVIDENCE_UPDATE { newState: DESTROYED }`
- When killer plants fake evidence: `EVIDENCE_UPDATE { newState: PLANTED, location }` (fed receives same as real)
- When killer silences witness: `NPC_STATE_UPDATE { npcId, isSilenced: true }`
- When killer uses `SURVEILLANCE_JAMMING`: `ABILITY_TRIGGERED { abilityId: 'SURVEILLANCE_JAMMING', targetZoneId }`
- When killer uses `ENTRAPMENT_SETUP` response (moves toward decoy): this is the entrapment trigger — killer's position is revealed temporarily via `REVEAL` payload

**What killer position reveals to fed**:
- NEVER sent proactively (evidence trail only)
- Sent via `REVEAL` with `reason: STEALTH_FAILED` when NPC stealth detection fires
- Sent via `REVEAL` with `reason: COMBAT_INITIATED` when arrest combat starts
- Reveal duration: 3000ms (3 seconds of visible position) then hidden again

**What fed sends to killer** (via `ABILITY_TRIGGERED`):
- When fed activates `AREA_LOCKDOWN`: `ABILITY_TRIGGERED { abilityId: 'AREA_LOCKDOWN', targetZoneId }` — killer sees warning
- When fed activates `ENTRAPMENT_SETUP`: `ABILITY_TRIGGERED { abilityId: 'ENTRAPMENT_SETUP', targetZoneId }` — killer can observe and avoid if alert
- When fed announces arrest: `REVEAL { reason: ARREST_ANNOUNCED }` — fed's position briefly revealed (risky play)
- Fed scan locations: NEVER sent to killer (information asymmetry maintained)
- Fed counter-play ability use: NEVER sent to killer (illegal surveillance, rough interrogation are hidden)

**Sync tick rate**: 100ms (10Hz) for position reveals, 0ms (event-driven) for state changes. Position reveals are the only time-based sync; all other state changes are event-driven (fire on action, not on timer).

### Opponent Renderer

**`packages/game-engine/src/multiplayer/opponent-renderer.ts`**

Renders the opponent using the exact same NPC sprite system (piece 06). Key requirement: the opponent is visually indistinguishable from regular NPCs until detected.

```typescript
class OpponentRenderer {
  private opponentSprite: Phaser.GameObjects.Sprite;
  private lastKnownPosition: { x: number; y: number } | null;
  private isRevealed: boolean;
  private revealExpiresAt: number;    // game timestamp

  // Called when REVEAL sync payload received:
  revealOpponent(position: { x: number; y: number }, durationMs: number): void;

  // Called every frame (if revealed, interpolate to last position):
  update(deltaMs: number): void;

  // Called when reveal expires — opponent sprite continues moving as NPC routine:
  onRevealExpired(): void;
}
```

When NOT revealed, the opponent sprite is still on screen — it moves with a normal NPC routine (behavior tree AI running locally). This creates the tension: one of these NPCs moving around you is the human player. The opponent's NPC is seeded from the run seed so both clients agree on which NPC ID represents the opponent.

When revealed (3-second window), the opponent sprite gets a subtle highlight effect (not a bright indicator — maintaining immersion) and their name badge briefly appears. After reveal expires, they blend back into NPC crowd.

### Network Manager

**`packages/game-engine/src/multiplayer/network-manager.ts`**

```typescript
class NetworkManager {
  private latencyMs: number;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;   // 5
  private reconnectBackoffMs: number;     // 1000 → 2000 → 4000 → 8000 → 16000

  measureLatency(): void;                 // ping/pong on Realtime channel
  handleDisconnect(): void;               // start reconnection loop
  handleReconnect(sessionId: string): void;
  isConnected(): boolean;
  getLatencyMs(): number;
}
```

**Disconnect handling**:
- Grace period: 30 seconds before declaring opponent disconnected
- During grace period: bot controller takes over opponent's role seamlessly
- If reconnected within grace period: bot controller hands back to remote player
- If not reconnected: bot continues for remainder of run
- Session status updated to `IN_PROGRESS` (not `ABANDONED`) during bot takeover — run continues

**Lag compensation**: Evidence state changes are authoritative (event-based, not time-based). Position reveals use a simple 100ms interpolation buffer — last known position interpolated toward revealed position over receive time. No dead reckoning required (position not continuously synced).

### Bot Controller

**`packages/game-engine/src/multiplayer/bot-controller.ts`**

Provides an AI-controlled opponent for single-player mode or disconnect fallback. Reuses all existing role systems — bot is identical to human player except input comes from behavior tree instead of keyboard.

```typescript
class BotController {
  private role: PlayerRole;
  private behaviorTree: BehaviorTree;
  private difficulty: 'EASY' | 'NORMAL' | 'HARD';

  initialize(role: PlayerRole, difficulty: 'EASY' | 'NORMAL' | 'HARD'): void;
  tick(deltaMs: number, gameState: GameStateContext): void;   // runs each frame
  getNextAction(): PlayerAction | null;
  setDifficulty(difficulty: 'EASY' | 'NORMAL' | 'HARD'): void;
}
```

**Bot behavior trees** (role-specific):

Killer bot:
- Identify closest target in map → approach using pathfinding → execute kill method → dispose body → evade fed vicinity → repeat
- Uses `killer-role.ts` ability system with simulated cooldown management
- Evidence cleanup probability scales with difficulty: EASY 40%, NORMAL 70%, HARD 95%

Fed bot:
- Move to highest-evidence-density zone → scan → examine evidence → interview witnesses → update suspect list → if viability >60 and top suspect identified → make arrest
- Uses `fed-role.ts` investigation pipeline
- Counter-play ability use: EASY never uses counter-play, NORMAL uses tier-1 only, HARD uses up to tier-2

Bot plays at fixed difficulty in single-player mode. In multiplayer disconnect fallback, bot inherits the disconnected player's loaded progression effects and plays at NORMAL difficulty.

### Lobby System

**`apps/web/src/app/game/lobby/page.tsx`** — Client Component (needs Realtime subscription)

Two modes:
- **Create Game**: Generate session with map seed (random or manual), biome selection, role selection, bot toggle, spectators allowed toggle. Generates and displays a 6-character join code.
- **Join Game**: Enter join code → validates session exists and is in LOBBY status → join as guest role (opposite of host).

**Join code implementation**: The join code is a short human-readable representation of the session ID (first 6 characters of UUID, uppercased). Validated by querying `game_sessions WHERE id LIKE joinCode%`.

**Lobby flow**:
1. Host creates session → Realtime Presence channel opens → host's `PlayerPresence` emitted
2. Guest joins with code → guest's Presence emitted → LobbyRoom.tsx renders both players
3. Both players see each other's profile, role, loadout summary (including counter-play indicator if any)
4. Host presses "Start Game" when both players ready → `start-game` Server Action fires → session status → `STARTING`
5. Both clients receive database change event → redirect to game with shared RunConfig
6. If bot enabled and no guest joins within 60s: bot takes over guest slot automatically

**`apps/web/src/components/app/game/lobby/LobbyRoom.tsx`**:
- Two PlayerSlot components (host + guest)
- GameSettings panel (biome, bot toggle, spectators)
- "Ready" toggle per player
- "Start Game" button (host only, enabled when both ready OR bot enabled)
- Session join code display with copy button

### Matchmaking

**`apps/web/src/dal/multiplayer/matchmaking.ts`**

Simple queue-based matchmaking — no skill-based matching at this stage.

```typescript
export interface MatchmakingEntry {
  userId: ID;
  preferredRole: 'KILLER' | 'FED' | 'ANY';
  sessionId: ID | null;   // set when match found
  createdAt: Timestamp;
}

export async function joinMatchmakingQueue(
  userId: string,
  preferredRole: 'KILLER' | 'FED' | 'ANY'
): Promise<Result<MatchmakingEntry, DatabaseError>>;

export async function pollForMatch(
  userId: string
): Promise<Result<{ sessionId: ID } | null, DatabaseError>>;

export async function leaveQueue(userId: string): Promise<Result<void, DatabaseError>>;
```

Matchmaking logic: When a user joins with `preferredRole: KILLER`, the system searches for an existing LOBBY session with `host_role: FED` (or a queue entry with `preferredRole: FED` or `ANY`). If found: auto-joins that session. If not found: creates a new LOBBY session and waits.

The matchmaking table is not defined in the migration — it uses `game_sessions` with status `LOBBY` as the queue. Query: `SELECT * FROM game_sessions WHERE status = 'LOBBY' AND guest_user_id IS NULL AND host_role != desiredRole LIMIT 1`.

### Server Actions

**`apps/web/src/app/actions/multiplayer/create-game.ts`**:

Validates: authenticated, no active session for user, biome valid, role valid. Creates `game_sessions` row. Generates `map_seed` server-side (random UUID). Returns session ID.

**`apps/web/src/app/actions/multiplayer/join-game.ts`**:

Validates: session exists, status is LOBBY, no guest yet, user not the host, guest role is automatically assigned as opposite of host role. Updates `game_sessions.guest_user_id` and `guest_role`.

**`apps/web/src/app/actions/multiplayer/start-game.ts`**:

Validates: caller is host, session in LOBBY status, either guest joined or bot enabled. Updates status to `STARTING` → `IN_PROGRESS`. Sets `started_at`. Returns full `RunConfig` (seed, biome, roles, both loadout summaries).

**`apps/web/src/app/actions/multiplayer/end-game.ts`**:

Validates: session in IN_PROGRESS, caller is participant. Sets `ended_at`, status to COMPLETED. Triggers `saveRunResult` for both players. Called by either player when game-over condition fires.

### Edge Function: Anti-Cheat

**`supabase/functions/validate-game-event/index.ts`**

Called by the client before logging significant game events (kills, arrests, major evidence discoveries) to `game_events` table. Validates that the claimed action is plausible given the authoritative server-side game state snapshot.

```typescript
// Invoked via Supabase Edge Functions HTTP call from client
interface ValidationRequest {
  sessionId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  clientTimestamp: string;
}

interface ValidationResponse {
  valid: boolean;
  reason?: string;       // only present if invalid
  serverSequenceNumber?: number;  // included if valid, for game_events insert
}
```

**Validations implemented**:
- Kill event: `sequenceNumber > lastKillSequence + MIN_GAP` (cannot kill faster than 10 seconds apart)
- Arrest event: `evidenceCount >= MIN_EVIDENCE_FOR_ARREST` (server checks evidence state)
- Evidence creation: event timestamp within plausible range of server timestamp (<5s delta)
- Score claims: client-reported score plausibility check (max 50 points/second)

Events failing validation are logged with `valid: false` but game continues — invalid events are excluded from run results calculation.

### Spectator Mode

**`packages/game-engine/src/multiplayer/spectator-mode.ts`**

Available after game ends (post-game replay) or optionally during game if `session.spectatorsAllowed = true`.

```typescript
class SpectatorMode {
  private viewMode: 'BOTH_ROLES' | 'KILLER_ONLY' | 'FED_ONLY' | 'HIDDEN';

  subscribe(sessionId: string): void;    // read-only Realtime subscription
  setViewMode(mode: SpectatorViewMode): void;
  // BOTH_ROLES: see all evidence, both positions
  // KILLER_ONLY: see killer's perspective (stealth meter, evidence visible)
  // FED_ONLY: see fed's perspective (evidence as fed sees it)
  // HIDDEN: see neither player's special info (just the world)
}
```

Spectator subscribe to the same Realtime channel in receive-only mode. They receive ALL sync payloads (both killer→fed and fed→killer), giving them full game visibility. Camera controls (pan, zoom) are free-form with no follow constraint.

### Zustand Store

**`apps/web/src/stores/multiplayer.ts`**:

```typescript
interface MultiplayerStore {
  sessionId: ID | null;
  session: GameSession | null;
  connectionStatus: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';
  opponentPresence: PlayerPresence | null;
  latencyMs: number;
  isBot: boolean;
  lobbyState: LobbyState | null;
  isSpectator: boolean;

  // Actions
  setSession: (session: GameSession) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setOpponentPresence: (presence: PlayerPresence | null) => void;
  setLatency: (ms: number) => void;
  setIsBot: (isBot: boolean) => void;
  setLobbyState: (state: LobbyState) => void;
  reset: () => void;
}
```

### EventBus Integration

Multiplayer system listens to existing EventBus events and converts them to Broadcast payloads:
- `killer:evidence-destroyed` → broadcasts `EVIDENCE_UPDATE { newState: DESTROYED }`
- `killer:target-eliminated` + `npcId` → broadcasts `NPC_STATE_UPDATE { isDead: true }`
- `fed:witness-interviewed` (when fed uses `WITNESS_COMPULSION` ability in zone) → NOT broadcast (fed's location hidden)
- `fed:arrest-attempted` → broadcasts `REVEAL { reason: ARREST_ANNOUNCED }` — fed announces themselves

EventBus events to receive from Realtime Broadcast and apply locally:
- `EVIDENCE_UPDATE` → call `evidence-manager.ts syncRemoteEvidenceUpdate()`
- `NPC_STATE_UPDATE` → update NPC state on local map
- `ABILITY_TRIGGERED` (for area abilities) → apply area effect (lockdown, entrapment visual)
- `REVEAL` → `opponent-renderer.ts revealOpponent()`
- `GAME_OVER` → end run on both clients simultaneously

### Edge Cases

- **Map seed collision**: If two lobby sessions somehow have same seed: sessions use `session_id` as secondary seed component. Both clients use `seed = mapSeed + sessionId.slice(0, 8)` for all deterministic generation. This guarantees per-session uniqueness.
- **Simultaneous kill + arrest**: If killer eliminates last target and fed arrests killer in the same ~200ms window: server Edge Function adjudicates via sequence numbers. Whichever `game_events` entry has lower `sequence_number` wins. Both clients receive `GAME_OVER` with winner determined by server sequence.
- **Disconnect during active counter-play**: If killer disconnects while `SURVEILLANCE_JAMMING` is active, bot inherits the ability's remaining cooldown state. The zone remains jammed until timer expires (no rollback).
- **False alibi in multiplayer**: Fake NPC witness statement from killer (`FALSE_ALIBI` ability) syncs as `NPC_STATE_UPDATE` — the NPC's witness statement content is part of the sync, not just the state change. Fed client receives the fabricated statement as a normal witness record.
- **Illegal surveillance reveal**: Fed's `ILLEGAL_SURVEILLANCE` camera access is NOT broadcast to killer client — killer only knows cameras are active (evidence from camera feeds still visible). The fact that the fed is using illegal methods is hidden (matches the covert nature of counter-play).
- **Bot counter-play**: In single-player mode, bot killer uses `FAKE_EVIDENCE_PLACEMENT` at HARD difficulty (60% chance per kill). Bot fed uses `ROUGH_INTERROGATION` at HARD difficulty when a witness is silenced. This ensures counter-play systems are exercised and tested even in single-player.
- **Spectator fog of war**: Default spectator view is `BOTH_ROLES` — sees all. This is intentional for post-game analysis. If `spectatorsAllowed = true` during live game, consider `HIDDEN` as default for live spectators to prevent stream sniping.

---

## Planning Guidance

> **Usage**: Copy everything below this line through the next `---` separator, then
> paste after typing `/speckit.plan `

### Architecture Approach

Use Supabase Broadcast for low-latency game state changes (evidence, NPC state, ability triggers). Use Supabase Presence for lobby and connection status. Use Supabase Database Realtime for authoritative session lifecycle changes. Database writes (`game_events`) happen only for significant authoritative events — not every frame sync.

The shared-seed determinism principle means both clients run identical world generation, NPC AI, and shop offerings from the same seed. The only information that crosses the network is the delta caused by human actions and the results of those actions on shared world state.

### Key Implementation Decisions

- Opponent position is NOT continuously synced — only revealed on specific events (stealth fail, arrest announce). This is fundamental to the game's identity.
- Bot controller reuses ALL role systems (killer-role.ts, fed-role.ts, ability-system.ts) — no parallel implementation
- Anti-cheat is best-effort at this stage (Edge Function validates plausibility, not perfect) — full anti-cheat requires server-authoritative game loop which is out of scope
- Matchmaking is dead-simple (no Elo, no skill rating) — find any opponent wanting opposite role
- Reconnect grace period (30s) with bot fallback is better UX than immediate disconnect penalty
- Counter-play abilities are broadcast selectively: area effects that the killer must react to (lockdown, entrapment) are synced; covert abilities (illegal surveillance, rough interrogation) are not

### Testing Strategy

- Unit test `state-sync.ts`: verify killer→fed payload excludes player position until reveal condition
- Unit test `opponent-renderer.ts`: reveal/hide cycle renders correctly, sprite blends back to NPC
- Unit test `network-manager.ts`: reconnect backoff sequence correct (1s, 2s, 4s, 8s, 16s)
- Unit test `bot-controller.ts`: EASY bot never uses counter-play, HARD bot uses evidence cleanup 95%
- Integration test: two browser clients, join same session, evidence generated by client A appears on client B
- Integration test: disconnect simulation — bot takes over within grace period, reconnect hands back to human
- Integration test: simultaneous game-over conditions — verify server sequence number adjudicates correctly
- E2E (Playwright): full lobby → game → win → results for two browser tabs

### Constitution Compliance Checklist

- [x] I: No barrel files — direct imports throughout
- [x] VII: Explicit client/server boundaries — RealtimeService is client-only, DAL is server-only
- [x] XII: DAL for all DB access — sessions and events through DAL
- [x] XIII: Server Actions — game lifecycle (create/join/start/end) through Server Actions
- [x] XIV: EventBus for signals — multiplayer uses EventBus to translate between Phaser and Realtime
- [x] XVI: Zero-trust — killer position never in fed client payload; validated server-side
- [x] XIX: Input validation — all server actions and Edge Function validate inputs with Zod
- [x] XXII: Content Security Policy — Supabase Realtime WebSocket origin must be in CSP connect-src

---

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

When this piece is fully implemented:
- Lobby page functional: create game, join by code, bot fallback
- Two players can play a full 1v1 game with evidence sync and NPC state sync
- Opponent renders as NPC until reveal conditions (stealth fail, arrest announce)
- Bot controller provides competent single-player opponent
- Disconnect handling with 30-second bot grace period
- Post-game spectator mode available

### Dependencies (Consumed from Earlier Pieces)

This piece depends on ALL prior pieces being complete:
- Progression (piece 13): loadout data for both players at game start
- Session economy (piece 12): run results saved for both players at game end
- Both role systems (pieces 10-11): all gameplay systems that generate sync events
- Evidence system (piece 09): evidence state that syncs between players
- NPC system (piece 06): opponent renders as NPC
- World/maps (piece 05): shared seed map generation
- Auth (piece 02): user authentication for lobby

### Success Criteria

- [ ] Lobby creates game with host role selection and join code generation
- [ ] Guest joins by code and receives opposite role automatically
- [ ] Both clients receive identical RunConfig (same seed, same biome, both loadouts)
- [ ] Evidence generated by killer client appears on fed client within 200ms
- [ ] Opponent renders as NPC; position not revealed unless reveal condition fires
- [ ] 3-second reveal window on stealth fail, then blends back to NPC
- [ ] Disconnect triggers bot takeover within grace period; reconnect restores human control
- [ ] Anti-cheat Edge Function validates kill events and rejects impossible sequences
- [ ] Game-over condition fires on both clients simultaneously (within 500ms)
- [ ] Spectator mode available post-game with all-roles view

### Alignment Notes

This piece's sync payload design must be carefully aligned with the counter-play systems from pieces 10-11. The principle is: counter-play abilities that affect the shared world (fake evidence, NPC silencing, zone lockdown) must sync. Counter-play abilities that are informational/investigative (illegal surveillance, off-books forensics) must NOT sync — they are the investigator's private tools. Getting this boundary wrong would either break the game's information asymmetry or leave the opponent's client in an incorrect state.
