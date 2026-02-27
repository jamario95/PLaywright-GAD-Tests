import { test, expect, type Page } from '@playwright/test';

/**
 * Scenario 9.4: Verify text in iframe without ID
 * Page: /practice/iframe-4.html
 *
 * Technology Comparison:
 * - Cypress: Selects outer iframe by data-testid/id, chains contentDocument for inner iframe
 * - Playwright: Supports data-testid, id, or index selectors in chained frameLocator()
 * - WebdriverIO: Must switch by Element reference; two-step switchFrame() pattern per test
 *
 * Metric: Difficulty of selectors, code complexity for nested iframes without predictable IDs
 *
 * Framework-specific notes:
 * - frameLocator() accepts any CSS selector including [data-testid="..."] natively
 * - getRegisterFrame() helper chains two frameLocator() calls declaratively in one expression
 * - .locator('iframe').nth(0).contentFrame() provides index-based access as alternative API
 */

/**
 * Helper: returns a FrameLocator pointing to the inner register iframe.
 * Page structure: main page → [data-testid="dti-simple-iframe"] → #inner-iframe
 */
const getRegisterFrame = (page: Page) =>
  page.frameLocator('[data-testid="dti-simple-iframe"]').frameLocator('#inner-iframe');

test.describe('9.4 - Iframe Without ID / Complex Selectors', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to the page with nested iframes
    await page.goto('/practice/iframe-4.html');
  });

  test('should access iframe using data-testid attribute', async ({ page }) => {
    // Arrange - Use data-testid to locate outer iframe via helper
    const innerFrame = getRegisterFrame(page);

    // Act & Assert - Verify form elements are accessible
    const usernameInput = innerFrame.getByTestId('username-input');
    await expect(usernameInput).toBeVisible();
  });

  test('should access iframe using id attribute', async ({ page }) => {
    // Arrange - Use id to locate outer iframe (alternative selector)
    const outerFrame = page.frameLocator('#register-iframe');
    const innerFrame = outerFrame.frameLocator('#inner-iframe');

    // Act & Assert - Verify form elements are accessible
    const passwordInput = innerFrame.getByTestId('password-input');
    await expect(passwordInput).toBeVisible();
  });

  test('should fill registration form in deeply nested iframe', async ({
    page,
  }) => {
    // Arrange
    const innerFrame = getRegisterFrame(page);

    const usernameInput = innerFrame.getByTestId('username-input');
    const passwordInput = innerFrame.getByTestId('password-input');
    const ageInput = innerFrame.getByTestId('age-input');
    const registerButton = innerFrame.getByTestId('register-submit');
    const resultsContainer = innerFrame.getByTestId('register-results');

    const testData = {
      username: 'TestUser1', // maxlength is 10 characters
      password: 'SecurePass123',
      age: '25',
    };
    const expectedMessage = `Registration successful! Username: ${testData.username}, Age: ${testData.age}, Password: ${'*'.repeat(testData.password.length)}`;

    // Act - Fill the form
    await usernameInput.fill(testData.username);
    await passwordInput.fill(testData.password);
    await ageInput.fill(testData.age);
    await registerButton.click();

    // Assert - Verify success message
    await expect(resultsContainer).toHaveText(expectedMessage);
  });

  test('should show validation error for empty username', async ({ page }) => {
    // Arrange
    const innerFrame = getRegisterFrame(page);

    const usernameInput = innerFrame.getByTestId('username-input');
    const passwordInput = innerFrame.getByTestId('password-input');
    const registerButton = innerFrame.getByTestId('register-submit');
    const resultsContainer = innerFrame.getByTestId('register-results');

    // Act - Submit form without username
    await usernameInput.clear();
    await passwordInput.fill('ValidPass123');
    await registerButton.click();

    // Assert - Verify error message
    await expect(resultsContainer).toContainText('Please enter a username');
    await expect(usernameInput).toHaveClass(/invalid-input/);
  });

  test('should show validation error for short password', async ({ page }) => {
    // Arrange
    const innerFrame = getRegisterFrame(page);

    const usernameInput = innerFrame.getByTestId('username-input');
    const passwordInput = innerFrame.getByTestId('password-input');
    const registerButton = innerFrame.getByTestId('register-submit');
    const resultsContainer = innerFrame.getByTestId('register-results');

    // Act - Submit form with short password
    await usernameInput.fill('ValidUser');
    await passwordInput.fill('short');
    await registerButton.click();

    // Assert - Verify error message
    await expect(resultsContainer).toContainText('Password must be at least 8 characters long');
    await expect(passwordInput).toHaveClass(/invalid-input/);
  });

  test('should show validation error for invalid age', async ({ page }) => {
    // Arrange
    const innerFrame = getRegisterFrame(page);

    const usernameInput = innerFrame.getByTestId('username-input');
    const passwordInput = innerFrame.getByTestId('password-input');
    const ageInput = innerFrame.getByTestId('age-input');
    const registerButton = innerFrame.getByTestId('register-submit');
    const resultsContainer = innerFrame.getByTestId('register-results');

    // Act - Submit form with invalid age (below minimum)
    await usernameInput.fill('ValidUser');
    await passwordInput.fill('ValidPass123');
    await ageInput.fill('15');
    await registerButton.click();

    // Assert - Verify error message
    await expect(resultsContainer).toContainText('Please enter a valid age');
  });

  test('should verify input field constraints in nested iframe', async ({
    page,
  }) => {
    // Arrange
    const innerFrame = getRegisterFrame(page);

    const usernameInput = innerFrame.getByTestId('username-input');
    const passwordInput = innerFrame.getByTestId('password-input');
    const ageInput = innerFrame.getByTestId('age-input');

    // Assert - Verify input constraints
    await expect(usernameInput).toHaveAttribute('maxlength', '10');
    await expect(passwordInput).toHaveAttribute('maxlength', '20');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(ageInput).toHaveAttribute('type', 'number');
    await expect(ageInput).toHaveAttribute('min', '18');
    await expect(ageInput).toHaveAttribute('max', '99');
  });

  test('should show multiple validation errors for empty form', async ({
    page,
  }) => {
    // Arrange
    const innerFrame = getRegisterFrame(page);

    const usernameInput = innerFrame.getByTestId('username-input');
    const passwordInput = innerFrame.getByTestId('password-input');
    const ageInput = innerFrame.getByTestId('age-input');
    const registerButton = innerFrame.getByTestId('register-submit');
    const resultsContainer = innerFrame.getByTestId('register-results');

    // Act - Clear all fields and submit
    await usernameInput.clear();
    await passwordInput.clear();
    await ageInput.clear();
    await registerButton.click();

    // Assert - Verify multiple error messages
    await expect(resultsContainer).toContainText('Please enter a username');
    await expect(resultsContainer).toContainText('Please enter a password');
  });

  test('should access iframe by index when no unique identifier exists', async ({
    page,
  }) => {
    // Arrange - Access iframe by index (first iframe on page)
    const firstIframe = page.locator('iframe').nth(0).contentFrame();
    const innerFrame = firstIframe.locator('iframe').nth(0).contentFrame();

    // Act & Assert - Verify elements are accessible using index-based selection
    const formHeader = innerFrame.locator('h3');
    await expect(formHeader).toContainText('Please Register');
  });

  test('should verify form header text in nested iframe', async ({ page }) => {
    // Arrange
    const innerFrame = getRegisterFrame(page);
    const formHeader = innerFrame.locator('h3');

    // Act & Assert
    await expect(formHeader).toHaveText('Please Register');
  });

  test('should remove invalid class after providing valid input', async ({
    page,
  }) => {
    // Arrange
    const innerFrame = getRegisterFrame(page);

    const usernameInput = innerFrame.getByTestId('username-input');
    const passwordInput = innerFrame.getByTestId('password-input');
    const ageInput = innerFrame.getByTestId('age-input');
    const registerButton = innerFrame.getByTestId('register-submit');
    const resultsContainer = innerFrame.getByTestId('register-results');

    // Act - First submit with empty fields to trigger validation
    await usernameInput.clear();
    await passwordInput.fill('short');
    await registerButton.click();

    // Assert - Verify invalid classes are added
    await expect(usernameInput).toHaveClass(/invalid-input/);
    await expect(passwordInput).toHaveClass(/invalid-input/);

    // Act - Fill valid data and submit again
    await usernameInput.fill('ValidUser');
    await passwordInput.fill('ValidPassword123');
    await ageInput.fill('25');
    await registerButton.click();

    // Assert - Verify invalid classes are removed and success message shown
    await expect(usernameInput).not.toHaveClass(/invalid-input/);
    await expect(passwordInput).not.toHaveClass(/invalid-input/);
    await expect(resultsContainer).toContainText('Registration successful!');
  });

  test('should measure complex iframe interaction time for metrics', async ({
    page,
  }) => {
    // Arrange
    const startTime = Date.now();
    const innerFrame = getRegisterFrame(page);

    const usernameInput = innerFrame.getByTestId('username-input');
    const passwordInput = innerFrame.getByTestId('password-input');
    const ageInput = innerFrame.getByTestId('age-input');
    const registerButton = innerFrame.getByTestId('register-submit');
    const resultsContainer = innerFrame.getByTestId('register-results');

    // Act - Complete form fill and submission
    await usernameInput.fill('MetricUser');
    await passwordInput.fill('MetricPass123');
    await ageInput.fill('30');
    await registerButton.click();

    // Wait for result
    await expect(resultsContainer).toContainText('Registration successful!');

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`Complex nested iframe interaction time: ${executionTime}ms`);

    // Assert - Operation completed successfully
    expect(executionTime).toBeGreaterThan(0);
  });

  test('should demonstrate frameLocator chaining vs Selenium multiple switches', async ({
    page,
  }) => {
    // Arrange - Single chained expression via helper (no switching state to manage)
    const innerFrame = getRegisterFrame(page);
    const mainPageTitle = page.locator('h2');

    // Act - Fill registration form using chained frameLocator
    await innerFrame.getByTestId('username-input').fill('ChainUser');
    await innerFrame.getByTestId('password-input').fill('ChainPass123');
    await innerFrame.getByTestId('age-input').fill('28');
    await innerFrame.getByTestId('register-submit').click();

    // Assert - Verify form submission and main page accessibility
    await expect(innerFrame.getByTestId('register-results')).toContainText(
      'Registration successful!'
    );
    await expect(mainPageTitle).toContainText('Nested IFrame with Register Form');
  });
});
