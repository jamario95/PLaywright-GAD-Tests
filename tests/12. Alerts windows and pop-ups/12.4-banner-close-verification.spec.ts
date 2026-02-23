import { test, expect, Page } from '@playwright/test';

/**
 * Scenario 12.4: Closing banner and verifying disappearance
 * Page: /practice/banners-v1.html
 * Key metric: Dynamic UI changes
 *
 * Goal: Compare banner/popup closing capabilities across frameworks
 *
 * Page structure:
 * - .ad-overlay (#adOverlay): Full-screen advertisement overlay
 * - .ad-banner (#adBanner): Advertisement banner with countdown timer
 * - #timer (.timer-overlay): 5-second countdown timer
 * - .close-ad: Close button (appears after timer ends)
 * - .action-btn: "See all practice pages" button
 *
 * - .cookie-banner (#cookieBanner): Cookie consent banner at bottom
 * - .accept-btn: "Accept Cookies" button
 * - .decline-btn: "Decline" button
 *
 * - .cookies-menu (#cookiesMenu): Menu to reset cookie states
 *
 * Banner behavior:
 * - Ad overlay: Shows on load (unless adClosed cookie exists)
 *   - 5 second countdown timer
 *   - Close button appears after timer completes
 *   - Clicking close sets adClosed cookie for 1 day
 *
 * - Cookie banner: Shows at bottom (unless cookieConsent cookie exists)
 *   - Accept sets cookieConsent=accepted cookie
 *   - Decline sets cookieConsent=declined cookie
 *
 * Differences between technologies:
 * - Playwright: Native waiting + CSS class assertions, auto-waiting for transitions
 * - Selenium: Explicit waits + manual class checking
 * - Cypress: cy.should() with automatic retries for visibility
 *
 * Metric: Dynamic UI handling, animation waiting, CSS transition detection
 */
