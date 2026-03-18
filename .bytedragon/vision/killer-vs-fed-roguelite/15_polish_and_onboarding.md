---
vision: killer-vs-fed-roguelite
sequence: 15
name: polish-and-onboarding
group: Polish
group_order: 7
status: pending
depends_on: [14_multiplayer_sync]
produces:
  - "packages/game-engine/src/audio/audio-manager.ts — background music, SFX, ambient, volume controls"
  - "packages/shared/src/types/audio.ts — SoundEffect, MusicTrack, AmbientLoop, AudioSettings"
  - "packages/shared/src/constants/audio.ts — sound keys, default volumes, fade durations"
  - "packages/game-engine/src/vfx/vfx-manager.ts — particle effects, screen effects, transitions"
  - "packages/game-engine/src/vfx/presets/combat-vfx.ts — hit effects, death animations, ability VFX"
  - "packages/game-engine/src/vfx/presets/evidence-vfx.ts — discovery sparkle, scan pulse, arrest animation"
  - "packages/game-engine/src/vfx/presets/environment-vfx.ts — ambient particles, weather, lighting"
  - "packages/game-engine/src/vfx/presets/ui-vfx.ts — coin burst, unlock celebration, level-up glow"
  - "packages/game-engine/src/animations/animation-manager.ts — refined character and interaction animations"
  - "packages/game-engine/src/tutorial/tutorial-manager.ts — step-by-step tutorial with role-specific flows"
  - "packages/game-engine/src/tutorial/tutorials/killer-tutorial.ts — scripted killer tutorial sequence"
  - "packages/game-engine/src/tutorial/tutorials/fed-tutorial.ts — scripted fed tutorial sequence"
  - "packages/game-engine/src/scenes/loading-scene.ts — polished loading screen with tips and progress"
  - "packages/game-engine/src/utils/object-pool.ts — object pooling for entities, particles, projectiles"
  - "packages/game-engine/src/utils/culling.ts — viewport culling for off-screen entities"
  - "apps/web/src/app/page.tsx — polished landing page with Magic UI"
  - "apps/web/src/app/settings/page.tsx — audio, graphics, accessibility, control remapping settings"
  - "apps/web/src/components/app/game/hud/TutorialOverlay.tsx — step indicators, instruction text, skip"
  - "apps/web/src/components/app/common/accessibility/ — screen reader, focus management, keyboard nav"
  - "apps/web/src/stores/settings.ts — user preferences with localStorage + optional Supabase persistence"
  - "packages/shared/src/types/settings.ts — UserSettings, AudioSettings, GraphicsSettings, AccessibilitySettings"
  - "supabase/migrations/XXX_user_settings.sql — user_settings table with RLS"
  - "apps/web/src/dal/settings/user-settings.ts — getSettings, updateSettings"
  - "apps/web/src/app/actions/settings/save-settings.ts — validated settings save server action"
created: 2026-03-17
last_aligned: never
---

# Vision Piece 15: Polish and Onboarding

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: multiplayer-sync (14)

---

## Feature Specification

> **Usage**: Copy everything below this line through the next `---` separator, then
> paste after typing `/speckit.specify `

Transform the functional game into a polished, accessible experience. This piece adds audio (biome music, SFX, ambient), visual effects (particles, screen effects, scene transitions), tutorial flows for first-time players (covering both roles and introducing counter-play concepts), WCAG AA accessibility features, performance optimization (object pooling, viewport culling), and a polished landing page. Settings are persisted to localStorage and optionally to Supabase. This is the final piece — it touches all systems to enhance without modifying their core logic.

### Design Principle for Polish

Polish does not change gameplay logic — it augments feedback, smooths flow, and reduces friction. Every audio and VFX addition should reinforce the game's asymmetric tension: the killer's audio cues are dark and stealthy; the fed's audio cues are procedural and investigative. Screen effects communicate information (red flash on detection, blue pulse on evidence discovery) without obscuring gameplay.

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
```

#### From packages/shared/src/types/player.ts (piece 07)
```typescript
type PlayerRole = 'KILLER' | 'FED'
```

#### From packages/game-engine/src/utils/event-bus.ts (piece 04)
```typescript
EventBus.emit(event: string, data: unknown): void
EventBus.on(event: string, callback: (data: unknown) => void): void
```

#### From packages/game-engine/src/scenes/ (pieces 04-14)
```typescript
// Scene keys available:
const SCENE_KEYS = {
  BOOT: 'BootScene', PRELOAD: 'PreloadScene', MAP: 'MapScene',
  COMBAT: 'CombatScene', SHOP: 'ShopScene', LOADING: 'LoadingScene'
}
```

#### From packages/shared/src/types/biome.ts (piece 05)
```typescript
type Biome =
  | 'rural'
  | 'city'
  | 'cruise_ship'
  | 'office_building'
  | 'amusement_park'
  | 'shopping_mall'
  | 'airport'
  | 'abandoned_asylum'
  | 'remote_island'
  | 'ghost_town'
  | 'concert_venue'
  | 'subway_network'
