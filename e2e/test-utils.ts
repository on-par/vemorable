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
  console.log('Setting up notes API mocking...');
  
  // Try multiple route patterns to ensure we catch the request
  const patterns = ['**/api/notes**', '**/api/notes', '/api/notes'];
  
  for (const pattern of patterns) {
    await page.route(pattern, async (route) => {
      console.log(`=== ROUTE ${pattern} INTERCEPTED ===`);
      console.log('Method:', route.request().method());
      console.log('URL:', route.request().url());
      
      if (route.request().method() === 'GET') {
        console.log('Fulfilling with mock notes:', notes.length);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              notes: notes,
              pagination: {
                limit: 50,
                offset: 0,
                total: notes.length,
              },
            },
          }),
        });
        return;
      }
      
      await route.continue();
    });
  }
  
  console.log('Notes API mocking setup complete');

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
  // Set test environment variables for the browser context
  await page.addInitScript(() => {
    // Set test environment flags
    window.__PLAYWRIGHT_TEST__ = true;
    
    // Preemptively mock Clerk before any modules load
    const mockClerkInstance = {
      loaded: true,
      addListener: () => {},
      removeListener: () => {},
      on: () => {},
      off: () => {},
      emit: () => {},
      user: {
        id: 'test-user-id',
        emailAddresses: [{ emailAddress: 'test@vemorable.com' }],
        firstName: 'Test',
        lastName: 'User',
      },
      session: {
        id: 'test-session-id',
        status: 'active',
        getToken: () => Promise.resolve('mock-jwt-token'),
      },
      load: () => Promise.resolve(mockClerkInstance),
      isReady: () => true,
      buildUrl: () => 'https://mock-url.com',
      signOut: () => Promise.resolve(),
    };
    
    window.Clerk = mockClerkInstance;
    window.__clerk_loaded = true;
    window.__clerk_frontend_loaded = true;
    
    // Mock ClerkProvider's internal clerkjs instance
    Object.defineProperty(window, '__CLERK_PUBLISHABLE_KEY', {
      value: 'pk_test_mock_key',
      writable: false
    });
    
    // Add test headers for server detection
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const [url, options = {}] = args;
      options.headers = {
        ...options.headers,
        'x-playwright-test': 'true'
      };
      return originalFetch.call(this, url, options);
    };
  });

  // Mock Clerk's client-side auth state - comprehensive mocking
  await page.addInitScript(() => {
    const mockUser = {
      id: 'test-user-id',
      emailAddresses: [{ 
        emailAddress: 'test@vemorable.com',
        id: 'test-email-id',
        verification: { status: 'verified' }
      }],
      firstName: 'Test',
      lastName: 'User',
      primaryEmailAddressId: 'test-email-id',
      username: null,
      phoneNumbers: [],
      web3Wallets: [],
      externalAccounts: [],
      samlAccounts: [],
      imageUrl: 'https://via.placeholder.com/150',
      hasImage: false,
      publicMetadata: {},
      unsafeMetadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockAuth = {
      isLoaded: true,
      isSignedIn: true,
      userId: 'test-user-id',
      user: mockUser,
      sessionId: 'test-session-id',
      actor: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      has: () => true,
      signOut: () => Promise.resolve(),
      getToken: () => Promise.resolve('mock-jwt-token'),
    };

    const mockSession = {
      id: 'test-session-id',
      status: 'active',
      user: mockUser,
      getToken: () => Promise.resolve('mock-jwt-token'),
    };

    // Mock various Clerk global states
    (window as unknown as Record<string, unknown>).__clerk_loaded = true;
    (window as unknown as Record<string, unknown>).__clerk_db_jwt = 'mock-jwt-token';
    (window as unknown as Record<string, unknown>).__clerk_ssr_state = {
      sessionId: 'test-session-id',
      userId: 'test-user-id',
      user: mockUser,
      session: mockSession,
    };

    // Override require() to intercept Clerk modules
    if (typeof window !== 'undefined') {
      // Mock module loading by intercepting imports
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url] = args;
        if (typeof url === 'string' && url.includes('@clerk/clerk-js')) {
          // Return mock Clerk module
          return Promise.resolve(new Response(JSON.stringify({})));
        }
        return originalFetch.apply(this, args);
      };

      // Mock Clerk React hooks before they get imported
      (window as unknown as Record<string, unknown>).__CLERK_MOCKS__ = {
        useAuth: () => mockAuth,
        useUser: () => ({ isLoaded: true, isSignedIn: true, user: mockUser }),
        useSession: () => ({ isLoaded: true, session: mockSession }),
        useClerk: () => ({
          loaded: true,
          user: mockUser,
          session: mockSession,
          signOut: () => Promise.resolve(),
        }),
      };

      // Monkey patch module loader for Next.js chunks
      const originalDefine = (window as unknown as Record<string, unknown>).define;
      (window as unknown as Record<string, unknown>).define = function(name: string, deps: string[], factory: Function) {
        if (name && name.includes('@clerk/nextjs')) {
          const mockClerkModule = {
            useAuth: () => mockAuth,
            useUser: () => ({ isLoaded: true, isSignedIn: true, user: mockUser }),
            useSession: () => ({ isLoaded: true, session: mockSession }),
            useClerk: () => ({
              loaded: true,
              user: mockUser,
              session: mockSession,
              signOut: () => Promise.resolve(),
            }),
          };
          return mockClerkModule;
        }
        if (originalDefine) {
          return (originalDefine as any).call(window, name, deps, factory);
        }
      };
    }
  });

  // Mock Clerk API endpoints more comprehensively
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

  // Mock Clerk's script loading
  await page.route('**/clerk.browser.js*', async (route) => {
    const mockClerkScript = `
      window.__clerk_frontend_loaded = true;
      
      // Create a comprehensive Clerk mock with all necessary methods
      const mockClerkInstance = {
        loaded: true,
        addListener: () => {},
        removeListener: () => {},
        on: () => {},
        off: () => {},
        emit: () => {},
        user: {
          id: 'test-user-id',
          emailAddresses: [{ emailAddress: 'test@vemorable.com' }],
          firstName: 'Test',
          lastName: 'User',
        },
        session: {
          id: 'test-session-id',
          status: 'active',
          getToken: () => Promise.resolve('mock-jwt-token'),
        },
        load: () => Promise.resolve(),
        isReady: () => true,
        buildUrl: () => 'https://mock-url.com',
        buildSignInUrl: () => 'https://mock-signin-url.com',
        buildSignUpUrl: () => 'https://mock-signup-url.com',
        buildUserProfileUrl: () => 'https://mock-profile-url.com',
        buildCreateOrganizationUrl: () => 'https://mock-org-url.com',
        buildOrganizationProfileUrl: () => 'https://mock-org-profile-url.com',
        navigate: () => {},
        redirectToSignIn: () => {},
        redirectToSignUp: () => {},
        redirectToUserProfile: () => {},
        redirectToCreateOrganization: () => {},
        redirectToOrganizationProfile: () => {},
        signOut: () => Promise.resolve(),
        openSignIn: () => {},
        openSignUp: () => {},
        openUserProfile: () => {},
        openCreateOrganization: () => {},
        openOrganizationProfile: () => {},
        closeSignIn: () => {},
        closeSignUp: () => {},
        closeUserProfile: () => {},
        closeCreateOrganization: () => {},
        closeOrganizationProfile: () => {},
      };
      
      window.Clerk = mockClerkInstance;
      
      // Mock React module for Clerk hooks
      if (typeof window.__clerk_react_mocks === 'undefined') {
        window.__clerk_react_mocks = true;
        
        // Override the module resolution
        const originalImport = window.__webpack_require__ || window.require;
        if (originalImport) {
          const mockModule = {
            useAuth: () => ({
              isLoaded: true,
              isSignedIn: true,
              userId: 'test-user-id',
              user: window.Clerk.user,
              sessionId: 'test-session-id',
              signOut: () => Promise.resolve(),
              getToken: () => Promise.resolve('mock-jwt-token'),
            }),
            useUser: () => ({ 
              isLoaded: true, 
              isSignedIn: true, 
              user: window.Clerk.user 
            }),
            useSession: () => ({ 
              isLoaded: true, 
              session: window.Clerk.session 
            }),
          };
          
          // Store the mock for later use
          window.__CLERK_NEXTJS_MOCK__ = mockModule;
        }
      }
    `;
    
    await route.fulfill({
      contentType: 'application/javascript',
      body: mockClerkScript,
    });
  });

  // Mock Clerk's client API endpoints
  await page.route('**/clerk/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/me')) {
      await route.fulfill({
        json: {
          object: 'user',
          id: 'test-user-id',
          email_addresses: [
            {
              id: 'test-email-id',
              email_address: 'test@vemorable.com',
              verification: { status: 'verified' }
            }
          ],
          first_name: 'Test',
          last_name: 'User',
        },
      });
    } else {
      await route.continue();
    }
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
  // Wait for any of the possible dashboard states
  try {
    // First, wait for the dashboard to show either loading or content
    await Promise.race([
      page.getByText('Loading your notes...').waitFor({ state: 'visible', timeout: 3000 }),
      page.getByRole('heading', { name: 'My Notes' }).waitFor({ state: 'visible', timeout: 3000 }),
      page.getByText('No notes').waitFor({ state: 'visible', timeout: 3000 }),
    ]);
    
    // If we see loading, wait for it to complete
    const isLoading = await page.getByText('Loading your notes...').isVisible();
    if (isLoading) {
      console.log('Dashboard is loading, waiting for completion...');
      // Wait up to 15 seconds for loading to complete
      await page.getByText('Loading your notes...').waitFor({ state: 'hidden', timeout: 15000 });
    }
    
    // Now wait for the final content
    await Promise.race([
      page.getByRole('heading', { name: 'My Notes' }).waitFor({ state: 'visible', timeout: 5000 }),
      page.getByText('No notes').waitFor({ state: 'visible', timeout: 5000 }),
    ]);
    
    console.log('Dashboard loaded successfully');
  } catch (error) {
    console.log('Dashboard load failed, taking screenshot for debugging');
    await page.screenshot({ path: 'debug-dashboard-load-failure.png', fullPage: true });
    throw error;
  }
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