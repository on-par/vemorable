import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateEnv,
  getValidatedEnv,
  getEnv,
  isEnvironment,
  isDevelopment,
  isProduction,
  isTest,
  isTestContext,
  validateEnvironmentOnStartup,
  resetEnvCache,
} from './env';

// Mock environment variables
const mockValidEnv = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_mock_key',
  CLERK_SECRET_KEY: 'sk_test_mock_secret',
  NEXT_PUBLIC_SUPABASE_URL: 'https://mock.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJmock_anon_key',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJmock_service_role_key',
  OPENAI_API_KEY: 'sk-mock_openai_key',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  PLAYWRIGHT_TEST: 'true',
};

describe('Environment Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Clear environment and set test defaults
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_') || 
          key.startsWith('CLERK_') || 
          key.startsWith('SUPABASE_') ||
          key.startsWith('OPENAI_') ||
          key.startsWith('DATABASE_') ||
          key.startsWith('SENTRY_') ||
          key === 'NODE_ENV' ||
          key === 'PLAYWRIGHT_TEST') {
        delete process.env[key];
      }
    });
    // Reset the environment cache
    resetEnvCache();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetEnvCache();
  });

  describe('validateEnv', () => {
    it('should validate a complete test environment successfully', () => {
      Object.assign(process.env, mockValidEnv);
      
      const result = validateEnv();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.NODE_ENV).toBe('test');
    });

    it('should fail validation when required variables are missing', () => {
      Object.assign(process.env, { NODE_ENV: 'production' });
      
      const result = validateEnv();
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should validate development environment with partial requirements', () => {
      Object.assign(process.env, {
        NODE_ENV: 'development',
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_dev_key',
        NEXT_PUBLIC_SUPABASE_URL: 'https://dev.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJdev_anon_key',
      });
      
      const result = validateEnv();
      
      expect(result.success).toBe(true);
      expect(result.data?.NODE_ENV).toBe('development');
    });

    it('should validate production environment with strict requirements', () => {
      const productionEnv = {
        ...mockValidEnv,
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_URL: 'https://vemorable.com',
        SENTRY_DSN: 'https://sentry.io/mock-dsn',
        WEBHOOK_SECRET: 'super_secret_webhook_key_with_32_chars',
      };
      
      Object.assign(process.env, productionEnv);
      
      const result = validateEnv();
      
      expect(result.success).toBe(true);
      expect(result.data?.NODE_ENV).toBe('production');
      expect(result.data?.NEXT_PUBLIC_APP_URL).toBe('https://vemorable.com');
    });

    it('should fail production validation without HTTPS app URL', () => {
      const productionEnv = {
        ...mockValidEnv,
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_URL: 'http://vemorable.com', // HTTP instead of HTTPS
      };
      
      Object.assign(process.env, productionEnv);
      
      const result = validateEnv();
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => 
        error.includes('App URL must use HTTPS in production')
      )).toBe(true);
    });

    it('should validate Clerk key formats', () => {
      Object.assign(process.env, {
        ...mockValidEnv,
        NODE_ENV: 'production', // Use production for stricter validation
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'invalid_key_format',
        CLERK_SECRET_KEY: 'invalid_secret_format',
        NEXT_PUBLIC_APP_URL: 'https://vemorable.com',
      });
      
      const result = validateEnv();
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => 
        error.includes('Invalid Clerk publishable key format')
      )).toBe(true);
      expect(result.errors?.some(error => 
        error.includes('Invalid Clerk secret key format')
      )).toBe(true);
    });

    it('should validate OpenAI API key format', () => {
      Object.assign(process.env, {
        ...mockValidEnv,
        NODE_ENV: 'production', // Use production for stricter validation
        OPENAI_API_KEY: 'invalid_openai_key',
        NEXT_PUBLIC_APP_URL: 'https://vemorable.com',
      });
      
      const result = validateEnv();
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => 
        error.includes('Invalid OpenAI API key format')
      )).toBe(true);
    });

    it('should validate Supabase URL format', () => {
      resetEnvCache(); // Reset cache before setting new environment
      Object.assign(process.env, {
        ...mockValidEnv,
        NODE_ENV: 'production', // Use production mode for stricter validation
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.com', // Does not contain supabase.co
        NEXT_PUBLIC_APP_URL: 'https://vemorable.com',
      });
      
      const result = validateEnv();
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => 
        error.includes('Must be a valid Supabase URL')
      )).toBe(true);
    });
  });

  describe('getValidatedEnv', () => {
    it('should return validated environment when validation passes', () => {
      Object.assign(process.env, mockValidEnv);
      
      const env = getValidatedEnv();
      
      expect(env.NODE_ENV).toBe('test');
      expect(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe(mockValidEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
    });

    it('should throw error when validation fails', () => {
      Object.assign(process.env, { NODE_ENV: 'production' });
      // Missing required production variables
      
      expect(() => getValidatedEnv()).toThrow('Environment validation failed');
    });
  });

  describe('environment utility functions', () => {
    beforeEach(() => {
      Object.assign(process.env, mockValidEnv);
    });

    it('should correctly identify test environment', () => {
      expect(isTest()).toBe(true);
      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(false);
      expect(isEnvironment('test')).toBe(true);
    });

    it('should correctly identify test context with Playwright', () => {
      expect(isTestContext()).toBe(true);
    });

    it('should correctly identify test context without Playwright', () => {
      delete process.env.PLAYWRIGHT_TEST;
      expect(isTestContext()).toBe(true); // Still true because NODE_ENV is test
    });

    it('should identify development environment', () => {
      resetEnvCache(); // Reset cache before setting new environment
      Object.assign(process.env, { ...mockValidEnv, NODE_ENV: 'development' });
      delete process.env.PLAYWRIGHT_TEST;
      
      expect(isDevelopment()).toBe(true);
      expect(isTest()).toBe(false);
      expect(isProduction()).toBe(false);
      expect(isTestContext()).toBe(false);
    });

    it('should identify production environment', () => {
      resetEnvCache(); // Reset cache before setting new environment
      Object.assign(process.env, {
        ...mockValidEnv,
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_URL: 'https://vemorable.com',
      });
      delete process.env.PLAYWRIGHT_TEST;
      
      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(false);
      expect(isTest()).toBe(false);
      expect(isTestContext()).toBe(false);
    });
  });

  describe('validateEnvironmentOnStartup', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = {
        log: vi.spyOn(console, 'log').mockImplementation(() => {}),
        error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      };
    });

    afterEach(() => {
      consoleSpy.log.mockRestore();
      consoleSpy.error.mockRestore();
    });

    it('should log success message when validation passes', () => {
      Object.assign(process.env, mockValidEnv);
      
      validateEnvironmentOnStartup();
      
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Environment validated successfully (test)');
      expect(consoleSpy.log).toHaveBeenCalledWith('🧪 Running in test mode');
    });

    it('should log error messages when validation fails', () => {
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      
      Object.assign(process.env, { NODE_ENV: 'production' });
      // Missing required variables
      
      expect(() => validateEnvironmentOnStartup()).toThrow('process.exit called');
      
      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Environment validation failed:');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Please fix the above errors')
      );
      
      mockExit.mockRestore();
    });

    it('should log appropriate message for development environment', () => {
      resetEnvCache(); // Reset cache before setting new environment
      Object.assign(process.env, {
        ...mockValidEnv,
        NODE_ENV: 'development',
      });
      
      validateEnvironmentOnStartup();
      
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Environment validated successfully (development)');
      expect(consoleSpy.log).toHaveBeenCalledWith('🔧 Running in development mode');
    });

    it('should log appropriate message for production environment', () => {
      resetEnvCache(); // Reset cache before setting new environment
      Object.assign(process.env, {
        ...mockValidEnv,
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_URL: 'https://vemorable.com',
      });
      
      validateEnvironmentOnStartup();
      
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Environment validated successfully (production)');
      expect(consoleSpy.log).toHaveBeenCalledWith('🚀 Running in production mode');
    });
  });

  describe('singleton behavior', () => {
    it('should cache environment configuration', () => {
      Object.assign(process.env, mockValidEnv);
      
      const env1 = getEnv();
      const env2 = getEnv();
      
      expect(env1).toBe(env2); // Same reference
      expect(env1.NODE_ENV).toBe('test');
    });
  });
});