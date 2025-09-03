import { Database } from '@/types/database'

// Re-export the Database type for convenience
export type { Database }

/**
 * Helper type to extract table row types
 */
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

/**
 * Helper type to extract table insert types
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

/**
 * Helper type to extract table update types
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

/**
 * Helper type for enum values (if any exist in the database)
 */
export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T]

/**
 * Utility type for partial updates (makes all fields optional except id)
 */
export type PartialUpdate<T extends keyof Database['public']['Tables']> = 
  Partial<TablesUpdate<T>> & { id: string }

/**
 * Utility type for creating new records (omits generated fields)
 */
export type CreateRecord<T extends keyof Database['public']['Tables']> = 
  Omit<TablesInsert<T>, 'id' | 'created_at' | 'updated_at'>

/**
 * Common field types used across tables
 */
export type UUID = string
export type Timestamp = string
export type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[]

/**
 * API Response types for consistent error handling
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any
  }
}

/**
 * API Error class for consistent error handling
 */
export class ApiError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: any

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.code = code || 'INTERNAL_ERROR'
    this.statusCode = statusCode
    this.details = details
  }
}

/**
 * Database operation result type
 */
export interface DatabaseResult<T = any> {
  data: T | null
  error: Error | null
  count?: number | null
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Search parameters
 */
export interface SearchParams extends PaginationParams {
  query?: string
  filters?: Record<string, any>
}

/**
 * Type-safe table names
 */
export type TableName = keyof Database['public']['Tables']

/**
 * Type-safe column names for a given table
 */
export type ColumnName<T extends TableName> = keyof Database['public']['Tables'][T]['Row']

/**
 * Type-safe filter conditions
 */
export type FilterCondition<T extends TableName> = {
  [K in ColumnName<T>]?: Database['public']['Tables'][T]['Row'][K] | 
                         Database['public']['Tables'][T]['Row'][K][] |
                         { 
                           operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'contains'
                           value: any
                         }
}

/**
 * Specific table type aliases for common use cases
 */
export type Note = Tables<'notes'>
export type NoteInsert = TablesInsert<'notes'>
export type NoteUpdate = TablesUpdate<'notes'>
export type CreateNote = CreateRecord<'notes'>

export type ChatSession = Tables<'chat_sessions'>
export type ChatSessionInsert = TablesInsert<'chat_sessions'>
export type ChatSessionUpdate = TablesUpdate<'chat_sessions'>

export type ChatMessage = Tables<'chat_messages'>
export type ChatMessageInsert = TablesInsert<'chat_messages'>
export type ChatMessageUpdate = TablesUpdate<'chat_messages'>

/**
 * Vector search types for embeddings
 */
export interface VectorSearchParams {
  queryEmbedding: number[]
  matchThreshold?: number
  matchCount?: number
  userId: string
}

export interface VectorSearchResult extends Note {
  similarity: number
}

/**
 * Real-time subscription types
 */
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimePayload<T = any> {
  schema: string
  table: string
  commit_timestamp: string
  eventType: RealtimeEvent
  new?: T
  old?: T
  errors?: string[]
}

/**
 * Type guards for runtime type checking
 */
export function isNote(obj: any): obj is Note {
  return obj && typeof obj.id === 'string' && typeof obj.user_id === 'string' && typeof obj.title === 'string'
}

export function isChatMessage(obj: any): obj is ChatMessage {
  return obj && typeof obj.id === 'string' && typeof obj.session_id === 'string' && typeof obj.content === 'string'
}

export function isApiError(obj: any): obj is ApiError {
  return obj instanceof ApiError
}