```

#### From packages/shared/src/types/combat.ts (piece 08)
```typescript
interface StatusEffect { id: ID; name: string; type: 'BUFF' | 'DEBUFF'; remainingMs: number }
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
```

#### From packages/shared/src/types/progression.ts (piece 13)
```typescript
interface Trophy { id: ID; name: string; rarity: string }
interface Equipment { id: ID; name: string; rarity: string }
```

#### From packages/shared/src/types/multiplayer.ts (piece 14)
```typescript
interface GameSession { id: ID; status: SessionStatus }
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
PageLayout, GameLayout, AuthLayout
```

#### From apps/web/src/components/vendor/magic-ui/ (piece 03)
```typescript
// IMMUTABLE Magic UI components used on landing page:
// AnimatedBeam, BlurFade, BorderBeam, MagicCard, MarqueeDemo, etc.
// Check components/vendor/magic-ui/ for available components — never modify, only compose
```

#### From apps/web/src/config/env.ts (piece 01)
```typescript
import { env } from '@/config/env';
```

### New Types to Create

**`packages/shared/src/types/audio.ts`**:

```typescript
export interface SoundEffect {
  key: string;            // Phaser audio key for preloading
  path: string;           // asset path (relative to Azure Blob Storage URL or /public)
  volume: number;         // 0-1 default volume
  poolSize: number;       // how many simultaneous instances (3-5 for common SFX)
}

export interface MusicTrack {
  key: string;
  path: string;
  biome?: Biome;          // biome-specific tracks; undefined = universal
  loopStart?: number;     // loop point in seconds (for seamless looping)
  loopEnd?: number;
}

export interface AmbientLoop {
  key: string;
  path: string;
  biome: Biome;
  volume: number;         // ambient typically 0.3-0.5
}

export interface AudioSettings {
  masterVolume: number;   // 0-1
  musicVolume: number;    // 0-1, relative to master
  sfxVolume: number;      // 0-1, relative to master
  ambientVolume: number;  // 0-1, relative to master
  isMuted: boolean;
}
```

**`packages/shared/src/types/settings.ts`**:

```typescript
import { AudioSettings } from './audio';

export interface GraphicsSettings {
  particlesEnabled: boolean;      // true by default
  screenShakeEnabled: boolean;    // true by default
  reducedMotion: boolean;         // mirrors prefers-reduced-motion, disables particles+shake
  targetFps: 60 | 30;            // 60 default; 30 for low-end devices
}

export interface AccessibilitySettings {
  highContrast: boolean;          // increased contrast ratios throughout UI
  colorblindMode: 'NONE' | 'PROTANOPIA' | 'DEUTERANOPIA' | 'TRITANOPIA';
  textScale: 1 | 1.25 | 1.5;    // relative text size multiplier
  keyboardNavigation: boolean;    // ensure all UI elements reachable by keyboard
  screenReaderAnnouncements: boolean; // aria-live announcements for game events
}

export interface ControlSettings {
  moveUp: string;         // default 'w' / arrow up
  moveDown: string;       // default 's' / arrow down
  moveLeft: string;       // default 'a' / arrow left
  moveRight: string;      // default 'd' / arrow right
  interact: string;       // default 'e' / enter
  ability1: string;       // default '1'
  ability2: string;       // default '2'
  ability3: string;       // default '3'
  ability4: string;       // default '4'
  ability5: string;       // default '5'
  openInventory: string;  // default 'i'
  openMap: string;        // default 'm'
  openSuspectBoard: string; // default 'tab' (fed only)
  sprint: string;         // default 'shift'
  sneak: string;          // default 'ctrl'
}

