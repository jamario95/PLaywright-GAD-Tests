import { test, expect } from '@playwright/test';

/**
 * Scenario 4.2: Email validation (invalid format) → verify error
 * Page: /practice/fancy-registration.html
 * Key metric: Ease of assertions
 *
 * Goal: Compare form validation handling for email format
 *
 * Page structure:
 * - Full Name (fullName input)
 * - Email Address (email input)
 * - Password (password input)
 * - Confirm Password (confirmPassword input)
 * - Validation messages are dynamically created via JavaScript
 * - Validation icon shows checkmark when valid (#emailValidIcon)
 *
 * Differences between technologies:
 * - Playwright: page.fill(), native validation support, toHaveAttribute for HTML5 validation
 * - Selenium: sendKeys(), getAttribute() for validation state
 * - Cypress: cy.type(), should('have.attr') for validation
 */
test.describe('4.2 - Email Format Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to the fancy registration page
    await page.goto('/practice/fancy-registration.html');
  });

  test('should display validation error for invalid email format without @ symbol', async ({ page }) => {
    // Arrange
    const emailInput = page.locator('#email');
    const emailValidIcon = page.locator('#emailValidIcon');

    // Act - Enter email without @ symbol and blur to trigger validation
    await emailInput.fill('invalidemail.com');
    await emailInput.blur();

    // Assert - Validation icon should not have 'valid' class (only 'validation-icon')
    // Note: Class contains 'validation-icon' by default, 'valid' is added for valid emails
    await expect(emailValidIcon).not.toHaveClass(/\bvalid\b/);
  });

  test('should display validation error for email without domain', async ({ page }) => {
    // Arrange
    const emailInput = page.locator('#email');
    const emailValidIcon = page.locator('#emailValidIcon');

    // Act - Enter email without domain
    await emailInput.fill('user@');
    await emailInput.blur();

    // Assert - Validation icon should not have 'valid' class
    await expect(emailValidIcon).not.toHaveClass(/\bvalid\b/);
  });

  test('should display validation error for email without username', async ({ page }) => {
    // Arrange
    const emailInput = page.locator('#email');
    const emailValidIcon = page.locator('#emailValidIcon');

    // Act - Enter email without username part
    await emailInput.fill('@domain.com');
    await emailInput.blur();

    // Assert - Validation icon should not have 'valid' class
    await expect(emailValidIcon).not.toHaveClass(/\bvalid\b/);
  });

  test('should display validation error for email with spaces', async ({ page }) => {
    // Arrange
    const emailInput = page.locator('#email');
    const emailValidIcon = page.locator('#emailValidIcon');

    // Act - Enter email with spaces
    await emailInput.fill('user name@domain.com');
    await emailInput.blur();

    // Assert - Validation icon should not have 'valid' class
    await expect(emailValidIcon).not.toHaveClass(/\bvalid\b/);
  });

  test('should show valid state for valid email format', async ({ page }) => {
    // Arrange
    const emailInput = page.locator('#email');
    const emailValidIcon = page.locator('#emailValidIcon');

    // Act - Enter valid email
    await emailInput.fill('john.doe@example.com');
    await emailInput.blur();

    // Assert - Validation icon should have 'valid' class (green checkmark)
    await expect(emailValidIcon).toHaveClass(/\bvalid\b/);
  });

  test('should accept email with subdomain', async ({ page }) => {
    // Arrange
    const emailInput = page.locator('#email');
    const emailValidIcon = page.locator('#emailValidIcon');

    // Act - Enter email with subdomain
    await emailInput.fill('user@mail.subdomain.domain.com');
    await emailInput.blur();

    // Assert - Email should be valid
    await expect(emailValidIcon).toHaveClass(/\bvalid\b/);
  });

  test('should accept email with plus sign', async ({ page }) => {
    // Arrange
    const emailInput = page.locator('#email');
    const emailValidIcon = page.locator('#emailValidIcon');

    // Act - Enter email with plus sign (common for email aliases)
    await emailInput.fill('user+alias@example.com');
    await emailInput.blur();

    // Assert - Email should be valid
    await expect(emailValidIcon).toHaveClass(/\bvalid\b/);
  });

  test('should not show valid icon for empty email field', async ({ page }) => {
    // Arrange
    const emailInput = page.locator('#email');
    const emailValidIcon = page.locator('#emailValidIcon');

    // Act - Focus and blur without entering anything
    await emailInput.focus();
    await emailInput.blur();

    // Assert - Validation icon should not have 'valid' class for empty field
    await expect(emailValidIcon).not.toHaveClass(/\bvalid\b/);
  });

  test('should update validation state when email is corrected', async ({ page }) => {
    // Arrange
    const emailInput = page.locator('#email');
    const emailValidIcon = page.locator('#emailValidIcon');

    // Act - First enter invalid email
    await emailInput.fill('invalid');
    await emailInput.blur();
    await expect(emailValidIcon).not.toHaveClass(/\bvalid\b/);

    // Act - Then clear and enter valid email
    await emailInput.clear();
    await emailInput.fill('valid@email.com');
    await emailInput.blur();

    // Assert - Validation should now show valid
    await expect(emailValidIcon).toHaveClass(/\bvalid\b/);
  });

  test('should complete registration form with valid email', async ({ page }) => {
    // Arrange
    const fullNameInput = page.locator('#fullName');
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const confirmPasswordInput = page.locator('#confirmPassword');
    const registerButton = page.getByRole('button', { name: 'Register' });
    const nameValidIcon = page.locator('#nameValidIcon');
    const emailValidIcon = page.locator('#emailValidIcon');
    const confirmValidIcon = page.locator('#confirmValidIcon');

    // Act - Fill all required fields with valid data
    await fullNameInput.fill('John Doe');
    await emailInput.fill('john.doe@example.com');
    await passwordInput.fill('SecurePassword123!');
    await confirmPasswordInput.fill('SecurePassword123!');
    await registerButton.click();

    // Assert - Check that all validation icons have 'valid' class
    await expect(nameValidIcon).toHaveClass(/\bvalid\b/);
    await expect(emailValidIcon).toHaveClass(/\bvalid\b/);
    await expect(confirmValidIcon).toHaveClass(/\bvalid\b/);
  });

  test('should validate email in real-time as user types', async ({ page }) => {
    // Arrange
    const emailInput = page.locator('#email');
    const emailValidIcon = page.locator('#emailValidIcon');

    // Act & Assert - Type valid email character by character and check validation
    await emailInput.fill('test');
    await expect(emailValidIcon).not.toHaveClass(/\bvalid\b/);

    await emailInput.fill('test@');
    await expect(emailValidIcon).not.toHaveClass(/\bvalid\b/);

    await emailInput.fill('test@domain');
    await expect(emailValidIcon).not.toHaveClass(/\bvalid\b/);

    await emailInput.fill('test@domain.com');
    await expect(emailValidIcon).toHaveClass(/\bvalid\b/);
  });

  test('should use HTML5 email type validation', async ({ page }) => {
    // Arrange
    const emailInput = page.locator('#email');

    // Act
    // (No action needed - verifying initial HTML attributes)

    // Assert - Verify the input has type="email" for browser-level validation
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required', '');
  });
});
