import { test, expect } from '@playwright/test';

test.describe('2.5 Verify disabled/enabled state of elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/disabled-elements-1.html');
  });

  // Initial State Tests - Verify elements start as disabled
  test('should verify button is initially disabled', async ({ page }) => {
    // Arrange
    const buttonLocator = page.getByTestId('dti-button-element');

    // Act
    // (No action needed - checking initial state)

    // Assert
    await expect(buttonLocator).toBeDisabled();
  });

  test('should verify checkbox is initially disabled', async ({ page }) => {
    // Arrange
    const checkboxLocator = page.getByTestId('dti-checkbox');

    // Act
    // (No action needed - checking initial state)

    // Assert
    await expect(checkboxLocator).toBeDisabled();
  });

  test('should verify input field is initially disabled', async ({ page }) => {
    // Arrange
    const inputLocator = page.getByTestId('dti-input');

    // Act
    // (No action needed - checking initial state)

    // Assert
    await expect(inputLocator).toBeDisabled();
  });

  test('should verify textarea is initially disabled', async ({ page }) => {
    // Arrange
    const textareaLocator = page.getByTestId('dti-textarea');

    // Act
    // (No action needed - checking initial state)

    // Assert
    await expect(textareaLocator).toBeDisabled();
  });

  test('should verify dropdown is initially disabled', async ({ page }) => {
    // Arrange
    const dropdownLocator = page.getByTestId('dti-dropdown');

    // Act
    // (No action needed - checking initial state)

    // Assert
    await expect(dropdownLocator).toBeDisabled();
  });

  test('should verify all radio buttons are initially disabled', async ({ page }) => {
    // Arrange
    const radio1Locator = page.getByTestId('dti-radio1');
    const radio2Locator = page.getByTestId('dti-radio2');
    const radio3Locator = page.getByTestId('dti-radio3');

    // Act
    // (No action needed - checking initial state)

    // Assert
    await expect(radio1Locator).toBeDisabled();
    await expect(radio2Locator).toBeDisabled();
    await expect(radio3Locator).toBeDisabled();
  });

  test('should verify range input is initially disabled', async ({ page }) => {
    // Arrange
    const rangeLocator = page.getByTestId('dti-range');

    // Act
    // (No action needed - checking initial state)

    // Assert
    await expect(rangeLocator).toBeDisabled();
  });

  test('should verify date input is initially disabled', async ({ page }) => {
    // Arrange
    const dateLocator = page.getByTestId('dti-date');

    // Act
    // (No action needed - checking initial state)

    // Assert
    await expect(dateLocator).toBeDisabled();
  });

  test('should verify color input is initially disabled', async ({ page }) => {
    // Arrange
    const colorLocator = page.getByTestId('dti-color');

    // Act
    // (No action needed - checking initial state)

    // Assert
    await expect(colorLocator).toBeDisabled();
  });

  test('should verify status label shows DISABLED initially', async ({ page }) => {
    // Arrange
    const statusLabelLocator = page.locator('#statusLabel');

    // Act
    // (No action needed - checking initial state)

    // Assert
    await expect(statusLabelLocator).toHaveText('DISABLED');
  });

  // State Transition Tests - Verify elements become enabled after delay
  test('should verify button becomes enabled after delay', async ({ page }) => {
    // Arrange
    const buttonLocator = page.getByTestId('dti-button-element');

    // Act & Assert
    // Wait for element to become enabled
    await expect(buttonLocator).toBeEnabled();
  });

  test('should verify status label changes from DISABLED to ENABLED', async ({ page }) => {
    // Arrange
    const statusLabelLocator = page.locator('#statusLabel');

    // Act & Assert
    // Wait for status to change
    await expect(statusLabelLocator).toHaveText('ENABLED');
  });

  test('should verify all form elements become enabled after delay', async ({ page }) => {
    // Arrange
    const buttonLocator = page.getByTestId('dti-button-element');
    const checkboxLocator = page.getByTestId('dti-checkbox');
    const inputLocator = page.getByTestId('dti-input');
    const textareaLocator = page.getByTestId('dti-textarea');
    const dropdownLocator = page.getByTestId('dti-dropdown');

    // Act
    // Wait for first element to become enabled (all elements change state simultaneously)
    await expect(buttonLocator).toBeEnabled();

    // Assert
    await expect(checkboxLocator).toBeEnabled();
    await expect(inputLocator).toBeEnabled();
    await expect(textareaLocator).toBeEnabled();
    await expect(dropdownLocator).toBeEnabled();
  });

  // Interaction Tests - Verify elements work correctly after becoming enabled
  test('should click button after it becomes enabled and verify result', async ({ page }) => {
    // Arrange
    const buttonLocator = page.getByTestId('dti-button-element');
    const resultsContainer = page.locator('#results-container');

    // Act
    await expect(buttonLocator).toBeEnabled();
    await buttonLocator.click();

    // Assert
    await expect(resultsContainer).toContainText('clicked');
  });

  test('should check checkbox after it becomes enabled', async ({ page }) => {
    // Arrange
    const checkboxLocator = page.getByTestId('dti-checkbox');
    const resultsContainer = page.locator('#results-container');

    // Act
    await expect(checkboxLocator).toBeEnabled();
    await checkboxLocator.check();

    // Assert
    await expect(checkboxLocator).toBeChecked();
    await expect(resultsContainer).toContainText('checked');
  });

  test('should fill input field after it becomes enabled', async ({ page }) => {
    // Arrange
    const inputLocator = page.getByTestId('dti-input');
    const testValue = 'Test input value';

    // Act
    await expect(inputLocator).toBeEnabled();
    await inputLocator.fill(testValue);
    await inputLocator.blur();

    // Assert
    await expect(inputLocator).toHaveValue(testValue);
  });

  test('should fill textarea after it becomes enabled', async ({ page }) => {
    // Arrange
    const textareaLocator = page.getByTestId('dti-textarea');
    const testValue = 'Test textarea content';

    // Act
    await expect(textareaLocator).toBeEnabled();
    await textareaLocator.fill(testValue);
    await textareaLocator.blur();

    // Assert
    await expect(textareaLocator).toHaveValue(testValue);
  });

  test('should select option from dropdown after it becomes enabled', async ({ page }) => {
    // Arrange
    const dropdownLocator = page.getByTestId('dti-dropdown');
    const resultsContainer = page.locator('#results-container');
    const optionValue = 'option2';

    // Act
    await expect(dropdownLocator).toBeEnabled();
    await dropdownLocator.selectOption(optionValue);

    // Assert
    await expect(dropdownLocator).toHaveValue(optionValue);
    await expect(resultsContainer).toContainText('option2');
  });

  test('should select radio button after it becomes enabled', async ({ page }) => {
    // Arrange
    const radio2Locator = page.getByTestId('dti-radio2');
    const resultsContainer = page.locator('#results-container');

    // Act
    await expect(radio2Locator).toBeEnabled();
    await radio2Locator.check();

    // Assert
    await expect(radio2Locator).toBeChecked();
    await expect(resultsContainer).toContainText('Radio Button 2');
  });

  test('should change range input value after it becomes enabled', async ({ page }) => {
    // Arrange
    const rangeLocator = page.getByTestId('dti-range');
    const resultsContainer = page.locator('#results-container');
    const newValue = '75';

    // Act
    await expect(rangeLocator).toBeEnabled();
    await rangeLocator.fill(newValue);

    // Assert
    await expect(rangeLocator).toHaveValue(newValue);
    await expect(resultsContainer).toContainText('75');
  });

  test('should set date value after it becomes enabled', async ({ page }) => {
    // Arrange
    const dateLocator = page.getByTestId('dti-date');
    const resultsContainer = page.locator('#results-container');
    const dateValue = '2025-06-15';

    // Act
    await expect(dateLocator).toBeEnabled();
    await dateLocator.fill(dateValue);

    // Assert
    await expect(dateLocator).toHaveValue(dateValue);
    await expect(resultsContainer).toContainText('2025-06-15');
  });

  // Edge Case Tests
  test('should not be able to click disabled button (force: false by default)', async ({ page }) => {
    // Arrange
    const buttonLocator = page.getByTestId('dti-button-element');
    const resultsContainer = page.locator('#results-container');

    // Act & Assert
    // Verify button is disabled and results container is empty
    await expect(buttonLocator).toBeDisabled();
    await expect(resultsContainer).toBeEmpty();
  });

  test('should verify multiple elements transition from disabled to enabled state', async ({ page }) => {
    // Arrange
    const elementsToCheck = [
      page.getByTestId('dti-button-element'),
      page.getByTestId('dti-checkbox'),
      page.getByTestId('dti-input'),
      page.getByTestId('dti-textarea'),
      page.getByTestId('dti-dropdown'),
      page.getByTestId('dti-radio1'),
      page.getByTestId('dti-range'),
      page.getByTestId('dti-date'),
      page.getByTestId('dti-color'),
    ];

    // Act - Verify initial disabled state
    for (const element of elementsToCheck) {
      await expect(element).toBeDisabled();
    }

    // Wait for state transition
    await expect(elementsToCheck[0]).toBeEnabled();

    // Assert - Verify all elements are now enabled
    for (const element of elementsToCheck) {
      await expect(element).toBeEnabled();
    }
  });

  test('should interact with color picker after it becomes enabled', async ({ page }) => {
    // Arrange
    const colorLocator = page.getByTestId('dti-color');
    const resultsContainer = page.locator('#results-container');
    const colorValue = '#ff5733';

    // Act
    await expect(colorLocator).toBeEnabled();
    await colorLocator.fill(colorValue);

    // Assert
    await expect(colorLocator).toHaveValue(colorValue);
    await expect(resultsContainer).toContainText('#ff5733');
  });
});
