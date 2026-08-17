import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    conditions: ['development', 'node'],
  },
  test: {
    environment: 'happy-dom',
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
    },
  },
})
