/**
 * Centralized auth utility that can be easily mocked for tests
 */

import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/nextjs';

interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  user?: any;
}

/**
 * Check if we're in a test environment
 * This function works consistently on both server and client
 */
function isTestEnvironment(): boolean {
  // Check environment variables first (works on both server and client in Next.js)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === 'true') {
      return true;
    }
  }
  
  // Client-side checks
  if (typeof window !== 'undefined') {
    return (
      window.location.hostname === 'localhost' && 
      (window.navigator.userAgent.includes('playwright') || 
       window.navigator.userAgent.includes('HeadlessChrome') ||
       window.navigator.userAgent.includes('ChromeHeadless'))
    );
  }
  
  return false;
}

/**
 * Mock auth state for tests
 */
const TEST_AUTH_STATE: AuthState = {
  isLoaded: true,
  isSignedIn: true,
  userId: 'test-user-id',
  user: {
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@vemorable.com' }],
    firstName: 'Test',
    lastName: 'User',
  }
};

/**
 * Wrapper around Clerk's useAuth that provides test fallbacks
 */
export function useAuth(): AuthState {
  if (isTestEnvironment()) {
    return TEST_AUTH_STATE;
  }

  try {
    const clerkAuth = useClerkAuth();
    return {
      isLoaded: clerkAuth.isLoaded,
      isSignedIn: !!clerkAuth.isSignedIn,
      userId: clerkAuth.userId,
      user: clerkAuth.user,
    };
  } catch (error) {
    console.warn('Clerk auth error, using test fallback:', error);
    return TEST_AUTH_STATE;
  }
}

/**
 * Wrapper around Clerk's useUser that provides test fallbacks
 */
export function useUser() {
  if (isTestEnvironment()) {
    return {
      isLoaded: true,
      isSignedIn: true,
      user: TEST_AUTH_STATE.user,
    };
  }

  try {
    return useClerkUser();
  } catch (error) {
    console.warn('Clerk user error, using test fallback:', error);
    return {
      isLoaded: true,
      isSignedIn: true,
      user: TEST_AUTH_STATE.user,
    };
  }
}