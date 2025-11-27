import { test, expect } from '@playwright/test';

test.describe('Finding element with different approaches (no IDs)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/simple-multiple-elements-no-ids.html');
  });
  test('Get By Role and name', async ({ page }) => {
    //Arrange
    const elementRole = 'button';
    const buttonLocator = page.getByRole(elementRole, { name: 'Click me!' });
    const checkBoxLocator = page.getByTestId('dti-results');
    //Act
    await buttonLocator.click();
    //Assert
    await expect(buttonLocator).toBeVisible();
    await expect(checkBoxLocator).toHaveText('You clicked the button!');
  });
  test('getByRole + element number', async ({ page }) => {
    //Arrange
    const elementRole = 'button';
    const buttonLocator = page.getByRole(elementRole).nth(1);
    const checkBoxLocator = page.getByTestId('dti-results');
    //Act
    await buttonLocator.click();
    //Assert
    await expect(buttonLocator).toBeVisible();
    await expect(checkBoxLocator).toHaveText('You clicked the button!');
  });
  test('Get By Role and filter', async ({ page }) => {
    //Arrange
    const elementRole = 'button';
    const buttonLocator = page.getByRole(elementRole).filter({ hasText: 'Click me!' });
    const checkBoxLocator = page.getByTestId('dti-results');
    //Act
    await buttonLocator.click();
    //Assert
    await expect(buttonLocator).toBeVisible();
    await expect(checkBoxLocator).toHaveText('You clicked the button!');
  });
  test('Get By Chaining (parrent  + getBy)', async ({ page }) => {
    //Arrange
    const elementRole = 'button';
    const elemmentText = 'Click!';
    const parrentRole = 'row';
    const parrentText = 'Row 3';
    const expectedMessage = 'You clicked the button! (row 3)';

    const buttonLocator = page
      .getByRole(parrentRole, { name: parrentText })
      .getByRole(elementRole, { name: elemmentText });
    const checkBoxLocator = page.getByTestId('dti-results');
    //Act
    await buttonLocator.click();
    //Assert
    await expect(buttonLocator).toBeVisible();
    await expect(checkBoxLocator).toHaveText(expectedMessage);
  });
  test('Single button click (parrent  + filter)', async ({ page }) => {
    //Arrange
    const elementRole = 'button';
    const parrentRole = 'row';
    const parrentText = 'Row 3';
    const expectedMessage = 'You clicked the button! (row 3)';

    const buttonLocator = page
      .getByRole(parrentRole)
      .filter({ has: page.getByText(parrentText) })
      .getByRole(elementRole);
    const checkBoxLocator = page.getByTestId('dti-results');
    //Act
    await buttonLocator.click();
    //Assert
    await expect(buttonLocator).toBeVisible();
    await expect(checkBoxLocator).toHaveText(expectedMessage);
  });
});
