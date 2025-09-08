import { expect, Page } from '@playwright/test';

/**
 * Test utilities for VeMorable e2e tests
 * Provides common functionality for authentication bypass and API mocking
 */

export interface MockNote {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  created_at: string;
  processed_content: string;
}

/**
 * Default mock notes for testing
 */
export const mockNotes: MockNote[] = [
  {
    id: 'test-note-1',
    title: 'Test Note 1',
    summary: 'This is a test note for persistence testing',
    tags: ['test', 'persistence'],
    created_at: new Date().toISOString(),
    processed_content: 'Detailed content of the test note that should persist across navigation.',
  },
  {
    id: 'test-note-2', 
    title: 'Chat Test Note',
    summary: 'Note for testing chat integration',
    tags: ['chat', 'integration'],
    created_at: new Date().toISOString(),
    processed_content: 'This note should be accessible to the chat feature for context.',
  },
];

/**
 * Mock successful API responses for notes
 */
export async function mockNotesAPI(page: Page, notes: MockNote[] = mockNotes) {
  // Mock GET /api/notes - fetch user's notes
  await page.route('**/api/notes', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          success: true,
          data: {
            notes,
            pagination: {
              limit: 50,
              offset: 0,
              total: notes.length,
            },
          },
        },
      });
    }
  });

  // Mock POST /api/notes - create new note
  await page.route('**/api/notes', async (route) => {
    if (route.request().method() === 'POST') {
      const postData = route.request().postDataJSON();
      const newNote: MockNote = {
        id: `test-note-${Date.now()}`,
        title: postData.title || 'New Test Note',
        summary: postData.summary || 'AI generated summary',
        tags: postData.tags || ['test'],
        created_at: new Date().toISOString(),
        processed_content: postData.processed_content || postData.content || 'Test content',
      };
      
      await route.fulfill({
        json: {
          success: true,
          data: newNote,
        },
        status: 201,
      });
    }
  });
}

/**
 * Mock chat API responses
 */
export async function mockChatAPI(page: Page, notesUsedCount: number = 2) {
  // Mock chat sessions endpoint
  await page.route('**/api/chat/sessions', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          sessions: [],
        },
      });
    }
  });

  // Mock chat API to simulate notes integration
  await page.route('**/api/chat', async (route) => {
    if (route.request().method() === 'POST') {
      const postData = route.request().postDataJSON();
      
      await route.fulfill({
        json: {
          success: true,
          data: {
            response: `I found information in ${notesUsedCount} of your notes. Based on your question "${postData.message}", here's what I found...`,
            notesUsed: notesUsedCount,
            sessionId: postData.sessionId,
          },
        },
      });
    }
  });
}

/**
 * Bypass authentication for testing
 * This comprehensive approach mocks both Clerk client-side and API-level auth
 */
export async function bypassAuth(page: Page) {
  // Mock Clerk's client-side auth state
  await page.addInitScript(() => {
    // Mock Clerk global state
    (window as any).__clerk_loaded = true;
    (window as any).__clerk_db_jwt = 'mock-jwt-token';
    
    // Mock useAuth hook return values
    (window as any).__mockAuthState = {
      isLoaded: true,
      isSignedIn: true,
      userId: 'test-user-id',
      user: {
        id: 'test-user-id',
        emailAddresses: [{ emailAddress: 'test@vemorable.com' }],
        firstName: 'Test',
        lastName: 'User',
      },
    };
  });

  // Mock Clerk API endpoints
  await page.route('**/api/auth/**', async (route) => {
    await route.fulfill({
      json: {
        user: {
          id: 'test-user-id',
          email: 'test@vemorable.com',
        },
      },
    });
  });

  // Mock Clerk's __clerk_ssr_state for SSR scenarios
  await page.route('**/_next/static/**', async (route) => {
    // Let static assets pass through normally
    await route.continue();
  });
}

/**
 * Complete test setup with auth bypass and API mocking
 */
export async function setupTestEnvironment(page: Page, customNotes?: MockNote[]) {
  await bypassAuth(page);
  await mockNotesAPI(page, customNotes);
  await mockChatAPI(page);
}

/**
 * Wait for the dashboard page to load completely
 */
export async function waitForDashboardLoad(page: Page) {
  // Wait for the main heading to be visible
  await expect(page.getByRole('heading', { name: 'My Notes' })).toBeVisible();
  
  // Wait for any loading spinners to disappear
  await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });
}

/**
 * Wait for the chat page to load completely  
 */
export async function waitForChatLoad(page: Page) {
  // Wait for chat interface to be visible
  await expect(page.getByText('Chat History')).toBeVisible();
}

/**
 * Navigate to dashboard and ensure it's loaded
 */
export async function navigateToDashboard(page: Page) {
  await page.goto('/dashboard');
  await waitForDashboardLoad(page);
}

/**
 * Navigate to chat and ensure it's loaded
 */
export async function navigateToChat(page: Page) {
  await page.goto('/dashboard/chat');
  await waitForChatLoad(page);
}