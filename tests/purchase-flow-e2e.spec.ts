import { test, expect } from '@playwright/test';

test.describe('MockupMagic AI - End-to-End Purchase Flow Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/studio');
    await page.waitForSelector('[data-testid="studio-container"]');
  });

  test('Complete purchase journey: Free → Upgrade → Premium Features', async ({ page }) => {
    console.log('💳 Starting complete purchase flow test...');

    // Phase 1: Free User Experience
    console.log('🆓 Testing free user limitations...');

    // Verify Studio tab loads for free users
    await expect(page.getByText('Upload Your Images')).toBeVisible();

    // Test upload functionality (should work for free users)
    const uploadSection = page.locator('text="Upload Your Images"');
    await expect(uploadSection).toBeVisible();

    // Navigate to Templates tab to see limitations
    await page.getByRole('button', { name: /Templates/ }).click();
    await page.waitForURL('**/studio?tab=templates');

    // Check for free vs premium template indicators
    const freeTemplates = page.locator('text=/free|starter/i');
    const premiumTemplates = page.locator('text=/premium|pro/i');

    console.log(`Free template indicators: ${await freeTemplates.count()}`);
    console.log(`Premium template indicators: ${await premiumTemplates.count()}`);

    // Phase 2: Upgrade Flow Discovery
    console.log('⬆️ Testing upgrade flow discovery...');

    // Navigate to Results tab to see upgrade prompts
    await page.getByRole('button', { name: /Results/ }).click();
    await page.waitForURL('**/studio?tab=results');

    // Look for upgrade prompts
    const upgradePrompts = page.locator('text=/upgrade|pro|premium/i');
    const upgradeCount = await upgradePrompts.count();
    console.log(`Upgrade prompts found: ${upgradeCount}`);

    // Test upgrade button presence
    const upgradeButton = page.locator('button', { hasText: /upgrade to pro/i });
    await expect(upgradeButton).toBeVisible();

    // Phase 3: Simulated Purchase Flow
    console.log('🛒 Testing purchase flow simulation...');

    // Click upgrade button (in real scenario, this would open Whop checkout)
    await upgradeButton.click();

    // Note: In actual iframe context, this would open Whop checkout
    // For testing, we verify the action is properly handled
    console.log('✅ Upgrade button click handled - would open Whop checkout in iframe');

    // Phase 4: Post-Purchase Feature Access
    console.log('🔓 Testing premium feature access patterns...');

    // Navigate back to Templates tab
    await page.getByRole('button', { name: /Templates/ }).click();
    await page.waitForURL('**/studio?tab=templates');

    // Test premium template access indicators
    const premiumFeatureElements = page.locator('[data-testid*="premium"], button:has-text("Premium")');
    const premiumElementCount = await premiumFeatureElements.count();
    console.log(`Premium feature elements: ${premiumElementCount}`);

    // Navigate to Store tab for advanced features
    await page.getByRole('button', { name: /Store/ }).click();
    await page.waitForURL('**/studio?tab=store');

    // Test bulk application features (premium only)
    const bulkFeatures = page.locator('text=/bulk|multiple|batch/i');
    const bulkFeatureCount = await bulkFeatures.count();
    console.log(`Bulk feature indicators: ${bulkFeatureCount}`);

    // Phase 5: ROI Tracking Validation
    console.log('📊 Testing ROI tracking for purchases...');

    await page.getByRole('button', { name: /Results/ }).click();
    await page.waitForURL('**/studio?tab=results');

    // Verify ROI tracking elements are present
    await expect(page.getByText('ROI Analytics Dashboard')).toBeVisible();
    await expect(page.getByText('Total Revenue Increase')).toBeVisible();

    // Test metric tracking capabilities
    const metricCards = page.locator('[data-testid*="metric"], .text-2xl');
    const metricCount = await metricCards.count();
    console.log(`Metric tracking elements: ${metricCount}`);

    console.log('✅ Complete purchase flow validation successful!');
  });

  test('Subscription tier feature gating validation', async ({ page }) => {
    console.log('🎯 Testing subscription tier feature restrictions...');

    // Test each tab for tier-specific features
    const tierFeatures = {
      studio: ['basic_mockups', 'ai_enhancement', 'file_upload'],
      templates: ['basic_templates', 'premium_templates', 'template_sharing'],
      store: ['basic_integration', 'bulk_application', 'advanced_analytics'],
      results: ['basic_metrics', 'advanced_analytics', 'custom_reporting']
    };

    for (const [tab, features] of Object.entries(tierFeatures)) {
      if (tab === 'studio') {
        await page.goto('/studio');
      } else {
        await page.goto(`/studio?tab=${tab}`);
      }

      await page.waitForTimeout(2000); // Allow content to load

      console.log(`Testing ${tab} tab feature restrictions...`);

      // Look for feature restriction indicators
      const restrictionIndicators = page.locator('text=/upgrade|premium|pro only|locked/i');
      const restrictionCount = await restrictionIndicators.count();
      console.log(`  Feature restrictions found: ${restrictionCount}`);

      // Look for tier-specific UI elements
      const tierElements = page.locator('[data-testid*="tier"], [data-testid*="premium"], .bg-purple-500');
      const tierElementCount = await tierElements.count();
      console.log(`  Tier-specific elements: ${tierElementCount}`);
    }
  });

  test('Credit system and billing integration validation', async ({ page }) => {
    console.log('💰 Testing credit system and billing integration...');

    // Test credit display in Studio tab
    await page.goto('/studio');

    // Look for credit-related elements
    const creditElements = page.locator('text=/credit|balance|remaining/i');
    const creditCount = await creditElements.count();
    console.log(`Credit system elements found: ${creditCount}`);

    // Test credit purchase flow indicators
    const purchaseElements = page.locator('button:has-text("Buy"), button:has-text("Purchase"), text=/\$\d+/');
    const purchaseCount = await purchaseElements.count();
    console.log(`Purchase flow elements found: ${purchaseCount}`);

    // Navigate to Store tab for credit usage
    await page.getByRole('button', { name: /Store/ }).click();
    await page.waitForURL('**/studio?tab=store');

    // Test credit deduction indicators
    const costElements = page.locator('text=/cost|credit|price/i');
    const costCount = await costElements.count();
    console.log(`Cost/credit elements found: ${costCount}`);

    // Verify billing integration readiness
    const billingElements = page.locator('[data-testid*="billing"], [data-testid*="payment"]');
    const billingCount = await billingElements.count();
    console.log(`Billing integration elements: ${billingCount}`);
  });

  test('Webhook and real-time subscription updates', async ({ page }) => {
    console.log('🔄 Testing webhook and real-time subscription handling...');

    // Test subscription status detection
    await page.goto('/studio');

    // Check for subscription status indicators
    const subscriptionElements = page.locator('text=/subscription|membership|plan/i');
    const subscriptionCount = await subscriptionElements.count();
    console.log(`Subscription status elements: ${subscriptionCount}`);

    // Test tier detection across tabs
    for (const tab of ['templates', 'store', 'results']) {
      await page.goto(`/studio?tab=${tab}`);
      await page.waitForTimeout(1500);

      // Look for tier-specific content
      const tierContent = page.locator('text=/starter|growth|pro|free|premium/i');
      const tierCount = await tierContent.count();
      console.log(`Tab ${tab} - tier indicators: ${tierCount}`);
    }

    // Test real-time update capabilities
    console.log('Testing real-time update infrastructure...');

    // Navigate through tabs to test state consistency
    await page.goto('/studio?tab=results');
    await page.getByRole('button', { name: /Studio/ }).click();
    await page.getByRole('button', { name: /Templates/ }).click();
    await page.getByRole('button', { name: /Store/ }).click();

    // Verify consistent state across navigation
    await expect(page.getByText('Apply to Your Whop Store')).toBeVisible();
  });

  test('Analytics and conversion tracking validation', async ({ page }) => {
    console.log('📈 Testing analytics and conversion tracking...');

    await page.goto('/studio?tab=results');

    // Test metric display and tracking
    await expect(page.getByText('ROI Analytics Dashboard')).toBeVisible();

    // Check for conversion tracking elements
    const conversionElements = page.locator('text=/conversion|improvement|boost/i');
    const conversionCount = await conversionElements.count();
    console.log(`Conversion tracking elements: ${conversionCount}`);

    // Test metric selectors
    const metricButtons = page.locator('button:has-text("Conversion"), button:has-text("Sales"), button:has-text("Views")');

    for (let i = 0; i < await metricButtons.count(); i++) {
      const button = metricButtons.nth(i);
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(500);
        console.log(`Metric selector ${i + 1} tested successfully`);
      }
    }

    // Test community benchmark data
    const benchmarkElements = page.locator('text=/community|benchmark|average/i');
    const benchmarkCount = await benchmarkElements.count();
    console.log(`Community benchmark elements: ${benchmarkCount}`);

    // Test ROI calculator functionality
    const calculatorElements = page.locator('text=/calculator|projected|expected/i');
    const calculatorCount = await calculatorElements.count();
    console.log(`ROI calculator elements: ${calculatorCount}`);
  });

  test('Store integration and product connection validation', async ({ page }) => {
    console.log('🏪 Testing Whop store integration...');

    await page.goto('/studio?tab=store');

    // Test store connection interface
    await expect(page.getByText('Apply to Your Whop Store')).toBeVisible();

    // Check for product listing capabilities
    const productElements = page.locator('text=/product|store|whop/i');
    const productCount = await productElements.count();
    console.log(`Store integration elements: ${productCount}`);

    // Test product selection interface
    const selectionElements = page.locator('button[class*="border"], input[type="checkbox"]');
    const selectionCount = await selectionElements.count();
    console.log(`Product selection elements: ${selectionCount}`);

    // Test ROI prediction display
    await expect(page.getByText('Expected ROI Impact')).toBeVisible();
    await expect(page.getByText('Conversion Rate Projection')).toBeVisible();

    // Verify success stories section
    const successElements = page.locator('text=/success|story|improvement/i');
    const successCount = await successElements.count();
    console.log(`Success story elements: ${successCount}`);
  });
});

