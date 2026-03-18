---
vision: killer-vs-fed-roguelite
sequence: 14
name: multiplayer-sync
group: Multiplayer
group_order: 6
status: pending
depends_on:
  - "13: Loadout type for session creation and loadout-aware matchmaking"
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

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Implement real-time multiplayer using Supabase Realtime — transforming the single-player roguelite into a competitive 1v1 asymmetric experience. The two players (killer and fed) occupy the same map but see different information: the killer's position is never sent to the fed client (only the evidence trail reveals them). The core multiplayer challenge is that the opponent renders as an NPC — preserving the game's social deduction mechanic. A bot controller provides single-player experience with the same systems. An optional spectator mode allows observers after the game ends.

### Core Multiplayer Design Principle

The opponent is rendered using the NPC sprite system from piece 06. The fed player's client receives only the opponent's aggregated effect on the game world — evidence generated and NPC state changes — not the opponent's raw position. The killer player's client similarly does not receive the fed's exact scan locations. This is enforced architecturally: the information flowing from killer to fed carries only evidence state and NPC witness state changes, never raw player position. The information flowing from fed to killer carries only fed ability triggers for area effects, never the fed's exact location.

Position data is only shared after an in-game reveal condition fires — for example, when the killer fails a stealth check near an NPC or when the fed announces an arrest attempt. Until then, both players experience the tension of knowing the opponent is somewhere on the map.

### Dependency Overview

This piece depends on all prior pieces being complete:

- **Common identifiers (piece 01)**: String UUID identifiers and ISO 8601 timestamps. Error types for database, not-found, and unauthorized errors.
- **Supabase clients (piece 02)**: Browser-side Supabase client for Realtime subscriptions in lobby and game. Server-side client for DAL and Server Actions.
- **User and profile (piece 02)**: Authenticated user ID and display name used in lobby presence and player slot display.
- **Design system (piece 03)**: Standard UI components for lobby and matchmaking screens.
- **Logging (piece 01)**: Structured logger for connection events and error handling.
- **World generation (piece 05)**: Seed-based deterministic map generation — the same seed and biome produces identical maps on both clients. Both clients run generation locally; only the seed crosses the network.
- **NPC system (piece 06)**: NPCs run from the shared seed, so both clients produce identical NPC routines. The opponent is rendered using the NPC sprite system — they are visually indistinguishable from regular NPCs until a reveal condition fires. The bot controller reuses the NPC behavior tree structure.
- **Player and run framework (piece 07)**: Player role (killer or fed). Run configuration includes seed, biome, role, and loadout. Run result contains outcome, score, duration, and materials earned. The run manager exposes a multiplayer initialization hook.
- **Evidence system (piece 09)**: Evidence has types (footprint, DNA, weapon trace, body, witness, surveillance, broken lock, disturbed scene, false evidence, informant report) and states (hidden, discoverable, discovered, destroyed, discredited). The evidence manager provides the current full evidence state and can apply remote evidence updates.
- **Killer counter-play abilities (piece 10)**: The 5 killer counter-play ability IDs used in sync payloads: fake evidence plant, decoy trail, witness intimidation, surveillance jamming, false alibi construction.
- **Fed counter-play abilities (piece 11)**: The 5 fed counter-play ability IDs relevant to sync: illegal surveillance, rough interrogation, planted informant, entrapment setup, off-books forensics. Arrest condition levels: insufficient, weak, moderate, strong, airtight.
- **Loadout (piece 13)**: A loadout has an ID, user ID, role, optional trophy ID, and list of equipment IDs. Both players' loadouts are included in the game start payload.
- **Run history DAL (piece 12)**: The end-game server action calls the save-run-result function for both players when a game concludes.

### Database Tables

**Game sessions**: Tracks each multiplayer session from lobby through completion. Fields: unique ID, host user ID, guest user ID (null until someone joins), status (lobby/starting/in-progress/completed/abandoned), map seed (generated server-side), biome, host role (killer or fed), guest role (always the opposite of host role, null until guest joins), spectators allowed flag, creation timestamp, start timestamp (null until started), and end timestamp (null until ended). Indexed by host user, guest user, and status for matchmaking queries.

