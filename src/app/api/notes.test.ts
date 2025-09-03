import { GET, POST } from './notes/route'
import { NextRequest } from 'next/server'
import { createServerClientInstance } from '@/lib/supabase'
import { getAuthenticatedUserId } from '@/lib/api-utils'
import { generateNoteEmbedding, formatEmbeddingForPgVector } from '@/lib/embeddings'

// Mock dependencies
jest.mock('@/lib/supabase')
jest.mock('@/lib/api-utils')
jest.mock('@/lib/embeddings')

describe('/api/notes', () => {
  const mockUserId = 'user-123'
  const mockSupabase = {
    from: jest.fn(),
  }
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getAuthenticatedUserId as jest.Mock).mockResolvedValue(mockUserId)
    ;(createServerClientInstance as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('GET /api/notes', () => {
    const createMockRequest = (params: Record<string, string> = {}) => {
      const url = new URL('http://localhost:3000/api/notes')
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
      return new NextRequest(url)
    }

    const setupMockQuery = () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      }
      mockSupabase.from.mockReturnValue(mockQuery)
      return mockQuery
    }

    it('should fetch notes for authenticated user', async () => {
      const mockNotes = [
        { id: '1', title: 'Note 1', content: 'Content 1' },
        { id: '2', title: 'Note 2', content: 'Content 2' },
      ]
      
      const mockQuery = setupMockQuery()
      mockQuery.range.mockResolvedValue({
        data: mockNotes,
        error: null,
        count: 2,
      })

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(mockSupabase.from).toHaveBeenCalledWith('notes')
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUserId)
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(data.success).toBe(true)
      expect(data.data.notes).toEqual(mockNotes)
      expect(data.data.pagination).toEqual({
        limit: 50,
        offset: 0,
        total: 2,
      })
    })

    it('should apply search filter when provided', async () => {
      const mockQuery = setupMockQuery()
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest({ search: 'test query' })
      await GET(request)

      expect(mockQuery.or).toHaveBeenCalledWith(
        'title.ilike.%test query%,processed_content.ilike.%test query%'
      )
    })

    it('should filter by tags when provided', async () => {
      const mockQuery = setupMockQuery()
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest({ tags: 'tag1,tag2,tag3' })
      await GET(request)

      expect(mockQuery.contains).toHaveBeenCalledWith('tags', ['tag1', 'tag2', 'tag3'])
    })

    it('should apply sorting parameters', async () => {
      const mockQuery = setupMockQuery()
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest({ sortBy: 'title', sortOrder: 'asc' })
      await GET(request)

      expect(mockQuery.order).toHaveBeenCalledWith('title', { ascending: true })
    })

    it('should apply pagination parameters', async () => {
      const mockQuery = setupMockQuery()
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 100,
      })

      const request = createMockRequest({ limit: '20', offset: '40' })
      await GET(request)

      expect(mockQuery.range).toHaveBeenCalledWith(40, 59) // offset to offset+limit-1
    })

    it('should limit maximum results to 100', async () => {
      const mockQuery = setupMockQuery()
      mockQuery.range.mockResolvedValue({
        data: [],
        error: null,
        count: 200,
      })

      const request = createMockRequest({ limit: '150' })
      const response = await GET(request)
      const data = await response.json()

      expect(mockQuery.range).toHaveBeenCalledWith(0, 99) // max 100 items
      expect(data.data.pagination.limit).toBe(100)
    })

    it('should handle database errors', async () => {
      const mockQuery = setupMockQuery()
      mockQuery.range.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
        count: null,
      })

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('should handle authentication errors', async () => {
      ;(getAuthenticatedUserId as jest.Mock).mockRejectedValue(
        new Error('Unauthorized')
      )

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })

  describe('POST /api/notes', () => {
    const createMockRequest = (body: any) => {
      return new NextRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const setupMockInsert = () => {
      const mockInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      }
      mockSupabase.from.mockReturnValue(mockInsert)
      return mockInsert
    }

    it('should create a new note with valid data', async () => {
      const noteData = {
        title: 'Test Note',
        raw_transcript: 'Raw transcript',
        processed_content: 'Processed content',
        summary: 'Summary',
        tags: ['test', 'note'],
      }

      const mockEmbedding = [0.1, 0.2, 0.3]
      ;(generateNoteEmbedding as jest.Mock).mockResolvedValue({
        embedding: mockEmbedding,
      })
      ;(formatEmbeddingForPgVector as jest.Mock).mockReturnValue('[0.1,0.2,0.3]')

      const mockInsert = setupMockInsert()
      mockInsert.single.mockResolvedValue({
        data: { id: 'note-123', ...noteData, user_id: mockUserId },
        error: null,
      })

      const request = createMockRequest(noteData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('note-123')
      expect(generateNoteEmbedding).toHaveBeenCalledWith(
        noteData.title,
        noteData.processed_content,
        noteData.tags
      )
      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...noteData,
          user_id: mockUserId,
          embedding: '[0.1,0.2,0.3]',
        })
      )
    })

    it('should create note even if embedding generation fails', async () => {
      const noteData = {
        title: 'Test Note',
        processed_content: 'Content',
        summary: 'Summary',
        tags: [],
      }

      ;(generateNoteEmbedding as jest.Mock).mockRejectedValue(
        new Error('Embedding API error')
      )
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const mockInsert = setupMockInsert()
      mockInsert.single.mockResolvedValue({
        data: { id: 'note-123', ...noteData },
        error: null,
      })

      const request = createMockRequest(noteData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to generate embedding:',
        expect.any(Error)
      )
      expect(mockInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...noteData,
          user_id: mockUserId,
          embedding: null,
        })
      )

      consoleErrorSpy.mockRestore()
    })

    it('should reject invalid note data', async () => {
      const invalidData = {
        // Missing required fields
        summary: 'Summary only',
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should handle database insert errors', async () => {
      const noteData = {
        title: 'Test Note',
        processed_content: 'Content',
        summary: 'Summary',
        tags: [],
      }

      const mockInsert = setupMockInsert()
      mockInsert.single.mockResolvedValue({
        data: null,
        error: new Error('Database insert failed'),
      })

      const request = createMockRequest(noteData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('should handle authentication errors', async () => {
      ;(getAuthenticatedUserId as jest.Mock).mockRejectedValue(
        new Error('Unauthorized')
      )

      const request = createMockRequest({
        title: 'Test',
        processed_content: 'Content',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})