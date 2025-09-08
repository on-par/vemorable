import { vi } from 'vitest'
import { createNotesService, createSearchService, createChatService } from '../../supabase/services'
import { modernizeApiRoutes, ApiRouteFactory } from '../factory'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '../auth'

// Mock the services
vi.mock('../../supabase/services')
vi.mock('../auth')
vi.mock('../../embeddings')

const mockCreateNotesService = createNotesService as any
const mockCreateSearchService = createSearchService as any
const mockCreateChatService = createChatService as any
const mockGetAuthenticatedUserId = getAuthenticatedUserId as any

// Mock embeddings
const { generateQueryEmbedding } = require('../../embeddings')
const mockGenerateQueryEmbedding = generateQueryEmbedding as any

// Mock services
const mockNotesService = {
  createNote: vi.fn(),
  getNotes: vi.fn(),
  getNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  getUserTags: vi.fn(),
}

const mockSearchService = {
  semanticSearch: vi.fn(),
  hybridSearch: vi.fn(),
  keywordSearch: vi.fn(),
}

const mockChatService = {
  createSession: vi.fn(),
  getUserSessions: vi.fn(),
  addMessage: vi.fn(),
  getSessionHistory: vi.fn(),
  updateSessionTitle: vi.fn(),
  deleteSession: vi.fn(),
}

mockCreateNotesService.mockResolvedValue(mockNotesService as any)
mockCreateSearchService.mockResolvedValue(mockSearchService as any)
mockCreateChatService.mockResolvedValue(mockChatService as any)
mockGetAuthenticatedUserId.mockResolvedValue('test-user-id')

// Mock embedding generation
mockGenerateQueryEmbedding.mockResolvedValue({
  embedding: new Array(1536).fill(0.1), // Mock embedding vector
  usage: { total_tokens: 10, prompt_tokens: 10, completion_tokens: 0 }
})