**Game events**: Authoritative event log for anti-cheat. Each row records a significant in-game action (kill, arrest, major evidence discovery). Fields: unique ID, session ID, reporting user ID, event type, event payload (flexible JSON), server timestamp (set by server, not client), and monotonically-increasing sequence number per session for ordering. Indexed by session and sequence number for chronological replay, and by user for audit purposes.

**Row-level security**: Game sessions are readable only by their host and guest users. The host can insert and update sessions. Game events are readable by session participants; insertable by authenticated users who are active participants in an in-progress session (validated by the Edge Function before final persistence).

### New Data Entities

**Session status**: A session progresses through five states — lobby (players joining), starting (game initializing), in-progress (game running), completed (game finished normally), abandoned (ended early or both disconnected).

**Game session**: Represents one multiplayer session. Fields: unique ID, host user ID, guest user ID (null before someone joins), current status, map seed string, biome, host role, guest role (always opposite of host, null until guest joins), spectators allowed flag, creation timestamp, start timestamp, end timestamp.

**Lobby state**: The full state displayed in the lobby room UI. Contains the session, host profile (user ID, display name, avatar URL), guest profile (null if no guest yet), host loadout summary, guest loadout summary, and whether a bot is enabled.

**Loadout summary**: A simplified view of a player's loadout for lobby display. Fields: trophy name (null if none equipped), list of equipment item names, and a flag indicating whether the player has counter-play abilities unlocked (to show an informational indicator to the opponent).

**Sync payload** (discriminated union): The five types of real-time broadcasts sent over the Realtime channel — evidence state update (evidence ID, new state, optional creation location), NPC state update (NPC ID, optional silenced/witnessed/dead flags), ability triggered (ability ID, user ID, optional target zone for area-effect abilities — never includes player position), reveal (revealed user ID, position coordinates, reason, duration in milliseconds), and game over (outcome, winner user ID, final scores for both roles).

**Player presence**: The state broadcast via Supabase Presence for each connected user. Fields: user ID, display name, role, current status (in-lobby/in-game/disconnected), last seen timestamp.

**Game event** (authoritative log record): Fields: unique ID, session ID, reporting user ID, event type string, event data (flexible JSON payload), server timestamp, monotonically-increasing sequence number for chronological ordering.

**Matchmaking request**: Fields: user ID, preferred role (killer/fed/any), biome preference (null for any), request timestamp.

### Supabase Realtime Architecture

**Channel structure**: Each game session uses one Supabase Realtime Broadcast channel named after the session ID. Both players subscribe on game start. Spectators subscribe in receive-only mode.

**Three Realtime primitives used**:

1. **Broadcast** — low-latency game state sync with no persistence. Used for evidence updates, NPC state updates, ability triggers, and position reveals. Fire-and-forget with up to 200ms latency acceptable (social deduction is not twitch-reflex). These messages are never written to the database — they are ephemeral by design.

2. **Presence** — player online status and lobby state. Used for player join/leave, connection status, and lobby ready state. Both lobby and in-game phases use Presence.

3. **Database Realtime (Postgres Changes)** — authoritative state changes. Used for session status transitions (lobby to in-progress to completed). Both clients subscribe to session changes for their session ID, ensuring both see authoritative game lifecycle transitions.

**Realtime service** (client-side): Manages the Supabase Realtime channel lifecycle. Responsibilities: subscribe to a session channel (sets up broadcast, presence, and database change listeners), broadcast a sync payload to the opponent, update the local player's presence state, and disconnect cleanly. Internally handles channel cleanup and reconnection with exponential backoff. Takes callback handlers for incoming broadcasts, presence syncs, session status changes, disconnections, and reconnections.

### State Sync Engine

Manages what to send, when to send it, and how to apply received updates.

**Delta-only principle**: Only changed state is broadcast. A full state snapshot is sent once when the game starts; subsequent messages are deltas.

