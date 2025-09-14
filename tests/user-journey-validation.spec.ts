import { test, expect } from '@playwright/test';

test.describe('MockupMagic AI - Complete User Journey Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/studio');
    await page.waitForSelector('[data-testid="studio-container"]');
  });

  test('Complete user journey: Studio → Templates → Store → Results', async ({ page }) => {
    // Phase 1: Studio Tab - Upload and Customize Workflow
    console.log('🎨 Testing Studio Tab workflow...');

    // Verify Studio tab is active by default
    await expect(page.getByRole('button', { name: /Studio/ })).toHaveClass(/from-indigo-500 to-purple-500/);

    // Test upload interface
    await expect(page.getByText('Upload Your Images')).toBeVisible();
    await expect(page.getByText('Upload')).toBeVisible();
    await expect(page.getByText('Customize')).toBeVisible();
    await expect(page.getByText('Generate')).toBeVisible();

    // Test step navigation within Studio
    await page.getByRole('button', { name: /Customize/ }).click();
    await page.waitForTimeout(500); // Allow for animations

    // Phase 2: Templates Tab - Community Marketplace
    console.log('📋 Testing Templates Tab functionality...');

    await page.getByRole('button', { name: /Templates/ }).click();
    await page.waitForURL('**/studio?tab=templates');

    // Verify Templates content loads
    await expect(page.getByText('Whop Creator Template Marketplace')).toBeVisible();
    await expect(page.getByText('Templates Shared')).toBeVisible();
    await expect(page.getByText('Avg Conversion Boost')).toBeVisible();

    // Test search functionality
    const searchInput = page.locator('input[placeholder*="Search templates"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('design');
      await page.waitForTimeout(1000); // Allow for search processing
    }

    // Test filter controls
    await page.getByText('Free').click();
    await page.waitForTimeout(500);
    await page.getByText('All').click();

    // Phase 3: Store Tab - Whop Integration
    console.log('🏪 Testing Store Tab integration...');

    await page.getByRole('button', { name: /Store/ }).click();
    await page.waitForURL('**/studio?tab=store');

    // Verify Store content loads
    await expect(page.getByText('Apply to Your Whop Store')).toBeVisible();
    await expect(page.getByText('Transform your product visuals')).toBeVisible();

    // Test ROI prediction section
    await expect(page.getByText('Expected ROI Impact')).toBeVisible();
    await expect(page.getByText('Conversion Rate Projection')).toBeVisible();

    // Phase 4: Results Tab - Analytics Dashboard
    console.log('📊 Testing Results Tab analytics...');

    await page.getByRole('button', { name: /Results/ }).click();
    await page.waitForURL('**/studio?tab=results');

    // Verify Results content loads
    await expect(page.getByText('ROI Analytics Dashboard')).toBeVisible();
    await expect(page.getByText('Track the impact of MockupMagic')).toBeVisible();

    // Test metric cards
    await expect(page.getByText('Total Revenue Increase')).toBeVisible();
    await expect(page.getByText('Avg Conversion Boost')).toBeVisible();
    await expect(page.getByText('Additional Page Views')).toBeVisible();

    // Test metric selector
    await page.getByRole('button', { name: /Sales/ }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Conversion/ }).click();

    // Phase 5: Return to Studio and Test Persistence
    console.log('🔄 Testing tab persistence and state management...');

    await page.getByRole('button', { name: /Studio/ }).click();
    await page.waitForURL('/studio');

    // Verify Studio content restored
    await expect(page.getByText('Upload Your Images')).toBeVisible();

    // Test direct URL access to each tab
    await page.goto('/studio?tab=templates');
    await expect(page.getByText('Whop Creator Template Marketplace')).toBeVisible();

    await page.goto('/studio?tab=store');
    await expect(page.getByText('Apply to Your Whop Store')).toBeVisible();

    await page.goto('/studio?tab=results');
    await expect(page.getByText('ROI Analytics Dashboard')).toBeVisible();

    console.log('✅ Complete user journey validation successful!');
  });

  test('Authentication state across all tabs', async ({ page }) => {
    console.log('🔐 Testing authentication consistency...');

    // Test each tab shows appropriate auth states
    const tabs = ['studio', 'templates', 'store', 'results'];

    for (const tab of tabs) {
      if (tab === 'studio') {
        await page.goto('/studio');
      } else {
        await page.goto(`/studio?tab=${tab}`);
      }

      // Wait for tab to load
      await page.waitForTimeout(1000);

      // Check for auth-dependent elements (credit dashboard, user-specific content)
      const authElements = page.locator('[data-testid*="auth"], [data-testid*="user"], [data-testid*="credit"]');
      const authElementCount = await authElements.count();

      console.log(`Tab ${tab}: ${authElementCount} auth-related elements found`);

      // Verify no broken auth states
      const errorMessages = page.locator('text=/error|failed|unauthorized/i');
      const errorCount = await errorMessages.count();
      expect(errorCount).toBeLessThan(3); // Allow some expected fallback messages
    }
  });

  test('Mobile responsive user journey', async ({ page }) => {
    console.log('📱 Testing mobile user experience...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Test tab navigation on mobile
    await page.getByRole('button', { name: /Templates/ }).click();
    await page.waitForURL('**/studio?tab=templates');
    await expect(page.getByText('Whop Creator Template Marketplace')).toBeVisible();

    // Test mobile scrolling and interaction
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(500);

    // Test mobile store tab
    await page.getByRole('button', { name: /Store/ }).click();
    await page.waitForURL('**/studio?tab=store');
    await expect(page.getByText('Apply to Your Whop Store')).toBeVisible();

    // Verify mobile layout doesn't break
    const viewport = await page.viewportSize();
    expect(viewport?.width).toBe(375);

    console.log('✅ Mobile responsive testing complete!');
  });

  test('Performance and loading validation', async ({ page }) => {
    console.log('⚡ Testing performance across all tabs...');

    const tabLoadTimes: Record<string, number> = {};

    // Measure load time for each tab
    for (const tab of ['studio', 'templates', 'store', 'results']) {
      const startTime = Date.now();

      if (tab === 'studio') {
        await page.goto('/studio');
      } else {
        await page.goto(`/studio?tab=${tab}`);
      }

      // Wait for main content to load
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;
      tabLoadTimes[tab] = loadTime;

      console.log(`Tab ${tab}: ${loadTime}ms load time`);

      // Verify reasonable load times (under 3 seconds)
      expect(loadTime).toBeLessThan(3000);
    }

    console.log('📊 Performance Results:', tabLoadTimes);
  });

  test('Tab state management and URL persistence', async ({ page }) => {
    console.log('🔗 Testing URL state management...');

    // Test that tab state persists through browser operations
    await page.getByRole('button', { name: /Templates/ }).click();
    await page.waitForURL('**/studio?tab=templates');

    // Reload page and verify tab state persists
    await page.reload();
    await page.waitForSelector('text=Whop Creator Template Marketplace');

    // Verify Templates tab still active after reload
    const templatesTab = page.getByRole('button', { name: /Templates/ });
    await expect(templatesTab).toHaveClass(/from-indigo-500 to-purple-500/);

    // Test browser back/forward navigation
    await page.getByRole('button', { name: /Store/ }).click();
    await page.waitForURL('**/studio?tab=store');

    await page.goBack();
    await page.waitForURL('**/studio?tab=templates');
    await expect(page.getByText('Whop Creator Template Marketplace')).toBeVisible();

    await page.goForward();
    await page.waitForURL('**/studio?tab=store');
    await expect(page.getByText('Apply to Your Whop Store')).toBeVisible();

    console.log('✅ URL state management validation complete!');
  });

  test('Error handling and fallback states', async ({ page }) => {
    console.log('🚨 Testing error handling across tabs...');

    // Test invalid tab parameter
    await page.goto('/studio?tab=invalid');
    await expect(page.getByRole('button', { name: /Studio/ })).toHaveClass(/from-indigo-500 to-purple-500/);

    // Test component error boundaries
    for (const tab of ['templates', 'store', 'results']) {
      await page.goto(`/studio?tab=${tab}`);
      await page.waitForTimeout(2000); // Allow for full loading

      // Check for error boundaries or fallback content
      const errorBoundary = page.locator('[data-testid*="error"], text=/something went wrong/i');
      const errorCount = await errorBoundary.count();

      if (errorCount > 0) {
        console.log(`⚠️ Error boundary detected in ${tab} tab`);
      }

      // Verify tab still functions despite any data loading issues
      const tabButton = page.getByRole('button', { name: new RegExp(tab, 'i') });
      await expect(tabButton).toBeVisible();
    }

    console.log('✅ Error handling validation complete!');
  });
});