describe('Modern API Route Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ApiRouteFactory', () => {
    it('should create standardized API route handlers', () => {
      const factory = new ApiRouteFactory()
      
      expect(factory).toBeDefined()
      expect(typeof factory.createHandler).toBe('function')
      expect(typeof factory.withAuth).toBe('function')
      expect(typeof factory.withValidation).toBe('function')
      expect(typeof factory.withErrorHandling).toBe('function')
    })

    it('should support method chaining for route configuration', () => {
      const factory = new ApiRouteFactory()
      
      const handler = factory
        .withAuth()
        .withValidation()
        .withErrorHandling()
        .createHandler(async () => ({ success: true }))
      
      expect(handler).toBeDefined()
      expect(typeof handler).toBe('function')
    })

    it('should create type-safe route handlers', async () => {
      const factory = new ApiRouteFactory()
      
      const handler = factory
        .withAuth()
        .createHandler(async (_req: NextRequest, context) => {
          expect(context?.userId).toBe('test-user-id')
          return { success: true, data: { userId: context?.userId } }
        })

      const mockRequest = new NextRequest('http://localhost:3000/api/test')
      const response = await handler(mockRequest)
      
      expect(response).toBeInstanceOf(NextResponse)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.userId).toBe('test-user-id')
    })
  })

  describe('Modernized Notes API', () => {
    describe('GET /api/notes', () => {
      it('should use NotesService instead of direct database calls', async () => {
        const mockNotes = [
          {
            id: 'note-1',
            user_id: 'test-user-id',
            title: 'Test Note',
            processed_content: 'Test content',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
          }
        ]

        mockNotesService.getNotes.mockResolvedValue({
          data: mockNotes,
          error: null,
          count: 1
        })

        const { GET } = await import('@/app/api/notes/route')
        const mockRequest = new NextRequest('http://localhost:3000/api/notes?limit=10')
        
        const response = await GET(mockRequest)
        const data = await response.json()

        expect(mockCreateNotesService).toHaveBeenCalled()
        expect(mockNotesService.getNotes).toHaveBeenCalledWith('test-user-id', {
          limit: 10,
          offset: 0,
          search: undefined,
          tags: undefined,
          sortBy: undefined,
          sortOrder: undefined
        })
        expect(data.success).toBe(true)
        expect(data.data.notes).toEqual(mockNotes)
      })

      it('should handle pagination parameters correctly', async () => {
        mockNotesService.getNotes.mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })

        const { GET } = await import('@/app/api/notes/route')
        const mockRequest = new NextRequest('http://localhost:3000/api/notes?limit=20&offset=10&sortBy=title&sortOrder=asc')
        
        await GET(mockRequest)

        expect(mockNotesService.getNotes).toHaveBeenCalledWith('test-user-id', {
          limit: 20,
          offset: 10,
          search: undefined,
          tags: undefined,
          sortBy: 'title',
          sortOrder: 'asc'
        })
      })

      it('should handle search and filtering parameters', async () => {
        mockNotesService.getNotes.mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })

        const { GET } = await import('@/app/api/notes/route')
        const mockRequest = new NextRequest('http://localhost:3000/api/notes?search=test&tags=work,important')
        
        await GET(mockRequest)

        expect(mockNotesService.getNotes).toHaveBeenCalledWith('test-user-id', {
          limit: 50,
          offset: 0,
          search: 'test',
          tags: ['work', 'important'],
          sortBy: undefined,
          sortOrder: undefined
        })
      })
    })

    describe('POST /api/notes', () => {
      it('should use NotesService for note creation', async () => {
        const mockNote = {
          id: 'note-1',
          user_id: 'test-user-id',
          title: 'New Note',
          processed_content: 'New content',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        }

        mockNotesService.createNote.mockResolvedValue(mockNote)

        const { POST } = await import('@/app/api/notes/route')
        const mockRequest = new NextRequest('http://localhost:3000/api/notes', {
          method: 'POST',
          body: JSON.stringify({
            title: 'New Note',
            processed_content: 'New content',
            summary: 'Test summary',
            tags: ['test']
          })
        })
        
        const response = await POST(mockRequest)
        const data = await response.json()

        expect(mockCreateNotesService).toHaveBeenCalled()
        expect(mockNotesService.createNote).toHaveBeenCalledWith({
          title: 'New Note',
          processed_content: 'New content',
          summary: 'Test summary',
          tags: ['test'],
          user_id: 'test-user-id'
        })
        expect(data.success).toBe(true)
        expect(data.data).toEqual(mockNote)
      })

      it('should validate input data using Zod schemas', async () => {
        const { POST } = await import('@/app/api/notes/route')
        const mockRequest = new NextRequest('http://localhost:3000/api/notes', {
          method: 'POST',
          body: JSON.stringify({
            // Missing required fields
            title: ''
          })
        })
        
        const response = await POST(mockRequest)
        const data = await response.json()

        expect(data.success).toBe(false)
        expect(data.error.code).toBe('VALIDATION_ERROR')
        expect(mockNotesService.createNote).not.toHaveBeenCalled()
      })
    })

    describe('PUT /api/notes/[id]', () => {
      it('should use NotesService for updates', async () => {
        const mockUpdatedNote = {
          id: 'note-1',
          user_id: 'test-user-id',
          title: 'Updated Note',
          processed_content: 'Updated content',
          updated_at: '2024-01-01T01:00:00.000Z',
        }

        mockNotesService.updateNote.mockResolvedValue(mockUpdatedNote)

        const { PUT } = await import('@/app/api/notes/[id]/route')
        const mockRequest = new NextRequest('http://localhost:3000/api/notes/note-1', {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Updated Note',
            processed_content: 'Updated content'
          })
        })
        
        const response = await PUT(mockRequest, { params: Promise.resolve({ id: 'note-1' }) })
        const data = await response.json()

        expect(mockNotesService.updateNote).toHaveBeenCalledWith('note-1', 'test-user-id', {
          title: 'Updated Note',
          processed_content: 'Updated content'
        })
        expect(data.success).toBe(true)
        expect(data.data).toEqual(mockUpdatedNote)
      })
    })

    describe('DELETE /api/notes/[id]', () => {
      it('should use NotesService for deletion', async () => {
        mockNotesService.deleteNote.mockResolvedValue(undefined)

        const { DELETE } = await import('@/app/api/notes/[id]/route')
        const mockRequest = new NextRequest('http://localhost:3000/api/notes/note-1', {
          method: 'DELETE'
        })
        
        const response = await DELETE(mockRequest, { params: Promise.resolve({ id: 'note-1' }) })
        const data = await response.json()

        expect(mockNotesService.deleteNote).toHaveBeenCalledWith('note-1', 'test-user-id', false)
        expect(data.success).toBe(true)
      })

      it('should support hard delete when specified', async () => {
        mockNotesService.deleteNote.mockResolvedValue(undefined)

        const { DELETE } = await import('@/app/api/notes/[id]/route')
        const mockRequest = new NextRequest('http://localhost:3000/api/notes/note-1?hard=true', {
          method: 'DELETE'
        })
        
        await DELETE(mockRequest, { params: Promise.resolve({ id: 'note-1' }) })

        expect(mockNotesService.deleteNote).toHaveBeenCalledWith('note-1', 'test-user-id', true)
      })
    })
  })

  describe('Modernized Search API', () => {
    describe('GET /api/search', () => {
      it('should use SearchService instead of direct RPC calls', async () => {
        const mockSearchResults = [
          {
            id: 'note-1',
            title: 'Matching Note',
            processed_content: 'Content that matches',
            similarity: 0.85
          }
        ]

        mockSearchService.hybridSearch.mockResolvedValue(mockSearchResults)

        const { GET } = await import('@/app/api/search/route')
        const mockRequest = new NextRequest('http://localhost:3000/api/search?query=test%20query&threshold=0.7&limit=5')
        
        const response = await GET(mockRequest)
        const data = await response.json()

        expect(mockCreateSearchService).toHaveBeenCalled()
        expect(mockSearchService.hybridSearch).toHaveBeenCalledWith(
          'test-user-id',
          'test query',
          expect.any(Array), // embedding vector
          { matchThreshold: 0.7, matchCount: 5 }
        )
        expect(data.success).toBe(true)
        expect(data.results).toEqual(mockSearchResults)
      })

      it('should handle semantic-only search', async () => {
        const mockSearchResults = [
          { id: 'note-1', similarity: 0.9 }
        ]

        mockSearchService.semanticSearch.mockResolvedValue(mockSearchResults)

        const { GET } = await import('@/app/api/search/route')
        const mockRequest = new NextRequest('http://localhost:3000/api/search?query=semantic%20query&type=semantic')
        
        await GET(mockRequest)

        expect(mockSearchService.semanticSearch).toHaveBeenCalledWith(
          'test-user-id',
          expect.any(Array), // embedding vector
          { matchThreshold: 0.5, matchCount: 10 }
        )
      })
    })
  })

  describe('Modernized Chat API', () => {
    describe('POST /api/chat/sessions', () => {
      it('should use ChatService for session creation', async () => {
        const mockSession = {
          id: 'session-1',
          user_id: 'test-user-id',
          title: 'New Chat Session',
          created_at: '2024-01-01T00:00:00.000Z'
        }

        mockChatService.createSession.mockResolvedValue(mockSession)

        const { POST } = await import('@/app/api/chat/sessions/route')
        const mockRequest = new NextRequest('http://localhost:3000/api/chat/sessions', {
          method: 'POST',
          body: JSON.stringify({
            title: 'New Chat Session'
          })
        })
        
        const response = await POST(mockRequest)
        const data = await response.json()

        expect(mockCreateChatService).toHaveBeenCalled()
        expect(mockChatService.createSession).toHaveBeenCalledWith('test-user-id', 'New Chat Session')
        expect(data.success).toBe(true)
        expect(data.data).toEqual(mockSession)
      })
    })

    describe('POST /api/chat/sessions/[id]/messages', () => {
      it('should use ChatService for message creation', async () => {
        const mockMessage = {
          id: 'message-1',
          session_id: 'session-1',
          role: 'user',
          content: 'Hello!',
          created_at: '2024-01-01T00:00:00.000Z'
        }

        mockChatService.addMessage.mockResolvedValue(mockMessage)

        const { POST } = await import('@/app/api/chat/sessions/[id]/messages/route')
        const mockRequest = new NextRequest('http://localhost:3000/api/chat/sessions/session-1/messages', {
          method: 'POST',
          body: JSON.stringify({
            role: 'user',
            content: 'Hello!'
          })
        })
        
        const response = await POST(mockRequest, { params: Promise.resolve({ id: 'session-1' }) })
        const data = await response.json()

        expect(mockChatService.addMessage).toHaveBeenCalledWith('session-1', 'user', 'Hello!')
        expect(data.success).toBe(true)
        expect(data.data).toEqual(mockMessage)
      })

      it('should validate message roles', async () => {
        const { POST } = await import('@/app/api/chat/sessions/[id]/messages/route')
        const mockRequest = new NextRequest('http://localhost:3000/api/chat/sessions/session-1/messages', {
          method: 'POST',
          body: JSON.stringify({
            role: 'invalid',
            content: 'Hello!'
          })
        })
        
        const response = await POST(mockRequest, { params: Promise.resolve({ id: 'session-1' }) })
        const data = await response.json()

        expect(data.success).toBe(false)
        expect(data.error.code).toBe('VALIDATION_ERROR')
        expect(mockChatService.addMessage).not.toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling Modernization', () => {
    it('should provide consistent error response format', async () => {
      mockNotesService.getNotes.mockRejectedValue(new Error('Database connection failed'))

      const { GET } = await import('@/app/api/notes/route')
      const mockRequest = new NextRequest('http://localhost:3000/api/notes')
      
      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: {
          message: expect.any(String),
          code: 'INTERNAL_ERROR',
          details: expect.any(Object)
        }
      })
    })

    it('should handle authentication errors properly', async () => {
      mockGetAuthenticatedUserId.mockRejectedValue(new Error('Unauthorized'))

      const { GET } = await import('@/app/api/notes/route')
      const mockRequest = new NextRequest('http://localhost:3000/api/notes')
      
      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('should handle validation errors consistently', async () => {
      // Reset auth mock to succeed for this test
      mockGetAuthenticatedUserId.mockResolvedValue('test-user-id')
      
      const { POST } = await import('@/app/api/notes/route')
      const mockRequest = new NextRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          // Invalid data
          title: null,
          processed_content: ''
        })
      })
      
      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toContain('Validation')
    })
  })
})