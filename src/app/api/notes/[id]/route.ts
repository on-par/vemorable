import { NextRequest } from 'next/server'
import { createServerClientInstance } from '@/lib/supabase'
import { updateNoteSchema, noteIdSchema } from '@/lib/validations'
import {
  successResponse,
  errorResponse,
  handleApiError,
  getAuthenticatedUserId,
} from '@/lib/api-utils'
import { Database } from '@/types/database'
import { generateNoteEmbedding, formatEmbeddingForPgVector } from '@/lib/embeddings'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getAuthenticatedUserId()
    const { id } = await params
    
    const validatedParams = noteIdSchema.parse({ id })
    const supabase = await createServerClientInstance()

    const { data: note, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', validatedParams.id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Note not found', 'NOT_FOUND', 404)
      }
      throw error
    }

    return successResponse(note)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getAuthenticatedUserId()
    const { id } = await params
    
    const validatedParams = noteIdSchema.parse({ id })
    const body = await request.json()
    const validatedData = updateNoteSchema.parse(body)
    
    const supabase = await createServerClientInstance()

    const { data: existingNote, error: fetchError } = await supabase
      .from('notes')
      .select('id')
      .eq('id', validatedParams.id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existingNote) {
      return errorResponse('Note not found', 'NOT_FOUND', 404)
    }

    // Generate new embedding if content was updated
    let embeddingVector: string | undefined
    if (validatedData.title || validatedData.processed_content || validatedData.tags) {
      try {
        // Fetch the current note data to combine with updates
        const { data: currentNote } = await (supabase
          .from('notes')
          .select('title, processed_content, tags')
          .eq('id', validatedParams.id)
          .eq('user_id', userId)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .single() as any)

        if (currentNote) {
          const embeddingResult = await generateNoteEmbedding(
            validatedData.title || currentNote.title || '',
            validatedData.processed_content || currentNote.processed_content || '',
            validatedData.tags || currentNote.tags || []
          )
          embeddingVector = formatEmbeddingForPgVector(embeddingResult.embedding)
        }
      } catch (embeddingError) {
        console.error('Failed to generate embedding:', embeddingError)
        // Continue without updating embedding
      }
    }

    const updateData: Database['public']['Tables']['notes']['Update'] = {
      ...validatedData,
      updated_at: new Date().toISOString(),
      ...(embeddingVector && { embedding: embeddingVector }),
    }

    const { data: updatedNote, error: updateError } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('notes') as any)
      .update(updateData)
      .eq('id', validatedParams.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return successResponse(updatedNote)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getAuthenticatedUserId()
    const { id } = await params
    
    const validatedParams = noteIdSchema.parse({ id })
    const supabase = await createServerClientInstance()

    const { data: existingNote, error: fetchError } = await supabase
      .from('notes')
      .select('id')
      .eq('id', validatedParams.id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !existingNote) {
      return errorResponse('Note not found', 'NOT_FOUND', 404)
    }

    const { error: deleteError } = await supabase
      .from('notes')
      .delete()
      .eq('id', validatedParams.id)
      .eq('user_id', userId)

    if (deleteError) {
      throw deleteError
    }

    return successResponse({ message: 'Note deleted successfully' }, 200)
  } catch (error) {
    return handleApiError(error)
  }
}