/**\n * vitest.frontend.config.js\n * Configures Vitest for React component testing using a jsdom environment.\n */\nimport { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
    include: ['src/**/*.test.{js,jsx}']
  }
})

