import { NextRequest } from 'next/server'
import { createServerClient } from '../supabase/server'
import { ApiError } from '../supabase/types'

/**
 * Get the authenticated user ID from the request
 * Throws ApiError if user is not authenticated
 */
export async function getAuthenticatedUserId(req: NextRequest): Promise<string> {
  try {
    const supabase = await createServerClient()
    
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED')
    }

    return user.id
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    console.error('Authentication error:', error)
    throw new ApiError('Authentication failed', 401, 'UNAUTHORIZED')
  }
}

/**
 * Get the authenticated user from the request
 * Returns null if user is not authenticated (non-throwing version)
 */
export async function getOptionalUserId(req: NextRequest): Promise<string | null> {
  try {
    return await getAuthenticatedUserId(req)
  } catch {
    return null
  }
}