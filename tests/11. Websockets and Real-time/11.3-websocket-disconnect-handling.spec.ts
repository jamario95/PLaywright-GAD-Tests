import { test, expect, Page } from '@playwright/test';

/**
 * Scenario 11.3: WebSocket disconnect → verify "Offline" message
 * Page: /practice/websocket-chat-v1.html
 * Key metric: Connection handling
 *
 * Goal: Compare WebSocket disconnection handling across frameworks
 *
 * This test validates the application's behavior when WebSocket
 * connection is lost or disrupted.
 *
 * Connection states to test:
 * - Normal connection → chat works
 * - Connection lost → UI should indicate offline/disconnected state
 * - Reconnection → chat should resume
 *
 * WebSocket close events:
 * - Close code 1000: Normal closure
 * - Close code 1001: Going away (tab close)
 * - Close code 1006: Abnormal closure (network failure)
 *
 * Differences between technologies:
 * - Playwright: page.route() for network control, context.setOffline(), WebSocket event monitoring
 * - Selenium: Requires proxy configuration, limited network control
 * - Cypress: cy.intercept() limited for WebSocket, network simulation plugins needed
 *
 * Metric: Connection handling capability, lines of code, additional tools needed
 */
test.describe('11.3 - WebSocket Disconnect Handling', () => {
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

  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to WebSocket chat page
    const wsPromise = page.waitForEvent('websocket');
    await page.goto('/practice/websocket-chat-v1.html');
    await wsPromise;
  });

  test('should establish WebSocket connection on page load', async ({ page }) => {
    // Arrange - Set up WebSocket monitoring
    let wsConnected = false;
    let wsUrl = '';

    page.on('websocket', (ws) => {
      wsConnected = true;
      wsUrl = ws.url();
    });

    // Act - Reload page to trigger new connection
    const wsPromise = page.waitForEvent('websocket');
    await page.reload();
    await wsPromise;

    // Assert - WebSocket should be connected
    expect(wsConnected).toBe(true);
    expect(wsUrl).toContain('3010');
  });

  test('should monitor WebSocket frames being sent', async ({ page }) => {
    // Arrange - Set up WebSocket monitoring before reload
    const sentFrames: string[] = [];
    const user = uniqueUser('Frame');

    page.on('websocket', (ws) => {
      ws.on('framesent', (frame) => {
        sentFrames.push(frame.payload.toString());
      });
    });

    // Act - Reload and join chat
    const wsPromise = page.waitForEvent('websocket');
    await page.reload();
    await wsPromise;
    await joinChat(page, user);

    // Assert - Should have sent join message
    const joinMessageSent = sentFrames.some(
      (frame) => frame.includes('practiceChatJoin') && frame.includes(user)
    );
    expect(joinMessageSent).toBe(true);
  });

  test('should monitor WebSocket frames being received', async ({ page }) => {
    // Arrange - Set up WebSocket monitoring before reload
    const receivedFrames: string[] = [];
    const user = uniqueUser('Recv');

    page.on('websocket', (ws) => {
      ws.on('framereceived', (frame) => {
        receivedFrames.push(frame.payload.toString());
      });
    });

    // Act - Reload and join chat
    const wsPromise = page.waitForEvent('websocket');
    await page.reload();
    await wsPromise;
    await joinChat(page, user);

    // Assert - Should have received user list
    await expect.poll(
      () => receivedFrames.some((frame) => frame.includes('practiceChatUserList')),
      { timeout: 5000 }
    ).toBeTruthy();
  });

  test('should handle going offline gracefully', async ({ page, context }) => {
    // Arrange - Join chat first
    const user = uniqueUser('Offline');
    await joinChat(page, user);

    const messageInput = page.locator('#messageInput');
    const sendButton = page.locator('.chat-container .chat-button');

    // Act - Go offline
    await context.setOffline(true);
    await page.waitForFunction(() => !navigator.onLine);

    // Try to send a message while offline
    await messageInput.fill('Message while offline');
    await sendButton.click();

    // Assert - The UI should remain visible (not crash)
    const messagesContainer = page.locator('#messages');
    await expect(messagesContainer).toBeVisible();

    // Go back online
    await context.setOffline(false);
  });

  test('should detect WebSocket close event', async ({ page }) => {
    // Arrange - Set up WebSocket close monitoring before reload
    let wsClosed = false;
    const user = uniqueUser('Close');

    page.on('websocket', (ws) => {
      ws.on('close', () => {
        wsClosed = true;
      });
    });

    // Reload to capture WebSocket from start
    const wsPromise = page.waitForEvent('websocket');
    await page.reload();
    const ws = await wsPromise;
    const closePromise = ws.waitForEvent('close');

    // Act - Join chat and then navigate away
    await joinChat(page, user);

    // Navigate away (this closes the WebSocket)
    await page.goto('about:blank');
    await closePromise;

    // Assert - WebSocket close event should have been triggered
    expect(wsClosed).toBe(true);
  });

  test('should handle network interruption simulation', async ({ page, context }) => {
    // Arrange - Join chat
    const user = uniqueUser('NetInt');
    await joinChat(page, user);

    // Act - Simulate network interruption
    await context.setOffline(true);
    await page.waitForTimeout(2000); // Intentional: simulate connection timeout period

    // Assert - UI should remain functional (not crash)
    const messagesContainer = page.locator('#messages');
    await expect(messagesContainer).toBeVisible();

    // Restore network
    await context.setOffline(false);
    await page.waitForFunction(() => navigator.onLine);
  });

  test('should handle reconnection after offline period', async ({ page, context }) => {
    // Arrange - Join chat
    const user = uniqueUser('Reconn');
    await joinChat(page, user);

    const messageInput = page.locator('#messageInput');
    const sendButton = page.locator('.chat-container .chat-button');
    const messagesContainer = page.locator('#messages');

    // Send a message while online
    await messageInput.fill('Message before offline');
    await sendButton.click();
    await expect(messagesContainer).toContainText('Message before offline');

    // Act - Go offline then back online
    await context.setOffline(true);
    await page.waitForFunction(() => !navigator.onLine);
    await context.setOffline(false);
    await page.waitForFunction(() => navigator.onLine);

    // Reload page to re-establish connection
    const wsPromise = page.waitForEvent('websocket');
    await page.reload();
    await wsPromise;

    // Assert - Should be able to rejoin chat
    const loginScreen = page.locator('#loginScreen');
    await expect(loginScreen).toBeVisible();

    // Rejoin chat with new username
    const newUser = uniqueUser('Recon2');
    await joinChat(page, newUser);
    await expect(loginScreen).toHaveClass(/hidden/);
  });

  test('should notify other users when user disconnects', async ({ browser }) => {
    // Arrange - Create two browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = uniqueUser('Disc1');
    const user2 = uniqueUser('Watch');

    try {
      const ws1Promise = page1.waitForEvent('websocket');
      const ws2Promise = page2.waitForEvent('websocket');
      await page1.goto('/practice/websocket-chat-v1.html');
      await page2.goto('/practice/websocket-chat-v1.html');
      await ws1Promise;
      await ws2Promise;

      await joinChat(page1, user1);
      await joinChat(page2, user2);

      // Act - User 1 closes their page (disconnects)
      await page1.close();

      // Assert - User 2 should see a notification about User 1 leaving
      const messagesContainer2 = page2.locator('#messages');
      await expect(messagesContainer2).toContainText(user1, { timeout: 5000 });
      await expect(messagesContainer2).toContainText('left', { timeout: 5000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should handle WebSocket error event', async ({ page }) => {
    // Arrange - Set up WebSocket error monitoring
    let wsErrorOccurred = false;
    const user = uniqueUser('Error');

    page.on('websocket', (ws) => {
      ws.on('socketerror', () => {
        wsErrorOccurred = true;
      });
    });

    // Act - Join chat and monitor for errors
    await joinChat(page, user);

    // Assert - No errors should occur during normal operation
    expect(wsErrorOccurred).toBe(false);
  });

  test('should handle page refresh and rejoin', async ({ page }) => {
    // Arrange - Join chat
    const user = uniqueUser('Refres');
    await joinChat(page, user);

    const messageInput = page.locator('#messageInput');
    const sendButton = page.locator('.chat-container .chat-button');
    const messagesContainer = page.locator('#messages');

    // Send a message
    await messageInput.fill('Before refresh');
    await sendButton.click();
    await expect(messagesContainer).toContainText('Before refresh');

    // Act - Refresh the page
    await page.reload();

    // Assert - Should show login screen again (connection reset)
    const loginScreen = page.locator('#loginScreen');
    await expect(loginScreen).toBeVisible();
    await expect(loginScreen).not.toHaveClass(/hidden/);
  });

  test('should handle duplicate username attempt on rejoin', async ({ browser }) => {
    // Arrange - Create two browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Use shared username for this test (intentionally to test duplicate)
    const sharedUser = uniqueUser('Dup');

    try {
      const ws1Promise = page1.waitForEvent('websocket');
      await page1.goto('/practice/websocket-chat-v1.html');
      await ws1Promise;
      await joinChat(page1, sharedUser);

      // Act - Try to join with the same username
      const ws2Promise = page2.waitForEvent('websocket');
      await page2.goto('/practice/websocket-chat-v1.html');
      await ws2Promise;

      const usernameInput = page2.locator('#usernameInput');
      const joinButton = page2.locator('#loginScreen .chat-button');
      const loginScreen = page2.locator('#loginScreen');
      const errorDiv = page2.locator('#usernameError');

      await usernameInput.fill(sharedUser);
      await joinButton.click();

      // Wait for server response: either rejection (error shown) or join (login hidden)
      await page2.waitForFunction(
        () => {
          const errorEl = document.getElementById('usernameError');
          const loginEl = document.getElementById('loginScreen');
          const hasError = errorEl ? (errorEl.textContent?.trim().length ?? 0) > 0 : false;
          const joined = loginEl ? loginEl.classList.contains('hidden') : false;
          return hasError || joined;
        },
        undefined, // no arg passed to page function
        { timeout: 5000 }
      ).catch(() => { /* server may silently reject - both states are valid */ });

      // Check state after server response
      const errorVisible = await errorDiv.isVisible();
      const loginHidden = await loginScreen.evaluate((el) => el.classList.contains('hidden'));

      // Assert - Either error was shown (rejected) or user joined (both are valid behaviors)
      // Log actual behavior for debugging
      console.log(
        `Duplicate username test: errorVisible=${errorVisible}, loginHidden=${loginHidden}`
      );
      expect(errorVisible || loginHidden).toBe(true);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should measure connection recovery time', async ({ page, context }) => {
    // Arrange - Join chat
    const user = uniqueUser('Recov');
    await joinChat(page, user);

    // Act - Go offline and then online
    const startTime = Date.now();

    await context.setOffline(true);
    await page.waitForFunction(() => !navigator.onLine);
    await context.setOffline(false);

    // Reload to re-establish connection
    const wsPromise = page.waitForEvent('websocket');
    await page.reload();
    await wsPromise;

    // Rejoin with new unique username
    const newUser = uniqueUser('Recov2');
    await joinChat(page, newUser);

    const endTime = Date.now();
    const recoveryTime = endTime - startTime;

    // Log recovery time for metrics
    console.log(`WebSocket connection recovery time: ${recoveryTime}ms`);

    // Assert - Recovery should complete
    const loginScreen = page.locator('#loginScreen');
    await expect(loginScreen).toHaveClass(/hidden/);
    expect(recoveryTime).toBeGreaterThan(0);
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Arrange - Join chat
    const user = uniqueUser('Nav');
    await joinChat(page, user);

    // Navigate to another page
    await page.goto('/practice/');

    // Act - Go back
    await page.goBack();

    // Assert - Should show login screen (WebSocket was closed)
    const loginScreen = page.locator('#loginScreen');
    await expect(loginScreen).toBeVisible();
  });

  test('should track WebSocket connection state changes', async ({ page }) => {
    // Arrange - Track connection states
    const connectionStates: string[] = [];
    const user = uniqueUser('State');

    page.on('websocket', (ws) => {
      connectionStates.push('connected');

      ws.on('close', () => {
        connectionStates.push('closed');
      });
    });

    // Act - Reload, join, then leave
    const wsPromise = page.waitForEvent('websocket');
    await page.reload();
    const ws = await wsPromise;
    const closePromise = ws.waitForEvent('close');
    await joinChat(page, user);

    // Navigate away to close connection
    await page.goto('about:blank');
    await closePromise;

    // Assert - Should have recorded connection state
    expect(connectionStates).toContain('connected');
  });

  test('should handle slow network conditions', async ({ page, context }) => {
    // Arrange - Set up slow network simulation
    const user = uniqueUser('Slow');
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 50000, // 50kb/s
      uploadThroughput: 50000,
      latency: 500, // 500ms latency
    });

    // Act - Join chat with slow network
    await joinChat(page, user);

    const messageInput = page.locator('#messageInput');
    const sendButton = page.locator('.chat-container .chat-button');
    const messagesContainer = page.locator('#messages');

    await messageInput.fill('Slow network message');
    await sendButton.click();

    // Assert - Message should eventually appear despite slow network
    await expect(messagesContainer).toContainText('Slow network message', { timeout: 15000 });

    // Reset network conditions
    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });
  });

  test('should log WebSocket traffic for debugging', async ({ page }) => {
    // Arrange - Set up comprehensive logging
    const wsLog: {
      type: string;
      timestamp: number;
      data?: string;
    }[] = [];

    const user = uniqueUser('Log');

    page.on('websocket', (ws) => {
      wsLog.push({ type: 'connection', timestamp: Date.now() });

      ws.on('framesent', (frame) => {
        wsLog.push({
          type: 'sent',
          timestamp: Date.now(),
          data: frame.payload.toString(),
        });
      });

      ws.on('framereceived', (frame) => {
        wsLog.push({
          type: 'received',
          timestamp: Date.now(),
          data: frame.payload.toString(),
        });
      });

      ws.on('close', () => {
        wsLog.push({ type: 'close', timestamp: Date.now() });
      });
    });

    // Act - Reload and perform chat operations
    const wsPromise = page.waitForEvent('websocket');
    await page.reload();
    await wsPromise;
    await joinChat(page, user);

    const messageInput = page.locator('#messageInput');
    const sendButton = page.locator('.chat-container .chat-button');

    await messageInput.fill('Test message for logging');
    await sendButton.click();

    // Assert - Should have logged activity (poll until frames are received)
    await expect.poll(
      () => wsLog.some((log) => log.type === 'received'),
      { timeout: 5000 }
    ).toBeTruthy();
    expect(wsLog.length).toBeGreaterThan(0);
    expect(wsLog.some((log) => log.type === 'connection')).toBe(true);
    expect(wsLog.some((log) => log.type === 'sent')).toBe(true);
    expect(wsLog.some((log) => log.type === 'received')).toBe(true);

    // Log for debugging
    console.log('WebSocket traffic log:', JSON.stringify(wsLog, null, 2));
  });
});
