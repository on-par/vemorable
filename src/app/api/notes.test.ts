import { vi } from 'vitest'
import { GET, POST } from './notes/route'
import { NextRequest } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/api/auth'
import { createNotesService } from '@/lib/supabase/services'
import { generateNoteEmbedding, formatEmbeddingForPgVector } from '@/lib/embeddings'
import { ApiError } from '@/lib/supabase/types'

// Mock dependencies
vi.mock('@/lib/api/auth')
vi.mock('@/lib/supabase/services')
vi.mock('@/lib/embeddings')
vi.mock('@/lib/validations', () => ({
  createNoteSchema: {
    parse: vi.fn()
  }
}))

// Import the mocked module for type safety
import { createNoteSchema } from '@/lib/validations'

describe('/api/notes', () => {
  const mockUserId = 'user-123'
  const mockNotesService = {
    getNotes: vi.fn(),
    createNote: vi.fn(),
  }
  
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAuthenticatedUserId as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserId)
    ;(createNotesService as ReturnType<typeof vi.fn>).mockResolvedValue(mockNotesService)
  })

  describe('GET /api/notes', () => {
    const createMockRequest = (params: Record<string, string> = {}) => {
      const url = new URL('http://localhost:3000/api/notes')
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
      return new NextRequest(url)
    }

    it('should fetch notes for authenticated user', async () => {
      const mockNotes = [
        { id: '1', title: 'Note 1', content: 'Content 1' },
        { id: '2', title: 'Note 2', content: 'Content 2' },
      ]
      
      mockNotesService.getNotes.mockResolvedValue({
        data: mockNotes,
        error: null,
        count: 2,
      })

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(mockNotesService.getNotes).toHaveBeenCalledWith(mockUserId, {
        limit: 50,
        offset: 0,
        search: undefined,
        tags: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      })
      expect(data.success).toBe(true)
      expect(data.data.notes).toEqual(mockNotes)
      expect(data.data.pagination).toEqual({
        limit: 50,
        offset: 0,
        total: 2,
      })
    })

    it('should apply search filter when provided', async () => {
      mockNotesService.getNotes.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest({ search: 'test query' })
      await GET(request)

      expect(mockNotesService.getNotes).toHaveBeenCalledWith(mockUserId, {
        limit: 50,
        offset: 0,
        search: 'test query',
        tags: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      })
    })

    it('should filter by tags when provided', async () => {
      mockNotesService.getNotes.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest({ tags: 'tag1,tag2,tag3' })
      await GET(request)

      expect(mockNotesService.getNotes).toHaveBeenCalledWith(mockUserId, {
        limit: 50,
        offset: 0,
        search: undefined,
        tags: ['tag1', 'tag2', 'tag3'],
        sortBy: undefined,
        sortOrder: undefined,
      })
    })

    it('should apply sorting parameters', async () => {
      mockNotesService.getNotes.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const request = createMockRequest({ sortBy: 'title', sortOrder: 'asc' })
      await GET(request)

      expect(mockNotesService.getNotes).toHaveBeenCalledWith(mockUserId, {
        limit: 50,
        offset: 0,
        search: undefined,
        tags: undefined,
        sortBy: 'title',
        sortOrder: 'asc',
      })
    })

    it('should apply pagination parameters', async () => {
      mockNotesService.getNotes.mockResolvedValue({
        data: [],
        error: null,
        count: 100,
      })

      const request = createMockRequest({ limit: '20', offset: '40' })
      await GET(request)

      expect(mockNotesService.getNotes).toHaveBeenCalledWith(mockUserId, {
        limit: 20,
        offset: 40,
        search: undefined,
        tags: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      })
    })

    it('should limit maximum results to 100', async () => {
      mockNotesService.getNotes.mockResolvedValue({
        data: [],
        error: null,
        count: 200,
      })

      const request = createMockRequest({ limit: '150' })
      const response = await GET(request)
      const data = await response.json()

      expect(mockNotesService.getNotes).toHaveBeenCalledWith(mockUserId, {
        limit: 100, // Should be capped at 100
        offset: 0,
        search: undefined,
        tags: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      })
      expect(data.data.pagination.limit).toBe(100)
    })

    it('should handle database errors', async () => {
      mockNotesService.getNotes.mockRejectedValue(
        new ApiError('Database error', 500, 'DATABASE_ERROR')
      )

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
      expect(data.error.code).toBe('DATABASE_ERROR')
    })

    it('should handle authentication errors', async () => {
      ;(getAuthenticatedUserId as ReturnType<typeof vi.fn>).mockRejectedValue(
        new ApiError('Unauthorized', 401, 'UNAUTHORIZED')
      )

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
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

    it('should create a new note with valid data', async () => {
      const noteData = {
        title: 'Test Note',
        raw_transcript: 'Raw transcript',
        processed_content: 'Processed content',
        summary: 'Summary',
        tags: ['test', 'note'],
      }

      const createdNote = { id: 'note-123', ...noteData, user_id: mockUserId }
      mockNotesService.createNote.mockResolvedValue(createdNote)

      // Mock validation schema
      ;(createNoteSchema.parse as ReturnType<typeof vi.fn>).mockReturnValue(noteData)

      const request = createMockRequest(noteData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdNote)
      expect(mockNotesService.createNote).toHaveBeenCalledWith({
        ...noteData,
        user_id: mockUserId,
      })
    })

    it('should create note even if embedding generation fails', async () => {
      const noteData = {
        title: 'Test Note',
        processed_content: 'Content',
        summary: 'Summary',
        tags: [],
      }

      const createdNote = { id: 'note-123', ...noteData, user_id: mockUserId }
      mockNotesService.createNote.mockResolvedValue(createdNote)

      // Mock validation schema
      ;(createNoteSchema.parse as ReturnType<typeof vi.fn>).mockReturnValue(noteData)

      const request = createMockRequest(noteData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdNote)
    })

    it('should reject invalid note data', async () => {
      const invalidData = {
        // Missing required fields
        summary: 'Summary only',
      }

      // Mock validation schema to throw ZodError
      const zodError = new Error('Validation failed')
      zodError.name = 'ZodError'
      ;(createNoteSchema.parse as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw zodError
      })

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

      mockNotesService.createNote.mockRejectedValue(
        new ApiError('Database insert failed', 500, 'DATABASE_ERROR')
      )

      // Mock validation schema
      ;(createNoteSchema.parse as ReturnType<typeof vi.fn>).mockReturnValue(noteData)

      const request = createMockRequest(noteData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('should handle authentication errors', async () => {
      ;(getAuthenticatedUserId as ReturnType<typeof vi.fn>).mockRejectedValue(
        new ApiError('Unauthorized', 401, 'UNAUTHORIZED')
      )

      const request = createMockRequest({
        title: 'Test',
        processed_content: 'Content',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
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
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })
  })
})