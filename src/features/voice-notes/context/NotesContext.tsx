/**
 * Notes Context with Error Boundaries
 * 
 * Provides notes state and operations to the component tree with proper
 * error handling, performance optimizations, and separation of concerns.
 * Uses the custom useNotes hook for business logic.
 */

'use client';

import React, { 
  createContext, 
  useContext, 
  useMemo, 
  useCallback,
  ErrorInfo,
  ReactNode 
} from 'react';
import { NotesContextValue } from '../types/notes.types';
import { useNotes } from '../hooks/useNotes';

/**
 * Notes context for providing notes state throughout the component tree
 */
const NotesContext = createContext<NotesContextValue | undefined>(undefined);

/**
 * Props for the NotesProvider component
 */
interface NotesProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Error boundary state for notes context
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary component specifically for notes context
 */
class NotesErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Notes Context Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-64 flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center max-w-md">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Something went wrong with your notes
            </h3>
            <p className="text-red-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred while loading your notes.'}
            </p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mt-4 text-xs text-red-700 max-w-full overflow-auto">
              <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {this.state.error?.stack}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Internal provider component that uses the useNotes hook
 */
const NotesProviderInternal: React.FC<{ children: ReactNode }> = ({ children }) => {
  const notesHook = useNotes();

  /**
   * Memoized context value to prevent unnecessary re-renders
   */
  const contextValue = useMemo<NotesContextValue>(() => ({
    // State
    notes: notesHook.notes,
    isLoading: notesHook.isLoading,
    error: notesHook.error,
    
    // Actions - these are already memoized in the hook
    addNote: notesHook.addNote,
    updateNote: notesHook.updateNote,
    deleteNote: notesHook.deleteNote,
    refreshNotes: notesHook.refreshNotes,
    
    // Computed values - memoized to prevent recalculation
    notesCount: notesHook.notesCount,
    hasError: notesHook.hasError,
  }), [
    notesHook.notes,
    notesHook.isLoading,
    notesHook.error,
    notesHook.addNote,
    notesHook.updateNote,
    notesHook.deleteNote,
    notesHook.refreshNotes,
    notesHook.notesCount,
    notesHook.hasError,
  ]);

  return (
    <NotesContext.Provider value={contextValue}>
      {children}
    </NotesContext.Provider>
  );
};

/**
 * Main NotesProvider component with error boundary
 */
export const NotesProvider: React.FC<NotesProviderProps> = React.memo(({ 
  children, 
  fallback 
}) => {
  return (
    <NotesErrorBoundary fallback={fallback}>
      <NotesProviderInternal>
        {children}
      </NotesProviderInternal>
    </NotesErrorBoundary>
  );
});

NotesProvider.displayName = 'NotesProvider';

/**
 * Hook to access notes context with proper error handling
 */
export function useNotesContext(): NotesContextValue {
  const context = useContext(NotesContext);
  
  if (context === undefined) {
    throw new Error(
      'useNotesContext must be used within a NotesProvider. ' +
      'Make sure to wrap your component tree with <NotesProvider>.'
    );
  }
  
  return context;
}

/**
 * Hook to access notes context with optional behavior
 * Returns null if not within provider instead of throwing error
 */
export function useNotesContextOptional(): NotesContextValue | null {
  return useContext(NotesContext) || null;
}

/**
 * Higher-order component to inject notes context as props
 */
export function withNotesContext<P extends object>(
  Component: React.ComponentType<P & { notesContext: NotesContextValue }>
): React.ComponentType<P> {
  const WithNotesContextComponent = (props: P) => {
    const notesContext = useNotesContext();
    return <Component {...props} notesContext={notesContext} />;
  };
  
  WithNotesContextComponent.displayName = `withNotesContext(${
    Component.displayName || Component.name
  })`;
  
  return WithNotesContextComponent;
}

/**
 * Utility hook for specific note operations with optimistic updates
 */
export function useNoteOperations() {
  const { addNote, updateNote, deleteNote, refreshNotes } = useNotesContext();
  
  const operations = useMemo(() => ({
    /**
     * Add a new note with loading state tracking
     */
    addNoteAsync: async (note: Parameters<typeof addNote>[0]) => {
      try {
        addNote(note);
        return { success: true };
      } catch (error) {
        console.error('Failed to add note:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    },

    /**
     * Update note with retry logic
     */
    updateNoteWithRetry: async (
      id: string, 
      updates: Parameters<typeof updateNote>[1],
      maxRetries = 3
    ) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await updateNote(id, updates);
          return { success: true };
        } catch (error) {
          if (attempt === maxRetries) {
            console.error('Failed to update note after retries:', error);
            return { 
              success: false, 
              error: error instanceof Error ? error.message : 'Update failed after retries' 
            };
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    },

    /**
     * Delete note with confirmation
     */
    deleteNoteWithConfirmation: async (noteId: string, title: string) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete the note "${title}"? This action cannot be undone.`
      );
      
      if (!confirmed) {
        return { success: false, cancelled: true };
      }

      try {
        await deleteNote(noteId);
        return { success: true };
      } catch (error) {
        console.error('Failed to delete note:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Delete failed' 
        };
      }
    },

    /**
     * Refresh notes with loading indicator
     */
    refreshNotesWithLoading: useCallback(async () => {
      try {
        await refreshNotes();
        return { success: true };
      } catch (error) {
        console.error('Failed to refresh notes:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Refresh failed' 
        };
      }
    }, [refreshNotes]),
  }), [addNote, updateNote, deleteNote, refreshNotes]);

  return operations;
}