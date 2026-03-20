import { describe, it, expect } from 'vitest'
import { colors } from '@repo/ui-theme/tokens/colors'
import { brandConfig } from '@repo/ui-theme/brand/config'

/**
 * Build verification test for @repo/ui-theme.
 *
 * Confirms the package's exported subpaths resolve and contain expected values.
 * Validates the authoritative color tokens and brand config from the art style guide.
 */
describe('@repo/ui-theme', () => {
  it('color tokens resolve and contain expected values', () => {
    expect(colors).toBeDefined()
    expect(colors.background).toBe('#0a0a0f')
    expect(colors.accent).toBe('#c41e3a')
    expect(colors.fed).toBe('#1e5ba8')
    expect(colors.impactYellow).toBe('#FFD700')
  })

  it('brand config resolves with expected name', () => {
    expect(brandConfig).toBeDefined()
    expect(brandConfig.name).toBe('Serial Killer Game')
  })
})
