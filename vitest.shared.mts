import type { UserConfig } from 'vitest/config'

/**
 * Shared Vitest configuration imported by per-package vitest.config.mts files.
 * Each package extends this with environment-specific settings.
 */
export const sharedConfig = {
  test: {
    globals: false,
    restoreMocks: true,
    passWithNoTests: true,
  },
} satisfies UserConfig
