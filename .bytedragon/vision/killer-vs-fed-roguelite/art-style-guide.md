---
vision: killer-vs-fed-roguelite
name: art-style-guide
type: reference
status: active
created: 2026-03-18
last_updated: 2026-03-18
---

# Art Style Guide

> **Type**: Reference document (non-numbered, not part of the speckit cycle)
> **Authority**: Single source of truth for all visual specifications in this vision sequence, per Constitution Principle IV (Centralized Branding). Individual vision pieces reference this guide rather than duplicating style specifications.

---

## 1. Art Style Overview

### The Visual Identity

The game uses a **comic-book cel-shaded art style** rendered entirely in 2D. The look draws from noir comics (Frank Miller's Sin City, classic crime noir illustration) combined with the bold, outlined aesthetic associated with Borderlands -- but translated into 2D sprite art rather than 3D real-time rendering.

The core visual language:
- **Thick black ink outlines** on every character, prop, and structural element
- **Flat color fills** with no smooth gradients -- all tonal changes are hard edges or hatching
- **Ink hatching** for mid-tone and deep shadows (parallel strokes and cross-hatching)
- **Limited color palettes** per biome, anchored by the noir base palette
- **Comic-book VFX**: onomatopoeia text bursts, speed lines, impact frames, ink splatter

### The Hybrid Approach

Because 3D cel-shading techniques (Sobel edge detection, quantized lighting ramps, procedural ink-line generation on geometry) do not apply to 2D sprites, the comic-book look is achieved through a two-layer hybrid system:

**Layer 1 -- Baked Art Style (Primary, ~90% of the visual identity)**

All sprites, tiles, and VFX are pre-rendered with the comic-book aesthetic. This is the performance-safe foundation that looks correct even with all post-processing disabled. Every asset is drawn with thick outlines, flat color fills, and ink-style shadow treatment before it enters the game.

**Layer 2 -- PostFX Enhancement (Optional, enhances the baked art)**

One to two lightweight WebGL shader passes add screen-level comic-book effects: halftone dot patterns in shadow areas and subtle paper texture grain. These can be toggled off in graphics settings for lower-end hardware.

This hybrid ensures:
- The game looks distinctly comic-book even on devices that cannot run shaders (Canvas fallback)
- PostFX enhances rather than creates the style (graceful degradation)
- Performance budget stays within the 60fps target on mid-range devices
- The baked art carries 100% of the visual identity independently

---

## 2. Color Palette

### Base Noir Palette

The foundation color palette is defined in `packages/ui-theme/src/tokens/colors.ts` and mirrored as CSS custom properties in the `@theme inline` block of `apps/web/src/app/globals.css`. All values below are authoritative -- game art assets must use these exact hex values for palette consistency.

**Backgrounds and Surfaces**

| Token | Hex | Role |
|-------|-----|------|
| `background` | `#0a0a0f` | Page background, deepest layer |
| `surface` | `#12121a` | Card/panel backgrounds |
| `surfaceElevated` | `#1a1a25` | Elevated surfaces, hover states |
| `border` | `#2a2a3a` | Borders, dividers |
| `borderSubtle` | `#1e1e2d` | Subtle separators |

**Text**

| Token | Hex | Role |
|-------|-----|------|
| `textPrimary` | `#e8e8f0` | Primary text (near-white) |
| `textSecondary` | `#9090a8` | Secondary text (muted) |
| `textMuted` | `#60607a` | Tertiary text, placeholders |
| `textInverse` | `#0a0a0f` | Text on light backgrounds |

**Killer / Accent Colors**

| Token | Hex | Role |
|-------|-----|------|
| `accent` | `#c41e3a` | Primary crimson -- killer theme, danger, action |
| `accentHover` | `#e02040` | Hover/active state for accent |
| `accentSubtle` | `#3a0a14` | Subtle accent background |
| `accentForeground` | `#ffffff` | Text on accent backgrounds |

**Fed / Investigation Colors**

| Token | Hex | Role |
|-------|-----|------|
| `fed` | `#1e5ba8` | Primary institutional blue -- authority, investigation |
| `fedHover` | `#2470cc` | Hover/active state for fed |
| `fedSubtle` | `#0a1e3a` | Subtle fed background |
| `fedForeground` | `#ffffff` | Text on fed backgrounds |

**Status Colors**

| Token | Hex | Role |
|-------|-----|------|
| `success` | `#22c55e` | Positive outcomes |
| `warning` | `#f59e0b` | Caution states |
| `danger` | `#ef4444` | Error, critical |
| `info` | `#3b82f6` | Informational |

**Sprite Outline**

| Color | Hex | Role |
|-------|-----|------|
| Pure black | `#000000` | All character and structural outlines |

### Comic VFX Accent Colors

These supplement the base palette for in-game comic-book effects. They must be added to `packages/ui-theme/src/tokens/colors.ts` alongside the existing tokens.

| Token | Hex | Role |
|-------|-----|------|
| `impactYellow` | `#FFD700` | Onomatopoeia text fills (hits, impacts) |
| `exclamationOrange` | `#FF8C00` | Exclamation indicators, alert VFX |

### Biome Accent Palettes

Each biome has a distinct limited color palette within the noir framework. Biome palettes are constrained to 4-6 dominant colors plus the universal black outline and base noir tones. These palettes guide tileset creation and environment art -- they are not tokenized in ui-theme (they are art direction for asset creators).

| Biome | Primary Palette | Shadow Treatment | Mood |
|-------|----------------|------------------|------|
| Rural Farmland | Muted greens, warm browns, sky blue | Light hatching on fields | Quiet menace under pastoral surface |
| City Streets | Concrete grays, neon accents, asphalt | Heavy cross-hatching in alleys | Urban noir, rain-slicked darkness |
| Office Building | Sterile whites, fluorescent yellow-green, carpet blue | Minimal shadows (bright) | Corporate unease |
| Cruise Ship | Rich burgundy, gold trim, ocean blue | Medium hatching on wood panels | Luxury concealing danger |
| Amusement Park | Saturated primary colors, carnival gold | Distorted shadows (fun gone wrong) | Cheerful horror |
| Shopping Mall | Retail white, brand colors, tile beige | Sharp overhead shadows | Consumerism as camouflage |
| Airport | Terminal gray, signage blue/red, runway black | Stark fluorescent shadows | Surveillance state |
| Abandoned Asylum | Decayed green, rust orange, mold black | Maximum cross-hatching | Classic horror setting |
| Remote Island | Jungle green, sand yellow, coral | Dappled leaf shadow patterns | Isolation and exposure |
| Ghost Town | Dust brown, weathered wood, bleached sky | Heavy hatching, aged ink lines | Desolation |
| Concert Venue | Stage purple, crowd dark, spotlight white | Dramatic contrast (spotlight vs dark) | Sensory overload hiding violence |
| Subway Network | Tunnel black, tile white, rail silver | Deep shadows, minimal fills | Claustrophobic noir |
| University Campus | Academic red brick, lawn green, library wood | Medium shadows, orderly | Intellectual hunting ground |
| Harbor District | Dock wood, shipping container colors, sea gray | Wet reflections as hatching | Industrial noir waterfront |

### Color Token Architecture

All game-visible color values flow through the centralized token system:

```
packages/ui-theme/src/tokens/colors.ts     (TypeScript constants -- Phaser reads these)
    |
apps/web/src/app/globals.css @theme inline  (CSS custom properties -- React/Tailwind reads these)
    |
Tailwind utility classes                    (bg-accent, text-fed, etc.)
```

Phaser game code imports color values from `packages/ui-theme/src/tokens/colors.ts` directly. React UI code uses Tailwind classes that resolve to the CSS custom properties. Both pathways consume the same authoritative hex values.

---

## 3. Sprite Specifications

### Character Sprites

| Property | Value | Rationale |
|----------|-------|-----------|
| Frame size | 48x48 pixels | Characters occupy ~1.5 tiles at 32px tile size. Provides readable detail for outlines and expressions at 1280x720 canvas. |
| Perspective | Top-down / 3/4 view | Heads slightly visible above shoulders, like classic top-down RPGs |
| Directions | 4 cardinal (up, down, left, right) | Per animation state |
| Frames per state | 4-6 | Sufficient for comic-book frame-by-frame feel |
| Total frames per variant | ~128-192 | 4 directions x 8 states x 4-6 frames |
| Atlas layout | One PNG atlas per NPC role category | Each variant is a row in the atlas |

**Animation States (per direction)**:
1. `idle` (4 frames) -- breathing/subtle motion
2. `walk` (6 frames) -- standard movement
3. `run` (6 frames) -- sprint/flee
4. `work` (4-6 frames) -- role-specific activity
5. `sit` (4 frames) -- seated position
6. `talk` (4-6 frames) -- conversation gesture
7. `flee` (6 frames) -- panicked movement
8. `die` (4-6 frames) -- collapse

### Outline Treatment

The outline is the single most important visual element that separates comic-book style from generic pixel art.

| Element | Weight | Notes |
|---------|--------|-------|
| Exterior silhouette | 3px | Heaviest weight, defines character boundary |
| Interior form lines | 1-2px | Clothing seams, facial features, equipment edges |
| Detail accents | 1px | Wrinkles, texture suggestions, hair strands |

**Line quality**: Lines must have slight irregularity -- not perfectly geometric, but hand-drawn feeling. Uniform pixel-perfect outlines read as "vector art" rather than "comic art." The irregularity should be subtle: occasional 1px jitter in otherwise straight lines, slightly rounded corners where angular corners might be expected.

**Outline color**: Pure black (`#000000`) for maximum contrast against the dark noir backgrounds.

### Color Fill Approach

- **Flat fills only** -- no smooth gradients within outline regions
- Shadows are hard-edged shapes: a darker flat color adjacent to the base color, separated by an ink line or hard edge
- This creates the characteristic "color hold" look where shadows are distinctly delineated shapes
- Maximum 4-6 fill colors per character variant: base color, shadow color, highlight color, 1-2 accent colors, plus the black outline
- **Killer-aligned NPCs**: warmer/darker tones, crimson accents (`#c41e3a`)
- **Fed-aligned NPCs**: cooler/institutional tones, blue accents (`#1e5ba8`)
- **Neutral NPCs**: muted earth tones and grays

### Shadow Treatment

Two techniques, mixed per context:

1. **Hard shadow shapes**: Solid darker flat fill with ink-line border. Used for form shadows on characters and buildings. This is the Borderlands approach translated to 2D.

2. **Ink hatching**: Parallel pen strokes for mid-tone shadows, cross-hatching for deep shadows. Used selectively on environmental elements and large surfaces. Classic comic-book technique for tonal variation.

### Tile Sprites

| Property | Value |
|----------|-------|
| Tile size | 32x32 pixels |
| Structural outlines | 2-3px (walls, buildings, furniture, vehicles) |
| Floor outlines | Minimal -- texture lines only (wood grain, concrete cracks, grass tufts) |

Walls and solid objects use heavier outlines than floors to create natural visual layering without a dynamic lighting system.

### Disguise Mechanic Visual Support

All characters of the same NPC role use the same base sprite silhouette and animation frames -- only clothing color/pattern variants differ (3-5 variants per role). Since the player character uses the same SpriteManager system, a player blending in is visually identical to NPCs of the same variant. The bold outlines and flat colors make subtle differences harder to spot than they would be in a detailed realistic style, which reinforces the disguise mechanic.

---

## 4. Animation Standards

### Frame-by-Frame Animation (NOT Skeletal)

All character and VFX animation uses frame-by-frame sprite animation. Skeletal animation (Spine, DragonBones) is explicitly excluded.

**Why frame-by-frame over skeletal:**
1. **Aesthetic authenticity**: Comics are sequential still images. Frame-by-frame preserves this -- each frame is a distinct "drawing." Skeletal animation interpolates between poses, creating smooth motion that looks un-comic-like.
2. **Outline integrity**: With skeletal animation, outlines would need to be drawn on the mesh at runtime, which is complex in 2D and often produces artifacts at joint connections. Pre-drawn frames have perfect outlines.
3. **Artistic control**: The comic-book style depends on specific shadow placement, line weight variation, and silhouette choices that change per frame. Skeletal rigs cannot reproduce this level of per-frame art direction.
4. **Simpler pipeline**: No rigging, no bone hierarchy, no weight painting. Draw frames, export atlas, load in Phaser.

**Tradeoff acknowledged**: Frame-by-frame produces larger atlas files than skeletal animation (more unique pixel data per animation). The 4-6 frames per state keeps this manageable. At 48x48 per frame with ~192 frames per variant, each character variant atlas is approximately 450KB-600KB compressed PNG.

### Atlas Format

| Property | Value |
|----------|-------|
| Format | PNG spritesheet + JSON Hash atlas |
| JSON variant | JSON Hash (Phaser native texture atlas format) |
| Export tool | TexturePacker or Aseprite built-in export |
| Maximum atlas size | 2048x2048 (preferred) / 4096x4096 (absolute max) |
| Pixel format | RGBA (transparency required for outlines) |
| Compression | PNG (lossless -- preserves hard edges and flat colors) |

**Atlas organization**: One PNG atlas per NPC role category. Each variant occupies a row in the atlas. This matches the SpriteManager design in piece 06.

### Animation Playback

- Animation is driven by Phaser's native animation system (`this.anims.create()`)
- No external animation library required
- Frame rate per animation state is defined in the animation config (typically 8-12fps for comic feel -- deliberately slower than smooth animation)
- Phaser handles direction-based animation selection via animation keys (e.g., `walk-down`, `walk-left`)

---

## 5. Environment and Tileset Style

### General Approach

Environments are drawn as if they are panels in a comic book. The top-down view functions like a bird's-eye panel, and each biome has a distinct visual mood achieved through palette and ink treatment rather than realistic rendering.

### Tileset Rendering Rules

- All structural elements (walls, buildings, furniture, vehicles) have thick black outlines (2-3px at 32px tile scale)
- Floor tiles have minimal outlines -- just enough texture lines to suggest material (wood grain lines, concrete cracks, grass tufts)
- Walls and solid objects use heavier outlines than floors to create natural visual layering
- Each tile is a flat color fill with optional ink-hatching for shadow areas
- No smooth gradients or blended textures -- every tonal change is a hard edge or hatching pattern

### Shadow and Lighting in Tiles

Since the game uses a top-down perspective with Arcade Physics (no dynamic lighting engine), shadows are baked into the tiles:

| Context | Shadow Approach |
|---------|----------------|
| Indoor tiles | Consistent overhead fluorescent lighting implied (minimal shadow, bright flat fills) |
| Outdoor tiles | Directional shadow implied from upper-left (matching comic-book convention for light source) |
| Dark/dim biomes | Heavier ink hatching on all surfaces, reduced palette saturation |
| Shadow overlays | Separate tile entries in the tileset (e.g., `floor-shadow-NW` for northwest shadow overlay) |

### Environmental Detail Style

| Element | Rendering Approach |
|---------|-------------------|
| Trees and vegetation | Loose, gestural ink shapes (not pixel-precise leaves). Bold silhouettes with minimal interior detail, in the manner of Frank Miller's Sin City. |
| Buildings | Clean outlines with architectural detail lines. Interior walls show framed doorways and windows as negative space. |
| Props (dumpsters, benches, cars) | Simplified comic shapes with bold outlines. Detail is suggested through 2-3 carefully placed ink lines rather than pixel-level rendering. |
| Water | Bold wavy ink lines with flat color fill. No animated water reflections -- static like a comic panel. |

### Tileset Format

| Property | Value |
|----------|-------|
| Tile size | 32x32 pixels |
| Tileset image format | PNG |
| Tilemap format | Tiled JSON (Phaser has native Tiled tilemap support) |
| Tiles per biome | ~200-400 |
| Tileset atlas size | 1024x1024 per biome |

---

## 6. VFX Catalog

### Comic-Book Onomatopoeia

The signature visual feature. When significant gameplay events occur, stylized onomatopoeia text appears in the scene as Phaser sprite overlays.

| Event | Text | Visual Style | Duration | Phaser Feature |
|-------|------|-------------|----------|----------------|
| Melee hit | THWACK! / CRACK! / SLASH! | Jagged burst shape, yellow fill (`#FFD700`), red outline | 0.5s with scale-pop | Sprite + Tween (scale, alpha) |
| Ranged hit | BANG! / POP! / ZZZAP! | Star burst shape, orange fill (`#FF8C00`), black outline | 0.5s with rotation | Sprite + Tween (angle, alpha) |
| Kill (stealth) | *silence* (intentional absence) | Brief ink-splatter particle only | 0.3s | Particle emitter |
| Kill (violent) | CRUNCH! / SNAP! | Large jagged shape, crimson fill (`#c41e3a`) | 0.8s with screen shake | Sprite + Camera shake |
| Body discovered | GASP! | Oval speech bubble shape, white fill | 1.0s above discovering NPC | Sprite + Tween (y offset, alpha) |
| Evidence found | ! (exclamation) | Classic comic exclamation, blue fill (`#1e5ba8`) | 1.0s above fed character | Sprite + Tween |
| NPC alerted | !! / ? / ?! | Above NPC head, yellow fill (`#FFD700`) | Persists while alerted | Sprite (follow NPC position) |
| Ability activation | Varies by ability | Styled text in ability's color theme | 0.5s | Sprite + Tween |

**Implementation**: Pre-rendered as PNG sprites at multiple sizes. Spawned as Phaser GameObjects with tween animations (scale pop, rotation, fade). Object-pooled per piece 15 performance specifications.

### Speed Lines and Motion Effects

When characters sprint or flee, radial speed lines emanate from behind them.

| Property | Value |
|----------|-------|
| Technique | Phaser particle emitter with long, thin white/gray line particles |
| Direction | Radiate outward from the character's trailing edge |
| Count | 6-10 lines per burst |
| Duration | Each line lasts 0.3-0.5s |
| Accessibility | Disabled when `prefers-reduced-motion` is active |

### Impact Frames

On significant hits (critical damage, ability impacts), the game briefly displays a high-contrast "impact frame" mimicking the comic-book technique of a single dramatic panel inserted into action sequences.

| Property | Value |
|----------|-------|
| Duration | 2-3 frames (~50ms) |
| Effect | Background briefly desaturates or inverts to pure black/white |
| Focus | Attacking character and hit effect rendered in high contrast |
| Implementation | Brief PostFX shader pass (desaturation) or white overlay sprite with blend mode |

### Ink Splatter Effects

| Context | Application |
|---------|-------------|
| Stealth kill | Brief ink-splatter particle effect at the event location |
| Detection alert | Red ink-splatter vignette splattering in from screen edges (replaces plain red flash) |
| Evidence discovery | Blue concentric line rings expanding from discovery point ("pulse" effect) |
| Tension indicator | Ink-drawn border that tightens as heat/suspicion increases |

### Evidence Markers

Evidence markers on the game map use comic-style indicator icons.

| Property | Value |
|----------|-------|
| Style | Each evidence type gets a distinct **shape** (for colorblind accessibility) |
| Outline | Thick black outlines matching the overall art style |
| Animation | Subtle pulse animation drawing attention without being obtrusive |
| Accessibility | Distinguishable by shape AND color -- color alone is never sufficient |

### Ambient Environment Particles

Biome-specific atmospheric particles rendered via Phaser's particle emitter.

| Biome Type | Particle | Style |
|------------|----------|-------|
| Outdoor rainy | Rain streaks | Thin white diagonal lines |
| Indoor dusty | Dust motes | Small gray irregular shapes |
| Night scenes | Fireflies | Small yellow dots with glow |
| Abandoned | Floating debris | Small dark irregular shapes |

---

## 7. UI Style

### Comic Panel Framing

All in-game UI is styled to feel like it exists within comic panels.

| UI Element | Treatment |
|------------|-----------|
| Dialog boxes | Comic panels with thick black borders (3-4px) and slightly irregular corners -- a subtle hand-drawn corner treatment, not perfectly rounded |
| HUD elements | Enclosed in panel-style frames with surface background colors |
| Menus (full-screen) | Panel grid layout where each menu section is a distinct comic panel |
| Minimap | Thick ink-outline border, simplified flat-color map representation, evidence markers and NPC dots in the same thick-outline style at minimap scale |

### Speech Bubbles and Dialog

| Element | Font | Style |
|---------|------|-------|
| NPC dialog | Bangers (comic font) | Comic-style speech bubbles with pointed tails directed at the speaking character |
| Fed investigation notes | JetBrains Mono | Rectangular "caption box" -- gray background, noir narrator aesthetic |
| Killer internal monologue | Bangers (italic) | Dark thought-bubble (cloud shape with circles instead of a pointed tail) |
| UI labels, menus | Inter | Clean, readable -- no comic styling |
| Headers, HUD labels | Bebas Neue | Bold, uppercase display treatment |

### Comic Font Integration

The Bangers font extends the existing font stack (Inter, Bebas Neue, JetBrains Mono). It follows the same three-part token chain established for all project fonts:

**Step 1 -- Font Loading** (`apps/web/src/app/fonts.ts`):
```
export const bangers = Bangers({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bangers',
  display: 'swap',
})
```

**Step 2 -- CSS Theme Variable** (`apps/web/src/app/globals.css` @theme inline block):
```
--font-comic: var(--font-bangers), var(--font-display);
```

**Step 3 -- Typography Token** (`packages/ui-theme/src/tokens/typography.ts`):
```
fontComic: 'Bangers, Bebas Neue, Inter, sans-serif'
```

**Variable naming convention**: `--font-bangers` is the next/font loading variable (tool-specific, like `--font-inter` and `--font-bebas-neue`). `--font-comic` is the semantic @theme variable (like `--font-sans`, `--font-display`, `--font-mono`). This two-layer pattern matches the existing convention in piece 03.

**Usage rules**:
- **Used for**: Onomatopoeia text, exclamation indicators, dramatic game event text, ability names in HUD, NPC speech bubble dialog
- **NOT used for**: Body text, menu labels, investigation notes (those keep existing fonts)
- React components access via Tailwind class `font-comic` or CSS `var(--font-comic)`
- Phaser game code reads `typography.fontComic` from `packages/ui-theme/src/tokens/typography.ts`

### Scene Transitions

| Transition | Effect | Reduced Motion Fallback |
|------------|--------|------------------------|
| Major scene change | "Page turn" -- current scene slides off left, new scene slides in from right | Instant cut |
| Building entry/exit | Panel-wipe -- new scene revealed behind a shrinking panel border | Instant cut |
| Standard | These replace generic fade transitions when comic style is active | Instant cut |

### React / Phaser Isolation

The game's architecture maintains strict separation between React and Phaser rendering (CLAUDE.md rule 7). This applies to UI elements:

| Side | Responsibility | Examples |
|------|---------------|----------|
| React | SVG panel borders, HUD overlays, dialog boxes, menus, minimap chrome | AppCard comic-panel variant, speech bubble SVG shapes, evidence list UI |
| Phaser | PostFX shaders, in-game VFX, onomatopoeia sprites, speed lines, particle effects, evidence marker sprites | Halftone shader, paper texture shader, THWACK! sprites, ink splatter particles |

SVG elements are React components in `apps/web/src/components/app/common/`. PostFX and VFX are Phaser code in `packages/game-engine/src/rendering/`. These two domains do not cross-import.

---

## 8. PostFX Pipeline

### Pipeline Architecture

```
Camera Pipeline Chain:
1. Game renders scene normally (sprites, tiles, particles)
2. [PostFX Pass 1] Halftone shader: converts dark areas to Ben-Day dot pattern
3. [PostFX Pass 2] Paper texture shader: overlays subtle paper grain
4. Output to screen
```

Each PostFX shader is a separate class extending `Phaser.Renderer.WebGL.Pipelines.PostFXPipeline`. They are registered in the game config's `pipeline` property and activated on the main camera.

### Shader Specifications

**Pass 1: Halftone Shader**

| Property | Value |
|----------|-------|
| Purpose | Ben-Day dot pattern in shadow areas (signature comic effect) |
| Performance cost | Low (simple math per pixel) |
| Priority | High -- most impactful visual enhancement |
| Technique | Sample pixel luminance; below threshold, replace with dot pattern at configurable density |
| Uniforms | `dotSize` (float), `threshold` (float), `resolution` (vec2) |

**Pass 2: Paper Texture Shader**

| Property | Value |
|----------|-------|
| Purpose | Subtle grain overlay for hand-drawn feel |
| Performance cost | Very low (single texture sample + blend) |
| Priority | Medium -- enhances immersion |
| Technique | Sample a tiling paper grain texture, blend with scene output at low opacity |
| Uniforms | `grainIntensity` (float), `grainTexture` (sampler2D), `time` (float, for subtle animation) |

**Shaders NOT recommended for V1** (diminishing returns when baked art already has the style):

| Shader | Why excluded |
|--------|-------------|
| Posterize | Baked art already has flat colors -- posterization adds no visible benefit |
| Outline Enhancement | Baked outlines are already thick -- runtime edge detection adds cost without visible improvement |
| Ink Bleed | Subtle irregularity is better achieved in the art itself than via noise-based post-processing |

### Performance Budget

| Metric | Value |
|--------|-------|
| Maximum PostFX passes | 2 |
| Canvas resolution | 1280x720 (matches GAME_CONFIG.BASE_RESOLUTION) |
| Pixel operations per frame | ~1.84 million (1280 x 720 x 2 passes) |
| Pixel operations per second at 60fps | ~110 million |
| GPU headroom | Intel UHD 620 handles 4-6 simple passes; 2-pass budget leaves significant headroom |
| Total texture memory estimate | ~35-50MB (well within browser WebGL limit of 256MB+) |

### Graceful Degradation (4 Levels)

PostFX must be toggleable via the graphics settings (piece 15). The game implements four quality levels, each independently functional:

| Level | What is Active | When to Use |
|-------|---------------|-------------|
| **Full** | Baked comic art + Halftone PostFX + Paper Texture PostFX + all particle VFX | Default for WebGL-capable devices |
| **Reduced** | Baked comic art + Halftone PostFX only + reduced particles | Mid-range devices showing occasional frame drops |
| **Minimal** | Baked comic art only (all PostFX disabled) + particles disabled | Low-end devices or user preference |
| **Canvas Fallback** | Baked comic art only (no WebGL features at all) | Devices/browsers without WebGL support |

Each level looks good because the baked art carries the style independently. The PostFX enhances but never creates the visual identity.

**Implementation notes**:
- Graphics settings toggle calls `camera.removePostPipeline()` / `camera.setPostPipeline()`
- Phaser.AUTO selects WebGL when available, falls back to Canvas automatically
- PostFX is silently unavailable in Canvas mode (no error handling needed)
- The `POST_FX_ENABLED_DEFAULT: true` and `MAX_POST_FX_PASSES: 2` constants are added to GAME_CONFIG

### PostFX File Location

PostFX pipeline classes live in `packages/game-engine/src/rendering/`. This is a new directory within the game engine package, following the existing monorepo structure. Shader GLSL source is embedded as template literals within the pipeline class files.

---

## 9. Asset Pipeline

### Recommended Tools

| Purpose | Recommended | Alternative | Notes |
|---------|------------|-------------|-------|
| Character sprites | Aseprite ($20, one-time) | Krita (free), Piskel (free/web) | Native sprite atlas export, animation timeline, onion skinning. Industry standard for 2D game art. |
| Tileset creation | Aseprite + Tiled (free) | LDtk (free) | Aseprite for drawing individual tiles. Tiled for assembling tilemaps and exporting JSON. Phaser has native Tiled support. |
| SVG UI elements | Figma (free tier) or Inkscape (free) | Adobe Illustrator | For panel borders, icons, speech bubble shapes. |
| PostFX shaders | VS Code + GLSL Linter | ShaderToy (prototyping) | GLSL fragment shaders written directly as code. Prototype in ShaderToy, integrate into Phaser PostFXPipeline. |
| Texture packing | TexturePacker ($40) or Free Texture Packer | Aseprite built-in | Combines individual sprites into optimized atlases. TexturePacker exports Phaser-compatible JSON Hash format. |
| Color palette | Coolors or Lospec | Manual hex codes | Useful for defining limited biome palettes. Export as ASE (Aseprite palette) or JSON. |

### Pipeline Flow

```
1. Art Creation (Aseprite / Krita)
   |
   +--> Character sprites: individual frames at 48x48px
   +--> Tileset tiles: individual tiles at 32x32px
   +--> VFX sprites: onomatopoeia, effects, indicators
   |
2. Atlas Packing (TexturePacker / Aseprite export)
   |
   +--> character-[role].png + character-[role].json (JSON Hash atlas)
   +--> tileset-[biome].png
   +--> vfx-common.png + vfx-common.json
   |
3. Tilemap Assembly (Tiled)
   |
   +--> [biome]-template-[variant].json (Tiled JSON tilemap)
   |
4. Asset Storage
   |
   +--> Development: /public/assets/ (local Next.js static serving)
   +--> Production: Azure Blob Storage (CDN-served, loaded via getAssetUrl)
   |
5. Runtime Loading (Phaser asset-loader.ts)
   |
   +--> Critical tier: loading screen assets
   +--> Standard tier: common character atlases, shared VFX
   +--> Deferred tier: biome-specific tilesets, biome-specific VFX
```

### Format Standards

| Asset Type | Format | Rationale |
|-----------|--------|-----------|
| Character sprites | PNG spritesheet + JSON Hash atlas | Phaser native texture atlas format. PNG supports transparency for outlines. |
| Tilesets | PNG tileset image + Tiled JSON | Phaser native Tiled tilemap support. PNG at 32x32 tile resolution. |
| Onomatopoeia text | PNG sprites (pre-rendered) | Pre-rendered at multiple sizes for quality. Runtime text rendering is too slow for pop-up VFX. |
| PostFX shaders | GLSL fragment shaders | Loaded as strings, compiled at runtime by Phaser WebGL pipeline. |
| UI panel borders | SVG | Rendered by React outside the canvas. SVG scales cleanly to any resolution. |
| UI icons | SVG | Abilities, items, evidence types. Rendered by React in the HUD overlay. |
| Speech bubbles | SVG (template) + runtime text | SVG shape as background, dynamic text rendered by Phaser or React. |
| Loading illustrations | PNG (1280x720) | Full-screen backgrounds. One per biome or role. ~100KB each. |

**NOT recommended**:
- SVG for game sprites: Phaser does not natively render SVG. Runtime SVG-to-texture conversion adds overhead.
- Spine/skeletal animation: Does not match the frame-by-frame comic-book aesthetic.
- Video/animated backgrounds: Excessive file size, no stylistic benefit.

### Atlas Specifications

| Property | Value |
|----------|-------|
| Preferred atlas size | 2048x2048 |
| Maximum atlas size | 4096x4096 (WebGL compatibility limit) |
| Pixel format | RGBA |
| Compression | PNG (lossless) |
| JSON format | JSON Hash (Phaser native) |
| Trim | Enabled (remove transparent padding per frame) |
| Extrude | 1px (prevent bleeding between packed frames) |

### Resolution and Scaling

| Property | Value |
|----------|-------|
| Base canvas resolution | 1280x720 |
| Viewport at 32px tiles | 40 tiles wide x 22.5 tiles tall |
| Character at base resolution | 48x48 = 3.75% viewport width, 6.67% viewport height |
| 2px outline at base resolution | Clearly visible, reads as "thick" |
| Scale mode | Phaser.Scale.FIT (scales up for larger displays) |
| At 1920x1080 (1.5x) | 48x48 becomes 72x72 effective pixels, 2px outline becomes 3px -- still clean |
| High-DPI assets for V1 | Not needed -- Scale.FIT handles upscaling adequately |

### Content-Hash Filenames (Production)

Per Constitution Principle XXXII, all production asset filenames must include content hashes for cache busting. The `getAssetUrl` helper resolves asset names to their content-hashed production URLs.

| Environment | Filename Pattern | Example |
|-------------|-----------------|---------|
| Development | `character-doctor.png` | `/public/assets/characters/character-doctor.png` |
| Production | `character-doctor-[hash].png` | `https://cdn.example.com/assets/characters/character-doctor-a1b2c3.png` |

The build pipeline (or asset upload script) is responsible for:
1. Computing content hash of each asset file
2. Renaming with hash suffix
3. Generating a manifest mapping original names to hashed names
4. `getAssetUrl` reads this manifest at runtime

### Asset Size Estimates

| Category | Estimate | Notes |
|----------|----------|-------|
| Character atlas (per variant) | 450-600KB compressed PNG | 48x48 x ~192 frames |
| Character atlases (all) | ~16MB GPU memory | 4 atlases at 2048x2048, RGBA |
| Tilesets (all biomes) | ~14MB GPU memory | ~14 tilesets at 1024x1024 |
| VFX sprites | ~5MB | Onomatopoeia, effects, indicators |
| Total texture memory | ~35-50MB | Well within browser WebGL limit (256MB+) |
| Total asset download (all biomes) | ~30-50MB | Loaded in tiers, not all at once |

---

## 10. Accessibility

### Reduced Motion

All motion effects must respect the `prefers-reduced-motion` media query, per Constitution Principle XXVIII (WCAG AA).

| Feature | Normal | Reduced Motion |
|---------|--------|----------------|
| Speed lines | Particle emitter active | Disabled entirely |
| Scene transitions | Page-turn / panel-wipe animation | Instant cut |
| Onomatopoeia pop-in | Scale-pop + rotation tween | Appear at final size, no animation |
| Ink splatter vignette | Animated splatter from edges | Static vignette overlay (no animation) |
| Impact frames | 2-3 frame flash | Skip entirely (gameplay feedback via other channels) |
| Ambient particles | Continuous emission | Disabled or static |

### Color and Shape Redundancy

Information conveyed by color must always have a secondary indicator. Color alone is never sufficient.

| System | Color Indicator | Shape/Pattern Indicator |
|--------|----------------|------------------------|
| Evidence markers | Color per evidence type | Distinct shape per evidence type (e.g., triangle, circle, diamond, star) |
| NPC alert state | Yellow (alert), red (hostile) | Distinct punctuation icon (?, !, !!) |
| Player role | Crimson (killer), blue (fed) | Role icon/badge visible in HUD |
| Health state | Color gradient on health bar | Numeric value always displayed alongside bar |
| Status effects | Effect-specific color | Effect-specific icon with text label |

### Contrast Requirements

- WCAG AA minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text
- The noir palette's high contrast (near-white text on near-black backgrounds) inherently exceeds WCAG AA requirements
- The thick black outlines (`#000000`) on all sprites provide maximum contrast against any background color
- Evidence marker shapes must be distinguishable at minimap scale (reduced size)

### High-Contrast Mode Support

When the operating system or browser signals high-contrast mode:
- Ensure all UI text meets the high-contrast requirements (the dark theme already provides this)
- Comic panel borders maintain visibility (thick borders help here)
- PostFX shaders should not reduce text readability (they operate on the game canvas, not the React UI overlay)

---

## 11. Per-Piece Reference Table

This table documents which vision pieces consume specifications from this art style guide, and which sections of the guide are relevant to each piece.

| Piece | Title | Art Style Sections Consumed | What the Piece Needs |
|-------|-------|---------------------------|---------------------|
| 03 | Design System | Color Palette, UI Style (font integration) | Comic font (Bangers) three-part token chain, `impactYellow` and `exclamationOrange` color tokens, `comic-panel` variant for AppCard/AppDialog |
| 04 | Game Engine Bootstrap | PostFX Pipeline | PostFX pipeline registration in game config, `POST_FX_ENABLED_DEFAULT` and `MAX_POST_FX_PASSES` constants, `pixelArt: false` + `antialias: true` confirmation |
| 05 | World and Maps | Environment/Tileset Style, Color Palette (biome accents) | Tileset rendering rules, biome palette table, shadow tile approach, environmental detail style, tile format specifications |
| 06 | Entity and NPC System | Sprite Specifications, Animation Standards | 48x48 frame size, outline treatment rules, color fill approach per role, animation state list, JSON Hash atlas format, disguise mechanic visual support |
| 07 | Player and Roles | Sprite Specifications, Color Palette | Player character uses same SpriteManager system as NPCs, role-specific color accents (killer = crimson, fed = blue) |
| 08 | Combat System | VFX Catalog, Animation Standards | Onomatopoeia event table, impact frame specification, speed line configuration, damage number font (Bangers/fontComic), combat particle style (ink-splatter shapes) |
| 09 | Evidence System | VFX Catalog (evidence markers), Accessibility | Evidence marker shape+color system, discovery pulse VFX, accessibility shape redundancy requirements |
| 10 | Killer Gameplay | VFX Catalog, Sprite Specifications | Stealth kill silence effect, kill VFX (CRUNCH!/SNAP!), ink-splatter particle on stealth actions |
| 11 | Fed Gameplay | VFX Catalog, UI Style | Evidence discovery VFX (blue pulse), investigation caption boxes (JetBrains Mono), fed-themed UI color |
| 14 | Multiplayer Sync | Sprite Specifications | Player sprite rendering must be deterministic across clients -- same atlas, same animation frames |
| 15 | Polish and Onboarding | VFX Catalog (all), PostFX Pipeline (degradation), UI Style (transitions, loading), Accessibility | All VFX presets in comic style, screen effect restyling (ink splatter vignette, concentric rings), scene transitions (page-turn/panel-wipe), loading screen comic panel layout, graphics settings for PostFX toggle, `prefers-reduced-motion` compliance for all effects |

**Pieces with no art style dependency**: 01 (Project Scaffold), 02 (Auth and Profiles), 12 (Session Economy), 13 (Persistent Progression). These pieces deal with infrastructure, authentication, and data systems that have no direct visual rendering requirements.

---

## Appendix: Phaser 3 Feature Map

Quick reference for which Phaser 3 features power each visual element in this art style.

| Visual Element | Phaser Feature | API Reference |
|---------------|---------------|---------------|
| PostFX shaders | `Phaser.Renderer.WebGL.Pipelines.PostFXPipeline` | Camera and per-object PostFX (Phaser 3.60+) |
| Sprite rendering | `Phaser.GameObjects.Sprite` | Standard sprite with texture atlas |
| Onomatopoeia pop-ups | `Phaser.GameObjects.Sprite` + `Phaser.Tweens` | Object-pooled sprites with tween animations |
| Speed lines | `Phaser.GameObjects.Particles.ParticleEmitter` | Directional particle emission |
| Ink splatter | `Phaser.GameObjects.Particles.ParticleEmitter` | Random rotation, irregular shapes |
| Impact frames | PostFX or `Phaser.GameObjects.Graphics` overlay | Brief desaturation shader or white overlay with blend mode |
| Screen shake | `Camera.shake()` | Built-in camera effect |
| Blend modes | `sprite.setBlendMode()` | Multiply, Screen, Add for overlay effects |
| Color tint | `sprite.setTint()` | Hit flash, status effect visualization |
| Masks (fog of war) | `Phaser.Display.Masks.GeometryMask` | Camera-level geometry masking |
| Panel-wipe transitions | `Phaser.Display.Masks.GeometryMask` animation | Animated mask reveal |
| Tile rendering | `Phaser.Tilemaps.Tilemap` | Native Tiled JSON support |
| Animation playback | `Phaser.Animations.AnimationManager` | Frame-by-frame sprite animation |
| NPC alert indicators | `Phaser.GameObjects.Sprite` | Follow NPC position, comic-style sprites |
