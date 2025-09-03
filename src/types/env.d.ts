declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    SUPABASE_SERVICE_ROLE_KEY?: string
    DATABASE_URL?: string
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
}