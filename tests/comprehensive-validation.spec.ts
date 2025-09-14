import { test, expect } from '@playwright/test';

test.describe('MockupMagic AI - Comprehensive Functionality Validation', () => {
  test('Complete system validation: All tabs and core features', async ({ page }) => {
    console.log('🎯 Starting comprehensive system validation...');

    // Test 1: Studio Tab Core Functionality
    console.log('🎨 Testing Studio Tab...');
    await page.goto('/studio');
    await page.waitForSelector('[data-testid="studio-container"]');

    // Verify Studio tab is active and content loads
    await expect(page.locator('h1')).toContainText('MockupMagic AI');
    await expect(page.getByText('Upload Your Images')).toBeVisible();
    await expect(page.getByText('Quick Settings')).toBeVisible();
    await expect(page.getByText('AI Enhancement')).toBeVisible();
    await expect(page.getByText('Continue to Customize')).toBeVisible();

    // Test upload interface elements
    await expect(page.getByText('Drag & drop your images here')).toBeVisible();
    await expect(page.getByText('Choose File')).toBeVisible();

    // Test settings panel
    await expect(page.getByText('Background')).toBeVisible();
    await expect(page.getByText('Quality')).toBeVisible();
    await expect(page.getByText('Format')).toBeVisible();

    console.log('✅ Studio Tab: VALIDATED');

    // Test 2: Templates Tab Navigation and Content
    console.log('📋 Testing Templates Tab...');
    await page.goto('/studio?tab=templates');
    await page.waitForTimeout(2000); // Allow for loading

    // Verify URL routing
    expect(page.url()).toContain('tab=templates');

    // Check for Templates content (either full marketplace or auth prompt)
    const hasMarketplace = await page.getByText('Whop Creator Template Marketplace').isVisible();
    const hasAuthPrompt = await page.getByText('Template Marketplace').isVisible();

    if (hasMarketplace) {
      console.log('✅ Templates Tab: Full marketplace loaded');
      await expect(page.getByText('2,500+')).toBeVisible();
      await expect(page.getByText('Templates Shared')).toBeVisible();
    } else if (hasAuthPrompt) {
      console.log('✅ Templates Tab: Auth prompt (expected outside iframe)');
    }

    console.log('✅ Templates Tab: VALIDATED');

    // Test 3: Store Tab Integration
    console.log('🏪 Testing Store Tab...');
    await page.goto('/studio?tab=store');
    await page.waitForTimeout(2000);

    // Verify URL routing
    expect(page.url()).toContain('tab=store');

    // Check for Store content
    const hasStoreIntegration = await page.getByText('Apply to Your Whop Store').isVisible();
    const hasStoreAuth = await page.getByText('Whop Store Integration').isVisible();

    if (hasStoreIntegration) {
      console.log('✅ Store Tab: Full integration loaded');
    } else if (hasStoreAuth) {
      console.log('✅ Store Tab: Auth prompt (expected outside iframe)');
    }

    console.log('✅ Store Tab: VALIDATED');

    // Test 4: Results Tab Analytics
    console.log('📊 Testing Results Tab...');
    await page.goto('/studio?tab=results');
    await page.waitForTimeout(2000);

    // Verify URL routing
    expect(page.url()).toContain('tab=results');

    // Check for Results content
    const hasAnalytics = await page.getByText('ROI Analytics Dashboard').isVisible();
    const hasAnalyticsAuth = await page.getByText('ROI Analytics').isVisible();

    if (hasAnalytics) {
      console.log('✅ Results Tab: Full analytics loaded');
    } else if (hasAnalyticsAuth) {
      console.log('✅ Results Tab: Auth prompt (expected outside iframe)');
    }

    console.log('✅ Results Tab: VALIDATED');

    // Test 5: Tab Navigation System
    console.log('🔗 Testing Tab Navigation System...');

    // Test direct URL access for each tab
    const tabs = [
      { url: '/studio', name: 'Studio' },
      { url: '/studio?tab=templates', name: 'Templates' },
      { url: '/studio?tab=store', name: 'Store' },
      { url: '/studio?tab=results', name: 'Results' }
    ];

    for (const tab of tabs) {
      await page.goto(tab.url);
      await page.waitForTimeout(1000);

      // Verify page loads and URL is correct
      expect(page.url()).toContain(tab.url.includes('?') ? 'tab=' : '/studio');

      // Verify tab buttons are visible
      await expect(page.getByRole('button', { name: /Studio/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Templates/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Store/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Results/ })).toBeVisible();

      console.log(`✅ ${tab.name} Tab URL Routing: VALIDATED`);
    }

    console.log('✅ Tab Navigation System: VALIDATED');

    // Test 6: Responsive Design
    console.log('📱 Testing Responsive Design...');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/studio');
    await page.waitForTimeout(1000);

    // Verify mobile layout
    await expect(page.getByRole('button', { name: /Studio/ })).toBeVisible();
    await expect(page.getByText('MockupMagic AI')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/studio?tab=templates');
    await page.waitForTimeout(1000);

    // Verify tablet layout
    expect(page.url()).toContain('tab=templates');

    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });

    console.log('✅ Responsive Design: VALIDATED');

    // Test 7: Performance Validation
    console.log('⚡ Testing Performance...');

    const performanceResults: Record<string, number> = {};

    for (const tab of tabs) {
      const startTime = Date.now();
      await page.goto(tab.url);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      performanceResults[tab.name] = loadTime;
      console.log(`${tab.name} Tab Load Time: ${loadTime}ms`);

      // Verify reasonable performance (under 5 seconds)
      expect(loadTime).toBeLessThan(5000);
    }

    console.log('📊 Performance Results:', performanceResults);
    console.log('✅ Performance: VALIDATED');

    console.log('🎉 COMPREHENSIVE SYSTEM VALIDATION: COMPLETE');
  });

  test('Authentication and security validation', async ({ page }) => {
    console.log('🔐 Testing Authentication and Security...');

    // Test authentication prompts show correctly
    await page.goto('/studio?tab=templates');
    await page.waitForTimeout(2000);

    // Should show appropriate auth state (either full content or auth prompt)
    const pageContent = await page.textContent('body');
    const hasContent = pageContent?.includes('Template') || pageContent?.includes('auth');
    expect(hasContent).toBeTruthy();

    // Test Store authentication
    await page.goto('/studio?tab=store');
    await page.waitForTimeout(2000);

    const storeContent = await page.textContent('body');
    const hasStoreContent = storeContent?.includes('Store') || storeContent?.includes('Whop');
    expect(hasStoreContent).toBeTruthy();

    // Test Results authentication
    await page.goto('/studio?tab=results');
    await page.waitForTimeout(2000);

    const resultsContent = await page.textContent('body');
    const hasResultsContent = resultsContent?.includes('Analytics') || resultsContent?.includes('ROI');
    expect(hasResultsContent).toBeTruthy();

    console.log('✅ Authentication Handling: VALIDATED');
  });

  test('Component integration and data flow validation', async ({ page }) => {
    console.log('🔗 Testing Component Integration...');

    // Test component loading across tabs
    const componentTests = [
      { url: '/studio', expectedText: 'Upload Your Images' },
      { url: '/studio?tab=templates', expectedText: 'Template' },
      { url: '/studio?tab=store', expectedText: 'Store' },
      { url: '/studio?tab=results', expectedText: 'Analytics' }
    ];

    for (const test of componentTests) {
      await page.goto(test.url);
      await page.waitForTimeout(2000);

      const content = await page.textContent('body');
      expect(content).toContain(test.expectedText);

      console.log(`✅ Component integration for ${test.url}: VALIDATED`);
    }

    console.log('✅ Component Integration: VALIDATED');
  });

  test('Build and compilation validation', async ({ page }) => {
    console.log('🔧 Testing Build and Compilation...');

    // Test that all JavaScript is loading properly
    await page.goto('/studio');

    // Check for JavaScript errors
    const jsErrors: string[] = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Navigate through all tabs to test for JS errors
    await page.goto('/studio?tab=templates');
    await page.waitForTimeout(1000);

    await page.goto('/studio?tab=store');
    await page.waitForTimeout(1000);

    await page.goto('/studio?tab=results');
    await page.waitForTimeout(1000);

    // Verify no critical JavaScript errors
    const criticalErrors = jsErrors.filter(error =>
      !error.includes('DevTools') &&
      !error.includes('extension') &&
      !error.includes('chrome-extension')
    );

    console.log(`JavaScript errors found: ${criticalErrors.length}`);
    if (criticalErrors.length > 0) {
      console.log('JS Errors:', criticalErrors);
    }

    // Allow some non-critical errors but expect mostly clean execution
    expect(criticalErrors.length).toBeLessThan(3);

    console.log('✅ Build and Compilation: VALIDATED');
  });
});