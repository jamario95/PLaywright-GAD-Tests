import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Scenario 4.4: File upload and verification of system acceptance
 * Page: /practice/file-upload-v1.html
 * Key metric: File upload handling
 *
 * Goal: Compare file upload capabilities across frameworks
 *
 * Page structure:
 * - #fileInput: Hidden file input (type="file", multiple)
 * - #uploadArea: Drag and drop area
 * - #uploadBtn: Upload button (hidden until files selected)
 * - #clearBtn: Clear all button (hidden until files selected)
 * - #fileList: List of selected files
 * - #emptyState: "No files selected yet" message
 * - #stats: File statistics (count, size, types)
 *
 * Differences between technologies:
 * - Playwright: page.setInputFiles() - native support, no workarounds needed
 * - Selenium: browser.uploadFile() + setValue() for single file; DataTransfer JS injection for multiple files; makeFileInputVisible() workaround required
 * - Cypress: cy.selectFile() - native support since Cypress 9.3+, no plugin required
 *
 * Metric: Number of steps for file upload, filesystem handling
 */

// Test file directory path - using absolute path in temp directory
const TEST_FILES_DIR = path.join(process.cwd(), 'test-upload-files');

// Helper function to ensure test files exist
function ensureTestFilesExist() {
  if (!fs.existsSync(TEST_FILES_DIR)) {
    fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
  }

  const testFilePath = path.join(TEST_FILES_DIR, 'test-file.txt');
  const largeFilePath = path.join(TEST_FILES_DIR, 'large-file.txt');
  const secondFilePath = path.join(TEST_FILES_DIR, 'second-file.txt');

  if (!fs.existsSync(testFilePath)) {
    fs.writeFileSync(testFilePath, 'This is a test file content.');
  }
  if (!fs.existsSync(largeFilePath)) {
    const largeContent = 'Line of text for testing. '.repeat(1000);
    fs.writeFileSync(largeFilePath, largeContent);
  }
  if (!fs.existsSync(secondFilePath)) {
    fs.writeFileSync(secondFilePath, 'Second test file content.');
  }
}

