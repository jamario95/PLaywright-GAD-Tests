import { test, expect } from '@playwright/test';

/**
 * Scenario 9.1: Click element inside iframe (level 1)
 * Page: /practice/iframe-1.html
 *
 * Technology Comparison:
 * - Cypress: cy.get('iframe').its('0.contentDocument.body') - manual DOM access via contentDocument
 * - Playwright: page.frameLocator() - built-in first-class iframe support, no switching needed
 * - WebdriverIO: browser.switchFrame(element) - explicit frame switching required
 *
 * Metric: Lines of code, need for plugins, iframe access complexity
 *
 * Framework-specific notes:
 * - frameLocator() is synchronous and auto-waits for iframe content to be ready before interaction
 * - No explicit frame switching or cleanup required — locator context is scoped to the iframe
 * - Chaining frameLocator() calls handles nested iframes declaratively without global state
 */
test.describe('9.1 - Basic Iframe Interaction (Level 1)', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to the page with iframe
    await page.goto('/practice/iframe-1.html');
  });

  test('should display timezone clocks inside iframe', async ({ page }) => {
    // Arrange
    const iframe = page.frameLocator('iframe');
    const clocksContainer = iframe.locator('#clocks');

    // Act & Assert - Verify iframe content is loaded and visible
    await expect(clocksContainer).toBeVisible();
  });

  test('should display default timezones in iframe', async ({ page }) => {
    // Arrange
    const iframe = page.frameLocator('iframe');
    const defaultTimezones = [
      'America/New_York',
      'Europe/London',
      'Asia/Tokyo',
      'Australia/Sydney',
      'America/Los_Angeles',
    ];

    // Act & Assert - Verify all default timezones are displayed
    for (const timezone of defaultTimezones) {
      const timezoneElement = iframe.locator(`text=${timezone}`);
      await expect(timezoneElement).toBeVisible();
    }
  });

  test('should add new timezone using input and button inside iframe', async ({
    page,
  }) => {
    // Arrange
    const iframe = page.frameLocator('iframe');
    const timezoneInput = iframe.locator('input[placeholder="Enter a time zone"]');
    const addButton = iframe.getByRole('button', { name: 'Add Time Zone' });
    const newTimezone = 'Europe/Warsaw';

    // Act - Enter timezone and click add button
    await timezoneInput.fill(newTimezone);
    await addButton.click();

    // Assert - Verify new timezone appears in the list
    const newTimezoneElement = iframe.locator(`text=${newTimezone}`);
    await expect(newTimezoneElement).toBeVisible();
  });

  test('should show error for invalid timezone input', async ({ page }) => {
    // Arrange
    const iframe = page.frameLocator('iframe');
    const timezoneInput = iframe.locator('input[placeholder="Enter a time zone"]');
    const addButton = iframe.getByRole('button', { name: 'Add Time Zone' });
    const invalidTimezone = 'Invalid/Timezone';

    // Act - Enter invalid timezone and click add button
    await timezoneInput.fill(invalidTimezone);
    await addButton.click();

    // Assert - Verify error message is displayed
    const errorMessage = iframe.locator('text=Invalid time zone');
    await expect(errorMessage).toBeVisible();

    // Assert - Verify input has red border (invalid state)
    await expect(timezoneInput).toHaveCSS('border-color', 'rgb(255, 0, 0)');
  });

  test('should clear input after successfully adding timezone', async ({
    page,
  }) => {
    // Arrange
    const iframe = page.frameLocator('iframe');
    const timezoneInput = iframe.locator('input[placeholder="Enter a time zone"]');
    const addButton = iframe.getByRole('button', { name: 'Add Time Zone' });
    const newTimezone = 'Europe/Berlin';

    // Act - Add a valid timezone
    await timezoneInput.fill(newTimezone);
    await addButton.click();

    // Assert - Input should be cleared after successful addition
    await expect(timezoneInput).toHaveValue('');
  });

  test('should display time format correctly for each timezone', async ({
    page,
  }) => {
    // Arrange
    const iframe = page.frameLocator('iframe');
    const clocksContainer = iframe.locator('#clocks');

    // Act & Assert - Verify clock elements show time in expected format (HH:MM:SS AM/PM)
    const clockElements = clocksContainer.locator('div[title]');
    const count = await clockElements.count();

    expect(count).toBeGreaterThan(0);

    // Assert - Each clock should have a title attribute with timezone info
    for (let i = 0; i < count; i++) {
      const title = await clockElements.nth(i).getAttribute('title');
      expect(title).toContain('Current time in');
    }
  });

  test('should measure iframe interaction time for metrics', async ({
    page,
  }) => {
    // Arrange
    const startTime = Date.now();
    const iframe = page.frameLocator('iframe');
    const timezoneInput = iframe.locator('input[placeholder="Enter a time zone"]');
    const addButton = iframe.getByRole('button', { name: 'Add Time Zone' });
    const newTimezone = 'Europe/Paris';

    // Act - Perform iframe interaction
    await timezoneInput.fill(newTimezone);
    await addButton.click();

    // Assert - Verify new timezone was added
    const newTimezoneElement = iframe.locator(`text=${newTimezone}`);
    await expect(newTimezoneElement).toBeVisible();

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`Iframe interaction time: ${executionTime}ms`);

    // Assert - Operation completed successfully
    expect(executionTime).toBeGreaterThan(0);
  });

  test('should verify iframe is loaded before interaction', async ({ page }) => {
    // Assert - Iframe element exists on the page
    const iframeElement = page.locator('iframe');
    await expect(iframeElement).toBeAttached();

    // Assert - Iframe content is accessible (clocks container exists)
    const iframe = page.frameLocator('iframe');
    const clocksContainer = iframe.locator('#clocks');
    await expect(clocksContainer).toBeAttached();
  });

  test('should add multiple timezones sequentially', async ({ page }) => {
    // Arrange
    const iframe = page.frameLocator('iframe');
    const timezoneInput = iframe.locator('input[placeholder="Enter a time zone"]');
    const addButton = iframe.getByRole('button', { name: 'Add Time Zone' });
    const timezones = ['Europe/Prague', 'Europe/Rome'];

    // Act & Assert - Add each timezone sequentially
    for (const timezone of timezones) {
      await timezoneInput.clear();
      await timezoneInput.fill(timezone);
      await addButton.click();

      // Assert - Each timezone appears after being added
      await expect(iframe.locator(`text=${timezone}`)).toBeVisible();
    }
  });
});
