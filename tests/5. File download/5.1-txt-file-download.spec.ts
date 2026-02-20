import { test, expect, Download } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Scenario 5.1: Download .txt file and verify content
 * Page: /practice/downloads/simple-file-download.html
 * Key metric: Ease of verification
 *
 * Goal: Compare file download capabilities across frameworks
 *
 * Page structure:
 * - #download-report-btn: Download button
 * - #btn-text: Button text (changes during download)
 * - #status-message: Status message (Preparing..., Downloading..., Download complete, error)
 * - #progress-fill: Progress bar fill
 * - #progress-text: Progress percentage text
 *
 * API endpoint: POST /api/practice/download/generate
 * Downloaded file: business-report.txt
 *
 * Differences between technologies:
 * - Playwright: page.waitForEvent('download') + download.path() - native support
 * - Selenium: Browser preferences + checking download folder - complex setup
 * - Cypress: cy.request() workaround - no native download support
 *
 * Metric: Number of additional tools/configuration needed
 */

test.describe('5.1 - Text File Download', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to the download page
    await page.goto('/practice/downloads/simple-file-download.html');
  });

  test('should display download button on page load', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const btnText = page.locator('#btn-text');

    // Act - (No action needed - verifying initial page state)

    // Assert - Download button should be visible with correct text
    await expect(downloadBtn).toBeVisible();
    await expect(btnText).toHaveText('Download Report');
  });

  test('should download .txt file and verify it was saved', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');

    // Act - Click download button and wait for download event
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadBtn.click();
    const download: Download = await downloadPromise;

    // Assert - Verify download started and has correct suggested filename
    expect(download.suggestedFilename()).toBe('business-report.txt');
  });

  test('should verify downloaded .txt file content contains expected data', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const tempFilePath = path.join(process.cwd(), 'test-downloads', 'temp-report.txt');

    // Ensure directory exists
    const dir = path.dirname(tempFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Act - Click download button and wait for download
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadBtn.click();
    const download: Download = await downloadPromise;

    // Save download to a temporary location (required for remote connections)
    await download.saveAs(tempFilePath);

    // Assert - Verify file exists and contains expected content
    expect(fs.existsSync(tempFilePath)).toBe(true);
    const fileContent = fs.readFileSync(tempFilePath, 'utf-8');

    // Verify the report contains expected business data
    expect(fileContent).toContain('Business Performance Report');
    expect(fileContent).toContain('TechCorp Solutions');
    expect(fileContent).toContain('Q4 2024');

    // Cleanup
    fs.unlinkSync(tempFilePath);
  });

  test('should show preparing status while generating report', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const statusMessage = page.locator('#status-message');
    const btnText = page.locator('#btn-text');

    // Act - Click download button
    await downloadBtn.click();

    // Assert - Status should show preparing
    await expect(statusMessage).toContainText('Preparing report');
    await expect(btnText).toHaveText('Preparing...');
  });

  test('should disable download button during download process', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');

    // Act - Click download button
    await downloadBtn.click();

    // Assert - Button should be disabled during download
    await expect(downloadBtn).toBeDisabled();
  });

  test('should show progress bar during download preparation', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const progressWrap = page.locator('#progress-wrap');
    const progressText = page.locator('#progress-text');

    // Act - Click download button
    await downloadBtn.click();

    // Assert - Progress should be visible
    await expect(progressWrap).toBeVisible();
    await expect(progressText).toContainText('Preparing');
  });

  test('should show success status after download completes', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const statusMessage = page.locator('#status-message');

    // Act - Click download and wait for completion
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadBtn.click();
    await downloadPromise;

    // Assert - Success message should appear
    await expect(statusMessage).toContainText('Download complete');
    await expect(statusMessage).toHaveClass(/success/);
  });

  test('should re-enable download button after download completes', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const btnText = page.locator('#btn-text');

    // Act - Complete the download
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadBtn.click();
    await downloadPromise;

    // Assert - Button should be re-enabled with original text
    await expect(downloadBtn).toBeEnabled();
    await expect(btnText).toHaveText('Download Report');
  });

  test('should verify downloaded file is not empty', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const tempFilePath = path.join(process.cwd(), 'test-downloads', 'temp-empty-check.txt');

    // Ensure directory exists
    const dir = path.dirname(tempFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Act - Download file
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadBtn.click();
    const download: Download = await downloadPromise;

    // Save and read file (required for remote connections)
    await download.saveAs(tempFilePath);
    const fileContent = fs.readFileSync(tempFilePath, 'utf-8');

    // Assert - File should not be empty
    expect(fileContent.length).toBeGreaterThan(0);

    // Cleanup
    fs.unlinkSync(tempFilePath);
  });

  test('should save downloaded file to custom path', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const customPath = path.join(process.cwd(), 'test-downloads', 'custom-report.txt');

    // Ensure directory exists
    const dir = path.dirname(customPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Act - Download and save to custom path
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadBtn.click();
    const download: Download = await downloadPromise;
    await download.saveAs(customPath);

    // Assert - File should exist at custom path
    expect(fs.existsSync(customPath)).toBe(true);

    // Cleanup
    fs.unlinkSync(customPath);
  });

  test('should verify content-type from network response', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    let responseContentType = '';

    // Intercept API response to verify content-type
    page.on('response', (response) => {
      if (response.url().includes('/api/practice/download/generate')) {
        responseContentType = response.headers()['content-type'] || '';
      }
    });

    // Act - Download file
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadBtn.click();
    await downloadPromise;

    // Assert - Content type should indicate text file
    expect(responseContentType).toContain('text/plain');
  });

  test('should measure download execution time for metrics', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');

    // Act - Measure time from click to download complete
    const startTime = Date.now();

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadBtn.click();
    await downloadPromise;

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`Download execution time: ${executionTime}ms`);

    // Assert - Download should complete (time logged for comparison)
    expect(executionTime).toBeGreaterThan(0);
  });
});