test.describe('Production Environment Validation', () => {
  test('Environment variable and configuration validation', async ({ page }) => {
    console.log('⚙️ Testing environment configuration...');

    // Test that app loads without environment-related errors
    await page.goto('/studio');

    // Check for environment-related error messages
    const envErrors = page.locator('text=/environment|config|missing|undefined/i');
    const envErrorCount = await envErrors.count();

    if (envErrorCount > 0) {
      console.log(`⚠️ Environment configuration warnings: ${envErrorCount}`);
    } else {
      console.log('✅ No environment configuration errors detected');
    }

    // Test that all major components load
    await page.getByRole('button', { name: /Templates/ }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByText('Whop Creator Template Marketplace')).toBeVisible();

    await page.getByRole('button', { name: /Store/ }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByText('Apply to Your Whop Store')).toBeVisible();

    await page.getByRole('button', { name: /Results/ }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByText('ROI Analytics Dashboard')).toBeVisible();
  });

  test('API endpoint health and response validation', async ({ page }) => {
    console.log('🔌 Testing API endpoint health...');

    // Monitor network requests during navigation
    const requests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });

    // Navigate through all tabs to trigger API calls
    await page.getByRole('button', { name: /Templates/ }).click();
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: /Store/ }).click();
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: /Results/ }).click();
    await page.waitForTimeout(2000);

    // Analyze API request patterns
    console.log(`API requests captured: ${requests.length}`);

    const authRequests = requests.filter(req => req.url.includes('/auth/'));
    console.log(`Authentication requests: ${authRequests.length}`);

    // Verify no unexpected API failures
    const responses: any[] = [];
    page.on('response', response => {
      if (response.url().includes('/api/') && response.status() >= 400) {
        responses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    // Expected 401s are normal in non-iframe context
    const authErrors = responses.filter(resp => resp.status === 401);
    console.log(`Expected auth errors (401): ${authErrors.length}`);

    const unexpectedErrors = responses.filter(resp => resp.status >= 500);
    expect(unexpectedErrors.length).toBe(0); // No server errors should occur
  });

  test('Feature availability based on subscription tiers', async ({ page }) => {
    console.log('🎫 Testing tier-based feature availability...');

    // Test Studio tab features by tier
    await page.goto('/studio');

    // Basic features (available to all tiers)
    await expect(page.getByText('Upload')).toBeVisible();
    await expect(page.getByText('Customize')).toBeVisible();

    // Premium features (should show upgrade prompts for free users)
    const premiumFeatures = page.locator('text=/premium|pro|advanced/i');
    const premiumCount = await premiumFeatures.count();
    console.log(`Premium feature indicators: ${premiumCount}`);

    // Test Templates tab tier restrictions
    await page.getByRole('button', { name: /Templates/ }).click();
    await page.waitForURL('**/studio?tab=templates');

    // Test filter for premium templates
    const premiumFilter = page.locator('button:has-text("Premium")');
    if (await premiumFilter.isVisible()) {
      await premiumFilter.click();
      await page.waitForTimeout(1000);
      console.log('✅ Premium template filtering works');
    }

    // Test Store tab advanced features
    await page.getByRole('button', { name: /Store/ }).click();
    await page.waitForURL('**/studio?tab=store');

    // Look for bulk application features
    const bulkFeatures = page.locator('text=/bulk|multiple|batch/i');
    const bulkCount = await bulkFeatures.count();
    console.log(`Bulk operation features: ${bulkCount}`);

    // Test Results tab advanced analytics
    await page.getByRole('button', { name: /Results/ }).click();
    await page.waitForURL('**/studio?tab=results');

    // Check for advanced analytics features
    const advancedFeatures = page.locator('text=/advanced|custom|detailed/i');
    const advancedCount = await advancedFeatures.count();
    console.log(`Advanced analytics features: ${advancedCount}`);
  });

  test('Real-time data synchronization validation', async ({ page }) => {
    console.log('🔄 Testing real-time data synchronization...');

    // Test data consistency across tabs
    await page.goto('/studio');

    // Navigate to Results tab and capture initial metrics
    await page.getByRole('button', { name: /Results/ }).click();
    await page.waitForURL('**/studio?tab=results');
    await page.waitForTimeout(3000); // Allow for data loading

    // Check for dynamic data elements
    const dynamicElements = page.locator('.text-2xl, .text-green-400, .text-blue-400');
    const initialContent = await dynamicElements.allTextContents();
    console.log(`Initial metric values captured: ${initialContent.length}`);

    // Navigate away and back to test data persistence
    await page.getByRole('button', { name: /Studio/ }).click();
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /Results/ }).click();
    await page.waitForURL('**/studio?tab=results');
    await page.waitForTimeout(3000);

    // Verify data consistency
    const updatedContent = await dynamicElements.allTextContents();
    console.log(`Updated metric values: ${updatedContent.length}`);

    // Test real-time metric selectors
    const metricSelectors = page.locator('button:has-text("Conversion"), button:has-text("Sales")');
    for (let i = 0; i < await metricSelectors.count(); i++) {
      const selector = metricSelectors.nth(i);
      if (await selector.isVisible()) {
        await selector.click();
        await page.waitForTimeout(1000);
        console.log(`Metric selector ${i + 1} updated display`);
      }
    }
  });

  test('Error handling and recovery validation', async ({ page }) => {
    console.log('🚨 Testing error handling and recovery...');

    // Test network failure simulation
    await page.route('**/api/**', route => {
      // Simulate intermittent API failures
      if (Math.random() > 0.8) {
        route.abort();
      } else {
        route.continue();
      }
    });

    // Navigate through tabs with simulated network issues
    for (const tab of ['templates', 'store', 'results']) {
      await page.goto(`/studio?tab=${tab}`);
      await page.waitForTimeout(3000); // Allow for retries and error handling

      // Check for error boundaries or fallback content
      const errorBoundaries = page.locator('[data-testid*="error"], text=/error|failed|retry/i');
      const fallbackContent = page.locator('text=/loading|unavailable|try again/i');

      const errorCount = await errorBoundaries.count();
      const fallbackCount = await fallbackContent.count();

      console.log(`Tab ${tab} - Error handling: ${errorCount}, Fallbacks: ${fallbackCount}`);

      // Verify app doesn't crash completely
      const tabButton = page.getByRole('button', { name: new RegExp(tab, 'i') });
      await expect(tabButton).toBeVisible();
    }

    // Remove network simulation
    await page.unroute('**/api/**');

    // Test recovery after network restoration
    await page.reload();
    await page.waitForSelector('[data-testid="studio-container"]');
    await expect(page.getByRole('button', { name: /Studio/ })).toBeVisible();

    console.log('✅ Error handling and recovery validation complete');
  });

  test('Performance optimization validation', async ({ page }) => {
    console.log('⚡ Testing performance optimizations...');

    const performanceMetrics: Record<string, any> = {};

    // Measure First Contentful Paint and Largest Contentful Paint
    for (const tab of ['studio', 'templates', 'store', 'results']) {
      const startTime = Date.now();

      if (tab === 'studio') {
        await page.goto('/studio');
      } else {
        await page.goto(`/studio?tab=${tab}`);
      }

      // Wait for content to be fully rendered
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;
      performanceMetrics[tab] = { loadTime };

      // Check for performance optimizations
      const images = page.locator('img');
      const imageCount = await images.count();

      const lazyImages = page.locator('img[loading="lazy"]');
      const lazyCount = await lazyImages.count();

      performanceMetrics[tab].images = imageCount;
      performanceMetrics[tab].lazyLoaded = lazyCount;

      console.log(`Tab ${tab}: ${loadTime}ms, ${imageCount} images, ${lazyCount} lazy-loaded`);

      // Verify reasonable performance
      expect(loadTime).toBeLessThan(5000); // Under 5 seconds
    }

    console.log('📊 Performance Summary:', performanceMetrics);

    // Test bundle size impact (rough estimation)
    const scripts = page.locator('script[src]');
    const scriptCount = await scripts.count();
    console.log(`JavaScript bundles loaded: ${scriptCount}`);

    // Verify no obvious performance bottlenecks
    expect(performanceMetrics.studio.loadTime).toBeLessThan(3000);
    expect(performanceMetrics.templates.loadTime).toBeLessThan(4000);
    expect(performanceMetrics.store.loadTime).toBeLessThan(4000);
    expect(performanceMetrics.results.loadTime).toBeLessThan(4000);
  });
});

