/**
 * Notes Service Hook
 * 
 * Custom hook that provides notes CRUD operations with proper state management,
 * error handling, and performance optimizations. Separates business logic from
 * UI components following clean architecture principles.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  AsyncOperationState,
  NotesState,
  NotesApiError,
  NotesErrorCode,
} from '../types/notes.types';
import { notesApi } from '../api/notes.api';

/**
 * Hook return type for notes operations
 */
interface UseNotesReturn extends NotesState {
  // Core operations
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: UpdateNoteRequest) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  refreshNotes: () => Promise<void>;
  
  // Async operations state
  createState: AsyncOperationState<Note>;
  updateState: AsyncOperationState<Note>;
  deleteState: AsyncOperationState<void>;
  
  // Computed values
  notesCount: number;
  hasError: boolean;
  isOperationInProgress: boolean;
  
  // Utility methods
  clearError: () => void;
  findNoteById: (id: string) => Note | undefined;
}

/**
 * Custom hook for managing notes with comprehensive error handling and optimization
 */
export function useNotes(): UseNotesReturn {
  const { userId } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Async operation states
  const [createState, setCreateState] = useState<AsyncOperationState<Note>>({ status: 'idle' });
  const [updateState, setUpdateState] = useState<AsyncOperationState<Note>>({ status: 'idle' });
  const [deleteState, setDeleteState] = useState<AsyncOperationState<void>>({ status: 'idle' });
  
  // Refs for cleanup and cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Safe state setter that only updates if component is still mounted
   */
  const safeSetState = useCallback(<T>(setter: (prev: T) => T, state: T) => {
    if (isMountedRef.current) {
      setter(state);
    }
  }, []);

  /**
   * Handle errors consistently across all operations
   */
  const handleError = useCallback((error: unknown, operation: string) => {
    console.error(`Notes ${operation} error:`, error);
    
    if (error instanceof NotesApiError) {
      const errorMessage = `${operation} failed: ${error.message}`;
      safeSetState(setError, errorMessage);
      return errorMessage;
    }
    
    if (error instanceof Error) {
      const errorMessage = `${operation} failed: ${error.message}`;
      safeSetState(setError, errorMessage);
      return errorMessage;
    }
    
    const errorMessage = `${operation} failed: Unknown error`;
    safeSetState(setError, errorMessage);
    return errorMessage;
  }, [safeSetState]);

  /**
   * Fetch all notes with proper loading states and error handling
   */
  const fetchNotes = useCallback(async (): Promise<void> => {
    if (!userId) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const fetchedNotes = await notesApi.fetchAll();
      
      if (isMountedRef.current) {
        setNotes(fetchedNotes);
        setError(null);
      }
    } catch (error) {
      handleError(error, 'Fetch notes');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId, handleError]);

  /**
   * Fetch notes when user changes
   */
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  /**
   * Add a note optimistically to the local state
   */
  const addNote = useCallback((newNote: Note) => {
    setNotes(prev => [newNote, ...prev]);
  }, []);

  /**
   * Update a note with optimistic updates and rollback on failure
   */
  const updateNote = useCallback(async (id: string, updates: UpdateNoteRequest): Promise<void> => {
    setUpdateState({ status: 'loading' });
    
    // Find the original note for potential rollback
    const originalNote = notes.find(note => note.id === id);
    if (!originalNote) {
      const error = new NotesApiError('Note not found', NotesErrorCode.VALIDATION_ERROR);
      setUpdateState({ status: 'error', error });
      handleError(error, 'Update note');
      return;
    }

    // Optimistic update
    const optimisticNote: Note = { ...originalNote, ...updates };
    setNotes(prev => prev.map(note => note.id === id ? optimisticNote : note));

    try {
      const updatedNote = await notesApi.update(id, updates);
      
      if (isMountedRef.current) {
        setNotes(prev => prev.map(note => note.id === id ? updatedNote : note));
        setUpdateState({ status: 'success', data: updatedNote });
      }
    } catch (error) {
      // Rollback optimistic update
      if (isMountedRef.current) {
        setNotes(prev => prev.map(note => note.id === id ? originalNote : note));
        setUpdateState({ status: 'error', error: error as Error });
        handleError(error, 'Update note');
      }
    }
  }, [notes, handleError]);

  /**
   * Delete a note with optimistic updates and rollback on failure
   */
  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    setDeleteState({ status: 'loading' });
    
    // Find the original note for potential rollback
    const originalNote = notes.find(note => note.id === noteId);
    if (!originalNote) {
      const error = new NotesApiError('Note not found', NotesErrorCode.VALIDATION_ERROR);
      setDeleteState({ status: 'error', error });
      handleError(error, 'Delete note');
      return;
    }

    // Optimistic delete
    setNotes(prev => prev.filter(note => note.id !== noteId));

    try {
      await notesApi.delete(noteId);
      
      if (isMountedRef.current) {
        setDeleteState({ status: 'success' });
      }
    } catch (error) {
      // Rollback optimistic delete
      if (isMountedRef.current) {
        setNotes(prev => {
          // Insert back in original position (assuming chronological order)
          const index = prev.findIndex(note => 
            new Date(note.created_at) < new Date(originalNote.created_at)
          );
          if (index === -1) {
            return [...prev, originalNote];
          }
          return [...prev.slice(0, index), originalNote, ...prev.slice(index)];
        });
        setDeleteState({ status: 'error', error: error as Error });
        handleError(error, 'Delete note');
      }
    }
  }, [notes, handleError]);

  /**
   * Refresh notes (force reload from server)
   */
  const refreshNotes = useCallback(async (): Promise<void> => {
    await fetchNotes();
  }, [fetchNotes]);

  /**
   * Clear current error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setCreateState({ status: 'idle' });
    setUpdateState({ status: 'idle' });
    setDeleteState({ status: 'idle' });
  }, []);

  /**
   * Find a note by ID
   */
  const findNoteById = useCallback((id: string): Note | undefined => {
    return notes.find(note => note.id === id);
  }, [notes]);

  // Computed values
  const notesCount = notes.length;
  const hasError = error !== null || 
    createState.status === 'error' || 
    updateState.status === 'error' || 
    deleteState.status === 'error';
  const isOperationInProgress = 
    createState.status === 'loading' || 
    updateState.status === 'loading' || 
    deleteState.status === 'loading';

  return {
    // State
    notes,
    isLoading,
    error,
    
    // Operations
    addNote,
    updateNote,
    deleteNote,
    refreshNotes,
    
    // Async states
    createState,
    updateState,
    deleteState,
    
    // Computed values
    notesCount,
    hasError,
    isOperationInProgress,
    
    // Utilities
    clearError,
    findNoteById,
  };
}