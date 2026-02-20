import { test, expect } from '@playwright/test';

/**
 * Scenario 2.2: Verifying element visibility after animation
 * Page: /practice/delayed-elements-and-delayed-result-2.html
 * Key metric: Flakiness, auto-waiting
 *
 * Goal: Compare waiting mechanisms with longer delays
 *
 * GAD Page (extended timeout):
 * - Elements appear after 2.7-5s (delayForCreate)
 * - Then become enabled after another 2.8-5s (delayForEnable)
 * - Total delay: 5.5-10s (requires extended timeout!)
 *
 * Differences between technologies:
 * - Playwright: Built-in auto-waiting (up to 30s default) - handles without configuration
 * - Selenium: Requires increased timeout in WebDriverWait
 * - Cypress: Default retry 4s may be insufficient - requires configuration
 */
test.describe('2.2 - Element visibility after animation (extended timeout)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/delayed-elements-and-delayed-result-2.html');
  });

  test('should check checkbox after long delay and verify result', async ({ page }) => {
    // Arrange
    const checkboxLocator = page.getByTestId('dti-checkbox');
    const resultsLocator = page.getByTestId('dti-results-container');
    const expectedMessage = 'Checkbox is checked!';

    // Act - Playwright auto-wait with default timeout 30s
    // Element may appear after max ~10s
    await checkboxLocator.check();

    // Assert
    await expect(checkboxLocator).toBeChecked();
    await expect(resultsLocator).toContainText(expectedMessage);
  });

  test('should fill input field after long delay and verify result', async ({ page }) => {
    // Arrange
    const inputLocator = page.getByTestId('dti-input');
    const resultsLocator = page.getByTestId('dti-results-container');
    const testValue = 'Test automation value';
    const expectedMessage = `Input value changed to: ${testValue}`;

    // Act - wait for input and fill it
    await inputLocator.fill(testValue);
    // Trigger onchange event
    await inputLocator.blur();

    // Assert
    await expect(inputLocator).toHaveValue(testValue);
    await expect(resultsLocator).toContainText(expectedMessage);
  });

  test('should select dropdown option after animation and verify result', async ({ page }) => {
    // Arrange
    const dropdownLocator = page.getByTestId('dti-dropdown');
    const resultsLocator = page.getByTestId('dti-results-container');
    const optionValue = 'option2';
    const expectedMessage = 'Selected option: option2';

    // Act - Playwright waits until dropdown is available
    await dropdownLocator.selectOption(optionValue);

    // Assert
    await expect(dropdownLocator).toHaveValue(optionValue);
    await expect(resultsLocator).toContainText(expectedMessage);
  });
});
