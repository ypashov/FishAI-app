/**\n * vitest.backend.config.js\n * Runs backend/unit tests in a Node environment for shared function utilities.\n */\nimport { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['api/_tests/**/*.test.js'],
    coverage: {
      enabled: false
    }
  }
})

