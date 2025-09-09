import { z } from 'zod';

/**
 * Environment validation schema using Zod
 * Provides type-safe environment variable validation for the VeMorable application
 */

// Base schema for common environment variables
const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'Clerk publishable key is required')
    .startsWith('pk_', 'Invalid Clerk publishable key format'),
  
  CLERK_SECRET_KEY: z
    .string()
    .min(1, 'Clerk secret key is required')
    .startsWith('sk_', 'Invalid Clerk secret key format'),
  
  // Optional Clerk URLs
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().optional().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().optional().default('/sign-up'),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('Invalid Supabase URL')
    .refine((url) => url.includes('supabase.co'), 'Must be a valid Supabase URL'),
  
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'Supabase anonymous key is required')
    .startsWith('eyJ', 'Invalid Supabase anonymous key format'),
  
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'Supabase service role key is required')
    .startsWith('eyJ', 'Invalid Supabase service role key format'),
  
  // OpenAI
  OPENAI_API_KEY: z
    .string()
    .min(1, 'OpenAI API key is required')
    .startsWith('sk-', 'Invalid OpenAI API key format'),
  
  // Database
  DATABASE_URL: z
    .string()
    .url('Invalid database URL')
    .refine((url) => url.startsWith('postgresql://'), 'Database URL must be a PostgreSQL connection string'),
  
  // App Configuration
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('Invalid app URL')
    .optional(),
  
  // Webhooks
  WEBHOOK_SECRET: z.string().optional(),
  
  // Sentry (for error monitoring - Task T008)
  SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  
  // Test environment specific
  PLAYWRIGHT_TEST: z.string().optional(),
});

// Development environment schema (less strict)
const developmentEnvSchema = baseEnvSchema.partial({
  CLERK_SECRET_KEY: true,
  SUPABASE_SERVICE_ROLE_KEY: true,
  OPENAI_API_KEY: true,
  DATABASE_URL: true,
}).extend({
  NODE_ENV: z.literal('development'),
});

// Test environment schema (even more relaxed)
const testEnvSchema = z.object({
  NODE_ENV: z.literal('test'),
  
  // Optional Clerk Authentication for tests
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().optional().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().optional().default('/sign-up'),
  
  // Optional Supabase for tests (more lenient URL validation)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // Optional OpenAI for tests
  OPENAI_API_KEY: z.string().optional(),
  
  // Optional Database for tests
  DATABASE_URL: z.string().optional(),
  
  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // Webhooks
  WEBHOOK_SECRET: z.string().optional(),
  
  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  
  // Test environment specific
  PLAYWRIGHT_TEST: z.string().optional(),
});

// Production environment schema (most strict)
const productionEnvSchema = baseEnvSchema.extend({
  NODE_ENV: z.literal('production'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('App URL is required in production')
    .refine((url) => url.startsWith('https://'), 'App URL must use HTTPS in production'),
  
  SENTRY_DSN: z
    .string()
    .url('Sentry DSN is recommended for production')
    .optional(),
  
  WEBHOOK_SECRET: z
    .string()
    .min(32, 'Webhook secret should be at least 32 characters in production')
    .optional(),
});

/**
 * Environment-specific validation schemas
 */
const envSchemas = {
  development: developmentEnvSchema,
  test: testEnvSchema,
  production: productionEnvSchema,
} as const;

/**
 * Validated environment configuration type
 */
export type ValidatedEnv = z.infer<typeof baseEnvSchema> | 
                          z.infer<typeof developmentEnvSchema> | 
                          z.infer<typeof testEnvSchema> | 
                          z.infer<typeof productionEnvSchema>;

/**
 * Environment validation result type
 */
export type EnvValidationResult = {
  success: boolean;
  data?: ValidatedEnv;
  errors?: string[];
};

/**
 * Validates environment variables based on the current NODE_ENV
 */
export function validateEnv(): EnvValidationResult {
  const nodeEnv = (process.env.NODE_ENV || 'development') as keyof typeof envSchemas;
  const schema = envSchemas[nodeEnv] || envSchemas.development;
  
  try {
    const validatedEnv = schema.parse(process.env);
    
    return {
      success: true,
      data: validatedEnv,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      
      return {
        success: false,
        errors,
      };
    }
    
    return {
      success: false,
      errors: ['Unknown validation error occurred'],
    };
  }
}

/**
 * Validates and returns environment configuration
 * Throws an error if validation fails
 */
export function getValidatedEnv(): ValidatedEnv {
  const result = validateEnv();
  
  if (!result.success || !result.data) {
    const errorMessage = [
      'Environment validation failed:',
      ...(result.errors || ['Unknown error']),
      '',
      'Please check your environment variables and ensure all required values are set.',
      'Refer to .env.example for the complete list of required variables.',
    ].join('\n');
    
    throw new Error(errorMessage);
  }
  
  return result.data;
}

/**
 * Environment configuration singleton
 * Validates environment variables once on first access
 */
let envConfig: ValidatedEnv | null = null;

export function getEnv(): ValidatedEnv {
  if (envConfig === null) {
    envConfig = getValidatedEnv();
  }
  
  return envConfig;
}

/**
 * Reset environment configuration cache (for testing)
 */
export function resetEnvCache(): void {
  envConfig = null;
}

/**
 * Utility function to check if we're in a specific environment
 */
export function isEnvironment(env: ValidatedEnv['NODE_ENV']): boolean {
  return getEnv().NODE_ENV === env;
}

/**
 * Utility functions for common environment checks
 */
export const isDevelopment = () => isEnvironment('development');
export const isProduction = () => isEnvironment('production');
export const isTest = () => isEnvironment('test');

/**
 * Utility function to check if we're in a test context (including Playwright)
 */
export function isTestContext(): boolean {
  const env = getEnv();
  return env.NODE_ENV === 'test' || env.PLAYWRIGHT_TEST === 'true';
}

/**
 * Runtime environment validation for application startup
 * Should be called early in the application lifecycle
 */
export function validateEnvironmentOnStartup(): void {
  const result = validateEnv();
  
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    result.errors?.forEach((error) => console.error(`  - ${error}`));
    console.error('\nPlease fix the above errors before starting the application.');
    console.error('Refer to .env.example for required environment variables.\n');
    
    // Exit the process in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  } else {
    const env = result.data!;
    console.log(`✅ Environment validated successfully (${env.NODE_ENV})`);
    
    if (env.NODE_ENV === 'development') {
      console.log('🔧 Running in development mode');
    } else if (env.NODE_ENV === 'production') {
      console.log('🚀 Running in production mode');
    } else if (env.NODE_ENV === 'test') {
      console.log('🧪 Running in test mode');
    }
  }
}

/**
 * Export default environment configuration for convenience
 */
export default getEnv;