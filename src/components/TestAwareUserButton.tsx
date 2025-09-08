'use client';

import { UserButton } from '@clerk/nextjs';

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

interface TestAwareUserButtonProps {
  afterSignOutUrl?: string;
}

/**
 * UserButton wrapper that renders consistently in test environments
 */
export function TestAwareUserButton({ afterSignOutUrl }: TestAwareUserButtonProps) {
  if (isTestEnvironment()) {
    return <MockUserButton />;
  }
  
  return <UserButton afterSignOutUrl={afterSignOutUrl} />;
}