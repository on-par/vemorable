import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock OpenAI before any imports that might use it
vi.mock('openai', () => {
  const OpenAI = vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: { content: 'Mock AI response' }
          }]
        })
      }
    },
    audio: {
      transcriptions: {
        create: vi.fn().mockResolvedValue({
          text: 'Mock transcription'
        })
      }
    },
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      })
    }
  }))
  
  return { default: OpenAI }
})

// Mock the auth function to return a consistent user ID
vi.mock('@/lib/api/auth', () => ({
  getAuthenticatedUserId: vi.fn().mockResolvedValue('test-user-123')
}))

// Mock all service dependencies to prevent actual API calls
vi.mock('@/lib/supabase/services', () => ({
  createNotesService: vi.fn().mockResolvedValue({
    getNotes: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    createNote: vi.fn().mockResolvedValue({ id: 'mock-note', title: 'Mock Note' }),
    updateNote: vi.fn().mockResolvedValue({ id: 'mock-note', title: 'Updated Mock Note' }),
    deleteNote: vi.fn().mockResolvedValue(true)
  }),
  createSearchService: vi.fn().mockResolvedValue({
    searchNotes: vi.fn().mockResolvedValue({ data: [], error: null }),
    vectorSearch: vi.fn().mockResolvedValue({ data: [], error: null })
  }),
  createChatService: vi.fn().mockResolvedValue({
    createSession: vi.fn().mockResolvedValue({ id: 'mock-session' }),
    addMessage: vi.fn().mockResolvedValue({ id: 'mock-message' }),
    getMessages: vi.fn().mockResolvedValue({ data: [], error: null })
  })
}))

vi.mock('@/lib/embeddings', () => ({
  generateNoteEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
  formatEmbeddingForPgVector: vi.fn().mockReturnValue('[0.1,0.1,0.1]')
}))

vi.mock('@/lib/openai', () => ({
  openai: {
    chat: {
      completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'Mock response' } }] }) }
    },
    audio: {
      transcriptions: { create: vi.fn().mockResolvedValue({ text: 'Mock transcription' }) }
    }
  }
}))

vi.mock('@/lib/validations', () => ({
  createNoteSchema: { parse: vi.fn().mockReturnValue({}) },
  updateNoteSchema: { parse: vi.fn().mockReturnValue({}) },
  searchSchema: { parse: vi.fn().mockReturnValue({}) },
  chatSchema: { parse: vi.fn().mockReturnValue({}) },
  processNoteSchema: { parse: vi.fn().mockReturnValue({}) },
  transcribeSchema: { parse: vi.fn().mockReturnValue({}) }
}))

// Import API route handlers after mocking dependencies
import { GET as notesGet, POST as notesPost } from '@/app/api/notes/route'
import { PUT as notesPut, DELETE as notesDelete } from '@/app/api/notes/[id]/route'
import { POST as searchPost } from '@/app/api/search/route'
import { POST as chatPost } from '@/app/api/chat/route'
import { POST as processNotePost } from '@/app/api/process-note/route'
import { POST as transcribePost } from '@/app/api/transcribe/route'

