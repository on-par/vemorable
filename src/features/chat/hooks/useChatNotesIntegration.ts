/**
 * useChatNotesIntegration Hook
 * 
 * Custom hook that manages the integration between chat and notes features.
 * Provides notes status information and integration feedback for the chat interface.
 * 
 * Follows the Single Responsibility Principle by focusing solely on notes integration.
 */

import { useMemo } from 'react';
import { useNotesContext } from '@/features/voice-notes/context/NotesContext';
import type { UseNotesIntegrationReturn } from '../types/chat.types';

/**
 * Hook for managing chat-notes integration
 */
export const useChatNotesIntegration = (): UseNotesIntegrationReturn => {
  const { notes, isLoading: notesLoading } = useNotesContext();

  /**
   * Memoized computation of notes integration state
   */
  const integrationState = useMemo((): UseNotesIntegrationReturn => {
    return {
      isNotesLoading: notesLoading,
      notesCount: notes.length,
      hasNotesAvailable: notes.length > 0,
    };
  }, [notes.length, notesLoading]);

  return integrationState;
};

/**
 * Utility functions for notes integration status
 */
export const useNotesIntegrationUtils = () => {
  const integration = useChatNotesIntegration();

  /**
   * Gets the appropriate welcome message based on notes availability
   */
  const getWelcomeMessage = (): string => {
    if (integration.isNotesLoading) {
      return "Loading your notes...";
    }
    
    if (integration.hasNotesAvailable) {
      return "Ask questions about your notes, request summaries, or explore connections between different ideas.";
    }
    
    return "You don't have any notes yet. Create some notes first to start chatting about them.";
  };

  /**
   * Gets the status indicator configuration
   */
  const getStatusIndicatorConfig = () => {
    if (integration.isNotesLoading) {
      return {
        type: 'loading' as const,
        message: 'Loading notes...',
        className: 'text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded animate-pulse',
        testId: 'notes-loading-indicator',
        icon: 'loading',
      };
    }

    if (integration.hasNotesAvailable) {
      return {
        type: 'available' as const,
        message: `${integration.notesCount} notes available`,
        className: 'text-xs text-green-700 bg-green-100 px-2 py-1 rounded flex items-center gap-1',
        testId: 'notes-available-indicator',
        icon: 'document',
      };
    }

    return {
      type: 'unavailable' as const,
      message: 'No notes available',
      className: 'text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded flex items-center gap-1',
      testId: 'no-notes-available',
      icon: 'warning',
    };
  };

  /**
   * Gets the connection status configuration
   */
  const getConnectionStatusConfig = () => {
    if (integration.isNotesLoading) {
      return null; // Don't show connection status while loading
    }

    if (integration.hasNotesAvailable) {
      return {
        message: 'Notes Connected',
        className: 'text-xs text-green-700 bg-green-50 px-2 py-1 rounded',
        testId: 'notes-integration-status',
      };
    }

    return null; // Don't show connection status when no notes available
  };

  /**
   * Gets the configuration for notes used indicator in messages
   */
  const getNotesUsedConfig = (notesUsed?: number) => {
    if (notesUsed === undefined) {
      return null;
    }

    if (notesUsed > 0) {
      return {
        type: 'used' as const,
        message: `Used ${notesUsed} notes`,
        className: 'text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded flex items-center gap-1',
        testId: 'notes-used-count',
        icon: 'document',
        reference: {
          message: `References: ${notesUsed} notes`,
          className: 'text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded',
          testId: 'note-references',
        },
      };
    }

    return {
      type: 'not-used' as const,
      message: 'No notes found',
      className: 'text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1',
      testId: 'notes-used-count',
      icon: 'warning',
      reference: null,
    };
  };

  return {
    integration,
    getWelcomeMessage,
    getStatusIndicatorConfig,
    getConnectionStatusConfig,
    getNotesUsedConfig,
  };
};