export interface UserSettings {
  userId: string;
  audio: AudioSettings;
  graphics: GraphicsSettings;
  accessibility: AccessibilitySettings;
  controls: ControlSettings;
  updatedAt: string;      // ISO 8601
}
```

### Database Schema

**`supabase/migrations/XXX_user_settings.sql`**:

```sql
CREATE TABLE user_settings (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  audio         JSONB NOT NULL DEFAULT '{"masterVolume":0.8,"musicVolume":0.7,"sfxVolume":1.0,"ambientVolume":0.5,"isMuted":false}',
  graphics      JSONB NOT NULL DEFAULT '{"particlesEnabled":true,"screenShakeEnabled":true,"reducedMotion":false,"targetFps":60}',
  accessibility JSONB NOT NULL DEFAULT '{"highContrast":false,"colorblindMode":"NONE","textScale":1,"keyboardNavigation":true,"screenReaderAnnouncements":false}',
  controls      JSONB NOT NULL DEFAULT '{"moveUp":"w","moveDown":"s","moveLeft":"a","moveRight":"d","interact":"e","ability1":"1","ability2":"2","ability3":"3","ability4":"4","ability5":"5","openInventory":"i","openMap":"m","openSuspectBoard":"tab","sprint":"shift","sneak":"ctrl"}',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_own"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id);
```

JSONB usage rationale: Settings subcategories (audio, graphics, accessibility, controls) are JSONB because the schema evolves frequently as new settings are added — a new control binding or a new accessibility option would not require a migration, only a code-side default update. Trade-off: JSONB cannot be queried by individual setting without path operators. This is acceptable since settings are always loaded and saved as complete category objects.

### Audio System

**`packages/game-engine/src/audio/audio-manager.ts`**

Singleton. Wraps Phaser's built-in audio manager with:
- Volume controls for each category (music, SFX, ambient)
- Biome-aware music transitions (crossfade on biome change)
- SFX pooling (N simultaneous instances per sound key)
- Auto-fade on scene transition
- Respects `AudioSettings.isMuted` and individual volumes
- Respects `AccessibilitySettings.reducedMotion` (no dynamic audio panning/effects if motion sensitive)

```typescript
class AudioManager {
  private scene: Phaser.Scene;

  initialize(scene: Phaser.Scene, settings: AudioSettings): void;
  applySettings(settings: AudioSettings): void;   // called when user updates settings
  playMusic(trackKey: string, fadeInMs?: number): void;
  stopMusic(fadeOutMs?: number): void;
  crossfadeMusic(newTrackKey: string, fadeMs?: number): void;
  playSFX(key: string, volume?: number): void;
  playAmbient(key: string): void;
  stopAmbient(): void;
  setMuted(muted: boolean): void;
  setMasterVolume(volume: number): void;
}
```

**Biome music assignments** (tracks sourced from royalty-free library — placeholder keys at implementation time):

| Biome | Music Mood | Track Key |
|-------|-----------|-----------|
| city | Tense urban jazz | `music_city` |
| rural | Sparse acoustic | `music_rural` |
| cruise_ship | Eerie lounge | `music_cruise` |
| office_building | Tense corporate ambient | `music_office` |
| amusement_park | Distorted carnival | `music_amusement` |
| shopping_mall | Uncanny elevator music | `music_mall` |
| airport | Suspenseful minimal | `music_airport` |
| abandoned_asylum | Dark ambient horror | `music_asylum` |
| remote_island | Isolated nature | `music_island` |
| ghost_town | Western tension | `music_ghost_town` |
| concert_venue | Muffled crowd + tension | `music_concert` |
| subway_network | Underground drone | `music_subway` |

**Role audio perspective** (ambient layers):
- When playing as killer: slight low-frequency drone underneath biome music
- When playing as fed: procedural "investigation" layer (subtle clock ticking, paper rustle) underneath biome music

**SFX catalog** (partial — full set defined in `constants/audio.ts`):

| Event | SFX Key | Category |
|-------|---------|---------|
| Evidence discovered | `sfx_evidence_found` | Investigation |
| Evidence quality upgraded | `sfx_evidence_enhanced` | Investigation |
| Arrest succeeded | `sfx_arrest_success` | Investigation |
| Arrest failed (combat) | `sfx_arrest_failed` | Investigation |
| Suspect board updated | `sfx_suspect_update` | Investigation |
| Kill performed | `sfx_kill` | Stealth |
| Body disposed | `sfx_disposal` | Stealth |
| Stealth broken | `sfx_detection` | Stealth |
| Fake evidence planted | `sfx_plant_evidence` | Counter-play |
| Witness silenced | `sfx_intimidation` | Counter-play |
| Surveillance jammed | `sfx_jamming` | Counter-play |
| Rough interrogation | `sfx_interrogation` | Counter-play |
| Entrapment triggered | `sfx_entrapment` | Counter-play |
| Combat hit | `sfx_hit_melee` | Combat |
| Player damaged | `sfx_player_hurt` | Combat |
| Ability used | `sfx_ability_generic` | Abilities |
| Shop opened | `sfx_shop_open` | UI |
| Item purchased | `sfx_purchase` | UI |
| Encounter triggered | `sfx_encounter` | UI |
| Trophy unlocked | `sfx_trophy_unlock` | Progression |
| Skill unlocked | `sfx_skill_unlock` | Progression |

Counter-play ability SFX use darker/more morally ambiguous sounds to reinforce their risk/reward nature.

### VFX System

**`packages/game-engine/src/vfx/vfx-manager.ts`**

Singleton. Uses Phaser's built-in particle system with object pooling (piece object-pool.ts). All VFX respect `GraphicsSettings.particlesEnabled` and `GraphicsSettings.screenShakeEnabled`.

```typescript
class VFXManager {
  initialize(scene: Phaser.Scene): void;
  applySettings(settings: GraphicsSettings): void;

  // Screen effects
  screenFlash(color: number, durationMs: number, intensity: number): void;
  screenShake(durationMs: number, magnitude: number): void;
  screenVignette(active: boolean, color?: number): void;   // persistent until deactivated

  // Particle effects
  bloodSplatter(x: number, y: number, intensity: 'SMALL' | 'MEDIUM' | 'LARGE'): void;
  evidenceDiscoveryPulse(x: number, y: number, evidenceType: EvidenceType): void;
  stealthBreakFlash(x: number, y: number): void;           // red pulse when detected
  arrestAnimation(targetX: number, targetY: number): void;
  unlockCelebration(x: number, y: number, rarity: string): void;  // trophy/skill unlock
  coinBurst(x: number, y: number, amount: number): void;

  // Environment
  biomeAmbientParticles(biome: Biome): void;   // rain in city, dust in ghost_town, etc.
  setLighting(ambientColor: number, intensity: number): void;
}
```

**VFX presets** by biome (subset):

| Biome | Ambient Particles | Lighting |
|-------|------------------|---------|
| city | Rain drops, exhaust particles | Blue-grey, dim |
| abandoned_asylum | Dust motes, flickering shadow | Red-tinted, low |
| concert_venue | Stage light beams, confetti | Multi-color, bright |
| subway_network | Train dust, light flicker | Yellow-white, harsh |
| rural | Fireflies at night, falling leaves | Warm, natural |

Evidence discovery by type uses color-coded particle bursts:
- FOOTPRINT: grey dust
- DNA: green sparkle
- WITNESS: orange glow
- WEAPON_TRACE: red shimmer
- BODY: dark purple pulse
- SURVEILLANCE: blue scan ring
- FAKE_EVIDENCE: appears identical to real evidence type (deception maintained)

Counter-play ability VFX:
- `SURVEILLANCE_JAMMING`: static interference grid expanding from killer position over zone
- `ENTRAPMENT_SETUP` (when triggered): brief red spotlight on decoy NPC
- `ILLEGAL_SURVEILLANCE` (fed): subtle green tint on camera icons in zone
- `ROUGH_INTERROGATION`: screen desaturation during interrogation scene

If `GraphicsSettings.reducedMotion = true` OR `prefers-reduced-motion: reduce`:
- All particle effects disabled
- Screen shake disabled
- Screen flash replaced with brief border color change
- Transitions use cut instead of fade

### Animation Manager

**`packages/game-engine/src/animations/animation-manager.ts`**

Centralizes all character animation definitions (extending piece 06's sprite-manager). Adds:
- Smooth idle → walk → run transitions (easing)
- Context-sensitive animations: disguise change animation, body disposal animation, forensic examination animation
- Combat polish: hit stagger, knockout fall, dodge roll
- Counter-play animations: intimidation lean-in, evidence plant crouch, camera jam gesture (subtle — maintains stealth)
- Interaction feedback animations: handshake for interview, badge flash for witness compulsion

### Tutorial System

**`packages/game-engine/src/tutorial/tutorial-manager.ts`**

Overlay-based tutorial (no separate tutorial level). First time a user selects a role, the tutorial activates. Tutorial steps are scripted sequences that highlight UI elements, move camera to points of interest, and wait for the player to perform specific actions before advancing.

```typescript
interface TutorialStep {
  id: string;
  instruction: string;           // displayed in TutorialOverlay.tsx
  highlightElement?: string;     // CSS selector OR Phaser game object key to highlight
  waitForEvent?: string;         // EventBus event that marks step complete
  autoAdvanceMs?: number;        // auto-advance if no waitForEvent
  position?: { x: number; y: number };  // camera focus point
}

class TutorialManager {
  start(role: PlayerRole): void;
  advance(): void;                    // called on step completion or skip
  skip(): void;                       // skip entire tutorial
  getCurrentStep(): TutorialStep | null;
  isActive(): boolean;
  onComplete(callback: () => void): void;
}
```

**Killer tutorial steps** (`killer-tutorial.ts`):

1. "Welcome, Killer. Your objective is to eliminate your targets and dispose of the evidence." (auto-advance 5s)
2. "Use WASD to move. Hold Shift to sprint. Hold Ctrl to sneak." (wait: player moves)
3. "The orange-marked NPC is your first target. Approach them cautiously." (wait: player near target)
4. "Press E to interact. Select a kill method." (wait: `killer:target-eliminated`)
5. "Evidence has been generated. The fed will find it. Find a disposal site (marked in purple)." (wait: player near disposal)
6. "Dispose of the body to reduce evidence." (wait: `killer:body-disposed`)
7. "You have earned session coins. A shop is marked on your minimap — visit it between objectives." (auto-advance 5s)
8. "Advanced: As you progress, you'll unlock Deception abilities to plant fake evidence and silence witnesses." (TutorialOverlay highlights locked Deception tree icon, auto-advance 8s)
9. "Tutorial complete. Good luck — the fed is searching for you." (skip tutorial flag set)

**Fed tutorial steps** (`fed-tutorial.ts`):

1. "Welcome, Agent. Your objective is to gather evidence, identify the killer among the NPCs, and make an arrest." (auto-advance 5s)
2. "Use WASD to move. Press E to interact with NPCs and evidence." (wait: player moves)
3. "Press Q to activate your Scanner ability. Blue markers show nearby evidence." (wait: `fed:evidence-discovered`)
4. "Examine the evidence by pressing E on it. Higher quality evidence is more valuable." (wait: forensic examination performed)
5. "NPCs marked with ! have witnessed something. Interview them for leads." (wait: `fed:witness-interviewed`)
6. "Open your Suspect Board (Tab). Suspects are filtered as you gather evidence." (wait: SuspectBoard opens)
7. "When your Case Strength meter reaches 80%, you can make a clean arrest. Target a suspect and press E." (auto-advance 8s)
8. "Advanced: As you progress, you'll unlock Interrogation abilities to pressure witnesses and set up entrapment." (highlights locked Interrogation tree icon, auto-advance 8s)
9. "Tutorial complete. Find the killer — they're already acting." (skip tutorial flag set)

**Counter-play introduction** (shown after first counter-play encounter, regardless of tutorial completion):
- Killer receives a brief tooltip when an NPC they intimidated is flagged as "silenced" in the fed's interface: "Silenced witnesses cannot be easily interviewed. The fed must use more aggressive tactics."
- Fed receives a brief tooltip when encountering a silenced witness: "This witness is too frightened to talk. You may need unconventional methods — but they come with risk."

**`apps/web/src/components/app/game/hud/TutorialOverlay.tsx`**:

```typescript
// "use client" — reads tutorial state from Phaser via EventBus → Zustand
interface TutorialOverlayProps {
  step: TutorialStep | null;
  stepIndex: number;
  totalSteps: number;
  onSkip: () => void;
}
```

Layout: bottom-center instruction card with step indicator dots (X/Y). Skip button top-right. Highlighted elements get a pulsing border overlay (CSS, not Phaser). Arrow pointing toward highlighted element.

WCAG: instruction card has `role="status"` and `aria-live="polite"` — screen reader announces each step automatically.

### Settings System

**`apps/web/src/stores/settings.ts`**:

```typescript
interface SettingsStore {
  settings: UserSettings;
  isLoaded: boolean;

  // Initialize from localStorage, then merge server settings if logged in
  initialize(serverSettings?: UserSettings): void;

  // Update individual categories
  updateAudio: (audio: Partial<AudioSettings>) => void;
  updateGraphics: (graphics: Partial<GraphicsSettings>) => void;
  updateAccessibility: (accessibility: Partial<AccessibilitySettings>) => void;
  updateControls: (controls: Partial<ControlSettings>) => void;

  // Persist
  saveToLocalStorage: () => void;
  saveToServer: () => Promise<void>;   // calls save-settings Server Action
}
```

**Persistence strategy**:
- Immediate: save to `localStorage` on every settings change (no delay)
- Deferred: debounce server save by 2 seconds after last change (only if user is logged in)
- On app load: read from localStorage for immediate application, then fetch from server and merge (server wins on conflict)
- Offline: localStorage is always available; server sync fails silently (no error shown)

**Accessibility settings** automatically mirror browser media queries:
- `prefers-reduced-motion` → initialize `reducedMotion: true` (user can override to false)
- `prefers-contrast: high` → initialize `highContrast: true`
- These are initial values only; user's explicit settings override media queries after first save

**`apps/web/src/app/settings/page.tsx`** — Client Component (settings are user-specific, SSR not needed)

Sections:
1. **Audio**: master volume slider, music/SFX/ambient sliders, mute toggle, preview button (plays test sound)
2. **Graphics**: particle effects toggle, screen shake toggle, target FPS radio (60/30), reduced motion toggle
3. **Accessibility**: high contrast toggle, colorblind mode select (NONE/PROTANOPIA/DEUTERANOPIA/TRITANOPIA), text scale radio (1/1.25/1.5), keyboard nav toggle, screen reader announcements toggle
4. **Controls**: key binding grid — click cell → press key to remap. Reset to defaults button per section.

All controls WCAG AA: labels on every input, focus visible on all elements, keyboard navigable without mouse.

### Accessibility Features

**`apps/web/src/components/app/common/accessibility/`**

**`ScreenReaderAnnouncer.tsx`**: Singleton component rendered in root layout. Provides `aria-live="polite"` and `aria-live="assertive"` regions. Exposes a global announce function called from EventBus handlers.

Key in-game announcements (when `AccessibilitySettings.screenReaderAnnouncements = true`):
- Evidence discovered: "Evidence found: [type] — Case strength now [X]%"
- Suspect board updated: "Suspect narrowed — [N] suspects remain"
- Arrest condition met: "Arrest ready — Case strength [X]%"
- Kill performed: "Target eliminated" (killer perspective)
- Detection: "You have been spotted"
- Counter-play triggered: "Counter-play activated: [ability name]"
- Game over: "Run complete — [WIN/LOSE]"

**`FocusManager.tsx`**: Manages focus trapping in dialogs (shop, encounter, SuspectBoard). Uses `focus-trap-react` or custom implementation. Ensures Tab cycle stays within open modal. Returns focus to trigger element on close.

**High contrast mode**: Adds `.high-contrast` class to root `<html>`. CSS custom properties override:
- All text: 100% contrast (pure black/white)
- UI backgrounds: no gradients, flat colors only
- Evidence markers on minimap: larger, with distinct shapes not just colors
- HUD meters: thick borders, text labels alongside color indicators

**Colorblind mode**: Adds `.colorblind-[mode]` class. CSS filter overrides + alternative color schemes:
- Evidence type icons use both color AND shape (circle/triangle/square) — not color alone
- Alert levels use patterns/hatching in addition to red/yellow/green
- All information that's color-coded has a secondary indicator (icon, label, pattern)

### Performance Optimization

**`packages/game-engine/src/utils/object-pool.ts`**

```typescript
class ObjectPool<T> {
  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    initialSize: number
  );

  acquire(): T;
  release(obj: T): void;
  getActiveCount(): number;
  getPoolSize(): number;
}
```

Pools implemented:
- `ParticlePool` — Phaser particle emitters (pool size: 20 per preset)
- `ProjectilePool` — physics bodies for ranged attacks (pool size: 10)
- `DamageNumberPool` — floating damage text objects (pool size: 15)
- `EvidenceMarkerPool` — evidence highlight objects on map (pool size: 50)
- `NPCPool` — NPC entity objects (inactive NPCs returned, active NPCs borrowed) (pool size: 40)

**`packages/game-engine/src/utils/culling.ts`**

```typescript
class ViewportCuller {
  setViewport(camera: Phaser.Cameras.Scene2D.Camera): void;
  isInViewport(x: number, y: number, margin?: number): boolean;
  cullEntities(entities: Entity[]): { visible: Entity[]; hidden: Entity[] };
}
```

Culling strategy:
- NPCs > 800px from camera center: disable physics updates, pause animations (only position ticks at 2Hz)
- Evidence markers: only render if in visible zone (zone-based culling, not per-object distance)
- Particles: automatically cleaned by Phaser particle system; additional VFX beyond 600px culled
- Off-screen audio: ambient sounds > 1000px from player: muted (Phaser spatial audio)

**Performance targets**:
- 60fps on mid-range devices (laptop GPU, 4 CPU cores, 8GB RAM)
- 30fps on low-end devices (integrated graphics, 2 CPU cores) — player can set 30fps target in settings
- NPC AI: update at 10Hz (every 3 physics frames at 30Hz), not every frame
- Evidence spatial index: uses spatial hash grid for O(1) proximity queries (re-indexed on NPC pool update)

### Loading Scene

**`packages/game-engine/src/scenes/loading-scene.ts`**

Replaces/enhances the existing PreloadScene (piece 04) with polished loading UI:
- Progress bar with animated gradient
- Loading tips (randomly selected from pool of 20+ tips per role)
- Background: blurred atmospheric screenshot of current biome
- Estimated time remaining (based on asset tier sizes)
- Transitions to MapScene with a fade-in after all critical + standard tier assets loaded

Loading tips examples (role-specific, shown during run start):

Killer tips:
- "Disposing of bodies in water is thorough — but leaves traces in the riverbank soil."
- "A jammed camera covers your tracks, but a sharp-eyed agent knows which zones go dark."
- "Fake evidence convinces the naive. Evidence chain analysis exposes the creative."

Fed tips:
- "Silenced witnesses can still be coerced — if you're willing to get your hands dirty."
- "Off-the-books forensics are faster, but an attorney can have them thrown out."
- "Entrapment only works if the killer doesn't notice the decoy is too convenient."

### Landing Page

**`apps/web/src/app/page.tsx`** — Server Component (SSR for SEO)

Polished marketing landing page using Magic UI animated components:

```
[Hero]
  - Game title with animated gradient text (Magic UI AnimatedGradientText)
  - Tagline: "One kills. One investigates. Only one gets away."
  - CTA: "Play Now" (→ /game/select-role) + "How to Play" (→ /tutorial)
  - Hero visual: split-screen showing killer vs fed perspectives (static screenshot or short video)

