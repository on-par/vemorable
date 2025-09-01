import { NextRequest } from 'next/server'
import { createServerClientInstance } from '@/lib/supabase'
import {
  successResponse,
  handleApiError,
  getAuthenticatedUserId,
} from '@/lib/api-utils'
import { z } from 'zod'

const addMessagesSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1),
  })).min(1),
})

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId()
    const supabase = await createServerClientInstance()
    
    const body = await request.json()
    const validatedData = addMessagesSchema.parse(body)
    
    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    if (sessionError || !session) {
      return handleApiError(new Error('Chat session not found'))
    }
    
    // Prepare messages for insertion
    const messagesToInsert = validatedData.messages.map(msg => ({
      session_id: id,
      role: msg.role,
      content: msg.content,
    }))
    
    // Insert messages
    const { data: messages, error } = await supabase
      .from('chat_messages')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(messagesToInsert as any)
      .select()
    
    if (error) {
      console.error('Failed to add messages:', error)
      throw error
    }
    
    return successResponse({
      messages: messages || [],
      count: messages?.length || 0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}