test.describe('4.4 - File Upload', () => {
  // Ensure test files exist before each test (handles parallel execution)
  test.beforeEach(async ({ page }) => {
    // Arrange - Create test files if they don't exist
    ensureTestFilesExist();

    // Arrange - Navigate to the file upload page
    await page.goto('/practice/file-upload-v1.html');
  });

  test('should select a single text file and display in file list', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#fileInput');
    const fileList = page.locator('#fileList');
    const emptyState = page.locator('#emptyState');
    const testFilePath = path.join(TEST_FILES_DIR, 'test-file.txt');

    // Arrange - verify initial empty state
    await expect(emptyState).toBeVisible();

    // Act - Select the file
    await fileInput.setInputFiles(testFilePath);

    // Assert - File should appear in the file list
    await expect(fileList).toContainText('test-file.txt');
    // Empty state should no longer be visible
    await expect(emptyState).not.toBeVisible();
  });

  test('should display file count in statistics after selection', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#fileInput');
    const fileCount = page.locator('#fileCount');
    const stats = page.locator('#stats');
    const testFilePath = path.join(TEST_FILES_DIR, 'test-file.txt');

    // Act - Select the file
    await fileInput.setInputFiles(testFilePath);

    // Assert - Stats should be visible and show 1 file
    await expect(stats).toBeVisible();
    await expect(fileCount).toHaveText('1');
  });

  test('should display upload and clear buttons after file selection', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#fileInput');
    const uploadBtn = page.locator('#uploadBtn');
    const clearBtn = page.locator('#clearBtn');
    const testFilePath = path.join(TEST_FILES_DIR, 'test-file.txt');

    // Arrange - verify buttons are hidden initially
    await expect(uploadBtn).not.toBeVisible();
    await expect(clearBtn).not.toBeVisible();

    // Act - Select the file
    await fileInput.setInputFiles(testFilePath);

    // Assert - Buttons should become visible
    await expect(uploadBtn).toBeVisible();
    await expect(clearBtn).toBeVisible();
  });

  test('should select multiple files at once', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#fileInput');
    const fileCount = page.locator('#fileCount');
    const fileList = page.locator('#fileList');
    const testFile1 = path.join(TEST_FILES_DIR, 'test-file.txt');
    const testFile2 = path.join(TEST_FILES_DIR, 'second-file.txt');

    // Act - Select multiple files
    await fileInput.setInputFiles([testFile1, testFile2]);

    // Assert - Both files should appear in the list
    await expect(fileCount).toHaveText('2');
    await expect(fileList).toContainText('test-file.txt');
    await expect(fileList).toContainText('second-file.txt');
  });

  test('should clear all files using Clear All button', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#fileInput');
    const clearBtn = page.locator('#clearBtn');
    const emptyState = page.locator('#emptyState');
    const fileList = page.locator('#fileList');
    const testFilePath = path.join(TEST_FILES_DIR, 'test-file.txt');

    // Act - Select a file
    await fileInput.setInputFiles(testFilePath);
    await expect(fileList).toContainText('test-file.txt');

    // Act - Clear all files
    await clearBtn.click();

    // Assert - Empty state should reappear
    await expect(emptyState).toBeVisible();
    await expect(clearBtn).not.toBeVisible();
  });

  test('should simulate file upload process', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#fileInput');
    const uploadBtn = page.locator('#uploadBtn');
    const notification = page.locator('#uploadNotification');
    const testFilePath = path.join(TEST_FILES_DIR, 'test-file.txt');

    // Act - Select a file
    await fileInput.setInputFiles(testFilePath);

    // Act - Click upload button
    await uploadBtn.click();

    // Assert - Upload notification should appear
    await expect(notification).toHaveClass(/show/);
  });

  test('should display file size information', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#fileInput');
    const totalSize = page.locator('#totalSize');
    const testFilePath = path.join(TEST_FILES_DIR, 'test-file.txt');

    // Act - Select the file
    await fileInput.setInputFiles(testFilePath);

    // Assert - Total size should be displayed (not 0 B)
    const sizeText = await totalSize.textContent();
    expect(sizeText).not.toBe('0 B');
  });

  test('should display file type count', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#fileInput');
    const fileTypes = page.locator('#fileTypes');
    const testFile1 = path.join(TEST_FILES_DIR, 'test-file.txt');
    const testFile2 = path.join(TEST_FILES_DIR, 'second-file.txt');

    // Act - Select multiple files of same type
    await fileInput.setInputFiles([testFile1, testFile2]);

    // Assert - Should show 1 file type (both are .txt)
    await expect(fileTypes).toHaveText('1');
  });

  test('should handle large file selection', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#fileInput');
    const fileList = page.locator('#fileList');
    const largeFilePath = path.join(TEST_FILES_DIR, 'large-file.txt');

    // Act - Select the large file
    await fileInput.setInputFiles(largeFilePath);

    // Assert - Large file should appear in the list
    await expect(fileList).toContainText('large-file.txt');
  });

  test('should verify file input accepts multiple files attribute', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#fileInput');

    // Act
    // (No action needed - verifying initial HTML attributes)

    // Assert - Verify the input has multiple attribute
    await expect(fileInput).toHaveAttribute('multiple', '');
  });

  test('should interact with drag and drop area', async ({ page }) => {
    // Arrange
    const uploadArea = page.locator('#uploadArea');
    await expect(uploadArea).toBeVisible();

    // Act - Click the upload area (triggers native file dialog)
    await uploadArea.click();

    // Assert - Upload area remains interactive after click
    // Note: Native file dialog cannot be controlled by Playwright
    await expect(uploadArea).toBeVisible();
  });

  test('should display empty state message initially', async ({ page }) => {
    // Arrange
    const emptyState = page.locator('#emptyState');

    // Act
    // (No action needed - verifying initial page state)

    // Assert - Empty state should be visible with correct text
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toHaveText('No files selected yet');
  });

  test('should measure file selection time for metrics', async ({ page }) => {
    // Arrange
    const fileInput = page.locator('#fileInput');
    const fileList = page.locator('#fileList');
    const testFilePath = path.join(TEST_FILES_DIR, 'test-file.txt');

    // Act - Measure time to select file
    const startTime = Date.now();

    await fileInput.setInputFiles(testFilePath);
    await expect(fileList).toContainText('test-file.txt');

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Assert - File should be selected successfully (also captured in timing block above)
    console.log(`File selection time: ${executionTime}ms`);
  });
});
