import { test, expect } from '@playwright/test';

/**
 * Scenario 5.3: Download with error → verify error handling behavior
 * Page: /practice/downloads/simple-docx-download-error.html
 * Key metric: Error handling
 *
 * Goal: Compare error handling capabilities during file downloads
 *
 * Page structure:
 * - #download-report-btn: Download button
 * - #btn-text: Button text (changes during download)
 * - #status-message: Status message
 * - #progress-fill: Progress bar fill
 * - #progress-text: Progress percentage text
 *
 * API endpoint: POST /api/practice/download/docx with header 'invoke-error-file-too-big': '1'
 * This triggers a 500 error response from the server.
 *
 * Note: The page's JavaScript silently handles the error by early return,
 * so we test the actual behavior (no error UI shown, but error response received).
 *
 * Differences between technologies:
 * - Playwright: page.on('response') + page.waitForResponse() - native network interception with full response inspection
 * - Selenium: UI state verification only - no network interception or HTTP status code inspection capability
 * - Cypress: cy.intercept() - native interception with response body and status code access
 *
 * Metric: Error handling code complexity
 */

test.describe('5.3 - Download Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to the error download page
    await page.goto('/practice/downloads/simple-docx-download-error.html');
  });

  test('should display download button on error page', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const btnText = page.locator('#btn-text');

    // Act - (No action needed - verifying initial page state)

    // Assert - Download button should be visible with correct text
    await expect(downloadBtn).toBeVisible();
    await expect(btnText).toHaveText('Download Report');
  });

  test('should intercept and verify server returns 500 error status code', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    let errorStatusCode = 0;

    // Intercept API response to capture error status
    page.on('response', (response) => {
      if (response.url().includes('/api/practice/download/docx')) {
        errorStatusCode = response.status();
      }
    });

    // Act - Click download button and wait for response
    await downloadBtn.click();

    // Wait for the error response to be captured
    await page.waitForResponse((response) => response.url().includes('/api/practice/download/docx'), {
      timeout: 15000,
    });

    // Assert - Should receive 500 error status code
    expect(errorStatusCode).toBe(500);
  });

  test('should verify error response contains error message', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    let responseBody = '';

    // Act - Click download button and wait for response
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/practice/download/docx'), {
      timeout: 15000,
    });
    await downloadBtn.click();
    const response = await responsePromise;

    // Get response body
    responseBody = await response.text();

    // Assert - Response should contain error message about file being too big
    expect(responseBody).toContain('File is too big');
  });

  test('should re-enable download button after error response', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const btnText = page.locator('#btn-text');

    // Act - Click download button and wait for response
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/practice/download/docx'), {
      timeout: 15000,
    });
    await downloadBtn.click();
    await responsePromise;

    // Wait for button to be re-enabled (error handling completes)
    await expect(downloadBtn).toBeEnabled();
    await expect(btnText).toHaveText('Download Report');
  });

  test('should show preparing status before error occurs', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const statusMessage = page.locator('#status-message');

    // Act - Click download button
    await downloadBtn.click();

    // Assert - Initially should show preparing status
    await expect(statusMessage).toContainText('Preparing report');
  });

  test('should disable button during download attempt', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');

    // Act - Click download button
    await downloadBtn.click();

    // Assert - Button should be disabled while processing
    await expect(downloadBtn).toBeDisabled();
  });

  test('should not trigger download event on error', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    let downloadTriggered = false;

    // Listen for download events
    page.on('download', () => {
      downloadTriggered = true;
    });

    // Act - Click download button and wait for error response
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/practice/download/docx'), {
      timeout: 15000,
    });
    await downloadBtn.click();
    await responsePromise;

    // Small delay to ensure download event would have fired if it was going to
    await page.waitForTimeout(1000);

    // Assert - No download should be triggered
    expect(downloadTriggered).toBe(false);
  });

  test('should allow retry after error', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const statusMessage = page.locator('#status-message');

    // Act - First attempt
    const firstResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/practice/download/docx'),
      { timeout: 15000 },
    );
    await downloadBtn.click();
    await firstResponsePromise;

    // Wait for button to be re-enabled
    await expect(downloadBtn).toBeEnabled();

    // Act - Retry
    await downloadBtn.click();

    // Assert - Should show preparing status again (retry allowed)
    await expect(statusMessage).toContainText('Preparing');
  });

  test('should verify error response has correct content-type', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');

    // Act - Click download button and wait for response
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/practice/download/docx'), {
      timeout: 15000,
    });
    await downloadBtn.click();
    const response = await responsePromise;

    // Assert - Error response should be JSON
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
  });

  test('should verify request includes error-triggering header', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    let requestHeaders: Record<string, string> = {};

    // Intercept request to capture headers
    page.on('request', (request) => {
      if (request.url().includes('/api/practice/download/docx')) {
        requestHeaders = request.headers();
      }
    });

    // Act - Click download button
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/practice/download/docx'), {
      timeout: 15000,
    });
    await downloadBtn.click();
    await responsePromise;

    // Assert - Request should include the error-triggering header
    expect(requestHeaders['invoke-error-file-too-big']).toBe('1');
  });

  test('should measure error response time for metrics', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');

    // Act - Measure time from click to error response
    const startTime = Date.now();

    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/practice/download/docx'), {
      timeout: 15000,
    });
    await downloadBtn.click();
    await responsePromise;

    const endTime = Date.now();
    const errorResponseTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`Error response time: ${errorResponseTime}ms`);

    // Assert - Response should be received (time logged for comparison)
    expect(errorResponseTime).toBeGreaterThan(0);
  });

  test('should verify progress bar is shown during request', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const progressWrap = page.locator('#progress-wrap');

    // Act - Click download button
    await downloadBtn.click();

    // Assert - Progress should be visible during processing
    await expect(progressWrap).toBeVisible();
  });

  test('should verify button text changes to Preparing during request', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const btnText = page.locator('#btn-text');

    // Act - Click download button
    await downloadBtn.click();

    // Assert - Button text should change to Preparing
    await expect(btnText).toHaveText('Preparing...');
  });
});
