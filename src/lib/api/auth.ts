import { auth } from '@clerk/nextjs/server'
import { ApiError } from '../supabase/types'

/**
 * Get the authenticated user ID from the request
 * Throws ApiError if user is not authenticated
 */
export async function getAuthenticatedUserId(): Promise<string> {
  try {
    // Try to get the user from Clerk
    const { userId } = await auth()

    if (!userId) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED')
    }

    return userId
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
export async function getOptionalUserId(): Promise<string | null> {
  try {
    return await getAuthenticatedUserId()
  } catch {
    return null
  }
}