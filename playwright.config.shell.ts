import { defineConfig, devices } from '@playwright/test';

/**
 * Shell Architecture Testing Configuration
 * Uses existing dev server on port 3000
 */

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }]
  ],

  use: {
    // Use existing dev server on port 3000
    baseURL: 'http://localhost:3000',

    // Screenshot and video settings
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',

    // Default viewport
    viewport: { width: 1920, height: 1080 },

    // Action timeout
    actionTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer configuration - use existing server
});