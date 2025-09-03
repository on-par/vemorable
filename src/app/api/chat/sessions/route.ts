import { NextRequest } from 'next/server'
import { createChatService } from '@/lib/supabase/services'
import { ApiRouteFactory } from '@/lib/api/factory'
import { z } from 'zod'

const createSessionSchema = z.object({
  title: z.string().min(1).max(100).optional(),
})

const factory = new ApiRouteFactory()

export const GET = factory
  .withAuth()
  .withErrorHandling()
  .createHandler(async (req: NextRequest, context: { userId: string }) => {
    const chatService = await createChatService()
    
    const result = await chatService.getUserSessions(context.userId)
    
    return {
      success: true,
      data: {
        sessions: result.data || [],
        count: result.count || 0,
      }
    }
  })

export const POST = factory
  .withAuth()
  .withValidation(createSessionSchema)
  .withErrorHandling()
  .createHandler(async (req: NextRequest, context: { userId: string; validatedData: any }) => {
    const chatService = await createChatService()
    
    const sessionTitle = context.validatedData.title || `Chat ${new Date().toLocaleDateString()}`
    
    const session = await chatService.createSession(context.userId, sessionTitle)
    
    return {
      success: true,
      data: session
    }
  })