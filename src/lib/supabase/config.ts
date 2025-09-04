import { EnvironmentConfig } from '@/types/env'

/**
 * Validates that all required environment variables are present
 * Throws descriptive errors if any are missing
 */
export function validateEnvironment(): EnvironmentConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const databaseUrl = process.env.DATABASE_URL

  const missingVars: string[] = []

  if (!supabaseUrl) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseAnonKey) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variable${missingVars.length > 1 ? 's' : ''}: ${missingVars.join(', ')}. ` +
      'Please check your .env.local file and ensure all required Supabase environment variables are set. ' +
      'You can find these values in your Supabase project dashboard under Settings > API.'
    )
  }

  return {
    supabaseUrl: supabaseUrl!,
    supabaseAnonKey: supabaseAnonKey!,
    serviceRoleKey,
    databaseUrl,
  }
}

/**
 * Get validated environment configuration
 * Cached to avoid repeated validation
 */
let cachedConfig: EnvironmentConfig | null = null

export function getEnvironmentConfig(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnvironment()
  }
  return cachedConfig
}

/**
 * Reset cached configuration (useful for testing)
 */
export function resetEnvironmentCache(): void {
  cachedConfig = null
}