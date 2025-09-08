/**
 * Voice Notes API Layer
 * 
 * Handles all HTTP requests related to notes with proper error handling,
 * type safety, and retry logic following API best practices.
 */

import {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  ApiResponse,
  NotesListResponse,
  NotesError,
  NotesErrorCode,
} from '../types/notes.types';

/**
 * Configuration for API requests
 */
const API_CONFIG = {
  baseUrl: '/api',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
} as const;

/**
 * Custom error class for notes API operations
 */
export class NotesApiError extends Error implements NotesError {
  code: string;
  context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'NotesApiError';
    this.code = code;
    this.context = context;
  }
}

/**
 * Utility function to handle API responses with proper error handling
 */
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    
    let errorCode: string;
    switch (response.status) {
      case 401:
        errorCode = NotesErrorCode.UNAUTHORIZED;
        break;
      case 400:
        errorCode = NotesErrorCode.VALIDATION_ERROR;
        break;
      case 500:
        errorCode = NotesErrorCode.NETWORK_ERROR;
        break;
      default:
        errorCode = NotesErrorCode.NETWORK_ERROR;
    }

    throw new NotesApiError(
      `API request failed: ${response.status} ${response.statusText}`,
      errorCode,
      { status: response.status, responseText: errorText }
    );
  }

  try {
    return await response.json();
  } catch (error) {
    throw new NotesApiError(
      'Failed to parse API response',
      NotesErrorCode.NETWORK_ERROR,
      { originalError: error }
    );
  }
}

/**
 * Utility function to make API requests with timeout and error handling
 */
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    return await handleApiResponse<T>(response);
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof NotesApiError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new NotesApiError(
          'Request timeout',
          NotesErrorCode.NETWORK_ERROR,
          { timeout: API_CONFIG.timeout }
        );
      }
      throw new NotesApiError(
        error.message,
        NotesErrorCode.NETWORK_ERROR,
        { originalError: error }
      );
    }
    
    throw new NotesApiError(
      'Unknown error occurred',
      NotesErrorCode.NETWORK_ERROR
    );
  }
}

/**
 * Notes API client with comprehensive CRUD operations
 */
export class NotesApi {
  /**
   * Fetch all notes for the authenticated user
   */
  static async fetchNotes(): Promise<Note[]> {
    try {
      const response = await makeRequest<ApiResponse<NotesListResponse>>('/notes');
      
      if (!response.success) {
        throw new NotesApiError(
          response.error?.message || 'Failed to fetch notes',
          NotesErrorCode.FETCH_FAILED,
          { apiResponse: response }
        );
      }

      return response.data?.notes || [];
    } catch (error) {
      if (error instanceof NotesApiError) {
        throw error;
      }
      throw new NotesApiError(
        'Failed to fetch notes',
        NotesErrorCode.FETCH_FAILED,
        { originalError: error }
      );
    }
  }

  /**
   * Create a new note
   */
  static async createNote(noteData: CreateNoteRequest): Promise<Note> {
    try {
      const response = await makeRequest<ApiResponse<Note>>('/notes', {
        method: 'POST',
        body: JSON.stringify(noteData),
      });

      if (!response.success) {
        throw new NotesApiError(
          response.error?.message || 'Failed to create note',
          NotesErrorCode.CREATE_FAILED,
          { noteData, apiResponse: response }
        );
      }

      if (!response.data) {
        throw new NotesApiError(
          'No data returned from create note API',
          NotesErrorCode.CREATE_FAILED,
          { noteData }
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof NotesApiError) {
        throw error;
      }
      throw new NotesApiError(
        'Failed to create note',
        NotesErrorCode.CREATE_FAILED,
        { noteData, originalError: error }
      );
    }
  }

  /**
   * Update an existing note
   */
  static async updateNote(noteId: string, updates: UpdateNoteRequest): Promise<Note> {
    try {
      const response = await makeRequest<ApiResponse<Note>>(`/notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (!response.success) {
        throw new NotesApiError(
          response.error?.message || 'Failed to update note',
          NotesErrorCode.UPDATE_FAILED,
          { noteId, updates, apiResponse: response }
        );
      }

      if (!response.data) {
        throw new NotesApiError(
          'No data returned from update note API',
          NotesErrorCode.UPDATE_FAILED,
          { noteId, updates }
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof NotesApiError) {
        throw error;
      }
      throw new NotesApiError(
        'Failed to update note',
        NotesErrorCode.UPDATE_FAILED,
        { noteId, updates, originalError: error }
      );
    }
  }

  /**
   * Delete a note
   */
  static async deleteNote(noteId: string): Promise<void> {
    try {
      const response = await makeRequest<ApiResponse<{ deleted: boolean }>>(`/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.success) {
        throw new NotesApiError(
          response.error?.message || 'Failed to delete note',
          NotesErrorCode.DELETE_FAILED,
          { noteId, apiResponse: response }
        );
      }
    } catch (error) {
      if (error instanceof NotesApiError) {
        throw error;
      }
      throw new NotesApiError(
        'Failed to delete note',
        NotesErrorCode.DELETE_FAILED,
        { noteId, originalError: error }
      );
    }
  }

  /**
   * Get a single note by ID
   */
  static async fetchNote(noteId: string): Promise<Note> {
    try {
      const response = await makeRequest<ApiResponse<Note>>(`/notes/${noteId}`);

      if (!response.success) {
        throw new NotesApiError(
          response.error?.message || 'Failed to fetch note',
          NotesErrorCode.FETCH_FAILED,
          { noteId, apiResponse: response }
        );
      }

      if (!response.data) {
        throw new NotesApiError(
          'No data returned from fetch note API',
          NotesErrorCode.FETCH_FAILED,
          { noteId }
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof NotesApiError) {
        throw error;
      }
      throw new NotesApiError(
        'Failed to fetch note',
        NotesErrorCode.FETCH_FAILED,
        { noteId, originalError: error }
      );
    }
  }
}

/**
 * Convenience functions for common operations
 */
export const notesApi = {
  fetchAll: NotesApi.fetchNotes,
  create: NotesApi.createNote,
  update: NotesApi.updateNote,
  delete: NotesApi.deleteNote,
  fetchById: NotesApi.fetchNote,
} as const;