/**
 * DragDropZone Component Tests
 * Phase III: File upload functionality and performance validation
 */

import { test, expect } from '@playwright/test';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { generateTestFiles, measureMountTime, checkForConsoleErrors } from '../utils/test-helpers';

test.describe('DragDropZone Component', () => {
  let performanceMonitor: PerformanceMonitor;

  test.beforeEach(async ({ page }) => {
    performanceMonitor = new PerformanceMonitor(page);
    await performanceMonitor.startMonitoring();
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    const metrics = await performanceMonitor.stopMonitoring();
    console.log('Performance Metrics:', metrics);
  });

  test('should render drag drop zone with correct UI elements', async ({ page }) => {
    // Check for main drag drop area
    const dropZone = page.locator('[data-testid="drag-drop-zone"]');
    await expect(dropZone).toBeVisible();

    // Check for upload icon
    const uploadIcon = dropZone.locator('svg');
    await expect(uploadIcon).toBeVisible();

    // Check for instruction text
    await expect(dropZone).toContainText(/drag.*drop|upload/i);

    // Check for file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await expect(fileInput).toHaveAttribute('accept', expect.stringMatching(/image/));
  });

  test('should handle file upload via click', async ({ page }) => {
    const dropZone = page.locator('[data-testid="drag-drop-zone"]');
    const fileInput = page.locator('input[type="file"]');

    // Generate test file
    const testFiles = await generateTestFiles();
    const testFile = testFiles[0]; // Small JPEG file

    // Upload file
    await fileInput.setInputFiles(testFile.path);

    // Check for upload progress
    const progressBar = page.locator('[data-testid="upload-progress"]');
    await expect(progressBar).toBeVisible();

    // Wait for upload to complete
    await page.waitForFunction(() => {
      const progress = document.querySelector('[data-testid="upload-progress"]');
      return !progress || progress.getAttribute('data-complete') === 'true';
    }, { timeout: 10000 });

    // Check for preview
    const preview = page.locator('[data-testid="file-preview"]');
    await expect(preview).toBeVisible();
  });

  test('should handle drag and drop file upload', async ({ page }) => {
    const dropZone = page.locator('[data-testid="drag-drop-zone"]');

    // Create a DataTransfer to simulate drag and drop
    await page.evaluate(() => {
      const zone = document.querySelector('[data-testid="drag-drop-zone"]');
      if (!zone) return;

      // Simulate dragenter
      const dragEnterEvent = new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
      });
      zone.dispatchEvent(dragEnterEvent);
    });

    // Check for drag over state
    await expect(dropZone).toHaveClass(/drag-over|active/);

    // Simulate drop
    const testFiles = await generateTestFiles();
    await page.evaluate(({ fileName, fileContent }) => {
      const zone = document.querySelector('[data-testid="drag-drop-zone"]');
      if (!zone) return;

      // Create file
      const file = new File([fileContent], fileName, { type: 'image/jpeg' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      // Simulate drop
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      });
      zone.dispatchEvent(dropEvent);
    }, { fileName: 'test.jpg', fileContent: 'test content' });

    // Check for file processing
    await expect(page.locator('[data-testid="file-preview"]')).toBeVisible({ timeout: 5000 });
  });

  test('should validate file types', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Try to upload invalid file type
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (!input) return;

      // Create invalid file
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      // Trigger change event
      Object.defineProperty(input, 'files', {
        value: dataTransfer.files,
        writable: false,
      });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Check for error message
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/invalid|unsupported|format/i);
  });

  test('should handle multiple file uploads', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const testFiles = await generateTestFiles();

    // Upload multiple files
    await fileInput.setInputFiles(testFiles.map(f => f.path));

    // Check for multiple previews
    const previews = page.locator('[data-testid="file-preview"]');
    await expect(previews).toHaveCount(testFiles.length);

    // Check each preview
    for (let i = 0; i < testFiles.length; i++) {
      const preview = previews.nth(i);
      await expect(preview).toBeVisible();
    }
  });

  test('should show upload progress accurately', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const testFiles = await generateTestFiles();
    const largeFile = testFiles[1]; // 10MB file

    // Monitor progress updates
    const progressValues: number[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Upload progress:')) {
        const match = msg.text().match(/(\d+)%/);
        if (match) {
          progressValues.push(parseInt(match[1]));
        }
      }
    });

    // Upload large file
    await fileInput.setInputFiles(largeFile.path);

    // Wait for upload to complete
    await page.waitForFunction(() => {
      const progress = document.querySelector('[data-testid="upload-progress"]');
      return progress?.getAttribute('data-complete') === 'true';
    }, { timeout: 30000 });

    // Verify progress was incremental
    expect(progressValues.length).toBeGreaterThan(0);
    expect(progressValues[progressValues.length - 1]).toBe(100);

    // Check that progress increased monotonically
    for (let i = 1; i < progressValues.length; i++) {
      expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
    }
  });

  test('should handle upload cancellation', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const testFiles = await generateTestFiles();
    const largeFile = testFiles[1]; // 10MB file

    // Start upload
    await fileInput.setInputFiles(largeFile.path);

    // Wait for upload to start
    const progressBar = page.locator('[data-testid="upload-progress"]');
    await expect(progressBar).toBeVisible();

    // Cancel upload
    const cancelButton = page.locator('[data-testid="cancel-upload"]');
    await cancelButton.click();

    // Check that upload was cancelled
    await expect(progressBar).not.toBeVisible();
    const cancelMessage = page.locator('[data-testid="upload-cancelled"]');
    await expect(cancelMessage).toBeVisible();
  });

  test('should maintain performance with large files', async ({ page }) => {
    const mountTime = await measureMountTime(page, '[data-testid="drag-drop-zone"]');
    expect(mountTime).toBeLessThan(100); // Should mount in less than 100ms

    const fileInput = page.locator('input[type="file"]');
    const testFiles = await generateTestFiles();
    const largeFile = testFiles[1]; // 10MB file

    // Measure memory before upload
    const memoryBefore = await performanceMonitor.measureMemoryUsage(async () => {
      // Baseline measurement
    });

    // Upload large file
    await fileInput.setInputFiles(largeFile.path);

    // Wait for upload to complete
    await page.waitForFunction(() => {
      const progress = document.querySelector('[data-testid="upload-progress"]');
      return progress?.getAttribute('data-complete') === 'true';
    }, { timeout: 30000 });

    // Measure memory after upload
    const memoryAfter = await performanceMonitor.measureMemoryUsage(async () => {
      // After upload measurement
    });

    // Memory increase should be reasonable (less than 50MB for 10MB file)
    const memoryIncrease = memoryAfter.delta - memoryBefore.delta;
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

    // Collect performance metrics
    const metrics = await performanceMonitor.collectMetrics();
    expect(metrics.fps).toBeGreaterThan(30); // Should maintain at least 30 FPS
    expect(metrics.longTasks).toBeLessThan(5); // Should have minimal long tasks
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Monitor console errors
    const errors = await checkForConsoleErrors(page);

    // Simulate network error
    await page.route('**/api/upload', route => {
      route.abort('failed');
    });

    const fileInput = page.locator('input[type="file"]');
    const testFiles = await generateTestFiles();

    // Try to upload
    await fileInput.setInputFiles(testFiles[0].path);

    // Check for error handling
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/error|failed|try again/i);

    // Ensure no unhandled errors
    expect(errors).toHaveLength(0);
  });

  test('should be accessible', async ({ page }) => {
    const dropZone = page.locator('[data-testid="drag-drop-zone"]');

    // Check for ARIA labels
    await expect(dropZone).toHaveAttribute('role', 'button');
    await expect(dropZone).toHaveAttribute('aria-label', expect.stringMatching(/upload|drag.*drop/i));

    // Check keyboard accessibility
    await dropZone.focus();
    await page.keyboard.press('Enter');

    // File input should be triggered
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeFocused();

    // Check for focus indicators
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      const styles = window.getComputedStyle(active!);
      return {
        outline: styles.outline,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow
      };
    });

    // Should have visible focus indicator
    expect(
      focusedElement.outline !== 'none' ||
      focusedElement.boxShadow !== 'none'
    ).toBeTruthy();
  });
});