import { test, expect } from '@playwright/test';

/**
 * Scenario 4.1: Required field validation (empty field) → verify error message
 * Page: /practice/form-v1.html
 * Key metric: Validation stability
 *
 * Goal: Compare form validation handling and error message assertions
 *
 * Differences between technologies:
 * - Playwright: page.fill(), native validation support, auto-waiting
 * - Selenium: setValue(), waitForDisplayed() for validation messages
 * - Cypress: cy.type(), automatic retry for assertions
 */
test.describe('4.1 - Required Field Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to the form page
    await page.goto('/practice/form-v1.html');
  });

  test('should display error message when Name field is empty', async ({ page }) => {
    // Arrange
    const emailInput = page.getByRole('textbox', { name: 'Email:' });
    const nextButton = page.getByRole('button', { name: 'Next' });
    const alertsPlaceholder = page.locator('#alerts-placeholder');
    const nameInput = page.getByRole('textbox', { name: 'Name:' });

    // Act - Fill only email, leave name empty and try to proceed
    await emailInput.fill('test@example.com');
    await nextButton.click();

    // Assert - Error message should be displayed
    await expect(alertsPlaceholder).toBeVisible();
    await expect(alertsPlaceholder).toContainText('Missing fields: name');
    // Verify we're still on Step 1
    await expect(nameInput).toBeVisible();
  });

  test('should display error message when Email field is empty', async ({ page }) => {
    // Arrange
    const nameInput = page.getByRole('textbox', { name: 'Name:' });
    const nextButton = page.getByRole('button', { name: 'Next' });
    const alertsPlaceholder = page.locator('#alerts-placeholder');

    // Act - Fill only name, leave email empty and try to proceed
    await nameInput.fill('John Doe');
    await nextButton.click();

    // Assert - Error message should be displayed
    await expect(alertsPlaceholder).toBeVisible();
    await expect(alertsPlaceholder).toContainText('Please enter a valid email address');
    // Verify we're still on Step 1
    await expect(nameInput).toBeVisible();
  });

  test('should display error message when all required fields are empty', async ({ page }) => {
    // Arrange
    const nextButton = page.getByRole('button', { name: 'Next' });
    const alertsPlaceholder = page.locator('#alerts-placeholder');
    const nameInput = page.getByRole('textbox', { name: 'Name:' });

    // Act - Try to proceed without filling any fields
    await nextButton.click();

    // Assert - Error message should be displayed
    await expect(alertsPlaceholder).toBeVisible();
    // Verify we're still on Step 1
    await expect(nameInput).toBeVisible();
  });

  test('should allow proceeding when required fields are filled', async ({ page }) => {
    // Arrange
    const nameInput = page.getByRole('textbox', { name: 'Name:' });
    const emailInput = page.getByRole('textbox', { name: 'Email:' });
    const nextButton = page.getByRole('button', { name: 'Next' });
    const favoriteFoodInput = page.getByRole('textbox', { name: 'Favorite Food:' });

    // Act - Fill all required fields and proceed
    await nameInput.fill('John Doe');
    await emailInput.fill('john@example.com');
    await nextButton.click();

    // Assert - Should proceed to Step 2
    await expect(favoriteFoodInput).toBeVisible();
    await expect(nameInput).not.toBeVisible();
  });

  test('should display inline validation error for invalid email format', async ({ page }) => {
    // Arrange
    const emailInput = page.getByRole('textbox', { name: 'Email:' });
    const emailError = page.locator('#emailError');

    // Act - Enter invalid email format
    await emailInput.fill('invalid-email-format');

    // Assert - Inline validation error should appear
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText('Please enter a valid email address');
  });

  test('should clear inline validation error when valid email is entered', async ({ page }) => {
    // Arrange
    const emailInput = page.getByRole('textbox', { name: 'Email:' });
    const emailError = page.locator('#emailError');

    // Act - Enter invalid email first
    await emailInput.fill('invalid-email');
    await expect(emailError).toBeVisible();

    // Act - Clear and enter valid email
    await emailInput.clear();
    await emailInput.fill('valid@email.com');

    // Assert - Inline validation error should disappear
    await expect(emailError).not.toBeVisible();
  });

  test('should validate required fields on Step 3 (Country and City)', async ({ page }) => {
    // Arrange - Navigate to Step 3
    const nameInput = page.getByRole('textbox', { name: 'Name:' });
    const emailInput = page.getByRole('textbox', { name: 'Email:' });
    const nextButton = page.getByRole('button', { name: 'Next' });
    const countrySelect = page.getByLabel('Country:');
    const alertsPlaceholder = page.locator('#alerts-placeholder');

    // Act - Fill Steps 1-2 and navigate to Step 3
    await nameInput.fill('John Doe');
    await emailInput.fill('john@example.com');
    await nextButton.click(); // Go to Step 2
    await nextButton.click(); // Go to Step 3 (Step 2 is optional)

    // Act - Try to proceed without selecting Country and City
    await nextButton.click();

    // Assert - Error message should be displayed
    await expect(alertsPlaceholder).toBeVisible();
    await expect(alertsPlaceholder).toContainText('Missing fields: country, city');
    // Verify we're still on Step 3
    await expect(countrySelect).toBeVisible();
  });

  test('should validate required field on Step 4 (Years of Experience)', async ({ page }) => {
    // Arrange - Navigate to Step 4
    const nameInput = page.getByRole('textbox', { name: 'Name:' });
    const emailInput = page.getByRole('textbox', { name: 'Email:' });
    const nextButton = page.getByRole('button', { name: 'Next' });
    const countrySelect = page.getByLabel('Country:');
    const citySelect = page.getByLabel('City:');
    const jobTitleInput = page.getByRole('textbox', { name: 'Job Title:' });
    const experienceInput = page.getByRole('spinbutton', { name: 'Years of Experience:' });
    const alertsPlaceholder = page.locator('#alerts-placeholder');

    // Act - Navigate through Steps 1-3
    await nameInput.fill('John Doe');
    await emailInput.fill('john@example.com');
    await nextButton.click(); // Go to Step 2
    await nextButton.click(); // Go to Step 3
    await countrySelect.selectOption('poland');
    await citySelect.selectOption('warsaw');
    await nextButton.click(); // Go to Step 4

    // Act - Fill only Job Title, leave Experience empty
    await jobTitleInput.fill('Developer');
    await nextButton.click();

    // Assert - Error message should be displayed
    await expect(alertsPlaceholder).toBeVisible();
    await expect(alertsPlaceholder).toContainText('Missing fields: yearsExperience');
    // Verify we're still on Step 4
    await expect(experienceInput).toBeVisible();
  });
});