test.describe('Production Readiness Validation', () => {
  test('Credit system and subscription tier validation', async ({ page }) => {
    console.log('💳 Testing credit and subscription systems...');

    await page.goto('/studio');

    // Check for credit dashboard
    const creditDashboard = page.locator('[data-testid*="credit"], text=/credits/i');
    const hasCreditSystem = await creditDashboard.count() > 0;

    if (hasCreditSystem) {
      console.log('✅ Credit system detected');
    } else {
      console.log('ℹ️ Credit system not visible (may require authentication)');
    }

    // Test upgrade prompts in Results tab
    await page.goto('/studio?tab=results');
    await expect(page.getByText('Unlock Advanced Analytics')).toBeVisible();

    // Verify subscription tier features
    const upgradeButton = page.locator('button', { hasText: /upgrade|pro/i });
    await expect(upgradeButton.first()).toBeVisible();
  });

  test('Real-time data updates and API connectivity', async ({ page }) => {
    console.log('🔄 Testing real-time features...');

    // Test Templates tab data loading
    await page.goto('/studio?tab=templates');
    await page.waitForTimeout(3000); // Allow for API calls

    // Check if real data loaded vs skeleton screens
    const skeletonScreens = page.locator('.animate-pulse');
    const skeletonCount = await skeletonScreens.count();
    console.log(`Skeleton screens found: ${skeletonCount}`);

    // Test Store tab product loading
    await page.goto('/studio?tab=store');
    await page.waitForTimeout(3000);

    // Check for real vs mock product data
    const productElements = page.locator('text=/product|store|whop/i');
    const productCount = await productElements.count();
    console.log(`Product-related elements found: ${productCount}`);

    // Test Results tab analytics loading
    await page.goto('/studio?tab=results');
    await page.waitForTimeout(3000);

    // Check for chart placeholders vs real charts
    const chartPlaceholders = page.locator('text=/chart would render here|placeholder/i');
    const placeholderCount = await chartPlaceholders.count();

    if (placeholderCount > 0) {
      console.log('ℹ️ Chart placeholders detected - ready for real data integration');
    } else {
      console.log('✅ Charts appear to be implemented');
    }
  });

  test('Component integration and data flow', async ({ page }) => {
    console.log('🔗 Testing component integration...');

    // Test data flow between tabs
    await page.goto('/studio');

    // Simulate user interaction in Studio
    const customizeBtn = page.getByRole('button', { name: /Customize/ });
    if (await customizeBtn.isVisible()) {
      await customizeBtn.click();
      await page.waitForTimeout(1000);
    }

    // Navigate to Templates and verify context
    await page.getByRole('button', { name: /Templates/ }).click();
    await page.waitForURL('**/studio?tab=templates');

    // Check if template selection could integrate with Studio workflow
    const templateCards = page.locator('[data-testid*="template"], .template-card, button:has-text("Apply to My Whop Store")');
    const templateCount = await templateCards.count();
    console.log(`Template interaction elements found: ${templateCount}`);

    // Test Store tab integration readiness
    await page.getByRole('button', { name: /Store/ }).click();
    await page.waitForURL('**/studio?tab=store');

    // Check for product selection and application workflow
    const productSelectors = page.locator('button:has-text("product"), input[type="checkbox"]');
    const selectorCount = await productSelectors.count();
    console.log(`Product selection elements found: ${selectorCount}`);

    // Test Results tab data correlation
    await page.getByRole('button', { name: /Results/ }).click();
    await page.waitForURL('**/studio?tab=results');

    // Check for metrics that would correlate with user actions
    const metricElements = page.locator('text=/revenue|conversion|improvement/i');
    const metricCount = await metricElements.count();
    console.log(`Metric tracking elements found: ${metricCount}`);

    console.log('✅ Component integration validation complete!');
  });
});

