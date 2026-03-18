---
vision: killer-vs-fed-roguelite
sequence: "19"
name: polish-and-onboarding
group: Polish
group_order: 7
status: pending
depends_on:
  - "18: GameSession type for tutorial integration and lobby polish, NetworkManager for connection state UI"
  - "17: Progression pages (trophies, equipment, loadouts) for onboarding flow guidance"
  - "16: Progression server actions for tutorial-triggered unlocks"
  - "15: Results page, run scoring, material reward display for polish"
  - "13: FedHUD, fed ability system for tutorial scripting"
  - "11: KillerHUD, killer ability system for tutorial scripting"
  - "10: EvidenceManager for tutorial evidence generation triggers"
  - "09: CombatHUD, CombatAnimations for VFX integration"
  - "07: RunManager for tutorial mode hook, PlayerRole for role-specific tutorials"
  - "06: NPC system for tutorial NPC scripting"
  - "05: MapScene for loading screen and environment VFX integration"
  - "04: EventBus for audio/VFX event subscriptions, PhaseGame component"
  - "03: Magic UI animated components for landing page, shared design system"
  - "02: Auth for onboarding flow gating"
  - "01: Pino logger, object pool utilities (shared)"
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

# Vision Piece 19: Polish and Onboarding

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: multiplayer-sync (18)

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Transform the functional game into a polished, accessible experience. This piece adds audio (biome music, SFX, ambient), visual effects (particles, screen effects, scene transitions), tutorial flows for first-time players (covering both roles and introducing counter-play concepts), WCAG AA accessibility features, performance optimization (object pooling, viewport culling), and a polished landing page. Settings are persisted to localStorage and optionally to Supabase. This is the final piece — it touches all systems to enhance without modifying their core logic.

### Design Principle for Polish

Polish does not change gameplay logic — it augments feedback, smooths flow, and reduces friction. Every audio and VFX addition should reinforce the game's asymmetric tension: the killer's audio cues are dark and stealthy; the fed's audio cues are procedural and investigative. Screen effects communicate information (red flash on detection, blue pulse on evidence discovery) without obscuring gameplay.

### Dependencies (Inline — Do Not Reference Other Documents)

From piece 01: string UUID identifiers and ISO 8601 timestamps; database error and not-found error types; structured logger; environment config.

From piece 02: browser-side and server-side Supabase clients.

From piece 03: standard UI components (AppButton, AppCard, AppDialog, AppInput, AppToast; PageLayout, GameLayout, AuthLayout) and Magic UI animated components (AnimatedBeam, BlurFade, BorderBeam, MagicCard, MarqueeDemo, and others available in the vendor directory — never modify these, only compose them).

From piece 04: EventBus with emit and on methods; scene keys for boot, preload, map, combat, shop, and loading scenes.

From piece 05: the 14 biomes (rural farmland, city streets, office building, cruise ship, amusement park, shopping mall, airport terminal, abandoned asylum, remote island, ghost town, concert venue, subway network, casino floor, university campus).

From piece 07: player role (killer or fed).

From piece 09: status effect structure (ID, name, type as buff or debuff, remaining duration in milliseconds).

From piece 10: evidence types (footprint, DNA, weapon trace, body, witness, surveillance, broken lock, disturbed scene, false evidence, informant report).

From piece 17: trophy (ID, name, rarity) and equipment (ID, name, rarity) structures.

From piece 18: game session (ID, status).

### New Data Entities

**Sound effect**: Identifies a single audio clip available for playback. Described by its Phaser audio key (used for preloading), asset file path, default volume (0 to 1), and pool size (how many simultaneous instances are allowed, typically 3 to 5 for commonly used effects).

**Music track**: Identifies a background music piece. Described by its audio key, asset file path, optional biome association (universal tracks have no biome), and optional loop start and end points in seconds for seamless looping.

**Ambient loop**: Identifies a continuous background atmosphere sound. Described by its audio key, asset path, associated biome, and default volume (ambient typically runs at 0.3 to 0.5).

**Audio settings**: The user's preferences for all audio output. Contains master volume (0 to 1), music volume (0 to 1, relative to master), SFX volume (0 to 1, relative to master), ambient volume (0 to 1, relative to master), and a mute flag.

