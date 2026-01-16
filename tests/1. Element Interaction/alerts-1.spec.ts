import { test, expect } from '@playwright/test';

test.describe('Popup allerts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/alerts-1.html');
  });
  test('should invoke alert box, check message and dismiss it', async ({ page }) => {
    // Dialog Handler
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
  test('invoke simple alert popup with fadeout', async ({ page }) => {
    //Arrange
    const buttonLocator = page.getByTestId('dti-alert-btn');
    const popUpLocator = page.getByTestId('dti-simple-alert');

    //Act
    await buttonLocator.click();

    //Assert
    await expect(popUpLocator).toBeVisible();
    await expect(popUpLocator).toHaveText('Button clicked!');
  });

  test('should open PopUp Modal and Accept action', async ({ page }) => {
    //Arrange
    const buttonLocator = page.getByTestId('dti-popup-modal-btn');
    const acceptLocator = page.getByRole('button', { name: 'Accept' });
    const popUpLocator = page.locator('#results-container');
    const customAlertLocator = page.getByTestId('dti-simple-alert-with-custom-message');

    //Act
    await buttonLocator.click();
    await acceptLocator.click();

    //Assert
    await expect(customAlertLocator).toBeVisible();
    await expect(customAlertLocator).toHaveText('Modal was accepted by user! 🎉');
  });

  test('should open PopUp Modal and Cancel action', async ({ page }) => {
    //Arrange
    const buttonLocator = page.getByTestId('dti-popup-modal-btn');
    const cancelLocator = page.getByRole('button', { name: 'Cancel' });
    const popUpLocator = page.locator('#results-container');
    const customAlertLocator = page.getByTestId('dti-simple-alert-with-custom-message');

    //Act
    await buttonLocator.click();
    await cancelLocator.click();

    //Assert
    await expect(customAlertLocator).toBeVisible();
    await expect(customAlertLocator).toContainText('Modal was cancelled by user! 🚫');
    await expect(popUpLocator).toBeEmpty();
  });

  test('should invoike Simple alert with counter', async ({ page }) => {
    //Arrange
    const buttonLocator = page.getByTestId('dti-alert-counter-btn');
    const popUpLocator = page.getByTestId('dti-simple-alert-with-counter');

    //Act
    await buttonLocator.click();

    //Assert
    await expect(popUpLocator).toBeVisible();
    await expect(popUpLocator).toHaveText('Button clicked 1 times');

    //Act
    await buttonLocator.click();

    //Assert
    const secondPopUpLocator = page.locator('#alert-counter-2');
    await expect(secondPopUpLocator).toBeVisible();
    await expect(secondPopUpLocator).toHaveText('Button clicked 2 times');
  });

  test('should invoke Simple alert with random fade out', async ({ page }) => {
    //Arrange
    const buttonLocator = page.getByTestId('dti-alert-random-fade-out-btn');
    const popUpLocator = page.getByTestId('dti-simple-alert-with-counter-and-random-fade-out');

    //Act
    await buttonLocator.click();

    //Assert
    await expect(popUpLocator).toBeVisible();
    await expect(popUpLocator).toHaveText('1 click(s)!');

    //Act
    await buttonLocator.click();
    await buttonLocator.click();

    //Assert
    const thirdPopUpLocator = page.locator('#alert-2-3');
    await expect(thirdPopUpLocator).toBeVisible();
    await expect(thirdPopUpLocator).toHaveText('3 click(s)!');
  });
});
