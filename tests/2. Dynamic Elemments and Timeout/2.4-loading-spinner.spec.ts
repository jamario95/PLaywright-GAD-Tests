import { test, expect } from '@playwright/test';

/**
 * Scenario 2.4: Clicking element after loading spinner finishes
 * Page: /practice/infinite-scroll-v1.html
 * Key metric: Handling loading states
 *
 * Goal: Compare handling of loading states
 *
 * GAD Page (infinite scroll):
 * - Infinite scroll with loading indicator
 * - New elements load with 1.5-2s delay
 * - Loading indicator: "Loading more items..."
 *
 * Differences between technologies:
 * - Playwright: waitForSelector + visibility assertions
 * - Selenium: WebDriverWait with ExpectedConditions.invisibilityOf
 * - Cypress: cy.get().should('not.be.visible') with automatic retry
 */
test.describe('2.4 - Clicking element after loading spinner finishes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/infinite-scroll-v1.html');
  });

  test('should load elements by scrolling and verify spinner behavior', async ({ page }) => {
    // Arrange
    const itemsContainer = page.locator('#items-container');
    const loadingIndicator = page.locator('#loading');
    const initialItemsCount = 10;
    const initialItems = itemsContainer.locator('.item');
    await expect(initialItems).toHaveCount(initialItemsCount);

    // Act - scroll down to load more elements
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Assert - loading spinner appears
    await expect(loadingIndicator).toBeVisible();

    // Assert - spinner disappears after loading
    await expect(loadingIndicator).not.toBeVisible();

    // Assert - more elements have been loaded
    const newItemsCount = await itemsContainer.locator('.item').count();
    expect(newItemsCount).toBeGreaterThan(initialItemsCount);
  });

  test('should load elements through multiple scrolls and verify increasing count', async ({ page }) => {
    // Arrange
    const itemsContainer = page.locator('#items-container');
    const loadingIndicator = page.locator('#loading');
    const scrollCount = 3;
    let previousCount = 10;

    // Act & Assert - scroll multiple times
    for (let i = 0; i < scrollCount; i++) {
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Wait for loading indicator
      await expect(loadingIndicator).toBeVisible();

      // Wait for loading to disappear
      await expect(loadingIndicator).not.toBeVisible();

      // Verify that element count increased
      const currentCount = await itemsContainer.locator('.item').count();
      expect(currentCount).toBeGreaterThan(previousCount);
      previousCount = currentCount;
    }

    // Assert - after 3 scrolls there should be at least 40 elements
    expect(previousCount).toBeGreaterThanOrEqual(40);
  });

  test('should click newly loaded element after scroll and verify expansion', async ({ page }) => {
    // Arrange
    const itemsContainer = page.locator('#items-container');
    const loadingIndicator = page.locator('#loading');

    // Act - scroll to load more elements
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(loadingIndicator).not.toBeVisible();

    // Act - click on newly loaded element (e.g., 15th)
    const item15 = itemsContainer.locator('.item').nth(14);
    await item15.scrollIntoViewIfNeeded();
    await item15.click();

    // Assert - element expands after clicking (has 'expanded' class)
    await expect(item15).toHaveClass(/expanded/);

    // Assert - details are visible
    const itemDetails = item15.locator('.item-details');
    await expect(itemDetails).toBeVisible();
  });
});
