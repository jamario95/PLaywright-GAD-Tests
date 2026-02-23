import { test, expect } from '@playwright/test';

/**
 * Scenario 12.3: Opening new tab/window and verifying content
 * Page: /practice/new-window-v1/
 * Key metric: Multi-tab handling
 *
 * Goal: Compare multi-tab/window handling capabilities across frameworks
 *
 * Page structure:
 * - #openNewPageBtn: Button to open new window with data
 * - #dataPreview: Shows sample data that will be sent
 * - New window opens data-viewer.html with transferred data
 *
 * Data transfer methods used:
 * - URL parameters (encoded JSON)
 * - localStorage
 * - sessionStorage (via postMessage)
 *
 * New window (data-viewer.html) elements:
 * - #windowHeader: Header text "New Window - Received Data"
 * - .tab-btn[data-source]: Tab buttons (url, localStorage, sessionStorage)
 * - #urlDataContent: Displays data from URL parameters
 * - #localStorageDataContent: Displays data from localStorage
 * - #sessionStorageDataContent: Displays data from sessionStorage
 * - #backBtn: Back button to close window
 * - #refreshBtn: Refresh data button
 * - #clearBtn: Clear storage button
 * - #exportBtn: Export data button
 *
 * Differences between technologies:
 * - Playwright: page.waitForEvent('popup') + newPage context, native multi-page support
 * - Selenium: driver.switch_to.window() + window_handles, manual window management
 * - Cypress: Limited multi-tab support, requires workarounds (cy.task, cy.origin)
 *
 * Metric: Multi-tab handling ease, lines of code, context switching complexity
 */
