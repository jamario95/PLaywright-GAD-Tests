import { test, expect } from '@playwright/test';

/**
 * Scenario 2.3: Interaction with element "not present" -> "disabled" -> "displayed"
 * Page: /practice/not-present-disabled-elements-1.html
 * Key metric: Handling wait conditions
 *
 * Goal: Compare handling of different element states
 *
 * GAD Page:
 * - Elements transition through states: NOT PRESENT -> DISABLED -> ENABLED
 * - Delay: 2-2.5s for each transition
 *
 * Differences between technologies:
 * - Playwright: Auto-wait automatically handles all states
 * - Selenium: Requires different ExpectedConditions for each state
 * - Cypress: Automatic retry, but may require additional assertions
 */
test.describe('2.3 - Elements transitioning through states (not present -> disabled -> enabled)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/not-present-disabled-elements-1.html');
  });

  test('should click button transitioning through states and verify result', async ({ page }) => {
    // Arrange
    const buttonLocator = page.getByTestId('dti-button-element');
    const resultsContainer = page.locator('#results-container');
    const expectedMessage = 'You clicked the button!';

    // Act - Playwright auto-wait handles all states
    await buttonLocator.click();

    // Assert
    await expect(resultsContainer).toContainText(expectedMessage);
  });

  test('should verify full element state cycle from NOT PRESENT to ENABLED', async ({ page }) => {
    // Arrange
    const statusLabel = page.locator('#statusLabel');
    const buttonLocator = page.getByTestId('dti-button-element');

    // Assert - initial state
    await expect(statusLabel).toHaveText('NOT PRESENT');
    await expect(buttonLocator).not.toBeVisible();

    // Act & Assert - element appears but is disabled
    await expect(buttonLocator).toBeVisible();
    await expect(statusLabel).toHaveText('PRESENT but DISABLED');
    await expect(buttonLocator).toBeDisabled();

    // Act & Assert - element becomes enabled
    await expect(buttonLocator).toBeEnabled();
    await expect(statusLabel).toHaveText('ENABLED');
    await expect(buttonLocator).toHaveText('Click me!');
  });

  test('should fill input and textarea transitioning through states and verify results', async ({ page }) => {
    // Arrange
    const inputLocator = page.getByTestId('dti-input');
    const textareaLocator = page.getByTestId('dti-textarea');
    const resultsContainer = page.locator('#results-container');
    const testInputValue = 'Input test value';
    const testTextareaValue = 'Textarea test value';

    // Act - fill input
    await inputLocator.fill(testInputValue);
    await inputLocator.blur();

    // Assert - input
    await expect(inputLocator).toHaveValue(testInputValue);
    await expect(resultsContainer).toContainText(`Input value changed to: ${testInputValue}`);

    // Act - fill textarea
    await textareaLocator.fill(testTextareaValue);
    await textareaLocator.blur();

    // Assert - textarea
    await expect(textareaLocator).toHaveValue(testTextareaValue);
    await expect(resultsContainer).toContainText(`Textarea value changed to: ${testTextareaValue}`);
  });
});