[Asymmetric Gameplay]
  - Two cards side-by-side (Magic UI MagicCard with hover effect)
  - Killer card: dark theme, stealth visual, list of killer abilities
  - Fed card: blue theme, investigation visual, list of fed abilities
  - Small note: "Both roles unlock counter-play abilities to undermine each other"

[Biomes Section]
  - Horizontal scrolling Marquee of biome screenshots (Magic UI Marquee)
  - "12 procedurally generated biomes — each run is unique"

[Progression]
  - Animated beam showing the progression loop (Magic UI AnimatedBeam)
  - Run → Materials → Skill Trees → Counter-Play Abilities → Next Run

[CTA]
  - "Ready to play?" with animated button (Magic UI ShimmerButton or similar)
  - Join count or player count (if analytics available)
```

WCAG AA landing page: all Magic UI animations respect `prefers-reduced-motion` (components accept `reducedMotion` prop or CSS override). All images have alt text. Color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text.

### DAL and Server Actions

**`apps/web/src/dal/settings/user-settings.ts`**:

```typescript
export interface UserSettingsDTO {
  userId: string;
  audio: AudioSettings;
  graphics: GraphicsSettings;
  accessibility: AccessibilitySettings;
  controls: ControlSettings;
  updatedAt: string;
}

export async function getSettings(userId: string): Promise<Result<UserSettingsDTO | null, DatabaseError>>;
export async function updateSettings(userId: string, settings: Partial<Omit<UserSettingsDTO, 'userId' | 'updatedAt'>>): Promise<Result<UserSettingsDTO, DatabaseError>>;
export async function upsertSettings(userId: string, settings: UserSettingsDTO): Promise<Result<UserSettingsDTO, DatabaseError>>;
```

**`apps/web/src/app/actions/settings/save-settings.ts`**:

Server Action with Zod validation. Validates:
- Audio volumes: 0-1 range for each
- Graphics: `targetFps` must be 60 or 30
- Accessibility: `colorblindMode` must be valid enum value
- Controls: each key binding must be a valid keyboard key string (no empty, no control sequences)
- `userId` matches session user (cannot save settings for another user)

### EventBus → Settings Bridge

Settings changes from React must reach Phaser systems (AudioManager, VFXManager):

On `settings:audio-updated` EventBus event → `AudioManager.applySettings(newAudioSettings)`
On `settings:graphics-updated` EventBus event → `VFXManager.applySettings(newGraphicsSettings)`
On `settings:controls-updated` EventBus event → Phaser `InputManager` rebinds keys

Settings store emits these events after `saveToLocalStorage()` completes. Phaser systems listen on initialization.

### Edge Cases

- **First launch (no tutorial shown)**: Check `localStorage['tutorialComplete-KILLER']` and `tutorialComplete-FED`. If missing, tutorial auto-starts on first run with that role. Flag set after tutorial completes or is skipped. Independent per role.
- **Audio not permitted (browser policy)**: Web Audio API requires user interaction before sound can play. `AudioManager.initialize()` checks `AudioContext.state`. If `suspended`, defers audio start until first click/keypress (standard approach). No error shown — audio silently becomes available after first interaction.
- **Reduced motion + VFX conflict**: If `reducedMotion = true`, all particle effects are replaced with instant color flashes (1 frame) and all animations use `prefers-reduced-motion` CSS. Screen shake is completely disabled. Loading transitions use cut instead of fade.
- **Colorblind mode + evidence markers**: Evidence type markers on map use both color AND SVG icon shape. Colorblind filter applied via CSS `filter: url(#colorblind-[mode])` on game canvas — affects entire Phaser canvas (including evidence markers). SVG icons ensure readability even with filter.
- **Control remapping conflicts**: If two actions share the same key, settings page shows conflict warning and blocks save until resolved. Escape and Print Screen cannot be remapped (reserved system keys).
- **Settings page during active run**: Settings changes while in-game apply immediately via EventBus events. Volume, graphics, and accessibility changes are live. Control remapping during an active run takes effect after run ends (to prevent mid-run confusion).
- **Server settings sync failure**: If server save fails (network error), `saveToLocalStorage()` already completed — settings are not lost. A toast notification: "Settings saved locally — cloud sync will retry." Retry on next settings change.
- **Tutorial skip**: If player skips tutorial, the tutorial complete flags are still set — tutorial never re-shows. A "Replay Tutorial" option is available in Settings → Gameplay.
- **Counter-play SFX volume**: Counter-play ability SFX (intimidation, jamming, rough interrogation) play at 70% of master SFX volume by default — subtler than core ability SFX to feel appropriately clandestine. User cannot set this per-ability; it's a design-enforced offset on top of `sfxVolume`.

---

## Planning Guidance

> **Usage**: Copy everything below this line through the next `---` separator, then
> paste after typing `/speckit.plan `

### Architecture Approach

Polish systems wrap existing systems — they don't replace them. AudioManager hooks into existing EventBus events. VFXManager responds to the same events. Tutorial steps wait for existing EventBus events (no new events needed in most cases). Object pools wrap existing entity and particle creation. This keeps the piece additive and reduces regression risk.

Audio assets are placeholders at implementation time — the system is implemented with placeholder audio keys, and real audio files are dropped in without code changes.

### Key Implementation Decisions

- AudioManager and VFXManager are Phaser singletons (instantiated in MapScene or a dedicated plugin)
- Tutorial overlay uses React (TutorialOverlay.tsx via Zustand), not Phaser — consistent with HUD pattern
- Settings persistence: localStorage for immediate availability, server for cross-device sync
- Object pooling: implement for particles and NPCs first (highest impact); projectiles second
- Viewport culling: zone-based culling is simpler and sufficient (don't need per-object distance culling for most entities)
- Landing page: server component for SEO, no client-side data fetching needed for marketing content
- Counter-play SFX: distinct enough to be recognizable but subtle enough to feel covert

### Testing Strategy

- Unit test `audio-manager.ts`: volume changes apply, mute toggles all tracks, biome crossfade fires correct track
- Unit test `object-pool.ts`: acquire → active count increments; release → active count decrements; pool reuses objects
- Unit test `culling.ts`: entities outside camera bounds return false from `isInViewport()`
- Unit test `save-settings.ts` action: Zod rejects out-of-range volumes, invalid enum values, conflicting key bindings
- Component test `TutorialOverlay.tsx`: renders instruction text, step indicator, skip button; aria-live region present
- Component test settings page: all sliders change settings store; save button triggers server action
- E2E (Playwright): new user → first run → tutorial appears → complete tutorial → tutorial flag set
- E2E: settings page → change volume → verify audio-updated event fires → verify AudioManager applies change
- Accessibility audit: run axe-core against settings page and landing page — zero critical violations

### Constitution Compliance Checklist

- [x] I: No barrel files — direct imports throughout
- [x] VII: Phaser/React boundary — AudioManager/VFXManager in Phaser; TutorialOverlay/SettingsPage in React
- [x] XI: Zod validation — settings schemas validated server-side
- [x] XII: DAL for DB access — user_settings only via dal/settings/user-settings.ts
- [x] XIII: Server Actions — settings save via next-safe-action
- [x] XV: JSONB documented — user_settings JSONB rationale documented in schema comment
- [x] XXVII: AI-optimized docs — tutorial steps include explicit counter-play introductions
- [x] XXVIII: WCAG AA — high contrast, colorblind mode, keyboard nav, screen reader, reduced motion
- [x] XXIX: Responsive design — landing page and settings page responsive at all viewport sizes
- [x] XXX: Progressive enhancement — landing page functional without JS (SSR); audio disabled gracefully without user gesture
- [x] XXXI: Asset loading tiers — loading scene respects critical/standard/deferred tiers from piece 04

---

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

When this piece is fully implemented:
- Every game action has audio feedback (SFX)
- Biomes have distinct music and ambient atmosphere
- Counter-play abilities have distinct, subtler audio/VFX than core abilities
- First-time players are guided through a complete tutorial for their chosen role
- Settings are persisted and applied across sessions
- Landing page presents the game with professional visual quality
- Performance: stable 60fps on mid-range hardware with all effects enabled

### Dependencies (Consumed from Earlier Pieces)

This piece is uniquely dependent on ALL previous pieces because polish layers over every system:
- Multiplayer (piece 14): audio/VFX triggers from multiplayer events; tutorial accounts for multiplayer mode
- Progression (piece 13): unlock celebration VFX/audio when new content unlocked
- Session economy (piece 12): shop open SFX, coin burst VFX, encounter audio
- Killer gameplay (piece 10): stealth SFX, kill animation VFX, counter-play SFX
- Fed gameplay (piece 11): investigation SFX, arrest animation, counter-play SFX
- Combat system (piece 08): combat hit SFX, ability VFX, death animation
- World/maps (piece 05): biome music, ambient particles, environment lighting
- Game engine bootstrap (piece 04): loading scene extends PreloadScene, asset loader tiers

### Audio Asset Strategy

At implementation time, use placeholder audio keys mapped to free test sounds. The audio system is designed so real audio files can be swapped in without code changes — only `constants/audio.ts` sound paths need updating. Recommended royalty-free sources (for implementation notes, not binding decisions): Freesound.org, ZapSplat, Pixabay Audio.

### Success Criteria

- [ ] All role-specific SFX fire on corresponding EventBus events
- [ ] Biome music transitions smoothly on biome change
- [ ] Counter-play SFX play at 70% sfxVolume offset
- [ ] VFX: particles fire for evidence discovery, kills, arrests; disabled when reducedMotion=true
- [ ] Tutorial auto-starts for new players; completes correctly for both roles
- [ ] Counter-play introduction tooltips appear after first counter-play encounter
- [ ] Settings page: all categories functional; changes persist to localStorage immediately
- [ ] Settings: server sync debounced, fails silently with toast notification
- [ ] Landing page renders correctly SSR with Magic UI components
- [ ] High contrast mode passes WCAG AA contrast ratios
- [ ] Colorblind mode: evidence markers distinguishable by shape as well as color
- [ ] Object pools reduce garbage collection spikes during intense combat/evidence scenes
- [ ] 60fps stable on mid-range hardware with all effects on

### Alignment Notes

This is the final piece. It must not introduce new architectural patterns or change core gameplay logic. If any audio trigger requires a new EventBus event that doesn't already exist from pieces 10-14, prefer adding the event to the existing piece's implementation during polish (if minor) rather than creating workarounds in the audio system. The tutorial's counter-play introduction steps must accurately reflect the actual ability names and costs from pieces 10-11 and 13.
