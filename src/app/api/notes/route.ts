import { NextRequest } from 'next/server'
import { createServerClientInstance } from '@/lib/supabase'
import { createNoteSchema } from '@/lib/validations'
import {
  successResponse,
  handleApiError,
  getAuthenticatedUserId,
} from '@/lib/api-utils'
import { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = await createServerClientInstance()

    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)

    if (search) {
      query = query.or(`title.ilike.%${search}%,processed_content.ilike.%${search}%`)
    }

    if (tags.length > 0) {
      query = query.contains('tags', tags)
    }

    if (sortBy === 'created_at' || sortBy === 'updated_at' || sortBy === 'title') {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    query = query.range(offset, offset + limit - 1)

    const { data: notes, error, count } = await query

    if (error) {
      throw error
    }

    return successResponse({
      notes: notes || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = await createServerClientInstance()

    const body = await request.json()
    const validatedData = createNoteSchema.parse(body)

    const noteData: Database['public']['Tables']['notes']['Insert'] = {
      ...validatedData,
      user_id: userId,
    }

    const { data: note, error } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('notes') as any)
      .insert(noteData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return successResponse(note, 201)
  } catch (error) {
    return handleApiError(error)
  }
}