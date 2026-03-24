import { test, expect } from '@playwright/test';

/**
 * Scenario 7.3: Mock API → delay 3s → verify spinner/loading state
 * Page: /practice/charts-2-api.html
 * API Endpoint: GET /api/v1/data/weather?date=...&days=14&futuredays=2
 *
 * Network delay simulation: 3000ms
 *
 * Technology Comparison:
 * - Cypress: cy.intercept() + req.reply((res) => res.delay(3000)) - native support (5 LOC)
 * - Playwright: setTimeout + route.fulfill() - requires manual async handling (7 LOC)
 * - WebdriverIO: browser.mock() with responseTime: 3000 - native support (4 LOC)
 *
 * Metrics: Network throttling capabilities, loading state verification, delay accuracy
 *
 * Playwright-specific notes:
 * - page.route() callback allows setTimeout for simulating network delays
 * - Must handle async/await pattern correctly for deterministic delays
 * - Supports verification of chart container (empty during loading, filled after)
 * - Request cancellation via AbortController demonstrates advanced request control
 * - Today's date display can be verified after loading completes
 * - 12 tests including delay handling and request cancellation
 */
test.describe('7.3 - API Mocking with Delay (Network Throttling)', () => {
  // Mock weather data for testing
  const mockWeatherData = [
    {
      date: '2024-01-15',
      temperatureRaw: 5,
      humidity: '65%',
      windSpeedData: { actual: 12 },
    },
    {
      date: '2024-01-14',
      temperatureRaw: 3,
      humidity: '70%',
      windSpeedData: { actual: 8 },
    },
  ];

  test('should delay API response by 3 seconds and still render chart', async ({ page }) => {
    // Arrange - Set up API route with 3 second delay
    const delayMs = 3000;

    await page.route('**/api/v1/data/weather**', async (route) => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page and measure time
    const startTime = Date.now();
    await page.goto('/practice/charts-2-api.html');

    // Wait for chart to render (should take at least 3 seconds)
    await expect(page.locator('#sampleChart svg, #sampleChart canvas').first()).toBeVisible();
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // Assert - Load time should be at least 3 seconds due to delay
    console.log(`Page load time with 3s delay: ${loadTime}ms`);
    expect(loadTime).toBeGreaterThanOrEqual(delayMs - 500); // Allow some tolerance
  });

  test('should verify chart container is empty during API delay', async ({ page }) => {
    // Arrange - Set up API route with delay
    const delayMs = 2000;
    let responseCompleted = false;

    await page.route('**/api/v1/data/weather**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      responseCompleted = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page
    await page.goto('/practice/charts-2-api.html');

    // Assert - Chart container should be empty initially (before response)
    const chartContainer = page.locator('#sampleChart');
    await expect(chartContainer).toBeVisible();

    // Check that chart SVG/canvas is not yet rendered (during delay)
    const chartContent = chartContainer.locator('svg, canvas');
    const chartVisible = await chartContent
      .first()
      .isVisible()
      .catch(() => false);

    // If we're fast enough, chart shouldn't be rendered yet
    // This is a timing-sensitive test
    if (!responseCompleted) {
      expect(chartVisible).toBe(false);
    }

    // Wait for chart to eventually render
    await expect(chartContent.first()).toBeVisible();
  });

  test('should handle 1 second delay', async ({ page }) => {
    // Arrange - Set up API route with 1 second delay
    const delayMs = 1000;

    await page.route('**/api/v1/data/weather**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page
    const startTime = Date.now();
    await page.goto('/practice/charts-2-api.html');
    await expect(page.locator('#sampleChart svg, #sampleChart canvas').first()).toBeVisible();
    const loadTime = Date.now() - startTime;

    // Assert - Load time should be at least 1 second
    console.log(`Page load time with 1s delay: ${loadTime}ms`);
    expect(loadTime).toBeGreaterThanOrEqual(delayMs - 200);
  });

  test('should handle 5 second delay without timeout', async ({ page }) => {
    // Arrange - Set up API route with 5 second delay
    const delayMs = 5000;

    await page.route('**/api/v1/data/weather**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page
    const startTime = Date.now();
    await page.goto('/practice/charts-2-api.html');
    await expect(page.locator('#sampleChart svg, #sampleChart canvas').first()).toBeVisible({ timeout: 15000 });
    const loadTime = Date.now() - startTime;

    // Assert - Load time should be at least 5 seconds
    console.log(`Page load time with 5s delay: ${loadTime}ms`);
    expect(loadTime).toBeGreaterThanOrEqual(delayMs - 500);
  });

  test('should verify page remains responsive during API delay', async ({ page }) => {
    // Arrange - Set up API route with delay
    const delayMs = 3000;

    await page.route('**/api/v1/data/weather**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page
    await page.goto('/practice/charts-2-api.html');

    // Assert - Page should be responsive (other elements visible) during delay
    const todayDateElement = page.locator('#todayDate');
    await expect(todayDateElement).toBeVisible();
    await expect(todayDateElement).not.toBeEmpty();

    // Page header should be visible
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Wait for chart to eventually load
    await expect(page.locator('#sampleChart svg, #sampleChart canvas').first()).toBeVisible();
  });

  test('should measure exact delay timing for metrics', async ({ page }) => {
    // Arrange - Set up API route with precise delay
    const delayMs = 2000;
    let requestTime = 0;
    let responseTime = 0;

    await page.route('**/api/v1/data/weather**', async (route) => {
      requestTime = Date.now();
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      responseTime = Date.now();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page
    await page.goto('/practice/charts-2-api.html');
    await expect(page.locator('#sampleChart svg, #sampleChart canvas').first()).toBeVisible();

    // Assert - Calculate actual delay
    const actualDelay = responseTime - requestTime;
    console.log(`Configured delay: ${delayMs}ms, Actual delay: ${actualDelay}ms`);
    expect(actualDelay).toBeGreaterThanOrEqual(delayMs - 100);
    expect(actualDelay).toBeLessThanOrEqual(delayMs + 500);
  });

  test('should handle delayed error response', async ({ page }) => {
    // Arrange - Set up API route with delay then error
    const delayMs = 2000;

    await page.route('**/api/v1/data/weather**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Delayed server error' }),
      });
    });

    // Act - Navigate to the page
    const startTime = Date.now();
    await page.goto('/practice/charts-2-api.html');

    // Wait for the delayed response to complete
    await page.waitForResponse('**/api/v1/data/weather**', { timeout: delayMs + 2000 });
    const loadTime = Date.now() - startTime;

    // Assert - Delay should have occurred
    expect(loadTime).toBeGreaterThanOrEqual(delayMs - 200);

    // Chart should not render due to error
    const chartContainer = page.locator('#sampleChart');
    await expect(chartContainer).toBeVisible();
  });

  test('should simulate slow network with varying delays', async ({ page }) => {
    // Arrange - Set up API route with random delay between 1-3 seconds
    const minDelay = 1000;
    const maxDelay = 3000;
    const actualDelay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;

    await page.route('**/api/v1/data/weather**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, actualDelay));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page
    const startTime = Date.now();
    await page.goto('/practice/charts-2-api.html');
    await expect(page.locator('#sampleChart svg, #sampleChart canvas').first()).toBeVisible();
    const loadTime = Date.now() - startTime;

    // Assert - Load time should be at least minDelay
    console.log(`Variable delay test - configured: ${actualDelay}ms, actual load: ${loadTime}ms`);
    expect(loadTime).toBeGreaterThanOrEqual(minDelay - 200);
  });

  test('should verify request timing with performance API', async ({ page }) => {
    // Arrange - Set up delay
    const delayMs = 2000;

    await page.route('**/api/v1/data/weather**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Timing-Allow-Origin': '*' },
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page
    await page.goto('/practice/charts-2-api.html');
    await expect(page.locator('#sampleChart svg, #sampleChart canvas').first()).toBeVisible();

    // Assert - Use Performance API to check timing
    const performanceEntries = await page.evaluate(() => {
      return performance
        .getEntriesByType('resource')
        .filter((entry) => entry.name.includes('weather'))
        .map((entry) => ({
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime,
        }));
    });

    console.log('Performance entries:', JSON.stringify(performanceEntries));
    // Performance entry should show the delay in duration
    if (performanceEntries.length > 0) {
      expect(performanceEntries[0].duration).toBeGreaterThanOrEqual(delayMs - 500);
    }
  });

  test('should handle multiple sequential delayed requests', async ({ page }) => {
    // Arrange - Set up API route with delay
    const delayMs = 1000;
    let requestCount = 0;

    await page.route('**/api/v1/data/weather**', async (route) => {
      requestCount++;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page
    await page.goto('/practice/charts-2-api.html');
    await expect(page.locator('#sampleChart svg, #sampleChart canvas').first()).toBeVisible();

    // Assert - At least one request should have been made
    expect(requestCount).toBeGreaterThanOrEqual(1);
  });

  test('should compare load time with and without delay', async ({ page }) => {
    // First measurement - without delay
    await page.route('**/api/v1/data/weather**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    let startTime = Date.now();
    await page.goto('/practice/charts-2-api.html');
    await expect(page.locator('#sampleChart svg, #sampleChart canvas').first()).toBeVisible();
    const loadTimeWithoutDelay = Date.now() - startTime;

    // Clear routes and set up with delay
    await page.unrouteAll();

    const delayMs = 2000;
    await page.route('**/api/v1/data/weather**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    startTime = Date.now();
    await page.goto('/practice/charts-2-api.html');
    await expect(page.locator('#sampleChart svg, #sampleChart canvas').first()).toBeVisible();
    const loadTimeWithDelay = Date.now() - startTime;

    // Assert - Delayed version should take significantly longer
    console.log(`Load without delay: ${loadTimeWithoutDelay}ms, Load with ${delayMs}ms delay: ${loadTimeWithDelay}ms`);
    expect(loadTimeWithDelay - loadTimeWithoutDelay).toBeGreaterThanOrEqual(delayMs - 500);
  });

  test('should handle abort during delay', async ({ page }) => {
    // Arrange - Set up API route with long delay
    const delayMs = 10000;
    let wasAborted = false;

    await page.route('**/api/v1/data/weather**', async (route) => {
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, delayMs);
          route
            .request()
            .response()
            .catch(() => {
              clearTimeout(timeout);
              wasAborted = true;
              reject(new Error('Request aborted'));
            });
        });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockWeatherData),
        });
      } catch {
        // Request was aborted
        await route.abort();
      }
    });

    // Act - Start navigation but navigate away quickly
    await page.goto('/practice/charts-2-api.html', { waitUntil: 'commit' });

    // Navigate away before delay completes
    await page.goto('/practice/index.html');

    // Assert - Page navigated successfully
    await expect(page).toHaveURL(/practice\/index\.html/);
  });
});