**Graphics settings**: Controls the visual fidelity and motion preferences. Contains flags for particle effects enabled, screen shake enabled, and reduced motion (which mirrors the system's prefers-reduced-motion preference and disables particles and shake). Also contains a target frame rate choice of 60 or 30 frames per second.

**Accessibility settings**: Controls assistive technology features. Contains a high contrast flag, colorblind mode (none, protanopia, deuteranopia, or tritanopia), text scale multiplier (1, 1.25, or 1.5), a keyboard navigation flag, and a flag for screen reader announcements.

**Control settings**: The full key binding map for the game. Contains bindings for move up, move down, move left, move right, interact, abilities 1 through 5, open inventory, open map, open suspect board (fed only), sprint, and sneak. Each binding is a keyboard key string with defaults of WASD for movement, E for interact, 1-5 for abilities, I for inventory, M for map, Tab for suspect board, Shift for sprint, and Ctrl for sneak.

**User settings**: The complete settings record for a user. Contains the user ID, audio settings, graphics settings, accessibility settings, control settings, and a last-updated timestamp.

**Tutorial step**: A single step in an interactive tutorial. Each step has a unique ID, an instruction string shown to the player, an optional UI element or game object to highlight, an optional EventBus event that marks the step as complete when it fires, an optional auto-advance timer in milliseconds (used when no event is being waited on), and an optional camera focus position.

### Audio System

The audio manager is a singleton wrapping Phaser's built-in audio system. It provides volume controls for each category (music, SFX, ambient), biome-aware music transitions with crossfading on biome change, SFX pooling allowing multiple simultaneous instances per sound key, auto-fade on scene transitions, and respects the mute flag and individual volumes. It also respects the reduced motion accessibility setting by disabling dynamic audio panning and effects when motion sensitivity is active.

**Biome music assignments**: Each biome has a distinct musical mood and a corresponding track key used for preloading. City: tense urban jazz. Rural: sparse acoustic. Cruise ship: eerie lounge. Office building: tense corporate ambient. Amusement park: distorted carnival. Shopping mall: uncanny elevator music. Airport: suspenseful minimal. Abandoned asylum: dark ambient horror. Remote island: isolated nature. Ghost town: western tension. Concert venue: muffled crowd plus tension. Subway network: underground drone.

**Role audio perspective**: When playing as killer, a subtle low-frequency drone plays underneath the biome music. When playing as fed, a procedural investigation layer (subtle clock ticking, paper rustle sounds) plays underneath the biome music.

**SFX catalog** (categories and representative events):
- Investigation: evidence discovered, evidence quality upgraded, arrest succeeded, arrest failed (combat), suspect board updated
- Stealth: kill performed, body disposed, stealth broken
- Counter-play: fake evidence planted, witness silenced, surveillance jammed, rough interrogation performed, entrapment triggered
- Combat: combat hit, player damaged, ability used
- UI: shop opened, item purchased, encounter triggered
- Progression: trophy unlocked, skill unlocked

Counter-play ability SFX use darker, more morally ambiguous sounds to reinforce their risk/reward nature. Counter-play SFX play at 70% of master SFX volume by default — subtler than core ability SFX to feel appropriately clandestine. This offset is design-enforced and cannot be changed individually by the user.

### VFX System

The VFX manager is a singleton using Phaser's built-in particle system with object pooling. All VFX respect the particles enabled and screen shake enabled graphics settings.

**Screen effects**: Red flash on stealth detection, blue pulse on evidence discovery, vignette for persistent tension states. Screen shake on significant impacts.

**Particle effects**: Blood splatter on kills (small, medium, large intensity), evidence discovery pulse (color-coded by evidence type), arrest animation, unlock celebration (rarity-appropriate), coin burst on earning session coins.

**Evidence discovery colors** by type: footprint = grey dust, DNA = green sparkle, witness = orange glow, weapon trace = red shimmer, body = dark purple pulse, surveillance = blue scan ring. Fake evidence appears identical to its real equivalent — the deception is visually maintained.

**Counter-play VFX**: Surveillance jamming shows a static interference grid expanding from killer position over the target zone. Entrapment setup trigger shows a brief red spotlight on the decoy NPC. Illegal surveillance (fed) shows a subtle green tint on camera icons in the zone. Rough interrogation shows screen desaturation during the interrogation scene.

**Biome ambient particles**: Each biome has appropriate environmental particles. City: rain drops and exhaust particles. Abandoned asylum: dust motes and flickering shadow. Concert venue: stage light beams and confetti. Subway network: train dust and light flicker. Rural: fireflies at night and falling leaves.

**Reduced motion behavior**: When reduced motion is enabled (via settings or the browser's prefers-reduced-motion media query), all particle effects are disabled, screen shake is disabled, screen flash is replaced with a brief border color change (1 frame), and transitions use a cut instead of a fade.

### Animation Manager

Centralizes all character animation definitions, extending piece 06's sprite manager. Adds smooth idle-to-walk-to-run transitions with easing, context-sensitive animations (disguise change, body disposal, forensic examination), combat polish (hit stagger, knockout fall, dodge roll), counter-play animations (intimidation lean-in, evidence plant crouch, subtle camera jam gesture that maintains stealth feel), and interaction feedback animations (handshake for interview, badge flash for witness compulsion).

### Tutorial System

The tutorial system is overlay-based — it activates during a real run rather than in a separate tutorial level. When a user selects a role for the first time, the tutorial automatically begins. Tutorial steps are scripted sequences that highlight UI elements, optionally move the camera to points of interest, and wait for the player to perform specific actions before advancing. Players can skip the entire tutorial at any time. The tutorial complete flag is stored per role in localStorage — each role's tutorial is independent.

**Killer tutorial steps** (9 steps):
1. Welcome message explaining the killer's objective: eliminate targets and dispose of evidence. Auto-advances after 5 seconds.
2. Movement tutorial: use WASD to move, Shift to sprint, Ctrl to sneak. Waits for the player to move.
3. Target identification: the orange-marked NPC is the first target. Waits for the player to approach.
4. Kill interaction: press E to interact and select a kill method. Waits for the target eliminated event.
5. Evidence awareness: evidence has been generated and the fed will find it. Find the disposal site (marked in purple). Waits for player to approach disposal.
6. Disposal: dispose of the body to reduce evidence. Waits for body disposed event.
7. Shop introduction: session coins earned, shop is marked on minimap between objectives. Auto-advances after 5 seconds.
8. Counter-play preview: explains deception abilities (fake evidence, witness silencing). Highlights the locked Deception tree icon. Auto-advances after 8 seconds.
9. Tutorial complete message: good luck, the fed is searching. Sets tutorial complete flag.

**Fed tutorial steps** (9 steps):
1. Welcome message explaining the fed's objective: gather evidence, identify the killer, make an arrest. Auto-advances after 5 seconds.
2. Movement tutorial: use WASD to move, E to interact with NPCs and evidence. Waits for the player to move.
3. Scanner ability: press Q to activate the scanner — blue markers show nearby evidence. Waits for the evidence discovered event.
4. Evidence examination: examine evidence by pressing E on it. Higher quality evidence is more valuable. Waits for forensic examination to be performed.
5. Witness interviews: NPCs marked with an exclamation point have witnessed something. Waits for the witness interviewed event.
6. Suspect board: open the Suspect Board with Tab — suspects are filtered as evidence is gathered. Waits for the suspect board to open.
7. Arrest readiness: when case strength reaches 80%, a clean arrest is possible. Target a suspect and press E. Auto-advances after 8 seconds.
8. Counter-play preview: explains interrogation abilities (pressure witnesses, set up entrapment). Highlights the locked Interrogation tree icon. Auto-advances after 8 seconds.
9. Tutorial complete message: find the killer — they're already acting. Sets tutorial complete flag.

**Counter-play introduction**: After a player's first encounter with a counter-play ability (regardless of whether the tutorial has been completed), a contextual tooltip appears. For the killer: when an NPC they intimidated is flagged as silenced in the fed's interface, a tooltip explains that silenced witnesses cannot be easily interviewed and the fed must use more aggressive tactics. For the fed: when encountering a silenced witness, a tooltip explains the witness is too frightened to talk and unconventional methods may be needed but come with risk.

**Tutorial overlay**: Renders at the bottom-center of the screen as an instruction card with step indicator dots (step X of Y). A skip button appears at the top right. Highlighted game elements receive a pulsing CSS border overlay. An arrow points toward the highlighted element. The instruction card has an accessible live region so screen readers announce each step automatically. If the player skips, the tutorial complete flag is still set — the tutorial never re-shows. A "Replay Tutorial" option is available in Settings under Gameplay.

### Settings System

Settings cover four categories: audio, graphics, accessibility, and controls.

**Persistence strategy**: Settings are saved to localStorage immediately on every change (no delay). If the user is logged in, changes are also debounced to the server (saving 2 seconds after the last change). On app load, settings are read from localStorage immediately for fast application, then fetched from the server and merged (server wins on conflict). If the server save fails, localStorage already has the latest values — settings are not lost, and a toast notification reads "Settings saved locally — cloud sync will retry." Retry happens on the next settings change. Offline use is fully supported via localStorage without any error shown.

**Accessibility auto-initialization**: The prefers-reduced-motion browser media query initializes the reduced motion setting to true. The prefers-contrast: high media query initializes the high contrast setting to true. These are initial values only — the user's explicit saved settings override media queries after the first save.

**Settings page sections**:
1. Audio: master volume slider, music/SFX/ambient sliders, mute toggle, preview button that plays a test sound
2. Graphics: particle effects toggle, screen shake toggle, target FPS radio (60 or 30), reduced motion toggle
3. Accessibility: high contrast toggle, colorblind mode selector (none/protanopia/deuteranopia/tritanopia), text scale radio (1/1.25/1.5), keyboard navigation toggle, screen reader announcements toggle
4. Controls: key binding grid — clicking a cell then pressing a key remaps that action. Reset to defaults button per section. Two actions cannot share the same key — the settings page shows a conflict warning and blocks save until resolved. Escape and Print Screen cannot be remapped (reserved system keys).

All controls meet WCAG AA: labels on every input, visible focus on all elements, fully keyboard navigable without a mouse.

**Live settings application**: Settings changes made while a run is in progress apply immediately via EventBus events. Volume, graphics, and accessibility changes are live. Control remapping during an active run takes effect after the run ends to prevent mid-run confusion.

### Accessibility Features

**Screen reader announcements**: A singleton component in the root layout provides accessible live regions (both polite and assertive). When screen reader announcements are enabled in settings, key game events are announced: evidence found (type and updated case strength percentage), suspect board updated (number of suspects remaining), arrest ready (case strength percentage), target eliminated (killer perspective), detection alert, counter-play activated (ability name), and run complete (win or loss).

**Focus management**: All dialogs (shop, encounter, suspect board) trap focus within themselves while open. Tab cycling stays within the open modal. Focus returns to the element that triggered the dialog when it closes.

**High contrast mode**: Adds a high contrast class to the root HTML element. All text uses maximum contrast (pure black or white). UI backgrounds use flat colors with no gradients. Evidence markers on the minimap are larger and use distinct shapes in addition to colors. HUD meters have thick borders and text labels alongside color indicators.

**Colorblind mode**: Adds a colorblind mode class to the root HTML element. CSS filters and alternative color schemes are applied. Evidence type icons use both color and shape (circle, triangle, square) — information is never conveyed by color alone. Alert levels use patterns or hatching in addition to red/yellow/green. All color-coded information has a secondary indicator (icon, label, or pattern).

### Performance Optimization

**Object pooling**: A generic object pool manages pre-allocated instances of frequently created and destroyed objects. The pool supports acquiring an available instance, releasing an instance back to the pool, and reporting active and total pool counts. Pools are implemented for: particle emitters (20 per preset), projectiles for ranged attacks (10), floating damage text objects (15), evidence highlight markers on the map (50), and NPC entity objects (40, with inactive NPCs returned to pool and active NPCs borrowed).

**Viewport culling**: A viewport culler checks whether world-space coordinates fall within the camera's visible area. NPCs more than 800 pixels from the camera center have physics updates disabled and animations paused — only their position is updated at 2Hz. Evidence markers are culled by zone rather than per-object distance. Particles beyond 600 pixels are culled. Ambient sounds more than 1000 pixels from the player are muted using Phaser's spatial audio system.

**Performance targets**: 60fps on mid-range devices (laptop GPU, 4 CPU cores, 8GB RAM). 30fps on low-end devices (integrated graphics, 2 CPU cores) — player can select the 30fps target in graphics settings. NPC AI updates at 10Hz (every 3 physics frames at 30Hz), not every frame. Evidence proximity queries use a spatial hash grid for fast lookups, re-indexed when the NPC pool is updated.

### Loading Scene

The loading scene replaces the existing preload scene with a polished loading UI featuring a progress bar with an animated gradient, randomly selected loading tips (20 or more per role), a blurred atmospheric background from the current biome, and an estimated time remaining based on asset tier sizes. It transitions to the map scene with a fade-in after all critical and standard tier assets are loaded.

**Loading tips** (role-specific, shown during run start):

Killer tips: "Disposing of bodies in water is thorough — but leaves traces in the riverbank soil." / "A jammed camera covers your tracks, but a sharp-eyed agent knows which zones go dark." / "Fake evidence convinces the naive. Evidence chain analysis exposes the creative."

Fed tips: "Silenced witnesses can still be coerced — if you're willing to get your hands dirty." / "Off-the-books forensics are faster, but an attorney can have them thrown out." / "Entrapment only works if the killer doesn't notice the decoy is too convenient."

### Landing Page

A polished marketing landing page rendered server-side for SEO. Sections:

**Hero**: Game title with animated gradient text. Tagline: "One kills. One investigates. Only one gets away." Call-to-action buttons for "Play Now" (goes to role selection) and "How to Play" (goes to tutorial). Hero visual shows a split-screen of killer and fed perspectives.

**Asymmetric Gameplay**: Two side-by-side cards with hover effects. Killer card uses a dark theme with stealth visuals and a list of killer abilities. Fed card uses a blue theme with investigation visuals and a list of fed abilities. A note explains that both roles unlock counter-play abilities to undermine each other.

**Biomes Section**: Horizontally scrolling marquee of biome screenshots with caption "14 procedurally generated biomes — each run is unique."

**Progression**: An animated beam diagram showing the progression loop: Run → Materials → Skill Trees → Counter-Play Abilities → Next Run.

**Call to Action**: "Ready to play?" with an animated button and an optional player count display if analytics are available.

All Magic UI animations respect prefers-reduced-motion (via component props or CSS override). All images have alt text. Color contrast meets WCAG AA (4.5:1 minimum for normal text, 3:1 for large text).

### Database Table

**User settings**: Stores per-user preferences in the database. One row per user. Fields: user ID (primary key, references auth users), audio settings (flexible JSON), graphics settings (flexible JSON), accessibility settings (flexible JSON), control settings (flexible JSON), and last updated timestamp. Settings subcategories are stored as flexible JSON because the schema evolves frequently — adding a new control binding or accessibility option does not require a database migration. Row-level security ensures users can only read and write their own settings row.

### Server Actions

**Save settings**: A server action that validates and persists user settings. Validates that audio volumes are each within the 0 to 1 range, that target FPS is either 60 or 30, that colorblind mode is a valid value, that each key binding is a valid keyboard key string (no empty strings, no control sequences), and that the user ID in the request matches the authenticated session user. Returns the saved settings on success.

### EventBus to Settings Bridge

Settings changes from React components must reach Phaser systems. Audio settings changes trigger the audio manager to apply the new settings. Graphics settings changes trigger the VFX manager to apply the new settings. Control settings changes trigger the Phaser input manager to rebind keys. The settings store emits these events after writing to localStorage, and Phaser systems listen for them on initialization.

### Edge Cases

- **First launch (no tutorial shown)**: Check localStorage for tutorial-complete flags per role. If missing, the tutorial auto-starts on the first run with that role. Flags are set after tutorial completes or is skipped. Each role's flag is independent.
- **Audio not permitted (browser policy)**: Web Audio API requires a user interaction before sound can play. The audio manager checks the AudioContext state on initialization. If suspended, audio is deferred until the first click or keypress (standard web approach). No error is shown — audio silently becomes available after the first interaction.
- **Reduced motion + VFX conflict**: If reduced motion is enabled, all particle effects are replaced with instant color flashes (1 frame). Screen shake is completely disabled. Loading transitions use cut instead of fade.
- **Colorblind mode + evidence markers**: Evidence type markers on the map use both color and SVG icon shape. The colorblind filter is applied via a CSS filter on the game canvas — it affects the entire Phaser canvas including evidence markers. SVG icons ensure readability even with the filter applied.
- **Control remapping conflicts**: If two actions share the same key, the settings page shows a conflict warning and blocks save until resolved. Escape and Print Screen cannot be remapped (reserved system keys).
- **Settings page during active run**: Volume, graphics, and accessibility changes apply immediately via EventBus. Control remapping during a run takes effect after the run ends.
- **Server settings sync failure**: localStorage already saved — settings not lost. Toast notification reads "Settings saved locally — cloud sync will retry." Retry on next settings change.
- **Tutorial skip**: Tutorial complete flags are set even on skip — the tutorial never re-shows. A "Replay Tutorial" option is available in Settings under Gameplay.
- **Counter-play SFX volume**: Counter-play SFX play at 70% of master SFX volume — a design-enforced offset the user cannot override per-ability.

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

Polish systems wrap existing systems — they don't replace them. AudioManager hooks into existing EventBus events. VFXManager responds to the same events. Tutorial steps wait for existing EventBus events (no new events needed in most cases). Object pools wrap existing entity and particle creation. This keeps the piece additive and reduces regression risk.

Audio assets are placeholders at implementation time — the system is implemented with placeholder audio keys, and real audio files are dropped in without code changes.

### File Structure

- `packages/shared/src/types/audio.ts` — `SoundEffect`, `MusicTrack`, `AmbientLoop`, `AudioSettings` interfaces
- `packages/shared/src/types/settings.ts` — `GraphicsSettings`, `AccessibilitySettings`, `ControlSettings`, `UserSettings` interfaces (imports `AudioSettings` from audio.ts)
- `packages/shared/src/constants/audio.ts` — all sound keys, default volumes, fade durations, biome-to-track-key map
- `packages/game-engine/src/audio/audio-manager.ts` — singleton AudioManager class
- `packages/game-engine/src/vfx/vfx-manager.ts` — singleton VFXManager class
- `packages/game-engine/src/vfx/presets/combat-vfx.ts` — hit effects, death animations, ability VFX presets
- `packages/game-engine/src/vfx/presets/evidence-vfx.ts` — discovery sparkle, scan pulse, arrest animation presets
- `packages/game-engine/src/vfx/presets/environment-vfx.ts` — ambient particles, weather, lighting presets per biome
- `packages/game-engine/src/vfx/presets/ui-vfx.ts` — coin burst, unlock celebration, level-up glow presets
- `packages/game-engine/src/animations/animation-manager.ts` — AnimationManager class extending piece 06 sprite manager
- `packages/game-engine/src/tutorial/tutorial-manager.ts` — TutorialManager class
- `packages/game-engine/src/tutorial/tutorials/killer-tutorial.ts` — `TutorialStep[]` for killer (9 steps)
- `packages/game-engine/src/tutorial/tutorials/fed-tutorial.ts` — `TutorialStep[]` for fed (9 steps)
- `packages/game-engine/src/scenes/loading-scene.ts` — polished loading scene extending PreloadScene
- `packages/game-engine/src/utils/object-pool.ts` — generic `ObjectPool<T>` class with 5 concrete pool instantiations
- `packages/game-engine/src/utils/culling.ts` — `ViewportCuller` class
- `apps/web/src/app/page.tsx` — Server Component landing page (SSR for SEO)
- `apps/web/src/app/settings/page.tsx` — Client Component settings page (4 sections)
- `apps/web/src/components/app/game/hud/TutorialOverlay.tsx` — Client Component reading tutorial state from Phaser via EventBus → Zustand
- `apps/web/src/components/app/common/accessibility/ScreenReaderAnnouncer.tsx` — singleton in root layout, aria-live regions
- `apps/web/src/components/app/common/accessibility/FocusManager.tsx` — focus trapping for dialogs
- `apps/web/src/stores/settings.ts` — Zustand settings store
- `apps/web/src/dal/settings/user-settings.ts` — `getSettings`, `updateSettings`, `upsertSettings`
- `apps/web/src/app/actions/settings/save-settings.ts` — Server Action with Zod validation
- `supabase/migrations/XXX_user_settings.sql` — `user_settings` table with RLS

### Database Schema

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

JSONB rationale: Settings subcategories are JSONB because the schema evolves frequently. Adding a new control binding or accessibility option requires only a code-side default update — no migration. Trade-off: JSONB cannot be queried by individual setting without path operators, which is acceptable since settings are always loaded and saved as complete category objects.

### TypeScript Types

```typescript
// packages/shared/src/types/audio.ts
export interface SoundEffect {
  key: string;       // Phaser audio key for preloading
  path: string;      // asset path (relative to Azure Blob Storage URL or /public)
  volume: number;    // 0-1 default volume
  poolSize: number;  // how many simultaneous instances (3-5 for common SFX)
}

export interface MusicTrack {
  key: string;
  path: string;
  biome?: Biome;     // biome-specific tracks; undefined = universal
  loopStart?: number; // loop point in seconds for seamless looping
  loopEnd?: number;
}

export interface AmbientLoop {
  key: string;
  path: string;
  biome: Biome;
  volume: number;    // ambient typically 0.3-0.5
}

export interface AudioSettings {
  masterVolume: number;  // 0-1
  musicVolume: number;   // 0-1, relative to master
  sfxVolume: number;     // 0-1, relative to master
  ambientVolume: number; // 0-1, relative to master
  isMuted: boolean;
}

// packages/shared/src/types/settings.ts
import { AudioSettings } from './audio';

export interface GraphicsSettings {
  particlesEnabled: boolean;   // true by default
  screenShakeEnabled: boolean; // true by default
  reducedMotion: boolean;      // mirrors prefers-reduced-motion; disables particles+shake
  targetFps: 60 | 30;         // 60 default; 30 for low-end devices
}

export interface AccessibilitySettings {
  highContrast: boolean;
  colorblindMode: 'NONE' | 'PROTANOPIA' | 'DEUTERANOPIA' | 'TRITANOPIA';
  textScale: 1 | 1.25 | 1.5; // relative text size multiplier
  keyboardNavigation: boolean;
  screenReaderAnnouncements: boolean;
}

export interface ControlSettings {
  moveUp: string;          // default 'w'
  moveDown: string;        // default 's'
  moveLeft: string;        // default 'a'
  moveRight: string;       // default 'd'
  interact: string;        // default 'e'
  ability1: string;        // default '1'
  ability2: string;        // default '2'
  ability3: string;        // default '3'
  ability4: string;        // default '4'
  ability5: string;        // default '5'
  openInventory: string;   // default 'i'
  openMap: string;         // default 'm'
  openSuspectBoard: string; // default 'tab' (fed only)
  sprint: string;          // default 'shift'
  sneak: string;           // default 'ctrl'
}

export interface UserSettings {
  userId: string;
  audio: AudioSettings;
  graphics: GraphicsSettings;
  accessibility: AccessibilitySettings;
  controls: ControlSettings;
  updatedAt: string;       // ISO 8601
}
```

### AudioManager Class

```typescript
// packages/game-engine/src/audio/audio-manager.ts
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

Biome-to-track-key map (defined in `constants/audio.ts`):

| Biome | Mood | Track Key |
|-------|------|-----------|
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

### VFXManager Class

```typescript
// packages/game-engine/src/vfx/vfx-manager.ts
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
  stealthBreakFlash(x: number, y: number): void;
  arrestAnimation(targetX: number, targetY: number): void;
  unlockCelebration(x: number, y: number, rarity: string): void;
  coinBurst(x: number, y: number, amount: number): void;

  // Environment
  biomeAmbientParticles(biome: Biome): void;
  setLighting(ambientColor: number, intensity: number): void;
}
```

### TutorialManager Class

```typescript
// packages/game-engine/src/tutorial/tutorial-manager.ts
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
  advance(): void;               // called on step completion or skip
  skip(): void;                  // skip entire tutorial
  getCurrentStep(): TutorialStep | null;
  isActive(): boolean;
  onComplete(callback: () => void): void;
}
```

**Killer tutorial steps** (`killer-tutorial.ts` — `TutorialStep[]` with 9 entries):

| # | Instruction | waitForEvent / autoAdvanceMs |
|---|-------------|------------------------------|
| 1 | "Welcome, Killer. Eliminate your targets and dispose of the evidence." | autoAdvanceMs: 5000 |
| 2 | "Use WASD to move. Hold Shift to sprint. Hold Ctrl to sneak." | wait: player moves |
| 3 | "The orange-marked NPC is your first target. Approach them cautiously." | wait: player near target |
| 4 | "Press E to interact. Select a kill method." | wait: `killer:target-eliminated` |
| 5 | "Evidence has been generated. The fed will find it. Find a disposal site (marked in purple)." | wait: player near disposal |
| 6 | "Dispose of the body to reduce evidence." | wait: `killer:body-disposed` |
| 7 | "You have earned session coins. A shop is marked on your minimap — visit it between objectives." | autoAdvanceMs: 5000 |
| 8 | "Advanced: unlock Deception abilities to plant fake evidence and silence witnesses." (highlights Deception tree icon) | autoAdvanceMs: 8000 |
| 9 | "Tutorial complete. Good luck — the fed is searching for you." | sets tutorial complete flag |

**Fed tutorial steps** (`fed-tutorial.ts` — `TutorialStep[]` with 9 entries):

| # | Instruction | waitForEvent / autoAdvanceMs |
|---|-------------|------------------------------|
| 1 | "Welcome, Agent. Gather evidence, identify the killer, and make an arrest." | autoAdvanceMs: 5000 |
| 2 | "Use WASD to move. Press E to interact with NPCs and evidence." | wait: player moves |
| 3 | "Press Q to activate your Scanner ability. Blue markers show nearby evidence." | wait: `fed:evidence-discovered` |
| 4 | "Examine the evidence by pressing E on it. Higher quality evidence is more valuable." | wait: forensic examination performed |
| 5 | "NPCs marked with ! have witnessed something. Interview them for leads." | wait: `fed:witness-interviewed` |
| 6 | "Open your Suspect Board (Tab). Suspects are filtered as you gather evidence." | wait: SuspectBoard opens |
| 7 | "When your Case Strength meter reaches 80%, you can make a clean arrest. Target a suspect and press E." | autoAdvanceMs: 8000 |
| 8 | "Advanced: unlock Interrogation abilities to pressure witnesses and set up entrapment." (highlights Interrogation tree icon) | autoAdvanceMs: 8000 |
| 9 | "Tutorial complete. Find the killer — they're already acting." | sets tutorial complete flag |

### TutorialOverlay Component

```typescript
// apps/web/src/components/app/game/hud/TutorialOverlay.tsx
// "use client" — reads tutorial state from Phaser via EventBus → Zustand
interface TutorialOverlayProps {
  step: TutorialStep | null;
  stepIndex: number;
  totalSteps: number;
  onSkip: () => void;
}
```

Layout: bottom-center instruction card with step indicator dots. Skip button at top-right. Highlighted elements get a pulsing border overlay (CSS, not Phaser). Arrow pointing toward highlighted element. Instruction card uses `role="status"` and `aria-live="polite"` for screen reader step announcements.

### Settings Store

```typescript
// apps/web/src/stores/settings.ts
interface SettingsStore {
  settings: UserSettings;
  isLoaded: boolean;

