import { defineConfig, devices } from '@playwright/experimental-ct-react';
import react from '@vitejs/plugin-react';

/**
 * MockupMagic AI - Component Testing Configuration
 * Isolated component testing for Phase III components
 */

export default defineConfig({
  testDir: './tests/components',
  timeout: 10000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-ct-report' }],
    ['json', { outputFile: 'test-results/ct-results.json' }]
  ],

  use: {
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 5000,

    // Component testing specific settings
    ctPort: 3100,
    ctViteConfig: {
      plugins: [react()],
      resolve: {
        alias: {
          '@': '/src',
          '@/components': '/src/components',
          '@/lib': '/src/lib',
          '@/styles': '/src/styles',
        },
      },
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});