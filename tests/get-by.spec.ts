import { test, expect } from '@playwright/test';

test.describe('Get By Role Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/simple-elements.html');
  });
  test('Get By Test ID', async ({ page }) => {
    //Arrange
    const elementLocator = page.getByTestId('dti-button-element');
    const checkBoxLocator = page.getByTestId('dti-results');
    //Act
    await elementLocator.click();
    //Assert
    await expect(elementLocator).toBeVisible();
    await expect(checkBoxLocator).toHaveText('You clicked the button!');
  });

  test('Get By  CSS Locator', async ({page})=> {
    //Arrange
    const elementSelector = ('#id-button-element');
    const elementLocator = page.locator(elementSelector);
    const checkBoxSelector = ('#results');
    const checkBoxLocator = page.locator(checkBoxSelector);
    //Act
    await elementLocator.click();
    //Assert
    await expect(elementLocator).toBeVisible();
    await expect(checkBoxLocator).toHaveText('You clicked the button!');
});
});