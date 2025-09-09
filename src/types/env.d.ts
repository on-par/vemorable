declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    SUPABASE_SERVICE_ROLE_KEY?: string
    DATABASE_URL?: string
    
    // Sentry configuration
    SENTRY_DSN?: string
    NEXT_PUBLIC_SENTRY_DSN?: string
    SENTRY_ORG?: string
    SENTRY_PROJECT?: string
    SENTRY_ENVIRONMENT?: string
    SENTRY_RELEASE?: string
    NEXT_PUBLIC_SENTRY_ENVIRONMENT?: string
    SENTRY_AUTH_TOKEN?: string
  }
}

// Validate environment variables at compile time
export type RequiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
}

// Runtime environment validation helper
export interface EnvironmentConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  serviceRoleKey?: string
  databaseUrl?: string
  
  // Sentry configuration
  sentryDsn?: string
  sentryEnvironment?: string
  sentryRelease?: string
}

// Sentry-specific environment validation
export interface SentryConfig {
  dsn?: string
  environment: string
  release: string
  org?: string
  project?: string
  authToken?: string
}