/**
 * useChat Hook
 * 
 * Custom hook that manages all chat functionality including:
 * - Message sending and receiving
 * - Session management
 * - Loading states
 * - Error handling
 * 
 * Follows the Single Responsibility Principle by focusing solely on chat logic.
 */

import { useState, useCallback } from 'react';
import type { 
  Message, 
  UseChatReturn,
  ChatMessageResponse,
  CreateChatSessionResponse
} from '../types/chat.types';
import {
  createUserMessage,
  createAssistantMessage,
  createErrorMessage,
  createChatMessageRequest,
  createSessionRequest,
  validateMessageContent,
  determineErrorType,
  getUserFriendlyErrorMessage,
  extractResponseContent,
  extractNotesUsedCount,
  handleApiResponse,
} from '../utils/chat.utils';

/**
 * Configuration for API endpoints
 */
const API_ENDPOINTS = {
  CHAT: '/api/chat',
  SESSIONS: '/api/chat/sessions',
  SESSION_MESSAGES: (sessionId: string) => `/api/chat/sessions/${sessionId}/messages`,
} as const;

/**
 * Hook for managing chat functionality
 */
export const useChat = (
  initialSessionId?: string,
  onSessionChange?: (sessionId: string) => void
): UseChatReturn => {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    initialSessionId || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  /**
   * Loads messages from an existing session
   */
  const loadSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.SESSIONS}/${sessionId}`);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setCurrentSessionId(sessionId);
      } else {
        console.warn(`Failed to load session ${sessionId}: ${response.status}`);
        // Don't throw error, just log warning and continue
      }
    } catch (error) {
      const errorType = determineErrorType(error);
      console.error('Failed to load chat session:', error);
      
      // If it's a critical error, we might want to notify the user
      if (errorType === 'NETWORK_ERROR') {
        const errorMessage = createErrorMessage(
          getUserFriendlyErrorMessage('SESSION_LOAD_FAILED')
        );
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  }, []);

  /**
   * Creates a new chat session
   */
  const createNewSession = useCallback(async (firstMessage: string): Promise<string | null> => {
    try {
      const requestBody = createSessionRequest(firstMessage);
      
      const response = await fetch(API_ENDPOINTS.SESSIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data: CreateChatSessionResponse = await handleApiResponse(response);
        return data.id || data.data?.id || null;
      }
    } catch (error) {
      console.error('Failed to create chat session:', error);
    }
    
    return null;
  }, []);

  /**
   * Saves messages to the current session
   */
  const saveMessagesToSession = useCallback(async (
    sessionId: string,
    messagesToSave: Message[]
  ): Promise<void> => {
    try {
      const response = await fetch(API_ENDPOINTS.SESSION_MESSAGES(sessionId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesToSave,
        }),
      });

      if (!response.ok) {
        console.warn(`Failed to save messages to session ${sessionId}: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to save messages to session:', error);
    }
  }, []);

  /**
   * Sends a message and handles the response
   */
  const sendMessage = useCallback(async (): Promise<void> => {
    // Validation
    if (!validateMessageContent(inputMessage) || isLoading) {
      return;
    }

    const userMessage = createUserMessage(inputMessage);
    
    // Add user message immediately and clear input
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Create session if needed
      let sessionToUse = currentSessionId;
      if (!sessionToUse) {
        sessionToUse = await createNewSession(userMessage.content);
        if (sessionToUse) {
          setCurrentSessionId(sessionToUse);
          onSessionChange?.(sessionToUse);
        }
      }

      // Send message to API
      const requestBody = createChatMessageRequest(
        userMessage.content,
        sessionToUse,
        messages
      );

      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data: ChatMessageResponse = await handleApiResponse(response);
        
        const assistantMessage = createAssistantMessage(
          extractResponseContent(data),
          extractNotesUsedCount(data)
        );

        setMessages(prev => [...prev, assistantMessage]);

        // Save messages to session if we have one
        if (sessionToUse) {
          await saveMessagesToSession(sessionToUse, [userMessage, assistantMessage]);
        }
      } else {
        // Handle API error
        const errorMessage = createErrorMessage(
          getUserFriendlyErrorMessage('MESSAGE_SEND_FAILED')
        );
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorType = determineErrorType(error);
      const errorMessage = createErrorMessage(
        getUserFriendlyErrorMessage(errorType)
      );
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [
    inputMessage,
    isLoading,
    currentSessionId,
    messages,
    createNewSession,
    saveMessagesToSession,
    onSessionChange,
  ]);

  /**
   * Starts a new chat conversation
   */
  const handleNewChat = useCallback((): void => {
    setMessages([]);
    setCurrentSessionId(null);
    setInputMessage('');
    setIsLoading(false);
  }, []);

  return {
    // State
    messages,
    currentSessionId,
    isLoading,
    inputMessage,
    
    // Actions
    sendMessage,
    setInputMessage,
    loadSession,
    createNewSession,
    handleNewChat,
  };
};