**What killer sends to fed** (via evidence and NPC state updates):
- When killer creates evidence: evidence update with new discoverable state and location
- When killer destroys evidence: evidence update with destroyed state
- When killer plants fake evidence: evidence update with planted state and location (fed receives same as real)
- When killer silences witness: NPC state update marking that NPC as silenced
- When killer uses surveillance jamming: ability triggered with the target zone ID
- When killer triggers entrapment response (moving toward decoy): killer's position is revealed temporarily via reveal payload

**What killer position reveals to fed**:
- Never sent proactively (evidence trail only)
- Sent via reveal with reason "stealth failed" when NPC stealth detection fires
- Sent via reveal with reason "combat initiated" when arrest combat starts
- Reveal duration: 3 seconds of visible position, then hidden again

**What fed sends to killer** (via ability triggered):
- When fed activates area lockdown: ability triggered with target zone ID — killer sees warning
- When fed activates entrapment setup: ability triggered with target zone ID — killer can observe and avoid if alert
- When fed announces arrest: reveal payload with reason "arrest announced" — fed's position briefly revealed (risky play)
- Fed scan locations: never sent to killer (information asymmetry maintained)
- Fed covert counter-play abilities (illegal surveillance, rough interrogation): never sent to killer

**Sync tick rate**: 100ms (10Hz) for position reveals; event-driven (fire on action) for all other state changes. Position reveals are the only time-based sync.

### Opponent Renderer

Renders the opponent using the exact same NPC sprite system from piece 06. Key requirement: the opponent is visually indistinguishable from regular NPCs until detected.

State tracked: the opponent's sprite object, the last known position (null if not yet revealed), whether they are currently revealed, and when the reveal expires.

When not revealed, the opponent sprite continues moving with a locally-run NPC behavior tree, seeded from the run seed. Both clients agree on which NPC sprite ID represents the opponent — creating the tension that one of the NPCs on screen is a human player.

When revealed (3-second window), the opponent sprite gets a subtle highlight effect (not a bright indicator — maintaining immersion) and their name badge briefly appears. After the reveal expires, they blend back into the NPC crowd.

### Network Manager

Manages connection lifecycle, latency measurement, and reconnection. Tracks current latency, reconnect attempt count, and reconnect backoff starting at 1 second and doubling each attempt (1s → 2s → 4s → 8s → 16s), with a maximum of 5 attempts. Responsibilities: measure latency via ping/pong on the Realtime channel, initiate reconnection loop on disconnect, restore channel subscription on reconnect, expose current connection status and latency for HUD display.

**Disconnect handling**:
- Grace period: 30 seconds before declaring opponent disconnected
- During grace period: bot controller takes over opponent's role seamlessly
- If reconnected within grace period: bot controller hands back to remote player
- If not reconnected: bot continues for remainder of run
- Session status remains in-progress during bot takeover — run continues rather than ending

**Lag compensation**: Evidence state changes are authoritative (event-based, not time-based). Position reveals use a 100ms interpolation buffer — last known position interpolated toward revealed position over receive time. No dead reckoning required since position is not continuously synced.

### Bot Controller

Provides an AI-controlled opponent for single-player mode or disconnect fallback. Reuses all existing role systems — the bot is identical to a human player except input comes from a behavior tree instead of keyboard input.

The bot operates at three difficulty levels: easy, normal, and hard. In single-player mode, difficulty is fixed by user choice. In multiplayer disconnect fallback, the bot inherits the disconnected player's loaded progression effects and plays at normal difficulty.

**Killer bot behavior**: Identifies closest target, approaches using pathfinding, executes kill method, disposes body, evades fed vicinity, and repeats. Uses the killer role ability system with simulated cooldown management. Evidence cleanup probability scales with difficulty: 40% at easy, 70% at normal, 95% at hard.

**Fed bot behavior**: Moves to highest-evidence-density zone, scans, examines evidence, interviews witnesses, updates suspect list. If case viability exceeds 60% and top suspect is identified, makes arrest. Uses the fed role investigation pipeline. Counter-play ability use: easy bot never uses counter-play, normal uses tier-1 only, hard uses up to tier-2.

