import { test, expect } from '@playwright/test';

test.describe('1.2 Custom Elements - data-testid & stable selectors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/custom-elements.html');
  });

  // Positive Tests
  test('should click gad-button using CSS selector and verify result', async ({ page }) => {
    // Arrange
    const gadButtonLocator = page.locator('gad-button').first();
    const resultsContainerLocator = page.locator('#results-container');
    const expectedResultPattern = /Button Click me! clicked 1!/;

    // Act
    await gadButtonLocator.click();

    // Assert
    await expect(resultsContainerLocator).toBeVisible();
    await expect(resultsContainerLocator).toHaveText(expectedResultPattern);
  });

  test('should click gad-button using getByRole and verify text change', async ({ page }) => {
    // Arrange
    const gadButtonLocator = page.getByRole('button', { name: 'Click me!' }).first();
    const shadowButtonLocator = page.locator('gad-button').first().locator('button');
    const resultsContainerLocator = page.locator('#results-container');

    // Act
    await gadButtonLocator.click();

    // Assert
    await expect(shadowButtonLocator).toHaveText('Clicked 1!');
    await expect(resultsContainerLocator).toContainText('clicked 1!');
  });

  test('should click second gad-button using filter with "Click me too!" and verify result', async ({ page }) => {
    // Arrange
    const secondGadButtonLocator = page.locator('gad-button').filter({ hasText: 'Click me too!' });
    const resultsContainerLocator = page.locator('#results-container');
    const expectedResultPattern = /Button Click me too! clicked 1!/;

    // Act
    await secondGadButtonLocator.click();

    // Assert
    await expect(resultsContainerLocator).toBeVisible();
    await expect(resultsContainerLocator).toHaveText(expectedResultPattern);
  });

  test('should find label element by data-testid and verify custom attribute', async ({ page }) => {
    // Arrange
    const labelLocator = page.getByTestId('dti-label-element');
    const expectedText = 'Some text for label';
    const expectedCustomAttribute = 'custom-value';

    // Act

    // Assert
    await expect(labelLocator).toBeVisible();
    await expect(labelLocator).toHaveText(expectedText);
    await expect(labelLocator).toHaveAttribute('custom-attribute', expectedCustomAttribute);
  });

  // Variant tests
  test('should click gad-funky-button and verify result message', async ({ page }) => {
    // Arrange
    const funkyButtonLocator = page.locator('gad-funky-button');
    const shadowButtonLocator = funkyButtonLocator.locator('button');
    const resultsContainerLocator = page.locator('#results-container');
    const expectedResultText = 'Funky button clicked 1!';

    // Act
    await funkyButtonLocator.click();

    // Assert
    await expect(resultsContainerLocator).toBeVisible();
    await expect(resultsContainerLocator).toHaveText(expectedResultText);
    await expect(shadowButtonLocator).toHaveText('Clicked 1!');
  });

  // Multiple interaction Tests
  test('should track multiple clicks on gad-button', async ({ page }) => {
    // Arrange
    const gadButtonLocator = page.locator('gad-button').first();
    const shadowButtonLocator = gadButtonLocator.locator('button');
    const resultsContainerLocator = page.locator('#results-container');
    const numberOfClicks = 3;

    // Act
    for (let i = 0; i < numberOfClicks; i++) {
      await gadButtonLocator.click();
    }

    // Assert
    await expect(shadowButtonLocator).toHaveText(`Clicked ${numberOfClicks}!`);
    await expect(resultsContainerLocator).toHaveText(`Button Click me! clicked ${numberOfClicks}!`);
  });

  test('should track multiple clicks on gad-funky-button', async ({ page }) => {
    // Arrange
    const funkyButtonLocator = page.locator('gad-funky-button');
    const shadowButtonLocator = funkyButtonLocator.locator('button');
    const resultsContainerLocator = page.locator('#results-container');
    const numberOfClicks = 5;

    // Act
    for (let i = 0; i < numberOfClicks; i++) {
      await funkyButtonLocator.click();
    }

    // Assert
    await expect(shadowButtonLocator).toHaveText(`Clicked ${numberOfClicks}!`);
    await expect(resultsContainerLocator).toHaveText(`Funky button clicked ${numberOfClicks}!`);
  });

  // SHADOW DOM Tests gad-input
  test('should interact with gad-input (Shadow DOM) using locator', async ({ page }) => {
    // Arrange
    const gadInputLocator = page.locator('gad-input#id-gad-input');
    const shadowInputLocator = gadInputLocator.locator('input');
    const resultsContainerLocator = page.locator('#results-container');
    const inputValue = 'Test input value';
    const expectedResult = `Input value: ${inputValue}`;

    // Act
    await shadowInputLocator.fill(inputValue);
    await shadowInputLocator.press('Enter');

    // Assert
    await expect(resultsContainerLocator).toHaveText(expectedResult);
  });

  test('should interact with gad-numeric-input (Shadow DOM) and verify stored value', async ({ page }) => {
    // Arrange
    const numericInputLocator = page.locator('gad-numeric-input');
    const shadowInputLocator = numericInputLocator.locator('input');
    const inputValue = '69';

    // Act
    await shadowInputLocator.fill(inputValue);
    await shadowInputLocator.blur();

    // Assert
    await expect(numericInputLocator).toHaveAttribute('stored-value', inputValue);
  });
});
