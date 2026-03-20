/**
 * Color token definitions for the game.
 * Comic-book cel-shaded art style (Borderlands-style in 2D).
 *
 * These TypeScript constants are the authoritative color values.
 * - Phaser reads these directly for game rendering
 * - React/Tailwind reads the CSS custom properties generated from globals.css @theme inline
 *
 * See: apps/web/src/app/globals.css for the CSS custom property definitions.
 */

// Base palette — authoritative hex values from art-style-guide.md
export const colors = {
  // Background
  background: '#0a0a0f',

  // Faction: Killer
  accent: '#c41e3a', // Crimson

  // Faction: Fed (Federal Agent)
  fed: '#1e5ba8', // Institutional blue

  // VFX / Impact
  impactYellow: '#FFD700',
} as const

export type ColorToken = keyof typeof colors
