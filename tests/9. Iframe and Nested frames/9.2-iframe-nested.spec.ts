import { test, expect } from '@playwright/test';

/**
 * Scenario 9.2: Fill form in nested iframe (level 2)
 * Page: /practice/iframe-2.html
 * Key metric: Code complexity
 *
 * Goal: Compare handling of nested iframes across frameworks
 *
 * Page structure:
 * - Main page contains iframe with src="./partials/placesOfInterest.html"
 * - Iframe contains restaurant listings with "Book Now" buttons
 * - Results container and "Get one more place!" / "Get 3 more place!" buttons
 *
 * Differences between technologies:
 * - Playwright: Chained frameLocator() calls for nested iframes
 * - Selenium: Multiple switch_to.frame() calls required
 * - Cypress: cy.frameLoaded().find() with nested iframes (complex)
 *
 * Metric: Lines of code, code complexity
 */
test.describe('9.2 - Nested Iframe Form Interaction (Level 2)', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to the page with nested iframe
    await page.goto('/practice/iframe-2.html');
  });

  test('should display places of interest inside iframe', async ({ page }) => {
    // Arrange
    const iframe = page.frameLocator('iframe');
    const placesContainer = iframe.locator('#places');

    // Act & Assert - Verify iframe content is loaded
    await expect(placesContainer).toBeVisible();
  });

  test('should display restaurant listings with Book Now buttons', async ({
    page,
  }) => {
    // Arrange
    const iframe = page.frameLocator('iframe');
    const bookButtons = iframe.getByRole('button', { name: 'Book Now' });

    // Act & Assert - Verify at least one Book Now button exists
    const buttonCount = await bookButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should book a table and display confirmation message', async ({
    page,
  }) => {
    // Arrange
    const iframe = page.frameLocator('iframe');
    const firstBookButton = iframe.getByRole('button', { name: 'Book Now' }).first();
    const resultsContainer = iframe.locator('#results-container');

    // Act - Click the first Book Now button
    await firstBookButton.click();

    // Assert - Verify booking confirmation message appears
    await expect(resultsContainer).toContainText('You have booked a table at');
    await expect(resultsContainer).toContainText('⭐️');
  });

  test('should add one more place using button inside iframe', async ({
    page,
  }) => {
    // Arrange
    const iframe = page.frameLocator('iframe');
    const addOnePlaceButton = iframe.getByRole('button', {
      name: 'Get one more place!',
    });
    const initialBookButtons = iframe.getByRole('button', { name: 'Book Now' });
    const initialCount = await initialBookButtons.count();

    // Act - Click add one more place button
    await addOnePlaceButton.click();

    // Assert - Verify one more place was added
    const newCount = await initialBookButtons.count();
    expect(newCount).toBe(initialCount + 1);
  });

  test('should add three more places using button inside iframe', async ({
    page,
  }) => {
    // Arrange
    const iframe = page.frameLocator('iframe');
    const addThreePlacesButton = iframe.getByRole('button', {
      name: 'Get 3 more place!',
    });
    const bookButtons = iframe.getByRole('button', { name: 'Book Now' });
    const initialCount = await bookButtons.count();

    // Act - Click add three places button
    await addThreePlacesButton.click();

    // Assert - Verify three more places were added
    const newCount = await bookButtons.count();
    expect(newCount).toBe(initialCount + 3);
  });

  test('should toggle reviews visibility for a restaurant', async ({ page }) => {
    // Arrange
    const iframe = page.frameLocator('iframe');
    const toggleReviewsButton = iframe
      .getByRole('button', { name: 'Toggle Reviews' })
      .first();
    const reviewsList = iframe.locator('ul').first();

    // Assert - Reviews should be hidden initially
    await expect(reviewsList).toBeHidden();

    // Act - Click toggle button to show reviews
    await toggleReviewsButton.click();

    // Assert - Reviews should be visible
    await expect(reviewsList).toBeVisible();

    // Act - Click toggle button again to hide reviews
    await toggleReviewsButton.click();

    // Assert - Reviews should be hidden again
    await expect(reviewsList).toBeHidden();
  });

  test('should display restaurant details in table format', async ({ page }) => {
    // Arrange
    const iframe = page.frameLocator('iframe');
    const placesContainer = iframe.locator('#places');

    // Act & Assert - Verify table headers exist (use .first() as there are multiple restaurants)
    await expect(placesContainer.locator('th:has-text("Price Range")').first()).toBeVisible();
    await expect(placesContainer.locator('th:has-text("Address")').first()).toBeVisible();
    await expect(placesContainer.locator('th:has-text("Rating")').first()).toBeVisible();
    await expect(placesContainer.locator('th:has-text("Cuisine Type")').first()).toBeVisible();
  });

  test('should book different restaurants and verify different messages', async ({
    page,
  }) => {
    // Arrange
    const iframe = page.frameLocator('iframe');
    const bookButtons = iframe.getByRole('button', { name: 'Book Now' });
    const resultsContainer = iframe.locator('#results-container');
    const buttonCount = await bookButtons.count();

    // Act & Assert - Book first restaurant
    await bookButtons.first().click();
    const firstMessage = await resultsContainer.textContent();
    expect(firstMessage).toContain('You have booked a table at');

    // Act & Assert - Book last restaurant (if more than one exists)
    if (buttonCount > 1) {
      await bookButtons.last().click();
      const lastMessage = await resultsContainer.textContent();
      expect(lastMessage).toContain('You have booked a table at');
    }
  });

  test('should measure nested iframe interaction time for metrics', async ({
    page,
  }) => {
    // Arrange
    const startTime = Date.now();
    const iframe = page.frameLocator('iframe');
    const addOnePlaceButton = iframe.getByRole('button', {
      name: 'Get one more place!',
    });
    const bookButtons = iframe.getByRole('button', { name: 'Book Now' });
    const resultsContainer = iframe.locator('#results-container');

    // Act - Perform multiple iframe interactions
    await addOnePlaceButton.click();
    const lastBookButton = bookButtons.last();
    await lastBookButton.click();

    // Assert - Verify booking confirmation appears
    await expect(resultsContainer).toContainText('You have booked a table');

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`Nested iframe interaction time: ${executionTime}ms`);

    // Assert - Operation completed successfully
    expect(executionTime).toBeGreaterThan(0);
  });
});
