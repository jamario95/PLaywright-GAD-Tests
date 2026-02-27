import { test, expect } from '@playwright/test';

/**
 * Scenario 4.3: Multi-step form - going through steps with validation
 * Page: /practice/form-v1.html
 * Key metric: Execution time
 *
 * Goal: Compare multi-step form navigation and validation handling
 *
 * Note: This page has 6 steps (not 3 as in original documentation):
 * Step 1: Name, Email (required)
 * Step 2: Favorite Food (optional)
 * Step 3: Country, City (required)
 * Step 4: Job Title, Years of Experience (required)
 * Step 5: Hobbies, Interests (optional)
 * Step 6: Summary and Confirmation
 *
 * Differences between technologies:
 * - Playwright: page.fill(), page.click(), auto-waiting between steps
 * - Selenium: setValue(), click(), waitForDisplayed() required before each step; selectByAttribute() for dropdowns
 * - Cypress: cy.type(), cy.click(), automatic retry
 */

// Test data constants
const TEST_DATA = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  favoriteFood: 'Pizza',
  country: 'poland',
  city: 'warsaw',
  jobTitle: 'Software Engineer',
  experience: '5',
  hobbies: 'Reading, Gaming',
  interests: 'Technology, Science',
};

test.describe('4.3 - Multi-Step Form Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to the multi-step form page
    await page.goto('/practice/form-v1.html');
  });

  test('should complete all steps successfully and display summary', async ({ page }) => {
    // Arrange - Define all locators
    const nameInput = page.getByRole('textbox', { name: 'Name:' });
    const emailInput = page.getByRole('textbox', { name: 'Email:' });
    const nextButton = page.getByRole('button', { name: 'Next' });
    const favoriteFoodInput = page.getByRole('textbox', { name: 'Favorite Food:' });
    const countrySelect = page.getByLabel('Country:');
    const citySelect = page.getByLabel('City:');
    const jobTitleInput = page.getByRole('textbox', { name: 'Job Title:' });
    const experienceInput = page.getByRole('spinbutton', { name: 'Years of Experience:' });
    const hobbiesInput = page.getByRole('textbox', { name: 'Hobbies:' });
    const interestsInput = page.getByRole('textbox', { name: 'Interests:' });
    const confirmCheckbox = page.getByRole('checkbox', { name: 'I confirm the information is' });
    const submitButton = page.getByRole('button', { name: 'Submit' });
    const summary = page.locator('#summary');

    // Act - Step 1: Fill personal information
    await nameInput.fill(TEST_DATA.name);
    await emailInput.fill(TEST_DATA.email);
    await nextButton.click();

    // Act - Step 2: Fill favorite food (optional)
    await favoriteFoodInput.fill(TEST_DATA.favoriteFood);
    await nextButton.click();

    // Act - Step 3: Fill location
    await countrySelect.selectOption(TEST_DATA.country);
    await citySelect.selectOption(TEST_DATA.city);
    await nextButton.click();

    // Act - Step 4: Fill job information
    await jobTitleInput.fill(TEST_DATA.jobTitle);
    await experienceInput.fill(TEST_DATA.experience);
    await nextButton.click();

    // Act - Step 5: Fill hobbies and interests (optional)
    await hobbiesInput.fill(TEST_DATA.hobbies);
    await interestsInput.fill(TEST_DATA.interests);
    await nextButton.click();

    // Act - Step 6: Confirm and submit
    await confirmCheckbox.check();
    await submitButton.click();

    // Assert - Summary should display all entered data
    await expect(summary).toBeVisible();
    await expect(summary).toContainText(TEST_DATA.name);
    await expect(summary).toContainText(TEST_DATA.email);
    await expect(summary).toContainText(TEST_DATA.favoriteFood);
    await expect(summary).toContainText(TEST_DATA.country);
    await expect(summary).toContainText(TEST_DATA.city);
    await expect(summary).toContainText(TEST_DATA.jobTitle);
    await expect(summary).toContainText(TEST_DATA.experience);
  });

  test('should complete form with only required fields', async ({ page }) => {
    // Arrange - Define locators
    const nameInput = page.getByRole('textbox', { name: 'Name:' });
    const emailInput = page.getByRole('textbox', { name: 'Email:' });
    const nextButton = page.getByRole('button', { name: 'Next' });
    const countrySelect = page.getByLabel('Country:');
    const citySelect = page.getByLabel('City:');
    const jobTitleInput = page.getByRole('textbox', { name: 'Job Title:' });
    const experienceInput = page.getByRole('spinbutton', { name: 'Years of Experience:' });
    const confirmCheckbox = page.getByRole('checkbox', { name: 'I confirm the information is' });
    const submitButton = page.getByRole('button', { name: 'Submit' });
    const summary = page.locator('#summary');

    // Act - Step 1: Fill required fields
    await nameInput.fill(TEST_DATA.name);
    await emailInput.fill(TEST_DATA.email);
    await nextButton.click();

    // Act - Step 2: Skip optional field
    await nextButton.click();

    // Act - Step 3: Fill required location fields
    await countrySelect.selectOption(TEST_DATA.country);
    await citySelect.selectOption(TEST_DATA.city);
    await nextButton.click();

    // Act - Step 4: Fill required job fields
    await jobTitleInput.fill(TEST_DATA.jobTitle);
    await experienceInput.fill(TEST_DATA.experience);
    await nextButton.click();

    // Act - Step 5: Skip optional fields
    await nextButton.click();

    // Act - Step 6: Confirm and submit
    await confirmCheckbox.check();
    await submitButton.click();

    // Assert - Summary should show [NOT SET] for optional fields
    await expect(summary).toBeVisible();
    await expect(summary).toContainText('[NOT SET]');
  });

  test('should not proceed from Step 1 without required fields', async ({ page }) => {
    // Arrange
    const nextButton = page.getByRole('button', { name: 'Next' });
    const nameInput = page.getByRole('textbox', { name: 'Name:' });
    const alertsPlaceholder = page.locator('#alerts-placeholder');

    // Act - Try to proceed without filling any fields
    await nextButton.click();

    // Assert - Should remain on Step 1 with error message
    await expect(alertsPlaceholder).toBeVisible();
    await expect(nameInput).toBeVisible();
  });

  test('should not proceed from Step 3 without Country selection', async ({ page }) => {
    // Arrange - Navigate to Step 3
    const nameInput = page.getByRole('textbox', { name: 'Name:' });
    const emailInput = page.getByRole('textbox', { name: 'Email:' });
    const nextButton = page.getByRole('button', { name: 'Next' });
    const countrySelect = page.getByLabel('Country:');
    const alertsPlaceholder = page.locator('#alerts-placeholder');

    // Act - Complete Steps 1-2
    await nameInput.fill(TEST_DATA.name);
    await emailInput.fill(TEST_DATA.email);
    await nextButton.click(); // Go to Step 2
    await nextButton.click(); // Go to Step 3 (skip optional)

    // Act - Try to proceed without selecting Country
    await nextButton.click();

    // Assert - Should remain on Step 3 with error
    await expect(alertsPlaceholder).toContainText('Missing fields');
    await expect(countrySelect).toBeVisible();
  });

  test('should not proceed from Step 4 without Job Title', async ({ page }) => {
    // Arrange - Navigate to Step 4
    const nameInput = page.getByRole('textbox', { name: 'Name:' });
    const emailInput = page.getByRole('textbox', { name: 'Email:' });
    const nextButton = page.getByRole('button', { name: 'Next' });
    const countrySelect = page.getByLabel('Country:');
    const citySelect = page.getByLabel('City:');
    const experienceInput = page.getByRole('spinbutton', { name: 'Years of Experience:' });
    const jobTitleInput = page.getByRole('textbox', { name: 'Job Title:' });
    const alertsPlaceholder = page.locator('#alerts-placeholder');

    // Act - Navigate through Steps 1-3
    await nameInput.fill(TEST_DATA.name);
    await emailInput.fill(TEST_DATA.email);
    await nextButton.click(); // Go to Step 2
    await nextButton.click(); // Go to Step 3
    await countrySelect.selectOption(TEST_DATA.country);
    await citySelect.selectOption(TEST_DATA.city);
    await nextButton.click(); // Go to Step 4

    // Act - Fill only experience, skip Job Title
    await experienceInput.fill(TEST_DATA.experience);
    await nextButton.click();

    // Assert - Should remain on Step 4 with error
    await expect(alertsPlaceholder).toContainText('Missing fields');
    await expect(jobTitleInput).toBeVisible();
  });

  test('should navigate back using Previous button', async ({ page }) => {
    // Arrange
    const nameInput = page.getByRole('textbox', { name: 'Name:' });
    const emailInput = page.getByRole('textbox', { name: 'Email:' });
    const nextButton = page.getByRole('button', { name: 'Next' });
    const previousButton = page.getByRole('button', { name: 'Previous' });
    const favoriteFoodInput = page.getByRole('textbox', { name: 'Favorite Food:' });

    // Act - Complete Step 1 and go to Step 2
    await nameInput.fill(TEST_DATA.name);
    await emailInput.fill(TEST_DATA.email);
    await nextButton.click();

    // Assert - On Step 2
    await expect(favoriteFoodInput).toBeVisible();

    // Act - Go back to Step 1
    await previousButton.click();

    // Assert - Back on Step 1 with data preserved
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue(TEST_DATA.name);
    await expect(emailInput).toHaveValue(TEST_DATA.email);
  });

  test('should preserve entered data when navigating between steps', async ({ page }) => {
    // Arrange
    const nameInput = page.getByRole('textbox', { name: 'Name:' });
    const emailInput = page.getByRole('textbox', { name: 'Email:' });
    const nextButton = page.getByRole('button', { name: 'Next' });
    const previousButton = page.getByRole('button', { name: 'Previous' });
    const favoriteFoodInput = page.getByRole('textbox', { name: 'Favorite Food:' });

    // Act - Complete Step 1
    await nameInput.fill(TEST_DATA.name);
    await emailInput.fill(TEST_DATA.email);
    await nextButton.click();

    // Act - Fill Step 2
    await favoriteFoodInput.fill(TEST_DATA.favoriteFood);

    // Act - Go back to Step 1
    await previousButton.click();
    await expect(nameInput).toHaveValue(TEST_DATA.name);

    // Act - Go forward to Step 2
    await nextButton.click();

    // Assert - Step 2 data should be preserved
    await expect(favoriteFoodInput).toHaveValue(TEST_DATA.favoriteFood);
  });

  test('should show alert when submitting without confirmation checkbox', async ({ page }) => {
    // Arrange - Navigate to final step
    const nameInput = page.getByRole('textbox', { name: 'Name:' });
    const emailInput = page.getByRole('textbox', { name: 'Email:' });
    const nextButton = page.getByRole('button', { name: 'Next' });
    const countrySelect = page.getByLabel('Country:');
    const citySelect = page.getByLabel('City:');
    const jobTitleInput = page.getByRole('textbox', { name: 'Job Title:' });
    const experienceInput = page.getByRole('spinbutton', { name: 'Years of Experience:' });
    const submitButton = page.getByRole('button', { name: 'Submit' });
    const confirmCheckbox = page.getByRole('checkbox', { name: 'I confirm the information is' });

    // Setup dialog handler
    let dialogMessage = '';
    page.once('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    // Act - Navigate through all steps
    await nameInput.fill(TEST_DATA.name);
    await emailInput.fill(TEST_DATA.email);
    await nextButton.click(); // Go to Step 2
    await nextButton.click(); // Go to Step 3
    await countrySelect.selectOption(TEST_DATA.country);
    await citySelect.selectOption(TEST_DATA.city);
    await nextButton.click(); // Go to Step 4
    await jobTitleInput.fill(TEST_DATA.jobTitle);
    await experienceInput.fill(TEST_DATA.experience);
    await nextButton.click(); // Go to Step 5
    await nextButton.click(); // Go to Step 6

    // Act - Try to submit without checking confirmation
    await submitButton.click();

    // Assert - Should show alert and remain on form
    expect(dialogMessage).toBeTruthy();
    await expect(confirmCheckbox).toBeVisible();
  });

  test('should measure form completion time for metrics', async ({ page }) => {
    // Arrange - Define locators
    const nameInput = page.getByRole('textbox', { name: 'Name:' });
    const emailInput = page.getByRole('textbox', { name: 'Email:' });
    const nextButton = page.getByRole('button', { name: 'Next' });
    const countrySelect = page.getByLabel('Country:');
    const citySelect = page.getByLabel('City:');
    const jobTitleInput = page.getByRole('textbox', { name: 'Job Title:' });
    const experienceInput = page.getByRole('spinbutton', { name: 'Years of Experience:' });
    const confirmCheckbox = page.getByRole('checkbox', { name: 'I confirm the information is' });
    const submitButton = page.getByRole('button', { name: 'Submit' });
    const successAlert = page.getByTestId('dti-simple-alert-with-custom-message');

    // Act - Measure time to complete form
    const startTime = Date.now();

    await nameInput.fill(TEST_DATA.name);
    await emailInput.fill(TEST_DATA.email);
    await nextButton.click();
    await nextButton.click();
    await countrySelect.selectOption(TEST_DATA.country);
    await citySelect.selectOption(TEST_DATA.city);
    await nextButton.click();
    await jobTitleInput.fill(TEST_DATA.jobTitle);
    await experienceInput.fill(TEST_DATA.experience);
    await nextButton.click();
    await nextButton.click();
    await confirmCheckbox.check();
    await submitButton.click();

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Assert - Form should be submitted successfully
    await expect(successAlert).toBeVisible();

    // Log execution time for metrics comparison
    console.log(`Form completion time: ${executionTime}ms`);
  });

});
