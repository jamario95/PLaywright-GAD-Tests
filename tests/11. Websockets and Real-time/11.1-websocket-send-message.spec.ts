import { test, expect, Page } from '@playwright/test';

/**
 * Scenario 11.1: Send message via WebSocket → verify it appears in UI
 * Page: /practice/websocket-chat-v1.html
 * API Endpoint: N/A (WebSocket: ws://localhost:3010)
 *
 * Technology Comparison:
 * - Cypress: UI-level only; no native WS monitoring; cy.window() for WS access; validates via DOM
 * - Playwright: Full WS monitoring with page.waitForEvent('websocket') + ws.on('framesent/framereceived')
 * - WebdriverIO: UI-based WS verification; no native WS monitoring; browser.pause(500) for stabilization
 *
 * Metric: WebSocket message send support, test code complexity, native WS API access
 *
 * Framework-specific notes:
 * - page.waitForEvent('websocket') in beforeEach waits reactively — test won't start until WS is open
 * - ws.on('framesent') / ws.on('framereceived') available for frame-level protocol monitoring
 * - WebSocket URL verifiable: ws://localhost:3010 (HTTP port + 10)
 */
test.describe('11.1 - WebSocket Send Message', () => {
  // Test data
  const testUsername = 'TestUser123';
  const testMessage = 'Hello from Playwright test!';

  /**
   * Helper function to join chat with given username
   */
  async function joinChat(page: Page, username: string): Promise<void> {
    // Enter username
    const usernameInput = page.locator('#usernameInput');
    await usernameInput.fill(username);

    // Click Join Chat button
    const joinButton = page.locator('#loginScreen .chat-button');
    await joinButton.click();

    // Wait for login screen to be hidden (indicates successful join)
    const loginScreen = page.locator('#loginScreen');
    await expect(loginScreen).toHaveClass(/hidden/, { timeout: 5000 });
  }

  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to WebSocket chat page
    const wsPromise = page.waitForEvent('websocket');
    await page.goto('/practice/websocket-chat-v1.html');
    await wsPromise;
  });

  test('should display login screen on initial load', async ({ page }) => {
    // Arrange
    const loginScreen = page.locator('#loginScreen');
    const usernameInput = page.locator('#usernameInput');
    const joinButton = page.locator('#loginScreen .chat-button');

    // Assert - Verify login screen is visible with all elements
    await expect(loginScreen).toBeVisible();
    await expect(usernameInput).toBeVisible();
    await expect(usernameInput).toHaveAttribute('placeholder', 'Your name...');
    await expect(joinButton).toBeVisible();
    await expect(joinButton).toHaveText('Join Chat');
  });

  test('should validate username - minimum length', async ({ page }) => {
    // Arrange
    const usernameInput = page.locator('#usernameInput');
    const joinButton = page.locator('#loginScreen .chat-button');
    const errorDiv = page.locator('#usernameError');

    // Act - Enter too short username
    await usernameInput.fill('AB');
    await joinButton.click();

    // Assert - Verify error message
    await expect(errorDiv).toHaveText('Username must have at least 3 characters');
    await expect(usernameInput).toHaveClass(/error/);
  });

  test('should validate username - maximum length', async ({ page }) => {
    // Arrange
    const usernameInput = page.locator('#usernameInput');
    const joinButton = page.locator('#loginScreen .chat-button');
    const errorDiv = page.locator('#usernameError');

    // Act - Enter too long username (>16 characters)
    await usernameInput.fill('ThisUsernameIsTooLongForValidation');
    await joinButton.click();

    // Assert - Verify error message
    await expect(errorDiv).toHaveText('Username must have less than 16 characters');
  });

  test('should validate username - invalid characters', async ({ page }) => {
    // Arrange
    const usernameInput = page.locator('#usernameInput');
    const joinButton = page.locator('#loginScreen .chat-button');
    const errorDiv = page.locator('#usernameError');

    // Act - Enter username with invalid characters
    await usernameInput.fill('User@Name!');
    await joinButton.click();

    // Assert - Verify error message
    await expect(errorDiv).toHaveText(
      'Username can only contain letters, numbers, and underscores'
    );
  });

  test('should clear error message when typing', async ({ page }) => {
    // Arrange
    const usernameInput = page.locator('#usernameInput');
    const joinButton = page.locator('#loginScreen .chat-button');
    const errorDiv = page.locator('#usernameError');

    // Act - Trigger error first
    await usernameInput.fill('AB');
    await joinButton.click();
    await expect(errorDiv).toHaveText('Username must have at least 3 characters');

    // Act - Start typing
    await usernameInput.fill('ABC');

    // Assert - Error should be cleared
    await expect(errorDiv).toBeEmpty();
  });

  test('should join chat with valid username', async ({ page }) => {
    // Arrange
    const loginScreen = page.locator('#loginScreen');
    const messagesContainer = page.locator('#messages');

    // Act - Join chat
    await joinChat(page, testUsername);

    // Assert - Login screen should be hidden
    await expect(loginScreen).toHaveClass(/hidden/);

    // Assert - Messages container should be visible
    await expect(messagesContainer).toBeVisible();
  });

  test('should send message and display it in UI', async ({ page }) => {
    // Arrange - Join chat first
    await joinChat(page, testUsername);

    const messageInput = page.locator('#messageInput');
    const sendButton = page.locator('.chat-container .chat-button');
    const messagesContainer = page.locator('#messages');

    // Act - Send a message
    await messageInput.fill(testMessage);
    await sendButton.click();

    // Assert - Message should appear in the messages container
    await expect(messagesContainer).toContainText(testUsername);
    await expect(messagesContainer).toContainText(testMessage);
  });

  test('should clear input field after sending message', async ({ page }) => {
    // Arrange - Join chat
    await joinChat(page, testUsername);

    const messageInput = page.locator('#messageInput');
    const sendButton = page.locator('.chat-container .chat-button');

    // Act - Send a message
    await messageInput.fill(testMessage);
    await sendButton.click();

    // Assert - Input field should be cleared
    await expect(messageInput).toHaveValue('');
  });

  test('should send message via Enter key', async ({ page }) => {
    // Arrange - Join chat with unique username (max 16 chars)
    const uniqueUser = `Enter${Date.now().toString().slice(-6)}`;
    await joinChat(page, uniqueUser);

    const messageInput = page.locator('#messageInput');
    const messagesContainer = page.locator('#messages');
    const enterKeyMessage = 'Sent with Enter key';

    // Act - Type message and press Enter
    await messageInput.fill(enterKeyMessage);
    await messageInput.press('Enter');

    // Assert - Message should appear in container
    await expect(messagesContainer).toContainText(enterKeyMessage);
    await expect(messageInput).toHaveValue('');
  });

  test('should join chat via Enter key in username field', async ({ page }) => {
    // Arrange
    const usernameInput = page.locator('#usernameInput');
    const loginScreen = page.locator('#loginScreen');

    // Act - Enter username and press Enter
    await usernameInput.fill(testUsername);
    await usernameInput.press('Enter');

    // Assert - Should join chat
    await expect(loginScreen).toHaveClass(/hidden/, { timeout: 5000 });
  });

  test('should not send empty message', async ({ page }) => {
    // Arrange - Join chat with unique username (max 16 chars)
    const uniqueUser = `Empty${Date.now().toString().slice(-6)}`;
    await joinChat(page, uniqueUser);

    const messageInput = page.locator('#messageInput');
    const sendButton = page.locator('.chat-container .chat-button');
    const messagesContainer = page.locator('#messages');

    // First send a valid message to have a reference point
    const validMessage = 'Valid test message';
    await messageInput.fill(validMessage);
    await sendButton.click();
    await expect(messagesContainer).toContainText(validMessage);

    // Act - Try to send empty message
    await messageInput.fill('');
    await sendButton.click();

    // Assert - No new user message should appear
    // Input should remain empty (not cleared because nothing was sent)
    await expect(messageInput).toHaveValue('');

    // Allow for potential system messages but no empty user message should appear
    const userMessages = messagesContainer.locator(`.message-username:has-text("${uniqueUser}")`);
    const userMessageCount = await userMessages.count();

    // Should only have 1 user message (the valid one)
    expect(userMessageCount).toBe(1);
  });

  test('should display message with timestamp', async ({ page }) => {
    // Arrange - Join chat
    await joinChat(page, testUsername);

    const messageInput = page.locator('#messageInput');
    const sendButton = page.locator('.chat-container .chat-button');
    const messagesContainer = page.locator('#messages');

    // Act - Send a message
    await messageInput.fill(testMessage);
    await sendButton.click();

    // Assert - Message should have timestamp (format: HH:MM)
    const messageTime = messagesContainer.locator('.message-time').last();
    await expect(messageTime).toBeVisible();

    // Verify timestamp format (HH:MM)
    const timeText = await messageTime.textContent();
    expect(timeText).toMatch(/^\d{2}:\d{2}$/);
  });

  test('should display username styled correctly', async ({ page }) => {
    // Arrange - Join chat with unique username
    const uniqueUser = `Style${Date.now().toString().slice(-6)}`;
    await joinChat(page, uniqueUser);

    const messageInput = page.locator('#messageInput');
    const sendButton = page.locator('.chat-container .chat-button');
    const messagesContainer = page.locator('#messages');

    // Act - Send a message
    await messageInput.fill(testMessage);
    await sendButton.click();

    // Wait for message to appear
    await expect(messagesContainer).toContainText(testMessage);

    // Assert - Username should be styled with message-username class
    // Find the message with our username (not system messages)
    const usernameSpan = messagesContainer.locator(`.message-username:has-text("${uniqueUser}")`);
    await expect(usernameSpan.first()).toBeVisible();
  });

  test('should monitor WebSocket connection establishment', async ({ page }) => {
    // Arrange - Set up WebSocket monitoring
    let wsConnected = false;

    page.on('websocket', (ws) => {
      wsConnected = true;
      expect(ws.url()).toContain('3010');
    });

    // Act - Navigate to page
    const wsPromise = page.waitForEvent('websocket');
    await page.goto('/practice/websocket-chat-v1.html');
    await wsPromise;

    // Assert - WebSocket should be connected
    expect(wsConnected).toBe(true);
  });

  test('should measure message send time for metrics', async ({ page }) => {
    // Arrange - Join chat with unique username
    const uniqueUser = `Metric${Date.now().toString().slice(-6)}`;
    await joinChat(page, uniqueUser);

    const messageInput = page.locator('#messageInput');
    const sendButton = page.locator('.chat-container .chat-button');
    const messagesContainer = page.locator('#messages');

    // Measure execution time
    const startTime = Date.now();

    // Act - Send message
    await messageInput.fill(testMessage);
    await sendButton.click();

    // Wait for message to appear
    await expect(messagesContainer).toContainText(testMessage);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`WebSocket message send time: ${executionTime}ms`);

    // Assert - Operation completed successfully
    expect(executionTime).toBeGreaterThan(0);
    expect(executionTime).toBeLessThan(5000); // Should be fast
  });
});
