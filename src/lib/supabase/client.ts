import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { getEnvironmentConfig } from './config'

/**
 * Create a Supabase client for use in browser/client components
 * 
 * This client is configured for browser environments and handles:
 * - Browser-based authentication flows
 * - Client-side storage for auth tokens
 * - Real-time subscriptions
 * - Client-side queries and mutations
 */
export function createClient() {
  const config = getEnvironmentConfig()
  
  return createBrowserClient<Database>(
    config.supabaseUrl,
    config.supabaseAnonKey,
    {
      auth: {
        // Enable automatic token refresh
        autoRefreshToken: true,
        // Persist session in localStorage
        persistSession: true,
        // Detect session from URL for OAuth flows
        detectSessionInUrl: true,
      },
      // Configure global options
      global: {
        // Custom headers for all requests
        headers: {
          'X-Client-Info': 'vemorable-browser',
        },
      },
      // Configure database options
      db: {
        // Use connection pooling
        schema: 'public',
      },
      // Configure realtime options
      realtime: {
        // Enable presence tracking
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  )
}

/**
 * Type-safe wrapper for the Supabase client
 * Provides additional methods and type safety
 */
export class SupabaseBrowserClient {
  private client: ReturnType<typeof createClient>

  constructor() {
    this.client = createClient()
  }

  /**
   * Get the underlying Supabase client
   */
  get supabase() {
    return this.client
  }

  /**
   * Check if the client is properly configured
   */
  get isConfigured() {
    return !!(this.client.supabaseUrl && this.client.supabaseKey)
  }

  /**
   * Get current authentication state
   */
  async getAuthState() {
    const { data: { user }, error } = await this.client.auth.getUser()
    const { data: { session } } = await this.client.auth.getSession()
    
    return {
      user,
      session,
      error,
      isAuthenticated: !!user && !error,
    }
  }

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.client.auth.onAuthStateChange(callback)
  }

  /**
   * Create a real-time channel
   */
  createChannel(name: string) {
    return this.client.channel(name)
  }
}

/**
 * Singleton instance for convenience
 * Use sparingly - prefer createClient() for most use cases
 */
let browserClientInstance: SupabaseBrowserClient | null = null

export function getBrowserClient(): SupabaseBrowserClient {
  if (!browserClientInstance) {
    browserClientInstance = new SupabaseBrowserClient()
  }
  return browserClientInstance
}