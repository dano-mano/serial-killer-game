---
vision: killer-vs-fed-roguelite
sequence: 05
name: world-and-maps
group: Core Engine
group_order: 2
status: pending
depends_on:
  - "04: Scene manager (scene-keys.ts — register MapScene), Phaser game config (createGameConfig — add MapScene to scene list), EventBus (emit map-loaded, zone-entered events), asset loader utility, GAME_CONFIG constants (TILE_SIZE)"
  - "01: Shared types/constants directories in packages/shared/src/"
produces:
  - "Map generator packages/game-engine/src/world/map-generator.ts (seed-based procedural generation)"
  - "Biome definitions packages/game-engine/src/world/biomes/*.ts (14 biomes)"
  - "Shared biome types packages/shared/src/types/biome.ts"
  - "Shared biome constants packages/shared/src/constants/biomes.ts"
  - "Tile system packages/game-engine/src/world/tile-manager.ts"
  - "Shared tile types packages/shared/src/types/tiles.ts"
  - "Collision layer packages/game-engine/src/world/collision-layer.ts"
  - "Spawn system packages/game-engine/src/world/spawn-manager.ts"
  - "Camera controller packages/game-engine/src/world/camera-controller.ts"
  - "Pathfinding grid packages/game-engine/src/world/pathfinding.ts"
  - "Zone system packages/game-engine/src/world/zone-manager.ts"
  - "Map scene packages/game-engine/src/scenes/map-scene.ts"
  - "Minimap data bridge packages/game-engine/src/world/minimap-data.ts"
  - "Zustand map store apps/web/src/stores/map.ts"
created: 2026-03-17
last_aligned: never
---

# Vision Piece 05: World and Maps

> Part of vision sequence: **killer-vs-fed-roguelite**
> Status: pending | Dependencies: game engine bootstrap, project scaffold

---

## /speckit.specify Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.specify ` (note the trailing space).

----

Build the procedural map generation system that creates the playable world for each run. Maps are tile-based, procedurally generated from a seed (same seed = same map, required for multiplayer synchronization), and organized into biomes with distinct themes, layouts, and asymmetric difficulty ratings. Each map includes collision data, a zone system for triggering events, spawn points for players and NPCs, a camera controller that follows the player, and a pathfinding grid for NPC navigation.

Fourteen biomes are defined, ranging from familiar settings (rural farmland, city streets) to themed spectacles (amusement park, concert festival, subway network). Biomes have asymmetric difficulty — some favor the killer (dense crowds to blend into), others favor the fed (open spaces, surveillance infrastructure).

### Infrastructure Required from Game Engine Bootstrap

Before this piece can be implemented, the following must exist from the game engine bootstrap piece:

- **EventBus singleton**: used to emit map-loaded and zone events
- **SceneKey constants**: this piece adds the map scene key to the registry
- **Game config factory**: this piece registers the map scene in the scene array
- **Asset loader utilities**: functions for loading images, atlases, tilemaps, and resolving asset URLs
- **GAME_CONFIG constants**: specifically the tile size (32px) and AI tick rate (12 Hz), which this piece uses throughout
- **GAME_EVENTS constants**: this piece adds map-loaded, zone-entered, and zone-exited events to the existing event registry

This piece must update the scene keys registry, the event constants, and the game config factory to register the map scene.

### Procedural Map Generation

The map generator uses a seeded pseudo-random number generator (PRNG) so the same seed always produces the same map. This is critical for multiplayer — the server sends the seed to both clients, and both generate identical maps locally without transmitting tile data.

**Algorithm**: Template-based room-and-corridor generation with biome-specific overrides. This is simpler than Wave Function Collapse or BSP trees and produces reliably playable layouts:

1. Select a biome to determine map dimensions, structural templates, and tile palette
2. Initialize an empty grid (all walls)
3. Place the main structural templates for the biome (buildings, roads, features)
4. Connect structures with corridors/paths using simple BSP corridor logic
5. Place zone boundaries around semantic areas (rooms, buildings, districts)
6. Place spawn points: player spawn, NPC spawns, item locations, exit points
7. Run passability validation — confirm all spawn points are reachable

The map generator takes a seed string and produces a complete generated map containing the tile grid, zone list, spawn points, biome ID, and serialized RNG state.

### Tile System

Each tile in the map has a type and properties:

**Tile types**: floor, wall, door, water, interactable (dumpsters, lockers, crates — can hide bodies or items), hazard (environmental danger), exit (run exit point), void (impassable empty space).

**Tile properties**: type, passable (whether entities can walk on it), transparent (whether it blocks line-of-sight), and a tilesheet index for rendering.

**Map grid**: A 2D array of tile properties with width and height in tile units.

### Zones

Each zone represents a named semantic area within the map. Zones have:
- A unique ID and human-readable name (e.g., "Main Hall", "Parking Lot B")
- Bounding rectangle in tile coordinates
- A zone type that governs gameplay behavior

**Zone types**: indoor, outdoor, restricted (alarm if killer enters), crowd (dense NPC presence), isolated (few NPCs, low visibility), transit (movement corridors), surveillance (cameras present).

### Spawn Points

