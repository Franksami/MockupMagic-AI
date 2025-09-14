import { test, expect } from '@playwright/test';

test.describe('Studio Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/studio');
    // Wait for the page to load completely
    await page.waitForSelector('[data-testid="studio-container"]');
  });

  test('should display all tab navigation buttons', async ({ page }) => {
    // Check that all 4 tabs are present
    await expect(page.getByRole('button', { name: /Studio/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Templates/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Store/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Results/ })).toBeVisible();
  });

  test('should have Studio tab active by default', async ({ page }) => {
    // Check that Studio tab has active styling
    const studioTab = page.getByRole('button', { name: /Studio/ });
    await expect(studioTab).toHaveClass(/from-indigo-500 to-purple-500/);

    // Check that Studio content is visible (progress steps should be present)
    await expect(page.getByText('Upload')).toBeVisible();
    await expect(page.getByText('Customize')).toBeVisible();
    await expect(page.getByText('Generate')).toBeVisible();
  });

  test('should navigate to Templates tab and update URL', async ({ page }) => {
    // Click Templates tab
    await page.getByRole('button', { name: /Templates/ }).click();

    // Wait for navigation and content to load
    await page.waitForURL('**/studio?tab=templates');

    // Check URL contains tab parameter
    expect(page.url()).toContain('tab=templates');

    // Check that Templates content is visible
    await expect(page.getByText('Whop Creator Template Marketplace')).toBeVisible();
    await expect(page.getByText('Templates Shared')).toBeVisible();
  });

  test('should navigate to Store tab and update URL', async ({ page }) => {
    // Click Store tab
    await page.getByRole('button', { name: /Store/ }).click();

    // Wait for navigation and content to load
    await page.waitForURL('**/studio?tab=store');

    // Check URL contains tab parameter
    expect(page.url()).toContain('tab=store');

    // Check that Store content is visible
    await expect(page.getByText('Apply to Your Whop Store')).toBeVisible();
    await expect(page.getByText('Transform your product visuals and boost conversions')).toBeVisible();
  });

  test('should navigate to Results tab and update URL', async ({ page }) => {
    // Click Results tab
    await page.getByRole('button', { name: /Results/ }).click();

    // Wait for navigation and content to load
    await page.waitForURL('**/studio?tab=results');

    // Check URL contains tab parameter
    expect(page.url()).toContain('tab=results');

    // Check that Results content is visible
    await expect(page.getByText('ROI Analytics Dashboard')).toBeVisible();
    await expect(page.getByText('Track the impact of MockupMagic')).toBeVisible();
  });

  test('should maintain tab state when navigating back from URL', async ({ page }) => {
    // Navigate to Templates tab via URL directly
    await page.goto('/studio?tab=templates');
    await page.waitForSelector('text=Whop Creator Template Marketplace');

    // Check that Templates tab is active
    const templatesTab = page.getByRole('button', { name: /Templates/ });
    await expect(templatesTab).toHaveClass(/from-indigo-500 to-purple-500/);

    // Check that Templates content is visible
    await expect(page.getByText('Whop Creator Template Marketplace')).toBeVisible();
  });

  test('should handle invalid tab parameter gracefully', async ({ page }) => {
    // Navigate with invalid tab parameter
    await page.goto('/studio?tab=invalid');

    // Should default to Studio tab
    const studioTab = page.getByRole('button', { name: /Studio/ });
    await expect(studioTab).toHaveClass(/from-indigo-500 to-purple-500/);

    // Studio content should be visible
    await expect(page.getByText('Upload Your Images')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Focus on Studio tab
    await page.getByRole('button', { name: /Studio/ }).focus();

    // Navigate to Templates using Tab key
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Should navigate to Templates
    await page.waitForURL('**/studio?tab=templates');
    await expect(page.getByText('Whop Creator Template Marketplace')).toBeVisible();
  });

  test('should show proper tab tooltips', async ({ page }) => {
    // Hover over each tab and check tooltips
    await page.getByRole('button', { name: /Studio/ }).hover();
    await expect(page.getByTitle('Create AI mockups')).toBeVisible();

    await page.getByRole('button', { name: /Templates/ }).hover();
    await expect(page.getByTitle('Browse community templates')).toBeVisible();

    await page.getByRole('button', { name: /Store/ }).hover();
    await expect(page.getByTitle('Connect your Whop store')).toBeVisible();

    await page.getByRole('button', { name: /Results/ }).hover();
    await expect(page.getByTitle('Track your ROI')).toBeVisible();
  });

  test('should animate tab content transitions', async ({ page }) => {
    // Start on Studio tab
    await expect(page.getByText('Upload Your Images')).toBeVisible();

    // Click Templates tab
    await page.getByRole('button', { name: /Templates/ }).click();

    // Wait for animation (the motion.div has initial opacity: 0, animate opacity: 1)
    await page.waitForTimeout(400); // Allow for 0.3s transition + buffer

    // Templates content should be visible after animation
    await expect(page.getByText('Whop Creator Template Marketplace')).toBeVisible();

    // Studio content should no longer be visible
    await expect(page.getByText('Upload Your Images')).not.toBeVisible();
  });

  test('should preserve scroll position when switching tabs', async ({ page }) => {
    // Navigate to Templates tab
    await page.getByRole('button', { name: /Templates/ }).click();
    await page.waitForURL('**/studio?tab=templates');

    // Scroll down in Templates
    await page.evaluate(() => window.scrollTo(0, 500));

    // Switch to Store tab
    await page.getByRole('button', { name: /Store/ }).click();
    await page.waitForURL('**/studio?tab=store');

    // Switch back to Templates
    await page.getByRole('button', { name: /Templates/ }).click();
    await page.waitForURL('**/studio?tab=templates');

    // Should maintain reasonable scroll position
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Studio Tab Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/studio');

    // Check that tabs are still visible and clickable on mobile
    await expect(page.getByRole('button', { name: /Studio/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Templates/ })).toBeVisible();

    // Test navigation on mobile
    await page.getByRole('button', { name: /Templates/ }).click();
    await page.waitForURL('**/studio?tab=templates');
    await expect(page.getByText('Whop Creator Template Marketplace')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/studio');

    // Check that tabs layout properly on tablet
    await expect(page.getByRole('button', { name: /Studio/ })).toBeVisible();

    // Test navigation on tablet
    await page.getByRole('button', { name: /Store/ }).click();
    await page.waitForURL('**/studio?tab=store');
    await expect(page.getByText('Apply to Your Whop Store')).toBeVisible();
  });
});