  // Initialize from localStorage, then merge server settings if logged in
  initialize(serverSettings?: UserSettings): void;

  updateAudio: (audio: Partial<AudioSettings>) => void;
  updateGraphics: (graphics: Partial<GraphicsSettings>) => void;
  updateAccessibility: (accessibility: Partial<AccessibilitySettings>) => void;
  updateControls: (controls: Partial<ControlSettings>) => void;

  saveToLocalStorage: () => void;
  saveToServer: () => Promise<void>;  // calls save-settings Server Action
}
```

Persistence: `saveToLocalStorage()` on every change (immediate). `saveToServer()` debounced 2 seconds after last change (logged-in only). On app load: read localStorage → apply immediately → fetch server → merge (server wins). Server failure: silent with toast notification.

### DAL and Server Action Signatures

```typescript
// apps/web/src/dal/settings/user-settings.ts
export interface UserSettingsDTO {
  userId: string;
  audio: AudioSettings;
  graphics: GraphicsSettings;
  accessibility: AccessibilitySettings;
  controls: ControlSettings;
  updatedAt: string;
}

export async function getSettings(userId: string): Promise<Result<UserSettingsDTO | null, DatabaseError>>;
export async function updateSettings(
  userId: string,
  settings: Partial<Omit<UserSettingsDTO, 'userId' | 'updatedAt'>>
): Promise<Result<UserSettingsDTO, DatabaseError>>;
export async function upsertSettings(
  userId: string,
  settings: UserSettingsDTO
): Promise<Result<UserSettingsDTO, DatabaseError>>;
```

```typescript
// apps/web/src/app/actions/settings/save-settings.ts
// Server Action with Zod validation:
// - audio volumes: 0-1 range for each field
// - graphics.targetFps: must be 60 or 30
// - accessibility.colorblindMode: must be valid enum value
// - controls: each key must be a valid keyboard key string (no empty, no control sequences)
// - userId must match session user (cannot save settings for another user)
```

### ObjectPool Class

```typescript
// packages/game-engine/src/utils/object-pool.ts
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