test.describe('12.4 - Banner Close and Disappearance Verification', () => {
  //Helper function to close advertisement overlay if visible
  async function closeAdOverlayIfVisible(page: Page): Promise<void> {
    const adOverlay = page.locator('#adOverlay');
    const isAdVisible = await adOverlay.isVisible();

    if (isAdVisible) {
      const timer = page.locator('#timer');
      await expect(timer).toBeHidden({ timeout: 7000 });
      const closeButton = page.locator('.close-ad');
      await closeButton.click();
      await expect(adOverlay).toBeHidden();
    }
  }

  test.beforeEach(async ({ page, context }) => {
    // Clear cookies before each test to ensure fresh state
    await context.clearCookies();

    // Arrange - Navigate to banners page
    await page.goto('/practice/banners-v1.html');
  });

  test('should display advertisement overlay on page load', async ({ page }) => {
    // Arrange
    const adOverlay = page.locator('#adOverlay');
    const adBanner = page.locator('#adBanner');

    // Assert - Ad overlay should be visible
    await expect(adOverlay).toBeVisible();
    await expect(adBanner).toBeVisible();
  });

  test('should display countdown timer in ad banner', async ({ page }) => {
    // Arrange
    const timer = page.locator('#timer');

    // Assert - Timer should show 5 (or less if page loaded slowly)
    await expect(timer).toBeVisible();
    const timerValue = await timer.textContent();
    expect(Number(timerValue)).toBeLessThanOrEqual(5);
    expect(Number(timerValue)).toBeGreaterThanOrEqual(0);
  });

  test('should countdown timer from 5 to 1', async ({ page }) => {
    // Arrange
    const timer = page.locator('#timer');

    // Assert - Timer should start at 5 or less
    await expect(timer).toBeVisible();

    // Wait and verify countdown
    await page.waitForTimeout(1000);
    const valueAfter1s = await timer.textContent();
    expect(Number(valueAfter1s)).toBeLessThanOrEqual(4);

    await page.waitForTimeout(1000);
    const valueAfter2s = await timer.textContent();
    expect(Number(valueAfter2s)).toBeLessThanOrEqual(3);
  });

  test('should show close button after timer completes', async ({ page }) => {
    // Arrange
    const timer = page.locator('#timer');

    // Wait for timer to complete (5 seconds + buffer)
    await expect(timer).toBeHidden({ timeout: 7000 });

    // Assert - Close button should appear
    const closeButton = page.locator('.close-ad');
    await expect(closeButton).toBeVisible();
  });

  test('should close ad overlay when clicking close button', async ({ page }) => {
    // Arrange
    const timer = page.locator('#timer');
    const adOverlay = page.locator('#adOverlay');

    // Wait for timer to complete
    await expect(timer).toBeHidden({ timeout: 7000 });

    // Act - Click close button
    const closeButton = page.locator('.close-ad');
    await closeButton.click();

    // Assert - Ad overlay should be hidden
    await expect(adOverlay).toBeHidden();
  });

  test('should display cookie consent banner at bottom', async ({ page }) => {
    // Arrange
    const cookieBanner = page.locator('#cookieBanner');

    // Assert - Cookie banner should be visible
    await expect(cookieBanner).toBeVisible();
    await expect(cookieBanner).toContainText('This website uses cookies');
  });

  test('should display Accept and Decline buttons in cookie banner', async ({ page }) => {
    // Arrange - Close ad overlay first to see cookie banner buttons
    await closeAdOverlayIfVisible(page);

    const acceptBtn = page.locator('.accept-btn');
    const declineBtn = page.locator('.decline-btn');

    // Assert - Both buttons should be visible
    await expect(acceptBtn).toBeVisible();
    await expect(acceptBtn).toHaveText('Accept Cookies');

    await expect(declineBtn).toBeVisible();
    await expect(declineBtn).toHaveText('Decline');
  });

  test('should hide cookie banner when Accept is clicked', async ({ page }) => {
    // Arrange - Close ad overlay first
    await closeAdOverlayIfVisible(page);

    const cookieBanner = page.locator('#cookieBanner');
    const acceptBtn = page.locator('.accept-btn');

    // Act - Click Accept
    await acceptBtn.click();

    // Assert - Banner should be hidden (has 'hidden' class)
    await expect(cookieBanner).toHaveClass(/hidden/);
  });

  test('should hide cookie banner when Decline is clicked', async ({ page }) => {
    // Arrange - Close ad overlay first
    await closeAdOverlayIfVisible(page);

    const cookieBanner = page.locator('#cookieBanner');
    const declineBtn = page.locator('.decline-btn');

    // Act - Click Decline
    await declineBtn.click();

    // Assert - Banner should be hidden
    await expect(cookieBanner).toHaveClass(/hidden/);
  });

  test('should set cookie when Accept is clicked', async ({ page, context }) => {
    // Arrange - Close ad overlay first
    await closeAdOverlayIfVisible(page);

    const acceptBtn = page.locator('.accept-btn');

    // Act - Click Accept
    await acceptBtn.click();

    // Assert - Cookie should be set
    const cookies = await context.cookies();
    const consentCookie = cookies.find((c) => c.name === 'cookieConsent');

    expect(consentCookie).toBeDefined();
    expect(consentCookie?.value).toBe('accepted');
  });

  test('should set cookie when Decline is clicked', async ({ page, context }) => {
    // Arrange - Close ad overlay first
    await closeAdOverlayIfVisible(page);

    const declineBtn = page.locator('.decline-btn');

    // Act - Click Decline
    await declineBtn.click();

    // Assert - Cookie should be set
    const cookies = await context.cookies();
    const consentCookie = cookies.find((c) => c.name === 'cookieConsent');

    expect(consentCookie).toBeDefined();
    expect(consentCookie?.value).toBe('declined');
  });

  test('should set adClosed cookie when closing ad', async ({ page, context }) => {
    // Arrange
    const timer = page.locator('#timer');

    // Wait for timer to complete
    await expect(timer).toBeHidden({ timeout: 7000 });

    // Act - Close ad
    const closeButton = page.locator('.close-ad');
    await closeButton.click();

    // Assert - Cookie should be set
    const cookies = await context.cookies();
    const adCookie = cookies.find((c) => c.name === 'adClosed');

    expect(adCookie).toBeDefined();
    expect(adCookie?.value).toBe('true');
  });

  test('should remember cookie consent on page reload', async ({ page, context }) => {
    // Arrange - Close ad overlay first
    await closeAdOverlayIfVisible(page);

    const acceptBtn = page.locator('.accept-btn');
    const cookieBanner = page.locator('#cookieBanner');

    // Act - Accept cookies
    await acceptBtn.click();
    await expect(cookieBanner).toHaveClass(/hidden/);

    // Reload page
    await page.reload();

    // Assert - Banner should still be hidden
    await expect(cookieBanner).toHaveClass(/hidden/);
  });

  test('should remember ad closed state on page reload', async ({ page, context }) => {
    // Arrange
    const timer = page.locator('#timer');
    const adOverlay = page.locator('#adOverlay');

    // Wait for timer and close ad
    await expect(timer).toBeHidden({ timeout: 7000 });
    const closeButton = page.locator('.close-ad');
    await closeButton.click();
    await expect(adOverlay).toBeHidden();

    // Reload page
    await page.reload();

    // Assert - Ad overlay should still be hidden
    await expect(adOverlay).toBeHidden();
  });

  test('should display cookies management menu', async ({ page }) => {
    // Arrange
    const cookiesMenu = page.locator('#cookiesMenu');

    // Assert - Menu should be visible
    await expect(cookiesMenu).toBeVisible();
  });

  test('should have clear cookie banner choice button', async ({ page }) => {
    // Arrange
    const clearCookieBannerBtn = page.locator('#cookiesMenu button:has-text("Clear Cookie Banner Choice")');

    // Assert - Button should be visible
    await expect(clearCookieBannerBtn).toBeVisible();
  });

  test('should have clear ad cookie button', async ({ page }) => {
    // Arrange
    const clearAdCookieBtn = page.locator('#cookiesMenu button:has-text("Clear Ad Cookie")');

    // Assert - Button should be visible
    await expect(clearAdCookieBtn).toBeVisible();
  });

  test('should have clear all cookies button', async ({ page }) => {
    // Arrange
    const clearAllCookiesBtn = page.locator('#cookiesMenu button:has-text("Clear All Cookies")');

    // Assert - Button should be visible
    await expect(clearAllCookiesBtn).toBeVisible();
  });

  test('should display ad banner content correctly', async ({ page }) => {
    // Arrange
    const adBanner = page.locator('#adBanner');

    // Assert - Banner should have expected content
    await expect(adBanner.locator('h3')).toHaveText('Special Offer!');
    await expect(adBanner).toContainText('Check out our amazing practice pages!');
    await expect(adBanner).toContainText("Limited time offer! Don't miss out chance to practice!");
  });

  test('should have action button in ad banner', async ({ page }) => {
    // Arrange
    const actionBtn = page.locator('#adBanner .action-btn');

    // Assert - Action button should be visible
    await expect(actionBtn).toBeVisible();
    await expect(actionBtn).toContainText('See all practice pages');
  });

  test('should verify cookie banner uses CSS transition for hiding', async ({ page }) => {
    // Arrange
    const cookieBanner = page.locator('#cookieBanner');

    // Assert - Banner should have transition CSS property
    const transition = await cookieBanner.evaluate((el) => getComputedStyle(el).transition);
    expect(transition).toContain('0.3s');
  });

  test('should verify ad overlay has fadeIn animation', async ({ page }) => {
    // Arrange
    const adOverlay = page.locator('#adOverlay');

    // Assert - Overlay should have animation
    const animation = await adOverlay.evaluate((el) => getComputedStyle(el).animation);
    expect(animation).toContain('fadeIn');
  });

  test('should verify ad banner has slideUp animation', async ({ page }) => {
    // Arrange
    const adBanner = page.locator('#adBanner');

    // Assert - Banner should have animation
    const animation = await adBanner.evaluate((el) => getComputedStyle(el).animation);
    expect(animation).toContain('slideUp');
  });

  test('should measure banner close time for metrics', async ({ page }) => {
    // Arrange
    const timer = page.locator('#timer');
    const adOverlay = page.locator('#adOverlay');

    // Wait for timer to complete
    await expect(timer).toBeHidden({ timeout: 7000 });

    // Measure close time
    const startTime = Date.now();

    const closeButton = page.locator('.close-ad');
    await closeButton.click();
    await expect(adOverlay).toBeHidden();

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`Ad banner close time: ${executionTime}ms`);

    // Assert - Close should be fast
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(2000);
  });

  test('should measure cookie banner acceptance time for metrics', async ({ page }) => {
    // Arrange - Close ad overlay first
    await closeAdOverlayIfVisible(page);

    const acceptBtn = page.locator('.accept-btn');
    const cookieBanner = page.locator('#cookieBanner');

    // Measure acceptance time
    const startTime = Date.now();

    await acceptBtn.click();
    await expect(cookieBanner).toHaveClass(/hidden/);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`Cookie banner acceptance time: ${executionTime}ms`);

    // Assert - Acceptance should be fast
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(2000);
  });

  test('should handle full workflow: wait for timer, close ad, accept cookies', async ({ page, context }) => {
    // Arrange
    const timer = page.locator('#timer');
    const adOverlay = page.locator('#adOverlay');
    const cookieBanner = page.locator('#cookieBanner');

    // Act - Wait for timer and close ad
    await expect(timer).toBeHidden({ timeout: 7000 });
    const closeButton = page.locator('.close-ad');
    await closeButton.click();

    // Assert - Ad should be closed
    await expect(adOverlay).toBeHidden();

    // Act - Accept cookies
    const acceptBtn = page.locator('.accept-btn');
    await acceptBtn.click();

    // Assert - Cookie banner should be hidden
    await expect(cookieBanner).toHaveClass(/hidden/);

    // Assert - Both cookies should be set
    const cookies = await context.cookies();
    const adCookie = cookies.find((c) => c.name === 'adClosed');
    const consentCookie = cookies.find((c) => c.name === 'cookieConsent');

    expect(adCookie).toBeDefined();
    expect(consentCookie).toBeDefined();
    expect(consentCookie?.value).toBe('accepted');
  });

  test('should verify unique visitor cookie is set after accepting cookies and closing ad', async ({
    page,
    context,
  }) => {
    // Arrange
    const timer = page.locator('#timer');

    // Wait for timer and close ad
    await expect(timer).toBeHidden({ timeout: 7000 });
    const closeButton = page.locator('.close-ad');
    await closeButton.click();

    // Accept cookies
    const acceptBtn = page.locator('.accept-btn');
    await acceptBtn.click();

    // Assert - Unique visitor cookie should be set with expected value
    await expect
      .poll(
        async () => {
          const cookies = await context.cookies();
          return cookies.find((c) => c.name === 'uniqueVisitor')?.value ?? null;
        },
        { timeout: 5000 },
      )
      .toMatch(/^temp_/);
  });

  test('should use getByRole selectors for accessibility', async ({ page }) => {
    // Arrange - Close ad overlay first
    await closeAdOverlayIfVisible(page);

    // Use accessible role-based selectors
    const acceptBtn = page.getByRole('button', { name: 'Accept Cookies' });
    const declineBtn = page.getByRole('button', { name: 'Decline' });

    // Assert - Buttons should be accessible by role
    await expect(acceptBtn).toBeVisible();
    await expect(declineBtn).toBeVisible();

    // Act - Click Accept using role selector
    await acceptBtn.click();

    // Assert - Banner should be hidden
    const cookieBanner = page.locator('#cookieBanner');
    await expect(cookieBanner).toHaveClass(/hidden/);
  });
});
