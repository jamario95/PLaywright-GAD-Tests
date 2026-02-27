import { test, expect } from '@playwright/test';

/**
 * Scenario 3.2: Reading text from element inside Shadow DOM (level 1)
 * Page: /practice/shadow-dom-0.html
 * Key metric: Shadow DOM support
 *
 * Goal: Compare advanced selector capabilities
 *
 * Playwright automatically penetrates Shadow DOM when using data-testid
 * Selenium/WebdriverIO uses shadow$() - no execute_script needed
 *
 * Differences between technologies:
 * - Playwright: Native Shadow DOM support, automatic penetration
 * - Selenium/WebdriverIO: shadow$() method for explicit shadow root access
 * - Cypress: cy.get().shadow() or .shadow().find() method
 */
test.describe('3.2 - Shadow DOM (level 1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/shadow-dom-0.html');
  });

  test('should fill input and click button in Shadow DOM', async ({ page }) => {
    // Arrange
    const nameInput = page.getByTestId('shadow-name-input');
    const submitButton = page.getByTestId('shadow-submit');
    const resultsLocator = page.getByTestId('shadow-results');
    const testName = 'Jan Kowalski';
    const expectedMessage = `Hello, ${testName}!`;

    // Act
    await nameInput.fill(testName);
    await submitButton.click();

    // Assert
    await expect(resultsLocator).toBeVisible();
    await expect(resultsLocator).toHaveText(expectedMessage);
  });

  test('should display validation error for empty input in Shadow DOM', async ({ page }) => {
    // Arrange
    const nameInput = page.getByTestId('shadow-name-input');
    const submitButton = page.getByTestId('shadow-submit');
    const resultsLocator = page.getByTestId('shadow-results');
    const expectedErrorMessage = 'Please enter your name!';

    // Act
    await nameInput.clear();
    await submitButton.click();

    // Assert
    await expect(resultsLocator).toHaveText(expectedErrorMessage);
    await expect(nameInput).toHaveClass(/invalid/);
  });

  test('should compare interaction with regular DOM vs Shadow DOM', async ({ page }) => {
    // Arrange
    const testName = 'Test User';
    const expectedMessage = `Hello, ${testName}!`;

    // Arrange - Regular DOM elements
    const regularInput = page.getByTestId('name-input');
    const regularSubmit = page.getByTestId('submit');
    const regularResults = page.getByTestId('results');

    // Arrange - Shadow DOM elements
    const shadowInput = page.getByTestId('shadow-name-input');
    const shadowSubmit = page.getByTestId('shadow-submit');
    const shadowResults = page.getByTestId('shadow-results');

    // Act - Regular DOM
    await regularInput.fill(testName);
    await regularSubmit.click();

    // Act - Shadow DOM
    await shadowInput.fill(testName);
    await shadowSubmit.click();

    // Assert - both should work identically
    await expect(regularResults).toHaveText(expectedMessage);
    await expect(shadowResults).toHaveText(expectedMessage);
  });

  test('should read heading from inside Shadow DOM', async ({ page }) => {
    // Arrange
    const shadowHost = page.locator('#shadow-host');
    const expectedText = 'Hello from Shadow DOM!';

    // Act - Playwright automatically penetrates Shadow DOM
    const heading = shadowHost.locator('h3');

    // Assert
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(expectedText);
  });

  test('should verify Shadow DOM structure using locator chain', async ({ page }) => {
    // Arrange
    const shadowHost = page.locator('#shadow-host');

    // Act
    const label = shadowHost.locator('label');
    const input = shadowHost.locator('input');
    const button = shadowHost.locator('button');

    // Assert
    await expect(label).toHaveText('Enter your name:');
    await expect(input).toHaveAttribute('type', 'text');
    await expect(button).toHaveText('Submit');
  });
});
