import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['api/_tests/**/*.test.js'],
    coverage: {
      enabled: false
    }
  }
})
