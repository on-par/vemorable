import { test, expect } from '@playwright/test';
import { setupTestEnvironment, mockChatAPI, mockNotes, MockNote } from './test-utils';

/**
 * E2E tests for chat-notes integration visual indicators
 * 
 * This test reproduces Bug #2: Chat Feature Disconnected from Notes Data
 * The test should FAIL initially because the ChatInterface component doesn't display:
 * - Notes availability indicators
 * - Notes usage count from API responses  
 * - Visual feedback about notes integration
 * 
 * Bug Summary: The Chat feature appears to be completely disconnected from the notes data.
 * Even when notes exist, they are not accessible or visible in the Chat section, preventing 
 * users from asking questions about their notes. The backend API works correctly and returns 
 * `notesUsed` count, but the frontend doesn't display this information to users.
 */

test.describe('Chat Notes Integration - Visual Indicators', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment with auth bypass and API mocking including notes data
    const testNotes: MockNote[] = [
      {
        id: 'chat-test-note-1',
        title: 'Meeting Notes with Client',
        summary: 'Discussed project requirements and timeline',
        tags: ['meeting', 'client', 'requirements'],
        created_at: new Date().toISOString(),
        processed_content: 'Client meeting notes: Discussed new project requirements, timeline is 3 months, budget approved.',
      },
      {
        id: 'chat-test-note-2',
        title: 'Technical Architecture Ideas',
        summary: 'Ideas for system architecture and database design',
        tags: ['architecture', 'database', 'technical'],
        created_at: new Date().toISOString(),
        processed_content: 'Architecture notes: Microservices approach, PostgreSQL database, Redis caching layer.',
      },
    ];
    
    await setupTestEnvironment(page, testNotes);
    
    // Mock chat API to return notesUsed count for testing visual indicators
    await mockChatAPI(page, 2); // Simulate 2 notes being used in responses
    
    await page.goto('/dashboard/chat');
    
    // Wait for chat interface to load - look for the ChatInterface component
    await expect(page.locator('.h-\\[calc\\(100vh-8rem\\)\\]')).toBeVisible();
  });

  test('should show notes availability indicator in chat interface', async ({ page }) => {
    // Verify we're on the chat page - look for the mobile toggle button
    await expect(page.locator('button[aria-label="Toggle chat history"]')).toBeVisible();
    
    // EXPECTED TO FAIL: Chat interface should show that notes are available for context
    // Look for notes availability indicators that should exist but currently don't
    const notesAvailableIndicator = page.locator(
      '[data-testid="notes-available-indicator"], ' +
      '.notes-available, ' +
      'text=/\\d+ notes? available/i, ' +
      'text=/knowledge base: \\d+ notes?/i'
    ).first();
    
    // This assertion should FAIL because the ChatInterface doesn't show notes availability
    await expect(notesAvailableIndicator).toBeVisible({ timeout: 5000 });
    
    // Alternative: Check for notes count display in the header area
    const headerNotesCount = page.locator('[data-testid="chat-notes-count"]').or(
      page.locator('.chat-header').locator('text=/\\d+ notes?/')
    );
    
    await expect(headerNotesCount).toBeVisible();
    
    // Check that the notes count indicates 2 notes are available (from our test data)
    await expect(headerNotesCount).toContainText('2');
  });

  test('should display notes usage count in chat responses', async ({ page }) => {
    // Send a message that should trigger notes usage
    const testMessage = "What did we discuss in the client meeting?";
    
    const messageInput = page.locator('textarea[placeholder*="Ask about your notes"]');
    await expect(messageInput).toBeVisible();
    await messageInput.fill(testMessage);
    
    const sendButton = page.getByRole('button', { name: /send/i });
    await expect(sendButton).toBeVisible();
    await sendButton.click();
    
    // Wait for the assistant response
    await expect(page.locator('[data-testid="message-assistant"]').or(
      page.locator('.message-bubble').filter({ hasText: /I found information/i })
    ).first()).toBeVisible({ timeout: 10000 });
    
    // EXPECTED TO FAIL: Should show visual indicator of how many notes were used
    const notesUsedIndicator = page.locator(
      '[data-testid="notes-used-count"], ' +
      '.notes-used-indicator, ' +
      'text=/used \\d+ notes?/i, ' +
      'text=/found in \\d+ notes?/i, ' +
      'text=/references: \\d+ notes?/i'
    ).first();
    
    // This assertion should FAIL because ChatInterface doesn't display notes usage count
    await expect(notesUsedIndicator).toBeVisible();
    
    // Check that it specifically shows "2 notes" were used (from our mock)
    await expect(notesUsedIndicator).toContainText('2');
    
    // Alternative: Look for notes usage badge or chip near the response
    const notesUsageBadge = page.locator('[data-testid="response-notes-badge"]').or(
      page.locator('.notes-badge, .usage-badge').filter({ hasText: /\\d+/ })
    );
    
    await expect(notesUsageBadge).toBeVisible();
    await expect(notesUsageBadge).toContainText('2 notes');
  });

  test('should indicate when no notes are available for context', async ({ page }) => {
    // Set up environment with no notes to test empty state indicators
    await setupTestEnvironment(page, []); // Empty notes array
    await mockChatAPI(page, 0); // No notes used in response
    
    await page.goto('/dashboard/chat');
    await expect(page.getByText('Chat with your Notes')).toBeVisible();
    
    // EXPECTED TO FAIL: Should show indicator that no notes are available
    const noNotesIndicator = page.locator(
      '[data-testid="no-notes-available"], ' +
      '.no-notes-warning, ' +
      'text=/no notes available/i, ' +
      'text=/knowledge base: empty/i, ' +
      'text=/0 notes available/i'
    ).first();
    
    // This assertion should FAIL because ChatInterface doesn't show no-notes state
    await expect(noNotesIndicator).toBeVisible();
    
    // Send a message to verify the no-notes state is communicated
    const messageInput = page.locator('textarea[placeholder*="Ask about your notes"]');
    await messageInput.fill("What notes do I have?");
    
    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();
    
    // Wait for response
    await expect(page.locator('.message-bubble').last()).toBeVisible({ timeout: 10000 });
    
    // Should indicate no notes were used in the response
    const zeroNotesIndicator = page.locator('text=/used 0 notes?/i, text=/no notes found/i').first();
    await expect(zeroNotesIndicator).toBeVisible();
  });

  test('should show relevant notes being used in conversation context', async ({ page }) => {
    // Send a message about a specific topic that should match our test notes
    const messageInput = page.locator('textarea[placeholder*="Ask about your notes"]');
    await messageInput.fill("Tell me about the technical architecture");
    
    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();
    
    // Wait for assistant response
    await expect(page.locator('.message-bubble').last()).toBeVisible({ timeout: 10000 });
    
    // EXPECTED TO FAIL: Should show which specific notes were referenced
    const noteReferencesSection = page.locator(
      '[data-testid="note-references"], ' +
      '.referenced-notes, ' +
      '.notes-sources, ' +
      '.context-notes'
    ).first();
    
    // This assertion should FAIL because ChatInterface doesn't show note references
    await expect(noteReferencesSection).toBeVisible();
    
    // Should show the titles of referenced notes
    await expect(noteReferencesSection).toContainText('Technical Architecture Ideas');
    
    // Alternative: Look for expandable notes context section
    const notesContextToggle = page.locator(
      '[data-testid="toggle-notes-context"], ' +
      'button[aria-label*="notes"], ' +
      'text=/view source notes/i, ' +
      'text=/show references/i'
    ).first();
    
    await expect(notesContextToggle).toBeVisible();
    
    // Click to expand and verify note details are shown
    await notesContextToggle.click();
    
    const expandedNotesContext = page.locator(
      '[data-testid="expanded-notes-context"], ' +
      '.notes-context-expanded, ' +
      '.source-notes-detail'
    ).first();
    
    await expect(expandedNotesContext).toBeVisible();
    await expect(expandedNotesContext).toContainText('Technical Architecture Ideas');
    await expect(expandedNotesContext).toContainText('architecture');
  });

  test('should provide feedback about notes integration status', async ({ page }) => {
    // EXPECTED TO FAIL: Should show status of notes integration in the interface
    const integrationStatusIndicator = page.locator(
      '[data-testid="notes-integration-status"], ' +
      '.integration-status, ' +
      '.notes-connection-status, ' +
      'text=/notes connected/i, ' +
      'text=/knowledge base: active/i'
    ).first();
    
    // This assertion should FAIL because ChatInterface doesn't show integration status
    await expect(integrationStatusIndicator).toBeVisible();
    
    // Check for visual indication that notes are successfully connected
    await expect(integrationStatusIndicator).toHaveClass(/connected|active|success/);
    
    // Alternative: Look for notes summary in chat header or sidebar
    const notesSummary = page.locator(
      '[data-testid="notes-summary"], ' +
      '.notes-overview, ' +
      '.knowledge-summary'
    ).first();
    
    await expect(notesSummary).toBeVisible();
    
    // Should show count and basic info about available notes
    await expect(notesSummary).toContainText(/2 notes/i);
    await expect(notesSummary).toContainText(/topics?|tags?/i);
  });

  test('should update notes indicators when new notes are created', async ({ page }) => {
    // First check initial state with 2 notes
    const initialNotesIndicator = page.locator('[data-testid="notes-available-indicator"]');
    await expect(initialNotesIndicator).toContainText('2');
    
    // Simulate creating a new note by updating the mock
    const updatedNotes: MockNote[] = [...mockNotes, {
      id: 'new-note-3',
      title: 'Newly Created Note',
      summary: 'A fresh note for testing',
      tags: ['new', 'test'],
      created_at: new Date().toISOString(),
      processed_content: 'This is a newly created note for testing dynamic updates.',
    }];
    
    // Update the API mock to return 3 notes
    await page.route('**/api/notes', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          json: {
            success: true,
            data: {
              notes: updatedNotes,
              pagination: {
                limit: 50,
                offset: 0,
                total: updatedNotes.length,
              },
            },
          },
        });
      }
    });
    
    // Trigger a refresh or re-fetch of notes data
    await page.reload();
    await expect(page.getByText('Chat with your Notes')).toBeVisible();
    
    // EXPECTED TO FAIL: Notes count should update to reflect new note
    const updatedNotesIndicator = page.locator('[data-testid="notes-available-indicator"]');
    await expect(updatedNotesIndicator).toContainText('3');
    
    // Test that chat can now access the new note
    const messageInput = page.locator('textarea[placeholder*="Ask about your notes"]');
    await messageInput.fill("Tell me about the newly created note");
    
    const sendButton = page.getByRole('button', { name: /send/i });
    await sendButton.click();
    
    // Should indicate that notes were found and used
    await expect(page.locator('text=/found in.*notes?/i')).toBeVisible({ timeout: 10000 });
  });
});

