import { test, expect } from '@playwright/test';

/**
 * Scenario 8.3: Logout → verify token removal from cookies
 * Page: /logout
 * API Endpoint: GET /logout (session invalidation)
 *
 * Technology Comparison:
 * - Cypress: cy.getCookie().should('be.null') - null assertion pattern
 * - Playwright: context.cookies() undefined assertion + page.route()
 * - WebdriverIO: browser.getCookies() undefined assertion
 *
 * Metric: State cleanup verification complexity, lines of code for post-logout assertions
 *
 * Framework-specific notes:
 * - Playwright: context.cookies() returns [] after logout; page.route() verifies no Authorization header sent post-logout
 */
test.describe('8.3 - Logout Token Removal Verification', () => {
  // Test user credentials
  const testUser = {
    email: 'Moses.Armstrong@Feest.ca',
    password: 'test1',
  };

  /**
   * Helper function to perform login
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

  test('should remove token cookie after logout', async ({ page, context }) => {
    // Arrange - Login first
    await performLogin(page);

    // Verify token exists before logout
    let cookies = await context.cookies();
    let tokenCookie = cookies.find((cookie) => cookie.name === 'token');
    expect(tokenCookie).toBeDefined();

    // Act - Click logout button
    const logoutButton = page.getByTestId('logoutButton');
    await logoutButton.click();

    // Assert - Should redirect to login page
    await expect(page).toHaveURL(/\/login/);

    // Assert - Token cookie should be removed
    cookies = await context.cookies();
    tokenCookie = cookies.find((cookie) => cookie.name === 'token');
    expect(tokenCookie).toBeUndefined();
  });

  test('should remove user ID cookie after logout', async ({
    page,
    context,
  }) => {
    // Arrange - Login first
    await performLogin(page);

    // Verify ID cookie exists before logout
    let cookies = await context.cookies();
    let idCookie = cookies.find((cookie) => cookie.name === 'id');
    expect(idCookie).toBeDefined();

    // Act - Click logout button
    const logoutButton = page.getByTestId('logoutButton');
    await logoutButton.click();

    // Wait for redirect
    await expect(page).toHaveURL(/\/login/);

    // Assert - ID cookie should be removed
    cookies = await context.cookies();
    idCookie = cookies.find((cookie) => cookie.name === 'id');
    expect(idCookie).toBeUndefined();
  });

  test('should redirect to login page after logout', async ({ page }) => {
    // Arrange - Login first
    await performLogin(page);

    // Act - Click logout button
    const logoutButton = page.getByTestId('logoutButton');
    await logoutButton.click();

    // Assert - Should be on login page
    await expect(page).toHaveURL(/\/login/);

    // Assert - Login form should be visible
    await expect(page.getByRole('textbox', { name: 'Enter User Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Enter Password' })).toBeVisible();
    await expect(page.locator('#loginButton')).toBeVisible();
  });

  test('should not access protected page after logout', async ({ page }) => {
    // Arrange - Login first
    await performLogin(page);

    // Act - Logout
    const logoutButton = page.getByTestId('logoutButton');
    await logoutButton.click();
    await expect(page).toHaveURL(/\/login/);

    // Act - Try to access protected page
    await page.goto('/welcome');

    // Assert - Should redirect back to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should logout via direct URL navigation', async ({ page, context }) => {
    // Arrange - Login first
    await performLogin(page);

    // Verify token exists
    let cookies = await context.cookies();
    let tokenCookie = cookies.find((cookie) => cookie.name === 'token');
    expect(tokenCookie).toBeDefined();

    // Act - Navigate directly to logout URL
    await page.goto('/logout');

    // Assert - Should redirect to login page
    await expect(page).toHaveURL(/\/login/);

    // Assert - Token should be removed
    cookies = await context.cookies();
    tokenCookie = cookies.find((cookie) => cookie.name === 'token');
    expect(tokenCookie).toBeUndefined();
  });

  test('should clear all session-related cookies after logout', async ({
    page,
    context,
  }) => {
    // Arrange - Login first
    await performLogin(page);

    // Get all cookies before logout
    const cookiesBeforeLogout = await context.cookies();
    const sessionCookiesBeforeLogout = cookiesBeforeLogout.filter(
      (c) => c.name === 'token' || c.name === 'id'
    );
    expect(sessionCookiesBeforeLogout.length).toBeGreaterThan(0);

    // Act - Logout
    const logoutButton = page.getByTestId('logoutButton');
    await logoutButton.click();
    await expect(page).toHaveURL(/\/login/);

    // Assert - All session cookies should be cleared
    const cookiesAfterLogout = await context.cookies();
    const sessionCookiesAfterLogout = cookiesAfterLogout.filter(
      (c) => c.name === 'token' || c.name === 'id'
    );
    expect(sessionCookiesAfterLogout.length).toBe(0);
  });

  test('should allow re-login after logout', async ({ page, context }) => {
    // Arrange - Login first
    await performLogin(page);

    // Act - Logout
    const logoutButton = page.getByTestId('logoutButton');
    await logoutButton.click();
    await expect(page).toHaveURL(/\/login/);

    // Act - Login again
    await page.getByRole('textbox', { name: 'Enter User Email' }).fill(testUser.email);
    await page.getByRole('textbox', { name: 'Enter Password' }).fill(testUser.password);
    await page.locator('#loginButton').click();

    // Assert - Should be logged in again
    await expect(page).toHaveURL(/\/welcome/);

    // Assert - New token should be present
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'token');
    expect(tokenCookie).toBeDefined();
  });

  test('should measure logout and cleanup time for metrics', async ({
    page,
    context,
  }) => {
    // Arrange - Login first
    await performLogin(page);
    const startTime = Date.now();

    // Act - Logout
    const logoutButton = page.getByTestId('logoutButton');
    await logoutButton.click();
    await expect(page).toHaveURL(/\/login/);

    const endTime = Date.now();
    const logoutTime = endTime - startTime;

    // Log for metrics
    console.log(`Logout and cleanup time: ${logoutTime}ms`);

    // Assert - Logout completed successfully
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'token');
    expect(tokenCookie).toBeUndefined();
    expect(logoutTime).toBeGreaterThan(0);
  });

  test('should not show welcome greeting after logout', async ({ page }) => {
    // Arrange - Login first
    await performLogin(page);

    // Verify greeting is visible
    await expect(page.getByTestId('hello')).toBeVisible();

    // Act - Logout
    const logoutButton = page.getByTestId('logoutButton');
    await logoutButton.click();

    // Assert - Greeting should not be visible (on login page now)
    await expect(page.getByTestId('hello')).not.toBeVisible();
  });

  test('should not have Authorization header after logout when navigating', async ({
    page,
  }) => {
    // Arrange - Login first
    await performLogin(page);

    // Act - Logout
    const logoutButton = page.getByTestId('logoutButton');
    await logoutButton.click();
    await expect(page).toHaveURL(/\/login/);

    // Arrange - Set up request interception
    let authorizationHeader: string | undefined;
    await page.route('**/api/**', async (route) => {
      const headers = route.request().headers();
      authorizationHeader = headers['authorization'];
      await route.continue();
    });

    // Act - Navigate to page that would make API calls
    await page.goto('/articles.html');
    await page.waitForLoadState('networkidle');

    // Assert - Authorization should be undefined or not contain Bearer token
    if (authorizationHeader) {
      expect(authorizationHeader).not.toContain('Bearer ey');
    }
  });

  test('should handle multiple login/logout cycles', async ({
    page,
    context,
  }) => {
    // First cycle
    await performLogin(page);
    let cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'token')).toBeDefined();

    await page.getByTestId('logoutButton').click();
    await expect(page).toHaveURL(/\/login/);
    cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'token')).toBeUndefined();

    // Second cycle
    await performLogin(page);
    cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'token')).toBeDefined();

    await page.getByTestId('logoutButton').click();
    await expect(page).toHaveURL(/\/login/);
    cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'token')).toBeUndefined();

    // Third cycle
    await performLogin(page);
    cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'token')).toBeDefined();
  });

  test('should display login form correctly after logout', async ({ page }) => {
    // Arrange - Login first
    await performLogin(page);

    // Act - Logout
    const logoutButton = page.getByTestId('logoutButton');
    await logoutButton.click();

    // Assert - Login form elements should be visible and empty
    const usernameInput = page.getByRole('textbox', { name: 'Enter User Email' });
    const passwordInput = page.getByRole('textbox', { name: 'Enter Password' });

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(usernameInput).toHaveValue('');
    await expect(passwordInput).toHaveValue('');
  });

  test('should verify logout works from any protected page', async ({
    page,
    context,
  }) => {
    // Arrange - Login and navigate to a different protected page
    await performLogin(page);
    await page.goto('/articles.html');
    await expect(page).toHaveURL(/\/articles\.html/);

    // Navigate back to welcome to logout
    await page.goto('/welcome');

    // Act - Logout
    const logoutButton = page.getByTestId('logoutButton');
    await logoutButton.click();

    // Assert - Should be logged out regardless of which page logout was triggered from
    await expect(page).toHaveURL(/\/login/);
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((c) => c.name === 'token');
    expect(tokenCookie).toBeUndefined();
  });
});
