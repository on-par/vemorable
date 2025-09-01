import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

// Ensure environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  )
}

export function createClient() {
  return createBrowserClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
  )
}

export async function createServerClientInstance() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
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
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export const supabase = createClient()

// Helper function to test the connection
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notes')
      .select('count')
      .limit(1)
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 means the table doesn't exist, which is expected if migrations haven't run
      console.error('Supabase connection test failed:', error)
      return false
    }
    
    console.log('Supabase connection successful!')
    return true
  } catch (err) {
    console.error('Failed to connect to Supabase:', err)
    return false
  }
}