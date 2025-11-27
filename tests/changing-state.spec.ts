import { test, expect } from '@playwright/test';
test.describe('Changing state of elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/not-present-disabled-elements-1.html');
  });
  test('Different elements - from not present to enabled', async ({ page }) => {
    //Arrange
    const buttonLokator = page.getByTestId('dti-button-element');
    const checkBoxLocator = page.getByTestId('dti-results');
    const expectedMessage = 'You clicked the button!';
    //Act
    await buttonLokator.click();
    //Assert
    await expect(buttonLokator).toBeVisible();
    await expect(checkBoxLocator).toHaveText(expectedMessage);
  });
});
