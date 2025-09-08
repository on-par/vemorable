/**
 * Voice Notes Feature Types
 * 
 * Comprehensive type definitions for the voice notes feature following
 * TypeScript best practices and vertical slice architecture.
 */

// Core Note Entity
export interface Note {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  created_at: string;
  processed_content: string;
  raw_transcript?: string;
  user_id?: string;
}

// Note Creation and Updates
export interface CreateNoteRequest {
  title: string;
  processed_content: string;
  summary: string;
  tags: string[];
  raw_transcript?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  processed_content?: string;
  summary?: string;
  tags?: string[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

export interface NotesListResponse {
  notes: Note[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateNoteResponse {
  success: boolean;
  data: Note;
  error?: string;
}

// Hook State Types
export interface NotesState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
}

export interface AsyncOperationState<T> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: T;
  error?: Error;
}

// Context Types
export interface NotesContextValue {
  // State
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: UpdateNoteRequest) => void;
  deleteNote: (noteId: string) => Promise<void>;
  refreshNotes: () => Promise<void>;
  
  // Computed values
  notesCount: number;
  hasError: boolean;
}

// Error Types
export interface NotesError extends Error {
  code: string;
  context?: Record<string, any>;
}

export enum NotesErrorCode {
  FETCH_FAILED = 'FETCH_FAILED',
  CREATE_FAILED = 'CREATE_FAILED',
  UPDATE_FAILED = 'UPDATE_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

// Event Types
export interface NoteEvent {
  type: 'note_created' | 'note_updated' | 'note_deleted';
  note: Note;
  timestamp: Date;
}

// Filter and Search Types
export interface NotesFilter {
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface NotesSort {
  field: 'created_at' | 'title' | 'updated_at';
  direction: 'asc' | 'desc';
}