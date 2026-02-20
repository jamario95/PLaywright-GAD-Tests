import { test, expect } from '@playwright/test';

/**
 * Scenario 3.3: Clicking button in nested Shadow DOM (level 2)
 * Page: /practice/shadow-dom-0.html (nested shadow)
 * Key metric: Code complexity
 *
 * Goal: Compare advanced selector capabilities
 *
 * Nested Shadow DOM means two levels of encapsulation
 * Playwright handles it automatically, Selenium requires recursive scripts
 *
 * Differences between technologies:
 * - Playwright: Automatic penetration of multi-level Shadow DOM
 * - Selenium: Requires recursive execute_script for each level
 * - Cypress: Requires multiple .shadow() calls for each level
 */
test.describe('3.3 - Nested Shadow DOM (level 2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/shadow-dom-0.html');
  });

  test('should fill input in nested Shadow DOM', async ({ page }) => {
    // Arrange
    const nestedInput = page.getByTestId('nested-shadow-name-input');
    const nestedSubmit = page.getByTestId('nested-shadow-submit');
    const nestedResults = page.getByTestId('nested-shadow-results');
    const testName = 'Nested User';
    const expectedMessage = `Hello, ${testName}!`;

    // Act
    await nestedInput.fill(testName);
    await nestedSubmit.click();

    // Assert
    await expect(nestedResults).toBeVisible();
    await expect(nestedResults).toHaveText(expectedMessage);
  });

  test('should display validation error in nested Shadow DOM', async ({ page }) => {
    // Arrange
    const nestedInput = page.getByTestId('nested-shadow-name-input');
    const nestedSubmit = page.getByTestId('nested-shadow-submit');
    const nestedResults = page.getByTestId('nested-shadow-results');
    const expectedErrorMessage = 'Please enter your name!';

    // Act
    await nestedInput.clear();
    await nestedSubmit.click();

    // Assert
    await expect(nestedResults).toHaveText(expectedErrorMessage);
    await expect(nestedInput).toHaveClass(/invalid/);
  });

  test('should verify heading in nested Shadow DOM', async ({ page }) => {
    // Arrange
    const nestedShadowHost = page.locator('#nested-shadow-host');
    const expectedText = 'Hello from nested Shadow DOM!';

    // Act
    const heading = nestedShadowHost.locator('h3');

    // Assert
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(expectedText);
  });

  test('should compare all three types of Shadow DOM on one page', async ({ page }) => {
    // Arrange - test data
    const testName = 'Comparison Test';
    const expectedMessage = `Hello, ${testName}!`;

    // Arrange - Regular DOM
    const regularInput = page.getByTestId('name-input');
    const regularSubmit = page.getByTestId('submit');
    const regularResults = page.getByTestId('results');

    // Arrange - Shadow DOM (level 1)
    const shadowInput = page.getByTestId('shadow-name-input');
    const shadowSubmit = page.getByTestId('shadow-submit');
    const shadowResults = page.getByTestId('shadow-results');

    // Arrange - Nested Shadow DOM (level 2)
    const nestedInput = page.getByTestId('nested-shadow-name-input');
    const nestedSubmit = page.getByTestId('nested-shadow-submit');
    const nestedResults = page.getByTestId('nested-shadow-results');

    // Act - fill all three forms
    await regularInput.fill(testName);
    await regularSubmit.click();

    await shadowInput.fill(testName);
    await shadowSubmit.click();

    await nestedInput.fill(testName);
    await nestedSubmit.click();

    // Assert - all should return the same result
    await expect(regularResults).toHaveText(expectedMessage);
    await expect(shadowResults).toHaveText(expectedMessage);
    await expect(nestedResults).toHaveText(expectedMessage);
  });

  test('should handle closed Shadow DOM - element not accessible', async ({ page }) => {
    // Arrange
    const closedInput = page.getByTestId('closed-shadow-name-input');
    const closedSubmit = page.getByTestId('closed-shadow-submit');

    // Act
    // (No action needed - verifying that closed Shadow DOM is inaccessible)

    // Assert - closed Shadow DOM is not accessible through Playwright
    await expect(closedInput).not.toBeVisible();
    await expect(closedSubmit).toHaveCount(0);
  });
});