In single-player mode, the bot exercises counter-play systems: the killer bot uses fake evidence placement at hard difficulty (60% chance per kill), and the fed bot uses rough interrogation at hard difficulty when a witness has been silenced. This ensures counter-play systems are tested even without a human opponent.

### Lobby System

The lobby page supports two modes:
- **Create Game**: Generate session with map seed (random or manual), biome selection, role selection, bot toggle, spectators allowed toggle. Generates and displays a 6-character join code.
- **Join Game**: Enter join code, validate session exists and is in lobby status, join as guest role (opposite of host).

**Join code implementation**: The join code is a short human-readable representation of the session ID (first 6 characters of UUID, uppercased). Validated by querying game sessions where the ID starts with the join code.

**Lobby flow**:
1. Host creates session, Realtime Presence channel opens, host's presence emitted
2. Guest joins with code, guest's presence emitted, lobby room renders both players
3. Both players see each other's profile, role, and loadout summary (including counter-play indicator if any)
4. Host presses "Start Game" when both players are ready, start-game server action fires, session status moves to starting
5. Both clients receive database change event, redirect to game with shared run configuration
6. If bot is enabled and no guest joins within 60 seconds, bot takes over guest slot automatically

The lobby room component displays two player slots (host and guest), a game settings panel (biome, bot toggle, spectators), a ready toggle per player, a start game button (host only, enabled when both ready or bot enabled), and the session join code with a copy button.

### Matchmaking

Simple queue-based matchmaking — no skill-based matching at this stage.

Matchmaking logic: When a user joins preferring the killer role, the system searches for an existing lobby session with the host as a fed (or a queue entry preferring fed or any). If found, the user auto-joins that session. If not found, a new lobby session is created and the user waits. The matchmaking queue uses the game sessions table directly — sessions in lobby status with no guest serve as the queue.

### Server Actions

**Create game**: Validates the user is authenticated, has no active session, and that the biome and role are valid. Creates the game session row with a server-generated map seed. Returns the session ID.

**Join game**: Validates the session exists, is in lobby status, has no guest yet, and the user is not the host. Guest role is automatically assigned as the opposite of the host role. Updates the session with the guest user ID and role.

**Start game**: Validates the caller is the host, the session is in lobby status, and either a guest has joined or bot is enabled. Updates session status to starting then in-progress. Sets the start timestamp. Returns the full run configuration (seed, biome, roles, both loadout summaries).

**End game**: Validates the session is in-progress and the caller is a participant. Sets the end timestamp and status to completed. Triggers run result saving for both players. Called by either player when a game-over condition fires.

### Edge Function: Anti-Cheat

Called by the client before logging significant game events (kills, arrests, major evidence discoveries) to the game events table. Validates that the claimed action is plausible given the authoritative server-side game state snapshot.

The edge function receives a session ID, event type, event data payload, and client timestamp. It returns whether the event is valid and, if valid, a server-assigned sequence number for insertion into the game events table.

**Validations implemented**:
- Kill event: sequence number must be greater than last kill sequence plus a minimum gap (cannot kill faster than every 10 seconds)
- Arrest event: evidence count must meet the minimum threshold for arrest (server checks evidence state)
- Evidence creation: event timestamp must be within a plausible range of server timestamp (less than 5 seconds delta)
- Score claims: client-reported score must pass a plausibility check (maximum 50 points per second)

Events failing validation are logged with an invalid flag but the game continues — invalid events are excluded from run results calculation.

### Spectator Mode

Available after game ends (post-game replay) or optionally during game if spectators are allowed.

Spectators subscribe to the same Realtime channel in receive-only mode and receive all sync payloads (both killer-to-fed and fed-to-killer), giving them full game visibility. Camera controls are free-form with no follow constraint.

