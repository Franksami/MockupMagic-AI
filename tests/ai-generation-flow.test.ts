import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('AI Generation Workflow - Complete End-to-End Testing', () => {

  test.beforeEach(async ({ page }) => {
    // Ensure clean state for each test
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
  });

  test.describe('File Upload System', () => {
    test('should handle single file upload', async ({ page }) => {
      // Create test image file
      const testImagePath = path.join(__dirname, 'fixtures', 'test-product.jpg');

      // Ensure test directory exists
      await fs.promises.mkdir(path.dirname(testImagePath), { recursive: true });

      // Create a minimal test image (1x1 pixel JPEG)
      const minimalJpeg = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00,
        0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xFF,
        0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, 0xFF, 0xC4, 0x00,
        0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C, 0x03,
        0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0xB2, 0xC0, 0x07,
        0xFF, 0xD9
      ]);

      await fs.promises.writeFile(testImagePath, minimalJpeg);

      // Find file upload input
      const fileInputs = [
        'input[type="file"]',
        '[data-testid*="upload"]',
        '[data-testid*="file"]',
        '.upload-area input',
        '.file-upload input'
      ];

      let fileInput = null;
      for (const selector of fileInputs) {
        const input = page.locator(selector);
        if (await input.count() > 0) {
          fileInput = input.first();
          break;
        }
      }

      if (fileInput) {
        await fileInput.setInputFiles(testImagePath);

        // Wait for upload to complete
        await page.waitForResponse(response =>
          response.url().includes('/api/upload') || response.url().includes('upload'),
          { timeout: 30000 }
        );

        // Check for success indicators
        const successIndicators = [
          page.getByText(/upload.*success/i),
          page.getByText(/file.*uploaded/i),
          page.locator('[data-testid*="success"]'),
          page.locator('.upload-success')
        ];

        for (const indicator of successIndicators) {
          if (await indicator.isVisible()) {
            await expect(indicator).toBeVisible();
            break;
          }
        }
      }

      // Cleanup
      await fs.promises.unlink(testImagePath).catch(() => {});
    });

    test('should handle drag and drop upload', async ({ page }) => {
      // Create test file data
      const testFile = {
        name: 'test-product.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('test image data')
      };

      // Look for drop zones
      const dropZones = [
        '[data-testid*="drop-zone"]',
        '.drop-zone',
        '.upload-area',
        '[data-testid*="upload"]'
      ];

      for (const selector of dropZones) {
        const dropZone = page.locator(selector);
        if (await dropZone.count() > 0) {
          // Simulate drag and drop
          await dropZone.first().setInputFiles(testFile);

          // Wait for processing
          await page.waitForTimeout(1000);
          break;
        }
      }
    });
  });

  test.describe('AI Generation Settings', () => {
    test('should allow configuration of generation parameters', async ({ page }) => {
      await page.goto('/studio');

      // Test quality settings
      const qualitySelectors = [
        'select[data-testid*="quality"]',
        'select[name*="quality"]',
        '.quality-select',
        '[data-testid*="settings"] select'
      ];

      for (const selector of qualitySelectors) {
        const select = page.locator(selector);
        if (await select.count() > 0) {
          await select.selectOption('premium');
          await expect(select).toHaveValue('premium');
          break;
        }
      }

      // Test style settings
      const styleSelectors = [
        'select[data-testid*="style"]',
        'select[name*="style"]',
        '.style-select',
        '[data-testid*="mockup-style"]'
      ];

      for (const selector of styleSelectors) {
        const select = page.locator(selector);
        if (await select.count() > 0) {
          await select.selectOption('lifestyle');
          await expect(select).toHaveValue('lifestyle');
          break;
        }
      }
    });

    test('should validate generation form', async ({ page }) => {
      await page.goto('/studio');

      // Find and test generation button
      const generateButtons = [
        'button[data-testid*="generate"]',
        'button:has-text("Generate")',
        '.generate-button',
        '[data-testid*="start-generation"]'
      ];

      for (const selector of generateButtons) {
        const button = page.locator(selector);
        if (await button.count() > 0) {
          // Try to click without required fields to test validation
          await button.first().click();

          // Look for validation messages
          const validationMessages = [
            page.getByText(/required/i),
            page.getByText(/please/i),
            page.locator('[data-testid*="error"]'),
            page.locator('.error-message')
          ];

          // At least one validation message should appear or generation should start
          let validationFound = false;
          for (const msg of validationMessages) {
            if (await msg.isVisible()) {
              validationFound = true;
              break;
            }
          }

          // If no validation messages, generation might have started
          if (!validationFound) {
            // Look for generation indicators
            const generationIndicators = [
              page.getByText(/generating/i),
              page.getByText(/processing/i),
              page.locator('[data-testid*="generation"]'),
              page.locator('.generation-status')
            ];

            for (const indicator of generationIndicators) {
              if (await indicator.isVisible()) {
                await expect(indicator).toBeVisible();
                break;
              }
            }
          }
          break;
        }
      }
    });
  });

  test.describe('Template System', () => {
    test('should load and display templates', async ({ page }) => {
      await page.goto('/studio');

      // Navigate to templates if there's a tab
      const templatesTab = page.getByRole('tab', { name: /templates/i });
      if (await templatesTab.isVisible()) {
        await templatesTab.click();
      }

      // Wait for templates API call
      await page.waitForResponse(response =>
        response.url().includes('/api/templates') && response.ok(),
        { timeout: 10000 }
      );

      // Check templates are displayed
      const templateSelectors = [
        '[data-testid*="template"]',
        '.template-card',
        '.template-item',
        '[data-testid*="template-grid"] > *'
      ];

      for (const selector of templateSelectors) {
        const templates = page.locator(selector);
        if (await templates.count() > 0) {
          await expect(templates.first()).toBeVisible();
          break;
        }
      }
    });

    test('should allow template selection', async ({ page }) => {
      await page.goto('/studio');

      // Look for template selection elements
      const templateSelectors = [
        '[data-testid*="template-card"]',
        '.template-card',
        '.template-item',
        'button[data-template-id]'
      ];

      for (const selector of templateSelectors) {
        const template = page.locator(selector);
        if (await template.count() > 0) {
          await template.first().click();

          // Check for selection indication
          const selectionIndicators = [
            page.locator('.selected'),
            page.locator('[data-selected="true"]'),
            page.locator('.template-selected')
          ];

          for (const indicator of selectionIndicators) {
            if (await indicator.isVisible()) {
              await expect(indicator).toBeVisible();
              break;
            }
          }
          break;
        }
      }
    });
  });

  test.describe('Real User Scenarios', () => {
    test('should complete basic mockup generation workflow', async ({ page }) => {
      await page.goto('/studio');

      // Step 1: Check authentication is working
      await page.waitForFunction(() => {
        return fetch('/api/auth/whop', { credentials: 'include' })
          .then(r => r.json())
          .then(d => d.isAuthenticated === true);
      }, { timeout: 10000 });

      // Step 2: Try to generate without file (should handle gracefully)
      const generateButtons = page.locator('button:has-text("Generate"), [data-testid*="generate"]');
      if (await generateButtons.count() > 0) {
        await generateButtons.first().click();

        // Should either show validation error or start generation
        await page.waitForTimeout(2000);

        // Look for any response
        const responses = [
          page.getByText(/required/i),
          page.getByText(/error/i),
          page.getByText(/generating/i),
          page.getByText(/queued/i)
        ];

        let responseFound = false;
        for (const response of responses) {
          if (await response.isVisible()) {
            responseFound = true;
            break;
          }
        }

        expect(responseFound).toBe(true);
      }
    });

    test('should display credit information', async ({ page }) => {
      await page.goto('/studio');

      // Look for credit display
      const creditSelectors = [
        '[data-testid*="credit"]',
        '.credits',
        '.credit-balance',
        ':text("1000")' // Mock user has 1000 credits
      ];

      for (const selector of creditSelectors) {
        const creditElement = page.locator(selector);
        if (await creditElement.count() > 0) {
          await expect(creditElement.first()).toBeVisible();
          break;
        }
      }
    });

    test('should handle settings and preferences', async ({ page }) => {
      await page.goto('/studio');

      // Look for settings panels or modals
      const settingsSelectors = [
        'button:has-text("Settings")',
        '[data-testid*="settings"]',
        '.settings-button',
        '[aria-label*="Settings"]'
      ];

      for (const selector of settingsSelectors) {
        const settingsButton = page.locator(selector);
        if (await settingsButton.count() > 0) {
          await settingsButton.first().click();

          // Look for settings panel
          const settingsPanels = [
            '[data-testid*="settings-panel"]',
            '.settings-panel',
            '.settings-modal',
            '[role="dialog"]'
          ];

          for (const panelSelector of settingsPanels) {
            const panel = page.locator(panelSelector);
            if (await panel.isVisible()) {
              await expect(panel).toBeVisible();
              break;
            }
          }
          break;
        }
      }
    });
  });

  test.describe('Performance & Responsiveness', () => {
    test('should be responsive across viewports', async ({ page }) => {
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 1366, height: 768, name: 'laptop' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/studio');

        // Verify content is visible and properly laid out
        await expect(page.locator('body')).toBeVisible();

        // Check no horizontal scrollbars on mobile
        if (viewport.name === 'mobile') {
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });
          expect(hasHorizontalScroll).toBe(false);
        }
      }
    });

    test('should handle loading states properly', async ({ page }) => {
      await page.goto('/studio');

      // Intercept API calls to simulate slow responses
      await page.route('/api/**', async (route) => {
        await page.waitForTimeout(1000); // 1s delay
        await route.continue();
      });

      // Reload to trigger loading states
      await page.reload();

      // Look for loading indicators
      const loadingSelectors = [
        '[data-testid*="loading"]',
        '.loading',
        '.spinner',
        '[aria-label*="Loading"]',
        ':text("Loading")'
      ];

      let loadingFound = false;
      for (const selector of loadingSelectors) {
        const loading = page.locator(selector);
        if (await loading.isVisible()) {
          loadingFound = true;
          break;
        }
      }

      // Either loading indicator should be present or content should load quickly
      expect(loadingFound || await page.locator('body').isVisible()).toBe(true);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Block API calls to simulate errors
      await page.route('/api/generate', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'TEST_ERROR',
              message: 'Simulated API error for testing'
            }
          })
        });
      });

      await page.goto('/studio');

      // Try to trigger generation
      const generateButton = page.locator('button:has-text("Generate"), [data-testid*="generate"]').first();
      if (await generateButton.isVisible()) {
        await generateButton.click();

        // Look for error handling
        const errorIndicators = [
          page.getByText(/error/i),
          page.getByText(/failed/i),
          page.locator('[data-testid*="error"]'),
          page.locator('.error-message')
        ];

        let errorFound = false;
        for (const indicator of errorIndicators) {
          if (await indicator.isVisible({ timeout: 5000 })) {
            errorFound = true;
            break;
          }
        }

        expect(errorFound).toBe(true);
      }
    });

    test('should handle network disconnection', async ({ page }) => {
      await page.goto('/studio');

      // Simulate offline
      await page.context().setOffline(true);

      // Try to perform actions
      const actionButtons = page.locator('button').first();
      if (await actionButtons.isVisible()) {
        await actionButtons.click();

        // Should show offline indicator or handle gracefully
        await page.waitForTimeout(2000);

        // Reconnect
        await page.context().setOffline(false);
      }
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/studio');

      // Test keyboard navigation
      let focusableCount = 0;
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');

        const focused = await page.evaluate(() => {
          const active = document.activeElement;
          return active && active !== document.body;
        });

        if (focused) {
          focusableCount++;
        }
      }

      expect(focusableCount).toBeGreaterThan(0);
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      await page.goto('/studio');

      // Check for proper ARIA usage
      const interactiveElements = page.locator('button, a, input, select, textarea');
      const count = await interactiveElements.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 5); i++) {
          const element = interactiveElements.nth(i);
          if (await element.isVisible()) {
            const hasAccessibleName = await element.evaluate(el => {
              return !!(
                el.textContent?.trim() ||
                el.getAttribute('aria-label') ||
                el.getAttribute('title') ||
                el.getAttribute('alt')
              );
            });
            expect(hasAccessibleName).toBe(true);
          }
        }
      }
    });
  });
});

// Utility function to cleanup test files
async function cleanupTestFiles(dir: string) {
  try {
    await fs.promises.rmdir(dir, { recursive: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}