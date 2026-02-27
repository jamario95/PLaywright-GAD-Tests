import { test, expect } from '@playwright/test';

/**
 * Scenario 8.2: Navigation with active session → verify access to protected page
 * Page: /welcome
 * API Endpoint: N/A (E2E session persistence test)
 *
 * Technology Comparison:
 * - Cypress: cy.getCookie() + cy.intercept() - chainable
 * - Playwright: context.cookies() + page.route() + storageState
 * - WebdriverIO: browser.getCookies() + browser.waitUntil() - explicit async
 *
 * Metric: Auth persistence complexity, session sharing across page navigations
 *
 * Framework-specific notes:
 * - Playwright: context.storageState() captures session state; page.route() intercepts requests; context auto-manages cookies
 */
test.describe('8.2 - Protected Page Access with Active Session', () => {
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

  test('should access welcome page after successful login', async ({
    page,
  }) => {
    // Arrange & Act - Login
    await performLogin(page);

    // Assert - Should be on welcome page with user greeting
    const helloMessage = page.getByTestId('hello');
    await expect(helloMessage).toBeVisible();
    await expect(helloMessage).toContainText('Hi');
  });

  test('should redirect to login when accessing welcome page without authentication', async ({
    page,
  }) => {
    // Act - Try to access welcome page directly without login
    await page.goto('/welcome');

    // Assert - Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should maintain session when navigating to articles page', async ({
    page,
    context,
  }) => {
    // Arrange - Login first
    await performLogin(page);

    // Act - Navigate to articles page
    await page.goto('/articles.html');

    // Assert - Session should be maintained (token cookie still present)
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'token');
    expect(tokenCookie).toBeDefined();

    // Assert - Page should load without redirecting to login
    await expect(page).toHaveURL(/\/articles\.html/);
  });

  test('should maintain session when navigating to user profile page', async ({
    page,
    context,
  }) => {
    // Arrange - Login first
    await performLogin(page);

    // Act - Navigate to user profile page via link
    const myProfileButton = page.locator('#btnMyAccountLink');
    await myProfileButton.click();

    // Assert - Should navigate to user profile page
    await expect(page).toHaveURL(/\/user\.html/);

    // Assert - Session should be maintained
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'token');
    expect(tokenCookie).toBeDefined();
  });

  test('should display session countdown timer on welcome page', async ({
    page,
  }) => {
    // Arrange & Act - Login
    await performLogin(page);

    // Assert - Session countdown should be visible
    const countdownElement = page.getByTestId('countDown');
    await expect(countdownElement).toBeVisible();
    await expect(countdownElement).toContainText('Session will expire');
  });

  test('should maintain session when navigating back and forth', async ({
    page,
    context,
  }) => {
    // Arrange - Login
    await performLogin(page);

    // Act - Navigate to articles and back
    await page.goto('/articles.html');
    await page.goBack();

    // Assert - Should be on welcome page with session intact
    await expect(page).toHaveURL(/\/welcome/);

    const cookies = await context.cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'token');
    expect(tokenCookie).toBeDefined();
  });

  test('should access comments page with active session', async ({
    page,
    context,
  }) => {
    // Arrange - Login
    await performLogin(page);

    // Act - Navigate to comments page
    const commentsButton = page.locator('#btnCommentsLink');
    await commentsButton.click();

    // Assert - Should access comments page
    await expect(page).toHaveURL(/\/comments\.html/);

    // Assert - Session intact
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'token');
    expect(tokenCookie).toBeDefined();
  });

  test('should display user avatar on welcome page', async ({ page }) => {
    // Arrange & Act - Login
    await performLogin(page);

    // Assert - Avatar should be visible
    const avatarElement = page.locator('#myAvatar');
    await expect(avatarElement).toBeVisible();
  });

  test('should display logout button on welcome page', async ({ page }) => {
    // Arrange & Act - Login
    await performLogin(page);

    // Assert - Logout button should be visible
    const logoutButton = page.getByTestId('logoutButton');
    await expect(logoutButton).toBeVisible();
    await expect(logoutButton).toContainText('Logout');
  });

  test('should display current time and timezone on welcome page', async ({
    page,
  }) => {
    // Arrange & Act - Login
    await performLogin(page);

    // Assert - Current time should be displayed
    const currentTimeElement = page.getByTestId('current-time');
    await expect(currentTimeElement).toBeVisible();

    // Assert - Timezone should be displayed
    const timezoneElement = page.getByTestId('time-zone');
    await expect(timezoneElement).toBeVisible();
  });

  test('should access games page with active session', async ({
    page,
    context,
  }) => {
    // Arrange - Login
    await performLogin(page);

    // Act - Navigate to games page
    const gamesButton = page.getByRole('link', { name: 'Games' });
    await gamesButton.click();

    // Assert - Should access games page
    await expect(page).toHaveURL(/\/games/);

    // Assert - Session intact
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((cookie) => cookie.name === 'token');
    expect(tokenCookie).toBeDefined();
  });

  test('should measure protected page navigation time for metrics', async ({
    page,
  }) => {
    // Arrange - Login first
    await performLogin(page);
    const startTime = Date.now();

    // Act - Navigate to protected page
    await page.goto('/articles.html');
    await page.waitForLoadState('networkidle');

    const endTime = Date.now();
    const navigationTime = endTime - startTime;

    // Log for metrics
    console.log(`Protected page navigation time: ${navigationTime}ms`);

    // Assert - Navigation completed successfully
    await expect(page).toHaveURL(/\/articles\.html/);
    expect(navigationTime).toBeGreaterThan(0);
  });

  test('should verify Authorization header is sent with API requests', async ({
    page,
  }) => {
    // Arrange - Login first
    await performLogin(page);

    // Arrange - Set up request interception before navigation
    let authorizationHeader = '';
    await page.route('**/api/**', async (route) => {
      const headers = route.request().headers();
      if (headers['authorization']) {
        authorizationHeader = headers['authorization'];
      }
      await route.continue();
    });

    // Act - Navigate to a page that makes API calls (user profile page)
    await page.goto('/user.html?id=1');
    await page.waitForLoadState('networkidle');

    // Assert - Authorization header should contain Bearer token
    expect(authorizationHeader).toContain('Bearer');
  });

  test('should show quick navigation links after login', async ({ page }) => {
    // Arrange & Act - Login
    await performLogin(page);

    // Assert - Quick navigation links should be visible
    await expect(page.locator('#btnMyAccountLink')).toBeVisible();
    await expect(page.locator('#btnArticlesLink')).toBeVisible();
    await expect(page.locator('#btnCommentsLink')).toBeVisible();
    await expect(page.locator('#btnSurveysLink')).toBeVisible();
    // Note: #btnGamesLink is used twice in GAD (Games and Messenger), using role selector
    await expect(page.getByRole('link', { name: 'Games' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Messenger' })).toBeVisible();
  });

  test('should display delete account button in danger zone', async ({
    page,
  }) => {
    // Arrange & Act - Login
    await performLogin(page);

    // Assert - Delete account button should be visible in danger zone
    const deleteButton = page.getByTestId('deleteButton');
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toContainText('Delete Account');
  });

  test('should maintain session through multiple consecutive page navigations', async ({
    page,
    context,
  }) => {
    // Arrange - Login
    await performLogin(page);

    // Navigate through multiple pages and verify session persists at each step
    await page.locator('#btnArticlesLink').click();
    await expect(page).toHaveURL(/\/articles\.html/);
    let cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'token')).toBeDefined();

    await page.goto('/comments.html');
    await expect(page).toHaveURL(/\/comments\.html/);
    cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'token')).toBeDefined();

    await page.goto('/welcome');
    await expect(page).toHaveURL(/\/welcome/);
    cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'token')).toBeDefined();
  });

  test('should store session state retrievable via context storageState', async ({
    page,
    context,
  }) => {
    // Arrange & Act - Login
    await performLogin(page);

    // Act - Retrieve session state (Playwright equivalent of cy.session caching)
    const state = await context.storageState();

    // Assert - Session state contains token cookie
    const tokenCookie = state.cookies.find((c) => c.name === 'token');
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie?.value).toBeTruthy();

    // Navigate away and back - session maintained within context
    await page.goto('/articles.html');
    await page.goto('/welcome');
    await expect(page).toHaveURL(/\/welcome/);
    await expect(page.getByTestId('hello')).toBeVisible();
  });
});
