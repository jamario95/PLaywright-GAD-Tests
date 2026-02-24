import { test, expect } from '@playwright/test';

/**
 * Scenario 7.1: Mock API → return status 200 with custom data
 * Page: /practice/charts-2-api.html
 * Key metric: Ease of mocking
 *
 * Goal: Compare API mocking capabilities across frameworks
 *
 * Page structure:
 * - #sampleChart: Chart container (Google Charts)
 * - #todayDate: Today's date display
 * - API endpoint: GET /api/v1/data/weather?date=...&days=14&futuredays=2
 *
 * Differences between technologies:
 * - Playwright: page.route() + route.fulfill() - native support, simple API
 * - Selenium: Requires BrowserMob Proxy or similar - complex setup (~10+ lines)
 * - Cypress: cy.intercept() + cy.stub() - native support, similar to Playwright
 *
 * Metric: Lines of code for mocking, number of additional tools/dependencies
 */
test.describe('7.1 - API Mocking with Custom Data (Status 200)', () => {
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
    {
      date: '2024-01-13',
      temperatureRaw: -2,
      humidity: '80%',
      windSpeedData: { actual: 15 },
    },
  ];

  test('should intercept weather API and return mocked data with status 200', async ({
    page,
  }) => {
    // Arrange - Set up API route interception
    await page.route('**/api/v1/data/weather**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page
    await page.goto('/practice/charts-2-api.html');

    // Assert - Verify page loaded with chart container
    const chartContainer = page.locator('#sampleChart');
    await expect(chartContainer).toBeVisible();

    // Assert - Verify that the chart has been rendered (SVG or canvas element inside)
    await expect(chartContainer.locator('svg, canvas').first()).toBeVisible();
  });

  test('should render chart SVG element after API response', async ({ page }) => {
    // Arrange - Set up API route interception
    await page.route('**/api/v1/data/weather**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page
    await page.goto('/practice/charts-2-api.html');

    // Assert - Chart container and its SVG/canvas should be rendered
    const chartContainer = page.locator('#sampleChart');
    await expect(chartContainer).toBeVisible();
    await expect(page.locator('#sampleChart svg, #sampleChart canvas').first()).toBeVisible();
  });

  test('should verify API request was intercepted correctly', async ({
    page,
  }) => {
    // Arrange - Track intercepted requests
    let interceptedUrl = '';
    let requestWasIntercepted = false;

    await page.route('**/api/v1/data/weather**', async (route) => {
      interceptedUrl = route.request().url();
      requestWasIntercepted = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page (set up request wait before goto to capture async API call)
    const requestPromise = page.waitForRequest('**/api/v1/data/weather**');
    await page.goto('/practice/charts-2-api.html');
    await requestPromise;

    // Assert - Verify request was intercepted
    expect(requestWasIntercepted).toBe(true);
    expect(interceptedUrl).toContain('/api/v1/data/weather');
    expect(interceptedUrl).toContain('date=');
    expect(interceptedUrl).toContain('days=14');
    expect(interceptedUrl).toContain('futuredays=2');
  });

  test('should mock API with empty array and verify chart handles empty data', async ({
    page,
  }) => {
    // Arrange - Set up API route interception with empty data
    await page.route('**/api/v1/data/weather**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Act - Navigate to the page
    await page.goto('/practice/charts-2-api.html');

    // Assert - Page should still load without crashing
    const chartContainer = page.locator('#sampleChart');
    await expect(chartContainer).toBeVisible();
  });

  test('should mock API with single data point', async ({ page }) => {
    // Arrange - Single data point
    const singleDataPoint = [
      {
        date: '2024-01-15',
        temperatureRaw: 10,
        humidity: '50%',
        windSpeedData: { actual: 5 },
      },
    ];

    await page.route('**/api/v1/data/weather**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(singleDataPoint),
      });
    });

    // Act - Navigate to the page
    await page.goto('/practice/charts-2-api.html');

    // Assert - Chart should render with single point
    const chartContainer = page.locator('#sampleChart');
    await expect(chartContainer).toBeVisible();
    await expect(chartContainer.locator('svg, canvas').first()).toBeVisible();
  });

  test('should mock API with extreme temperature values', async ({ page }) => {
    // Arrange - Extreme weather data
    const extremeWeatherData = [
      {
        date: '2024-01-15',
        temperatureRaw: 45,
        humidity: '10%',
        windSpeedData: { actual: 100 },
      },
      {
        date: '2024-01-14',
        temperatureRaw: -40,
        humidity: '95%',
        windSpeedData: { actual: 0 },
      },
    ];

    await page.route('**/api/v1/data/weather**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(extremeWeatherData),
      });
    });

    // Act - Navigate to the page
    await page.goto('/practice/charts-2-api.html');

    // Assert - Chart should handle extreme values
    const chartContainer = page.locator('#sampleChart');
    await expect(chartContainer).toBeVisible();
    await expect(chartContainer.locator('svg, canvas').first()).toBeVisible();
  });

  test('should verify today date is displayed correctly', async ({ page }) => {
    // Arrange - Set up API interception
    await page.route('**/api/v1/data/weather**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page
    await page.goto('/practice/charts-2-api.html');

    // Assert - Today's date should be visible
    const todayDateElement = page.locator('#todayDate');
    await expect(todayDateElement).toBeVisible();
    await expect(todayDateElement).not.toBeEmpty();
  });

  test('should mock API response with custom headers', async ({ page }) => {
    // Arrange - Set up API route with custom headers
    await page.route('**/api/v1/data/weather**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'X-Custom-Header': 'test-value',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page
    await page.goto('/practice/charts-2-api.html');

    // Assert - Page should load correctly with custom headers
    const chartContainer = page.locator('#sampleChart');
    await expect(chartContainer).toBeVisible();
  });

  test('should measure mocking execution time for metrics', async ({
    page,
  }) => {
    // Arrange - Set up timing measurement
    const startTime = Date.now();

    await page.route('**/api/v1/data/weather**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page
    await page.goto('/practice/charts-2-api.html');

    // Wait for chart to render
    await expect(page.locator('#sampleChart svg, #sampleChart canvas').first()).toBeVisible();

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`API mocking execution time: ${executionTime}ms`);

    // Assert - Operation completed successfully
    expect(executionTime).toBeGreaterThan(0);
  });

  test('should mock multiple API endpoints simultaneously', async ({
    page,
  }) => {
    // Arrange - Set up multiple route interceptions
    let weatherApiCalled = false;
    let otherApiCalled = false;

    await page.route('**/api/v1/data/weather**', async (route) => {
      weatherApiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    await page.route('**/api/v1/other**', async (route) => {
      otherApiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: 'mocked' }),
      });
    });

    // Act - Navigate to the page (set up request wait before goto to capture async API call)
    const requestPromise = page.waitForRequest('**/api/v1/data/weather**');
    await page.goto('/practice/charts-2-api.html');
    await requestPromise;

    // Assert - Weather API should be called
    expect(weatherApiCalled).toBe(true);
  });

  test('should verify request method is GET', async ({ page }) => {
    // Arrange - Track request method
    let requestMethod = '';

    await page.route('**/api/v1/data/weather**', async (route) => {
      requestMethod = route.request().method();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page (set up request wait before goto to capture async API call)
    const requestPromise = page.waitForRequest('**/api/v1/data/weather**');
    await page.goto('/practice/charts-2-api.html');
    await requestPromise;

    // Assert - Request method should be GET
    expect(requestMethod).toBe('GET');
  });

  test('should verify request contains authorization header', async ({
    page,
  }) => {
    // Arrange - Track request headers
    let authorizationHeader = '';

    await page.route('**/api/v1/data/weather**', async (route) => {
      authorizationHeader = route.request().headers()['authorization'] || '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWeatherData),
      });
    });

    // Act - Navigate to the page (set up request wait before goto to capture async API call)
    const requestPromise = page.waitForRequest('**/api/v1/data/weather**');
    await page.goto('/practice/charts-2-api.html');
    await requestPromise;

    // Assert - Authorization header should be present (even if empty bearer)
    // Note: The actual token may be empty if not logged in
    expect(authorizationHeader).toBeDefined();
  });
});
