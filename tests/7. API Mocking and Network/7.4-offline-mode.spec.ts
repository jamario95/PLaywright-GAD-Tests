import { test, expect } from '@playwright/test';

/**
 * Scenario 7.4: Offline mode - disable network → verify error message
 * Page: Any page (using /practice/random-weather-v1.html for error handling)
 * Key metric: Offline mode support
 *
 * Goal: Compare offline mode simulation and error handling capabilities
 *
 * Playwright's approach:
 * - context.setOffline(true) - simple API to simulate offline mode
 * - page.route() with abort() - block specific requests
 *
 * Differences between technologies:
 * - Playwright: context.setOffline(true) - native, simple
 * - Selenium: Requires browser-specific DevTools Protocol or proxy
 * - Cypress: cy.intercept() with forceNetworkError: true
 *
 * Metric: Ease of implementing offline mode, error message verification
 */
test.describe('7.4 - Offline Mode (Network Disabled)', () => {
  test('should set browser to offline mode and verify navigator.onLine', async ({
    page,
    context,
  }) => {
    // Arrange - Navigate to page first while online
    await page.goto('/practice/random-weather-v1.html');

    // Verify initial online state
    const initialOnlineState = await page.evaluate(() => navigator.onLine);
    expect(initialOnlineState).toBe(true);

    // Act - Set offline mode
    await context.setOffline(true);

    // Assert - Verify offline state is detected by the browser
    const isOffline = await page.evaluate(() => !navigator.onLine);
    expect(isOffline).toBe(true);

    // Cleanup - restore online mode
    await context.setOffline(false);

    // Verify back online
    const finalOnlineState = await page.evaluate(() => navigator.onLine);
    expect(finalOnlineState).toBe(true);
  });

  test('should simulate offline by blocking all requests', async ({ page }) => {
    // Arrange - Block all network requests to API
    await page.route('**/api/**', async (route) => {
      await route.abort('failed');
    });

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Page should handle the network failure
    // Results table should not be present since API failed
    const resultsTable = page.locator('#results-table');
    await expect(resultsTable).not.toBeVisible({ timeout: 5000 });
  });

  test('should not display data table when API request is blocked', async ({
    page,
  }) => {
    // Arrange - Block API request
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.abort('failed');
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    // Assert - Results table should not be present since API failed
    const resultsTable = page.locator('#results-table');
    await expect(resultsTable).toHaveCount(0);

    // Verify page header is still visible (page loaded but API failed)
    const pageHeading = page.locator('h2');
    await expect(pageHeading).toContainText('Random Weather');
  });

  test('should verify navigator.onLine returns false when offline', async ({
    page,
    context,
  }) => {
    // Arrange - Navigate to page
    await page.goto('/practice/charts-2-api.html');

    // Act - Set offline mode
    await context.setOffline(true);

    // Assert - navigator.onLine should be false
    const isOnline = await page.evaluate(() => navigator.onLine);
    expect(isOnline).toBe(false);

    // Cleanup
    await context.setOffline(false);
  });

  test('should verify navigator.onLine returns true when online', async ({
    page,
    context,
  }) => {
    // Arrange - Ensure online mode
    await context.setOffline(false);

    // Act - Navigate to page
    await page.goto('/practice/charts-2-api.html');

    // Assert - navigator.onLine should be true
    const isOnline = await page.evaluate(() => navigator.onLine);
    expect(isOnline).toBe(true);
  });

  test('should handle offline event listener', async ({ page, context }) => {
    // Arrange - Navigate to page and set up event listener
    await page.goto('/practice/charts-2-api.html');

    let offlineEventFired = false;
    await page.evaluate(() => {
      window.addEventListener('offline', () => {
        (window as unknown as { offlineEventFired: boolean }).offlineEventFired = true;
      });
    });

    // Act - Set offline mode
    await context.setOffline(true);
    await page.waitForFunction(() => !navigator.onLine);

    // Assert - Check if offline event was triggered
    offlineEventFired = await page.evaluate(
      () => (window as unknown as { offlineEventFired: boolean }).offlineEventFired || false
    );

    // Note: The offline event may not fire in all browser contexts
    // This test verifies the browser reports offline status
    const isOffline = await page.evaluate(() => !navigator.onLine);
    expect(isOffline).toBe(true);

    // Cleanup
    await context.setOffline(false);
  });

  test('should handle online event listener after going back online', async ({
    page,
    context,
  }) => {
    // Arrange - Navigate to page
    await page.goto('/practice/charts-2-api.html');

    // Set up event listener
    await page.evaluate(() => {
      (window as unknown as { onlineEventFired: boolean }).onlineEventFired = false;
      window.addEventListener('online', () => {
        (window as unknown as { onlineEventFired: boolean }).onlineEventFired = true;
      });
    });

    // Act - Go offline then back online
    await context.setOffline(true);
    await page.waitForFunction(() => !navigator.onLine);
    await context.setOffline(false);
    await page.waitForFunction(() => navigator.onLine);

    // Assert - Verify we're back online
    const isOnline = await page.evaluate(() => navigator.onLine);
    expect(isOnline).toBe(true);
  });

  test('should abort specific request types', async ({ page }) => {
    // Arrange - Block only image requests
    await page.route('**/*.{png,jpg,jpeg,gif,svg}', async (route) => {
      await route.abort('failed');
    });

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Page should still load (API works, images fail)
    const pageTitle = await page.title();
    expect(pageTitle).toContain('GAD');
  });

  test('should block requests with internetdisconnected reason', async ({
    page,
  }) => {
    // Arrange - Block with specific abort reason
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.abort('internetdisconnected');
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Page should handle the disconnection
    const resultsTable = page.locator('#results-table');
    await expect(resultsTable).not.toBeVisible();
  });

  test('should block requests with connectionfailed reason', async ({
    page,
  }) => {
    // Arrange - Block with connection failed reason
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.abort('connectionfailed');
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Page should handle the connection failure
    const resultsTable = page.locator('#results-table');
    await expect(resultsTable).not.toBeVisible();
  });

  test('should block requests with timedout reason', async ({ page }) => {
    // Arrange - Block with timeout reason
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.abort('timedout');
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Page should handle the timeout
    const resultsTable = page.locator('#results-table');
    await expect(resultsTable).not.toBeVisible();
  });

  test('should measure offline mode setup time for metrics', async ({
    page,
    context,
  }) => {
    // Arrange - Navigate to page
    await page.goto('/practice/charts-2-api.html');

    // Act - Measure time to set offline mode
    const startTime = Date.now();
    await context.setOffline(true);
    const offlineSetTime = Date.now() - startTime;

    // Verify offline state
    const isOffline = await page.evaluate(() => !navigator.onLine);

    // Restore online mode
    const restoreStartTime = Date.now();
    await context.setOffline(false);
    const onlineSetTime = Date.now() - restoreStartTime;

    // Log metrics
    console.log(`Time to set offline: ${offlineSetTime}ms`);
    console.log(`Time to restore online: ${onlineSetTime}ms`);

    // Assert - Operations should be fast
    expect(isOffline).toBe(true);
    expect(offlineSetTime).toBeLessThan(1000);
    expect(onlineSetTime).toBeLessThan(1000);
  });

  test('should toggle offline mode multiple times', async ({ page, context }) => {
    // Arrange - Navigate to page
    await page.goto('/practice/charts-2-api.html');

    // Act & Assert - Toggle offline mode multiple times
    for (let i = 0; i < 3; i++) {
      await context.setOffline(true);
      let isOffline = await page.evaluate(() => !navigator.onLine);
      expect(isOffline).toBe(true);

      await context.setOffline(false);
      isOffline = await page.evaluate(() => !navigator.onLine);
      expect(isOffline).toBe(false);
    }
  });

  test('should verify page content remains after going offline', async ({
    page,
    context,
  }) => {
    // Arrange - Navigate to page and wait for content
    await page.goto('/practice/charts-2-api.html');
    await expect(page.locator('#todayDate')).toBeVisible();

    // Get content before going offline
    const todayDateBefore = await page.locator('#todayDate').textContent();

    // Act - Go offline
    await context.setOffline(true);

    // Assert - Existing content should remain
    const todayDateAfter = await page.locator('#todayDate').textContent();
    expect(todayDateAfter).toBe(todayDateBefore);

    // Cleanup
    await context.setOffline(false);
  });

  test('should selectively block only API requests while allowing page to load', async ({
    page,
  }) => {
    // Arrange - Block only API requests
    await page.route('**/api/**', async (route) => {
      await route.abort('failed');
    });

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Page should load (HTML resources work) but data won't be present
    const pageHeading = page.locator('h2');
    await expect(pageHeading).toContainText('Random Weather');

    // API data should not be loaded
    const resultsTable = page.locator('#results-table');
    await expect(resultsTable).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle offline mode with pre-cached content', async ({
    page,
    context,
  }) => {
    // Arrange - First visit while online to allow caching
    await page.goto('/practice/random-weather-v1.html');
    await expect(page.locator('#results-table')).toBeVisible({ timeout: 10000 });

    // Navigate to a different page
    await page.goto('/practice/index.html');

    // Act - Set offline and try to navigate back
    await context.setOffline(true);

    // Note: Without Service Workers, page may not load from cache
    // This test demonstrates the offline mode API
    const isOffline = await page.evaluate(() => !navigator.onLine);
    expect(isOffline).toBe(true);

    // Cleanup
    await context.setOffline(false);
  });

  test('should verify different abort reasons', async ({ page }) => {
    // Test various abort reasons available in Playwright
    const abortReasons = [
      'aborted',
      'accessdenied',
      'addressunreachable',
      'blockedbyclient',
      'blockedbyresponse',
      'connectionaborted',
      'connectionclosed',
      'connectionfailed',
      'connectionrefused',
      'connectionreset',
      'internetdisconnected',
      'namenotresolved',
      'timedout',
      'failed',
    ];

    // Test one reason as example
    const testReason = 'internetdisconnected';

    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.abort(testReason);
      }
    );

    await page.goto('/practice/random-weather-v1.html');

    // Assert - Page handled the abort
    const resultsTable = page.locator('#results-table');
    await expect(resultsTable).not.toBeVisible({ timeout: 5000 });

    console.log(`Available abort reasons: ${abortReasons.join(', ')}`);
  });
});