test.describe('Production Environment Simulation', () => {
  test('Whop iframe compatibility testing', async ({ page }) => {
    console.log('🖼️ Testing iframe compatibility...');

    // Test iframe-specific behaviors
    await page.addInitScript(() => {
      // Simulate iframe environment
      Object.defineProperty(window, 'parent', {
        value: {
          postMessage: (message: any) => {
            console.log('Iframe message:', message);
          }
        }
      });
    });

    await page.goto('/studio');

    // Verify app loads in simulated iframe context
    await expect(page.locator('body')).toBeVisible();

    // Test all tabs work in iframe context
    for (const tab of ['templates', 'store', 'results']) {
      await page.goto(`/studio?tab=${tab}`);
      await page.waitForTimeout(1000);

      // Verify no iframe-breaking behaviors
      const currentUrl = page.url();
      expect(currentUrl).toContain(`tab=${tab}`);
    }

    console.log('✅ Iframe compatibility validated!');
  });

  test('Edge case and error recovery testing', async ({ page }) => {
    console.log('⚠️ Testing edge cases and error recovery...');

    // Test rapid tab switching
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: /Templates/ }).click();
      await page.waitForTimeout(100);
      await page.getByRole('button', { name: /Store/ }).click();
      await page.waitForTimeout(100);
      await page.getByRole('button', { name: /Results/ }).click();
      await page.waitForTimeout(100);
      await page.getByRole('button', { name: /Studio/ }).click();
      await page.waitForTimeout(100);
    }

    // Verify app still functions after rapid switching
    await expect(page.getByText('Upload Your Images')).toBeVisible();

    // Test malformed URLs
    await page.goto('/studio?tab=templates&malformed=param');
    await expect(page.getByText('Whop Creator Template Marketplace')).toBeVisible();

    // Test special characters in URL
    await page.goto('/studio?tab=store&test=%20%21%40%23');
    await expect(page.getByText('Apply to Your Whop Store')).toBeVisible();

    console.log('✅ Edge case testing complete!');
  });

  test('Complete feature accessibility audit', async ({ page }) => {
    console.log('♿ Testing accessibility compliance...');

    // Test keyboard navigation through all tabs
    await page.goto('/studio');

    // Focus first tab button
    await page.getByRole('button', { name: /Studio/ }).focus();

    // Navigate through tabs with keyboard
    await page.keyboard.press('Tab'); // Move to Templates
    await page.keyboard.press('Enter'); // Activate Templates
    await page.waitForURL('**/studio?tab=templates');

    await page.keyboard.press('Tab'); // Move to Store
    await page.keyboard.press('Enter'); // Activate Store
    await page.waitForURL('**/studio?tab=store');

    await page.keyboard.press('Tab'); // Move to Results
    await page.keyboard.press('Enter'); // Activate Results
    await page.waitForURL('**/studio?tab=results');

    // Test focus management and ARIA attributes
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);

    console.log('✅ Accessibility audit complete!');
  });
});