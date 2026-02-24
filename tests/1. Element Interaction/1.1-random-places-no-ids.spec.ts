import { test, expect } from '@playwright/test';

test.describe('1.1 Click n-th element from list (no IDs) and verify', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/practice/random-places-no-ids-1.html');
  });

  // Positive Tests
  test('should click first "Book Now" button using first() and verify booking confirmation', async ({ page }) => {
    // Arrange
    const firstBookNowButton = page.getByRole('button', { name: 'Book Now' }).first();
    const resultsContainer = page.locator('#results-container');
    const firstRestaurantName = page.locator('#places > div').first().locator('td').first();

    // Act
    const restaurantName = await firstRestaurantName.textContent();
    await firstBookNowButton.click();

    // Assert
    await expect(resultsContainer).toBeVisible();
    await expect(resultsContainer).toContainText(`You have booked a table at ${restaurantName}`);
  });

  test('should click second "Book Now" button using nth() selector and verify', async ({ page }) => {
    // Arrange
    const secondBookNowButton = page.getByRole('button', { name: 'Book Now' }).nth(1);
    const resultsContainer = page.locator('#results-container');
    const secondRestaurantName = page.locator('#places > div').nth(1).locator('td').first();

    // Act
    const restaurantName = await secondRestaurantName.textContent();
    await secondBookNowButton.click();

    // Assert
    await expect(resultsContainer).toBeVisible();
    await expect(resultsContainer).toContainText(`You have booked a table at ${restaurantName}`);
  });

  test('should click third "Book Now" button using last() selector and verify', async ({ page }) => {
    // Arrange
    const placeCards = page.locator('#places > div');
    const lastBookNowButton = page.getByRole('button', { name: 'Book Now' }).last();
    const resultsContainer = page.locator('#results-container');

    // Act
    const lastPlaceCard = placeCards.last();
    const restaurantName = await lastPlaceCard.locator('td').first().textContent();
    await lastBookNowButton.click();

    // Assert
    await expect(resultsContainer).toBeVisible();
    await expect(resultsContainer).toContainText(`You have booked a table at ${restaurantName}`);
  });

  test('should click "Book Now" button by filtering parent container with restaurant name', async ({ page }) => {
    // Arrange
    const placeCards = page.locator('#places > div');
    const resultsContainer = page.locator('#results-container');

    // Act
    const secondPlaceCard = placeCards.nth(1);
    const restaurantName = await secondPlaceCard.locator('td').first().textContent();
    const bookNowButton = secondPlaceCard.getByRole('button', { name: 'Book Now' });
    await bookNowButton.click();

    // Assert
    await expect(resultsContainer).toContainText(`You have booked a table at ${restaurantName}`);
  });

  test('should verify booking confirmation contains rating with star emoji', async ({ page }) => {
    // Arrange
    const firstBookNowButton = page.getByRole('button', { name: 'Book Now' }).first();
    const resultsContainer = page.locator('#results-container');
    const ratingPattern = /\d+(\.\d+)?\s*⭐️/;

    // Act
    await firstBookNowButton.click();

    // Assert
    await expect(resultsContainer).toBeVisible();
    await expect(resultsContainer).toHaveText(ratingPattern);
  });

  // Variant Tests (Dynamic list manipulation)
  test('should add one more place and click its "Book Now" button using last()', async ({ page }) => {
    // Arrange
    const addOnePlaceButton = page.getByRole('button', { name: 'Get one more place!' });
    const placeCards = page.locator('#places > div');
    const resultsContainer = page.locator('#results-container');
    const initialCount = await placeCards.count();

    // Act
    await addOnePlaceButton.click();
    await expect(placeCards).toHaveCount(initialCount + 1);
    const newPlaceCard = placeCards.last();
    const newRestaurantName = await newPlaceCard.locator('td').first().textContent();
    await newPlaceCard.getByRole('button', { name: 'Book Now' }).click();

    // Assert
    await expect(resultsContainer).toContainText(`You have booked a table at ${newRestaurantName}`);
  });

  test('should add 3 more places and verify list count increased by 3', async ({ page }) => {
    // Arrange
    const addThreePlacesButton = page.getByRole('button', { name: 'Get 3 more places!' });
    const placeCards = page.locator('#places > div');
    const initialCount = await placeCards.count();

    // Act
    await addThreePlacesButton.click();

    // Assert
    await expect(placeCards).toHaveCount(initialCount + 3);
  });

  test('should click "Book Now" on multiple places sequentially and verify last booking', async ({ page }) => {
    // Arrange
    const bookNowButtons = page.getByRole('button', { name: 'Book Now' });
    const placeCards = page.locator('#places > div');
    const resultsContainer = page.locator('#results-container');

    // Act
    await bookNowButtons.first().click();
    await bookNowButtons.nth(1).click();
    const lastRestaurantName = await placeCards.last().locator('td').first().textContent();
    await bookNowButtons.last().click();

    // Assert
    await expect(resultsContainer).toContainText(`You have booked a table at ${lastRestaurantName}`);
  });
});