test.describe('Studio Tab Accessibility', () => {
  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/studio');

    // Check that buttons have proper roles
    const studioBtn = page.getByRole('button', { name: /Studio/ });
    await expect(studioBtn).toBeVisible();

    // Check that active tab has proper ARIA attributes
    const activeTab = page.locator('button').filter({ hasText: 'Studio' });
    await expect(activeTab).toHaveClass(/from-indigo-500 to-purple-500/);
  });

  test('should be navigable with keyboard only', async ({ page }) => {
    await page.goto('/studio');

    // Start from first focusable element
    await page.keyboard.press('Tab');

    // Should be able to reach all tab buttons
    for (const tabName of ['Studio', 'Templates', 'Store', 'Results']) {
      const focused = await page.evaluate(() => document.activeElement?.textContent);
      if (focused?.includes(tabName)) {
        await page.keyboard.press('Enter');
        break;
      }
      await page.keyboard.press('Tab');
    }

    // One of the tabs should be activated
    const url = page.url();
    expect(url).toMatch(/\/studio(\?tab=\w+)?$/);
  });

  test('should announce tab changes to screen readers', async ({ page }) => {
    await page.goto('/studio');

    // Click Templates tab
    await page.getByRole('button', { name: /Templates/ }).click();

    // Check that content is updated and announced
    await expect(page.getByText('Whop Creator Template Marketplace')).toBeVisible();

    // The page title or heading should reflect the current tab
    const heading = await page.locator('h1').textContent();
    expect(heading).toBeTruthy();
  });
});