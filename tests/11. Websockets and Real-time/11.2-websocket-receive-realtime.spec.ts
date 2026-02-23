import { test, expect, Page } from '@playwright/test';

/**
 * Scenario 11.2: Receive push message → verify real-time update
 * Page: /practice/websocket-chat-v1.html
 * Key metric: Real-time validation
 *
 * Goal: Compare real-time message receiving capabilities across frameworks
 *
 * This test validates that messages sent from one client are received
 * in real-time by another client without page refresh.
 *
 * Page structure:
 * - #messages: Container for chat messages
 * - .message-content: Individual message content
 * - .message-username: Username display in message
 * - .system-message: System messages (join/leave notifications)
 *
 * WebSocket events:
 * - practiceChatMessage: Regular chat message from another user
 * - practiceChatUserList: User list update when someone joins/leaves
 *
 * Differences between technologies:
 * - Playwright: Multiple browser contexts, page.waitForEvent(), native WebSocket support
 * - Selenium: Requires multiple WebDriver instances, complex synchronization
 * - Cypress: Limited multi-tab support, cy.origin() for cross-origin, community plugins
 *
 * Metric: Real-time validation speed, multi-client handling, lines of code
 */
test.describe('11.2 - WebSocket Real-time Message Receiving', () => {
  /**
   * Generate unique username (max 16 chars for validation)
   */
  function uniqueUser(prefix: string): string {
    return `${prefix}${Date.now().toString().slice(-6)}`;
  }

  /**
   * Helper function to join chat with given username
   */
  async function joinChat(page: Page, username: string): Promise<void> {
    const usernameInput = page.locator('#usernameInput');
    await usernameInput.fill(username);

    const joinButton = page.locator('#loginScreen .chat-button');
    await joinButton.click();

    const loginScreen = page.locator('#loginScreen');
    await expect(loginScreen).toHaveClass(/hidden/, { timeout: 5000 });
  }

  /**
   * Helper function to send a message
   */
  async function sendMessage(page: Page, message: string): Promise<void> {
    const messageInput = page.locator('#messageInput');
    const sendButton = page.locator('.chat-container .chat-button');

    await messageInput.fill(message);
    await sendButton.click();
  }

  test('should receive message in real-time from another user (two browser contexts)', async ({
    browser,
  }) => {
    // Arrange - Create two separate browser contexts (simulates two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = uniqueUser('Send');
    const user2 = uniqueUser('Recv');
    const testMessage = 'Real-time message from sender';

    try {
      // Navigate both pages to chat
      const ws1Promise = page1.waitForEvent('websocket');
      const ws2Promise = page2.waitForEvent('websocket');
      await page1.goto('/practice/websocket-chat-v1.html');
      await page2.goto('/practice/websocket-chat-v1.html');
      await ws1Promise;
      await ws2Promise;

      // User 1 joins chat
      await joinChat(page1, user1);

      // User 2 joins chat
      await joinChat(page2, user2);

      // Act - User 1 sends a message
      await sendMessage(page1, testMessage);

      // Assert - User 2 receives the message in real-time
      const messagesContainer2 = page2.locator('#messages');
      await expect(messagesContainer2).toContainText(user1, { timeout: 5000 });
      await expect(messagesContainer2).toContainText(testMessage, { timeout: 5000 });
    } finally {
      // Cleanup
      await context1.close();
      await context2.close();
    }
  });

  test('should receive system message when another user joins', async ({ browser }) => {
    // Arrange - Create two browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = uniqueUser('First');
    const user2 = uniqueUser('Second');

    try {
      // Navigate page 1 to chat and join
      const ws1Promise = page1.waitForEvent('websocket');
      await page1.goto('/practice/websocket-chat-v1.html');
      await ws1Promise;
      await joinChat(page1, user1);

      // Act - User 2 joins
      const ws2Promise = page2.waitForEvent('websocket');
      await page2.goto('/practice/websocket-chat-v1.html');
      await ws2Promise;
      await joinChat(page2, user2);

      // Assert - User 1 should receive notification about User 2 joining
      const messagesContainer1 = page1.locator('#messages');
      // System message about user joining (format varies, check for username)
      await expect(messagesContainer1).toContainText(user2, { timeout: 5000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should display messages in chronological order', async ({ browser }) => {
    // Arrange - Create two browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = uniqueUser('Order1');
    const user2 = uniqueUser('Order2');

    try {
      // Navigate and join chat
      const ws1Promise = page1.waitForEvent('websocket');
      const ws2Promise = page2.waitForEvent('websocket');
      await page1.goto('/practice/websocket-chat-v1.html');
      await page2.goto('/practice/websocket-chat-v1.html');
      await ws1Promise;
      await ws2Promise;

      await joinChat(page1, user1);
      await joinChat(page2, user2);

      const messages = ['First message', 'Second message', 'Third message'];

      // Act - Send messages in sequence
      for (const msg of messages) {
        await sendMessage(page1, msg);
      }

      // Assert - Messages should appear in order on receiver's side
      const messagesContainer2 = page2.locator('#messages');

      // Wait for all messages to arrive
      await expect(messagesContainer2).toContainText('Third message', { timeout: 5000 });

      // Get all message contents and verify order
      const messageElements = await messagesContainer2.locator('p').all();
      const messageTexts: string[] = [];

      for (const el of messageElements) {
        const text = await el.textContent();
        if (text) messageTexts.push(text);
      }

      // Verify order by checking that First appears before Second, Second before Third
      const firstIndex = messageTexts.findIndex((t) => t.includes('First message'));
      const secondIndex = messageTexts.findIndex((t) => t.includes('Second message'));
      const thirdIndex = messageTexts.findIndex((t) => t.includes('Third message'));

      expect(firstIndex).toBeLessThan(secondIndex);
      expect(secondIndex).toBeLessThan(thirdIndex);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should receive message with correct username attribution', async ({ browser }) => {
    // Arrange
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = uniqueUser('Attr1');
    const user2 = uniqueUser('Attr2');

    try {
      const ws1Promise = page1.waitForEvent('websocket');
      const ws2Promise = page2.waitForEvent('websocket');
      await page1.goto('/practice/websocket-chat-v1.html');
      await page2.goto('/practice/websocket-chat-v1.html');
      await ws1Promise;
      await ws2Promise;

      await joinChat(page1, user1);
      await joinChat(page2, user2);

      // Act - User 1 sends message
      const uniqueMessage = `Message from user at ${Date.now()}`;
      await sendMessage(page1, uniqueMessage);

      // Assert - User 2 sees message attributed to User 1
      const messagesContainer2 = page2.locator('#messages');
      await expect(messagesContainer2).toContainText(uniqueMessage, { timeout: 5000 });

      // Verify username is displayed for this message
      const userMessageWithName = messagesContainer2.locator(
        `.message-username:has-text("${user1}")`
      );
      await expect(userMessageWithName.first()).toBeVisible();
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should handle bidirectional communication', async ({ browser }) => {
    // Arrange
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = uniqueUser('Bidi1');
    const user2 = uniqueUser('Bidi2');

    try {
      const ws1Promise = page1.waitForEvent('websocket');
      const ws2Promise = page2.waitForEvent('websocket');
      await page1.goto('/practice/websocket-chat-v1.html');
      await page2.goto('/practice/websocket-chat-v1.html');
      await ws1Promise;
      await ws2Promise;

      await joinChat(page1, user1);
      await joinChat(page2, user2);

      const message1to2 = 'Hello from User 1!';
      const message2to1 = 'Hello back from User 2!';

      // Act - Bidirectional communication
      await sendMessage(page1, message1to2);
      await sendMessage(page2, message2to1);

      // Assert - Both users receive both messages
      const messagesContainer1 = page1.locator('#messages');
      const messagesContainer2 = page2.locator('#messages');

      await expect(messagesContainer1).toContainText(message1to2, { timeout: 5000 });
      await expect(messagesContainer1).toContainText(message2to1, { timeout: 5000 });

      await expect(messagesContainer2).toContainText(message1to2, { timeout: 5000 });
      await expect(messagesContainer2).toContainText(message2to1, { timeout: 5000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should handle rapid message sending', async ({ browser }) => {
    // Arrange
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = uniqueUser('Rapid1');
    const user2 = uniqueUser('Rapid2');

    try {
      const ws1Promise = page1.waitForEvent('websocket');
      const ws2Promise = page2.waitForEvent('websocket');
      await page1.goto('/practice/websocket-chat-v1.html');
      await page2.goto('/practice/websocket-chat-v1.html');
      await ws1Promise;
      await ws2Promise;

      await joinChat(page1, user1);
      await joinChat(page2, user2);

      // Act - Send multiple messages rapidly
      const rapidMessages = ['Msg1', 'Msg2', 'Msg3', 'Msg4', 'Msg5'];
      for (const msg of rapidMessages) {
        await sendMessage(page1, msg);
      }

      // Assert - All messages should be received
      const messagesContainer2 = page2.locator('#messages');
      for (const msg of rapidMessages) {
        await expect(messagesContainer2).toContainText(msg, { timeout: 5000 });
      }
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should auto-scroll to latest message', async ({ browser }) => {
    // Arrange
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = uniqueUser('Scroll1');
    const user2 = uniqueUser('Scroll2');

    try {
      const ws1Promise = page1.waitForEvent('websocket');
      const ws2Promise = page2.waitForEvent('websocket');
      await page1.goto('/practice/websocket-chat-v1.html');
      await page2.goto('/practice/websocket-chat-v1.html');
      await ws1Promise;
      await ws2Promise;

      await joinChat(page1, user1);
      await joinChat(page2, user2);

      // Act - Send many messages to trigger scroll
      for (let i = 1; i <= 10; i++) {
        await sendMessage(page1, `Message number ${i}`);
      }

      // Assert - Latest message should be visible (auto-scrolled)
      const messagesContainer2 = page2.locator('#messages');
      await expect(messagesContainer2).toContainText('Message number 10', { timeout: 5000 });

      // Verify the message is in viewport
      const lastMessage = messagesContainer2.locator('p').last();
      await expect(lastMessage).toBeInViewport();
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should measure real-time message delivery latency', async ({ browser }) => {
    // Arrange
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = uniqueUser('Lat1');
    const user2 = uniqueUser('Lat2');

    try {
      const ws1Promise = page1.waitForEvent('websocket');
      const ws2Promise = page2.waitForEvent('websocket');
      await page1.goto('/practice/websocket-chat-v1.html');
      await page2.goto('/practice/websocket-chat-v1.html');
      await ws1Promise;
      await ws2Promise;

      await joinChat(page1, user1);
      await joinChat(page2, user2);

      const latencyTestMessage = `Latency test ${Date.now()}`;
      const messagesContainer2 = page2.locator('#messages');

      // Measure delivery time
      const startTime = Date.now();

      // Act - Send message
      await sendMessage(page1, latencyTestMessage);

      // Wait for message to appear on receiver
      await expect(messagesContainer2).toContainText(latencyTestMessage, { timeout: 5000 });

      const endTime = Date.now();
      const latency = endTime - startTime;

      // Log latency for metrics comparison
      console.log(`WebSocket real-time delivery latency: ${latency}ms`);

      // Assert - Latency should be reasonable for real-time
      expect(latency).toBeLessThan(3000);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should handle special characters in messages', async ({ browser }) => {
    // Arrange
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = uniqueUser('Spec1');
    const user2 = uniqueUser('Spec2');

    try {
      const ws1Promise = page1.waitForEvent('websocket');
      const ws2Promise = page2.waitForEvent('websocket');
      await page1.goto('/practice/websocket-chat-v1.html');
      await page2.goto('/practice/websocket-chat-v1.html');
      await ws1Promise;
      await ws2Promise;

      await joinChat(page1, user1);
      await joinChat(page2, user2);

      // Act - Send message with special characters
      const specialMessage = 'Test special chars & "quotes"';
      await sendMessage(page1, specialMessage);

      // Assert - Message should be received
      const messagesContainer2 = page2.locator('#messages');
      await expect(messagesContainer2).toContainText('Test special chars', { timeout: 5000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should handle multiple concurrent users (three contexts)', async ({ browser }) => {
    // Arrange - Create three browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    const page3 = await context3.newPage();

    const user1 = uniqueUser('Multi1');
    const user2 = uniqueUser('Multi2');
    const user3 = uniqueUser('Multi3');

    try {
      const ws1Promise = page1.waitForEvent('websocket');
      const ws2Promise = page2.waitForEvent('websocket');
      const ws3Promise = page3.waitForEvent('websocket');
      await page1.goto('/practice/websocket-chat-v1.html');
      await page2.goto('/practice/websocket-chat-v1.html');
      await page3.goto('/practice/websocket-chat-v1.html');
      await ws1Promise;
      await ws2Promise;
      await ws3Promise;

      await joinChat(page1, user1);
      await joinChat(page2, user2);
      await joinChat(page3, user3);

      // Act - User 1 sends message
      const broadcastMessage = 'Hello everyone!';
      await sendMessage(page1, broadcastMessage);

      // Assert - All users receive the message
      await expect(page1.locator('#messages')).toContainText(broadcastMessage, { timeout: 5000 });
      await expect(page2.locator('#messages')).toContainText(broadcastMessage, { timeout: 5000 });
      await expect(page3.locator('#messages')).toContainText(broadcastMessage, { timeout: 5000 });
    } finally {
      await context1.close();
      await context2.close();
      await context3.close();
    }
  });
});
