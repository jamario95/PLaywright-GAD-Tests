import { test, expect } from '@playwright/test';

/**
 * Scenario 12.2: Declining confirm dialog and verifying action
 * Page: /practice/alerts-1.html
 * Key metric: Dialog interaction
 *
 * Goal: Compare confirm dialog handling capabilities across frameworks
 *
 * Page structure:
 * - #popup-modal-btn (data-testid: dti-popup-modal-btn): Opens modal popup
 * - Modal contains: Accept and Cancel buttons
 * - #results-container: Shows result after modal interaction
 * - Custom alerts show confirmation messages (green for accept, red for cancel)
 *
 * Modal behavior:
 * - Accept button: Shows green alert "Modal was accepted by user!"
 *                  Updates #results-container with success message
 * - Cancel button: Shows red alert "Modal was cancelled by user!"
 *                  Clears #results-container
 *
 * Differences between technologies:
 * - Playwright: page.on('dialog') + dialog.dismiss() for confirm dialogs
 * - Selenium: driver.switch_to.alert + alert.dismiss()
 * - Cypress: cy.on('window:confirm') with return false to decline
 *
 * Metric: Dialog interaction complexity, lines of code
 */
test.describe('12.2 - Confirm Dialog Decline and Action Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to alerts page
    await page.goto('/practice/alerts-1.html');
  });

  test('should display modal popup button', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');

    // Assert - Verify button is visible
    await expect(popupModalBtn).toBeVisible();
    await expect(popupModalBtn).toHaveText('Click me for modal!');
  });

  test('should open modal when clicking popup button', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');

    // Act - Click button to open modal
    await popupModalBtn.click();

    // Assert - Modal should be visible
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();

    const modalContent = page.locator('.modal-content');
    await expect(modalContent).toBeVisible();
  });

  test('should display modal with header, body and footer', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');

    // Act - Open modal
    await popupModalBtn.click();

    // Assert - Verify modal structure
    const modalHeader = page.locator('.modal-header');
    const modalBody = page.locator('.modal-body');
    const modalFooter = page.locator('.modal-footer');

    await expect(modalHeader).toBeVisible();
    await expect(modalHeader).toHaveText('Modal Header');

    await expect(modalBody).toBeVisible();
    await expect(modalBody).toHaveText('Try different actions here!');

    await expect(modalFooter).toBeVisible();
  });

  test('should display Accept and Cancel buttons in modal', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');

    // Act - Open modal
    await popupModalBtn.click();

    // Assert - Verify buttons in modal footer
    const acceptBtn = page.locator('.modal-footer button:has-text("Accept")');
    const cancelBtn = page.locator('.modal-footer button:has-text("Cancel")');

    await expect(acceptBtn).toBeVisible();
    await expect(cancelBtn).toBeVisible();
  });

  test('should close modal and show red alert when Cancel is clicked', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');

    // Act - Open modal and click Cancel
    await popupModalBtn.click();
    const cancelBtn = page.locator('.modal-footer button:has-text("Cancel")');
    await cancelBtn.click();

    // Assert - Modal should be closed
    const modal = page.locator('.modal');
    await expect(modal).toBeHidden();

    // Assert - Red alert should appear
    const cancelAlert = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(cancelAlert).toBeVisible();
    await expect(cancelAlert).toContainText('Modal was cancelled by user!');
  });

  test('should clear results container when Cancel is clicked', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');
    const resultsContainer = page.locator('#results-container');

    // Act - Open modal and click Cancel
    await popupModalBtn.click();
    const cancelBtn = page.locator('.modal-footer button:has-text("Cancel")');
    await cancelBtn.click();

    // Assert - Results container should be empty
    await expect(resultsContainer).toBeEmpty();
  });

  test('should close modal and show green alert when Accept is clicked', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');

    // Act - Open modal and click Accept
    await popupModalBtn.click();
    const acceptBtn = page.locator('.modal-footer button:has-text("Accept")');
    await acceptBtn.click();

    // Assert - Modal should be closed
    const modal = page.locator('.modal');
    await expect(modal).toBeHidden();

    // Assert - Green alert should appear
    const acceptAlert = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(acceptAlert).toBeVisible();
    await expect(acceptAlert).toContainText('Modal was accepted by user!');
  });

  test('should update results container with success message when Accept is clicked', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');
    const resultsContainer = page.locator('#results-container');

    // Act - Open modal and click Accept
    await popupModalBtn.click();
    const acceptBtn = page.locator('.modal-footer button:has-text("Accept")');
    await acceptBtn.click();

    // Assert - Results container should have success message
    await expect(resultsContainer).toContainText('Modal was accepted by user!');
  });

  test('should allow reopening modal after Cancel', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');

    // Act - Open modal, cancel, and reopen
    await popupModalBtn.click();
    const cancelBtn = page.locator('.modal-footer button:has-text("Cancel")');
    await cancelBtn.click();

    // Wait for alert to disappear
    const cancelAlert = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(cancelAlert).toBeHidden({ timeout: 5000 });

    // Reopen modal
    await popupModalBtn.click();

    // Assert - Modal should be visible again
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();
  });

  test('should allow reopening modal after Accept', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');

    // Act - Open modal, accept, and reopen
    await popupModalBtn.click();
    const acceptBtn = page.locator('.modal-footer button:has-text("Accept")');
    await acceptBtn.click();

    // Wait for alert to disappear
    const acceptAlert = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(acceptAlert).toBeHidden({ timeout: 5000 });

    // Reopen modal
    await popupModalBtn.click();

    // Assert - Modal should be visible again
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();
  });

  test('should verify Cancel alert has red background color', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');

    // Act - Open modal and click Cancel
    await popupModalBtn.click();
    const cancelBtn = page.locator('.modal-footer button:has-text("Cancel")');
    await cancelBtn.click();

    // Assert - Alert should have red background
    const cancelAlert = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(cancelAlert).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  });

  test('should verify Accept alert has green background color', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');

    // Act - Open modal and click Accept
    await popupModalBtn.click();
    const acceptBtn = page.locator('.modal-footer button:has-text("Accept")');
    await acceptBtn.click();

    // Assert - Alert should have green background
    const acceptAlert = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(acceptAlert).toHaveCSS('background-color', 'rgb(0, 128, 0)');
  });

  test('should verify modal is centered on screen', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');

    // Act - Open modal
    await popupModalBtn.click();

    // Assert - Modal content should have centering CSS
    const modalContent = page.locator('.modal-content');
    await expect(modalContent).toHaveCSS('position', 'absolute');

    // Verify transform property exists (browser converts translate(-50%, -50%) to matrix)
    // The matrix format indicates the modal has been transformed for centering
    await expect(modalContent).toHaveCSS('transform', /matrix/);

    // Verify modal is visible and positioned
    await expect(modalContent).toBeVisible();
  });

  test('should measure modal interaction time for metrics', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');

    // Measure execution time
    const startTime = Date.now();

    // Act - Open modal and click Cancel
    await popupModalBtn.click();
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();

    const cancelBtn = page.locator('.modal-footer button:has-text("Cancel")');
    await cancelBtn.click();

    await expect(modal).toBeHidden();

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`Modal interaction time: ${executionTime}ms`);

    // Assert - Operation should complete reasonably fast
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(5000);
  });

  test('should verify sequential Accept then Cancel shows different results', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByTestId('dti-popup-modal-btn');
    const resultsContainer = page.locator('#results-container');

    // Act - First Accept
    await popupModalBtn.click();
    const acceptBtn = page.locator('.modal-footer button:has-text("Accept")');
    await acceptBtn.click();

    // Assert - Results should show success
    await expect(resultsContainer).toContainText('Modal was accepted by user!');

    // Wait for alert to disappear
    const acceptAlert = page.getByTestId('dti-simple-alert-with-custom-message');
    await expect(acceptAlert).toBeHidden({ timeout: 5000 });

    // Act - Then Cancel
    await popupModalBtn.click();
    const cancelBtn = page.locator('.modal-footer button:has-text("Cancel")');
    await cancelBtn.click();

    // Assert - Results should be cleared
    await expect(resultsContainer).toBeEmpty();
  });

  test('should handle modal with getByRole selectors', async ({ page }) => {
    // Arrange
    const popupModalBtn = page.getByRole('button', { name: 'Click me for modal!' });

    // Act - Open modal
    await popupModalBtn.click();

    // Assert - Buttons should be accessible by role
    const acceptBtn = page.getByRole('button', { name: 'Accept' });
    const cancelBtn = page.getByRole('button', { name: 'Cancel' });

    await expect(acceptBtn).toBeVisible();
    await expect(cancelBtn).toBeVisible();

    // Act - Click Cancel using getByRole
    await cancelBtn.click();

    // Assert - Modal should close
    const modal = page.locator('.modal');
    await expect(modal).toBeHidden();
  });
});
