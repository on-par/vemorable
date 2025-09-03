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
    .createHandler(async (req: NextRequest, context: { userId: string; validatedData: any }) => {
      const chatService = await createChatService()
      const { role, content } = context.validatedData
      
      const message = await chatService.addMessage(sessionId, role, content)
      
      return {
        success: true,
        data: message
      }
    })(request)
}