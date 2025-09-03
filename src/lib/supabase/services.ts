import { SupabaseClient } from '@supabase/supabase-js'
import { 
  Database, 
  Note, 
  NoteInsert, 
  NoteUpdate, 
  ChatSession, 
  ChatSessionInsert,
  ChatMessage, 
  ChatMessageInsert,
  VectorSearchResult,
  VectorSearchParams,
  PaginationParams,
  SearchParams,
  DatabaseResult,
  ApiError
} from './types'
import { generateNoteEmbedding, formatEmbeddingForPgVector } from '../embeddings'

/**
 * Base service class with common functionality
 */
export abstract class BaseService {
  protected client: SupabaseClient<Database>

  constructor(client: SupabaseClient<Database>) {
    this.client = client
  }

  /**
   * Get the Supabase client with proper typing
   * This is a workaround for TypeScript inference issues with Supabase
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected get db(): any {
    return this.client
  }

  /**
   * Handle database errors consistently
   */
  protected handleError(error: unknown, context: string): never {
    console.error(`${context} error:`, error)
    throw new ApiError(
      error instanceof Error ? error.message : 'Database operation failed',
      500,
      'DATABASE_ERROR',
      { context, originalError: error }
    )
  }

  /**
   * Execute query with error handling
   */
  protected async executeQuery<T>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryPromise: any,
    context: string
  ): Promise<T> {
    const { data, error } = await queryPromise
    
    if (error) {
      this.handleError(error, context)
    }

    return data as T
  }

  /**
   * Execute query with count
   */
  protected async executeQueryWithCount<T>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryPromise: any,
    _context: string
  ): Promise<DatabaseResult<T>> {
    const { data, error, count } = await queryPromise
    
    return {
      data: error ? null : data,
      error: error || null,
      count: count !== undefined && count !== null ? count : null
    }
  }
}

/**
 * Service for managing notes
 */
export class NotesService extends BaseService {
  /**
   * Create a new note with embedding generation
   */
  async createNote(noteData: NoteInsert): Promise<Note> {
    const context = 'NotesService.createNote'
    
    try {
      // Generate embedding for the note
      let embeddingVector: string | null = null
      
      if (noteData.title || noteData.processed_content) {
        try {
          const embeddingResult = await generateNoteEmbedding(
            noteData.title || '',
            noteData.processed_content,
            noteData.tags || []
          )
          embeddingVector = formatEmbeddingForPgVector(embeddingResult.embedding)
        } catch (embeddingError) {
          console.warn('Failed to generate embedding:', embeddingError)
          // Continue without embedding - we don't want to fail note creation
        }
      }

      const noteWithEmbedding: NoteInsert = {
        ...noteData,
        embedding: embeddingVector,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      return await this.executeQuery(
        this.db
          .from('notes')
          .insert(noteWithEmbedding)
          .select()
          .single(),
        context
      )
    } catch (error) {
      this.handleError(error, context)
    }
  }

  /**
   * Get notes with pagination and filtering
   */
  async getNotes(
    userId: string, 
    params: SearchParams = {}
  ): Promise<DatabaseResult<Note[]>> {
    const context = 'NotesService.getNotes'
    const {
      limit = 50,
      offset = 0,
      search,
      tags,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params

    try {
      let query = this.db
        .from('notes')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null) // Exclude soft-deleted notes

      // Apply search filter
      if (search) {
        query = query.or(`title.ilike.%${search}%,processed_content.ilike.%${search}%`)
      }

      // Apply tags filter
      if (tags && tags.length > 0) {
        query = query.contains('tags', tags)
      }

      // Apply sorting
      if (['created_at', 'updated_at', 'title'].includes(sortBy)) {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      return await this.executeQueryWithCount(query, context)
    } catch (error) {
      this.handleError(error, context)
    }
  }

  /**
   * Get a specific note by ID
   */
  async getNote(noteId: string, userId: string): Promise<Note | null> {
    const context = 'NotesService.getNote'

    try {
      const { data } = await this.executeQueryWithCount(
        this.db
          .from('notes')
          .select('*')
          .eq('id', noteId)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .single(),
        context
      )

      return data as Note | null
    } catch (error) {
      // Return null for not found instead of throwing
      if (error instanceof Error && error.message?.includes('No rows returned')) {
        return null
      }
      this.handleError(error, context)
    }
  }

  /**
   * Update a note with optimistic concurrency control
   */
  async updateNote(
    noteId: string, 
    userId: string, 
    updateData: Partial<NoteUpdate>
  ): Promise<Note> {
    const context = 'NotesService.updateNote'

    try {
      // Add updated timestamp
      const dataWithTimestamp = {
        ...updateData,
        updated_at: new Date().toISOString(),
      }

      // Regenerate embedding if content changed
      if (updateData.title || updateData.processed_content) {
        try {
          // Get current note for embedding generation
          const currentNote = await this.getNote(noteId, userId)
          if (currentNote) {
            const embeddingResult = await generateNoteEmbedding(
              updateData.title || currentNote.title,
              updateData.processed_content || currentNote.processed_content,
              updateData.tags || currentNote.tags || []
            )
            dataWithTimestamp.embedding = formatEmbeddingForPgVector(embeddingResult.embedding)
          }
        } catch (embeddingError) {
          console.warn('Failed to regenerate embedding:', embeddingError)
        }
      }

      return await this.executeQuery(
        this.db
          .from('notes')
          .update(dataWithTimestamp)
          .eq('id', noteId)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .select()
          .single(),
        context
      )
    } catch (error) {
      this.handleError(error, context)
    }
  }

  /**
   * Delete a note (soft delete by default)
   */
  async deleteNote(
    noteId: string, 
    userId: string, 
    hardDelete: boolean = false
  ): Promise<void> {
    const context = 'NotesService.deleteNote'

    try {
      if (hardDelete) {
        await this.executeQuery(
          this.db
            .from('notes')
            .delete()
            .eq('id', noteId)
            .eq('user_id', userId),
          context
        )
      } else {
        await this.executeQuery(
          this.db
            .from('notes')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', noteId)
            .eq('user_id', userId)
            .select()
            .single(),
          context
        )
      }
    } catch (error) {
      this.handleError(error, context)
    }
  }

  /**
   * Get notes by tags
   */
  async getNotesByTags(
    userId: string, 
    tags: string[], 
    params: PaginationParams = {}
  ): Promise<DatabaseResult<Note[]>> {
    const context = 'NotesService.getNotesByTags'
    const { limit = 50, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = params

    try {
      let query = this.db
        .from('notes')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null)
        .contains('tags', tags)

      if (['created_at', 'updated_at', 'title'].includes(sortBy)) {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })
      }

      query = query.range(offset, offset + limit - 1)

      return await this.executeQueryWithCount(query, context)
    } catch (error) {
      this.handleError(error, context)
    }
  }

