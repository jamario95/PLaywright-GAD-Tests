import { test, expect } from '@playwright/test';

test.describe('Testing Shadow DOM elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/shadow-dom-0.html');
  });
  test('Normal container', async ({ page }) => {
    // Arrange
    const textAreaLocator = page.getByTestId('name-input');
    const subbmitButtonLocator = page.getByTestId('submit');
    const expectedMessageLocator = page.getByTestId('results');
    const name = 'John Doe';
    const expectedMessage = 'Hello, John Doe!';
    // Act
    await textAreaLocator.fill(name);
    await subbmitButtonLocator.click();
    //Assert
    await expect(expectedMessageLocator).toBeVisible();
    await expect(expectedMessageLocator).toHaveText(expectedMessage);
  });
    test('Shadow Doom container', async ({ page }) => {
    // Arrange
    const textAreaLocator = page.getByTestId('shadow-name-input');
    const subbmitButtonLocator = page.getByTestId('shadow-submit');
    const expectedMessageLocator = page.getByTestId('shadow-results');
    const name = 'John Doe';
    const expectedMessage = 'Hello, John Doe!';
    // Act
    await textAreaLocator.fill(name);
    await subbmitButtonLocator.click();
    //Assert
    await expect(expectedMessageLocator).toBeVisible();
    await expect(expectedMessageLocator).toHaveText(expectedMessage);
  });
      test('Nested Shadow Doom container', async ({ page }) => {
    // Arrange
    const textAreaLocator = page.getByTestId('nested-shadow-name-input');
    const subbmitButtonLocator = page.getByTestId('nested-shadow-submit');
    const expectedMessageLocator = page.getByTestId('nested-shadow-results');
    const name = 'John Doe';
    const expectedMessage = 'Hello, John Doe!';
    // Act
    await textAreaLocator.fill(name);
    await subbmitButtonLocator.click();
    //Assert
    await expect(expectedMessageLocator).toBeVisible();
    await expect(expectedMessageLocator).toHaveText(expectedMessage);
  });
        test('Closed Shadow Doom container', async ({ page }) => {
    // Arrange
    const textAreaLocator = page.getByTestId('closed-shadow-name-input');
    const subbmitButtonLocator = page.getByTestId('closed-shadow-submit');
    const expectedMessageLocator = page.getByTestId('closed-shadow-results');
    const name = 'John Doe';
    const expectedMessage = 'Hello, John Doe!';
    // Act
    // await textAreaLocator.fill(name);
    // await subbmitButtonLocator.click();
    //Assert
    await expect(textAreaLocator).not.toBeVisible();
    await expect(subbmitButtonLocator).toHaveCount(0);
  });
});
