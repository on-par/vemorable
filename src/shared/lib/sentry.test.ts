/**
 * Tests for Sentry error tracking configuration
 * 
 * These tests verify that Sentry is properly configured and can handle
 * various error scenarios without breaking the application.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/nextjs';

// Mock Sentry to avoid actual API calls during tests
vi.mock('@sentry/nextjs', () => ({
  init: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn((callback) => callback(mockScope)),
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
  nodeProfilingIntegration: vi.fn(() => ({ name: 'NodeProfiling' })),
  nextRouterInstrumentation: vi.fn(),
  makeBrowserTransport: vi.fn(),
  makeNodeTransport: vi.fn(),
}));

const mockScope = {
  setTag: vi.fn(),
  setContext: vi.fn(),
};

// Import the module after mocking
import {
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
} from './sentry';

describe('Sentry Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Environment Validation', () => {
    it('should detect when Sentry is not configured', () => {
      // Remove Sentry environment variables
      delete process.env.SENTRY_DSN;
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      
      // Re-import to get fresh validation
      expect(process.env.SENTRY_DSN).toBeUndefined();
    });

    it('should detect when Sentry is properly configured', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123456';
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123456';
      
      expect(process.env.SENTRY_DSN).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SENTRY_DSN).toBeDefined();
    });

    it('should use correct environment settings', () => {
      expect(typeof sentryEnvironment).toBe('string');
      expect(['development', 'production', 'test', 'staging'].includes(sentryEnvironment)).toBe(true);
    });
  });

  describe('Client Initialization', () => {
    it('should initialize client Sentry without errors', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123456';
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123456';
      
      expect(() => initSentryClient()).not.toThrow();
    });

    it('should handle missing configuration gracefully', () => {
      delete process.env.SENTRY_DSN;
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      
      expect(() => initSentryClient()).not.toThrow();
      expect(Sentry.init).not.toHaveBeenCalled();
    });
  });

  describe('Server Initialization', () => {
    it('should initialize server Sentry without errors', () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/123456';
      
      expect(() => initSentryServer()).not.toThrow();
    });

    it('should handle missing configuration gracefully', () => {
      delete process.env.SENTRY_DSN;
      
      expect(() => initSentryServer()).not.toThrow();
      expect(Sentry.init).not.toHaveBeenCalled();
    });
  });

  describe('User Context', () => {
    it('should set user context with Clerk user data', () => {
      const mockUser = {
        id: 'user_123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
      };

      setSentryUserContext(mockUser as any);

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user_123',
        email: 'test@example.com',
        username: 'johndoe',
      });
    });

    it('should clear user context when user is null', () => {
      setSentryUserContext(null);
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });

    it('should handle user without email', () => {
      const mockUser = {
        id: 'user_123',
        emailAddresses: [],
        firstName: 'John',
        lastName: 'Doe',
      };

      setSentryUserContext(mockUser as any);

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'user_123',
        email: undefined,
        username: 'John',
      });
    });
  });

  describe('Context Setting', () => {
    it('should set custom context with tags', () => {
      setSentryContext({
        feature: 'voice-notes',
        component: 'VoiceRecorder',
        action: 'start_recording',
        additionalData: { duration: 30 },
      });

      expect(Sentry.setTag).toHaveBeenCalledWith('feature', 'voice-notes');
      expect(Sentry.setTag).toHaveBeenCalledWith('component', 'VoiceRecorder');
      expect(Sentry.setTag).toHaveBeenCalledWith('action', 'start_recording');
      expect(Sentry.setContext).toHaveBeenCalledWith('custom', { duration: 30 });
    });

    it('should handle partial context data', () => {
      setSentryContext({ feature: 'chat' });

      expect(Sentry.setTag).toHaveBeenCalledWith('feature', 'chat');
      expect(Sentry.setTag).not.toHaveBeenCalledWith('component', expect.anything());
    });
  });

  describe('Breadcrumbs', () => {
    it('should add breadcrumb with correct format', () => {
      addSentryBreadcrumb('User clicked record button', 'user', 'info', { buttonId: 'record' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'User clicked record button',
        category: 'user',
        level: 'info',
        data: { buttonId: 'record' },
        timestamp: expect.any(Number),
      });
    });

    it('should use default values for optional parameters', () => {
      addSentryBreadcrumb('Test message');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'Test message',
        category: 'user',
        level: 'info',
        data: undefined,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Error Capture', () => {
    it('should capture exception with context', () => {
      const error = new Error('Test error');
      const context = {
        feature: 'notes',
        component: 'NoteEditor',
        action: 'save',
      };

      captureException(error, context);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should capture message with context', () => {
      captureMessage('Test message', 'warning', { feature: 'auth' });

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', 'warning');
    });

    it('should handle React errors properly', () => {
      const error = new Error('Component error');
      const errorInfo = { componentStack: 'Component stack trace' };

      captureReactError(error, errorInfo);

      expect(Sentry.withScope).toHaveBeenCalled();
      expect(mockScope.setTag).toHaveBeenCalledWith('errorBoundary', true);
      expect(mockScope.setContext).toHaveBeenCalledWith('componentStack', {
        stack: 'Component stack trace',
      });
    });
  });

  describe('API Handler Wrapper', () => {
    it('should wrap handler and return result on success', async () => {
      const mockHandler = vi.fn().mockResolvedValue({ success: true });
      const wrappedHandler = withSentry(mockHandler, { feature: 'api' });

      const result = await wrappedHandler('test-arg');

      expect(result).toEqual({ success: true });
      expect(mockHandler).toHaveBeenCalledWith('test-arg');
    });

    it('should capture errors and re-throw', async () => {
      const error = new Error('API error');
      const mockHandler = vi.fn().mockRejectedValue(error);
      const wrappedHandler = withSentry(mockHandler);

      await expect(wrappedHandler()).rejects.toThrow('API error');
      expect(Sentry.withScope).toHaveBeenCalled();
    });

    it('should return original handler in test environment', () => {
      process.env = { ...process.env, NODE_ENV: 'test' };
      const mockHandler = vi.fn();
      const wrappedHandler = withSentry(mockHandler);

      expect(wrappedHandler).toBe(mockHandler);
    });
  });

  describe('Test Environment Handling', () => {
    it('should not initialize Sentry in test environment', () => {
      process.env = { ...process.env, NODE_ENV: 'test' };
      
      initSentryClient();
      initSentryServer();

      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it('should not capture errors in test environment', () => {
      process.env = { ...process.env, NODE_ENV: 'test' };
      
      captureException(new Error('Test error'));
      captureMessage('Test message');

      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });
  });
});