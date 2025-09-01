import { NextRequest } from 'next/server'
import { createServerClientInstance } from '@/lib/supabase'
import {
  successResponse,
  handleApiError,
  getAuthenticatedUserId,
} from '@/lib/api-utils'
import { generateQueryEmbedding, formatEmbeddingForPgVector } from '@/lib/embeddings'
import { z } from 'zod'

const searchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().min(1).max(50).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.5),
})

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = await createServerClientInstance()

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const threshold = Math.min(Math.max(parseFloat(searchParams.get('threshold') || '0.5'), 0), 1)

    const validatedData = searchQuerySchema.parse({
      query,
      limit,
      threshold,
    })

    if (!validatedData.query) {
      return successResponse({ results: [], message: 'No query provided' })
    }

    // Generate embedding for the search query
    const queryEmbeddingResult = await generateQueryEmbedding(validatedData.query)
    const queryVector = formatEmbeddingForPgVector(queryEmbeddingResult.embedding)

    // Perform similarity search using pgvector
    // Using cosine similarity (<=> operator) with a threshold
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: results, error } = await (supabase as any).rpc('search_notes', {
      query_embedding: queryVector,
      match_threshold: validatedData.threshold,
      match_count: validatedData.limit,
      user_id_filter: userId,
    })

    if (error) {
      console.error('Search error:', error)
      throw error
    }

    return successResponse({
      query: validatedData.query,
      results: results || [],
      count: results?.length || 0,
      threshold: validatedData.threshold,
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
    const validatedData = searchQuerySchema.parse(body)

    if (!validatedData.query) {
      return successResponse({ results: [], message: 'No query provided' })
    }

    // Generate embedding for the search query
    const queryEmbeddingResult = await generateQueryEmbedding(validatedData.query)
    const queryVector = formatEmbeddingForPgVector(queryEmbeddingResult.embedding)

    // Perform similarity search using pgvector
    // Using cosine similarity (<=> operator) with a threshold
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: results, error } = await (supabase as any).rpc('search_notes', {
      query_embedding: queryVector,
      match_threshold: validatedData.threshold,
      match_count: validatedData.limit,
      user_id_filter: userId,
    })

    if (error) {
      console.error('Search error:', error)
      throw error
    }

    return successResponse({
      query: validatedData.query,
      results: results || [],
      count: results?.length || 0,
      threshold: validatedData.threshold,
    })
  } catch (error) {
    return handleApiError(error)
  }
}