/**
 * Test Documentation and Expected Failures
 * 
 * These tests are designed to FAIL initially because they test Bug #2:
 * "Chat Feature Disconnected from Notes Data"
 * 
 * The key issue is NOT that the backend API is broken - the API correctly:
 * - Searches through notes using vector similarity
 * - Returns relevant notes as context to OpenAI
 * - Includes `notesUsed` count in the response
 * 
 * The issue is that the FRONTEND ChatInterface component doesn't:
 * - Show any visual indication that notes are available
 * - Display the `notesUsed` count from API responses
 * - Provide feedback about notes integration status
 * - Show which specific notes were referenced
 * - Indicate when no notes are available for context
 * 
 * Expected Test Failures:
 * 
 * 1. "should show notes availability indicator" - FAILS
 *    - No element exists to show how many notes are available
 *    - No header indicator showing knowledge base status
 * 
 * 2. "should display notes usage count" - FAILS  
 *    - API returns `notesUsed: 2` but UI doesn't display this
 *    - No badges or indicators showing how many notes informed the response
 * 
 * 3. "should indicate when no notes available" - FAILS
 *    - No warning when user has no notes to chat about
 *    - No guidance about creating notes first
 * 
 * 4. "should show relevant notes being used" - FAILS
 *    - No way to see which specific notes were referenced
 *    - No expandable context showing source material
 * 
 * 5. "should provide feedback about integration status" - FAILS
 *    - No indication that notes system is connected and working
 *    - No status indicator for notes integration health
 * 
 * The Fix Requirements:
 * The ChatInterface component needs to be enhanced to:
 * 1. Display notes availability count in header/status area
 * 2. Show `notesUsed` count from API responses (parse `data.notesUsed`)
 * 3. Provide visual feedback about notes integration status
 * 4. Show referenced notes in expandable context sections
 * 5. Handle empty notes state with appropriate messaging
 * 6. Update indicators dynamically when notes are added/removed
 * 
 * These tests serve as:
 * - Specification for the missing UI features
 * - Regression tests for when the bug is fixed
 * - Documentation of expected user experience
 */