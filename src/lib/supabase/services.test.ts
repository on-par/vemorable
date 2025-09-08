import { vi } from 'vitest'
import { NotesService, ChatService, SearchService } from './services'
import { createServerClient } from './server'
import { Note, NoteInsert, ChatSession, ChatMessage, VectorSearchResult } from './types'

// Mock the server client
vi.mock('./server')
const mockCreateServerClient = createServerClient as any

// Mock embeddings module
vi.mock('../embeddings', () => ({
  generateNoteEmbedding: vi.fn().mockResolvedValue({
    embedding: [0.1, 0.2, 0.3]
  }),
  formatEmbeddingForPgVector: vi.fn().mockImplementation((embedding) => 
    `[${embedding.join(',')}]`
  )
}))

// Test constants and utilities
const TEST_USER_ID = 'test-user'
const TEST_EMBEDDING = [0.1, 0.2, 0.3]
const TEST_EMBEDDING_STRING = '[0.1,0.2,0.3]'
const TEST_DATE = '2024-01-01T00:00:00.000Z'
const UPDATED_DATE = '2024-01-01T01:00:00.000Z'

// Test data factories
const createTestNoteData = (overrides: Partial<NoteInsert> = {}): NoteInsert => ({
  user_id: TEST_USER_ID,
  title: 'Test Note',
  processed_content: 'Test content',
  summary: 'Test summary',
  tags: ['test', 'note'],
  ...overrides,
})

const createTestNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-id',
  user_id: TEST_USER_ID,
  title: 'Test Note',
  processed_content: 'Test content',
  summary: 'Test summary',
  tags: ['test', 'note'],
  raw_transcript: null,
  embedding: TEST_EMBEDDING_STRING,
  file_url: null,
  file_name: null,
  file_type: null,
  file_size: null,
  created_at: TEST_DATE,
  updated_at: TEST_DATE,
  ...overrides,
})

const createTestChatSession = (overrides: Partial<ChatSession> = {}): ChatSession => ({
  id: 'session-id',
  user_id: TEST_USER_ID,
  title: 'Test Chat',
  created_at: TEST_DATE,
  updated_at: TEST_DATE,
  ...overrides,
})

const createTestChatMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 'message-id',
  session_id: 'session-id',
  role: 'user',
  content: 'Hello, AI!',
  created_at: TEST_DATE,
  ...overrides,
})

const createTestVectorSearchResult = (overrides: Partial<VectorSearchResult> = {}): VectorSearchResult => ({
  id: 'note-1',
  user_id: TEST_USER_ID,
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
  created_at: TEST_DATE,
  updated_at: TEST_DATE,
  similarity: 0.85,
  ...overrides,
})

// Mock query builder utilities
const createMockQuery = () => ({
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
})

// Enhanced mock query for complex chaining scenarios
const createMockQueryWithChaining = () => {
  const mockAfterDelete = {
    eq: vi.fn().mockReturnThis()
  }
  const mockAfterFirstEq = {
    eq: vi.fn().mockResolvedValue({ data: null, error: null })
  }
  
  const query = createMockQuery()
  query.delete.mockReturnValue(mockAfterDelete)
  mockAfterDelete.eq.mockReturnValue(mockAfterFirstEq)
  
  return { query, mockAfterDelete, mockAfterFirstEq }
}

// Mock successful query results
const createSuccessfulQuery = <T>(data: T) => {
  const query = createMockQuery()
  query.single.mockResolvedValue({ data, error: null })
  return query
}

// Mock error query results
const createErrorQuery = (error: Error) => {
  const query = createMockQuery()
  query.single.mockResolvedValue({ data: null, error })
  return query
}

// Mock paginated query results
const createPaginatedQuery = <T>(data: T[], count: number) => {
  const query = createMockQuery()
  query.range.mockResolvedValue({ data, error: null, count })
  return query
}

// Centralized mock Supabase client
const mockSupabaseClient = {
  from: vi.fn().mockImplementation(() => createMockQuery()),
  rpc: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
}

