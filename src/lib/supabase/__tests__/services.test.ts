/**
 * @jest-environment node
 */
import { NotesService, ChatService, SearchService } from '../services'
import { createServerClient } from '../server'
import { Note, NoteInsert, ChatSession, ChatMessage, VectorSearchResult } from '../types'

// Mock the server client
jest.mock('../server')
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

// Mock embeddings module
jest.mock('../../embeddings', () => ({
  generateNoteEmbedding: jest.fn().mockResolvedValue({
    embedding: [0.1, 0.2, 0.3]
  }),
  formatEmbeddingForPgVector: jest.fn().mockImplementation((embedding) => 
    `[${embedding.join(',')}]`
  )
}))

// Create a comprehensive mock Supabase client
const createMockQuery = () => ({
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
})

const mockSupabaseClient = {
  from: jest.fn().mockImplementation(() => createMockQuery()),
  rpc: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
}

mockCreateServerClient.mockResolvedValue(mockSupabaseClient as any)

describe('Modern Database Services', () => {
  let notesService: NotesService
  let chatService: ChatService
  let searchService: SearchService
  
  beforeEach(async () => {
    jest.clearAllMocks()
    
    // Reset the mock query functions
    mockSupabaseClient.from.mockClear()
    mockSupabaseClient.rpc.mockClear()
    
    const client = await createServerClient()
    notesService = new NotesService(client)
    chatService = new ChatService(client)
    searchService = new SearchService(client)
  })

  describe('NotesService', () => {
    describe('createNote', () => {
      it('should create a note with proper type safety', async () => {
        const noteData: NoteInsert = {
          user_id: 'test-user',
          title: 'Test Note',
          processed_content: 'Test content',
          summary: 'Test summary',
          tags: ['test', 'note'],
        }

        const mockNote: Note = {
          id: 'note-id',
          ...noteData,
          raw_transcript: null,
          embedding: '[0.1,0.2,0.3]', // Mock embedding
          file_url: null,
          file_name: null,
          file_type: null,
          file_size: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        }

        const mockQuery = createMockQuery()
        mockQuery.single.mockResolvedValue({ data: mockNote, error: null })
        mockSupabaseClient.from.mockReturnValue(mockQuery)

        const result = await notesService.createNote(noteData)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('notes')
        expect(mockQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            ...noteData,
            embedding: '[0.1,0.2,0.3]',
            created_at: expect.any(String),
            updated_at: expect.any(String),
          })
        )
        expect(mockQuery.select).toHaveBeenCalled()
        expect(mockQuery.single).toHaveBeenCalled()
        expect(result).toEqual(mockNote)
      })

      it('should handle creation errors properly', async () => {
        const noteData: NoteInsert = {
          user_id: 'test-user',
          title: 'Test Note',
          processed_content: 'Test content',
        }

        const mockError = new Error('Database error')
        const mockQuery = createMockQuery()
        mockQuery.single.mockResolvedValue({ data: null, error: mockError })
        mockSupabaseClient.from.mockReturnValue(mockQuery)

        await expect(notesService.createNote(noteData)).rejects.toThrow('Database error')
      })

      it('should generate embeddings when creating notes', async () => {
        const noteData: NoteInsert = {
          user_id: 'test-user',
          title: 'Test Note',
          processed_content: 'Test content',
        }

        const mockNote: Note = {
          id: 'note-id',
          ...noteData,
          raw_transcript: null,
          embedding: '[0.1,0.2,0.3]', // Mock embedding vector
          file_url: null,
          file_name: null,
          file_type: null,
          file_size: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        }

        const mockQuery = createMockQuery()
        mockQuery.single.mockResolvedValue({ data: mockNote, error: null })
        mockSupabaseClient.from.mockReturnValue(mockQuery)

        const result = await notesService.createNote(noteData)

        // Should create note with embedding
        expect(result.embedding).toBeTruthy()
        expect(mockQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            ...noteData,
            embedding: '[0.1,0.2,0.3]',
            created_at: expect.any(String),
            updated_at: expect.any(String),
          })
        )
      })
    })

    describe('getNotes', () => {
      it('should retrieve notes with pagination and filtering', async () => {
        const mockNotes: Note[] = [
          {
            id: 'note-1',
            user_id: 'test-user',
            title: 'Note 1',
            processed_content: 'Content 1',
            raw_transcript: null,
            summary: null,
            tags: ['tag1'],
            embedding: null,
            file_url: null,
            file_name: null,
            file_type: null,
            file_size: null,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
          }
        ]

        const mockQuery = createMockQuery()
        // Mock the final method in the chain (order → range → final result)
        mockQuery.range.mockResolvedValue({ data: mockNotes, error: null, count: 1 })
        mockSupabaseClient.from.mockReturnValue(mockQuery)

        const result = await notesService.getNotes('test-user', {
          limit: 10,
          offset: 0,
          search: 'test',
          tags: ['tag1'],
          sortBy: 'created_at',
          sortOrder: 'desc'
        })

        expect(result.data).toEqual(mockNotes)
        expect(result.count).toBe(1)
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user')
        expect(mockQuery.contains).toHaveBeenCalledWith('tags', ['tag1'])
      })

      it('should handle empty results gracefully', async () => {
        const mockQuery = createMockQuery()
        mockQuery.range.mockResolvedValue({ data: [], error: null, count: 0 })
        mockSupabaseClient.from.mockReturnValue(mockQuery)

        const result = await notesService.getNotes('test-user')

        expect(result.data).toEqual([])
        expect(result.count).toBe(0)
      })
    })

    describe('updateNote', () => {
      it('should update note with optimistic concurrency', async () => {
        const updateData = {
          title: 'Updated Title',
          processed_content: 'Updated content',
        }

        const mockUpdatedNote: Note = {
          id: 'note-id',
          user_id: 'test-user',
          title: 'Updated Title',
          processed_content: 'Updated content',
          raw_transcript: null,
          summary: null,
          tags: [],
          embedding: null,
          file_url: null,
          file_name: null,
          file_type: null,
          file_size: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T01:00:00.000Z', // Updated timestamp
        }

        // Mock getNote call in updateNote
        const mockGetQuery = createMockQuery()
        mockGetQuery.single.mockResolvedValue({ data: mockUpdatedNote, error: null })
        
        const mockUpdateQuery = createMockQuery()
        mockUpdateQuery.single.mockResolvedValue({ data: mockUpdatedNote, error: null })
        
        mockSupabaseClient.from.mockReturnValueOnce(mockGetQuery).mockReturnValueOnce(mockUpdateQuery)

        const result = await notesService.updateNote('note-id', 'test-user', updateData)

        expect(mockUpdateQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({
            ...updateData,
            updated_at: expect.any(String),
          })
        )
        expect(result).toEqual(mockUpdatedNote)
      })
    })

    describe('deleteNote', () => {
      it('should soft delete notes by default', async () => {
        const mockQuery = createMockQuery()
        mockQuery.single.mockResolvedValue({ data: { id: 'note-id' }, error: null })
        mockSupabaseClient.from.mockReturnValue(mockQuery)

        await notesService.deleteNote('note-id', 'test-user')

        expect(mockQuery.update).toHaveBeenCalledWith({
          deleted_at: expect.any(String),
        })
      })

      it('should hard delete when specified', async () => {
        const mockQuery = createMockQuery()
        // Create a nested mock for the chaining: delete().eq().eq()
        const mockAfterDelete = {
          eq: jest.fn().mockReturnThis()
        }
        const mockAfterFirstEq = {
          eq: jest.fn().mockResolvedValue({ data: null, error: null })
        }
        
        mockQuery.delete.mockReturnValue(mockAfterDelete)
        mockAfterDelete.eq.mockReturnValue(mockAfterFirstEq)
        mockSupabaseClient.from.mockReturnValue(mockQuery)

        await notesService.deleteNote('note-id', 'test-user', true)

        expect(mockQuery.delete).toHaveBeenCalled()
        expect(mockAfterDelete.eq).toHaveBeenCalledWith('id', 'note-id')
        expect(mockAfterFirstEq.eq).toHaveBeenCalledWith('user_id', 'test-user')
      })
    })
  })

  describe('SearchService', () => {
    describe('semanticSearch', () => {
      it('should perform vector similarity search', async () => {
        const queryEmbedding = [0.1, 0.2, 0.3]
        const mockResults: VectorSearchResult[] = [
          {
            id: 'note-1',
            user_id: 'test-user',
            title: 'Similar Note',
            processed_content: 'Similar content',
            raw_transcript: null,
            summary: null,
            tags: [],
            embedding: null,
            file_url: null,
            file_name: null,
            file_type: null,
            file_size: null,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            similarity: 0.85,
          }
        ]

        mockSupabaseClient.rpc.mockResolvedValue({ data: mockResults, error: null })

        const result = await searchService.semanticSearch('test-user', queryEmbedding, {
          threshold: 0.7,
          limit: 10
        })

        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('search_notes', {
          query_embedding: queryEmbedding,
          match_threshold: 0.7,
          match_count: 10,
          user_id_filter: 'test-user',
        })
        expect(result).toEqual(mockResults)
      })

      it('should handle empty search results', async () => {
        mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null })

        const result = await searchService.semanticSearch('test-user', [0.1, 0.2, 0.3])

        expect(result).toEqual([])
      })

      it('should throw error on search failure', async () => {
        const searchError = new Error('Vector search failed')
        mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: searchError })

        await expect(
          searchService.semanticSearch('test-user', [0.1, 0.2, 0.3])
        ).rejects.toThrow('Vector search failed')
      })
    })

    describe('hybridSearch', () => {
      it('should combine vector and keyword search', async () => {
        const mockResults: VectorSearchResult[] = [
          {
            id: 'note-1',
            user_id: 'test-user',
            title: 'Hybrid Result',
            processed_content: 'Content matching both vector and keyword',
            raw_transcript: null,
            summary: null,
            tags: [],
            embedding: null,
            file_url: null,
            file_name: null,
            file_type: null,
            file_size: null,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            similarity: 0.8,
          }
        ]

        mockSupabaseClient.rpc.mockResolvedValue({ data: mockResults, error: null })

        const result = await searchService.hybridSearch(
          'test-user',
          'keyword query',
          [0.1, 0.2, 0.3],
          { matchThreshold: 0.6, matchCount: 5 }
        )

        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('hybrid_search_notes', {
          query_text: 'keyword query',
          query_embedding: [0.1, 0.2, 0.3],
          match_threshold: 0.6,
          match_count: 5,
          user_id_filter: 'test-user',
        })
        expect(result).toEqual(mockResults)
      })
    })
  })

  describe('ChatService', () => {
    describe('createSession', () => {
      it('should create new chat session', async () => {
        const mockSession: ChatSession = {
          id: 'session-id',
          user_id: 'test-user',
          title: 'Test Chat',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        }

        const mockQuery = createMockQuery()
        mockQuery.single.mockResolvedValue({ data: mockSession, error: null })
        mockSupabaseClient.from.mockReturnValue(mockQuery)

        const result = await chatService.createSession('test-user', 'Test Chat')

        expect(mockQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'test-user',
            title: 'Test Chat',
            created_at: expect.any(String),
            updated_at: expect.any(String),
          })
        )
        expect(result).toEqual(mockSession)
      })
    })

    describe('addMessage', () => {
      it('should add message to session', async () => {
        const mockMessage: ChatMessage = {
          id: 'message-id',
          session_id: 'session-id',
          role: 'user',
          content: 'Hello, AI!',
          created_at: '2024-01-01T00:00:00.000Z',
        }

        // Mock the session update query first
        const mockUpdateQuery = createMockQuery()
        mockUpdateQuery.eq.mockResolvedValue({ data: null, error: null })
        
        // Then mock the message insert query
        const mockInsertQuery = createMockQuery()
        mockInsertQuery.single.mockResolvedValue({ data: mockMessage, error: null })
        
        mockSupabaseClient.from.mockReturnValueOnce(mockUpdateQuery).mockReturnValueOnce(mockInsertQuery)

        const result = await chatService.addMessage('session-id', 'user', 'Hello, AI!')

        expect(mockInsertQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            session_id: 'session-id',
            role: 'user',
            content: 'Hello, AI!',
            created_at: expect.any(String),
          })
        )
        expect(result).toEqual(mockMessage)
      })

      it('should validate message roles', async () => {
        await expect(
          chatService.addMessage('session-id', 'invalid' as any, 'Message')
        ).rejects.toThrow('Invalid message role')
      })
    })

    describe('getSessionHistory', () => {
      it('should retrieve session messages with pagination', async () => {
        const mockMessages: ChatMessage[] = [
          {
            id: 'msg-1',
            session_id: 'session-id',
            role: 'user',
            content: 'Hello',
            created_at: '2024-01-01T00:00:00.000Z',
          },
          {
            id: 'msg-2',
            session_id: 'session-id',
            role: 'assistant',
            content: 'Hi there!',
            created_at: '2024-01-01T00:01:00.000Z',
          }
        ]

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({ data: mockMessages, error: null }),
        }

        mockSupabaseClient.from.mockReturnValue(mockQuery)

        const result = await chatService.getSessionHistory('session-id', {
          limit: 50,
          offset: 0
        })

        expect(mockQuery.eq).toHaveBeenCalledWith('session_id', 'session-id')
        expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: true })
        expect(result).toEqual(mockMessages)
      })
    })
  })
})