Spectators can choose a view mode: see all (full visibility of both roles including all evidence and both positions), killer only (killer's perspective with stealth meter and evidence visible), fed only (fed's perspective with evidence as the fed sees it), or hidden (neither player's special information, just the world state).

### Connection State Store

A client-side store tracks the full multiplayer connection state: current session ID, session data, connection status (disconnected/connecting/connected/reconnecting), opponent presence data, current latency in milliseconds, whether the opponent is a bot, lobby state, and whether the current user is a spectator.

### EventBus Integration

The multiplayer system listens to existing EventBus events and converts them to broadcast payloads:
- Killer evidence destroyed → broadcasts evidence update with destroyed state
- Killer target eliminated → broadcasts NPC state update marking the NPC as dead
- Fed witness interviewed (when fed uses witness compulsion ability in zone) → NOT broadcast (fed's location hidden)
- Fed arrest attempted → broadcasts reveal with reason "arrest announced" — fed announces themselves

Broadcast messages received from Realtime are applied locally:
- Evidence update → evidence manager applies remote evidence update
- NPC state update → NPC state updated on local map
- Ability triggered (for area abilities) → area effect applied (lockdown, entrapment visual)
- Reveal → opponent renderer reveals opponent
- Game over → run ends on both clients simultaneously

### Edge Cases

- **Map seed collision**: Sessions use a combination of the map seed and the first 8 characters of the session ID for all deterministic generation, guaranteeing per-session uniqueness even if two sessions share a seed.
- **Simultaneous kill + arrest**: If killer eliminates last target and fed arrests killer in the same ~200ms window, the edge function adjudicates via sequence numbers. Whichever game events entry has the lower sequence number wins. Both clients receive game over with the winner determined by server sequence.
- **Disconnect during active counter-play**: If killer disconnects while surveillance jamming is active, the bot inherits the ability's remaining cooldown state. The zone remains jammed until the timer expires (no rollback).
- **False alibi in multiplayer**: Fake NPC witness statement from killer (false alibi ability) syncs as an NPC state update — the NPC's fabricated witness statement content is part of the sync. Fed client receives the fabricated statement as a normal witness record.
- **Illegal surveillance reveal**: Fed's illegal surveillance camera access is not broadcast to the killer client — killer only knows cameras are active (evidence from camera feeds still visible). The fact that the fed is using illegal methods remains hidden (matches the covert nature of counter-play).
- **Spectator fog of war**: Default spectator view is full visibility — sees all. This is intentional for post-game analysis. If spectators are allowed during a live game, the hidden view mode is the recommended default to prevent stream sniping.

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

Use Supabase Broadcast for low-latency game state changes (evidence, NPC state, ability triggers). Use Supabase Presence for lobby and connection status. Use Supabase Database Realtime for authoritative session lifecycle changes. Database writes (`game_events`) happen only for significant authoritative events — not every frame sync.

The shared-seed determinism principle means both clients run identical world generation, NPC AI, and shop offerings from the same seed. The only information that crosses the network is the delta caused by human actions and the results of those actions on shared world state.

### File Structure

- `supabase/migrations/XXX_multiplayer.sql` — `game_sessions` and `game_events` tables with RLS policies
- `packages/shared/src/types/multiplayer.ts` — `GameSession`, `LobbyState`, `LoadoutSummary`, `SyncPayload` (discriminated union of 5 types), `PlayerPresence`, `GameEvent`, `MatchmakingRequest`, `SessionStatus` enum, `ConnectionStatus` enum, `SpectatorViewMode` enum
- `packages/shared/src/constants/multiplayer.ts` — sync tick rate (100ms), max reconnect attempts (5), grace period (30s), reveal duration (3000ms), min kill gap (10s), min arrest evidence threshold
- `packages/shared/src/schemas/multiplayer.ts` — Zod schemas for all sync payload types and server action inputs
- `packages/game-engine/src/multiplayer/state-sync.ts` — delta-based state sync, initial snapshot, payload construction per role
- `packages/game-engine/src/multiplayer/opponent-renderer.ts` — NPC sprite management for opponent, reveal/hide cycle, 3-second reveal timer
- `packages/game-engine/src/multiplayer/network-manager.ts` — latency ping/pong, exponential backoff reconnect (1s→2s→4s→8s→16s, max 5 attempts)
- `packages/game-engine/src/multiplayer/bot-controller.ts` — behavior tree class with `initialize(role, difficulty)`, `tick(deltaMs, gameState)`, `getNextAction()`, `setDifficulty()` methods; killer and fed behavior tree implementations; difficulty scaling constants
- `packages/game-engine/src/multiplayer/spectator-mode.ts` — subscribe to session channel read-only, view mode enum (`BOTH_ROLES` | `KILLER_ONLY` | `FED_ONLY` | `HIDDEN`), camera controls
- `apps/web/src/lib/supabase/realtime.ts` — `RealtimeService` class: `subscribe(sessionId)`, `broadcast(payload)`, `updatePresence(presence)`, `disconnect()`, callback registration for incoming broadcast, presence sync, DB change, disconnect, reconnect
- `apps/web/src/dal/multiplayer/sessions.ts` — `createSession`, `joinSession`, `getActiveSession`, `endSession`
- `apps/web/src/dal/multiplayer/matchmaking.ts` — `joinMatchmakingQueue(userId, preferredRole)`, `pollForMatch(userId)`, `leaveQueue(userId)` — all returning `Result<T, DatabaseError>`; matchmaking implemented via `game_sessions WHERE status = 'LOBBY' AND guest_user_id IS NULL AND host_role != desiredRole LIMIT 1`
- `apps/web/src/app/actions/multiplayer/create-game.ts` — validates auth, no active session, valid biome/role; generates map seed server-side (random UUID); creates session
- `apps/web/src/app/actions/multiplayer/join-game.ts` — validates session exists in LOBBY status with no guest, user is not host; sets guest user ID and opposite role
- `apps/web/src/app/actions/multiplayer/start-game.ts` — validates host caller, LOBBY status, guest or bot present; transitions LOBBY→STARTING→IN_PROGRESS; sets `started_at`; returns full `RunConfig`
- `apps/web/src/app/actions/multiplayer/end-game.ts` — validates IN_PROGRESS status and participant; sets `ended_at` and COMPLETED; triggers `saveRunResult` for both players
- `supabase/functions/validate-game-event/index.ts` — receives `{ sessionId, eventType, eventData, clientTimestamp }`, returns `{ valid, reason?, serverSequenceNumber? }`; validation rules: kill gap ≥ 10s, arrest requires evidence threshold, evidence timestamp within 5s of server, score ≤ 50pts/s
- `apps/web/src/app/game/lobby/page.tsx` — Client Component (needs Realtime); create mode: seed/biome/role/bot/spectators form, displays join code (first 6 chars of session UUID uppercased); join mode: join code input, auto-assigns opposite role
- `apps/web/src/components/app/game/lobby/LobbyRoom.tsx` — renders two `PlayerSlot` components, `GameSettings` panel, ready toggles, host-only start button, join code with copy
- `apps/web/src/components/app/game/lobby/PlayerSlot.tsx` — displays user profile, role badge, loadout summary (trophy name, equipment names, counter-play indicator)
- `apps/web/src/components/app/game/lobby/GameSettings.tsx` — biome selector, bot toggle, spectators toggle
- `apps/web/src/components/app/game/lobby/MatchmakingSpinner.tsx` — queue wait state with cancel button
- `apps/web/src/stores/multiplayer.ts` — Zustand store with fields: `sessionId`, `session`, `connectionStatus` (`'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING'`), `opponentPresence`, `latencyMs`, `isBot`, `lobbyState`, `isSpectator`; actions: `setSession`, `setConnectionStatus`, `setOpponentPresence`, `setLatency`, `setIsBot`, `setLobbyState`, `reset`

### Database Schema

```sql
-- game_sessions table
CREATE TABLE game_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id    UUID NOT NULL REFERENCES auth.users(id),
  guest_user_id   UUID REFERENCES auth.users(id),
  status          TEXT NOT NULL DEFAULT 'LOBBY'
                  CHECK (status IN ('LOBBY','STARTING','IN_PROGRESS','COMPLETED','ABANDONED')),
  map_seed        TEXT NOT NULL,
  biome           TEXT NOT NULL,
  host_role       TEXT NOT NULL CHECK (host_role IN ('KILLER','FED')),
  guest_role      TEXT CHECK (guest_role IN ('KILLER','FED')),
  spectators_allowed BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ
);

CREATE INDEX ON game_sessions (host_user_id);
CREATE INDEX ON game_sessions (guest_user_id);
CREATE INDEX ON game_sessions (status);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_participants_read"
  ON game_sessions FOR SELECT
  USING (auth.uid() = host_user_id OR auth.uid() = guest_user_id);

CREATE POLICY "session_host_write"
  ON game_sessions FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "session_host_update"
  ON game_sessions FOR UPDATE
  USING (auth.uid() = host_user_id);

-- game_events table (anti-cheat authoritative log)
CREATE TABLE game_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES game_sessions(id),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  event_type      TEXT NOT NULL,
  event_data      JSONB NOT NULL DEFAULT '{}',
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  sequence_number BIGINT NOT NULL
);

CREATE INDEX ON game_events (session_id, sequence_number);
CREATE INDEX ON game_events (user_id);

ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_participants_read"
  ON game_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions gs
      WHERE gs.id = session_id
        AND (gs.host_user_id = auth.uid() OR gs.guest_user_id = auth.uid())
    )
  );

CREATE POLICY "event_participants_insert"
  ON game_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### TypeScript Types

```typescript
// packages/shared/src/types/multiplayer.ts

export type SessionStatus = 'LOBBY' | 'STARTING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';
export type SpectatorViewMode = 'BOTH_ROLES' | 'KILLER_ONLY' | 'FED_ONLY' | 'HIDDEN';

export interface GameSession {
  id: ID;
  hostUserId: ID;
  guestUserId: ID | null;
  status: SessionStatus;
  mapSeed: string;
  biome: string;
  hostRole: PlayerRole;
  guestRole: PlayerRole | null;
  spectatorsAllowed: boolean;
  createdAt: Timestamp;
  startedAt: Timestamp | null;
  endedAt: Timestamp | null;
}

export interface LobbyState {
  session: GameSession;
  hostProfile: { userId: ID; displayName: string; avatarUrl: string | null };
  guestProfile: { userId: ID; displayName: string; avatarUrl: string | null } | null;
  hostLoadoutSummary: LoadoutSummary;
  guestLoadoutSummary: LoadoutSummary | null;
  botEnabled: boolean;
}

export interface LoadoutSummary {
  trophyName: string | null;
  equipmentNames: string[];
  hasCounterPlayUnlocked: boolean;
}

export type SyncPayload =
  | { type: 'EVIDENCE_UPDATE'; evidenceId: ID; newState: EvidenceState; location?: { x: number; y: number } }
  | { type: 'NPC_STATE_UPDATE'; npcId: ID; isSilenced?: boolean; isWitnessed?: boolean; isDead?: boolean }
  | { type: 'ABILITY_TRIGGERED'; abilityId: string; userId: ID; targetZoneId?: string }
  | { type: 'REVEAL'; revealedUserId: ID; position: { x: number; y: number }; reason: string; durationMs: number }
  | { type: 'GAME_OVER'; outcome: string; winnerUserId: ID; scores: Record<PlayerRole, number> };

export interface PlayerPresence {
  userId: ID;
  displayName: string;
  role: PlayerRole;
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
  preferredRole: PlayerRole | 'ANY';
  biomePreference: string | null;
  createdAt: Timestamp;
}

export interface MatchmakingEntry {
  userId: ID;
  preferredRole: PlayerRole | 'ANY';
  sessionId: ID | null;
  createdAt: Timestamp;
}
```

### Bot Controller Implementation

```typescript
// packages/game-engine/src/multiplayer/bot-controller.ts
type BotDifficulty = 'EASY' | 'NORMAL' | 'HARD';

class BotController {
  private role: PlayerRole;
  private behaviorTree: BehaviorTree;
  private difficulty: BotDifficulty;

  initialize(role: PlayerRole, difficulty: BotDifficulty): void;
  tick(deltaMs: number, gameState: GameStateContext): void;  // runs each frame
  getNextAction(): PlayerAction | null;
  setDifficulty(difficulty: BotDifficulty): void;
}
```

Killer behavior tree: identify closest target → approach via pathfinding → execute kill method → dispose body → evade fed vicinity → repeat. Evidence cleanup probability: EASY 40%, NORMAL 70%, HARD 95%. Fake evidence placement at HARD: 60% chance per kill.

Fed behavior tree: move to highest-evidence-density zone → scan → examine evidence → interview witnesses → update suspect list → if viability >60% and top suspect identified → make arrest. Counter-play: EASY never uses, NORMAL uses tier-1 only, HARD uses up to tier-2. Rough interrogation at HARD when witness is silenced.

### Spectator Mode Implementation

```typescript
// packages/game-engine/src/multiplayer/spectator-mode.ts
class SpectatorMode {
  private viewMode: SpectatorViewMode;

  subscribe(sessionId: string): void;   // read-only Realtime subscription
  setViewMode(mode: SpectatorViewMode): void;
}
```

Spectators receive ALL sync payloads from the session channel. Camera controls are free-form (pan/zoom) with no follow constraint. Default view mode is `BOTH_ROLES`.

### Zustand Store Shape

```typescript
// apps/web/src/stores/multiplayer.ts
interface MultiplayerStore {
  sessionId: ID | null;
  session: GameSession | null;
  connectionStatus: ConnectionStatus;
  opponentPresence: PlayerPresence | null;
  latencyMs: number;
  isBot: boolean;
  lobbyState: LobbyState | null;
  isSpectator: boolean;

  setSession: (session: GameSession) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setOpponentPresence: (presence: PlayerPresence | null) => void;
  setLatency: (ms: number) => void;
  setIsBot: (isBot: boolean) => void;
  setLobbyState: (state: LobbyState) => void;
  reset: () => void;
}
```

### Edge Function Interface

```typescript
// supabase/functions/validate-game-event/index.ts
interface ValidationRequest {
  sessionId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  clientTimestamp: string;
}

interface ValidationResponse {
  valid: boolean;
  reason?: string;         // only present if invalid
  serverSequenceNumber?: number;  // included if valid, for game_events insert
}
```

### EventBus Integration Map

| EventBus Event | Multiplayer Action |
|---|---|
| `killer:evidence-destroyed` | Broadcast `EVIDENCE_UPDATE { newState: DESTROYED }` |
| `killer:target-eliminated` + npcId | Broadcast `NPC_STATE_UPDATE { isDead: true }` |
| `fed:arrest-attempted` | Broadcast `REVEAL { reason: ARREST_ANNOUNCED }` |
| `fed:witness-interviewed` (with WITNESS_COMPULSION) | NOT broadcast — fed location hidden |
| Receive `EVIDENCE_UPDATE` | Call `evidence-manager.ts syncRemoteEvidenceUpdate()` |
| Receive `NPC_STATE_UPDATE` | Update NPC state on local map |
| Receive `ABILITY_TRIGGERED` (area) | Apply area effect (lockdown, entrapment visual) |
| Receive `REVEAL` | Call `opponent-renderer.ts revealOpponent()` |
| Receive `GAME_OVER` | End run on both clients simultaneously |

### Key Implementation Decisions

- Opponent position is NOT continuously synced — only revealed on specific events (stealth fail, arrest announce). This is fundamental to the game's identity.
- Bot controller reuses ALL role systems (killer-role.ts, fed-role.ts, ability-system.ts) — no parallel implementation
- Anti-cheat is best-effort at this stage (Edge Function validates plausibility, not perfect) — full anti-cheat requires server-authoritative game loop which is out of scope
- Matchmaking is dead-simple (no Elo, no skill rating) — find any opponent wanting opposite role
- Reconnect grace period (30s) with bot fallback is better UX than immediate disconnect penalty
- Counter-play abilities are broadcast selectively: area effects that the killer must react to (lockdown, entrapment) are synced; covert abilities (illegal surveillance, rough interrogation) are not
- Join code = first 6 characters of session UUID uppercased; queried via `WHERE id LIKE joinCode%`
- Map seed generated server-side in create-game action (random UUID); combined with session ID slice for per-session uniqueness

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

----

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
