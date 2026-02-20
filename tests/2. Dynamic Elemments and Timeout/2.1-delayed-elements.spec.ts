import { test, expect } from '@playwright/test';

/**
 * Scenario 2.1: Waiting for an element appearing with 2s delay
 * Page: /practice/delayed-elements-and-delayed-result-1.html
 * Key metric: Execution time, stability
 *
 * Goal: Compare waiting mechanisms and stability
 *
 * GAD Page:
 * - Elements appear after 2-2.5s (delayForCreate)
 * - Then become enabled after another 2-2.5s (delayForEnable)
 * - Total delay: 4-5s
 *
 * Differences between technologies:
 * - Playwright: Built-in auto-waiting (up to 30s default)
 * - Selenium: Manual WebDriverWait with ExpectedConditions
 * - Cypress: Automatic retry (4s default)
 */
test.describe('2.1 - Waiting for element with delay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/delayed-elements-and-delayed-result-1.html');
  });

  test('should click button appearing with 2s delay and verify result', async ({ page }) => {
    // Arrange
    const buttonLocator = page.getByTestId('dti-button-element-1');
    const resultsLocator = page.getByTestId('dti-results-container');
    const expectedMessage = 'You clicked the button!';

    // Act - Playwright auto-wait waits for element up to 30s (configurable)
    // Element appears after ~2s and becomes enabled after another ~2s
    await buttonLocator.click();

    // Assert
    await expect(resultsLocator).toContainText(expectedMessage);
  });

  test('should verify element state transitions from NOT PRESENT to ENABLED', async ({ page }) => {
    // Arrange
    const statusLabel = page.locator('#statusLabel');
    const buttonLocator = page.getByTestId('dti-button-element-1');

    // Assert - initial state (NOT PRESENT)
    await expect(statusLabel).toHaveText('NOT PRESENT');

    // Act & Assert - wait for element to appear (PRESENT but DISABLED)
    await expect(buttonLocator).toBeVisible();
    await expect(statusLabel).toHaveText('PRESENT but DISABLED');

    // Act & Assert - wait for element to become enabled (ENABLED)
    await expect(buttonLocator).toBeEnabled();
    await expect(statusLabel).toHaveText('ENABLED');
  });
});