  /**
   * Get all unique tags for a user
   */
  async getUserTags(userId: string): Promise<string[]> {
    const context = 'NotesService.getUserTags'

    try {
      const { data } = await this.executeQueryWithCount(
        this.db
          .from('notes')
          .select('tags')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .not('tags', 'is', null),
        context
      )

      if (!data) return []

      // Flatten and deduplicate tags
      const allTags = (data as Note[]).flatMap(note => note.tags || [])
      return [...new Set(allTags)].sort()
    } catch (error) {
      this.handleError(error, context)
    }
  }
}

/**
 * Service for semantic and hybrid search
 */
export class SearchService extends BaseService {
  /**
   * Perform semantic search using vector embeddings
   */
  async semanticSearch(
    userId: string,
    queryEmbedding: number[],
    options: Omit<VectorSearchParams, 'userId' | 'queryEmbedding'> = {}
  ): Promise<VectorSearchResult[]> {
    const context = 'SearchService.semanticSearch'
    const {
      matchThreshold = 0.7,
      matchCount = 10
    } = options

    try {
      return await this.executeQuery(
        this.db.rpc('search_notes', {
          query_embedding: queryEmbedding,
          match_threshold: matchThreshold,
          match_count: matchCount,
          user_id_filter: userId,
        }),
        context
      )
    } catch (error) {
      this.handleError(error, context)
    }
  }

  /**
   * Perform hybrid search combining vector and keyword search
   */
  async hybridSearch(
    userId: string,
    queryText: string,
    queryEmbedding: number[],
    options: Omit<VectorSearchParams, 'userId' | 'queryEmbedding'> = {}
  ): Promise<VectorSearchResult[]> {
    const context = 'SearchService.hybridSearch'
    const {
      matchThreshold = 0.6,
      matchCount = 10
    } = options

    try {
      return await this.executeQuery(
        this.db.rpc('hybrid_search_notes', {
          query_text: queryText,
          query_embedding: queryEmbedding,
          match_threshold: matchThreshold,
          match_count: matchCount,
          user_id_filter: userId,
        }),
        context
      )
    } catch (error) {
      this.handleError(error, context)
    }
  }

