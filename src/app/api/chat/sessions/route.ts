import { NextRequest } from 'next/server'
import { createServerClientInstance } from '@/lib/supabase'
import {
  successResponse,
  handleApiError,
  getAuthenticatedUserId,
} from '@/lib/api-utils'
import { z } from 'zod'

const createSessionSchema = z.object({
  title: z.string().min(1).max(100).optional(),
})

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = await createServerClientInstance()
    
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Failed to fetch chat sessions:', error)
      throw error
    }
    
    return successResponse({
      sessions: sessions || [],
      count: sessions?.length || 0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = await createServerClientInstance()
    
    const body = await request.json()
    const validatedData = createSessionSchema.parse(body)
    
    const sessionTitle = validatedData.title || `Chat ${new Date().toLocaleDateString()}`
    
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: sessionTitle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to create chat session:', error)
      throw error
    }
    
    return successResponse(session)
  } catch (error) {
    return handleApiError(error)
  }
}