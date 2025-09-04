import { NextRequest } from 'next/server'
import { createSearchService } from '@/lib/supabase/services'
import { ApiRouteFactory } from '@/lib/api/factory'
import { generateQueryEmbedding } from '@/lib/embeddings'
import { z } from 'zod'

const searchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().min(1).max(50).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.5),
  type: z.enum(['semantic', 'hybrid', 'keyword']).optional().default('hybrid'),
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
    const searchService = await createSearchService()

    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('query') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const threshold = Math.min(Math.max(parseFloat(searchParams.get('threshold') || '0.5'), 0), 1)
    const type = searchParams.get('type') || 'hybrid'

    const validatedData = searchQuerySchema.parse({
      query,
      limit,
      threshold,
      type,
    })

    if (!validatedData.query) {
      return {
        success: true,
        results: [],
        message: 'No query provided'
      }
    }

    let results: unknown[] = []

    if (validatedData.type === 'keyword') {
      // Keyword-only search
      const searchResults = await searchService.keywordSearch(userId, validatedData.query, {
        limit: validatedData.limit
      })
      results = searchResults.data || []
    } else {
      // Generate embedding for semantic/hybrid search
      const queryEmbeddingResult = await generateQueryEmbedding(validatedData.query)
      
      if (validatedData.type === 'semantic') {
        results = await searchService.semanticSearch(
          userId,
          queryEmbeddingResult.embedding,
          {
            matchThreshold: validatedData.threshold,
            matchCount: validatedData.limit
          }
        )
      } else {
        // Hybrid search (default)
        results = await searchService.hybridSearch(
          userId,
          validatedData.query,
          queryEmbeddingResult.embedding,
          {
            matchThreshold: validatedData.threshold,
            matchCount: validatedData.limit
          }
        )
      }
    }

    return {
      success: true,
      query: validatedData.query,
      results: results || [],
      count: results?.length || 0,
      threshold: validatedData.threshold,
      type: validatedData.type,
    }
  })(request)
}

export async function POST(request: NextRequest) {
  return factory
  .withAuth()
  .withValidation(searchQuerySchema)
  .withErrorHandling()
  .createHandler(async (req: NextRequest, context) => {
    const userId = context?.userId
    const validatedData = context?.validatedData as z.infer<typeof searchQuerySchema>
    if (!userId || !validatedData) {
      throw new Error('Missing required data')
    }
    const searchService = await createSearchService()

    if (!validatedData.query) {
      return {
        success: true,
        results: [],
        message: 'No query provided'
      }
    }

    let results: unknown[] = []

    if (validatedData.type === 'keyword') {
      // Keyword-only search
      const searchResults = await searchService.keywordSearch(userId, validatedData.query, {
        limit: validatedData.limit
      })
      results = searchResults.data || []
    } else {
      // Generate embedding for semantic/hybrid search
      const queryEmbeddingResult = await generateQueryEmbedding(validatedData.query)
      
      if (validatedData.type === 'semantic') {
        results = await searchService.semanticSearch(
          userId,
          queryEmbeddingResult.embedding,
          {
            matchThreshold: validatedData.threshold,
            matchCount: validatedData.limit
          }
        )
      } else {
        // Hybrid search (default)
        results = await searchService.hybridSearch(
          userId,
          validatedData.query,
          queryEmbeddingResult.embedding,
          {
            matchThreshold: validatedData.threshold,
            matchCount: validatedData.limit
          }
        )
      }
    }

    return {
      success: true,
      query: validatedData.query,
      results: results || [],
      count: results?.length || 0,
      threshold: validatedData.threshold,
      type: validatedData.type,
    }
  })(request)
}