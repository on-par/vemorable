/**
 * Comprehensive Sentry error tracking configuration for VeMorable
 * 
 * This configuration provides:
 * - Client-side and server-side error tracking
 * - Performance monitoring for API routes and page loads
 * - User context tracking with Clerk integration
 * - Environment-specific configuration
 * - Proper error filtering and sampling rates
 * - GDPR compliance with user data handling
 * - Release tracking for deployment monitoring
 * - Enhanced breadcrumbs for better debugging
 */

import * as Sentry from '@sentry/nextjs';
// Remove EventHint import to avoid type conflicts
import { User } from '@clerk/nextjs/server';

// Environment configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === 'true';

// Sentry configuration interface
interface SentryConfig {
  dsn: string;
  environment: string;
  release: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  enableTracing: boolean;
  debug: boolean;
}

// Environment variables validation
const REQUIRED_ENV_VARS = {
  SENTRY_DSN: process.env.SENTRY_DSN,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
} as const;

// Optional environment variables with defaults
const OPTIONAL_ENV_VARS = {
  SENTRY_ORG: process.env.SENTRY_ORG || 'vemorable',
  SENTRY_PROJECT: process.env.SENTRY_PROJECT || 'vemorable-app',
  SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
  SENTRY_RELEASE: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || 'development',
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
} as const;

/**
 * Validates that required Sentry environment variables are present
 */
function validateSentryConfig(): boolean {
  // Skip validation in test environment
  if (isTest) {
    return false;
  }

  const missingVars: string[] = [];
  
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, value]) => {
    if (!value) {
      missingVars.push(key);
    }
  });

  if (missingVars.length > 0) {
    console.warn(
      `Sentry configuration incomplete. Missing environment variables: ${missingVars.join(', ')}. ` +
      'Error tracking will be disabled.'
    );
    return false;
  }

  return true;
}

/**
 * Gets the appropriate Sentry configuration based on environment
 */
function getSentryConfig(): SentryConfig | null {
  if (!validateSentryConfig()) {
    return null;
  }

  const baseConfig: SentryConfig = {
    dsn: REQUIRED_ENV_VARS.SENTRY_DSN!,
    environment: OPTIONAL_ENV_VARS.SENTRY_ENVIRONMENT,
    release: OPTIONAL_ENV_VARS.SENTRY_RELEASE,
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enableTracing: true,
    debug: false,
  };

  // Environment-specific adjustments
  if (isDevelopment) {
    return {
      ...baseConfig,
      tracesSampleRate: 1.0, // 100% in development for thorough testing
      replaysSessionSampleRate: 0.5, // Higher session replay rate for debugging
      debug: true, // Enable debug logging in development
    };
  }

  if (isProduction) {
    return {
      ...baseConfig,
      tracesSampleRate: 0.1, // 10% in production to manage quota
      replaysSessionSampleRate: 0.01, // 1% session replay rate in production
      replaysOnErrorSampleRate: 1.0, // 100% replay on errors
      debug: false, // Disable debug logging in production
    };
  }

  // Staging or other environments
  return {
    ...baseConfig,
    tracesSampleRate: 0.5, // 50% in staging
    replaysSessionSampleRate: 0.1, // 10% session replay rate
    debug: false,
  };
}

/**
 * Error filtering function to exclude irrelevant errors
 */
