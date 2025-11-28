import { test, expect } from '@playwright/test';

test.describe('Simple iframe register form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/iframe-4.html');
  });
  test('Succesfull Register', async ({ page }) => {
    //Outer iframe
    const outerFrame = page.frameLocator('[data-testid="dti-simple-iframe"]');
    //Inner iframe
    const innerFrame = outerFrame.frameLocator('#inner-iframe');

    //Arrange
    const usernameLocator = innerFrame.getByTestId('username-input');
    const passwordLocator = innerFrame.getByTestId('password-input');
    const ageLocator = innerFrame.getByTestId('age-input');
    const buttonLocator = innerFrame.getByTestId('register-submit');
    const checkBoxLocator = innerFrame.getByTestId('register-results');
    const username = 'Mario123';
    const passowrd = '12345678';
    const maskedPassword = '*'.repeat(passowrd.length);
    const age = '25';
    const expectedMessage = `Registration successful! Username: ${username}, Age: ${age}, Password: ${maskedPassword}`;
    //Act
    await usernameLocator.fill(username);
    await passwordLocator.fill(passowrd);
    await ageLocator.fill(age);
    await buttonLocator.click();
    //Assert
    await expect(checkBoxLocator).toHaveText(expectedMessage);
  });
});
