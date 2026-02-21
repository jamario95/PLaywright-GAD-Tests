import { test, expect } from '@playwright/test';

/**
 * Scenario 6.4: Infinite scroll - load 50 elements
 * Page: /practice/infinite-scroll-v1.html
 * Key metric: Infinite scroll handling
 *
 * Goal: Compare infinite scroll automation and element loading verification
 *
 * Differences between technologies:
 * - Playwright: page.evaluate() for scroll, auto-waiting for new elements
 * - Selenium: execute_script() for scroll, manual waits for DOM updates
 * - Cypress: cy.scrollTo() + automatic retry, but limited scroll control
 */
test.describe('6.4 - Infinite Scroll', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to the infinite scroll page
    await page.goto('/practice/infinite-scroll-v1.html');

    // Wait for initial items to be loaded
    await expect(page.locator('#items-container .item').first()).toBeVisible();
  });

  test('should display initial set of items on page load', async ({ page }) => {
    // Arrange
    const itemsContainer = page.locator('#items-container');
    const items = itemsContainer.locator('.item');

    // Act - (No action needed - verifying initial page state)

    // Assert - Initial items should be loaded (default is 10)
    const initialCount = await items.count();
    expect(initialCount).toBe(10);
  });

  test('should load more items when scrolling to bottom', async ({ page }) => {
    // Arrange
    const itemsContainer = page.locator('#items-container');
    const items = itemsContainer.locator('.item');
    const loadingIndicator = page.locator('#loading');

    // Get initial count
    const initialCount = await items.count();
    expect(initialCount).toBe(10);

    // Act - Scroll to bottom of page
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Assert - Loading indicator should appear
    await expect(loadingIndicator).toBeVisible({ timeout: 3000 });

    // Wait for new items to load (loading takes 1500-2000ms)
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });

    // Assert - More items should be loaded
    const newCount = await items.count();
    expect(newCount).toBeGreaterThan(initialCount);
    expect(newCount).toBe(20); // Should load 10 more items
  });

  test('should load 50 elements after multiple scroll actions', async ({
    page,
  }) => {
    // Arrange
    const itemsContainer = page.locator('#items-container');
    const items = itemsContainer.locator('.item');
    const loadingIndicator = page.locator('#loading');

    // Act - Scroll multiple times to load 50 items (5 loads of 10 items each)
    // Starting with 10 items, we need 4 more scroll actions
    for (let i = 0; i < 4; i++) {
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait for loading to start and complete
      await expect(loadingIndicator).toBeVisible({ timeout: 3000 });
      await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });

      // Assert - Items count should increase by 10 after each scroll
      await expect(items).toHaveCount((i + 2) * 10);
    }

    // Assert - Should have 50 items
    const finalCount = await items.count();
    expect(finalCount).toBe(50);
  });

  test('should have increasing IDs for loaded items', async ({ page }) => {
    // Arrange
    const itemsContainer = page.locator('#items-container');
    const items = itemsContainer.locator('.item');
    const loadingIndicator = page.locator('#loading');

    // Act - Scroll to load more items
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await expect(loadingIndicator).toBeVisible({ timeout: 3000 });
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });

    // Assert - Verify IDs are increasing
    const itemCount = await items.count();
    const ids: number[] = [];

    for (let i = 0; i < itemCount; i++) {
      const idText = await items.nth(i).locator('.id').textContent();
      const id = parseInt(idText?.replace('ID: ', '') || '0', 10);
      ids.push(id);
    }

    // Verify IDs are sequential and increasing
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i]).toBeGreaterThan(ids[i - 1]);
    }
  });

  test('should display loading indicator while fetching new items', async ({
    page,
  }) => {
    // Arrange
    const loadingIndicator = page.locator('#loading');

    // Assert - Loading should not be visible initially
    await expect(loadingIndicator).not.toBeVisible();

    // Act - Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Assert - Loading indicator should appear
    await expect(loadingIndicator).toBeVisible({ timeout: 3000 });
    await expect(loadingIndicator).toContainText('Loading more items...');

    // Assert - Loading indicator should disappear after items are loaded
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
  });

  test('should have valid name and surname for first 100 items', async ({
    page,
  }) => {
    // Arrange
    const itemsContainer = page.locator('#items-container');
    const items = itemsContainer.locator('.item');
    const loadingIndicator = page.locator('#loading');

    // Act - Load 50 items (5 scroll actions starting from 10)
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await expect(loadingIndicator).toBeVisible({ timeout: 3000 });
      await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
      await expect(items).toHaveCount((i + 2) * 10);
    }

    // Assert - Verify first 50 items have non-empty names and surnames
    const itemCount = await items.count();

    for (let i = 0; i < Math.min(itemCount, 50); i++) {
      const item = items.nth(i);
      const nameElement = item.locator('.item-value').first();
      const surnameElement = item.locator('.item-value').nth(1);

      const name = await nameElement.textContent();
      const surname = await surnameElement.textContent();

      expect(name?.trim().length).toBeGreaterThan(0);
      expect(surname?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should expand item details when clicked', async ({ page }) => {
    // Arrange
    const firstItem = page.locator('#items-container .item').first();
    const itemDetails = firstItem.locator('.item-details');

    // Assert - Details should not be visible initially
    await expect(itemDetails).not.toBeVisible();

    // Act - Click on the item to expand
    await firstItem.click();

    // Assert - Item should have expanded class and details should be visible
    await expect(firstItem).toHaveClass(/expanded/);
    await expect(itemDetails).toBeVisible();
  });

  test('should collapse item details when clicked again', async ({ page }) => {
    // Arrange
    const firstItem = page.locator('#items-container .item').first();
    const itemDetails = firstItem.locator('.item-details');

    // Act - Click to expand
    await firstItem.click();
    await expect(firstItem).toHaveClass(/expanded/);

    // Act - Click to collapse
    await firstItem.click();

    // Assert - Item should not have expanded class
    await expect(firstItem).not.toHaveClass(/expanded/);
    await expect(itemDetails).not.toBeVisible();
  });

  test('should display additional details for each item', async ({ page }) => {
    // Arrange
    const firstItem = page.locator('#items-container .item').first();

    // Act - Click to expand
    await firstItem.click();

    // Assert - Verify detail fields are present
    const detailRows = firstItem.locator('.detail-row');
    const detailCount = await detailRows.count();
    expect(detailCount).toBe(4); // Age, Email, Phone, Company

    // Assert - Verify detail labels
    const detailLabels = firstItem.locator('.detail-label');
    const labels: string[] = [];
    for (let i = 0; i < 4; i++) {
      const label = await detailLabels.nth(i).textContent();
      labels.push(label || '');
    }

    expect(labels).toContain('Age:');
    expect(labels).toContain('Email:');
    expect(labels).toContain('Phone:');
    expect(labels).toContain('Company:');
  });

  test('should maintain scroll position after loading new items', async ({
    page,
  }) => {
    // Arrange
    const loadingIndicator = page.locator('#loading');

    // Act - Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for loading to complete
    await expect(loadingIndicator).toBeVisible({ timeout: 3000 });
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });

    // Assert - User should still be able to see content (not scrolled to top)
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(0);
  });

  test('should continue loading items on repeated scrolls', async ({
    page,
  }) => {
    // Arrange
    const itemsContainer = page.locator('#items-container');
    const items = itemsContainer.locator('.item');
    const loadingIndicator = page.locator('#loading');

    // Track item counts after each scroll
    const counts: number[] = [await items.count()];

    // Act - Perform 3 scroll actions
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await expect(loadingIndicator).toBeVisible({ timeout: 3000 });
      await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
      await expect(items).toHaveCount((i + 2) * 10);

      counts.push(await items.count());
    }

    // Assert - Each scroll should increase the count by 10
    expect(counts[1]).toBe(counts[0] + 10);
    expect(counts[2]).toBe(counts[1] + 10);
    expect(counts[3]).toBe(counts[2] + 10);
  });
});
