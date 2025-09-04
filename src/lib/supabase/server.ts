import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { getEnvironmentConfig } from './config'

/**
 * Create a Supabase client for use in server components, route handlers, and server actions
 * 
 * This client is configured for server environments and handles:
 * - Server-side authentication with cookie management
 * - Automatic token refresh via middleware
 * - Server-side queries and mutations
 * - Service role operations (when configured)
 */
export async function createServerClient() {
  const config = getEnvironmentConfig()
  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(
    config.supabaseUrl,
    config.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      auth: {
        // Enable automatic token refresh
        autoRefreshToken: true,
        // Don't persist session on server (handled by cookies)
        persistSession: false,
        // Don't detect session from URL on server
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'vemorable-server',
        },
      },
    }
  )
}

/**
 * Create a Supabase client with service role key for admin operations
 * Use with extreme caution - bypasses RLS policies
 */
export async function createServiceClient() {
  const config = getEnvironmentConfig()
  
  if (!config.serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for service client. ' +
      'This should only be used for admin operations and must be kept secure.'
    )
  }

  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(
    config.supabaseUrl,
    config.serviceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component limitation
          }
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'vemorable-service',
          'Authorization': `Bearer ${config.serviceRoleKey}`,
        },
      },
    }
  )
}

/**
 * Type-safe wrapper for the Supabase server client
 * Provides additional methods and error handling
 */
export class SupabaseServerClient {
  private client: Awaited<ReturnType<typeof createServerClient>>

  constructor(client: Awaited<ReturnType<typeof createServerClient>>) {
    this.client = client
  }

  /**
   * Get the underlying Supabase client
   */
  get supabase() {
    return this.client
  }

  /**
   * Get current user (server-side safe)
   * Always use this instead of getSession() for authentication checks
   */
  async getCurrentUser() {
    const { data: { user }, error } = await this.client.auth.getUser()
    
    if (error) {
      console.error('Error getting current user:', error)
      return null
    }
    
    return user
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const user = await this.getCurrentUser()
    return !!user
  }

  /**
   * Get user ID or throw if not authenticated
   */
  async requireAuth() {
    const user = await this.getCurrentUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    return user.id
  }

  /**
   * Execute RPC with proper error handling
   */
  async rpc<T = unknown>(
    functionName: string, 
    params?: Record<string, unknown>
  ): Promise<T> {
    const { data, error } = params 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? await (this.client.rpc as any)(functionName, params)
      : await this.client.rpc(functionName)
    
    if (error) {
      console.error(`RPC ${functionName} error:`, error)
      throw error
    }
    
    return data
  }

  /**
   * Execute query with proper error handling
   */
  async query<T = unknown>(
    queryBuilder: unknown
  ): Promise<T> {
    const { data, error } = await queryBuilder as { data: T; error: unknown }
    
    if (error) {
      console.error('Query error:', error)
      throw error
    }
    
    return data
  }
}

/**
 * Create a wrapped server client instance
 */
export async function createWrappedServerClient() {
  const client = await createServerClient()
  return new SupabaseServerClient(client)
}