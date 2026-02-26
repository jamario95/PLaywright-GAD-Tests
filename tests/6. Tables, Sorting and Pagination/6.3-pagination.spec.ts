import { test, expect } from '@playwright/test';

/**
 * Scenario 6.3: Pagination - navigate to page 3 → verify data
 * Page: /practice/pagination-v1.html
 * Key metric: Flakiness
 *
 * Goal: Compare pagination handling and data verification
 *
 * Differences between technologies:
 * - Playwright: Built-in auto-waiting, easy page navigation assertions
 * - Selenium: Manual waits for page transitions with browser.pause(), complex state verification
 * - Cypress: Automatic retry on assertions, but explicit cy.wait() for async pagination
 *
 * Playwright-specific notes:
 * - Uses test.skip() for conditional test skipping
 * - evaluate() to check button disabled state
 * - No explicit waits needed - auto-waiting handles page transitions
 * - Fluent API for chaining locator operations with hasClass()
 *
 * Note: This page uses API-based pagination. Total pages depend on API data.
 */
test.describe('6.3 - Pagination Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to the pagination page
    await page.goto('/practice/pagination-v1.html');

    // Wait for table data to be loaded
    await expect(page.locator('#dataGridBody tr').first()).toBeVisible();
  });

  test('should display page 1 by default', async ({ page }) => {
    // Arrange
    const pageInfo = page.locator('#pageInfo');
    const prevButton = page.locator('#prevPage');

    // Act - (No action needed - verifying initial page state)

    // Assert - Should start on page 1
    await expect(pageInfo).toContainText('Page 1');

    // Assert - Previous button should be disabled on first page
    await expect(prevButton).toHaveClass(/disabled/);
  });

  test('should navigate to next page when clicking Next button', async ({
    page,
  }) => {
    // Arrange
    const nextButton = page.locator('#nextPage');
    const pageInfo = page.locator('#pageInfo');

    // Get initial page number
    const initialPageText = await pageInfo.textContent();
    const initialPage =
      parseInt(initialPageText?.match(/Page (\d+)/)?.[1] || '1', 10);

    // Check if next button is enabled
    const nextButtonDisabled = await nextButton.evaluate((el) =>
      el.classList.contains('disabled')
    );

    // Skip test if already on last page
    if (nextButtonDisabled) {
      test.skip();
      return;
    }

    // Act - Click Next button
    await nextButton.click();

    // Assert - Should be on a different page (page number increased)
    await expect(pageInfo).not.toHaveText(initialPageText || '');
    const newPageText = await pageInfo.textContent();
    const newPage =
      parseInt(newPageText?.match(/Page (\d+)/)?.[1] || '1', 10);
    expect(newPage).toBeGreaterThan(initialPage);
  });

  test('should navigate forward multiple times if pages available', async ({
    page,
  }) => {
    // Arrange
    const nextButton = page.locator('#nextPage');
    const pageInfo = page.locator('#pageInfo');

    // Get initial page
    const initialPageText = await pageInfo.textContent();
    const initialPage =
      parseInt(initialPageText?.match(/Page (\d+)/)?.[1] || '1', 10);

    // Check if can navigate forward
    const nextButtonDisabled = await nextButton.evaluate((el) =>
      el.classList.contains('disabled')
    );
    if (nextButtonDisabled) {
      test.skip();
      return;
    }

    // Act - Click Next button multiple times
    let clickCount = 0;
    const maxClicks = 3;

    while (clickCount < maxClicks) {
      const isDisabled = await nextButton.evaluate((el) =>
        el.classList.contains('disabled')
      );
      if (isDisabled) break;

      const currentPageText = await pageInfo.textContent();
      await nextButton.click();
      await expect(pageInfo).not.toHaveText(currentPageText || '');
      clickCount++;
    }

    // Assert - Should be on a higher page than initial
    const finalPageText = await pageInfo.textContent();
    const finalPage =
      parseInt(finalPageText?.match(/Page (\d+)/)?.[1] || '1', 10);
    expect(finalPage).toBeGreaterThan(initialPage);
  });

  test('should navigate back to previous page', async ({ page }) => {
    // Arrange
    const nextButton = page.locator('#nextPage');
    const prevButton = page.locator('#prevPage');
    const pageInfo = page.locator('#pageInfo');

    // Check if can navigate forward
    const nextButtonDisabled = await nextButton.evaluate((el) =>
      el.classList.contains('disabled')
    );
    if (nextButtonDisabled) {
      test.skip();
      return;
    }

    // Act - Navigate forward first
    const beforeNextPageText = await pageInfo.textContent();
    await nextButton.click();
    await expect(pageInfo).not.toHaveText(beforeNextPageText || '');

    const afterNextPageText = await pageInfo.textContent();
    const afterNextPage =
      parseInt(afterNextPageText?.match(/Page (\d+)/)?.[1] || '1', 10);

    // Act - Navigate back
    await prevButton.click();
    await expect(pageInfo).not.toHaveText(afterNextPageText || '');

    // Assert - Should be on a lower page number than before
    const finalPageText = await pageInfo.textContent();
    const finalPage =
      parseInt(finalPageText?.match(/Page (\d+)/)?.[1] || '1', 10);
    expect(finalPage).toBeLessThan(afterNextPage);
  });

  test('should enable Previous button after navigating away from page 1', async ({
    page,
  }) => {
    // Arrange
    const nextButton = page.locator('#nextPage');
    const prevButton = page.locator('#prevPage');

    // Assert - Previous button should be disabled initially
    await expect(prevButton).toHaveClass(/disabled/);

    // Check if can navigate forward
    const nextButtonDisabled = await nextButton.evaluate((el) =>
      el.classList.contains('disabled')
    );
    if (nextButtonDisabled) {
      test.skip();
      return;
    }

    // Act - Navigate to next page
    await nextButton.click();

    // Assert - Previous button should be enabled
    await expect(prevButton).not.toHaveClass(/disabled/);
  });

  test('should maintain correct row count per page (10 rows max)', async ({
    page,
  }) => {
    // Arrange
    const tableBody = page.locator('#dataGridBody');

    // Act - (No action needed - verifying initial page state)

    // Assert - Page should have up to 10 rows
    const rowCount = await tableBody.locator('tr').count();
    expect(rowCount).toBeLessThanOrEqual(10);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should display different data on each page', async ({ page }) => {
    // Arrange
    const tableBody = page.locator('#dataGridBody');
    const nextButton = page.locator('#nextPage');
    const pageInfo = page.locator('#pageInfo');

    // Check if can navigate forward
    const nextButtonDisabled = await nextButton.evaluate((el) =>
      el.classList.contains('disabled')
    );
    if (nextButtonDisabled) {
      test.skip();
      return;
    }

    // Collect IDs from page 1
    const page1Ids: string[] = [];
    const page1Rows = tableBody.locator('tr');
    const page1Count = await page1Rows.count();
    for (let i = 0; i < page1Count; i++) {
      const id = await page1Rows.nth(i).locator('td').first().textContent();
      if (id) page1Ids.push(id);
    }

    // Act - Navigate to next page
    const page1Text = await pageInfo.textContent();
    await nextButton.click();
    await expect(pageInfo).not.toHaveText(page1Text || '');

    // Collect IDs from page 2
    const page2Ids: string[] = [];
    const page2Rows = tableBody.locator('tr');
    const page2Count = await page2Rows.count();
    for (let i = 0; i < page2Count; i++) {
      const id = await page2Rows.nth(i).locator('td').first().textContent();
      if (id) page2Ids.push(id);
    }

    // Assert - IDs should be different between pages
    const hasOverlap = page1Ids.some((id) => page2Ids.includes(id));
    expect(hasOverlap).toBe(false);
  });

  test('should update page info correctly when navigating', async ({
    page,
  }) => {
    // Arrange
    const nextButton = page.locator('#nextPage');
    const pageInfo = page.locator('#pageInfo');

    // Assert - Initial page info should show Page 1
    await expect(pageInfo).toContainText('Page 1');

    // Check if can navigate forward
    const nextButtonDisabled = await nextButton.evaluate((el) =>
      el.classList.contains('disabled')
    );
    if (nextButtonDisabled) {
      test.skip();
      return;
    }

    // Act - Navigate to next page
    const page1Text = await pageInfo.textContent();
    await nextButton.click();
    await expect(pageInfo).not.toHaveText(page1Text || '');

    // Assert - Page info should update (no longer Page 1)
    const newPageText = await pageInfo.textContent();
    const newPage =
      parseInt(newPageText?.match(/Page (\d+)/)?.[1] || '1', 10);
    expect(newPage).toBeGreaterThan(1);
  });

  test('should show total elements count', async ({ page }) => {
    // Arrange
    const elementsCount = page.locator('#elementsCount');

    // Act - (No action needed - verifying initial page state)

    // Assert - Elements count should be visible and show information
    await expect(elementsCount).toBeVisible();
    const countText = await elementsCount.textContent();
    expect(countText).toBeDefined();
    expect(countText?.length).toBeGreaterThan(0);
  });

  test('should display table with correct structure', async ({ page }) => {
    // Arrange
    const tableBody = page.locator('#dataGridBody');

    // Act - (No action needed - verifying initial page state)

    // Assert - Verify table structure
    const rows = tableBody.locator('tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Assert - Verify each row has expected number of columns (7 columns)
    const firstRow = rows.first();
    const columns = firstRow.locator('td');
    const columnCount = await columns.count();
    expect(columnCount).toBe(7); // ID, Name, Age, Role, Location, Department, Status
  });

  test('should have correct pagination button states on page 1', async ({
    page,
  }) => {
    // Arrange
    const prevButton = page.locator('#prevPage');
    const pageInfo = page.locator('#pageInfo');

    // Act - (No action needed - verifying initial page state)

    // Assert - Should be on page 1
    await expect(pageInfo).toContainText('Page 1');

    // Assert - Previous should be disabled
    await expect(prevButton).toHaveClass(/disabled/);
  });

  test('should display page info with total pages', async ({ page }) => {
    // Arrange
    const pageInfo = page.locator('#pageInfo');

    // Act - (No action needed - verifying initial page state)

    // Assert - Page info should contain "of" indicating total pages
    const pageInfoText = await pageInfo.textContent();
    expect(pageInfoText).toContain('of');
    expect(pageInfoText).toMatch(/Page \d+ of \d+/);
  });
});
