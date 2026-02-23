import { test, expect } from '@playwright/test';

/**
 * Scenario 10.2: Drag & Drop with custom event handlers
 * Page: /practice/drag-and-drop-3.html
 * Key metric: Advanced interactions
 *
 * Goal: Compare handling of multi-file drag & drop with custom event handlers
 *
 * Page structure:
 * - Drop zone with id="dropzone" and class="drag-area-v3"
 * - Accepts multiple image files (JPG, PNG, GIF)
 * - Preview container with id="previewContainer"
 * - Upload button with data-testid="uploadBtn"
 * - Results gallery with id="results-container"
 * - Custom event handlers: dragenter, dragover, dragleave, drop
 *
 * Differences between technologies:
 * - Playwright: page.setInputFiles() with multiple files, event dispatching
 * - Selenium: Limited multi-file support, requires complex ActionChains
 * - Cypress: cy.selectFile() with multiple flag, .trigger() for events
 *
 * Metric: Stability of multi-file drag & drop, flakiness
 */
test.describe('10.2 - Multi-File Drag & Drop with Custom Handlers', () => {
  // Helper to create test image buffer (minimal valid PNG)
  const createTestImageBuffer = (name: string): Buffer => {
    // Minimal 1x1 PNG image
    const pngSignature = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const ihdrChunk = Buffer.from([
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xde,
    ]);
    const idatChunk = Buffer.from([
      0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54,
      0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f, 0x00,
      0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59, 0xe7,
    ]);
    const iendChunk = Buffer.from([
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
      0xae, 0x42, 0x60, 0x82,
    ]);
    return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
  };

  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to multi-file drag and drop page
    await page.goto('/practice/drag-and-drop-3.html');
  });

  test('should display drop zone with correct initial state', async ({ page }) => {
    // Arrange
    const dropZone = page.locator('#dropzone');
    const dragHeader = page.locator('#dragdropheader');
    const uploadButton = page.getByTestId('uploadBtn');
    const previewContainer = page.locator('#previewContainer');

    // Assert - Verify initial state
    await expect(dropZone).toBeVisible();
    await expect(dragHeader).toHaveText('Drag & Drop');
    await expect(uploadButton).toBeDisabled();
    await expect(previewContainer).toBeEmpty();
  });

  test('should accept single image file via file input', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#dragdropfile');
    const uploadButton = page.getByTestId('uploadBtn');
    const dragHeader = page.locator('#dragdropheader');
    const previewContainer = page.locator('#previewContainer');

    // Act - Upload single image file
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: createTestImageBuffer('test-image'),
    });

    // Assert - Verify file is ready for upload
    await expect(dragHeader).toHaveText('1 image(s) ready');
    await expect(previewContainer.locator('.preview-item-v3')).toHaveCount(1);
    await expect(uploadButton).toBeEnabled();
  });

  test('should accept multiple image files via file input', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#dragdropfile');
    const dragHeader = page.locator('#dragdropheader');
    const previewContainer = page.locator('#previewContainer');

    // Act - Upload multiple image files
    await fileInput.setInputFiles([
      {
        name: 'image1.png',
        mimeType: 'image/png',
        buffer: createTestImageBuffer('image1'),
      },
      {
        name: 'image2.png',
        mimeType: 'image/png',
        buffer: createTestImageBuffer('image2'),
      },
      {
        name: 'image3.png',
        mimeType: 'image/png',
        buffer: createTestImageBuffer('image3'),
      },
    ]);

    // Assert - Verify all files are ready
    await expect(dragHeader).toHaveText('3 image(s) ready');
    await expect(previewContainer.locator('.preview-item-v3')).toHaveCount(3);
  });

  test('should display preview with file name for each image', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#dragdropfile');
    const previewContainer = page.locator('#previewContainer');
    const testFileName = 'my-test-image.png';

    // Act - Upload image file
    await fileInput.setInputFiles({
      name: testFileName,
      mimeType: 'image/png',
      buffer: createTestImageBuffer('test'),
    });

    // Assert - Verify preview shows file name
    const previewItem = previewContainer.locator('.preview-item-v3');
    await expect(previewItem).toContainText(testFileName);
    await expect(previewItem.locator('.preview-image-v3')).toBeVisible();
  });

  test('should remove file when clicking remove button', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#dragdropfile');
    const previewContainer = page.locator('#previewContainer');
    const dragHeader = page.locator('#dragdropheader');
    const uploadButton = page.getByTestId('uploadBtn');

    // Act - Upload file
    await fileInput.setInputFiles({
      name: 'removable.png',
      mimeType: 'image/png',
      buffer: createTestImageBuffer('removable'),
    });

    // Assert - Verify file was added before removal
    await expect(previewContainer.locator('.preview-item-v3')).toHaveCount(1);

    // Act - Click remove button
    await previewContainer.locator('.remove-file-v3').click();

    // Assert - Verify file is removed
    await expect(previewContainer.locator('.preview-item-v3')).toHaveCount(0);
    await expect(dragHeader).toHaveText('Drag & Drop');
    await expect(uploadButton).toBeDisabled();
  });

  test('should reject invalid file type with error message', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#dragdropfile');
    const previewContainer = page.locator('#previewContainer');
    const uploadButton = page.getByTestId('uploadBtn');

    // Act - Try to upload non-image file
    await fileInput.setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF content'),
    });

    // Assert - Verify error message appears (temporarily)
    await expect(previewContainer.locator('.simpleErrorBox')).toBeVisible();
    await expect(previewContainer).toContainText('Invalid file type');
    await expect(uploadButton).toBeDisabled();
  });

  test('should upload images and display in results gallery', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#dragdropfile');
    const uploadButton = page.getByTestId('uploadBtn');
    const resultsContainer = page.locator('#results-container');
    const testFileName = 'uploaded-image.png';

    // Act - Upload and click upload button
    await fileInput.setInputFiles({
      name: testFileName,
      mimeType: 'image/png',
      buffer: createTestImageBuffer('uploaded'),
    });
    await uploadButton.click();

    // Assert - Verify image appears in results
    await expect(resultsContainer.locator('.result-image-container-v3')).toHaveCount(1);
    await expect(resultsContainer).toContainText(testFileName);
  });

  test('should clear preview after successful upload', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#dragdropfile');
    const uploadButton = page.getByTestId('uploadBtn');
    const previewContainer = page.locator('#previewContainer');

    // Act - Upload file and submit
    await fileInput.setInputFiles({
      name: 'clear-test.png',
      mimeType: 'image/png',
      buffer: createTestImageBuffer('clear'),
    });
    await uploadButton.click();

    // Assert - Verify preview is cleared and button is disabled
    await expect(previewContainer).toBeEmpty();
    await expect(uploadButton).toBeDisabled();
  });

  test('should not duplicate images with same name', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#dragdropfile');
    const previewContainer = page.locator('#previewContainer');

    // Act - Upload same file twice (simulate duplicate)
    await fileInput.setInputFiles({
      name: 'duplicate.png',
      mimeType: 'image/png',
      buffer: createTestImageBuffer('dup1'),
    });

    const initialCount = await previewContainer.locator('.preview-item-v3').count();

    // Clear and try to add same name again
    await fileInput.setInputFiles({
      name: 'duplicate.png',
      mimeType: 'image/png',
      buffer: createTestImageBuffer('dup2'),
    });

    // Assert - Should not add duplicate
    const finalCount = await previewContainer.locator('.preview-item-v3').count();
    expect(finalCount).toBe(initialCount);
  });

  test('should handle drag highlight via page.evaluate', async ({ page }) => {
    // Arrange
    const dropZone = page.locator('#dropzone');

    // Act - Simulate dragenter event using evaluate (proper event handling)
    await page.evaluate(() => {
      const dropzone = document.getElementById('dropzone');
      if (dropzone) {
        const dragEnterEvent = new DragEvent('dragenter', {
          bubbles: true,
          cancelable: true,
        });
        dropzone.dispatchEvent(dragEnterEvent);
      }
    });

    // Assert - Verify highlight state
    await expect(dropZone).toHaveClass(/highlight/);
  });

  test('should remove highlight on dragleave via page.evaluate', async ({ page }) => {
    // Arrange
    const dropZone = page.locator('#dropzone');
    const dragHeader = page.locator('#dragdropheader');

    // Act - Simulate dragenter then dragleave using evaluate
    await page.evaluate(() => {
      const dropzone = document.getElementById('dropzone');
      if (dropzone) {
        const dragEnterEvent = new DragEvent('dragenter', {
          bubbles: true,
          cancelable: true,
        });
        dropzone.dispatchEvent(dragEnterEvent);

        const dragLeaveEvent = new DragEvent('dragleave', {
          bubbles: true,
          cancelable: true,
        });
        dropzone.dispatchEvent(dragLeaveEvent);
      }
    });

    // Assert - Verify highlight is removed
    await expect(dropZone).not.toHaveClass(/highlight/);
    await expect(dragHeader).toHaveText('Drag & Drop');
  });

  test('should upload multiple images to results gallery', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#dragdropfile');
    const uploadButton = page.getByTestId('uploadBtn');
    const resultsContainer = page.locator('#results-container');

    // Act - Upload multiple files
    await fileInput.setInputFiles([
      {
        name: 'gallery1.png',
        mimeType: 'image/png',
        buffer: createTestImageBuffer('g1'),
      },
      {
        name: 'gallery2.png',
        mimeType: 'image/png',
        buffer: createTestImageBuffer('g2'),
      },
    ]);
    await uploadButton.click();

    // Assert - Verify both images in results
    await expect(resultsContainer.locator('.result-image-container-v3')).toHaveCount(2);
    await expect(resultsContainer).toContainText('gallery1.png');
    await expect(resultsContainer).toContainText('gallery2.png');
  });

  test('should measure multi-file upload time for metrics', async ({ page }) => {
    // Arrange
    const startTime = Date.now();
    const fileInput = page.locator('#dragdropfile');
    const uploadButton = page.getByTestId('uploadBtn');
    const resultsContainer = page.locator('#results-container');

    // Act - Upload multiple files
    await fileInput.setInputFiles([
      {
        name: 'metric1.png',
        mimeType: 'image/png',
        buffer: createTestImageBuffer('m1'),
      },
      {
        name: 'metric2.png',
        mimeType: 'image/png',
        buffer: createTestImageBuffer('m2'),
      },
      {
        name: 'metric3.png',
        mimeType: 'image/png',
        buffer: createTestImageBuffer('m3'),
      },
    ]);
    await uploadButton.click();

    // Assert - Verify all files uploaded
    await expect(resultsContainer.locator('.result-image-container-v3')).toHaveCount(3);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`Multi-file upload time (3 files): ${executionTime}ms`);

    // Assert - Operation completed successfully
    expect(executionTime).toBeGreaterThan(0);
  });
});
