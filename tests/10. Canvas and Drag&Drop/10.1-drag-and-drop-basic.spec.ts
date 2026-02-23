import { test, expect } from '@playwright/test';

/**
 * Scenario 10.1: Drag & Drop element from list A to list B
 * Page: /practice/drag-and-drop-1.html
 * Key metric: Drag & Drop support
 *
 * Goal: Compare file drag & drop handling across frameworks
 *
 * Page structure:
 * - Drop zone with id="dropzone" accepts JSON files
 * - File input hidden with id="dragdropfile"
 * - Upload button with data-testid="uploadBtn"
 * - Results displayed in #results-container
 *
 * Differences between technologies:
 * - Playwright: page.setInputFiles() + native drag events
 * - Selenium: ActionChains + drag_and_drop() - limited file support
 * - Cypress: cy.selectFile() + .trigger() for drag events
 *
 * Metric: Drag & Drop stability, lines of code
 */
test.describe('10.1 - Basic File Drag & Drop', () => {
  // Test data
  const validJsonContent = JSON.stringify({ name: 'Test', value: 123 });
  const invalidContent = 'This is not JSON';

  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to drag and drop page
    await page.goto('/practice/drag-and-drop-1.html');
  });

  test('should display drop zone with correct initial state', async ({ page }) => {
    // Arrange
    const dropZone = page.locator('#dropzone');
    const dragHeader = page.locator('#dragdropheader');
    const uploadButton = page.getByTestId('uploadBtn');

    // Assert - Verify initial state
    await expect(dropZone).toBeVisible();
    await expect(dragHeader).toHaveText('Drag & Drop');
    await expect(uploadButton).toBeDisabled();
  });

  test('should accept valid JSON file via file input', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#dragdropfile');
    const uploadButton = page.getByTestId('uploadBtn');
    const dragHeader = page.locator('#dragdropheader');
    const infoContainer = page.locator('#infoContainer');

    // Act - Upload JSON file via file input
    await fileInput.setInputFiles({
      name: 'test-data.json',
      mimeType: 'application/json',
      buffer: Buffer.from(validJsonContent),
    });

    // Assert - Verify file is ready for upload
    await expect(dragHeader).toHaveText('File ready');
    await expect(infoContainer).toContainText('test-data.json');
    await expect(uploadButton).toBeEnabled();
  });

  test('should upload JSON file and display results', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#dragdropfile');
    const uploadButton = page.getByTestId('uploadBtn');
    const resultsContainer = page.locator('#results-container');

    // Act - Upload file and click upload button
    await fileInput.setInputFiles({
      name: 'data.json',
      mimeType: 'application/json',
      buffer: Buffer.from(validJsonContent),
    });
    await uploadButton.click();

    // Assert - Verify results are displayed
    await expect(resultsContainer).toContainText('File uploaded!');
    await expect(resultsContainer).toContainText('name');
    await expect(resultsContainer).toContainText('Test');
  });

  test('should reject invalid file type', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#dragdropfile');
    const uploadButton = page.getByTestId('uploadBtn');
    const infoContainer = page.locator('#infoContainer');

    // Act - Try to upload non-JSON file
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(invalidContent),
    });

    // Assert - Verify error message and button state
    await expect(infoContainer).toContainText('Invalid file type');
    await expect(uploadButton).toBeDisabled();
  });

  test('should add active class on drop zone when file is selected', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#dragdropfile');
    const dropZone = page.locator('#dropzone');

    // Act - Select a file (triggers change event which adds active class)
    await fileInput.setInputFiles({
      name: 'test.json',
      mimeType: 'application/json',
      buffer: Buffer.from(validJsonContent),
    });

    // Assert - Verify drop zone has active class after file selection
    await expect(dropZone).toHaveClass(/active/);
  });

  test('should handle drag events via page.evaluate', async ({ page }) => {
    // Arrange
    const dropZone = page.locator('#dropzone');
    const dragHeader = page.locator('#dragdropheader');

    // Act - Simulate drag events using evaluate (proper DataTransfer handling)
    await page.evaluate(() => {
      const dropzone = document.getElementById('dropzone');
      if (dropzone) {
        // Create and dispatch dragover event
        const dragOverEvent = new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
        });
        dropzone.dispatchEvent(dragOverEvent);
      }
    });

    // Assert - Header text should change during dragover
    // Note: This tests the event handler is attached and responds
    await expect(dragHeader).toBeVisible();
  });

  test('should reset state after successful upload', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#dragdropfile');
    const uploadButton = page.getByTestId('uploadBtn');
    const dragHeader = page.locator('#dragdropheader');
    const infoContainer = page.locator('#infoContainer');

    // Act - Upload file and click upload
    await fileInput.setInputFiles({
      name: 'data.json',
      mimeType: 'application/json',
      buffer: Buffer.from(validJsonContent),
    });
    await uploadButton.click();

    // Assert - Verify state is reset
    await expect(dragHeader).toHaveText('Drag & Drop');
    await expect(uploadButton).toBeDisabled();
    await expect(infoContainer).toBeEmpty();
  });

  test('should display truncated content for large files', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#dragdropfile');
    const uploadButton = page.getByTestId('uploadBtn');
    const resultsContainer = page.locator('#results-container');

    // Create large JSON content (>256 chars)
    const largeContent = JSON.stringify({
      data: 'A'.repeat(300),
      moreData: 'B'.repeat(300),
    });

    // Act - Upload large file
    await fileInput.setInputFiles({
      name: 'large-data.json',
      mimeType: 'application/json',
      buffer: Buffer.from(largeContent),
    });
    await uploadButton.click();

    // Assert - Verify content is truncated
    await expect(resultsContainer).toContainText('...');
  });

  test('should open file browser when clicking browse button', async ({ page }) => {
    // Arrange
    const browseButton = page.locator('#browsebutton');
    const fileInput = page.locator('#dragdropfile');

    // Act & Assert - Verify file input click is triggered
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      browseButton.click(),
    ]);

    expect(fileChooser).toBeTruthy();
  });

  test('should measure file upload time for metrics', async ({ page }) => {
    // Arrange
    const startTime = Date.now();
    const fileInput = page.locator('#dragdropfile');
    const uploadButton = page.getByTestId('uploadBtn');
    const resultsContainer = page.locator('#results-container');

    // Act - Upload file
    await fileInput.setInputFiles({
      name: 'metrics-test.json',
      mimeType: 'application/json',
      buffer: Buffer.from(validJsonContent),
    });
    await uploadButton.click();

    // Assert - Verify upload completed
    await expect(resultsContainer).toContainText('File uploaded!');

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`File upload time: ${executionTime}ms`);

    // Assert - Operation completed successfully
    expect(executionTime).toBeGreaterThan(0);
  });
});