describe('API Rate Limiting Contract Tests', () => {
  const testUserId = 'test-user-123'
  const alternateUserId = 'test-user-456'
  
  // Helper function to create authenticated requests
  const createRequest = (
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    headers?: Record<string, string>
  ) => {
    const url = new URL(`http://localhost:3000${endpoint}`)
    const requestInit: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer mock-token-${testUserId}`,
        ...headers
      }
    }
    
    if (body && method !== 'GET') {
      requestInit.body = JSON.stringify(body)
    }
    
    return new NextRequest(url, {
      ...requestInit,
      signal: requestInit.signal || undefined
    })
  }

  // Helper function to create requests for different users
  const createRequestForUser = (
    userId: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ) => {
    const url = new URL(`http://localhost:3000${endpoint}`)
    const requestInit: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer mock-token-${userId}`
      }
    }
    
    if (body && method !== 'GET') {
      requestInit.body = JSON.stringify(body)
    }
    
    return new NextRequest(url, {
      ...requestInit,
      signal: requestInit.signal || undefined
    })
  }

  // Helper function to make rapid successive requests
  const makeRapidRequests = async (
    requestFactory: () => NextRequest,
    handler: (req: NextRequest) => Promise<Response>,
    count: number
  ) => {
    const promises = Array.from({ length: count }, () => handler(requestFactory()))
    return await Promise.all(promises)
  }

  // Helper function to wait for rate limit reset
  const waitForRateLimitReset = (resetTime: number) => {
    const now = Date.now()
    const waitTime = resetTime * 1000 - now
    return new Promise(resolve => setTimeout(resolve, Math.max(0, waitTime)))
  }

  // Helper to parse rate limit headers
  const parseRateLimitHeaders = (response: Response) => {
    return {
      remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
      limit: parseInt(response.headers.get('X-RateLimit-Limit') || '0'),
      reset: parseInt(response.headers.get('X-RateLimit-Reset') || '0'),
      window: response.headers.get('X-RateLimit-Window'),
      retryAfter: parseInt(response.headers.get('Retry-After') || '0')
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset any rate limit state between tests
    // This assumes rate limiting middleware exists
  })

  afterEach(async () => {
    // Clean up any rate limiting state
    vi.clearAllMocks()
  })

  describe('Notes API Rate Limiting (/api/notes)', () => {
    it('should enforce rate limits on GET /api/notes endpoint', async () => {
      const RATE_LIMIT = 100 // Expected limit per window
      const requestCount = RATE_LIMIT + 5
      
      // Make rapid successive requests exceeding the limit
      const responses = await makeRapidRequests(
        () => createRequest('/api/notes', 'GET'),
        notesGet,
        requestCount
      )
      
      // Check that we get successful responses up to the limit
      const successfulResponses = responses.filter(r => r.status === 200)
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      
      expect(successfulResponses.length).toBeLessThanOrEqual(RATE_LIMIT)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
      
      // Verify rate limit headers on successful responses
      const firstResponse = successfulResponses[0]
      const rateLimitInfo = parseRateLimitHeaders(firstResponse)
      expect(rateLimitInfo.limit).toBe(RATE_LIMIT)
      expect(rateLimitInfo.remaining).toBeLessThanOrEqual(RATE_LIMIT)
      expect(rateLimitInfo.reset).toBeGreaterThan(Date.now() / 1000)
      
      // Verify rate limit response structure
      const rateLimitedResponse = rateLimitedResponses[0]
      const rateLimitedData = await rateLimitedResponse.json()
      
      expect(rateLimitedResponse.status).toBe(429)
      expect(rateLimitedData.success).toBe(false)
      expect(rateLimitedData.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(rateLimitedData.error.message).toContain('rate limit')
      
      // Verify rate limit headers on 429 response
      const rateLimitInfo429 = parseRateLimitHeaders(rateLimitedResponse)
      expect(rateLimitInfo429.remaining).toBe(0)
      expect(rateLimitInfo429.retryAfter).toBeGreaterThan(0)
    })

    it('should enforce rate limits on POST /api/notes endpoint', async () => {
      const RATE_LIMIT = 50 // Lower limit for write operations
      const requestCount = RATE_LIMIT + 3
      
      const noteData = {
        title: 'Test Note',
        processed_content: 'Test content',
        summary: 'Test summary',
        tags: ['test']
      }
      
      const responses = await makeRapidRequests(
        () => createRequest('/api/notes', 'POST', noteData),
        notesPost,
        requestCount
      )
      
      const successfulResponses = responses.filter(r => r.status === 201 || r.status === 200)
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      
      expect(successfulResponses.length).toBeLessThanOrEqual(RATE_LIMIT)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    it('should apply separate rate limits for PUT /api/notes/[id]', async () => {
      const RATE_LIMIT = 30 // Even lower limit for updates
      const requestCount = RATE_LIMIT + 2
      
      const updateData = { title: 'Updated Title' }
      const noteId = 'test-note-123'
      
      // Create a request factory for PUT endpoint
      const createPutRequest = () => {
        const url = new URL(`http://localhost:3000/api/notes/${noteId}`)
        return new NextRequest(url, {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer mock-token-${testUserId}`
          }
        })
      }
      
      const responses = await Promise.all(
        Array.from({ length: requestCount }, () => 
          notesPut(createPutRequest(), { params: Promise.resolve({ id: noteId }) })
        )
      )
      
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    it('should apply separate rate limits for DELETE /api/notes/[id]', async () => {
      const RATE_LIMIT = 20 // Lowest limit for deletes
      const requestCount = RATE_LIMIT + 2
      
      const noteId = 'test-note-456'
      
      const createDeleteRequest = () => {
        const url = new URL(`http://localhost:3000/api/notes/${noteId}`)
        return new NextRequest(url, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer mock-token-${testUserId}`
          }
        })
      }
      
      const responses = await Promise.all(
        Array.from({ length: requestCount }, () =>
          notesDelete(createDeleteRequest(), { params: Promise.resolve({ id: noteId }) })
        )
      )
      
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  describe('Search API Rate Limiting (/api/search)', () => {
    it('should enforce rate limits on search queries', async () => {
      const RATE_LIMIT = 60 // Moderate limit for search
      const requestCount = RATE_LIMIT + 5
      
      const searchData = {
        query: 'test search query',
        limit: 10
      }
      
      const responses = await makeRapidRequests(
        () => createRequest('/api/search', 'POST', searchData),
        searchPost,
        requestCount
      )
      
      const successfulResponses = responses.filter(r => r.status === 200)
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      
      expect(successfulResponses.length).toBeLessThanOrEqual(RATE_LIMIT)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
      
      // Verify search-specific rate limit headers
      const firstResponse = successfulResponses[0]
      const rateLimitInfo = parseRateLimitHeaders(firstResponse)
      expect(rateLimitInfo.window).toBe('search')
    })

    it('should have different rate limits for complex vs simple searches', async () => {
      const COMPLEX_SEARCH_LIMIT = 20
      const complexSearchData = {
        query: 'complex semantic search with multiple filters',
        limit: 50,
        semanticSearch: true,
        filters: { tags: ['work', 'important'], dateRange: '30d' }
      }
      
      const responses = await makeRapidRequests(
        () => createRequest('/api/search', 'POST', complexSearchData),
        searchPost,
        COMPLEX_SEARCH_LIMIT + 3
      )
      
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
      
      // Verify the rate limit info indicates complex search limits
      const rateLimitedResponse = rateLimitedResponses[0]
      const rateLimitInfo = parseRateLimitHeaders(rateLimitedResponse)
      expect(rateLimitInfo.limit).toBe(COMPLEX_SEARCH_LIMIT)
    })
  })

  describe('Chat API Rate Limiting (/api/chat)', () => {
    it('should enforce rate limits on chat interactions', async () => {
      const RATE_LIMIT = 40 // Lower limit for AI chat
      const requestCount = RATE_LIMIT + 3
      
      const chatData = {
        message: 'Tell me about my notes',
        context: ['note1', 'note2']
      }
      
      const responses = await makeRapidRequests(
        () => createRequest('/api/chat', 'POST', chatData),
        chatPost,
        requestCount
      )
      
      const successfulResponses = responses.filter(r => r.status === 200)
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      
      expect(successfulResponses.length).toBeLessThanOrEqual(RATE_LIMIT)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
      
      // Chat should have longer retry times due to resource intensity
      const rateLimitedResponse = rateLimitedResponses[0]
      const rateLimitInfo = parseRateLimitHeaders(rateLimitedResponse)
      expect(rateLimitInfo.retryAfter).toBeGreaterThan(60) // At least 1 minute
    })

    it('should apply stricter limits for chat sessions with large context', async () => {
      const LARGE_CONTEXT_LIMIT = 15
      const largeContextData = {
        message: 'Analyze all my notes and provide insights',
        context: Array.from({ length: 100 }, (_, i) => `note-${i}`), // Large context
        sessionId: 'large-session-123'
      }
      
      const responses = await makeRapidRequests(
        () => createRequest('/api/chat', 'POST', largeContextData),
        chatPost,
        LARGE_CONTEXT_LIMIT + 2
      )
      
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  describe('Process Note API Rate Limiting (/api/process-note)', () => {
    it('should enforce strict rate limits on AI processing', async () => {
      const RATE_LIMIT = 25 // Very low limit for expensive AI operations
      const requestCount = RATE_LIMIT + 2
      
      const processData = {
        transcript: 'This is a long transcript that needs AI processing...',
        enhanceWithAI: true,
        generateTags: true
      }
      
      const responses = await makeRapidRequests(
        () => createRequest('/api/process-note', 'POST', processData),
        processNotePost,
        requestCount
      )
      
      const successfulResponses = responses.filter(r => r.status === 200 || r.status === 201)
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      
      expect(successfulResponses.length).toBeLessThanOrEqual(RATE_LIMIT)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
      
      // Should have very long retry times for AI processing
      const rateLimitedResponse = rateLimitedResponses[0]
      const rateLimitInfo = parseRateLimitHeaders(rateLimitedResponse)
      expect(rateLimitInfo.retryAfter).toBeGreaterThan(120) // At least 2 minutes
    })
  })

  describe('Transcribe API Rate Limiting (/api/transcribe)', () => {
    it('should enforce rate limits on audio transcription', async () => {
      const RATE_LIMIT = 30
      const requestCount = RATE_LIMIT + 2
      
      const transcribeData = {
        audioData: 'base64-encoded-audio-data',
        format: 'webm',
        duration: 60
      }
      
      const responses = await makeRapidRequests(
        () => createRequest('/api/transcribe', 'POST', transcribeData),
        transcribePost,
        requestCount
      )
      
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  describe('Per-User vs Global Rate Limiting', () => {
    it('should apply per-user rate limits independently', async () => {
      const RATE_LIMIT = 50
      
      // User 1 hits rate limit
      const user1Responses = await makeRapidRequests(
        () => createRequestForUser(testUserId, '/api/notes', 'GET'),
        notesGet,
        RATE_LIMIT + 2
      )
      
      const user1RateLimited = user1Responses.filter(r => r.status === 429)
      expect(user1RateLimited.length).toBeGreaterThan(0)
      
      // User 2 should still be able to make requests
      const user2Response = await notesGet(
        createRequestForUser(alternateUserId, '/api/notes', 'GET')
      )
      
      expect(user2Response.status).toBe(200)
      
      // Verify rate limit headers show separate limits
      const user2RateLimitInfo = parseRateLimitHeaders(user2Response)
      expect(user2RateLimitInfo.remaining).toBe(RATE_LIMIT - 1)
    })

    it('should track rate limits separately across different endpoints for same user', async () => {
      // Hit rate limit on notes endpoint
      await makeRapidRequests(
        () => createRequest('/api/notes', 'GET'),
        notesGet,
        55 // Exceed notes rate limit
      )
      
      // Search endpoint should still work
      const searchResponse = await searchPost(
        createRequest('/api/search', 'POST', { query: 'test' })
      )
      
      expect(searchResponse.status).toBe(200)
    })
  })

  describe('Rate Limit Reset Behavior', () => {
    it('should reset rate limits after the specified window', async () => {
      const RATE_LIMIT = 10
      
      // Hit rate limit
      const initialResponses = await makeRapidRequests(
        () => createRequest('/api/notes', 'GET'),
        notesGet,
        RATE_LIMIT + 2
      )
      
      const rateLimitedResponse = initialResponses.find(r => r.status === 429)
      expect(rateLimitedResponse).toBeDefined()
      
      // Get reset time from headers
      const rateLimitInfo = parseRateLimitHeaders(rateLimitedResponse!)
      
      // Wait for reset (in a real test, this would be mocked or use shorter windows)
      await waitForRateLimitReset(rateLimitInfo.reset)
      
      // Should be able to make requests again
      const resetResponse = await notesGet(createRequest('/api/notes', 'GET'))
      expect(resetResponse.status).toBe(200)
      
      // Verify headers show reset limit
      const resetRateLimitInfo = parseRateLimitHeaders(resetResponse)
      expect(resetRateLimitInfo.remaining).toBe(RATE_LIMIT - 1)
    })

    it('should correctly calculate sliding window rate limits', async () => {
      const WINDOW_SIZE = 60 // 60 seconds
      const RATE_LIMIT = 30
      
      // Make requests at the start of window
      const firstBatchResponses = await makeRapidRequests(
        () => createRequest('/api/notes', 'GET'),
        notesGet,
        15
      )
      
      expect(firstBatchResponses.every(r => r.status === 200)).toBe(true)
      
      // Wait half the window
      await new Promise(resolve => setTimeout(resolve, (WINDOW_SIZE / 2) * 1000))
      
      // Should still be able to make more requests
      const secondBatchResponses = await makeRapidRequests(
        () => createRequest('/api/notes', 'GET'),
        notesGet,
        15
      )
      
      expect(secondBatchResponses.every(r => r.status === 200)).toBe(true)
      
      // But additional requests should be rate limited
      const excessResponse = await notesGet(createRequest('/api/notes', 'GET'))
      expect(excessResponse.status).toBe(429)
    })
  })

  describe('Rate Limiting Bypass Attempts', () => {
    it('should prevent rate limit bypass through header manipulation', async () => {
      const RATE_LIMIT = 20
      
      // Try to bypass with different User-Agent headers
      const responses = await Promise.all([
        ...Array.from({ length: RATE_LIMIT + 5 }, (_, i) =>
          notesGet(createRequest('/api/notes', 'GET', undefined, {
            'User-Agent': `TestBot-${i}`,
            'X-Forwarded-For': `192.168.1.${i % 255}`
          }))
        )
      ])
      
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    it('should prevent rate limit bypass through request timing manipulation', async () => {
      const RATE_LIMIT = 15
      
      // Try to bypass with micro-delays between requests
      const responses = []
      for (let i = 0; i < RATE_LIMIT + 3; i++) {
        const response = await notesGet(createRequest('/api/notes', 'GET'))
        responses.push(response)
        
        if (i < RATE_LIMIT + 2) {
          // Tiny delay to try to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }
      
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    it('should prevent rate limit bypass through authentication token rotation', async () => {
      const RATE_LIMIT = 10
      
      // Try to bypass by rotating tokens for same user
      const responses = await Promise.all([
        ...Array.from({ length: RATE_LIMIT + 3 }, (_, i) =>
          notesGet(createRequest('/api/notes', 'GET', undefined, {
            'Authorization': `Bearer mock-token-${testUserId}-${i}`
          }))
        )
      ])
      
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  describe('Distributed Rate Limiting', () => {
    it('should maintain consistent rate limits across multiple server instances', async () => {
      // This test assumes the rate limiting uses a shared store (Redis, database, etc.)
      const RATE_LIMIT = 25
      
      // Simulate requests from different server instances by varying request metadata
      const responses = await Promise.all([
        ...Array.from({ length: RATE_LIMIT + 3 }, (_, i) =>
          notesGet(createRequest('/api/notes', 'GET', undefined, {
            'X-Server-Instance': `instance-${i % 3}`,
            'X-Request-ID': `req-${i}`
          }))
        )
      ])
      
      const successfulResponses = responses.filter(r => r.status === 200)
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      
      expect(successfulResponses.length).toBeLessThanOrEqual(RATE_LIMIT)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
      
      // All responses should have consistent rate limit headers
      successfulResponses.forEach(response => {
        const rateLimitInfo = parseRateLimitHeaders(response)
        expect(rateLimitInfo.limit).toBe(RATE_LIMIT)
      })
    })

    it('should handle distributed rate limit state synchronization', async () => {
      const RATE_LIMIT = 30
      
      // Make requests that would hit multiple server instances
      const batchSize = 10
      const batches = 4 // Total: 40 requests (exceeds limit)
      
      const allResponses = []
      for (let batch = 0; batch < batches; batch++) {
        const batchResponses = await Promise.all(
          Array.from({ length: batchSize }, (_, i) =>
            notesGet(createRequest('/api/notes', 'GET', undefined, {
              'X-Batch': `${batch}`,
              'X-Request': `${i}`
            }))
          )
        )
        allResponses.push(...batchResponses)
        
        // Small delay between batches to simulate network distribution
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      const rateLimitedResponses = allResponses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
      
      // Verify that rate limiting kicked in at approximately the right point
      const successfulResponsesCount = allResponses.filter(r => r.status === 200).length
      expect(successfulResponsesCount).toBeLessThanOrEqual(RATE_LIMIT + 5) // Allow some variance for distributed timing
    })
  })

  describe('Rate Limit Error Response Format', () => {
    it('should return properly formatted rate limit error responses', async () => {
      const RATE_LIMIT = 5
      
      // Hit rate limit quickly
      await makeRapidRequests(
        () => createRequest('/api/notes', 'GET'),
        notesGet,
        RATE_LIMIT + 1
      )
      
      // Get a rate limited response
      const rateLimitedResponse = await notesGet(createRequest('/api/notes', 'GET'))
      expect(rateLimitedResponse.status).toBe(429)
      
      // Verify response structure
      const responseData = await rateLimitedResponse.json()
      
      expect(responseData).toMatchObject({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: expect.stringContaining('rate limit'),
          details: expect.objectContaining({
            limit: RATE_LIMIT,
            window: expect.any(String),
            retryAfter: expect.any(Number)
          })
        }
      })
      
      // Verify required headers are present
      expect(rateLimitedResponse.headers.get('X-RateLimit-Limit')).toBeTruthy()
      expect(rateLimitedResponse.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(rateLimitedResponse.headers.get('X-RateLimit-Reset')).toBeTruthy()
      expect(rateLimitedResponse.headers.get('Retry-After')).toBeTruthy()
    })

    it('should include helpful rate limit information in error responses', async () => {
      // Hit rate limit on a specific endpoint
      await makeRapidRequests(
        () => createRequest('/api/process-note', 'POST', { transcript: 'test' }),
        processNotePost,
        26 // Exceed process-note rate limit
      )
      
      const rateLimitedResponse = await processNotePost(
        createRequest('/api/process-note', 'POST', { transcript: 'test' })
      )
      
      const responseData = await rateLimitedResponse.json()
      
      expect(responseData.error.details).toMatchObject({
        endpoint: '/api/process-note',
        method: 'POST',
        userId: testUserId,
        limit: expect.any(Number),
        window: expect.any(String),
        retryAfter: expect.any(Number),
        resetTime: expect.any(String)
      })
    })
  })
})