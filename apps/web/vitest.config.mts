import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { sharedConfig } from '../../vitest.shared.mts'

export default defineConfig({
  ...sharedConfig,
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      'server-only': new URL('./vitest.server-only-stub.ts', import.meta.url).pathname,
    },
  },
  test: {
    ...sharedConfig.test,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
})
