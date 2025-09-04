import { NextRequest } from 'next/server'
import { createNotesService } from '@/lib/supabase/services'
import { ApiRouteFactory } from '@/lib/api/factory'
import { updateNoteSchema } from '@/lib/validations'

interface RouteParams {
  params: Promise<{ id: string }>
}

const factory = new ApiRouteFactory()

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  
  return factory
    .withAuth()
    .withErrorHandling()
    .createHandler(async (req: NextRequest, context) => {
      const userId = context?.userId
      if (!userId) {
        throw new Error('User ID not found')
      }
      const notesService = await createNotesService()
      
      const note = await notesService.getNote(id, userId)
      
      if (!note) {
        return {
          success: false,
          error: {
            message: 'Note not found',
            code: 'NOT_FOUND'
          }
        }
      }

      return {
        success: true,
        data: note
      }
    })(request)
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  
  return factory
    .withAuth()
    .withValidation(updateNoteSchema)
    .withErrorHandling()
    .createHandler(async (req: NextRequest, context) => {
      const userId = context?.userId
      const validatedData = context?.validatedData
      if (!userId || !validatedData) {
        throw new Error('Missing required data')
      }
      const notesService = await createNotesService()
      
      const updatedNote = await notesService.updateNote(id, userId, validatedData)

      return {
        success: true,
        data: updatedNote
      }
    })(request)
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const searchParams = request.nextUrl.searchParams
  const hard = searchParams.get('hard') === 'true'
  
  return factory
    .withAuth()
    .withErrorHandling()
    .createHandler(async (req: NextRequest, context) => {
      const userId = context?.userId
      if (!userId) {
        throw new Error('User ID not found')
      }
      const notesService = await createNotesService()
      
      await notesService.deleteNote(id, userId, hard)

      return {
        success: true
      }
    })(request)
}