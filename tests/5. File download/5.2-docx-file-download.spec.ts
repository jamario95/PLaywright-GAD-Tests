import { test, expect, Download } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

/**
 * Scenario 5.2: Download .docx file and verify metadata
 * Page: /practice/downloads/simple-docx-download.html
 * Key metric: Binary file handling
 *
 * Goal: Compare binary file download and verification capabilities
 *
 * Page structure:
 * - #download-report-btn: Download button
 * - #btn-text: Button text (changes during download)
 * - #status-message: Status message
 * - #progress-fill: Progress bar fill
 * - #progress-text: Progress percentage text
 *
 * API endpoint: POST /api/practice/download/docx
 * Downloaded file: business-report.docx
 *
 * Note: .docx files are ZIP archives containing XML files.
 * We can verify metadata by extracting and reading the XML content.
 *
 * Differences between technologies:
 * - Playwright: download.path() + fs operations - straightforward
 * - Selenium: Browser preferences + file system check - OS-dependent
 * - Cypress: Limited support for binary files - workarounds needed
 *
 * Metric: Binary file handling complexity
 */

test.describe('5.2 - DOCX File Download', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to the docx download page
    await page.goto('/practice/downloads/simple-docx-download.html');
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

  test('should download .docx file successfully', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');

    // Act - Click download button and wait for download event
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadBtn.click();
    const download: Download = await downloadPromise;

    // Assert - Verify download has correct suggested filename
    expect(download.suggestedFilename()).toBe('business-report.docx');
  });

  test('should verify downloaded .docx file is a valid ZIP archive', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const tempFilePath = path.join(process.cwd(), 'test-downloads', 'temp-zip-check.docx');

    // Ensure directory exists
    const dir = path.dirname(tempFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Act - Download file
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadBtn.click();
    const download: Download = await downloadPromise;

    // Save file (required for remote connections)
    await download.saveAs(tempFilePath);

    // Assert - .docx file should be a valid ZIP (starts with PK signature)
    const fileBuffer = fs.readFileSync(tempFilePath);
    const zipSignature = fileBuffer.slice(0, 2).toString('hex');
    expect(zipSignature).toBe('504b'); // PK in hex

    // Cleanup
    fs.unlinkSync(tempFilePath);
  });

  test('should verify .docx file contains required Office XML structure', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const tempFilePath = path.join(process.cwd(), 'test-downloads', 'temp-xml-structure.docx');

    // Ensure directory exists
    const dir = path.dirname(tempFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Act - Download file
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadBtn.click();
    const download: Download = await downloadPromise;

    // Save file (required for remote connections)
    await download.saveAs(tempFilePath);

    // Extract and verify ZIP structure
    const zip = new AdmZip(tempFilePath);
    const zipEntries = zip.getEntries().map((entry) => entry.entryName);

    // Assert - .docx should contain standard Office Open XML files
    expect(zipEntries).toContain('[Content_Types].xml');
    expect(zipEntries.some((entry) => entry.includes('word/document.xml'))).toBe(true);

    // Cleanup
    fs.unlinkSync(tempFilePath);
  });

  test('should verify document.xml contains expected content', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const tempFilePath = path.join(process.cwd(), 'test-downloads', 'temp-content-check.docx');

    // Ensure directory exists
    const dir = path.dirname(tempFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Act - Download file
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadBtn.click();
    const download: Download = await downloadPromise;

    // Save file (required for remote connections)
    await download.saveAs(tempFilePath);

    // Extract document.xml content
    const zip = new AdmZip(tempFilePath);
    const documentXml = zip.readAsText('word/document.xml');

    // Assert - Document should contain expected business report content
    expect(documentXml).toContain('Business Performance Report');
    expect(documentXml).toContain('TechCorp Solutions');

    // Cleanup
    fs.unlinkSync(tempFilePath);
  });

  test('should verify file size is greater than zero', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const tempFilePath = path.join(process.cwd(), 'test-downloads', 'temp-size-check.docx');

    // Ensure directory exists
    const dir = path.dirname(tempFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Act - Download file
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadBtn.click();
    const download: Download = await downloadPromise;

    // Save file (required for remote connections)
    await download.saveAs(tempFilePath);
    const stats = fs.statSync(tempFilePath);

    // Assert - File should have content
    expect(stats.size).toBeGreaterThan(0);

    // Cleanup
    fs.unlinkSync(tempFilePath);
  });

  test('should show preparing status while generating docx report', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const statusMessage = page.locator('#status-message');

    // Act - Click download button
    await downloadBtn.click();

    // Assert - Status should show preparing
    await expect(statusMessage).toContainText('Preparing report');
  });

  test('should disable download button during docx download process', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');

    // Act - Click download button
    await downloadBtn.click();

    // Assert - Button should be disabled during download
    await expect(downloadBtn).toBeDisabled();
  });

  test('should show success status after docx download completes', async ({ page }) => {
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

  test('should verify content-type from network response for docx', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    let responseContentType = '';

    // Intercept API response to verify content-type
    page.on('response', (response) => {
      if (response.url().includes('/api/practice/download/docx')) {
        responseContentType = response.headers()['content-type'] || '';
      }
    });

    // Act - Download file
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await downloadBtn.click();
    await downloadPromise;

    // Assert - Content type should indicate docx file
    expect(responseContentType).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });

  test('should save docx file to custom path', async ({ page }) => {
    // Arrange
    const downloadBtn = page.locator('#download-report-btn');
    const customPath = path.join(process.cwd(), 'test-downloads', 'custom-report.docx');

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

  test('should re-enable download button after docx download completes', async ({ page }) => {
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

  test('should measure docx download execution time for metrics', async ({ page }) => {
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
    console.log(`DOCX download execution time: ${executionTime}ms`);

    // Assert - Download should complete (time logged for comparison)
    expect(executionTime).toBeGreaterThan(0);
  });
});
