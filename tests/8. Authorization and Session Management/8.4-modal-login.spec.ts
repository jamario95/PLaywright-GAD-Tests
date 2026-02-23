import { test, expect } from '@playwright/test';

/**
 * Scenario 8.4: Modal login - login in modal window
 * Page: /practice/login-modal.html
 * Key metric: Modal interaction
 *
 * Goal: Compare modal handling and dialog interaction across frameworks
 *
 * Page structure:
 * - Browser native prompt dialog for credentials (format: user:pass)
 * - #status: Status indicator (visible before login)
 * - #successContent: Success content container (visible after login)
 * - #failureContent: Failure content container (visible on failed login)
 * - #userDisplay: Username display after successful login
 * - #loginTime: Login timestamp display
 * - .logout-btn: Logout button
 *
 * Authentication API:
 * - POST /api/practice/modals/login
 * - Body: { username: string, password: string }
 * - Valid credentials: user:pass
 *
 * Differences between technologies:
 * - Playwright: page.on('dialog') + dialog.accept() for native prompts
 * - Selenium: driver.switch_to.alert + alert.send_keys() for prompt handling
 * - Cypress: cy.window() + cy.stub() for dialog stubbing
 *
 * Metric: Ease of modal/dialog handling, lines of code
 */
test.describe('8.4 - Modal Login Interaction', () => {
  // Valid credentials for modal login
  const validCredentials = 'testuser:testpass';
  const invalidCredentials = 'user:pass'; // Note: user:pass returns "Invalid credentials!" in GAD API

  /**
   * Helper: register dialog handler for valid credentials, navigate, and wait for success content
   */
  async function setupValidLogin(page: import('@playwright/test').Page): Promise<void> {
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') {
        await dialog.accept(validCredentials);
      }
    });
    await page.goto('/practice/login-modal.html');
    await expect(page.locator('#successContent')).toBeVisible({ timeout: 5000 });
  }

  /**
   * Helper: register dialog handler for invalid credentials, navigate, and wait for failure content
   */
  async function setupInvalidLogin(page: import('@playwright/test').Page): Promise<void> {
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') {
        await dialog.accept(invalidCredentials);
      }
    });
    await page.goto('/practice/login-modal.html');
    await expect(page.locator('#failureContent')).toBeVisible({ timeout: 5000 });
  }

  test('should show authentication prompt on page load', async ({ page }) => {
    // Arrange - Set up dialog handler to capture the prompt
    let dialogMessage = '';
    let dialogType = '';

    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      dialogType = dialog.type();
      await dialog.dismiss();
    });

    // Act - Navigate to modal login page (dialog fires synchronously during goto)
    await page.goto('/practice/login-modal.html');

    // Assert - Verify dialog type and message
    expect(dialogType).toBe('prompt');
    expect(dialogMessage).toContain('credentials');
  });

  test('should display success content after valid login', async ({ page }) => {
    // Arrange - Log in via modal with valid credentials
    await setupValidLogin(page);

    // Assert - Success title should be displayed
    const successTitle = page.locator('.success-title');
    await expect(successTitle).toContainText('Authentication Successful');
  });

  test('should display username after successful modal login', async ({
    page,
  }) => {
    // Arrange - Log in via modal with valid credentials
    await setupValidLogin(page);

    // Assert - Username should be displayed
    const userDisplay = page.locator('#userDisplay');
    await expect(userDisplay).toBeVisible();
    await expect(userDisplay).toContainText('testuser');
  });

  test('should display login timestamp after successful login', async ({
    page,
  }) => {
    // Arrange - Log in via modal with valid credentials
    await setupValidLogin(page);

    // Assert - Login time should be displayed
    const loginTime = page.locator('#loginTime');
    await expect(loginTime).toBeVisible();
    await expect(loginTime).not.toBeEmpty();
  });

  test('should display failure content for invalid credentials', async ({
    page,
  }) => {
    // Arrange - Log in via modal with invalid credentials
    await setupInvalidLogin(page);

    // Assert - Failure title should be displayed
    const failureTitle = page.locator('.failure-title');
    await expect(failureTitle).toContainText('Authentication Failed');
  });

  test('should display failure when prompt is cancelled', async ({ page }) => {
    // Arrange - Set up dialog handler to dismiss prompt
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') {
        await dialog.dismiss();
      }
    });

    // Act - Navigate to modal login page
    await page.goto('/practice/login-modal.html');

    // Assert - Failure content should be visible
    const failureContent = page.locator('#failureContent');
    await expect(failureContent).toBeVisible({ timeout: 5000 });
  });

  test('should show retry button on failed login', async ({ page }) => {
    // Arrange - Log in via modal with invalid credentials
    await setupInvalidLogin(page);

    // Assert - Retry button should be visible
    const retryButton = page.locator('.retry-button');
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toContainText('Try Again');
  });

  test('should allow retry after failed login', async ({ page }) => {
    // Arrange - Set up dialog handler with attempt counter
    let attemptCount = 0;

    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') {
        attemptCount++;
        if (attemptCount === 1) {
          // First attempt: invalid credentials
          await dialog.accept(invalidCredentials);
        } else {
          // Second attempt: valid credentials
          await dialog.accept(validCredentials);
        }
      }
    });

    // Act - Navigate and fail first login
    await page.goto('/practice/login-modal.html');

    // Wait for failure content
    const failureContent = page.locator('#failureContent');
    await expect(failureContent).toBeVisible({ timeout: 5000 });

    // Act - Click retry button
    const retryButton = page.locator('.retry-button');
    await retryButton.click();

    // Assert - Success content should be visible after retry
    const successContent = page.locator('#successContent');
    await expect(successContent).toBeVisible({ timeout: 5000 });
  });

  test('should display session timer after successful login', async ({
    page,
  }) => {
    // Arrange - Log in via modal with valid credentials
    await setupValidLogin(page);

    // Assert - Session timer should be visible
    const sessionTimer = page.locator('#sessionTimer');
    await expect(sessionTimer).toBeVisible();

    const sessionTime = page.locator('#sessionTime');
    await expect(sessionTime).toBeVisible();
  });

  test('should display logout button after successful login', async ({
    page,
  }) => {
    // Arrange - Log in via modal with valid credentials
    await setupValidLogin(page);

    // Assert - Logout button should be visible
    const logoutButton = page.locator('.logout-btn');
    await expect(logoutButton).toBeVisible();
    await expect(logoutButton).toContainText('Logout');
  });

  test('should display real-time clock after successful login', async ({
    page,
  }) => {
    // Arrange - Log in via modal with valid credentials
    await setupValidLogin(page);

    // Assert - Clock should be visible and updating
    const clock = page.locator('#clock');
    await expect(clock).toBeVisible();

    // Get initial time and wait for clock to tick
    const initialTime = await clock.textContent();
    await expect(clock).not.toHaveText(initialTime || '');
  });

  test('should display welcome message with greeting based on time of day', async ({
    page,
  }) => {
    // Arrange - Log in via modal with valid credentials
    await setupValidLogin(page);

    // Assert - Welcome message should contain greeting
    const welcomeMessage = page.locator('#welcomeMessage');
    await expect(welcomeMessage).toBeVisible();

    const messageText = await welcomeMessage.textContent();
    expect(messageText).toMatch(/Good (morning|afternoon|evening)/);
  });

  test('should measure modal login time for metrics', async ({ page }) => {
    // Arrange - Start timer before login
    const startTime = Date.now();

    // Act - Log in via modal with valid credentials
    await setupValidLogin(page);

    const endTime = Date.now();
    const loginTime = endTime - startTime;

    // Log for metrics
    console.log(`Modal login time: ${loginTime}ms`);

    // Assert - Login completed successfully
    expect(loginTime).toBeGreaterThan(0);
  });

  test('should display task list after successful login', async ({ page }) => {
    // Arrange - Log in via modal with valid credentials
    await setupValidLogin(page);

    // Assert - Task list should be visible
    const taskList = page.locator('.task-list');
    await expect(taskList).toBeVisible();

    const taskCount = page.locator('#taskCount');
    await expect(taskCount).toBeVisible();
  });

  test('should display theme switcher after successful login', async ({
    page,
  }) => {
    // Arrange - Log in via modal with valid credentials
    await setupValidLogin(page);

    // Assert - Theme switcher should be visible
    const themeSwitcher = page.locator('.theme-switcher');
    await expect(themeSwitcher).toBeVisible();

    // Assert - Theme buttons should be visible
    const themeButtons = page.locator('.theme-btn');
    await expect(themeButtons.first()).toBeVisible();
  });

  test('should hide status indicator after successful login', async ({
    page,
  }) => {
    // Arrange - Log in via modal with valid credentials
    await setupValidLogin(page);

    // Assert - Status indicator should be hidden
    const status = page.locator('#status');
    await expect(status).not.toBeVisible();
  });
});
