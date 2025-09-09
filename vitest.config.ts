import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM simulation as required by CLAUDE.md
    environment: 'jsdom',
    // Enable global APIs (describe, it, expect, etc.)
    globals: true,
    // Setup file for test configuration
    setupFiles: './vitest.setup.ts',
    // Coverage reporting configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        '.next/',
        'dist/',
        'build/',
        'coverage/',
        'src/**/*.d.ts',
        'src/**/*.stories.{js,jsx,ts,tsx}',
        'src/middleware.ts',
        '**/*.config.{js,ts}',
        '**/*.setup.{js,ts}',
        'src/app/layout.tsx', // Next.js root layout
        'src/app/page.tsx', // Next.js root page
      ],
      // Coverage thresholds for quality assurance
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    // Include pattern matching CLAUDE.md guidelines: *.test.ts, *.test.tsx
    include: ['src/**/*.test.{ts,tsx}'],
    // Exclude unnecessary directories and files
    exclude: [
      'node_modules',
      '.next',
      'dist',
      'build',
      'coverage',
      'src/**/*.stories.{js,jsx,ts,tsx}',
    ],
    // Improved test output using default reporter
    reporters: ['default'],
    // Timeout settings for better test performance
    testTimeout: 10000,
    hookTimeout: 10000,
    // Clear mocks between tests
    clearMocks: true,
    // Restore mocks after each test
    restoreMocks: true,
  },
  resolve: {
    // Path aliases matching tsconfig.json
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})