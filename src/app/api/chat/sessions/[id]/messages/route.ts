import { NextRequest } from 'next/server'
import { createChatService } from '@/lib/supabase/services'
import { ApiRouteFactory } from '@/lib/api/factory'
import { z } from 'zod'

const addMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

const factory = new ApiRouteFactory()

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: sessionId } = await params
  
  return factory
    .withAuth()
    .withValidation(addMessageSchema)
    .withErrorHandling()
    .createHandler(async (req: NextRequest, context) => {
      const userId = context?.userId
      const validatedData = context?.validatedData as { role: 'user' | 'assistant' | 'system'; content: string }
      if (!userId || !validatedData) {
        throw new Error('Missing required data')
      }
      const chatService = await createChatService()
      const { role, content } = validatedData
      
      const message = await chatService.addMessage(sessionId, role, content)
      
      return {
        success: true,
        data: message
      }
    })(request)
}