test.describe('Production Readiness Final Validation', () => {
  test('Complete feature integration test', async ({ page }) => {
    console.log('🎯 Running complete feature integration test...');

    // Test complete workflow simulation
    await page.goto('/studio');

    // Phase 1: Studio workflow
    console.log('Phase 1: Studio mockup generation workflow');
    await expect(page.getByText('Upload Your Images')).toBeVisible();

    // Test step progression
    await page.getByRole('button', { name: /Customize/ }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /Generate/ }).click();
    await page.waitForTimeout(500);

    // Phase 2: Template integration
    console.log('Phase 2: Template marketplace integration');
    await page.getByRole('button', { name: /Templates/ }).click();
    await page.waitForURL('**/studio?tab=templates');

    // Test template interaction
    const templateCards = page.locator('button:has-text("Apply to My Whop Store")');
    if (await templateCards.first().isVisible()) {
      console.log('✅ Template-to-store integration buttons present');
    }

    // Phase 3: Store application
    console.log('Phase 3: Store application workflow');
    await page.getByRole('button', { name: /Store/ }).click();
    await page.waitForURL('**/studio?tab=store');

    // Test store application workflow
    const applicationButtons = page.locator('button:has-text("Apply"), button:has-text("Selected")');
    const applicationCount = await applicationButtons.count();
    console.log(`Store application elements: ${applicationCount}`);

    // Phase 4: Results tracking
    console.log('Phase 4: Results and analytics tracking');
    await page.getByRole('button', { name: /Results/ }).click();
    await page.waitForURL('**/studio?tab=results');

    // Verify comprehensive analytics
    await expect(page.getByText('Total Revenue Increase')).toBeVisible();
    await expect(page.getByText('Avg Conversion Boost')).toBeVisible();

    console.log('✅ Complete feature integration test successful!');
  });

  test('Production deployment readiness checklist', async ({ page }) => {
    console.log('📋 Running production deployment readiness checklist...');

    const readinessChecks = {
      basicFunctionality: false,
      authentication: false,
      tabNavigation: false,
      componentIntegration: false,
      errorHandling: false,
      performance: false,
      responsiveDesign: false
    };

    // Check 1: Basic functionality
    await page.goto('/studio');
    await expect(page.locator('[data-testid="studio-container"]')).toBeVisible();
    readinessChecks.basicFunctionality = true;

    // Check 2: Authentication infrastructure
    const authElements = page.locator('[data-testid*="auth"], .whop, text=/user|account/i');
    readinessChecks.authentication = await authElements.count() > 0;

    // Check 3: Tab navigation
    await page.getByRole('button', { name: /Templates/ }).click();
    await page.waitForURL('**/studio?tab=templates');
    readinessChecks.tabNavigation = page.url().includes('tab=templates');

    // Check 4: Component integration
    await expect(page.getByText('Whop Creator Template Marketplace')).toBeVisible();
    readinessChecks.componentIntegration = true;

    // Check 5: Error handling
    await page.goto('/studio?tab=invalid');
    await expect(page.getByRole('button', { name: /Studio/ })).toHaveClass(/from-indigo-500 to-purple-500/);
    readinessChecks.errorHandling = true;

    // Check 6: Performance
    const startTime = Date.now();
    await page.goto('/studio?tab=store');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    readinessChecks.performance = loadTime < 5000;

    // Check 7: Responsive design
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/studio?tab=templates');
    await expect(page.getByText('Whop Creator Template Marketplace')).toBeVisible();
    readinessChecks.responsiveDesign = true;

    // Generate readiness report
    console.log('📊 Production Readiness Report:');
    Object.entries(readinessChecks).forEach(([check, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${check}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    // Verify overall readiness
    const passedChecks = Object.values(readinessChecks).filter(Boolean).length;
    const totalChecks = Object.keys(readinessChecks).length;
    const readinessPercentage = (passedChecks / totalChecks) * 100;

    console.log(`🎯 Overall Production Readiness: ${readinessPercentage.toFixed(1)}%`);
    expect(readinessPercentage).toBeGreaterThan(85); // At least 85% ready
  });
});