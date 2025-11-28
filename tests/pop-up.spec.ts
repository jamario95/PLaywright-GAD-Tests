import { test, expect } from '@playwright/test';

test.describe('Popup allerts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/alerts-1.html');
  });
  test('Alert box', async ({ page }) => {
    page.once('dialog', (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      dialog.dismiss().catch(() => {});
      expect(dialog.message()).toContain('Alert box invoked by button click!');
    });
    //Arrange
    const buttonLocator = page.getByTestId('dti-alert-box-btn');
    //Act
    await buttonLocator.click();
    //Assert
    await expect(buttonLocator).toBeVisible();
  });
  test('Simple alert popup', async ({ page }) => {
    //Arrange
    const buttonLocator = page.getByTestId('dti-alert-btn');
    const popUpLocator = page.getByTestId('dti-simple-alert');
    //Act
    await buttonLocator.click();
    //Assert
    await expect(popUpLocator).toBeVisible();
    await expect(popUpLocator).toHaveText('Button clicked!');
  });

  test('PopUp Modal', async ({ page }) => {
    //Arrange
    const buttonLocator = page.getByTestId('dti-popup-modal-btn');
    const acceptLocator = page.getByRole('button', {name: 'Accept'})
    const popUpLocator = page.locator('#results-container');
    //Act
    await buttonLocator.click();
    await acceptLocator.click();
    //Assert
    await expect(popUpLocator).toBeVisible();
    await expect(popUpLocator).toHaveText('Modal was accepted by user! 🎉');

  });
});
