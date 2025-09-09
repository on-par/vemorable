/**
 * Demo component showing how to integrate Sentry error tracking
 * 
 * This component demonstrates:
 * - Error boundary usage
 * - Manual error tracking
 * - User context setting
 * - Breadcrumb logging
 * 
 * Remove this file after testing Sentry integration.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/lib/auth';
import { 
  setSentryUserContext, 
  setSentryContext, 
  addSentryBreadcrumb, 
  captureException, 
  captureMessage 
} from '../lib/sentry';
import { ErrorBoundary } from './error-boundary';

// Component that will throw an error for testing
function ErrorThrower() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('This is a test error for Sentry!');
  }

  return (
    <button
      onClick={() => setShouldThrow(true)}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Throw Error (Test Error Boundary)
    </button>
  );
}

export function SentryDemo() {
  const { user } = useUser();

  useEffect(() => {
    // Set user context when component mounts
    if (user) {
      // TypeScript workaround for custom auth hook
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSentryUserContext(user as any);
      addSentryBreadcrumb('User context set in SentryDemo', 'user', 'info');
    }

    // Set component context
    setSentryContext({
      feature: 'demo',
      component: 'SentryDemo',
      action: 'component_mount',
    });
  }, [user]);

  const handleManualError = () => {
    try {
      // Simulate some operation that might fail
      throw new Error('This is a manually captured error');
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        feature: 'demo',
        component: 'SentryDemo',
        action: 'manual_error_test',
        additionalData: {
          timestamp: new Date().toISOString(),
          userId: user?.id || 'anonymous',
        },
      });
      
      alert('Error captured! Check your Sentry dashboard.');
    }
  };

  const handleManualMessage = () => {
    captureMessage('This is a test message from SentryDemo', 'info', {
      feature: 'demo',
      component: 'SentryDemo',
      action: 'manual_message_test',
    });
    
    alert('Message captured! Check your Sentry dashboard.');
  };

  const handleBreadcrumb = () => {
    addSentryBreadcrumb(
      'User clicked breadcrumb test button',
      'user',
      'info',
      { buttonType: 'breadcrumb-test' }
    );
    
    alert('Breadcrumb added! This will appear in the next error report.');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        Sentry Integration Demo
      </h2>
      
      <p className="text-gray-600 mb-6">
        This demo shows how Sentry error tracking works in the VeMorable application. 
        Make sure you have configured your Sentry DSN in environment variables.
      </p>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded">
          <h3 className="font-medium text-blue-900 mb-2">Manual Error Capture</h3>
          <button
            onClick={handleManualError}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Capture Manual Error
          </button>
        </div>

        <div className="p-4 bg-green-50 rounded">
          <h3 className="font-medium text-green-900 mb-2">Manual Message Capture</h3>
          <button
            onClick={handleManualMessage}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Capture Manual Message
          </button>
        </div>

        <div className="p-4 bg-yellow-50 rounded">
          <h3 className="font-medium text-yellow-900 mb-2">Breadcrumb Test</h3>
          <button
            onClick={handleBreadcrumb}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Add Breadcrumb
          </button>
        </div>

        <div className="p-4 bg-red-50 rounded">
          <h3 className="font-medium text-red-900 mb-2">Error Boundary Test</h3>
          <ErrorBoundary>
            <ErrorThrower />
          </ErrorBoundary>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-medium text-gray-900 mb-2">Current User Context</h3>
        <pre className="text-sm text-gray-600 bg-white p-2 rounded overflow-auto">
          {JSON.stringify(
            user ? {
              id: user.id,
              email: user.emailAddresses?.[0]?.emailAddress,
              name: user.firstName || 'Anonymous',
            } : { message: 'No user logged in' },
            null,
            2
          )}
        </pre>
      </div>

      <div className="mt-4 p-4 border-l-4 border-blue-500 bg-blue-50">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> This demo component should be removed before production deployment.
          It&apos;s only for testing Sentry integration during development.
        </p>
      </div>
    </div>
  );
}

export default SentryDemo;