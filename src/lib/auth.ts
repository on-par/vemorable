/**
 * Centralized auth utility that can be easily mocked for tests
 */

import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  user?: {
    id: string;
    emailAddresses: Array<{ emailAddress: string }>;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

/**
 * Server-side test environment check
 */
function isServerTestEnvironment(): boolean {
  return typeof process !== 'undefined' && process.env && 
         (process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === 'true');
}

/**
 * Client-side test environment check
 */
function isClientTestEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for explicit test flag first
  if (window.__PLAYWRIGHT_TEST__) return true;
  
  return (
    window.location.hostname === 'localhost' && 
    (window.navigator.userAgent.includes('playwright') || 
     window.navigator.userAgent.includes('HeadlessChrome') ||
     window.navigator.userAgent.includes('ChromeHeadless'))
  );
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
 * Loading state to prevent hydration mismatch
 */
const LOADING_AUTH_STATE: AuthState = {
  isLoaded: false,
  isSignedIn: false,
  userId: null,
  user: null
};

/**
 * Wrapper around Clerk's useAuth that provides test fallbacks
 * and prevents hydration mismatch
 */
export function useAuth(): AuthState {
  const [isClient, setIsClient] = useState(false);
  const [isTestEnv, setIsTestEnv] = useState(false);

  // Always call hooks at the top level
  const clerkAuth = useClerkAuth();
  const clerkUser = useClerkUser();

  useEffect(() => {
    setIsClient(true);
    setIsTestEnv(isServerTestEnvironment() || isClientTestEnvironment());
  }, []);

  // During SSR or before client hydration, return loading state
  // if we might be in test environment
  if (!isClient && isServerTestEnvironment()) {
    return LOADING_AUTH_STATE;
  }

  // After client-side hydration
  if (isClient && isTestEnv) {
    return TEST_AUTH_STATE;
  }

  // Use clerk auth data if available, otherwise fallback
  try {
    return {
      isLoaded: clerkAuth.isLoaded,
      isSignedIn: !!clerkAuth.isSignedIn,
      userId: clerkAuth.userId || null,
      user: clerkUser.user || null,
    };
  } catch (error) {
    console.warn('Clerk auth error, using fallback:', error);
    // In test environments, return test state; otherwise loading state
    return isClient && isTestEnv ? TEST_AUTH_STATE : LOADING_AUTH_STATE;
  }
}

/**
 * Wrapper around Clerk's useUser that provides test fallbacks
 * and prevents hydration mismatch
 */
export function useUser() {
  const [isClient, setIsClient] = useState(false);
  const [isTestEnv, setIsTestEnv] = useState(false);

  // Always call hooks at the top level
  const clerkUser = useClerkUser();

  useEffect(() => {
    setIsClient(true);
    setIsTestEnv(isServerTestEnvironment() || isClientTestEnvironment());
  }, []);

  // During SSR or before client hydration, return loading state
  // if we might be in test environment
  if (!isClient && isServerTestEnvironment()) {
    return {
      isLoaded: false,
      isSignedIn: false,
      user: null,
    };
  }

  // After client-side hydration
  if (isClient && isTestEnv) {
    return {
      isLoaded: true,
      isSignedIn: true,
      user: TEST_AUTH_STATE.user,
    };
  }

  // Use clerk user data if available, otherwise fallback
  try {
    return clerkUser;
  } catch (error) {
    console.warn('Clerk user error, using fallback:', error);
    return isClient && isTestEnv 
      ? { isLoaded: true, isSignedIn: true, user: TEST_AUTH_STATE.user }
      : { isLoaded: false, isSignedIn: false, user: null };
  }
}