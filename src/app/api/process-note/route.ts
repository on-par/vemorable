import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  successResponse, 
  handleApiError, 
  getAuthenticatedUserId 
} from '@/lib/api-utils'
import { processNoteWithAI } from '@/lib/openai'

const processNoteSchema = z.object({
  transcript: z.string()
    .min(1, 'Transcript is required')
    .max(10000, 'Transcript is too long (max 10000 characters)'),
})

export type ProcessNoteRequest = z.infer<typeof processNoteSchema>

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await getAuthenticatedUserId()

    // Parse and validate request body
    const body = await request.json()
    const validatedData = processNoteSchema.parse(body)

    // Process the transcript with AI
    const processedNote = await processNoteWithAI(validatedData.transcript)

    return successResponse({
      userId,
      originalTranscript: validatedData.transcript,
      processedContent: processedNote.cleanedTranscript,
      title: processedNote.title,
      summary: processedNote.summary,
      tags: processedNote.tags,
    })
  } catch (error) {
    return handleApiError(error)
  }
}