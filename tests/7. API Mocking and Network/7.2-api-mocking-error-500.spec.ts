import { test, expect } from '@playwright/test';

/**
 * Scenario 7.2: Mock API → return error 500 → verify error message
 * Page: /practice/random-weather-v1.html
 * Key metric: Error handling
 *
 * Goal: Compare error handling capabilities when API returns server errors
 *
 * Page structure:
 * - #results-container: Container for weather table
 * - #results-summary: Summary container
 * - #alerts-placeholder: Container for alert messages
 * - #message-container: Container for error details
 * - [data-testid="dti-simple-alert-with-custom-message"]: Alert message element
 * - API endpoint: GET /api/v1/data/random/weather-simple?days=3
 *
 * Error handling (from response-helpers.js):
 * - Status 500: Displays "Internal server error" alert with red background
 * - Message: "Oh no! Something went wrong on our end. Please try again later"
 *
 * Differences between technologies:
 * - Playwright: page.route() + route.fulfill({ status: 500 }) - simple error mocking
 * - Selenium: Requires proxy setup to return error codes
 * - Cypress: cy.intercept() with statusCode: 500
 *
 * Metric: Lines of code for error mocking, error message verification
 */
test.describe('7.2 - API Mocking with Error 500', () => {
  test('should display error message when API returns 500 Internal Server Error', async ({
    page,
  }) => {
    // Arrange - Set up API route to return 500 error
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Error alert should be displayed
    const alertMessage = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(alertMessage).toBeVisible({ timeout: 5000 });
    await expect(alertMessage).toContainText('Internal server error');
  });

  test('should display red background for 500 error alert', async ({
    page,
  }) => {
    // Arrange - Set up API route to return 500 error
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server Error' }),
        });
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Alert should have red background
    const alertMessage = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(alertMessage).toBeVisible({ timeout: 5000 });

    const backgroundColor = await alertMessage.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    // Red is rgb(255, 0, 0) in computed style
    expect(backgroundColor).toBe('rgb(255, 0, 0)');
  });

  test('should not display weather table when API returns 500', async ({
    page,
  }) => {
    // Arrange - Set up API route to return 500 error
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Results table should not be present
    const resultsTable = page.locator('#results-table');
    await expect(resultsTable).not.toBeVisible();
  });

  test('should handle 400 Bad Request error', async ({ page }) => {
    // Arrange - Set up API route to return 400 error
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Bad Request' }),
        });
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Error alert should be displayed
    const alertMessage = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(alertMessage).toBeVisible({ timeout: 5000 });
    await expect(alertMessage).toContainText('Bad request');
  });

  test('should handle 401 Unauthorized error', async ({ page }) => {
    // Arrange - Set up API route to return 401 error
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' }),
        });
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Error alert should be displayed
    const alertMessage = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(alertMessage).toBeVisible({ timeout: 5000 });
    await expect(alertMessage).toContainText('not authorized');
  });

  test('should handle 403 Forbidden error', async ({ page }) => {
    // Arrange - Set up API route to return 403 error
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Forbidden' }),
        });
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Error alert should be displayed
    const alertMessage = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(alertMessage).toBeVisible({ timeout: 5000 });
    await expect(alertMessage).toContainText('do not have permission');
  });

  test('should handle 404 Not Found error', async ({ page }) => {
    // Arrange - Set up API route to return 404 error
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not Found' }),
        });
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Error alert should be displayed
    const alertMessage = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(alertMessage).toBeVisible({ timeout: 5000 });
    await expect(alertMessage).toContainText('does not exist');
  });

  test('should handle 503 Service Unavailable error', async ({ page }) => {
    // Arrange - Set up API route to return 503 error
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service Unavailable' }),
        });
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Error alert should be displayed
    const alertMessage = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(alertMessage).toBeVisible({ timeout: 5000 });
    await expect(alertMessage).toContainText('Service unavailable');
  });

  test('should handle 502 Bad Gateway error', async ({ page }) => {
    // Arrange - Set up API route to return 502 error
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.fulfill({
          status: 502,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Bad Gateway' }),
        });
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Error alert should be displayed
    const alertMessage = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(alertMessage).toBeVisible({ timeout: 5000 });
    await expect(alertMessage).toContainText('Bad gateway');
  });

  test('should handle 418 I am a teapot (RFC 2324)', async ({ page }) => {
    // Arrange - Set up API route to return 418 error (Easter egg)
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.fulfill({
          status: 418,
          contentType: 'application/json',
          body: JSON.stringify({ error: "I'm a teapot" }),
        });
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Error alert should be displayed with teapot message
    const alertMessage = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(alertMessage).toBeVisible({ timeout: 5000 });
    await expect(alertMessage).toContainText('teapot');
  });

  test('should verify error alert disappears after timeout', async ({
    page,
  }) => {
    // Arrange - Set up API route to return 500 error
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Alert should be visible initially
    const alertMessage = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(alertMessage).toBeVisible({ timeout: 5000 });

    // Assert - Alert should disappear after 3 seconds (as per alerts.js)
    await expect(alertMessage).not.toBeVisible({ timeout: 5000 });
  });

  test('should verify API request was made before error', async ({ page }) => {
    // Arrange - Track API request
    let apiWasCalled = false;
    let requestUrl = '';

    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        apiWasCalled = true;
        requestUrl = route.request().url();
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      }
    );

    // Act - Navigate to the page (set up request wait before goto to capture async API call)
    const requestPromise = page.waitForRequest('**/api/v1/data/random/weather-simple**');
    await page.goto('/practice/random-weather-v1.html');
    await requestPromise;

    // Assert - API should have been called
    expect(apiWasCalled).toBe(true);
    expect(requestUrl).toContain('weather-simple');
  });

  test('should measure error handling execution time for metrics', async ({
    page,
  }) => {
    // Arrange - Set up timing measurement
    const startTime = Date.now();

    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Wait for error alert to appear
    const alertMessage = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(alertMessage).toBeVisible({ timeout: 5000 });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`Error handling execution time: ${executionTime}ms`);

    // Assert - Operation completed successfully
    expect(executionTime).toBeGreaterThan(0);
  });

  test('should display error alert for 500 status regardless of response body content', async ({
    page,
  }) => {
    // Arrange - Set up API route with a custom error body
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Database connection failed' }),
        });
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Alert should be displayed
    const alertMessage = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(alertMessage).toBeVisible({ timeout: 5000 });
  });

  test('should handle 429 Too Many Requests error', async ({ page }) => {
    // Arrange - Set up API route to return 429 error
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Rate limit exceeded' }),
        });
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Error alert should be displayed
    const alertMessage = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(alertMessage).toBeVisible({ timeout: 5000 });
    await expect(alertMessage).toContainText('Too many requests');
  });

  test('should display error details in message container', async ({
    page,
  }) => {
    // Arrange - Set up API route to return 500 error with error details
    await page.route(
      '**/api/v1/data/random/weather-simple**',
      async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Custom error details from server' }),
        });
      }
    );

    // Act - Navigate to the page
    await page.goto('/practice/random-weather-v1.html');

    // Assert - Message container should be visible with error details
    const messageContainer = page.locator('#message-container');
    await expect(messageContainer).toBeVisible({ timeout: 5000 });
  });
});
