import { test, expect } from '@playwright/test';

/**
 * Scenario 3.4: Interaction with Custom Element <gad-button>
 * Page: /practice/custom-elements.html
 * Key metric: Web Components support
 *
 * Goal: Compare advanced selector capabilities
 *
 * Custom Elements are native Web Components with their own Shadow DOM
 * Playwright supports them natively, other frameworks require workarounds
 *
 * Differences between technologies:
 * - Playwright: Native support for Web Components
 * - Selenium/WebdriverIO: Direct click works; $() auto-traverses shadow children of custom elements
 * - Cypress: Uses .shadow() method to access shadow root of custom elements
 */
test.describe('3.4 - Custom Elements (Web Components)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/custom-elements.html');
  });

  test('should click gad-button and verify result', async ({ page }) => {
    // Arrange
    const gadButton = page.locator('gad-button').first();
    const resultsContainer = page.locator('#results-container');
    const expectedResultPattern = /Button Click me! clicked 1!/;

    // Act
    await gadButton.click();

    // Assert
    await expect(resultsContainer).toBeVisible();
    await expect(resultsContainer).toHaveText(expectedResultPattern);
  });

  test('should click gad-button using getByRole', async ({ page }) => {
    // Arrange
    const buttonByRole = page.getByRole('button', { name: 'Click me!' }).first();
    const resultsContainer = page.locator('#results-container');

    // Act
    await buttonByRole.click();

    // Assert
    await expect(resultsContainer).toContainText('clicked 1!');
  });

  test('should click second gad-button with different text', async ({ page }) => {
    // Arrange
    const secondButton = page.locator('gad-button').filter({ hasText: 'Click me too!' });
    const resultsContainer = page.locator('#results-container');
    const expectedResultPattern = /Button Click me too! clicked 1!/;

    // Act
    await secondButton.click();

    // Assert
    await expect(resultsContainer).toHaveText(expectedResultPattern);
  });

  test('should track multiple clicks on gad-button', async ({ page }) => {
    // Arrange
    const gadButton = page.locator('gad-button').first();
    const shadowButton = gadButton.locator('button');
    const resultsContainer = page.locator('#results-container');
    const numberOfClicks = 3;

    // Act
    for (let i = 0; i < numberOfClicks; i++) {
      await gadButton.click();
    }

    // Assert
    await expect(shadowButton).toHaveText(`Clicked ${numberOfClicks}!`);
    await expect(resultsContainer).toHaveText(`Button Click me! clicked ${numberOfClicks}!`);
  });

  test('should click gad-funky-button and verify result', async ({ page }) => {
    // Arrange
    const funkyButton = page.locator('gad-funky-button');
    const shadowButton = funkyButton.locator('button');
    const resultsContainer = page.locator('#results-container');
    const expectedResultText = 'Funky button clicked 1!';

    // Act
    await funkyButton.click();

    // Assert
    await expect(resultsContainer).toHaveText(expectedResultText);
    await expect(shadowButton).toHaveText('Clicked 1!');
  });

  test('should fill gad-input and verify value', async ({ page }) => {
    // Arrange
    const gadInput = page.locator('gad-input#id-gad-input');
    const shadowInput = gadInput.locator('input');
    const resultsContainer = page.locator('#results-container');
    const inputValue = 'Test input value';
    const expectedResult = `Input value: ${inputValue}`;

    // Act
    await shadowInput.fill(inputValue);
    await shadowInput.press('Enter');

    // Assert
    await expect(resultsContainer).toHaveText(expectedResult);
  });

  test('should verify gad-numeric-input and check stored-value', async ({ page }) => {
    // Arrange
    const numericInput = page.locator('gad-numeric-input');
    const shadowInput = numericInput.locator('input');
    const inputValue = '42';

    // Act
    await shadowInput.fill(inputValue);
    await shadowInput.blur();

    // Assert
    await expect(numericInput).toHaveAttribute('stored-value', inputValue);
  });

  test('should find label by data-testid and verify custom attribute', async ({ page }) => {
    // Arrange
    const labelLocator = page.getByTestId('dti-label-element');
    const expectedText = 'Some text for label';
    const expectedCustomAttribute = 'custom-value';

    // Act
    // (No action needed - verifying element attributes in initial state)

    // Assert
    await expect(labelLocator).toBeVisible();
    await expect(labelLocator).toHaveText(expectedText);
    await expect(labelLocator).toHaveAttribute('custom-attribute', expectedCustomAttribute);
  });

  test('should verify table headers with custom elements', async ({ page }) => {
    // Arrange
    const descriptionHeader = page.getByTestId('dti-description');
    const elementsHeader = page.getByTestId('dti-elements');

    // Act
    // (No action needed - verifying header text in initial state)

    // Assert
    await expect(descriptionHeader).toHaveText('Description');
    await expect(elementsHeader).toHaveText('Elements for Test Automation');
  });
});
