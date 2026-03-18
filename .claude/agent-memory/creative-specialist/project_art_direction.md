---
name: project_art_direction
description: Comic-book/cel-shaded art style decisions for the Killer vs Fed roguelite game - hybrid baked art + PostFX approach, 48x48 character sprites, frame-by-frame animation, 2 PostFX pass budget
type: project
---

Art direction established for Killer vs Fed: comic-book/cel-shaded style inspired by Borderlands, translated to 2D Phaser 3.

**Why:** User specifically requested Borderlands-style cel-shading for a 2D top-down game. The hybrid approach (baked comic art + light PostFX) was chosen because 3D cel-shading techniques do not apply to 2D sprites.

**How to apply:**
- All sprites use thick black outlines (2px exterior, 1-2px interior detail), flat color fills, no smooth gradients
- Characters are 48x48px per frame, frame-by-frame animation (NOT skeletal) for comic authenticity
- Maximum 2 PostFX shader passes (halftone + paper texture) to stay within 60fps budget
- PostFX must be toggleable (graceful degradation -- baked art carries style without shaders)
- PNG + JSON Hash atlas format for all Phaser sprites; SVG for React UI elements
- Bangers font added for comic-book onomatopoeia and dramatic text
- Each biome has a distinct limited color palette within the noir framework
- Full art direction at .bytedragon/agent-outputs/creative-specialist-art-direction.md
