import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { sharedConfig } from '../../vitest.shared.mts'

export default defineConfig({
  ...sharedConfig,
  plugins: [react(), tsconfigPaths()],
  test: {
    ...sharedConfig.test,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
})
