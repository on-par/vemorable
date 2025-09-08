import { test, expect } from '@playwright/test';
import { setupTestEnvironment, waitForDashboardLoad, waitForChatLoad, navigateToDashboard, navigateToChat, MockNote } from './test-utils';

/**
 * E2E tests for note persistence across navigation
 * 
 * This test reproduces Bug #1: Notes Not Persisting After Navigation
 * The test should FAIL initially because notes disappear when navigating between sections
 * 
 * Bug Summary: Notes disappear completely after navigating between different sections 
 * of the application. The note creation process works correctly (save, processing, display), 
 * but the notes do not persist when returning to the "My Notes" section after visiting another page.
 */

test.describe('Note Persistence Across Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment with auth bypass and API mocking
    await setupTestEnvironment(page);
    await page.goto('/dashboard');
    await waitForDashboardLoad(page);
  });

  test('should persist notes when navigating from My Notes to Chat and back', async ({ page }) => {
    // Step 1: Verify we're on the dashboard with empty state
    await expect(page.getByRole('heading', { name: 'My Notes' })).toBeVisible();
    
    // Verify empty state initially (no notes exist yet)
    const emptyStateMessage = page.locator('[data-testid="empty-notes-message"], .no-notes-message, text="No notes"').first();
    await expect(emptyStateMessage).toBeVisible({ timeout: 5000 });

    // Step 2: Create a new note following the exact bug reproduction steps
    const createNoteButton = page.getByRole('button', { name: /create new note/i }).or(
      page.getByTestId('create-note-button')
    ).or(
      page.locator('button').filter({ hasText: /create|new|add/i }).first()
    );
    await expect(createNoteButton).toBeVisible();
    await createNoteButton.click();

    // Step 3: Select "Text Note" option
    const textNoteOption = page.getByRole('button', { name: /text note/i }).or(
      page.getByTestId('text-note-option')
    ).or(
      page.locator('button').filter({ hasText: /text/i }).first()
    );
    await expect(textNoteOption).toBeVisible();
    await textNoteOption.click();

    // Step 4: Enter the test content exactly as described in the bug report
    const testNoteContent = "This is a test note";
    const noteInput = page.getByTestId('note-input').or(
      page.locator('textarea, input[type="text"]').first()
    );
    await expect(noteInput).toBeVisible();
    await noteInput.fill(testNoteContent);

    // Step 5: Save the note
    const saveButton = page.getByRole('button', { name: /save note/i }).or(
      page.getByTestId('save-note-button')
    );
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // Step 6: Wait for processing to complete
    // Look for loading indicators to disappear
    await expect(page.locator('.animate-spin, [data-testid="loading"], .loading')).not.toBeVisible({ timeout: 10000 });
    
    // Step 7: Verify note appears in the list (this should work correctly)
    const noteCard = page.getByTestId('note-card').or(
      page.locator('[class*="note"], [class*="card"]').filter({ hasText: testNoteContent }).first()
    );
    await expect(noteCard).toBeVisible({ timeout: 10000 });
    
    // Verify the note content is displayed correctly
    await expect(page.locator('text=' + testNoteContent)).toBeVisible();
    
    // Verify note count shows "1 note" (as mentioned in the bug report)
    const noteCount = page.locator('[data-testid="notes-count"], text=/1 note/, text=/1 item/').first();
    await expect(noteCount).toBeVisible();

    // Step 8: Click on the note to view details (verify content is preserved)
    await noteCard.click();
    
    // Verify note modal/detail view opens with correct content
    const noteModal = page.locator('[data-testid="note-modal"], [role="dialog"], .modal').first();
    await expect(noteModal).toBeVisible();
    await expect(noteModal.locator('text=' + testNoteContent)).toBeVisible();
    
    // Step 9: Close the note detail modal
    const closeButton = page.getByRole('button', { name: /close/i }).or(
      page.locator('[aria-label="Close"], .close-button, [data-testid="close-button"]').first()
    );
    await closeButton.click();
    await expect(noteModal).not.toBeVisible();

    // Step 10: Navigate to Chat section
    const chatNavLink = page.getByRole('link', { name: /chat/i }).or(
      page.getByTestId('chat-nav-link')
    ).or(
      page.locator('a[href*="chat"], nav a').filter({ hasText: /chat/i }).first()
    );
    await expect(chatNavLink).toBeVisible();
    await chatNavLink.click();
    
    // Verify we're on the chat page
    await expect(page).toHaveURL(/.*\/dashboard\/chat/);
    await waitForChatLoad(page);

    // Step 11: Navigate back to "My Notes"
    const notesNavLink = page.getByRole('link', { name: /my notes|notes/i }).or(
      page.getByTestId('notes-nav-link')
    ).or(
      page.locator('a[href*="dashboard"]:not([href*="chat"]), nav a').filter({ hasText: /notes|dashboard/i }).first()
    );
    await expect(notesNavLink).toBeVisible();
    await notesNavLink.click();
    
    // Verify we're back on the dashboard
    await expect(page).toHaveURL(/.*\/dashboard$/);
    await waitForDashboardLoad(page);

    // Step 12: CRITICAL TEST - Verify note still exists (THIS SHOULD FAIL with current bug)
    // The bug report states: "Note has disappeared, showing 'No notes' message"
    
    // This assertion should FAIL initially because of the persistence bug
    await expect(noteCard).toBeVisible({ timeout: 10000 });
    
    // Verify the note content is still displayed
    await expect(page.locator('text=' + testNoteContent)).toBeVisible();
    
    // Verify note count still shows "1 note" (not empty state)
    await expect(noteCount).toBeVisible();
    
    // Ensure we don't see the empty state message
    await expect(emptyStateMessage).not.toBeVisible();
    
    // Additional verification: Click on the persisted note to ensure it's functional
    await noteCard.click();
    await expect(noteModal).toBeVisible();
    await expect(noteModal.locator('text=' + testNoteContent)).toBeVisible();
  });

  test('should maintain note data integrity across multiple navigation cycles', async ({ page }) => {
    // Create multiple notes to test more complex persistence scenarios
    const notes = [
      "First persistence test note",
      "Second persistence test note", 
      "Third persistence test note"
    ];
    
    // Create multiple notes
    for (const noteContent of notes) {
      const createButton = page.getByRole('button', { name: /create new note/i }).first();
      await createButton.click();
      
      const textNoteOption = page.getByRole('button', { name: /text note/i }).first();
      await textNoteOption.click();
      
      const noteInput = page.getByTestId('note-input').or(page.locator('textarea, input[type="text"]').first());
      await noteInput.fill(noteContent);
      
      const saveButton = page.getByRole('button', { name: /save note/i });
      await saveButton.click();
      
      // Wait for note to be created and processing to complete
      await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });
    }
    
    // Verify all notes are visible
    for (const noteContent of notes) {
      await expect(page.locator('text=' + noteContent)).toBeVisible();
    }
    
    // Perform multiple navigation cycles to stress test persistence
    for (let cycle = 0; cycle < 3; cycle++) {
      // Navigate to chat
      await navigateToChat(page);
      await expect(page).toHaveURL(/.*\/dashboard\/chat/);
      
      // Navigate back to notes
      await navigateToDashboard(page);
      await expect(page).toHaveURL(/.*\/dashboard$/);
      
      // Verify all notes still exist after each cycle
      for (const noteContent of notes) {
        await expect(page.locator('text=' + noteContent)).toBeVisible({ timeout: 5000 });
      }
    }
    
    // Verify final note count
    const expectedCount = notes.length;
    const noteCountText = `${expectedCount} note${expectedCount > 1 ? 's' : ''}`;
    await expect(page.getByText(noteCountText)).toBeVisible();
  });

  test('should preserve note state when using browser back/forward navigation', async ({ page }) => {
    // Create a note
    const testContent = "Browser navigation test note";
    
    const createButton = page.getByRole('button', { name: /create new note/i }).first();
    await createButton.click();
    
    const textNoteOption = page.getByRole('button', { name: /text note/i }).first();
    await textNoteOption.click();
    
    const noteInput = page.getByTestId('note-input').or(page.locator('textarea, input[type="text"]').first());
    await noteInput.fill(testContent);
    
    const saveButton = page.getByRole('button', { name: /save note/i });
    await saveButton.click();
    
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=' + testContent)).toBeVisible();
    
    // Navigate to chat using link (not browser navigation)
    await navigateToChat(page);
    
    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL(/.*\/dashboard$/);
    await waitForDashboardLoad(page);
    
    // Note should still be visible after browser back navigation
    await expect(page.locator('text=' + testContent)).toBeVisible();
    
    // Navigate forward again
    await page.goForward();
    await expect(page).toHaveURL(/.*\/dashboard\/chat/);
    
    // Navigate back one more time
    await page.goBack();
    await expect(page).toHaveURL(/.*\/dashboard$/);
    
    // Note should still persist
    await expect(page.locator('text=' + testContent)).toBeVisible();
  });

  test('should handle note persistence with page refresh', async ({ page }) => {
    // Create a note
    const testContent = "Page refresh persistence test";
    
    const createButton = page.getByRole('button', { name: /create new note/i }).first();
    await createButton.click();
    
    const textNoteOption = page.getByRole('button', { name: /text note/i }).first();
    await textNoteOption.click();
    
    const noteInput = page.getByTestId('note-input').or(page.locator('textarea, input[type="text"]').first());
    await noteInput.fill(testContent);
    
    const saveButton = page.getByRole('button', { name: /save note/i });
    await saveButton.click();
    
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=' + testContent)).toBeVisible();
    
    // Refresh the page
    await page.reload();
    await waitForDashboardLoad(page);
    
    // Note should still be visible after page refresh
    // This tests that notes are actually persisted to the database, not just in memory
    await expect(page.locator('text=' + testContent)).toBeVisible({ timeout: 10000 });
  });
});

/**
 * Test Documentation and Expected Failure
 * 
 * This test is designed to FAIL initially because it reproduces Bug #1 exactly:
 * 
 * 1. The note creation process works correctly (Steps 1-8 should pass)
 * 2. Navigation to Chat works correctly (Step 10 should pass)  
 * 3. Navigation back to Notes works correctly (Step 11 should pass)
 * 4. The critical failure occurs in Step 12: the note has disappeared
 * 
 * When the bug is present, the test will fail with assertions like:
 * - "Expected note card to be visible" - FAILED
 * - "Expected note content text to be visible" - FAILED  
 * - "Expected note count to show '1 note'" - FAILED
 * - "Expected empty state message not to be visible" - FAILED
 * 
 * The test serves as:
 * 1. Documentation of the expected behavior (notes should persist)
 * 2. Regression test (will catch if bug reoccurs)
 * 3. Specification for the fix (defines what "working" looks like)
 * 
 * Root Cause Testing:
 * The test indirectly tests the potential root causes mentioned in the bug report:
 * - Component state vs persistent storage (by navigation testing)
 * - API calls on subsequent loads (by checking notes appear after navigation)
 * - Client-side caching issues (by multiple navigation cycles)
 * - Database persistence (by page refresh testing)
 */