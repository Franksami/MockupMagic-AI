/**
 * TemplateSelector Component Tests
 * Phase III: Virtual scrolling performance and functionality validation
 */

import { test, expect } from '@playwright/test';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { generateMockTemplates, measureMountTime, waitForAnimations } from '../utils/test-helpers';

test.describe('TemplateSelector Component - Virtual Scrolling', () => {
  let performanceMonitor: PerformanceMonitor;

  test.beforeEach(async ({ page }) => {
    performanceMonitor = new PerformanceMonitor(page);
    await performanceMonitor.startMonitoring();
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');

    // Mock API response with 1000+ templates
    await page.route('**/api/templates', async route => {
      const templates = generateMockTemplates(1500);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ templates })
      });
    });
  });

  test.afterEach(async () => {
    const metrics = await performanceMonitor.stopMonitoring();
    console.log('Performance Metrics:', metrics);
  });

  test('should render template selector with virtual scrolling', async ({ page }) => {
    const selector = page.locator('[data-testid="template-selector"]');
    await expect(selector).toBeVisible();

    // Check for search input
    const searchInput = selector.locator('[data-testid="template-search"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', expect.stringMatching(/search/i));

    // Check for category filters
    const categoryFilters = selector.locator('[data-testid="category-filter"]');
    await expect(categoryFilters).toHaveCount(5); // Marketing, Sales, Design, Development, Analytics

    // Check for template grid
    const templateGrid = selector.locator('[data-testid="template-grid"]');
    await expect(templateGrid).toBeVisible();

    // Check that only visible items are rendered (virtual scrolling)
    const visibleTemplates = templateGrid.locator('[data-testid="template-item"]');
    const count = await visibleTemplates.count();
    expect(count).toBeLessThan(50); // Should only render visible items, not all 1500
  });

  test('should maintain 60 FPS while scrolling 1000+ templates', async ({ page }) => {
    const templateGrid = page.locator('[data-testid="template-grid"]');
    await expect(templateGrid).toBeVisible();

    // Measure scrolling performance
    const scrollMetrics = await performanceMonitor.monitorVirtualScrolling(
      '[data-testid="template-grid"]',
      5000 // 5 second scroll test
    );

    console.log('Scroll Performance:', {
      averageFPS: scrollMetrics.averageFPS,
      minFPS: scrollMetrics.minFPS,
      droppedFrames: scrollMetrics.droppedFrames
    });

    // Assert performance targets
    expect(scrollMetrics.averageFPS).toBeGreaterThan(55); // Target 60 FPS, allow slight variance
    expect(scrollMetrics.minFPS).toBeGreaterThan(30); // Minimum acceptable FPS
    expect(scrollMetrics.droppedFrames).toBeLessThan(10); // Less than 10 dropped frames
    expect(scrollMetrics.scrollJank).toBeLessThan(5); // Low scroll jank
  });

  test('should efficiently handle search filtering', async ({ page }) => {
    const searchInput = page.locator('[data-testid="template-search"]');
    const templateGrid = page.locator('[data-testid="template-grid"]');

    // Measure search performance
    const searchStartTime = Date.now();
    await searchInput.fill('Template 5');

    // Wait for search results
    await page.waitForFunction(() => {
      const items = document.querySelectorAll('[data-testid="template-item"]');
      return items.length > 0 && items.length < 200; // Filtered results
    });

    const searchEndTime = Date.now();
    const searchTime = searchEndTime - searchStartTime;

    // Search should be fast (< 100ms response time)
    expect(searchTime).toBeLessThan(100);

    // Check filtered results
    const visibleTemplates = templateGrid.locator('[data-testid="template-item"]');
    const count = await visibleTemplates.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(200); // Should show filtered results

    // Verify all visible items match search
    const templateTexts = await visibleTemplates.allTextContents();
    templateTexts.forEach(text => {
      expect(text.toLowerCase()).toContain('5');
    });

    // Check performance during search
    const metrics = await performanceMonitor.collectMetrics();
    expect(metrics.fps).toBeGreaterThan(30);
  });

  test('should handle category filtering efficiently', async ({ page }) => {
    const categoryFilters = page.locator('[data-testid="category-filter"]');
    const templateGrid = page.locator('[data-testid="template-grid"]');

    // Click Marketing category
    await categoryFilters.first().click();

    // Wait for filtered results
    await page.waitForFunction(() => {
      const items = document.querySelectorAll('[data-testid="template-item"]');
      return items.length > 0 && items.length < 500;
    });

    // Check that only Marketing templates are shown
    const visibleTemplates = templateGrid.locator('[data-testid="template-item"]');
    const templates = await visibleTemplates.all();

    for (const template of templates.slice(0, 10)) { // Check first 10
      const category = await template.getAttribute('data-category');
      expect(category).toBe('Marketing');
    }

    // Test multiple category selection
    await categoryFilters.nth(1).click(); // Add Sales category
    await page.waitForTimeout(500);

    // Should show both Marketing and Sales
    const multiTemplates = await visibleTemplates.all();
    for (const template of multiTemplates.slice(0, 10)) {
      const category = await template.getAttribute('data-category');
      expect(['Marketing', 'Sales']).toContain(category);
    }
  });

  test('should handle sorting options', async ({ page }) => {
    const sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    await sortDropdown.click();

    // Test sorting by popularity
    await page.locator('[data-testid="sort-popular"]').click();
    await page.waitForTimeout(500);

    // Check that templates are sorted by uses
    const templates = page.locator('[data-testid="template-item"]');
    const firstTemplateUses = await templates.first().getAttribute('data-uses');
    const lastVisibleUses = await templates.nth(10).getAttribute('data-uses');

    expect(parseInt(firstTemplateUses!)).toBeGreaterThan(parseInt(lastVisibleUses!));

    // Test sorting by rating
    await sortDropdown.click();
    await page.locator('[data-testid="sort-rating"]').click();
    await page.waitForTimeout(500);

    // Check that templates are sorted by rating
    const firstTemplateRating = await templates.first().getAttribute('data-rating');
    const lastVisibleRating = await templates.nth(10).getAttribute('data-rating');

    expect(parseFloat(firstTemplateRating!)).toBeGreaterThanOrEqual(parseFloat(lastVisibleRating!));
  });

  test('should lazy load template thumbnails', async ({ page }) => {
    const templateGrid = page.locator('[data-testid="template-grid"]');

    // Check initial visible images are loaded
    const visibleImages = page.locator('[data-testid="template-thumbnail"]:visible');
    const initialCount = await visibleImages.count();

    // Check that images have loading="lazy" attribute
    const firstImage = visibleImages.first();
    await expect(firstImage).toHaveAttribute('loading', 'lazy');

    // Scroll down
    await templateGrid.evaluate(el => el.scrollTop = 1000);
    await page.waitForTimeout(500);

    // Check that new images are loaded
    const newVisibleImages = page.locator('[data-testid="template-thumbnail"]:visible');
    const newCount = await newVisibleImages.count();

    // Should have loaded new images
    expect(newCount).toBeGreaterThan(0);

    // Check network requests for lazy loading
    const imageRequests = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('placeholder'))
        .length;
    });

    // Should only load visible images, not all 1500
    expect(imageRequests).toBeLessThan(100);
  });

  test('should handle template selection', async ({ page }) => {
    const templates = page.locator('[data-testid="template-item"]');
    const firstTemplate = templates.first();

    // Click to select template
    await firstTemplate.click();

    // Check selection state
    await expect(firstTemplate).toHaveClass(/selected|active/);
    await expect(firstTemplate).toHaveAttribute('aria-selected', 'true');

    // Check that selection event is triggered
    const selectedId = await firstTemplate.getAttribute('data-template-id');
    expect(selectedId).toBeTruthy();

    // Select another template
    const secondTemplate = templates.nth(1);
    await secondTemplate.click();

    // First should be deselected
    await expect(firstTemplate).not.toHaveClass(/selected|active/);
    await expect(secondTemplate).toHaveClass(/selected|active/);
  });

  test('should maintain scroll position on filter changes', async ({ page }) => {
    const templateGrid = page.locator('[data-testid="template-grid"]');

    // Scroll to middle
    await templateGrid.evaluate(el => el.scrollTop = 500);
    const scrollPosBefore = await templateGrid.evaluate(el => el.scrollTop);

    // Apply filter
    const searchInput = page.locator('[data-testid="template-search"]');
    await searchInput.fill('Template');
    await page.waitForTimeout(500);

    // Clear filter
    await searchInput.clear();
    await page.waitForTimeout(500);

    // Check scroll position is maintained
    const scrollPosAfter = await templateGrid.evaluate(el => el.scrollTop);
    expect(Math.abs(scrollPosAfter - scrollPosBefore)).toBeLessThan(100);
  });

  test('should handle infinite scroll loading', async ({ page }) => {
    const templateGrid = page.locator('[data-testid="template-grid"]');
    const loadMoreTrigger = page.locator('[data-testid="load-more-trigger"]');

    // Scroll to bottom
    await templateGrid.evaluate(el => {
      el.scrollTop = el.scrollHeight - el.clientHeight;
    });

    // Check for loading indicator
    const loadingIndicator = page.locator('[data-testid="loading-more"]');
    await expect(loadingIndicator).toBeVisible();

    // Mock additional templates loading
    await page.route('**/api/templates?page=2', async route => {
      const templates = generateMockTemplates(500);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ templates })
      });
    });

    // Wait for new templates to load
    await page.waitForFunction(() => {
      const items = document.querySelectorAll('[data-testid="template-item"]');
      return items.length > 20; // More templates loaded
    });

    // Loading indicator should disappear
    await expect(loadingIndicator).not.toBeVisible();
  });

  test('should handle empty state', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/templates', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ templates: [] })
      });
    });

    await page.reload();

    // Check for empty state message
    const emptyState = page.locator('[data-testid="empty-state"]');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(/no templates|empty/i);
  });

  test('should be keyboard accessible', async ({ page }) => {
    const templates = page.locator('[data-testid="template-item"]');
    const firstTemplate = templates.first();

    // Focus first template
    await firstTemplate.focus();

    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-template-id'));
    expect(focusedElement).toBeTruthy();

    // Select with Enter
    await page.keyboard.press('Enter');
    const selectedTemplate = page.locator('[aria-selected="true"]');
    await expect(selectedTemplate).toBeVisible();

    // Navigate with Tab
    await page.keyboard.press('Tab');
    const nextFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(nextFocused).toBeTruthy();
  });

  test('should measure memory usage with 1000+ templates', async ({ page }) => {
    const templateGrid = page.locator('[data-testid="template-grid"]');

    // Measure initial memory
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Scroll through all templates
    for (let i = 0; i < 10; i++) {
      await templateGrid.evaluate(el => {
        el.scrollTop += 500;
      });
      await page.waitForTimeout(200);
    }

    // Measure memory after scrolling
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // Convert to MB
    console.log(`Memory increase: ${memoryIncrease.toFixed(2)} MB`);

    // Memory increase should be reasonable (< 50MB for virtual scrolling)
    expect(memoryIncrease).toBeLessThan(50);
  });
});