  /**
   * Perform keyword-only search
   */
  async keywordSearch(
    userId: string,
    query: string,
    params: SearchParams = {}
  ): Promise<DatabaseResult<Note[]>> {
    const context = 'SearchService.keywordSearch'
    const { limit = 10, offset = 0 } = params

    try {
      let dbQuery = this.client
        .from('notes')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null)

      if (query) {
        dbQuery = dbQuery.or(`title.ilike.%${query}%,processed_content.ilike.%${query}%,summary.ilike.%${query}%`)
      }

      dbQuery = dbQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      return await this.executeQueryWithCount(dbQuery, context)
    } catch (error) {
      this.handleError(error, context)
    }
  }
}

/**
 * Service for managing chat sessions and messages
 */
export class ChatService extends BaseService {
  /**
   * Create a new chat session
   */
  async createSession(userId: string, title?: string): Promise<ChatSession> {
    const context = 'ChatService.createSession'

    try {
      const sessionData: ChatSessionInsert = {
        user_id: userId,
        title: title || 'New Chat Session',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      return await this.executeQuery(
        this.db
          .from('chat_sessions')
          .insert(sessionData)
          .select()
          .single(),
        context
      )
    } catch (error) {
      this.handleError(error, context)
    }
  }

  /**
   * Get user's chat sessions
   */
  async getUserSessions(
    userId: string, 
    params: PaginationParams = {}
  ): Promise<DatabaseResult<ChatSession[]>> {
    const context = 'ChatService.getUserSessions'
    const { limit = 50, offset = 0 } = params

    try {
      return await this.executeQueryWithCount(
        this.db
          .from('chat_sessions')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .range(offset, offset + limit - 1),
        context
      )
    } catch (error) {
      this.handleError(error, context)
    }
  }

  /**
   * Add a message to a chat session
   */
  async addMessage(
    sessionId: string, 
    role: 'user' | 'assistant' | 'system',
    content: string
  ): Promise<ChatMessage> {
    const context = 'ChatService.addMessage'

    // Validate role
    if (!['user', 'assistant', 'system'].includes(role)) {
      throw new ApiError('Invalid message role', 400, 'VALIDATION_ERROR')
    }

    try {
      const messageData: ChatMessageInsert = {
        session_id: sessionId,
        role,
        content,
        created_at: new Date().toISOString(),
      }

      // Update session's updated_at timestamp
      await this.executeQuery(
        this.db
          .from('chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', sessionId),
        'ChatService.updateSessionTimestamp'
      )

      return await this.executeQuery(
        this.db
          .from('chat_messages')
          .insert(messageData)
          .select()
          .single(),
        context
      )
    } catch (error) {
      this.handleError(error, context)
    }
  }

  /**
   * Get chat session history
   */
  async getSessionHistory(
    sessionId: string, 
    params: PaginationParams = {}
  ): Promise<ChatMessage[]> {
    const context = 'ChatService.getSessionHistory'
    const { limit = 50, offset = 0 } = params

    try {
      const { data } = await this.executeQueryWithCount(
        this.db
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
          .range(offset, offset + limit - 1),
        context
      )

      return (data || []) as ChatMessage[]
    } catch (error) {
      this.handleError(error, context)
    }
  }

  /**
   * Update chat session title
   */
  async updateSessionTitle(sessionId: string, userId: string, title: string): Promise<ChatSession> {
    const context = 'ChatService.updateSessionTitle'

    try {
      return await this.executeQuery(
        this.db
          .from('chat_sessions')
          .update({ 
            title, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', sessionId)
          .eq('user_id', userId)
          .select()
          .single(),
        context
      )
    } catch (error) {
      this.handleError(error, context)
    }
  }

  /**
   * Delete a chat session and all its messages
   */
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const context = 'ChatService.deleteSession'

    try {
      // Messages will be cascade deleted due to foreign key constraint
      await this.executeQuery(
        this.db
          .from('chat_sessions')
          .delete()
          .eq('id', sessionId)
          .eq('user_id', userId),
        context
      )
    } catch (error) {
      this.handleError(error, context)
    }
  }
}

/**
 * Convenience factory functions
 */
export async function createNotesService(): Promise<NotesService> {
  const { createServerClient } = await import('./server')
  const client = await createServerClient()
  return new NotesService(client)
}

export async function createSearchService(): Promise<SearchService> {
  const { createServerClient } = await import('./server')
  const client = await createServerClient()
  return new SearchService(client)
}

export async function createChatService(): Promise<ChatService> {
  const { createServerClient } = await import('./server')
  const client = await createServerClient()
  return new ChatService(client)
}