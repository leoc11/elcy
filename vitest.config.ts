// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,              // Optional: allows `describe`, `it`, etc. without imports
    include: ['test/**/*.test.ts'],  // Customize test file matching
    environment: 'node',        // Or 'jsdom' for browser-like testing
  },
});