// Concrete pools:
// ParticlePool      — Phaser particle emitters (pool size: 20 per preset)
// ProjectilePool    — physics bodies for ranged attacks (pool size: 10)
// DamageNumberPool  — floating damage text objects (pool size: 15)
// EvidenceMarkerPool — evidence highlight objects on map (pool size: 50)
// NPCPool           — NPC entity objects (pool size: 40)
```

### ViewportCuller Class

```typescript
// packages/game-engine/src/utils/culling.ts
class ViewportCuller {
  setViewport(camera: Phaser.Cameras.Scene2D.Camera): void;
  isInViewport(x: number, y: number, margin?: number): boolean;
  cullEntities(entities: Entity[]): { visible: Entity[]; hidden: Entity[] };
}
```

Culling thresholds: NPCs > 800px from camera center → disable physics, pause animations (position ticks at 2Hz). Evidence markers → zone-based culling (not per-object distance). VFX beyond 600px → culled. Ambient audio > 1000px → muted via Phaser spatial audio.

### Landing Page Structure

```
apps/web/src/app/page.tsx — Server Component (SSR for SEO)

[Hero]
  - AnimatedGradientText: game title
  - Tagline: "One kills. One investigates. Only one gets away."
  - CTA: "Play Now" (→ /game/select-role) + "How to Play" (→ /tutorial)
  - Hero visual: split-screen killer vs fed perspectives

