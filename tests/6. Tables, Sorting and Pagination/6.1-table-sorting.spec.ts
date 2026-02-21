import { test, expect } from '@playwright/test';

/**
 * Scenario 6.1: Sort table by "Name" column → verify order
 * Page: /practice/pagination-v1.html
 * Key metric: Sorting stability
 *
 * Goal: Compare table sorting handling and data order assertions
 *
 * Differences between technologies:
 * - Playwright: page.locator('tr').count(), auto-waiting, native array handling
 * - Selenium: findElements() + manual iteration, explicit waits
 * - Cypress: cy.get('tr').should('have.length', N), automatic retry
 */
test.describe('6.1 - Table Sorting by Name Column', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to the pagination page with sortable table
    await page.goto('/practice/pagination-v1.html');

    // Wait for table data to be loaded
    await expect(page.locator('#dataGridBody tr').first()).toBeVisible();
  });

  test('should sort table by Name column in ascending order when clicking header', async ({
    page,
  }) => {
    // Arrange
    const nameColumnHeader = page.locator('th[data-column="name"]');
    const tableBody = page.locator('#dataGridBody');
    const sortIcon = nameColumnHeader.locator('.sort-icon');

    // Act - Click on Name column header to sort ascending
    await nameColumnHeader.click();

    // Assert - Verify sort icon shows ascending
    await expect(sortIcon).toHaveText('▲');

    // Assert - Verify first row contains the alphabetically first name
    const firstRowName = tableBody.locator('tr').first().locator('td').nth(1);
    await expect(firstRowName).toHaveText('Alice Johnson');
  });

  test('should sort table by Name column in descending order when clicking header twice', async ({
    page,
  }) => {
    // Arrange
    const nameColumnHeader = page.locator('th[data-column="name"]');
    const tableBody = page.locator('#dataGridBody');
    const sortIcon = nameColumnHeader.locator('.sort-icon');

    // Act - Click twice on Name column header to sort descending
    await nameColumnHeader.click(); // First click - ascending
    await nameColumnHeader.click(); // Second click - descending

    // Assert - Verify sort icon shows descending
    await expect(sortIcon).toHaveText('▼');

    // Assert - Verify rows are in descending alphabetical order
    const rows = tableBody.locator('tr');
    const rowCount = await rows.count();

    const names: string[] = [];
    for (let i = 0; i < rowCount; i++) {
      const name = await rows.nth(i).locator('td').nth(1).textContent();
      if (name) names.push(name);
    }

    // Verify names are sorted in descending order (Z to A)
    const sortedNamesDesc = [...names].sort((a, b) => b.localeCompare(a));
    expect(names).toEqual(sortedNamesDesc);
  });

  test('should maintain sort order after sorting and verify multiple rows', async ({
    page,
  }) => {
    // Arrange
    const nameColumnHeader = page.locator('th[data-column="name"]');
    const tableBody = page.locator('#dataGridBody');

    // Act - Click on Name column header to sort ascending
    await nameColumnHeader.click();

    // Assert - Get all visible names and verify they are in alphabetical order
    const rows = tableBody.locator('tr');
    const rowCount = await rows.count();

    const names: string[] = [];
    for (let i = 0; i < rowCount; i++) {
      const name = await rows.nth(i).locator('td').nth(1).textContent();
      if (name) names.push(name);
    }

    // Verify names are sorted alphabetically
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sortedNames);
  });

  test('should toggle sort direction when clicking the same column multiple times', async ({
    page,
  }) => {
    // Arrange
    const nameColumnHeader = page.locator('th[data-column="name"]');
    const sortIcon = nameColumnHeader.locator('.sort-icon');

    // Act & Assert - First click should show ascending
    await nameColumnHeader.click();
    await expect(sortIcon).toHaveText('▲');

    // Act & Assert - Second click should show descending
    await nameColumnHeader.click();
    await expect(sortIcon).toHaveText('▼');

    // Act & Assert - Third click should return to ascending
    await nameColumnHeader.click();
    await expect(sortIcon).toHaveText('▲');
  });

  test('should clear sort icon from previous column when sorting by different column', async ({
    page,
  }) => {
    // Arrange
    const nameColumnHeader = page.locator('th[data-column="name"]');
    const ageColumnHeader = page.locator('th[data-column="age"]');
    const nameSortIcon = nameColumnHeader.locator('.sort-icon');
    const ageSortIcon = ageColumnHeader.locator('.sort-icon');

    // Act - Sort by Name first
    await nameColumnHeader.click();
    await expect(nameSortIcon).toHaveText('▲');

    // Act - Then sort by Age
    await ageColumnHeader.click();

    // Assert - Name sort icon should be cleared, Age sort icon should be active
    await expect(nameSortIcon).toHaveText('');
    await expect(ageSortIcon).toHaveText('▲');
  });

  test('should sort by ID column correctly (numeric sorting)', async ({
    page,
  }) => {
    // Arrange
    const idColumnHeader = page.locator('th[data-column="id"]');
    const tableBody = page.locator('#dataGridBody');
    const sortIcon = idColumnHeader.locator('.sort-icon');

    // Act - Click on ID column header to sort ascending
    await idColumnHeader.click();

    // Assert - Verify sort icon shows ascending
    await expect(sortIcon).toHaveText('▲');

    // Assert - Get all visible IDs and verify they are in numeric order
    const rows = tableBody.locator('tr');
    const rowCount = await rows.count();

    const ids: number[] = [];
    for (let i = 0; i < rowCount; i++) {
      const id = await rows.nth(i).locator('td').first().textContent();
      if (id) ids.push(parseInt(id, 10));
    }

    // Verify IDs are sorted numerically
    const sortedIds = [...ids].sort((a, b) => a - b);
    expect(ids).toEqual(sortedIds);
  });

  test('should sort by Age column correctly', async ({ page }) => {
    // Arrange
    const ageColumnHeader = page.locator('th[data-column="age"]');
    const tableBody = page.locator('#dataGridBody');

    // Act - Click on Age column header to sort ascending
    await ageColumnHeader.click();

    // Assert - Get all visible ages and verify they are in numeric order
    const rows = tableBody.locator('tr');
    const rowCount = await rows.count();

    const ages: number[] = [];
    for (let i = 0; i < rowCount; i++) {
      const ageText = await rows.nth(i).locator('td').nth(2).textContent();
      if (ageText && ageText !== '[NOT SET]') {
        ages.push(parseInt(ageText, 10));
      }
    }

    // Verify ages are sorted numerically
    const sortedAges = [...ages].sort((a, b) => a - b);
    expect(ages).toEqual(sortedAges);
  });

  test('should display correct page info after sorting', async ({ page }) => {
    // Arrange
    const nameColumnHeader = page.locator('th[data-column="name"]');
    const pageInfo = page.locator('#pageInfo');

    // Act - Sort by Name
    await nameColumnHeader.click();

    // Assert - Page info should still show Page 1 of X
    await expect(pageInfo).toContainText('Page 1 of');
  });
});
