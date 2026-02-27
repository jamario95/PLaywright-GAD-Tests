import { test, expect, type Page } from '@playwright/test';

/**
 * Scenario 9.3: Switching between iframe and main page
 * Page: /practice/iframe-3.html
 *
 * Technology Comparison:
 * - Cypress: Main page elements accessed with cy.get() directly; iframe via chained contentDocument
 * - Playwright: No explicit switching needed - frameLocator() chains + direct page.locator() for main
 * - WebdriverIO: Requires browser.switchFrame() / browser.switchFrame(null) for each context change
 *
 * Metric: Context switching ease, lines of code per switch
 *
 * Framework-specific notes:
 * - page.locator() and frameLocator() coexist freely — no switching required between main and iframe
 * - getInnerWeatherFrame() returns a FrameLocator synchronously (not async), safe to call per-test
 * - Multiple context switches in one test add zero overhead — locators are independent objects
 */

/**
 * Helper: returns a FrameLocator pointing to the deeply nested weather iframe.
 * Page structure: main page → outer iframe → #weather-iframe
 */
const getInnerWeatherFrame = (page: Page) =>
  page.frameLocator('iframe').frameLocator('#weather-iframe');

test.describe('9.3 - Iframe Context Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to the page with nested iframes
    await page.goto('/practice/iframe-3.html');
  });

  test('should verify main page title outside iframe', async ({ page }) => {
    // Arrange
    const mainPageTitle = page.locator('h2');

    // Act & Assert - Verify main page content
    await expect(mainPageTitle).toContainText('Nested IFrame with Random Weather for City');
  });

  test('should access weather form in deeply nested iframe', async ({ page }) => {
    // Arrange - Access outer iframe then inner iframe via helper
    const innerIframe = getInnerWeatherFrame(page);

    // Act & Assert - Verify weather form elements exist
    const cityDropdown = innerIframe.locator('#city');
    const getWeatherButton = innerIframe.getByTestId('get-weather');

    await expect(cityDropdown).toBeVisible();
    await expect(getWeatherButton).toBeVisible();
  });

  test('should select city and get weather in nested iframe', async ({ page }) => {
    // Arrange
    const innerIframe = getInnerWeatherFrame(page);
    const cityDropdown = innerIframe.locator('#city');
    const daysInput = innerIframe.locator('#futureDays');
    const getWeatherButton = innerIframe.getByTestId('get-weather');
    const resultsContainer = innerIframe.locator('#results-container');

    // Act - Select city and get weather
    await cityDropdown.selectOption('Warsaw');
    await daysInput.fill('3');
    await getWeatherButton.click();

    // Assert - Wait for results to appear (may take time due to API call)
    await expect(resultsContainer).not.toBeEmpty();
  });

  test('should switch context between main page and iframe elements', async ({ page }) => {
    // Arrange - Main page element
    const mainPageTitle = page.locator('h2');

    // Arrange - Iframe elements via helper
    const innerIframe = getInnerWeatherFrame(page);
    const cityDropdown = innerIframe.locator('#city');

    // Act & Assert - Verify main page element
    await expect(mainPageTitle).toBeVisible();
    const mainTitleText = await mainPageTitle.textContent();
    expect(mainTitleText).toContain('Nested IFrame');

    // Act & Assert - Interact with iframe element
    await cityDropdown.selectOption('Berlin');
    await expect(cityDropdown).toHaveValue('Berlin');

    // Act & Assert - Go back to main page element verification (no switching needed)
    await expect(mainPageTitle).toBeVisible();
  });

  test('should verify all available cities in dropdown inside nested iframe', async ({ page }) => {
    // Arrange
    const innerIframe = getInnerWeatherFrame(page);
    const cityDropdown = innerIframe.locator('#city');
    const expectedCities = ['Warsaw', 'Berlin', 'Paris', 'London', 'Madrid', 'Rome', 'Vienna', 'Prague'];

    // Act & Assert - Verify multiple cities are available
    for (const city of expectedCities) {
      const option = cityDropdown.locator(`option[value="${city}"]`);
      await expect(option).toBeAttached();
    }
  });

  test('should interact with main page and iframe alternately', async ({ page }) => {
    // Arrange
    const mainPageHeader = page.locator('header');
    const innerIframe = getInnerWeatherFrame(page);
    const cityDropdown = innerIframe.locator('#city');
    const getWeatherButton = innerIframe.getByTestId('get-weather');

    // Act - Verify main page header is visible
    await expect(mainPageHeader).toBeVisible();

    // Act - Interact with nested iframe
    await cityDropdown.selectOption('Paris');
    await expect(cityDropdown).toHaveValue('Paris');

    // Act - Click weather button in iframe
    await getWeatherButton.click();

    // Act - Verify main page is still accessible (no explicit switch needed)
    await expect(mainPageHeader).toBeVisible();
  });

  test('should validate days input range in nested iframe', async ({ page }) => {
    // Arrange
    const innerIframe = getInnerWeatherFrame(page);
    const daysInput = innerIframe.locator('#futureDays');

    // Act & Assert - Verify input constraints
    await expect(daysInput).toHaveAttribute('min', '1');
    await expect(daysInput).toHaveAttribute('max', '7');

    // Act - Fill valid value
    await daysInput.fill('5');
    await expect(daysInput).toHaveValue('5');
  });

  test('should access business context toggle in nested iframe', async ({ page }) => {
    // Arrange
    const innerIframe = getInnerWeatherFrame(page);
    const toggleButton = innerIframe.locator('.toggleSpoilerButton');
    const businessContext = innerIframe.locator('#businessContext');

    // Assert - Business context should be hidden initially
    await expect(businessContext).toBeHidden();

    // Act - Click toggle button
    await toggleButton.click();

    // Assert - Business context should be visible
    await expect(businessContext).toBeVisible();
  });

  test('should measure context switching time between main page and iframe', async ({ page }) => {
    // Arrange
    const startTime = Date.now();
    const mainPageTitle = page.locator('h2');
    const innerIframe = getInnerWeatherFrame(page);
    const cityDropdown = innerIframe.locator('#city');

    // Act - Multiple context switches (Playwright handles automatically)
    await expect(mainPageTitle).toBeVisible();
    await cityDropdown.selectOption('London');
    await expect(mainPageTitle).toBeVisible();
    await cityDropdown.selectOption('Vienna');
    await expect(mainPageTitle).toBeVisible();

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`Context switching time: ${executionTime}ms`);

    // Assert - All operations completed successfully
    await expect(cityDropdown).toHaveValue('Vienna');
    expect(executionTime).toBeGreaterThan(0);
  });

  test('should demonstrate Playwright automatic iframe handling vs Selenium manual switching', async ({ page }) => {
    // Arrange
    const innerIframe = getInnerWeatherFrame(page);
    const cityDropdown = innerIframe.locator('#city');
    const mainTitle = page.locator('h2');

    // Act - Interact with iframe and main page alternately without any explicit switching
    await cityDropdown.selectOption('Rome');
    await cityDropdown.selectOption('Madrid');

    // Assert - Verify iframe and main page are both accessible
    await expect(cityDropdown).toHaveValue('Madrid');
    await expect(mainTitle).toBeVisible();
    await expect(mainTitle).toContainText('Nested IFrame');
  });

  test('should verify outer iframe contains inner iframe', async ({ page }) => {
    // Arrange - Access only the outer iframe (not inner)
    const outerIframe = page.frameLocator('iframe');

    // Act & Assert - Inner iframe element should exist inside the outer iframe
    const innerIframeElement = outerIframe.locator('#weather-iframe');
    await expect(innerIframeElement).toBeAttached();
  });
});