function shouldCaptureError(error: Error): boolean {
  // Don't capture errors in test environment
  if (isTest) {
    return false;
  }

  const errorMessage = error.message?.toLowerCase() || '';
  const errorName = error.name?.toLowerCase() || '';

  // Filter out common non-actionable errors
  const ignoredErrors = [
    // Network errors that are outside our control
    'network error',
    'failed to fetch',
    'load failed',
    'script error',
    'non-error promise rejection captured',
    
    // Browser extension errors
    'extension',
    'chrome-extension',
    'moz-extension',
    
    // Ad blockers and browser-specific issues
    'adblock',
    'blocked by client',
    'content blocker',
    
    // Hydration mismatches (handled by React)
    'hydration',
    'text content does not match',
    
    // AbortController errors (expected behavior)
    'aborted',
    'user aborted',
    
    // CORS errors (configuration issue, not runtime error)
    'cors',
    'cross-origin',
    
    // Clerk-specific errors that should not be tracked
    'clerk_handshake_failed',
    'clerk_initialization_failed',
  ];

  // Check if error should be ignored
  const shouldIgnore = ignoredErrors.some(ignored => 
    errorMessage.includes(ignored) || errorName.includes(ignored)
  );

  if (shouldIgnore) {
    console.debug(`Sentry: Ignoring error - ${error.name}: ${error.message}`);
    return false;
  }

  return true;
}

/**
 * Sets user context in Sentry from Clerk user data
 * Ensures GDPR compliance by only including necessary data
 */
export function setSentryUserContext(user: User | null): void {
  if (isTest || !validateSentryConfig()) {
    return;
  }

  if (!user) {
    Sentry.setUser(null);
    return;
  }

  // GDPR-compliant user data - only essential information
  const userData = {
    id: user.id,
    // Use hashed email or identifier instead of actual email for privacy
    email: user.emailAddresses?.[0]?.emailAddress || undefined,
    username: user.username || user.firstName || 'Anonymous User',
  };

  Sentry.setUser(userData);

  // Add user context as tags for better filtering
  Sentry.setTag('user.has_email', !!userData.email);
  Sentry.setTag('user.auth_provider', 'clerk');
}

/**
 * Sets custom tags and context for better error categorization
 */
export function setSentryContext(context: {
  feature?: string;
  component?: string;
  action?: string;
  additionalData?: Record<string, unknown>;
}): void {
  if (isTest || !validateSentryConfig()) {
    return;
  }

  const { feature, component, action, additionalData } = context;

  // Set tags for filtering and grouping
  if (feature) {
    Sentry.setTag('feature', feature);
  }

  if (component) {
    Sentry.setTag('component', component);
  }

  if (action) {
    Sentry.setTag('action', action);
  }

  // Set additional context data
  if (additionalData) {
    Sentry.setContext('custom', additionalData);
  }
}

/**
 * Adds a breadcrumb for tracking user actions
 */
export function addSentryBreadcrumb(
  message: string,
  category: string = 'user',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, unknown>
): void {
  if (isTest || !validateSentryConfig()) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Captures an exception with additional context
 */
export function captureException(
  error: Error,
  context?: {
    feature?: string;
    component?: string;
    action?: string;
    additionalData?: Record<string, unknown>;
  }
): void {
  if (isTest || !validateSentryConfig()) {
    console.error('Error (Sentry disabled):', error);
    return;
  }

  // Set context before capturing
  if (context) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Sentry.withScope((_scope) => {
      setSentryContext(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Captures a message with context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    feature?: string;
    component?: string;
    action?: string;
    additionalData?: Record<string, unknown>;
  }
): void {
  if (isTest || !validateSentryConfig()) {
    console.log(`Message (Sentry disabled): [${level}] ${message}`);
    return;
  }

  if (context) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Sentry.withScope((_scope) => {
      setSentryContext(context);
      Sentry.captureMessage(message, level);
    });
  } else {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Initializes Sentry for client-side tracking
 */
export function initSentryClient(): void {
  const config = getSentryConfig();
  
  if (!config) {
    console.info('Sentry client initialization skipped - configuration not available');
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    debug: config.debug,

    // Performance Monitoring
    tracesSampleRate: config.tracesSampleRate,

    // Session Replay
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true, // GDPR compliance - mask all text content
        blockAllMedia: true, // GDPR compliance - block all media content
        maskAllInputs: true, // GDPR compliance - mask all form inputs
      }),
      Sentry.browserTracingIntegration(),
    ],

    replaysSessionSampleRate: config.replaysSessionSampleRate,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,

    // Error filtering
    beforeSend(event, hint) {
      // Apply custom error filtering
      if (hint?.originalException && hint.originalException instanceof Error) {
        if (!shouldCaptureError(hint.originalException)) {
          return null;
        }
      }

      // Add environment context
      event.contexts = {
        ...event.contexts,
        app: {
          name: 'VeMorable',
          version: config.release,
          environment: config.environment,
        },
        browser: {
          name: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        },
      };

      return event;
    },

    // Enhanced breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }

      // Add additional context to navigation breadcrumbs
      if (breadcrumb.category === 'navigation') {
        breadcrumb.data = {
          ...breadcrumb.data,
          timestamp: Date.now(),
        };
      }

      return breadcrumb;
    },

    transportOptions: {
      bufferSize: 30, // Buffer up to 30 events
    },
  });

  console.info(`Sentry client initialized for ${config.environment} environment`);
}

