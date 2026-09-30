import { defineConfig } from 'vitest/config'

// separate from vite.config.ts so the PWA plugin never loads during tests
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
