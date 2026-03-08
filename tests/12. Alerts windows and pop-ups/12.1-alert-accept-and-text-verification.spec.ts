import { test, expect, Dialog } from '@playwright/test';

/**
 * Scenario 12.1: Accepting alert and verifying text
 * Page: /practice/alerts-1.html
 * API Endpoint: N/A
 *
 * Technology Comparison:
 * - Cypress: Automatic alert acceptance; cy.on('window:alert') captures text; cy.stub(win, 'alert') in onBeforeLoad enables full control and call verification
 * - Playwright: page.on('dialog') registers async handler; dialog.accept()/dismiss() handle dialog; dialog.type() distinguishes 'alert'/'confirm'/'prompt'
 * - WebdriverIO: browser.isAlertOpen() + browser.getAlertText() + browser.acceptAlert(); try/catch required as GAD uses non-native alerts
 *
 * Metric: Alert handling ease, lines of code, auto-waiting capabilities
 *
 * Framework-specific notes:
 * - page.on('dialog') registers a persistent handler — applies to all subsequent dialogs in the page
 * - Handler must be registered BEFORE the action that triggers the dialog
 * - dialog.type() returns 'alert', 'confirm', 'prompt' or 'beforeunload'
 */
test.describe('12.1 - Alert Accept and Text Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to alerts page
    await page.goto('/practice/alerts-1.html');
  });

  test('should display the alerts page with all buttons', async ({ page }) => {
    // Arrange
    const alertBoxBtn = page.getByTestId('dti-alert-box-btn');
    const alertBtn = page.getByTestId('dti-alert-btn');
    const alertCounterBtn = page.getByTestId('dti-alert-counter-btn');
    const alertRandomFadeBtn = page.getByTestId('dti-alert-random-fade-out-btn');
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');

    // Assert - Verify all buttons are visible
    await expect(alertBoxBtn).toBeVisible();
    await expect(alertBtn).toBeVisible();
    await expect(alertCounterBtn).toBeVisible();
    await expect(alertRandomFadeBtn).toBeVisible();
    await expect(popupModalBtn).toBeVisible();
  });

  test('should accept native alert and verify its text', async ({ page }) => {
    // Arrange
    const alertBoxBtn = page.getByTestId('dti-alert-box-btn');
    let alertMessage = '';

    // Set up dialog handler to capture alert text
    page.on('dialog', async (dialog: Dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // Act - Click button to trigger alert
    await alertBoxBtn.click();

    // Assert - Verify alert message
    expect(alertMessage).toBe('Alert box invoked by button click!');
  });

  test('should trigger custom alert popup and verify text appears in UI', async ({ page }) => {
    // Arrange
    const alertBtn = page.getByTestId('dti-alert-btn');
    const customAlert = page.getByTestId('dti-simple-alert');

    // Act - Click button to trigger custom alert
    await alertBtn.click();

    // Assert - Verify custom alert appears with expected text
    await expect(customAlert).toBeVisible();
    await expect(customAlert).toHaveText('Button clicked!');
  });

  test('should auto-dismiss custom alert after timeout', async ({ page }) => {
    // Arrange
    const alertBtn = page.getByTestId('dti-alert-btn');
    const customAlert = page.getByTestId('dti-simple-alert');

    // Act - Click button to trigger custom alert
    await alertBtn.click();

    // Assert - Alert should be visible initially
    await expect(customAlert).toBeVisible();

    // Assert - Alert should disappear after 3 seconds (with margin)
    await expect(customAlert).toBeHidden({ timeout: 5000 });
  });

  test('should display click counter in alert', async ({ page }) => {
    // Arrange
    const alertCounterBtn = page.getByTestId('dti-alert-counter-btn');
    const counterAlert = page.getByTestId('dti-simple-alert-with-counter');

    // Act - Click button once
    await alertCounterBtn.click();

    // Assert - First click message
    await expect(counterAlert).toBeVisible();
    await expect(counterAlert).toHaveText('Button clicked 1 times');
  });

  test('should increment click counter with multiple clicks', async ({ page }) => {
    // Arrange
    const alertCounterBtn = page.getByTestId('dti-alert-counter-btn');

    // Assert - Third click should show correct count
    const counterAlert = page.getByTestId('dti-simple-alert-with-counter');

    // Act - Click button 3 times, waiting for each alert to dismiss before next click
    await alertCounterBtn.click();
    await expect(counterAlert).toBeHidden({ timeout: 5000 });

    await alertCounterBtn.click();
    await expect(counterAlert).toBeHidden({ timeout: 5000 });

    await alertCounterBtn.click();
    await expect(counterAlert).toBeVisible();
    await expect(counterAlert).toHaveText('Button clicked 3 times');
  });

  test('should trigger random fade out alert', async ({ page }) => {
    // Arrange
    const alertRandomFadeBtn = page.getByTestId('dti-alert-random-fade-out-btn');
    const randomAlert = page.getByTestId('dti-simple-alert-with-counter-and-random-fade-out');

    // Act - Click button
    await alertRandomFadeBtn.click();

    // Assert - Alert should appear with click count
    await expect(randomAlert).toBeVisible();
    await expect(randomAlert).toContainText('1 click(s)!');
  });

  test('should handle multiple rapid alert triggers', async ({ page }) => {
    // Arrange
    const alertRandomFadeBtn = page.getByTestId('dti-alert-random-fade-out-btn');

    // Act - Click button 3 times rapidly
    await alertRandomFadeBtn.click();
    await alertRandomFadeBtn.click();
    await alertRandomFadeBtn.click();

    // Assert - Should have 3 alerts (or the last one visible)
    const alerts = page.getByTestId('dti-simple-alert-with-counter-and-random-fade-out');
    const count = await alerts.count();

    // At least one alert should be visible
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should verify alert appears in designated placeholder', async ({ page }) => {
    // Arrange
    const alertBtn = page.getByTestId('dti-alert-btn');
    const alertsPlaceholder = page.locator('#alerts-placeholder');

    // Act - Click button to trigger alert
    await alertBtn.click();

    // Assert - Alert should appear inside the placeholder
    const alertInPlaceholder = alertsPlaceholder.locator('[data-testid="dti-simple-alert"]');
    await expect(alertInPlaceholder).toBeVisible();
  });

  test('should handle native alert with Playwright dialog event', async ({ page }) => {
    // Arrange
    const alertBoxBtn = page.getByTestId('dti-alert-box-btn');
    let dialogHandled = false;
    let dialogType = '';

    // Set up dialog handler
    page.on('dialog', async (dialog: Dialog) => {
      dialogType = dialog.type();
      dialogHandled = true;
      await dialog.accept();
    });

    // Act - Click button to trigger alert (dialog handler runs synchronously during click)
    await alertBoxBtn.click();

    // Assert - Dialog was handled and was of type 'alert'
    expect(dialogHandled).toBe(true);
    expect(dialogType).toBe('alert');
  });

  test('should measure alert response time for metrics', async ({ page }) => {
    // Arrange
    const alertBtn = page.getByTestId('dti-alert-btn');
    const customAlert = page.getByTestId('dti-simple-alert');

    // Measure execution time
    const startTime = Date.now();

    // Act - Click button and wait for alert
    await alertBtn.click();
    await expect(customAlert).toBeVisible();

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`Custom alert display time: ${executionTime}ms`);

    // Assert - Operation should complete quickly
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(3000);
  });

  test('should verify button text and data-testid attributes', async ({ page }) => {
    // Arrange
    const alertBoxBtn = page.locator('#alert-box-btn');
    const alertBtn = page.locator('#alert-btn');

    // Assert - Verify button text
    await expect(alertBoxBtn).toHaveText('Click me for alert box!');
    await expect(alertBtn).toHaveText('Click me for alert popup!');

    // Assert - Verify data-testid attributes exist
    await expect(alertBoxBtn).toHaveAttribute('data-testid', 'dti-alert-box-btn');
    await expect(alertBtn).toHaveAttribute('data-testid', 'dti-alert-btn');
  });

  test('should handle dialog auto-dismissal with page.on handler', async ({ page }) => {
    // Arrange
    const alertBoxBtn = page.getByTestId('dti-alert-box-btn');
    const acceptedMessages: string[] = [];

    // Set up persistent dialog handler
    page.on('dialog', async (dialog: Dialog) => {
      acceptedMessages.push(dialog.message());
      await dialog.accept();
    });

    // Act - Click button multiple times
    await alertBoxBtn.click();
    await alertBoxBtn.click();
    await alertBoxBtn.click();

    // Assert - All dialogs were handled
    expect(acceptedMessages.length).toBe(3);
    expect(acceptedMessages.every((msg) => msg === 'Alert box invoked by button click!')).toBe(true);
  });

  test('should verify alert styling and CSS classes', async ({ page }) => {
    // Arrange
    const alertBtn = page.getByTestId('dti-alert-btn');

    // Act - Click button to trigger alert
    await alertBtn.click();

    // Assert - Verify alert has expected CSS classes
    const customAlert = page.getByTestId('dti-simple-alert');
    await expect(customAlert).toHaveClass(/simple-alert-on-left-1/);
    await expect(customAlert).toHaveClass(/alert-gad-emoji/);
  });
});