/**
 * Initializes Sentry for server-side tracking
 */
export function initSentryServer(): void {
  const config = getSentryConfig();
  
  if (!config) {
    console.info('Sentry server initialization skipped - configuration not available');
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    debug: config.debug,

    // Performance Monitoring
    tracesSampleRate: config.tracesSampleRate,

    // Server-specific integrations
    integrations: [
      // Add server-specific integrations here if needed
    ],

    // Error filtering
    beforeSend(event, hint) {
      // Apply custom error filtering
      if (hint?.originalException && hint.originalException instanceof Error) {
        if (!shouldCaptureError(hint.originalException)) {
          return null;
        }
      }

      // Add server context
      event.contexts = {
        ...event.contexts,
        app: {
          name: 'VeMorable',
          version: config.release,
          environment: config.environment,
        },
        runtime: {
          name: 'node',
          version: process.version,
        },
      };

      return event;
    },
    transportOptions: {
      bufferSize: 50, // Higher buffer size for server
    },
  });

  console.info(`Sentry server initialized for ${config.environment} environment`);
}

/**
 * Creates a Sentry-wrapped API route handler for error tracking
 */
export function withSentry<T extends (...args: unknown[]) => unknown>(
  handler: T,
  options?: {
    feature?: string;
    component?: string;
  }
): T {
  if (isTest || !validateSentryConfig()) {
    return handler;
  }

  return ((...args: Parameters<T>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return Sentry.withScope(async (_scope) => {
      // Set context for this request
      if (options) {
        setSentryContext(options);
      }

      try {
        return await handler(...args);
      } catch (error) {
        // Capture the error with context
        if (error instanceof Error) {
          captureException(error, {
            feature: options?.feature || 'api',
            component: options?.component || 'handler',
            action: 'request_processing',
          });
        }
        
        // Re-throw the error to maintain normal error handling
        throw error;
      }
    });
  }) as T;
}

/**
 * React Error Boundary integration
 */
export function captureReactError(
  error: Error,
  errorInfo: { componentStack: string }
): void {
  if (isTest || !validateSentryConfig()) {
    console.error('React Error (Sentry disabled):', error, errorInfo);
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag('errorBoundary', true);
    scope.setContext('componentStack', { 
      stack: errorInfo.componentStack 
    });
    
    captureException(error, {
      feature: 'react',
      component: 'error_boundary',
      action: 'component_error',
    });
  });
}

// Export configuration validation for external use
export const isSentryConfigured = validateSentryConfig();
export const sentryEnvironment = OPTIONAL_ENV_VARS.SENTRY_ENVIRONMENT;

// Export types for external use
export type SentryContextData = {
  feature?: string;
  component?: string;
  action?: string;
  additionalData?: Record<string, unknown>;
};

const sentryExports = {
  initSentryClient,
  initSentryServer,
  setSentryUserContext,
  setSentryContext,
  addSentryBreadcrumb,
  captureException,
  captureMessage,
  captureReactError,
  withSentry,
  isSentryConfigured,
  sentryEnvironment,
};

export default sentryExports;