The spawn system tracks locations for: the player spawn, NPC spawn positions with optional role hints, item spawn positions with rarity tier (common/uncommon/rare), target spawn positions (killer's assigned targets start here), and exit points.

### Biome Data Model

Each of the 14 biomes has a configuration object defining:
- Unique ID and display name
- Map dimensions (width × height in tiles)
- Asymmetric difficulty ratings for killer and fed (1–5 scale), with rationale
- NPC density (sparse / moderate / dense / massive)
- Lighting level (dark / dim / normal / bright)
- Boolean flags: has indoors, has surveillance cameras, has restricted alarm zones
- Asset keys for ambient sound and the biome's tilesheet
- Structure template IDs for procedural placement
- Structure density and object density (0.0–1.0 floats)
- Unlock requirement: default, runs-completed threshold, achievement, or purchased

**Unlock requirement types**: Each biome specifies how it is unlocked. Default biomes are available from the first run. Others require completing a certain number of runs, earning an achievement, or purchasing. The biome catalog exports: `BIOME_CATALOG` (all 14 configs by ID), `DEFAULT_BIOMES` (the 2 launch biomes), and `BIOME_IDS` (all keys for iteration).

### Biome Catalog

All 14 biomes, each with its own definition in the biomes directory of the game engine:

---

#### 1. Rural Farmland

Open countryside with scattered farmhouses, barns, fields, and a dirt road network. Sparse population of farmers and residents.

- **Map size**: 120×90 tiles
- **NPC density**: Sparse (8–15 NPCs)
- **Lighting**: Normal (daytime), Dark (nighttime variant)
- **Killer difficulty**: 3/5 — Limited crowds to blend into; wide open sightlines make movement risky
- **Fed difficulty**: 2/5 — Open spaces make evidence trails easy to follow; few witnesses but evidence is exposed
- **Has indoors**: Yes (farmhouses, barn interiors)
- **Has surveillance**: No
- **Has restricted zones**: No
- **Killer advantage**: Large distances between structures allow approach without witnesses
- **Fed advantage**: Few hiding spots for body disposal; footprints visible in mud
- **Special zones**: Cornfield (high concealment), Barn (body disposal via hay bales), Lake (drowning disposal), Road (witnesses pass through)
- **Unlock**: Default (available from start)

---

#### 2. City Streets

Dense urban grid of blocks, storefronts, back alleys, parked cars, and pedestrian traffic. Moderate to high population.

- **Map size**: 100×100 tiles
- **NPC density**: Dense (25–40 NPCs)
- **Lighting**: Normal (street lights at night)
- **Killer difficulty**: 2/5 — Crowds provide excellent cover; alleys offer concealed movement
- **Fed difficulty**: 3/5 — Dense environment makes evidence tracking harder; many potential witnesses to interview
- **Has indoors**: Yes (shops, restaurants, apartments)
- **Has surveillance**: Yes (traffic cameras, ATM cameras)
- **Has restricted zones**: No
- **Killer advantage**: Crowds to blend into; dumpsters for disposal; multiple escape routes
- **Fed advantage**: Surveillance cameras cover main streets; witnesses are numerous
- **Special zones**: Back alley (isolated, low surveillance), Subway entrance (transit zone), Parking structure (isolated, no cameras), Convenience store (surveillance)
- **Unlock**: Default (available from start)

---

#### 3. Office Building

Multi-floor corporate office complex with cubicle farms, conference rooms, break rooms, server room, and rooftop access.

- **Map size**: 80×80 tiles (5 floors, each 80×16 tiles)
- **NPC density**: Moderate (15–25 NPCs)
- **Lighting**: Bright (fluorescent office lighting)
- **Killer difficulty**: 4/5 — Enclosed space with no escape; security desk; badge-locked zones; cameras everywhere
- **Fed difficulty**: 2/5 — Limited access points; security logs available; confined environment
- **Has indoors**: Yes (fully indoor)
- **Has surveillance**: Yes (security cameras on every floor)
- **Has restricted zones**: Yes (server room, executive suite require badge — alarm if broken into)
- **Killer advantage**: Stairwells and service elevators for unobserved movement; maintenance closets for concealment
- **Fed advantage**: Building security logs show badge swipes; cameras cover corridors; small map constrains escape
- **Special zones**: Server room (restricted, evidence terminal for fed), Break room (NPC clustering, social deduction opportunity), Rooftop (exit point, body disposal over edge)
- **Unlock**: Requires 5 runs completed

---

#### 4. Cruise Ship

Luxury ocean liner with multiple decks: casino, pool deck, dining hall, cabins corridor, engine room, and bridge.

- **Map size**: 60×200 tiles (linear ship layout, multiple decks)
- **NPC density**: Dense (30–45 NPCs — passengers and crew)
- **Lighting**: Normal (mixed indoor/outdoor)
- **Killer difficulty**: 3/5 — No escape from the ship (literally nowhere to run); crew are suspicious; locked cabins for disposal
- **Fed difficulty**: 3/5 — Ship is closed system (no one leaves); crew manifest acts as witness list; but passengers mix and disguise is plausible
- **Has indoors**: Yes
- **Has surveillance**: Yes (security cameras in corridors and casino)
- **Has restricted zones**: Yes (bridge, engine room, crew quarters)
- **Killer advantage**: Overboard disposal removes body completely; passenger crowd for blending; long corridors for chases
- **Fed advantage**: No one can leave the ship; complete manifest of passengers; crew cooperation
- **Special zones**: Casino (crowded, noisy), Pool deck (outdoor, sightlines), Engine room (isolated, loud — masks sounds), Lifeboat station (emergency exit point)
- **Unlock**: Requires 10 runs completed

---

#### 5. Amusement Park

A bustling theme park with roller coasters, carnival games, food stalls, a haunted house attraction, maintenance tunnels, and massive crowds.

- **Map size**: 150×130 tiles
- **NPC density**: Massive (50–80 NPCs — families, teenagers, costumed characters)
- **Lighting**: Bright (neon lights, colored LEDs, festive)
- **Killer difficulty**: 1/5 — Massive chaotic crowds make blending trivial; costumed mascots provide perfect cover; constant noise masks sounds
- **Fed difficulty**: 5/5 — Impossible to track one person in massive crowds; mascot costumes create identity crisis; noise disrupts witness accounts
- **Has indoors**: Yes (haunted house attraction, maintenance tunnels, administration office)
- **Has surveillance**: Minimal (only entrance and administration)
- **Has restricted zones**: Yes (maintenance tunnels, operator areas)
- **Killer advantage**: Costumes and characters provide multiple disguise opportunities; crowds so thick that kills near ride lines go unnoticed; maintenance tunnels for concealed movement and disposal
- **Fed advantage**: Administration office has attendance records; costumed characters must sign in/out; park PA system can trigger evacuation (but kills evidence)
- **Special zones**: Roller coaster queue (massive crowd, kill opportunity), Haunted house interior (pitch dark, screams expected), Maintenance tunnel network (beneath park, completely unsurveilled), Cotton candy stand (cover identity for NPCs)
- **Unlock**: Requires 15 runs completed

---

#### 6. Shopping Mall

Three-floor enclosed shopping mall with anchor stores, food court, escalators, service corridors, parking structure, and a rooftop cinema.

- **Map size**: 120×100 tiles (3 floors stacked)
- **NPC density**: Dense (35–55 NPCs — shoppers, store staff, security guards)
- **Lighting**: Bright (skylights, fluorescent retail lighting)
- **Killer difficulty**: 2/5 — Multiple floors create escape options; crowds in food court provide cover; service corridors are surveillance dead zones
- **Fed difficulty**: 3/5 — Security team is cooperative; camera coverage on ground floor is good; escalators create bottlenecks (easy to control)
- **Has indoors**: Yes (fully indoor)
- **Has surveillance**: Yes (security cameras throughout public areas; none in fitting rooms or service corridors)
- **Has restricted zones**: Yes (security office, loading dock, utility room)
- **Killer advantage**: Fitting rooms for evidence concealment; service corridors connect entire mall without cameras; loading dock for body disposal
- **Fed advantage**: Security office has camera access to all public floors; security guards patrol predictable routes and can be questioned; foot traffic cameras at entrances log everyone
- **Special zones**: Food court (crowded, high NPC density), Fitting rooms (private, no cameras), Security office (restricted, camera access for fed), Loading dock (exit point, isolated)
- **Unlock**: Requires 8 runs completed

---

#### 7. Airport Terminal

International airport terminal with departures hall, security checkpoint, gate lounges, baggage claim, duty-free shops, and service tunnels.

- **Map size**: 140×80 tiles (linear terminal layout)
- **NPC density**: Dense (30–50 NPCs — travelers, airport staff, TSA agents)
- **Lighting**: Bright (airport fluorescents)
- **Killer difficulty**: 5/5 — Hardest for killer: TSA and security everywhere; metal detectors restrict weapons; cameras at every chokepoint; exit routes extremely limited
- **Fed difficulty**: 1/5 — Ideal fed environment: complete camera coverage; ID checks mean everyone is identified; TSA cooperation; ability to lock down terminal
- **Has indoors**: Yes (fully indoor)
- **Has surveillance**: Yes (intensive — most surveilled biome)
- **Has restricted zones**: Yes (airside/post-security, service tunnels, baggage handling, jet bridges)
- **Killer advantage**: Chaotic crowds at peak hours; duty-free shops provide item sourcing; service tunnels bypass security; large international crowd makes identity harder to pin
- **Fed advantage**: Biometric ID at security; camera coverage near 100%; ability to pull flight manifests; terminal lockdown capability
- **Special zones**: Security checkpoint (bottle neck — crossing is high risk for killer), Gate lounge (trapped area — nowhere to go once past security), Service tunnel (hidden, restricted, camera-free), Baggage claim (exit zone, high chaos)
- **Unlock**: Requires 20 runs completed (hardest unlock)

---

#### 8. Abandoned Asylum / Haunted House

Decrepit psychiatric hospital, half-collapsed, with long corridors, padded cells, a morgue, operating theater, and overgrown courtyard. Minimal NPC presence.

- **Map size**: 90×90 tiles
- **NPC density**: Sparse (3–8 NPCs — urban explorers, a night watchman, trespassers)
- **Lighting**: Dark (no power — flashlight mechanics, moonlight through broken windows)
- **Killer difficulty**: 2/5 — Sparse NPCs mean fewer witnesses; building's horror atmosphere allows "screams" to go unremarked; morgue is thematic disposal
- **Fed difficulty**: 4/5 — Darkness hampers evidence collection; building layout is labyrinthine; few witnesses to interview; structural instability limits movement options
- **Has indoors**: Yes (primary setting is interior)
- **Has surveillance**: No (no power)
- **Has restricted zones**: No (all areas accessible — just dangerous)
- **Killer advantage**: Darkness as cover; noise from building (creaking, wind) masks sounds; multiple body disposal options (morgue, basement, collapsed sections); very few witnesses
- **Fed advantage**: Very few escape routes from building; small suspect pool; forensic evidence stays well-preserved in cold/damp environment
- **Special zones**: Operating theater (dramatic setting, medical tools usable as weapons or evidence), Morgue basement (body disposal, evidence), Padded cell corridor (claustrophobic chase potential), Courtyard (only exit — bottleneck)
- **Special mechanic**: Flashlight required for navigation — creates visibility asymmetry. Killer knows layout; fed must explore. Darkness can be weaponized.
- **Unlock**: Requires 12 runs completed

---

#### 9. Remote Island

A tropical island resort with beach areas, a hotel complex, jungle interior, boat dock, and a lighthouse. Surrounded by water — no leaving except via the boat dock.

- **Map size**: 160×120 tiles (island geography)
- **NPC density**: Moderate (15–25 NPCs — resort guests, hotel staff, fishermen)
- **Lighting**: Normal (bright beach, shaded jungle)
- **Killer difficulty**: 4/5 — Extremely limited escape routes (only the dock); island geography creates natural bottlenecks; small population means every face is known
- **Fed difficulty**: 3/5 — Limited escape routes are also limiting for investigation; jungle is difficult to search; body disposal in ocean is thorough
- **Has indoors**: Yes (hotel, lighthouse)
- **Has surveillance**: Minimal (hotel lobby only)
- **Has restricted zones**: No
- **Killer advantage**: Ocean disposal is the most thorough available (no body = no case); jungle provides concealment; small population means targets are isolated
- **Fed advantage**: No one can leave — boat dock is the single exit; small suspect pool; NPCs know each other by name (easy to identify stranger behavior)
- **Special zones**: Boat dock (critical — only exit, fed can lock it down), Jungle interior (no surveillance, concealment, pathfinding challenge), Hotel bar (NPC social hub, information gathering), Lighthouse (elevated view, signal for help)
- **Unlock**: Requires 18 runs completed

---

#### 10. Decaying Ghost Town

An abandoned American frontier town — saloon, general store, sheriff's office, church, houses — with tumbleweeds, dust, and a sparse population of squatters and drifters.

- **Map size**: 110×90 tiles
- **NPC density**: Sparse (5–12 NPCs — squatters, drifters, one suspicious old resident)
- **Lighting**: Normal (harsh desert sun or moonlit night variant)
- **Killer difficulty**: 3/5 — Very few people to blend with; anyone moving is suspicious by default; open sightlines across empty streets
- **Fed difficulty**: 3/5 — Sparse evidence (desert wind destroys trace evidence); few witnesses; ghost town layout offers many hiding spots
- **Has indoors**: Yes (buildings, many dilapidated)
- **Has surveillance**: No
- **Has restricted zones**: No
- **Killer advantage**: So few people that "normal behavior" is ill-defined — blending is replaced by isolation; extensive building interiors for concealment; desert environment degrades evidence faster
- **Fed advantage**: Small suspect pool (literally 5–12 people total); open sightlines mean movement is visible across the map; unusual activity is obvious in dead town
- **Special mechanic**: Evidence decay is accelerated (desert wind, heat). DNA evidence degrades in half the normal time. Fed must work faster.
- **Special zones**: Sheriff's office (historical irony — evidence storage, weapon cache), Church (NPC gathering point, moral weight), Saloon (information hub, the one social space), Mine shaft (body disposal — deep, sealed)
- **Unlock**: Requires 10 runs completed

---

#### 11. Concert Venue / Festival

An outdoor music festival with main stage, multiple smaller stages, food vendor rows, backstage areas, VIP section, camping grounds, and tens of thousands of fictional attendees represented by dense NPC clusters.

- **Map size**: 180×150 tiles
- **NPC density**: Massive (60–100 NPCs representing crowd density — largest of all biomes)
- **Lighting**: Dynamic (stage lighting, moving spots, colored floods — visibility changes with light show)
- **Killer difficulty**: 1/5 — Second-easiest for killer: crowd density makes tracking nearly impossible; music noise covers sounds; everyone is dancing/moving (movement is normal); backstage area is unmonitored
- **Fed difficulty**: 5/5 — Tied for hardest fed environment: noise makes witness interviews impossible; crowd density makes tracking impossible; stage lighting blasts evidence locations; everyone is moving constantly
- **Has indoors**: Minimal (stage production trailers, medical tent)
- **Has surveillance**: Minimal (stage cameras face the crowd, not coverage)
- **Has restricted zones**: Yes (backstage, production area, VIP)
- **Killer advantage**: Largest crowds in the game; music noise masks any sounds; crowd movement makes blending effortless; backstage provides private kill opportunities; crowd crush creates natural chaos
- **Fed advantage**: Medical tent has incident records; backstage requires wristband (limited access); production crew are identifiable by lanyards (small known-identity group)
- **Special zones**: Mosh pit (maximum chaos, physical contact normalized), Backstage (restricted, unmonitored, quiet), Medical tent (bodies brought here — opportunity and evidence), VIP area (small identifiable group)
- **Unlock**: Requires 15 runs completed

---

#### 12. Subway Network

Underground metro system with interconnected platforms, maintenance tunnels, control room, train cars, employee-only areas, and multiple station exits to the surface.

- **Map size**: 130×100 tiles (branching underground layout)
- **NPC density**: Dense (25–40 NPCs — commuters, transit workers, buskers)
- **Lighting**: Mixed (bright platforms, dim maintenance tunnels, pitch-dark service corridors)
- **Killer difficulty**: 2/5 — Underground environment limits surveillance; maintenance tunnels are camera-free; train timing creates predictable NPC movement patterns (opportunities)
- **Fed difficulty**: 3/5 — Camera coverage on platforms is good; transit records log tap-ins; maintenance tunnels are confusing to navigate; multiple exits complicate containment
- **Has indoors**: Yes (fully underground)
- **Has surveillance**: Yes (cameras on platforms and fare gates; none in service tunnels)
- **Has restricted zones**: Yes (control room, maintenance depot, driver cab)
- **Killer advantage**: Maintenance tunnels bypass cameras; train timing knowledge allows prediction; pushing from platform (accident staging); underground acoustic weirdness (sounds travel unpredictably)
- **Fed advantage**: Tap-in/tap-out records create movement log; control room has all camera feeds; transit workers know regular passengers; platform cameras have excellent coverage
- **Special zones**: Platform edge (accident staging, high tension), Maintenance tunnel (dark, camera-free, pathfinding required), Control room (restricted, camera access for fed), Service car (moving location — train currently in station creates time pressure)
- **Unlock**: Requires 8 runs completed

---

#### 13. Casino Floor

A Las Vegas-style casino with table games floor, slot machine rows, a high-roller VIP room, backstage money handling, hotel lobby connection, and a rooftop bar.

- **Map size**: 100×80 tiles
- **NPC density**: Dense (30–45 NPCs — gamblers, dealers, pit bosses, security)
- **Lighting**: Bright (no clocks, no windows — deliberately disorienting)
- **Killer difficulty**: 3/5 — Constant surveillance; security team is on-site and alert; but crowds and money-focused attention create blind spots
- **Fed difficulty**: 2/5 — Casino security cooperation; camera coverage is among the best (casinos are extremely well-monitored); facial recognition on entry; cash transactions leave no record (but camera records everything)
- **Has indoors**: Yes (fully indoor)
- **Has surveillance**: Yes (highest camera density of any biome after airport — every inch of the floor)
- **Has restricted zones**: Yes (VIP room, counting room, security office, cage)
- **Killer advantage**: Money-focused security watching for cheating, not murder; bathroom blind spots; service corridors for staff; crowd of distracted gamblers; VIP room provides isolated target access
- **Fed advantage**: Facial recognition at entry; extensive camera network; security team as extended squad; financial records of all transactions
- **Special zones**: High-roller VIP room (isolated target area, restricted access), Counting room (restricted, cash — target may be here), Rooftop bar (outdoor exit point), Security office (fed cooperation — camera access)
- **Unlock**: Requires 12 runs completed

---

#### 14. University Campus

A sprawling university with lecture buildings, library, student dorms, research labs, gymnasium, quad, and underground steam tunnels connecting buildings.

- **Map size**: 140×120 tiles
- **NPC density**: Moderate to Dense (20–35 NPCs — students, professors, campus security, maintenance)
- **Lighting**: Mixed (bright indoors, dim at night outdoors)
- **Killer difficulty**: 2/5 — Large campus with multiple escape routes; everyone looks roughly the same age (blending as student); research labs have chemicals (improvised tools); steam tunnels for unseen movement
- **Fed difficulty**: 3/5 — Campus records (ID swipes, class registration) create movement trails; campus security cooperation; but large outdoor areas are hard to cover
- **Has indoors**: Yes
- **Has surveillance**: Yes (building entrances, library, limited campus CCTV)
- **Has restricted zones**: Yes (research labs — key-card access, admin building)
- **Killer advantage**: Steam tunnels connect all buildings without camera exposure; student blending is easy; library is dark and crowded; research chemicals can be evidence modifiers
- **Fed advantage**: Campus ID card system logs movement through buildings; student directory provides identities; admin building has all records; known population (everyone is registered)
- **Special zones**: Steam tunnels (underground connection, camera-free), Library (dark corners, quiet — screams noticed), Research lab (restricted, chemicals, evidence modifiers), Quad (open outdoor space — high visibility for both)
- **Unlock**: Requires 5 runs completed

---

### Biome Launch Set

For initial release, only 4 biomes are required. The remaining 10 are defined in code but gated behind unlock requirements:

| Biome | Unlock |
|-------|--------|
| Rural Farmland | Default |
| City Streets | Default |
| Office Building | 5 runs |
| University Campus | 5 runs |

Remaining 10 biomes are implemented during this piece but unlocked through play (see unlock requirements above). This ensures players have content immediately while providing long-term progression goals.

### Tile Manager

The tile manager holds the tile grid for the current run and provides:
- Tile lookup by coordinate: returns a tile's type and properties at a given position
- Tile mutation for runtime changes: updates a tile type when bodies are placed, doors open, etc.
- Tilemap rendering: wraps Phaser's Tilemap API to render the generated grid to the screen
- Tile animation for water shimmer and hazard flicker effects

### Collision Layer

The collision layer is computed from the map grid at run start but stored separately as a boolean grid for performance. Separate from visual tiles, it only tracks passability.

Capabilities:
- Impassability check: returns whether a given tile coordinate is blocked
- Line-of-sight check: uses Bresenham's line algorithm to determine if a straight sightline is clear of walls
- Dynamic update: can toggle a tile's blocked state when doors open, bodies are placed, etc.

Line-of-sight is used by NPC perception (entity and NPC system) and evidence rendering.

### Spawn Manager

Wraps the spawn points from the generated map. Converts tile coordinates to world pixel coordinates. Provides access to:
- Player spawn position
- NPC spawn positions (with optional count limit)
- Item spawn positions (filterable by rarity tier)
- Killer target starting positions
- Valid exit point locations

### Camera Controller

Wraps Phaser's main camera with game-specific behavior:
- Sets world bounds to the map's full pixel dimensions on initialization
- Smooth-follow mode: tracks a game object with configurable lerp (0.15 for smooth camera movement)
- Zoom control: default zoom is 1.5 (zoomed in because maps are large); zoom out available via hold-key for overview
- Camera shake: for dramatic moments

### Pathfinding

A* pathfinding on the collision grid for NPC navigation. Custom implementation (approximately 50 lines) — no external library needed. A* with Manhattan distance heuristic is fast enough for 20–40 NPCs at 12 Hz AI tick rate.

Capabilities:
- Path finding: finds a path between two tile positions; returns the path as an array of tile coordinates, or null if unreachable
- Grid update: synchronizes with the collision layer when a cell's walkability changes

### Zone Manager

Manages the zone list from the generated map. Capabilities:
- Zone lookup by coordinate: returns all zones containing a given tile position (a tile can be in multiple zones)
- Zone lookup by ID: retrieves a specific zone
- Zone lookup by type: returns all zones of a given type (used by the NPC system for patrol zone assignment)

Zone transitions emit map events (zone-entered, zone-exited) when tracked entities cross zone boundaries.

### Map Scene

The main gameplay scene. Orchestrates all map subsystems:

On initialization: receives a seed and biome ID from the run manager (player and role framework). During development, hardcoded defaults are used.

On preload: loads biome-specific (deferred tier) assets — the tilesheet for this biome, NPC sprites, etc.

On create: generates the map, instantiates all subsystems (tile manager, collision layer, pathfinding grid, spawn manager, zone manager, camera controller), then emits the map-loaded event with the biome ID, map dimensions, and a zone summary.

On update: detects zone transitions by checking tracked entities against zone boundaries. Player entity integration is stubbed until the player and role framework piece.

The map scene is added to the game config's scene array as the third entry after Boot and Preload.

### Minimap Data

The minimap data bridge exports a simplified map representation to the React state layer for the minimap HUD component (player and role framework). The minimap data includes:
- Map dimensions (width and height in tiles)
- Explored tiles: a boolean grid tracking fog-of-war (which tiles the player has seen)
- Zone name and bounds list (for the minimap overlay)
- Exit point positions

An export function is called from the map scene's update loop as the player reveals new areas. Fog-of-war starts as all unexplored — tiles within a radius of the player are marked as the player moves. Tracked client-side only (not server-validated).

### Map State (React Layer)

React-side state for the current map, readable by HUD components. Tracks:
- Current biome ID and display name — set when the map-loaded event fires
- Map loaded flag — boolean for HUD to know when to render map-related UI
- Minimap data — the simplified map representation written by the map scene
- Current zone name — updated as the player moves through zone boundaries

### Edge Cases

- **Seed management for multiplayer**: The multiplayer host generates the seed (the multiplayer sync system). For singleplayer (and during this piece's development), generate a random seed at run start using Phaser's built-in random data generator. The seed must be a string.
- **Passability validation**: The generator MUST verify that player spawn and all exit points are reachable via pathfinding. If not, regenerate with a modified seed (append a retry suffix). After 3 failures, fallback to a guaranteed-valid hardcoded seed.
- **Biome-specific assets**: Each biome requires its own tilesheet. For this piece, a placeholder tilesheet (basic colored tiles) can substitute. Real art assets are added during the polish and onboarding piece.
- **Map size scaling**: Large maps (concert festival at 180×150 = 27,000 tiles) can be memory-intensive. Use lazy rendering — only process tiles near the camera. Phaser's tilemap layer supports culling for this purpose.
- **Collision layer dynamic updates**: When a body is placed on a tile or a door opens, both the collision layer and the pathfinding grid must be updated together to keep them in sync.
- **Fog of war**: The explored tiles grid starts as all-false. As the player moves, tiles within a radius are marked explored. The minimap shows only explored tiles. Unexplored tiles render as black on the minimap. This is tracked client-side only (not server-validated for performance).

### Multiplayer Determinism Requirement

All map generation must be perfectly deterministic from a given seed. The same seed and biome combination must always produce identical maps. No randomness outside the seeded random number generator. Zone placement, building positions, and spawn points must all be deterministic from seed. This is a hard requirement for multiplayer sync — if two clients generate different maps from the same seed, the game state immediately diverges.

----

## /speckit.plan Prompt

> **Usage**: Copy everything between the `----` markers below, then paste after
> typing `/speckit.plan ` (note the trailing space).

----

### Architecture Approach

Build the map generator first with a simple test biome (use rural farmland — it's the simplest layout). Validate the grid, zones, and spawn points render correctly before building the full biome catalog. Add the collision layer and pathfinding once the tile system renders. Add the zone manager last, verified by EventBus zone events firing correctly.

Define all 14 biome `BiomeConfig` objects even if only 4 are playable at launch. The config catalog costs almost nothing to define — implementation effort is in the structure templates and tilesheets, which can be placeholder initially.

### Tile and Zone Types — `packages/shared/src/types/tiles.ts`

```typescript
export type TileType = 'floor' | 'wall' | 'door' | 'water' | 'interactable' | 'hazard' | 'exit' | 'void'

export interface TileProperties {
  type: TileType
  passable: boolean
  transparent: boolean    // blocks line-of-sight
  tilesheetIndex: number  // index into the biome's tilesheet
}

export interface MapGrid {
  width: number
  height: number
  tiles: TileProperties[][]  // [row][col]
}

export type ZoneType = 'indoor' | 'outdoor' | 'restricted' | 'crowd' | 'isolated' | 'transit' | 'surveillance'

export interface Zone {
  id: string
  name: string
  bounds: { x: number; y: number; width: number; height: number }  // tile coordinates
  zoneType: ZoneType
}

export interface SpawnPoints {
  playerSpawn: { x: number; y: number }
  npcSpawns: Array<{ x: number; y: number; role?: string }>
  itemSpawns: Array<{ x: number; y: number; tier: 'common' | 'uncommon' | 'rare' }>
  targetSpawns: Array<{ x: number; y: number }>
  exitPoints: Array<{ x: number; y: number }>
}

export interface GeneratedMap {
  grid: MapGrid
  zones: Zone[]
  spawns: SpawnPoints
  biome: string
  seed: string
}
```

### Biome Types — `packages/shared/src/types/biome.ts`

```typescript
export interface BiomeDifficulty {
  killerDifficulty: 1 | 2 | 3 | 4 | 5
  fedDifficulty: 1 | 2 | 3 | 4 | 5
  rationale: string
}

export interface BiomeUnlockRequirement {
  type: 'default' | 'runs_completed' | 'achievement' | 'purchased'
  value?: number | string
}

export interface BiomeConfig {
  id: string
  name: string
  description: string
  width: number
  height: number
  difficulty: BiomeDifficulty
  npcDensity: 'sparse' | 'moderate' | 'dense' | 'massive'
  lightingLevel: 'dark' | 'dim' | 'normal' | 'bright'
  hasIndoors: boolean
  hasSurveillance: boolean
  hasRestrictedZones: boolean
  ambientSound: string
  tilesheetKey: string
  structureTemplates: string[]
  structureDensity: number     // 0.0–1.0
  objectDensity: number        // 0.0–1.0
  unlockRequirement: BiomeUnlockRequirement
}
```

### Biome Catalog — `packages/shared/src/constants/biomes.ts`

```typescript
import type { BiomeConfig } from '../types/biome'

// One file per biome in packages/game-engine/src/world/biomes/
// Import and register each here:
export const BIOME_CATALOG: Record<string, BiomeConfig> = {
  'rural-farmland': ruralFarmlandConfig,
  'city-streets': cityStreetsConfig,
  'office-building': officeBuildingConfig,
  'cruise-ship': cruiseShipConfig,
  'amusement-park': amusementParkConfig,
  'shopping-mall': shoppingMallConfig,
  'airport-terminal': airportTerminalConfig,
  'abandoned-asylum': abandonedAsylumConfig,
  'remote-island': remoteIslandConfig,
  'ghost-town': ghostTownConfig,
  'concert-festival': concertFestivalConfig,
  'subway-network': subwayNetworkConfig,
  'casino-floor': casinoFloorConfig,
  'university-campus': universityCampusConfig,
} as const

export const DEFAULT_BIOMES = ['rural-farmland', 'city-streets'] as const
export const BIOME_IDS = Object.keys(BIOME_CATALOG) as Array<keyof typeof BIOME_CATALOG>
```

### MapGenerator Class Signature — `packages/game-engine/src/world/map-generator.ts`

```typescript
import Phaser from 'phaser'
import type { MapGrid, GeneratedMap, SpawnPoints, Zone } from '@repo/shared/types/tiles'
import type { BiomeConfig } from '@repo/shared/types/biome'

export class MapGenerator {
  private rng: Phaser.Math.RandomDataGenerator

  constructor(seed: string) {
    this.rng = new Phaser.Math.RandomDataGenerator([seed])
  }

  generate(biomeConfig: BiomeConfig): GeneratedMap {
    const grid = this.initializeGrid(biomeConfig.width, biomeConfig.height)
    this.placeStructures(grid, biomeConfig)
    this.connectStructures(grid, biomeConfig)
    const zones = this.assignZones(grid, biomeConfig)
    const spawns = this.placeSpawnPoints(grid, biomeConfig, zones)
    this.validatePassability(grid, spawns)
    return { grid, zones, spawns, biome: biomeConfig.id, seed: this.rng.state() }
  }

  private initializeGrid(width: number, height: number): MapGrid { ... }
  private placeStructures(grid: MapGrid, config: BiomeConfig): void { ... }
  private connectStructures(grid: MapGrid, config: BiomeConfig): void { ... }
  private assignZones(grid: MapGrid, config: BiomeConfig): Zone[] { ... }
  private placeSpawnPoints(grid: MapGrid, config: BiomeConfig, zones: Zone[]): SpawnPoints { ... }
  private validatePassability(grid: MapGrid, spawns: SpawnPoints): void { ... } // throws on failure
}
```

### CollisionLayer — `packages/game-engine/src/world/collision-layer.ts`

```typescript
export class CollisionLayer {
  private grid: boolean[][]  // true = blocked

  constructor(mapGrid: MapGrid) {
    this.grid = mapGrid.tiles.map(row => row.map(tile => !tile.passable))
  }

  isBlocked(tileX: number, tileY: number): boolean { ... }
  hasLineOfSight(from: {x: number; y: number}, to: {x: number; y: number}): boolean { ... } // Bresenham's
  setBlocked(tileX: number, tileY: number, blocked: boolean): void { ... }
}
```

### PathfindingGrid — `packages/game-engine/src/world/pathfinding.ts`

```typescript
export class PathfindingGrid {
  private grid: boolean[][]
  private width: number
  private height: number

  constructor(collisionLayer: CollisionLayer, width: number, height: number) { ... }

  findPath(
    start: {x: number; y: number},
    end: {x: number; y: number}
  ): Array<{x: number; y: number}> | null { ... }  // null = unreachable

  updateCell(tileX: number, tileY: number, walkable: boolean): void { ... }
}
```

### CameraController — `packages/game-engine/src/world/camera-controller.ts`

```typescript
export class CameraController {
  private camera: Phaser.Cameras.Scene2D.Camera

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number) {
    this.camera = scene.cameras.main
    this.camera.setBounds(0, 0, mapWidth * GAME_CONFIG.TILE_SIZE, mapHeight * GAME_CONFIG.TILE_SIZE)
  }

  followTarget(target: Phaser.GameObjects.GameObject): void {
    this.camera.startFollow(target, true, 0.15, 0.15)
  }

  setZoom(zoom: number): void { this.camera.setZoom(zoom) }
  shake(duration: number, intensity: number): void { this.camera.shake(duration, intensity) }
}
```

Default zoom: 1.5.

### ZoneManager — `packages/game-engine/src/world/zone-manager.ts`

```typescript
export class ZoneManager {
  constructor(private zones: Zone[]) {}

  getZonesAt(tileX: number, tileY: number): Zone[] { ... }
  getZone(zoneId: string): Zone | undefined { ... }
  getZonesOfType(type: ZoneType): Zone[] { ... }
}
```

### MinimapData — `packages/game-engine/src/world/minimap-data.ts`

```typescript
import type { MapGrid, Zone, SpawnPoints } from '@repo/shared/types/tiles'

export interface MinimapData {
  width: number
  height: number
  exploredTiles: boolean[][]
  zones: Array<{ name: string; bounds: Zone['bounds'] }>
  exitPoints: Array<{ x: number; y: number }>
}

export function exportMinimapData(
  grid: MapGrid,
  exploredTiles: boolean[][],
  zones: Zone[],
  exits: SpawnPoints['exitPoints']
): MinimapData { ... }
```

### Zustand Map Store — `apps/web/src/stores/map.ts`

```typescript
'use client'
import { create } from 'zustand'
import type { MinimapData } from '@repo/game-engine/world/minimap-data'

interface MapStore {
  biomeId: string | null
  biomeName: string | null
  mapLoaded: boolean
  minimapData: MinimapData | null
  currentZone: string | null
  setBiomeId: (id: string | null) => void
  setBiomeName: (name: string | null) => void
  setMapLoaded: (loaded: boolean) => void
  setMinimapData: (data: MinimapData | null) => void
  setCurrentZone: (zone: string | null) => void
}

export const useMapStore = create<MapStore>((set) => ({
  biomeId: null, biomeName: null, mapLoaded: false, minimapData: null, currentZone: null,
  setBiomeId: (biomeId) => set({ biomeId }),
  setBiomeName: (biomeName) => set({ biomeName }),
  setMapLoaded: (mapLoaded) => set({ mapLoaded }),
  setMinimapData: (minimapData) => set({ minimapData }),
  setCurrentZone: (currentZone) => set({ currentZone }),
}))
```

### Updated Event Constants

Add to `packages/shared/src/constants/events.ts`:
```typescript
MAP_LOADED: 'game:map-loaded',
ZONE_ENTERED: 'game:zone-entered',
ZONE_EXITED: 'game:zone-exited',
```

### Key Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| Phaser | 3.90.0 | Tilemaps via `Phaser.Tilemaps.Tilemap` |
| TypeScript | 5.9.3+ | Generic types for grid operations |
| Pathfinding | Custom A* | No external library needed — keep simple |

A* is approximately 50 lines of code. Do NOT add a pathfinding library as a dependency. The constraint (40 NPCs at 12 Hz, simple grid) does not require a library.

### Implementation Order

1. Create `packages/shared/src/types/tiles.ts` — all tile, zone, spawn types
2. Create `packages/shared/src/types/biome.ts` — BiomeConfig, BiomeDifficulty types
3. Create `packages/shared/src/constants/biomes.ts` — BiomeCatalog with all 14 configs
4. Create each biome config file in `packages/game-engine/src/world/biomes/`
5. Create `packages/game-engine/src/world/map-generator.ts` — test with rural-farmland
6. Create `packages/game-engine/src/world/tile-manager.ts`
7. Create `packages/game-engine/src/world/collision-layer.ts`
8. Create `packages/game-engine/src/world/pathfinding.ts`
9. Create `packages/game-engine/src/world/spawn-manager.ts`
10. Create `packages/game-engine/src/world/zone-manager.ts`
11. Create `packages/game-engine/src/world/camera-controller.ts`
12. Create `packages/game-engine/src/world/minimap-data.ts`
13. Create `packages/game-engine/src/scenes/map-scene.ts` — update `game-config.ts` to include it
14. Create `apps/web/src/stores/map.ts`
15. Update `packages/shared/src/constants/events.ts` to add MAP_LOADED, ZONE_ENTERED, ZONE_EXITED
16. Update `packages/game-engine/src/scenes/scene-keys.ts` to add MAP
17. Write tests

### Testing Strategy

**Unit tests** (`packages/game-engine/tests/world/map-generator.test.ts`):
- Same seed + biome produces identical MapGrid (determinism test)
- Generated map has correct dimensions for each biome
- All spawn points are on passable tiles
- Player spawn is reachable from all exit points (A* path exists)

**Unit tests** (`packages/game-engine/tests/world/collision-layer.test.ts`):
- `isBlocked()` returns true for wall tiles, false for floor tiles
- `hasLineOfSight()` returns false when a wall is between two points
- `hasLineOfSight()` returns true when path is clear
- `setBlocked()` updates collision correctly

**Unit tests** (`packages/game-engine/tests/world/pathfinding.test.ts`):
- `findPath()` returns a valid path between two reachable points
- `findPath()` returns null when destination is unreachable
- `findPath()` respects `updateCell()` changes

**Unit tests** (`packages/shared/tests/constants/biomes.test.ts`):
- All 14 biomes have unique IDs
- All biome configs have required fields (width, height, difficulty ratings)
- Difficulty ratings are in valid range (1-5)
- Default biomes have 'default' unlock requirement

**E2E** (`apps/web/tests/e2e/map.test.ts`) — Playwright:
- Navigating to `/game?biome=rural-farmland&seed=test` renders a tilemap
- No JavaScript errors in console
- Canvas renders non-black pixels (map is drawn)

**Note**: Phaser tilemaps cannot be tested in Vitest (no Canvas). Map rendering is verified only in E2E tests.

### Constitution Compliance Checklist

- [x] I: No barrel files — direct imports to each biome file
- [x] III: Shared types in `packages/shared/src/types/tiles.ts`, `biome.ts`
- [x] VI: Domain-based organization — `world/biomes/` for biome configs, `world/` for world systems
- [x] XIV: EventBus for zone transition signals (one-time events)
- [x] XV: No database tables in this piece — all data is client-side runtime state. BiomeConfig is code, not DB.
- [x] XXVI: Tests in `tests/` at package root
- [x] XXX: Maps scale to viewport via camera zoom; minimap is responsive React component
- [x] XXXII: Asset loading tiers — deferred tier used for biome-specific tilesheets (loaded in MapScene.preload())

### Determinism Implementation Requirements

All random number generation in map generation MUST use the seeded RNG (never `Math.random()`). Map generation from the same seed+biome MUST produce byte-identical tile arrays. Add integration test: generate map twice with same seed, assert arrays are deep-equal. This test must pass before this piece is considered complete — it verifies the multiplayer determinism guarantee.

See `art-style-guide.md` in the vision directory for biome-specific color palettes and tileset art style (hand-drawn with hatching/cross-hatching). Tileset dimensions and format requirements are specified there.

----

## Supplemental Information

> **For /vision-alignment use only** — do NOT copy this section into speckit commands.

### Expected Outputs

When this piece is fully implemented:

- `packages/shared/src/types/tiles.ts` — `TileType`, `TileProperties`, `MapGrid`, `Zone`, `ZoneType`, `SpawnPoints`, `GeneratedMap`
- `packages/shared/src/types/biome.ts` — `BiomeDifficulty`, `BiomeConfig`, `BiomeUnlockRequirement`
- `packages/shared/src/constants/biomes.ts` — `BIOME_CATALOG`, `DEFAULT_BIOMES`, `BIOME_IDS`
- `packages/game-engine/src/world/biomes/rural-farmland.ts` (and 13 more biome files)
- `packages/game-engine/src/world/map-generator.ts` — `MapGenerator` class
- `packages/game-engine/src/world/tile-manager.ts` — `TileManager` class
- `packages/game-engine/src/world/collision-layer.ts` — `CollisionLayer` class
- `packages/game-engine/src/world/pathfinding.ts` — `PathfindingGrid` class
- `packages/game-engine/src/world/spawn-manager.ts` — `SpawnManager` class
- `packages/game-engine/src/world/zone-manager.ts` — `ZoneManager` class
- `packages/game-engine/src/world/camera-controller.ts` — `CameraController` class
- `packages/game-engine/src/world/minimap-data.ts` — `MinimapData` type, `exportMinimapData()`
- `packages/game-engine/src/scenes/map-scene.ts` — `MapScene` class
- `apps/web/src/stores/map.ts` — `useMapStore`
- Updated `packages/shared/src/constants/events.ts` — adds MAP_LOADED, ZONE_ENTERED, ZONE_EXITED
- Updated `packages/game-engine/src/scenes/scene-keys.ts` — adds MAP key
- Updated `packages/game-engine/src/config/game-config.ts` — adds MapScene to scene list

### Dependencies Consumed (from Game Engine Bootstrap)

The following must exist before this piece begins:

```typescript
// Exact signatures required:

// packages/game-engine/src/events/event-bus.ts
export const eventBus: Phaser.Events.EventEmitter

// packages/game-engine/src/scenes/scene-keys.ts
export const SceneKey: { BOOT: string; PRELOAD: string } // this piece adds MAP

// packages/game-engine/src/config/game-config.ts
export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig
// This piece adds MapScene to the scene array

// packages/game-engine/src/utils/asset-loader.ts
export function loadImages(scene: Phaser.Scene, assets: Array<{key: string; path: string; tier: AssetTier}>): void
export function loadAtlases(scene: Phaser.Scene, atlases: Array<{key: string; imagePath: string; dataPath: string}>): void
export function loadTilemaps(scene: Phaser.Scene, tilemaps: Array<{key: string; path: string}>): void
export function getAssetUrl(relativePath: string, baseUrl?: string): string

// packages/shared/src/constants/game.ts
export const GAME_CONFIG: { TILE_SIZE: 32; AI_TICK_RATE: 12; [key: string]: number }

// packages/shared/src/constants/events.ts
export const GAME_EVENTS: Record<string, string>
// This piece adds MAP_LOADED, ZONE_ENTERED, ZONE_EXITED
```

### Produces (for Downstream Pieces)

- **`CollisionLayer`** — piece 06 (entity-and-npc-system) imports `CollisionLayer` for NPC perception line-of-sight
- **`PathfindingGrid`** — piece 06 imports `PathfindingGrid` for NPC movement
- **`SpawnManager`** — piece 06 imports `SpawnManager` for NPC spawn points; piece 07 (player-and-roles) imports for player spawn
- **`ZoneManager`** — piece 06 imports for NPC zone assignment; piece 09 (evidence-system) imports for evidence zone context
- **`MapScene`** — piece 06 adds entities to MapScene; piece 07 adds the player to MapScene
- **`BIOME_CATALOG`** — piece 07 uses this for the biome selection pre-run screen
- **`useMapStore`** — piece 07's `Minimap.tsx` HUD component reads minimap data from this store
- **`CameraController`** — piece 07 calls `cameraController.followTarget(playerSprite)` when player spawns
- **`TileManager`** — piece 09 uses `setTile()` to place evidence on specific tiles; piece 10 (killer-gameplay) uses it for body disposal locations
- **`Zone` and `ZoneType` types** — piece 09 tags evidence with zone context; piece 10 uses `ZoneType.isolated` zones for kill opportunities
- **`BIOME_IDS` and `DEFAULT_BIOMES`** — piece 13 (persistent-progression) uses unlock requirements to gate biome access

### Success Criteria

- [ ] `MapGenerator` with a fixed seed produces identical maps across 10 consecutive runs (determinism)
- [ ] All 14 biome configs have valid required fields (verified by unit tests)
- [ ] Rural farmland and city streets generate maps without errors
- [ ] `CollisionLayer.hasLineOfSight()` correctly identifies blocked paths (unit tests)
- [ ] `PathfindingGrid.findPath()` finds valid paths and returns null for unreachable destinations (unit tests)
- [ ] `MapScene` starts and renders a tilemap in Playwright E2E test
- [ ] `ZONE_ENTERED` EventBus event fires when a tracked entity crosses a zone boundary
- [ ] `MAP_LOADED` EventBus event fires with correct biome ID when MapScene finishes `create()`
- [ ] `useMapStore.getState().mapLoaded` is true after MAP_LOADED fires
- [ ] No Phaser import in `apps/web/src/stores/map.ts` (verify isolation)

### Alignment Notes

This piece is sequentially dependent on the game engine bootstrap — it cannot be parallelized. However, the biome config files in `packages/shared/src/constants/biomes.ts` and `packages/shared/src/types/biome.ts` are pure TypeScript with no Phaser dependency and can be written before the game engine bootstrap is complete.

Piece 06 (entity-and-npc-system) directly consumes the map systems produced here. It cannot begin until this piece is complete. The dependency chain from here: world-and-maps → entity-and-npc-system → player-and-roles.

The biome catalog is intentionally large (14 biomes) to provide long-term content without requiring a new release. Only 4 biomes launch with the game; the remaining 10 are unlocked through gameplay progression (piece 13). This architecture decision means the biome system must support the unlock mechanic — `BiomeUnlockRequirement` is defined here and consumed by piece 13.

The asymmetric difficulty ratings are a design statement: the game intentionally has some biomes that heavily favor one role over the other. This creates strategic variety — skilled killers seek airport terminals (hardest for both, hardest for killer especially) for challenge runs; new killers learn on amusement parks and concert festivals where blending is trivially easy.
