import { test, expect } from '@playwright/test';

test.describe('Get By TestID/CSS Locator Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/simple-elements.html');
  });
  test('Get By Test ID', async ({ page }) => {
    //Arrange
    const elementLocator = page.getByTestId('dti-button-element');
    const checkBoxLocator = page.getByTestId('dti-results');
    const expectedMessage = 'You clicked the button!';
    //Act
    await elementLocator.click();
    //Assert
    await expect(elementLocator).toBeVisible();
    await expect(checkBoxLocator).toHaveText(expectedMessage);
  });

  test('Get By  CSS Locator', async ({ page }) => {
    //Arrange
    const elementSelector = '#id-button-element';
    const checkBoxSelector = '#results';
    const expectedMessage = 'You clicked the button!';

    const elementLocator = page.locator(elementSelector);
    const checkBoxLocator = page.locator(checkBoxSelector);
    //Act
    await elementLocator.click();
    //Assert
    await expect(elementLocator).toBeVisible();
    await expect(checkBoxLocator).toHaveText(expectedMessage);
  });
});
