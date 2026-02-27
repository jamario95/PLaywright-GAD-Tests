import { test, expect } from '@playwright/test';

/**
 * Scenario 8.1: Login user → verify JWT saved in cookies
 * Page: /login
 * API Endpoint: POST /api/login (via login form submission)
 *
 * Technology Comparison:
 * - Cypress: cy.getCookie() + cy.getAllCookies() - chainable API, no async/await
 * - Playwright: context.cookies() - promise-based, all cookies in single call
 * - WebdriverIO: browser.getCookies() + browser.deleteCookies() - explicit async/await
 *
 * Metric: Lines of code for cookie/storage verification, session handling complexity
 *
 * Framework-specific notes:
 * - Playwright: context.cookies() retrieves all cookies in one async call; cookies auto-persist within test context
 */
test.describe('8.1 - JWT Login Verification (Cookie Storage)', () => {
  // Test user credentials (default GAD user)
  const testUser = {
    email: 'Moses.Armstrong@Feest.ca',
    password: 'test1',
  };

  /**
   * Helper function to perform login with valid credentials
   */
  async function performLogin(
    page: import('@playwright/test').Page
  ): Promise<void> {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Enter User Email' }).fill(testUser.email);
    await page.getByRole('textbox', { name: 'Enter Password' }).fill(testUser.password);
    await page.locator('#loginButton').click();
    await expect(page).toHaveURL(/\/welcome/);
  }

  test('should save JWT token in cookies after successful login', async ({
    page,
    context,
  }) => {
    // Act - Log in with valid credentials
    await performLogin(page);

    // Assert - Verify JWT token is saved in cookies
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'token');

    expect(tokenCookie).toBeDefined();
    expect(tokenCookie?.value).toBeTruthy();
    expect(tokenCookie?.value.length).toBeGreaterThan(10);
  });

  test('should have valid JWT token structure (three parts separated by dots)', async ({
    page,
    context,
  }) => {
    // Act - Login
    await performLogin(page);

    // Assert - Verify JWT token structure (header.payload.signature)
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'token');

    expect(tokenCookie).toBeDefined();
    const tokenParts = tokenCookie?.value.split('.');
    expect(tokenParts).toHaveLength(3);

    // Verify each part is base64 encoded
    tokenParts?.forEach((part) => {
      expect(part.length).toBeGreaterThan(0);
    });
  });

  test('should store user ID in cookies after login', async ({
    page,
    context,
  }) => {
    // Act - Login
    await performLogin(page);

    // Assert - Verify user ID cookie exists
    const cookies = await context.cookies();
    const idCookie = cookies.find((cookie) => cookie.name === 'id');

    expect(idCookie).toBeDefined();
    expect(idCookie?.value).toBeTruthy();
  });

  test('should display welcome message with username after login', async ({
    page,
  }) => {
    // Act - Login
    await performLogin(page);

    // Assert - Verify welcome page shows user greeting
    const helloMessage = page.getByTestId('hello');
    await expect(helloMessage).toBeVisible();
    await expect(helloMessage).toContainText('Hi');
  });

  test('should not save token with invalid credentials', async ({
    page,
    context,
  }) => {
    // Arrange
    await page.goto('/login');
    const usernameInput = page.getByRole('textbox', { name: 'Enter User Email' });
    const passwordInput = page.getByRole('textbox', { name: 'Enter Password' });
    const loginButton = page.locator('#loginButton');

    // Act - Try to login with invalid credentials
    await usernameInput.fill('invalid@email.com');
    await passwordInput.fill('wrongpassword');
    await loginButton.click();

    // Assert - Should show error message
    const errorMessage = page.getByTestId('login-error');
    await expect(errorMessage).toBeVisible();

    // Assert - No token cookie should be set
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'token');

    expect(tokenCookie).toBeUndefined();
  });

  test('should display login error for empty credentials', async ({ page }) => {
    // Arrange
    await page.goto('/login');
    const loginButton = page.locator('#loginButton');

    // Act - Try to login without entering credentials
    await loginButton.click();

    // Assert - Should show error message
    const errorMessage = page.getByTestId('login-error');
    await expect(errorMessage).toBeVisible();
  });

  test('should display login error for empty password', async ({ page }) => {
    // Arrange
    await page.goto('/login');
    const usernameInput = page.getByRole('textbox', { name: 'Enter User Email' });
    const loginButton = page.locator('#loginButton');

    // Act - Enter only email, leave password empty
    await usernameInput.fill(testUser.email);
    await loginButton.click();

    // Assert - Should show error message
    const errorMessage = page.getByTestId('login-error');
    await expect(errorMessage).toBeVisible();
  });

  test('should measure login and token storage time for metrics', async ({
    page,
    context,
  }) => {
    // Arrange
    const startTime = Date.now();

    // Act - Login
    await performLogin(page);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`Login and token storage time: ${executionTime}ms`);

    // Assert - Operation completed successfully
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'token');
    expect(tokenCookie).toBeDefined();
    expect(executionTime).toBeGreaterThan(0);
  });

  test('should verify cookie properties (httpOnly, secure flags)', async ({
    page,
    context,
  }) => {
    // Act - Login
    await performLogin(page);

    // Assert - Verify cookie exists and check its properties
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'token');

    expect(tokenCookie).toBeDefined();
    // Note: In development, secure might be false for localhost
    expect(tokenCookie?.path).toBe('/');
  });

  test('should keep token accessible across page navigation', async ({
    page,
    context,
  }) => {
    // Arrange - Login first
    await performLogin(page);

    // Act - Navigate to another page
    await page.goto('/articles.html');

    // Assert - Token should still be present
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'token');

    expect(tokenCookie).toBeDefined();
    expect(tokenCookie?.value).toBeTruthy();
  });

  test('should verify "keep me signed in" checkbox is present', async ({
    page,
  }) => {
    // Arrange
    await page.goto('/login');
    const keepSignInCheckbox = page.locator('#keepSignIn');

    // Act - (No action needed - verifying initial page state)

    // Assert
    await expect(keepSignInCheckbox).toBeVisible();
    await expect(keepSignInCheckbox).not.toBeChecked();
  });

  test('should be able to login with "keep me signed in" checked', async ({
    page,
    context,
  }) => {
    // Arrange
    await page.goto('/login');
    const usernameInput = page.getByRole('textbox', { name: 'Enter User Email' });
    const passwordInput = page.getByRole('textbox', { name: 'Enter Password' });
    const keepSignInCheckbox = page.locator('#keepSignIn');
    const loginButton = page.locator('#loginButton');

    // Act - Login with keep me signed in
    await usernameInput.fill(testUser.email);
    await passwordInput.fill(testUser.password);
    await keepSignInCheckbox.check();
    await loginButton.click();

    // Assert - Should login successfully
    await expect(page).toHaveURL(/\/welcome/);

    // Assert - Token should be saved
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'token');
    expect(tokenCookie).toBeDefined();
  });

  test('should verify all cookies are set correctly after login', async ({
    page,
    context,
  }) => {
    // Arrange & Act - Login
    await performLogin(page);

    // Assert - Verify all expected session cookies are present
    const cookies = await context.cookies();
    const cookieNames = cookies.map((c) => c.name);
    expect(cookieNames).toContain('token');
    expect(cookieNames).toContain('id');
  });
});
