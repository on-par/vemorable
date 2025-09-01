import { NextRequest } from 'next/server'
import { createServerClientInstance } from '@/lib/supabase'
import {
  successResponse,
  handleApiError,
  getAuthenticatedUserId,
} from '@/lib/api-utils'
import { z } from 'zod'

const updateSessionSchema = z.object({
  title: z.string().min(1).max(100).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId()
    const supabase = await createServerClientInstance()
    
    // Fetch the session
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    if (sessionError || !session) {
      return handleApiError(new Error('Chat session not found'))
    }
    
    // Fetch messages for the session
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true })
    
    if (messagesError) {
      console.error('Failed to fetch messages:', messagesError)
      throw messagesError
    }
    
    return successResponse({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(session as any),
      messages: messages || [],
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId()
    const supabase = await createServerClientInstance()
    
    const body = await request.json()
    const validatedData = updateSessionSchema.parse(body)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session, error } = await (supabase as any)
      .from('chat_sessions')
      .update(validatedData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to update chat session:', error)
      throw error
    }
    
    return successResponse(session)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getAuthenticatedUserId()
    const supabase = await createServerClientInstance()
    
    // Delete messages first (cascade delete)
    await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', id)
    
    // Delete the session
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) {
      console.error('Failed to delete chat session:', error)
      throw error
    }
    
    return successResponse({ message: 'Chat session deleted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}