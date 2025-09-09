'use client';

import { UserButton } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

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
 * Mock UserButton for tests to prevent hydration issues
 */
function MockUserButton() {
  return (
    <div 
      className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600"
      data-testid="mock-user-button"
    >
      T
    </div>
  );
}

/**
 * Loading state component to prevent hydration mismatch
 */
function LoadingUserButton() {
  return (
    <div 
      className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"
      data-testid="loading-user-button"
    />
  );
}

interface TestAwareUserButtonProps {
  afterSignOutUrl?: string;
}

/**
 * UserButton wrapper that renders consistently in test environments
 * and prevents hydration mismatch
 */
export function TestAwareUserButton({ afterSignOutUrl }: TestAwareUserButtonProps) {
  const [isClient, setIsClient] = useState(false);
  const [isTestEnv, setIsTestEnv] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsTestEnv(isServerTestEnvironment() || isClientTestEnvironment());
  }, []);

  // During SSR or before client hydration, return loading state
  // if we might be in test environment
  if (!isClient && isServerTestEnvironment()) {
    return <LoadingUserButton />;
  }

  // Show loading state until client hydration is complete
  if (!isClient) {
    return <LoadingUserButton />;
  }

  // After client-side hydration
  if (isTestEnv) {
    return <MockUserButton />;
  }
  
  return <UserButton afterSignOutUrl={afterSignOutUrl} />;
}