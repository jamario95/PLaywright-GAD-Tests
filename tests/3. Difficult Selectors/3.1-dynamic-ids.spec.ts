import { test, expect } from '@playwright/test';

/**
 * Scenario 3.1: Clicking element with dynamic ID
 * Page: /practice/dynamic-ids-1.html and /practice/dynamic-ids-2.html
 * Key metric: Ease of writing, selector stability
 *
 * Goal: Compare advanced selector capabilities
 *
 * Challenge: Table elements have dynamic IDs generated on each page load
 * Playwright solution: Use data-testid, text content, or stable attributes
 *
 * Differences between technologies:
 * - Playwright: page.locator() with data-testid, getByRole, filter
 * - Selenium: No native support - requires XPath or CSS with attributes
 * - Cypress: cy.get() with attributes, cy.contains()
 */
test.describe('3.1 - Dynamic IDs', () => {
  test('should find table cell by data-testid despite dynamic ID', async ({ page }) => {
    // Arrange
    await page.goto('/practice/dynamic-ids-1.html');
    // Data from geographicData.locations - city San Francisco
    const expectedCity = 'San Francisco';
    const cityLocator = page.getByTestId('dti-cityName-San-Francisco');

    // Act
    const cityText = await cityLocator.textContent();

    // Assert
    expect(cityText).toBe(expectedCity);
  });

  test('should find table cell by text without using ID', async ({ page }) => {
    // Arrange
    await page.goto('/practice/dynamic-ids-1.html');
    // Data from geographicData.locations - country France (exact: true avoids conflict with "Île-de-France")
    const expectedCountry = 'France';

    // Act - using exact: true prevents matching "Île-de-France"
    const countryCell = page.getByRole('cell', { name: expectedCountry, exact: true });

    // Assert
    await expect(countryCell).toBeVisible();
    await expect(countryCell).toHaveText(expectedCountry);
  });

  test('should find table row containing specific city', async ({ page }) => {
    // Arrange
    await page.goto('/practice/dynamic-ids-1.html');
    const cityName = 'Tokyo';

    // Act
    const rowLocator = page.locator('tr').filter({ hasText: cityName });

    // Assert
    await expect(rowLocator).toBeVisible();
    await expect(rowLocator).toContainText('Japan');
  });

  test('should count number of rows in table with dynamic IDs', async ({ page }) => {
    // Arrange
    await page.goto('/practice/dynamic-ids-1.html');
    const expectedMinRows = 5; // Header + min 4 rows

    // Act
    const rowsCount = await page.locator('table tr').count();

    // Assert
    expect(rowsCount).toBeGreaterThanOrEqual(expectedMinRows);
  });

  test('should click Book Now button for restaurant with dynamic ID', async ({ page }) => {
    // Arrange
    await page.goto('/practice/dynamic-ids-2.html');
    const resultsContainer = page.locator('#results-container');

    // Act - click first Book Now button (without relying on dynamic ID)
    const bookButton = page.getByRole('button', { name: 'Book Now' }).first();
    await bookButton.click();

    // Assert
    await expect(resultsContainer).toContainText('You have booked a table');
  });

  test('should find element by CSS without ID and verify data', async ({ page }) => {
    // Arrange
    await page.goto('/practice/dynamic-ids-1.html');

    // Act - search by table structure instead of ID
    const headers = page.locator('table th');
    const headerTexts = await headers.allTextContents();

    // Assert
    expect(headerTexts).toContain('City');
    expect(headerTexts).toContain('Country');
    expect(headerTexts).toContain('Population');
  });
});
