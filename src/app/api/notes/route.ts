import { NextRequest, NextResponse } from 'next/server'
import { createNotesService } from '@/lib/supabase/services'
import { getAuthenticatedUserId } from '@/lib/api/auth'
import { createNoteSchema } from '@/lib/validations'
import { ApiError } from '@/lib/supabase/types'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId(request)
    const notesService = await createNotesService()
    
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || undefined
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined
    const sortBy = searchParams.get('sortBy') || undefined
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : searchParams.get('sortOrder') === 'asc' ? 'asc' : undefined

    const result = await notesService.getNotes(userId, {
      limit,
      offset,
      search,
      tags,
      sortBy,
      sortOrder,
    })

    return NextResponse.json({
      success: true,
      data: {
        notes: result.data || [],
        pagination: {
          limit,
          offset,
          total: result.count || 0,
        },
      }
    })
  } catch (error) {
    console.error('GET /api/notes error:', error)
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
          },
        },
        { status: error.status }
      )
    }

    // Handle unauthorized errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
            details: {},
          },
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_ERROR',
          details: {},
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId(request)
    const notesService = await createNotesService()
    
    const body = await request.json()
    const validatedData = createNoteSchema.parse(body)
    
    const noteData = {
      ...validatedData,
      user_id: userId,
    }

    const note = await notesService.createNote(noteData)

    return NextResponse.json({
      success: true,
      data: note
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/notes error:', error)
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
          },
        },
        { status: error.status }
      )
    }

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: error,
          },
        },
        { status: 400 }
      )
    }

    // Handle unauthorized errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
            details: {},
          },
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_ERROR',
          details: {},
        },
      },
      { status: 500 }
    )
  }
}