mockCreateServerClient.mockResolvedValue(mockSupabaseClient as any)

// Test helper functions
const setupMockQuery = (mockFn: () => any) => {
  const query = mockFn()
  mockSupabaseClient.from.mockReturnValue(query)
  return query
}

const setupMultipleMockQueries = (...mockFns: (() => any)[]) => {
  const queries = mockFns.map(fn => fn())
  mockSupabaseClient.from.mockReturnValueOnce(queries[0])
  if (queries[1]) mockSupabaseClient.from.mockReturnValueOnce(queries[1])
  return queries
}

describe('Database Services', () => {
  let notesService: NotesService
  let chatService: ChatService
  let searchService: SearchService
  
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Reset all mock functions
    mockSupabaseClient.from.mockClear()
    mockSupabaseClient.rpc.mockClear()
    
    // Initialize services
    const client = await createServerClient()
    notesService = new NotesService(client)
    chatService = new ChatService(client)
    searchService = new SearchService(client)
  })

  describe('NotesService', () => {
    describe('createNote', () => {
      it('should create a note with proper type safety', async () => {
        const noteData = createTestNoteData()
        const mockNote = createTestNote()

        setupMockQuery(() => createSuccessfulQuery(mockNote))

        const result = await notesService.createNote(noteData)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('notes')
        expect(result).toEqual(mockNote)
      })

      it('should handle creation errors properly', async () => {
        const noteData = createTestNoteData({ summary: undefined, tags: undefined })
        const mockError = new Error('Database error')
        
        setupMockQuery(() => createErrorQuery(mockError))

        await expect(notesService.createNote(noteData)).rejects.toThrow('Database error')
      })

      it('should generate embeddings when creating notes', async () => {
        const noteData = createTestNoteData({ summary: undefined, tags: undefined })
        const mockNote = createTestNote({ 
          summary: null, 
          tags: null,
          embedding: TEST_EMBEDDING_STRING 
        })

        const mockQuery = setupMockQuery(() => createSuccessfulQuery(mockNote))

        const result = await notesService.createNote(noteData)

        expect(result.embedding).toBeTruthy()
        expect(mockQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            ...noteData,
            embedding: TEST_EMBEDDING_STRING,
            created_at: expect.any(String),
            updated_at: expect.any(String),
          })
        )
      })
    })

    describe('getNotes', () => {
      it('should retrieve notes with pagination and filtering', async () => {
        const mockNotes = [
          createTestNote({ 
            id: 'note-1', 
            title: 'Note 1', 
            processed_content: 'Content 1',
            summary: null,
            tags: ['tag1'],
            embedding: null 
          })
        ]

        const mockQuery = setupMockQuery(() => createPaginatedQuery(mockNotes, 1))

        const result = await notesService.getNotes(TEST_USER_ID, {
          limit: 10,
          offset: 0,
          search: 'test',
          tags: ['tag1'],
          sortBy: 'created_at',
          sortOrder: 'desc'
        })

        expect(result.data).toEqual(mockNotes)
        expect(result.count).toBe(1)
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', TEST_USER_ID)
        expect(mockQuery.contains).toHaveBeenCalledWith('tags', ['tag1'])
      })

      it('should handle empty results gracefully', async () => {
        setupMockQuery(() => createPaginatedQuery([], 0))

        const result = await notesService.getNotes(TEST_USER_ID)

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

        const mockUpdatedNote = createTestNote({
          title: 'Updated Title',
          processed_content: 'Updated content',
          summary: null,
          tags: [],
          embedding: null,
          updated_at: UPDATED_DATE,
        })

        const [mockGetQuery, mockUpdateQuery] = setupMultipleMockQueries(
          () => createSuccessfulQuery(mockUpdatedNote),
          () => createSuccessfulQuery(mockUpdatedNote)
        )

        const result = await notesService.updateNote('note-id', TEST_USER_ID, updateData)

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
        const mockQuery = setupMockQuery(() => createSuccessfulQuery({ id: 'note-id' }))

        await notesService.deleteNote('note-id', TEST_USER_ID)

        expect(mockQuery.update).toHaveBeenCalledWith({
          deleted_at: expect.any(String),
        })
      })

      it('should hard delete when specified', async () => {
        const { query, mockAfterDelete, mockAfterFirstEq } = createMockQueryWithChaining()
        mockSupabaseClient.from.mockReturnValue(query)

        await notesService.deleteNote('note-id', TEST_USER_ID, true)

        expect(query.delete).toHaveBeenCalled()
        expect(mockAfterDelete.eq).toHaveBeenCalledWith('id', 'note-id')
        expect(mockAfterFirstEq.eq).toHaveBeenCalledWith('user_id', TEST_USER_ID)
      })
    })
  })

  describe('SearchService', () => {
    describe('semanticSearch', () => {
      it('should perform vector similarity search', async () => {
        const mockResults = [createTestVectorSearchResult()]

        mockSupabaseClient.rpc.mockResolvedValue({ data: mockResults, error: null })

        const result = await searchService.semanticSearch(TEST_USER_ID, TEST_EMBEDDING, {
          matchThreshold: 0.7,
          matchCount: 10
        })

        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('search_notes', {
          query_embedding: TEST_EMBEDDING,
          match_threshold: 0.7,
          match_count: 10,
          user_id_filter: TEST_USER_ID,
        })
        expect(result).toEqual(mockResults)
      })

      it('should handle empty search results', async () => {
        mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null })

        const result = await searchService.semanticSearch(TEST_USER_ID, TEST_EMBEDDING)

        expect(result).toEqual([])
      })

      it('should throw error on search failure', async () => {
        const searchError = new Error('Vector search failed')
        mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: searchError })

        await expect(
          searchService.semanticSearch(TEST_USER_ID, TEST_EMBEDDING)
        ).rejects.toThrow('Vector search failed')
      })
    })

    describe('hybridSearch', () => {
      it('should combine vector and keyword search', async () => {
        const mockResults = [
          createTestVectorSearchResult({
            title: 'Hybrid Result',
            processed_content: 'Content matching both vector and keyword',
            similarity: 0.8,
          })
        ]

        mockSupabaseClient.rpc.mockResolvedValue({ data: mockResults, error: null })

        const result = await searchService.hybridSearch(
          TEST_USER_ID,
          'keyword query',
          TEST_EMBEDDING,
          { matchThreshold: 0.6, matchCount: 5 }
        )

        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('hybrid_search_notes', {
          query_text: 'keyword query',
          query_embedding: TEST_EMBEDDING,
          match_threshold: 0.6,
          match_count: 5,
          user_id_filter: TEST_USER_ID,
        })
        expect(result).toEqual(mockResults)
      })
    })
  })

  describe('ChatService', () => {
    describe('createSession', () => {
      it('should create new chat session', async () => {
        const mockSession = createTestChatSession()
        const mockQuery = setupMockQuery(() => createSuccessfulQuery(mockSession))

        const result = await chatService.createSession(TEST_USER_ID, 'Test Chat')

        expect(mockQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: TEST_USER_ID,
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
        const mockMessage = createTestChatMessage()

        // Mock the session update query first, then the message insert query
        const mockUpdateQuery = createMockQuery()
        mockUpdateQuery.eq.mockResolvedValue({ data: null, error: null })
        
        const [, mockInsertQuery] = setupMultipleMockQueries(
          () => mockUpdateQuery,
          () => createSuccessfulQuery(mockMessage)
        )

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
        const mockMessages = [
          createTestChatMessage({ id: 'msg-1', content: 'Hello' }),
          createTestChatMessage({ 
            id: 'msg-2', 
            role: 'assistant', 
            content: 'Hi there!',
            created_at: '2024-01-01T00:01:00.000Z'
          })
        ]

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: mockMessages, error: null }),
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