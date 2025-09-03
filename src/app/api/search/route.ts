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

export const GET = factory
  .withAuth()
  .withErrorHandling()
  .createHandler(async (req: NextRequest, context: { userId: string }) => {
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

    let results: any[] = []

    if (validatedData.type === 'keyword') {
      // Keyword-only search
      const searchResults = await searchService.keywordSearch(context.userId, validatedData.query, {
        limit: validatedData.limit
      })
      results = searchResults.data || []
    } else {
      // Generate embedding for semantic/hybrid search
      const queryEmbeddingResult = await generateQueryEmbedding(validatedData.query)
      
      if (validatedData.type === 'semantic') {
        results = await searchService.semanticSearch(
          context.userId,
          queryEmbeddingResult.embedding,
          {
            matchThreshold: validatedData.threshold,
            matchCount: validatedData.limit
          }
        )
      } else {
        // Hybrid search (default)
        results = await searchService.hybridSearch(
          context.userId,
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
  })

export const POST = factory
  .withAuth()
  .withValidation(searchQuerySchema)
  .withErrorHandling()
  .createHandler(async (req: NextRequest, context: { userId: string; validatedData: any }) => {
    const searchService = await createSearchService()
    const validatedData = context.validatedData

    if (!validatedData.query) {
      return {
        success: true,
        results: [],
        message: 'No query provided'
      }
    }

    let results: any[] = []

    if (validatedData.type === 'keyword') {
      // Keyword-only search
      const searchResults = await searchService.keywordSearch(context.userId, validatedData.query, {
        limit: validatedData.limit
      })
      results = searchResults.data || []
    } else {
      // Generate embedding for semantic/hybrid search
      const queryEmbeddingResult = await generateQueryEmbedding(validatedData.query)
      
      if (validatedData.type === 'semantic') {
        results = await searchService.semanticSearch(
          context.userId,
          queryEmbeddingResult.embedding,
          {
            matchThreshold: validatedData.threshold,
            matchCount: validatedData.limit
          }
        )
      } else {
        // Hybrid search (default)
        results = await searchService.hybridSearch(
          context.userId,
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
  })