test.describe('12.3 - New Tab/Window Content Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to new window demo page
    await page.goto('/practice/new-window-v1/');
  });

  test('should display main page with open button and data preview', async ({ page }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');
    const dataPreview = page.locator('#dataPreview');

    // Assert - Verify elements are visible
    await expect(openNewPageBtn).toBeVisible();
    await expect(openNewPageBtn).toContainText('Open New Page');
    await expect(dataPreview).toBeVisible();
  });

  test('should display sample data preview on main page', async ({ page }) => {
    // Arrange
    const dataPreview = page.locator('#dataPreview');

    // Assert - Verify data preview contains expected structure
    const previewText = await dataPreview.textContent();

    expect(previewText).toContain('timestamp');
    expect(previewText).toContain('user');
    expect(previewText).toContain('Demo User');
    expect(previewText).toContain('settings');
    expect(previewText).toContain('items');
  });

  test('should open new window when clicking button', async ({ page, context }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');

    // Set up promise to catch new page
    const newPagePromise = context.waitForEvent('page');

    // Act - Click button to open new window
    await openNewPageBtn.click();

    // Get the new page
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Assert - New page should be open
    expect(newPage).toBeTruthy();
    expect(newPage.url()).toContain('data-viewer.html');

    // Cleanup
    await newPage.close();
  });

  test('should display correct header in new window', async ({ page, context }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');
    const newPagePromise = context.waitForEvent('page');

    // Act - Open new window
    await openNewPageBtn.click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Assert - Verify header in new window
    const windowHeader = newPage.locator('#windowHeader');
    await expect(windowHeader).toBeVisible();
    await expect(windowHeader).toHaveText('New Window - Received Data');

    // Cleanup
    await newPage.close();
  });

  test('should display data from URL parameters in new window', async ({ page, context }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');
    const newPagePromise = context.waitForEvent('page');

    // Act - Open new window
    await openNewPageBtn.click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Assert - URL data tab should be active by default
    const urlTab = newPage.locator('.tab-btn[data-source="url"]');
    await expect(urlTab).toHaveClass(/active/);

    // Assert - URL data should contain transferred data
    const urlDataContent = newPage.locator('#urlDataContent');
    await expect(urlDataContent).toBeVisible();
    const urlText = await urlDataContent.textContent();

    expect(urlText).toContain('Demo User');
    expect(urlText).toContain('demo@example.com');

    // Cleanup
    await newPage.close();
  });

  test('should display data from localStorage in new window', async ({ page, context }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');
    const newPagePromise = context.waitForEvent('page');

    // Act - Open new window
    await openNewPageBtn.click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Switch to localStorage tab
    const localStorageTab = newPage.locator('.tab-btn[data-source="localStorage"]');
    await localStorageTab.click();

    // Assert - localStorage data should be visible
    const localStorageSection = newPage.locator('#localStorage-data');
    await expect(localStorageSection).toHaveClass(/active/);

    const localStorageContent = newPage.locator('#localStorageDataContent');
    const localText = await localStorageContent.textContent();

    expect(localText).toContain('Demo User');

    // Cleanup
    await newPage.close();
  });

  test('should display data from sessionStorage in new window', async ({ page, context }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');
    const newPagePromise = context.waitForEvent('page');

    // Act - Open new window
    await openNewPageBtn.click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Wait for postMessage data transfer to populate sessionStorage
    await newPage.waitForFunction(() => window.sessionStorage.length > 0, undefined, { timeout: 5000 });

    // Switch to sessionStorage tab
    const sessionStorageTab = newPage.locator('.tab-btn[data-source="sessionStorage"]');
    await sessionStorageTab.click();

    // Assert - sessionStorage tab should be active
    const sessionStorageSection = newPage.locator('#sessionStorage-data');
    await expect(sessionStorageSection).toHaveClass(/active/);

    const sessionStorageContent = newPage.locator('#sessionStorageDataContent');
    await expect(sessionStorageContent).toBeVisible();

    // Cleanup
    await newPage.close();
  });

  test('should switch between data tabs in new window', async ({ page, context }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');
    const newPagePromise = context.waitForEvent('page');

    // Act - Open new window
    await openNewPageBtn.click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Assert - Initial state: URL tab active
    const urlTab = newPage.locator('.tab-btn[data-source="url"]');
    await expect(urlTab).toHaveClass(/active/);

    // Act - Switch to localStorage tab
    const localStorageTab = newPage.locator('.tab-btn[data-source="localStorage"]');
    await localStorageTab.click();

    // Assert - localStorage tab should be active now
    await expect(localStorageTab).toHaveClass(/active/);
    await expect(urlTab).not.toHaveClass(/active/);

    // Act - Switch to sessionStorage tab
    const sessionStorageTab = newPage.locator('.tab-btn[data-source="sessionStorage"]');
    await sessionStorageTab.click();

    // Assert - sessionStorage tab should be active now
    await expect(sessionStorageTab).toHaveClass(/active/);
    await expect(localStorageTab).not.toHaveClass(/active/);

    // Cleanup
    await newPage.close();
  });

  test('should close new window with back button', async ({ page, context }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');
    const newPagePromise = context.waitForEvent('page');

    // Act - Open new window
    await openNewPageBtn.click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Click back button and wait for window to close
    const backBtn = newPage.locator('#backBtn');
    const closePromise = newPage.waitForEvent('close');
    await backBtn.click();
    await closePromise;

    // Assert - New page should be closed
    expect(newPage.isClosed()).toBe(true);
  });

  test('should refresh data when clicking refresh button', async ({ page, context }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');
    const newPagePromise = context.waitForEvent('page');

    // Act - Open new window
    await openNewPageBtn.click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Get initial content
    const urlDataContent = newPage.locator('#urlDataContent');
    const initialContent = await urlDataContent.textContent();

    // Click refresh button
    const refreshBtn = newPage.locator('#refreshBtn');
    await refreshBtn.click();

    // Get content after refresh
    const refreshedContent = await urlDataContent.textContent();

    // Assert - Content should remain the same after refresh (data doesn't change)
    expect(refreshedContent).toBe(initialContent);

    // Cleanup
    await newPage.close();
  });

  test('should verify transferred data structure in new window', async ({ page, context }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');
    const newPagePromise = context.waitForEvent('page');

    // Act - Open new window
    await openNewPageBtn.click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Assert - Verify data structure in URL content
    const urlDataContent = newPage.locator('#urlDataContent');
    const urlText = await urlDataContent.textContent();

    // Check user object
    expect(urlText).toContain('"id": 12345');
    expect(urlText).toContain('"name": "Demo User"');
    expect(urlText).toContain('"email": "demo@example.com"');

    // Check settings object
    expect(urlText).toContain('"theme": "dark"');
    expect(urlText).toContain('"language": "en"');
    expect(urlText).toContain('"notifications": true');

    // Check items array
    expect(urlText).toContain('"name": "Item 1"');
    expect(urlText).toContain('"name": "Item 2"');
    expect(urlText).toContain('"name": "Item 3"');

    // Cleanup
    await newPage.close();
  });

  test('should have multiple pages open simultaneously', async ({ page, context }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');

    // Act - Open first new window
    const firstPagePromise = context.waitForEvent('page');
    await openNewPageBtn.click();
    const firstNewPage = await firstPagePromise;
    await firstNewPage.waitForLoadState();

    // Get all pages count
    const pagesCount = context.pages().length;

    // Assert - Should have 2 pages (original + new window)
    expect(pagesCount).toBe(2);

    // Assert - Both pages should be accessible
    await expect(page.locator('#openNewPageBtn')).toBeVisible();
    await expect(firstNewPage.locator('#windowHeader')).toBeVisible();

    // Cleanup
    await firstNewPage.close();
  });

  test('should maintain original page state after opening new window', async ({ page, context }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');
    const dataPreview = page.locator('#dataPreview');
    const originalPreviewText = await dataPreview.textContent();

    // Act - Open new window
    const newPagePromise = context.waitForEvent('page');
    await openNewPageBtn.click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Assert - Original page should still have same content
    await expect(dataPreview).toHaveText(originalPreviewText || '');
    await expect(openNewPageBtn).toBeVisible();

    // Cleanup
    await newPage.close();
  });

  test('should measure window opening time for metrics', async ({ page, context }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');

    // Measure execution time
    const startTime = Date.now();

    // Act - Open new window
    const newPagePromise = context.waitForEvent('page');
    await openNewPageBtn.click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Wait for header to be visible
    await expect(newPage.locator('#windowHeader')).toBeVisible();

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`New window opening time: ${executionTime}ms`);

    // Assert - Operation should complete reasonably
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(10000);

    // Cleanup
    await newPage.close();
  });

  test('should verify action buttons in new window', async ({ page, context }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');
    const newPagePromise = context.waitForEvent('page');

    // Act - Open new window
    await openNewPageBtn.click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Assert - All action buttons should be visible
    const refreshBtn = newPage.locator('#refreshBtn');
    const clearBtn = newPage.locator('#clearBtn');
    const exportBtn = newPage.locator('#exportBtn');
    const backBtn = newPage.locator('#backBtn');

    await expect(refreshBtn).toBeVisible();
    await expect(refreshBtn).toContainText('Refresh');

    await expect(clearBtn).toBeVisible();
    await expect(clearBtn).toContainText('Clear Storage');

    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toContainText('Export');

    await expect(backBtn).toBeVisible();
    await expect(backBtn).toContainText('Back');

    // Cleanup
    await newPage.close();
  });

  test('should verify URL contains data parameter', async ({ page, context }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');
    const newPagePromise = context.waitForEvent('page');

    // Act - Open new window
    await openNewPageBtn.click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Assert - URL should contain data parameter
    const url = newPage.url();
    expect(url).toContain('data=');
    expect(url).toContain('sessionData=');

    // Cleanup
    await newPage.close();
  });

  test('should handle clear storage confirmation dialog', async ({ page, context }) => {
    // Arrange
    const openNewPageBtn = page.locator('#openNewPageBtn');
    const newPagePromise = context.waitForEvent('page');

    // Act - Open new window
    await openNewPageBtn.click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Set up dialog handler to decline
    newPage.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('clear all stored data');
      await dialog.dismiss();
    });

    // Click clear storage button
    const clearBtn = newPage.locator('#clearBtn');
    await clearBtn.click();

    // Assert - Data should still be present (we declined)
    const urlDataContent = newPage.locator('#urlDataContent');
    await expect(urlDataContent).toContainText('Demo User');

    // Cleanup
    await newPage.close();
  });
});
