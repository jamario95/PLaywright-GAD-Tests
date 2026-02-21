import { test, expect } from '@playwright/test';

/**
 * Scenario 6.2: Filter table by text → verify number of rows
 * Page: /practice/pagination-v2.html
 * Key metric: Ease of assertions
 *
 * Goal: Compare table filtering handling and row count assertions
 *
 * Differences between technologies:
 * - Playwright: page.locator('tr').count(), dropdown interaction with locator chains
 * - Selenium: findElements() + manual iteration, complex dropdown handling
 * - Cypress: cy.get('tr').should('have.length', N), automatic retry
 */
test.describe('6.2 - Table Filtering by Text', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to the pagination page with filtering capabilities
    await page.goto('/practice/pagination-v2.html');

    // Wait for table data to be loaded from API
    await expect(page.locator('#dataGridBody tr').first()).toBeVisible();
  });

  test('should filter table by name using dropdown filter', async ({
    page,
  }) => {
    // Arrange
    const filterByNameDropdown = page.locator('.dropdown-names-header');
    const dropdownList = page.locator('.dropdown-names-list');
    const tableBody = page.locator('#dataGridBody');
    const elementsCount = page.locator('#elementsCount');

    // Get initial row count
    const initialRowCount = await tableBody.locator('tr').count();
    expect(initialRowCount).toBeGreaterThan(0);

    // Act - Open the Name filter dropdown
    await filterByNameDropdown.click();
    await expect(dropdownList).toHaveClass(/show/);

    // Act - Select a specific name from the dropdown
    const firstNameOption = page
      .locator('#dropdownItemsNames .dropdown-item')
      .first();
    const selectedName = await firstNameOption.textContent();
    await firstNameOption.click();

    // Assert - Verify filter is applied (selected items container shows the filter)
    const selectedItemsContainer = page.locator('#selectedItems');
    await expect(selectedItemsContainer).toContainText(selectedName || '');

    // Assert - Verify elements count is updated
    await expect(elementsCount).not.toContainText('No elements found');
  });

  test('should filter table by role using dropdown filter', async ({
    page,
  }) => {
    // Arrange
    const filterByRoleDropdown = page.locator('.dropdown-roles-header');
    const dropdownList = page.locator('.dropdown-roles-list');
    const selectedItemsContainer = page.locator('#selectedItems');

    // Act - Open the Role filter dropdown
    await filterByRoleDropdown.click();
    await expect(dropdownList).toHaveClass(/show/);

    // Act - Select "Developer" role from the dropdown (exact match)
    const developerOption = page
      .locator('#dropdownItemsRoles')
      .getByText('Developer', { exact: true });
    await developerOption.click();

    // Assert - Verify filter is applied
    await expect(selectedItemsContainer).toContainText('Developer');

    // Assert - Verify all visible rows have "Developer" role
    const tableBody = page.locator('#dataGridBody');
    const rows = tableBody.locator('tr');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const role = await rows.nth(i).locator('td').nth(3).textContent();
      expect(role).toBe('Developer');
    }
  });

  test('should filter table by status using dropdown filter', async ({
    page,
  }) => {
    // Arrange
    const filterByStatusDropdown = page.locator('.dropdown-status-header');
    const dropdownList = page.locator('.dropdown-status-list');
    const selectedItemsContainer = page.locator('#selectedItems');

    // Act - Open the Status filter dropdown
    await filterByStatusDropdown.click();
    await expect(dropdownList).toHaveClass(/show/);

    // Act - Select "Active" status from the dropdown (exact match to avoid "Inactive")
    const activeOption = page
      .locator('#dropdownItemsStatus')
      .getByText('Active', { exact: true });
    await activeOption.click();

    // Assert - Verify filter is applied
    await expect(selectedItemsContainer).toContainText('Active');

    // Assert - Verify all visible rows have "Active" status
    const tableBody = page.locator('#dataGridBody');
    const rows = tableBody.locator('tr');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const status = await rows.nth(i).locator('td').nth(6).textContent();
      expect(status).toBe('Active');
    }
  });

  test('should apply multiple filters simultaneously', async ({ page }) => {
    // Arrange
    const filterByRoleDropdown = page.locator('.dropdown-roles-header');
    const filterByStatusDropdown = page.locator('.dropdown-status-header');
    const selectedItemsContainer = page.locator('#selectedItems');
    const tableBody = page.locator('#dataGridBody');

    // Act - Open Role filter and select "Developer"
    await filterByRoleDropdown.click();
    await page
      .locator('#dropdownItemsRoles')
      .getByText('Developer', { exact: true })
      .click();

    // Act - Open Status filter and select "Active" (exact match)
    await filterByStatusDropdown.click();
    await page
      .locator('#dropdownItemsStatus')
      .getByText('Active', { exact: true })
      .click();

    // Assert - Verify both filters are applied
    await expect(selectedItemsContainer).toContainText('Developer');
    await expect(selectedItemsContainer).toContainText('Active');

    // Assert - Verify all visible rows match both filters
    const rows = tableBody.locator('tr');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const role = await rows.nth(i).locator('td').nth(3).textContent();
      const status = await rows.nth(i).locator('td').nth(6).textContent();
      expect(role).toBe('Developer');
      expect(status).toBe('Active');
    }
  });

  test('should remove filter when clicking on selected filter tag', async ({
    page,
  }) => {
    // Arrange
    const filterByRoleDropdown = page.locator('.dropdown-roles-header');
    const selectedItemsContainer = page.locator('#selectedItems');
    const elementsCount = page.locator('#elementsCount');

    // Act - Apply filter first
    await filterByRoleDropdown.click();
    await page
      .locator('#dropdownItemsRoles')
      .getByText('Developer', { exact: true })
      .click();

    // Assert - Filter is applied
    await expect(selectedItemsContainer).toContainText('Developer');

    // Get filtered count
    const filteredCountText = await elementsCount.textContent();

    // Act - Click elsewhere first to close any open dropdowns
    await page.locator('h2').click();

    // Act - Remove filter by clicking the remove button on the tag (use force to handle overlay)
    const removeButton = selectedItemsContainer.locator('.remove-item').first();
    await removeButton.click({ force: true });

    // Assert - Filter is removed
    await expect(selectedItemsContainer).not.toContainText('Developer');

    // Assert - Row count should increase after removing filter
    const newCountText = await elementsCount.textContent();
    expect(newCountText).not.toBe(filteredCountText);
  });

  test('should search within dropdown filter options', async ({ page }) => {
    // Arrange
    const filterByNameDropdown = page.locator('.dropdown-names-header');
    const searchInput = page.locator('#dropdownSearchName');
    const dropdownItems = page.locator('#dropdownItemsNames .dropdown-item');

    // Act - Open the Name filter dropdown
    await filterByNameDropdown.click();

    // Get initial count of dropdown options
    const initialOptionsCount = await dropdownItems.count();
    expect(initialOptionsCount).toBeGreaterThan(0);

    // Act - Type in search box to filter options
    await searchInput.fill('John');

    // Assert - Dropdown options should be filtered
    const filteredOptionsCount = await dropdownItems.count();
    expect(filteredOptionsCount).toBeLessThanOrEqual(initialOptionsCount);

    // Assert - All visible options should contain "John"
    for (let i = 0; i < filteredOptionsCount; i++) {
      const optionText = await dropdownItems.nth(i).textContent();
      expect(optionText?.toLowerCase()).toContain('john');
    }
  });

  test('should update elements count after applying filter', async ({
    page,
  }) => {
    // Arrange
    const filterByStatusDropdown = page.locator('.dropdown-status-header');
    const elementsCount = page.locator('#elementsCount');

    // Get initial elements count
    const initialCountText = await elementsCount.textContent();
    const initialCount = parseInt(
      initialCountText?.match(/\d+/)?.[0] || '0',
      10
    );

    // Act - Apply status filter (exact match)
    await filterByStatusDropdown.click();
    await page
      .locator('#dropdownItemsStatus')
      .getByText('Active', { exact: true })
      .click();

    // Assert - Elements count should be updated and different from initial
    const filteredCountText = await elementsCount.textContent();
    const filteredCount = parseInt(
      filteredCountText?.match(/\d+/)?.[0] || '0',
      10
    );

    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should reset to page 1 after applying filter', async ({ page }) => {
    // Arrange
    const nextPageButton = page.locator('#nextPage');
    const pageInfo = page.locator('#pageInfo');
    const filterByStatusDropdown = page.locator('.dropdown-status-header');

    // Get initial page info text to understand pagination state
    const initialPageInfo = await pageInfo.textContent();

    // Act - Navigate to next page (page number depends on total pages)
    await nextPageButton.click();

    // Assert - Verify page has changed before applying filter
    await expect(pageInfo).not.toHaveText(initialPageInfo || '');

    // Act - Apply a filter (exact match)
    await filterByStatusDropdown.click();
    await page
      .locator('#dropdownItemsStatus')
      .getByText('Active', { exact: true })
      .click();

    // Assert - Should reset to page 1 after filtering
    await expect(pageInfo).toContainText('Page 1');
  });

  test('should display filtered data with correct structure', async ({
    page,
  }) => {
    // Arrange
    const filterByRoleDropdown = page.locator('.dropdown-roles-header');
    const tableBody = page.locator('#dataGridBody');
    const selectedItemsContainer = page.locator('#selectedItems');

    // Act - Open Role filter and select "Manager"
    await filterByRoleDropdown.click();
    await page
      .locator('#dropdownItemsRoles')
      .getByText('Manager', { exact: true })
      .click();

    // Assert - Verify filter is applied
    await expect(selectedItemsContainer).toContainText('Manager');

    // Assert - Verify table structure with 7 columns
    const rows = tableBody.locator('tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify first row has correct column count
    const firstRowColumns = rows.first().locator('td');
    const columnCount = await firstRowColumns.count();
    expect(columnCount).toBe(7); // ID, Name, Age, Role, Location, Department, Status
  });
});