[Asymmetric Gameplay]
  - Two MagicCard components side-by-side with hover effect
  - Killer card: dark theme, stealth visual, killer ability list
  - Fed card: blue theme, investigation visual, fed ability list
  - Note: "Both roles unlock counter-play abilities to undermine each other"

[Biomes Section]
  - Marquee of biome screenshots
  - Caption: "14 procedurally generated biomes — each run is unique"

[Progression]
  - AnimatedBeam: Run → Materials → Skill Trees → Counter-Play Abilities → Next Run

[CTA]
  - ShimmerButton: "Ready to play?"
  - Optional player count display
```

All Magic UI animations accept a `reducedMotion` prop or respond to CSS prefers-reduced-motion. All images have alt text. Color contrast: ≥ 4.5:1 for normal text, ≥ 3:1 for large text.

### EventBus to Settings Bridge

| EventBus Event | Phaser System Action |
|---|---|
| `settings:audio-updated` | `AudioManager.applySettings(newAudioSettings)` |
| `settings:graphics-updated` | `VFXManager.applySettings(newGraphicsSettings)` |
| `settings:controls-updated` | Phaser `InputManager` rebinds keys |

Settings store emits these events after `saveToLocalStorage()` completes. Phaser systems register listeners during initialization.

### Key Implementation Decisions

- AudioManager and VFXManager are Phaser singletons (instantiated in MapScene or a dedicated plugin)
- Tutorial overlay uses React (TutorialOverlay.tsx via Zustand), not Phaser — consistent with HUD pattern
- Settings persistence: localStorage for immediate availability, server for cross-device sync
- Object pooling: implement for particles and NPCs first (highest impact); projectiles second
- Viewport culling: zone-based culling is simpler and sufficient (don't need per-object distance culling for most entities)
- Landing page: Server Component for SEO, no client-side data fetching needed for marketing content
- Counter-play SFX: design-enforced 70% volume offset applied in AudioManager.playSFX() for counter-play keys; not exposed to user settings

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
- [x] XXX: Responsive design — landing page and settings page responsive at all viewport sizes
- [x] XXXI: Progressive enhancement — landing page functional without JS (SSR); audio disabled gracefully without user gesture
- [x] XXXII: Asset loading tiers — loading scene respects critical/standard/deferred tiers defined in PreloadScene

### Art Style Integration

The loading screen uses an ink-splatter animation (black ink expanding on parchment-colored background) rendered as a sprite sheet, not a procedural shader. Comic panel scene transitions (panel borders expanding to fill screen, then collapsing into the new scene) are implemented as a Phaser Camera effect with a border overlay sprite. PostFX shader integration: register halftone dot pattern and paper texture grain shaders in the `rendering/` pipeline directory. The loading scene triggers `registerPipelines(game)` to ensure PostFX is active before first gameplay frame. All VFX presets (combat, evidence, environment, UI) must follow the onomatopoeia and speed-line style from the art style guide. See `art-style-guide.md` in the vision directory for full PostFX shader specifications, loading screen ink-splatter timing, and comic panel transition dimensions.

----

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
- Multiplayer (piece 18): audio/VFX triggers from multiplayer events; tutorial accounts for multiplayer mode
- Progression (piece 17): unlock celebration VFX/audio when new content unlocked
- Session economy (piece 15): shop open SFX, coin burst VFX, encounter audio
- Killer gameplay (piece 11): stealth SFX, kill animation VFX, counter-play SFX
- Fed gameplay (piece 13): investigation SFX, arrest animation, counter-play SFX
- Combat system (piece 09): combat hit SFX, ability VFX, death animation
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

This is the final piece. It must not introduce new architectural patterns or change core gameplay logic. If any audio trigger requires a new EventBus event that doesn't already exist from pieces 11-18, prefer adding the event to the existing piece's implementation during polish (if minor) rather than creating workarounds in the audio system. The tutorial's counter-play introduction steps must accurately reflect the actual ability names and costs from pieces 11 and 13.
