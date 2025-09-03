import { NextRequest } from 'next/server'
import { createChatService } from '@/lib/supabase/services'
import { ApiRouteFactory } from '@/lib/api/factory'
import { z } from 'zod'

const createSessionSchema = z.object({
  title: z.string().min(1).max(100).optional(),
})

const factory = new ApiRouteFactory()

export async function GET(request: NextRequest) {
  return factory
  .withAuth()
  .withErrorHandling()
  .createHandler(async (req: NextRequest, context) => {
    const userId = context?.userId
    if (!userId) {
      throw new Error('User ID not found')
    }
    const chatService = await createChatService()
    
    const result = await chatService.getUserSessions(userId)
    
    return {
      success: true,
      data: {
        sessions: result.data || [],
        count: result.count || 0,
      }
    }
  })(request)
}

export async function POST(request: NextRequest) {
  return factory
  .withAuth()
  .withValidation(createSessionSchema)
  .withErrorHandling()
  .createHandler(async (req: NextRequest, context) => {
    const userId = context?.userId
    const validatedData = context?.validatedData as { title?: string }
    if (!userId) {
      throw new Error('User ID not found')
    }
    const chatService = await createChatService()
    
    const sessionTitle = validatedData?.title || `Chat ${new Date().toLocaleDateString()}`
    
    const session = await chatService.createSession(userId, sessionTitle)
    
    return {
      success: true,
      data: session
    }
  })(request)
}