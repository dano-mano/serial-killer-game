import { describe, it, expect } from 'vitest'

/**
 * Build verification test for @repo/game-engine.
 *
 * Confirms the package entry point resolves without errors.
 * The game-engine package is intentionally empty in the scaffold —
 * game scenes and systems will be added as gameplay mechanics are defined.
 */
describe('@repo/game-engine', () => {
  it('package entry point resolves', async () => {
    const gameEngine = await import('@repo/game-engine')

    // The package exists and exports an object (possibly empty for the scaffold)
    expect(gameEngine).toBeDefined()
    expect(typeof gameEngine).toBe('object')
  })
})
