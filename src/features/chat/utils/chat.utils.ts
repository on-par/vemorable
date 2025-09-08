/**
 * Chat Utility Functions
 * 
 * This file contains utility functions for chat operations,
 * following clean code principles and DRY patterns.
 */

import type { 
  Message, 
  ChatError, 
  ChatErrorDetails,
  ChatMessageRequest,
  CreateChatSessionRequest 
} from '../types/chat.types';

/**
 * Generates a unique message ID with timestamp
 */
export const generateMessageId = (suffix?: string): string => {
  const timestamp = Date.now();
  return suffix ? `msg_${timestamp}_${suffix}` : `msg_${timestamp}`;
};

/**
 * Creates a new user message
 */
export const createUserMessage = (content: string): Message => {
  return {
    id: generateMessageId('user'),
    role: 'user',
    content: content.trim(),
    timestamp: new Date().toISOString(),
  };
};

/**
 * Creates a new assistant message
 */
export const createAssistantMessage = (
  content: string, 
  notesUsed?: number
): Message => {
  return {
    id: generateMessageId('assistant'),
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
    notesUsed,
  };
};

/**
 * Creates an error message for display in chat
 */
export const createErrorMessage = (errorMessage: string): Message => {
  return {
    id: generateMessageId('error'),
    role: 'assistant',
    content: errorMessage,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Converts messages to the format expected by the chat API
 */
export const formatMessagesForAPI = (messages: Message[]): Array<{
  role: 'user' | 'assistant';
  content: string;
}> => {
  return messages.map(m => ({
    role: m.role,
    content: m.content,
  }));
};

/**
 * Creates a chat message request body
 */
export const createChatMessageRequest = (
  message: string,
  sessionId: string | null,
  messages: Message[]
): ChatMessageRequest => {
  return {
    message,
    sessionId,
    messages: formatMessagesForAPI(messages),
  };
};

/**
 * Creates a session creation request body
 */
export const createSessionRequest = (firstMessage: string): CreateChatSessionRequest => {
  const title = firstMessage.length > 50 
    ? `${firstMessage.substring(0, 50)}...`
    : firstMessage;
    
  return { title };
};

/**
 * Validates message content
 */
export const validateMessageContent = (content: string): boolean => {
  return content.trim().length > 0 && content.length <= 2000;
};

/**
 * Formats timestamp for display
 */
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Determines error type from response or error object
 */
export const determineErrorType = (error: unknown): ChatError => {
  if (!error) return 'UNKNOWN_ERROR';
  
  if (typeof error === 'string') {
    if (error.includes('network') || error.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    if (error.includes('session')) {
      return 'SESSION_NOT_FOUND';
    }
  }
  
  if (error && typeof error === 'object' && 'response' in error) {
    const errorResponse = error.response as { status?: number };
    if (errorResponse.status === 404) {
      return 'SESSION_NOT_FOUND';
    }
    
    if (errorResponse.status && errorResponse.status >= 500) {
      return 'NETWORK_ERROR';
    }
  }
  
  return 'UNKNOWN_ERROR';
};

/**
 * Creates a detailed error object
 */
export const createChatError = (
  type: ChatError,
  message: string,
  originalError?: Error
): ChatErrorDetails => {
  return {
    type,
    message,
    originalError,
  };
};

/**
 * Gets user-friendly error message based on error type
 */
export const getUserFriendlyErrorMessage = (errorType: ChatError): string => {
  switch (errorType) {
    case 'NETWORK_ERROR':
      return "Sorry, I couldn't connect to the server. Please check your connection and try again.";
    case 'SESSION_NOT_FOUND':
      return "The chat session was not found. Starting a new conversation.";
    case 'MESSAGE_SEND_FAILED':
      return "Sorry, I encountered an error while processing your message. Please try again.";
    case 'SESSION_CREATION_FAILED':
      return "Could not create a new chat session. Your messages will still be processed.";
    case 'SESSION_LOAD_FAILED':
      return "Could not load the previous conversation. Starting fresh.";
    default:
      return "Something went wrong. Please try again.";
  }
};

/**
 * Auto-resizes textarea element based on content
 */
export const autoResizeTextarea = (textarea: HTMLTextAreaElement): void => {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
};

/**
 * Scrolls element into view smoothly
 */
export const scrollToBottom = (element: HTMLElement | null): void => {
  element?.scrollIntoView({ behavior: 'smooth' });
};

/**
 * Extracts response content from API response
 */
export const extractResponseContent = (data: unknown): string => {
  if (data && typeof data === 'object') {
    const dataObj = data as { data?: { response?: string }; response?: string };
    return dataObj.data?.response || dataObj.response || '';
  }
  return '';
};

/**
 * Extracts notes used count from API response
 */
export const extractNotesUsedCount = (data: unknown): number => {
  if (data && typeof data === 'object') {
    const dataObj = data as { data?: { notesUsed?: number }; notesUsed?: number };
    return dataObj.data?.notesUsed || dataObj.notesUsed || 0;
  }
  return 0;
};

/**
 * Checks if a response is successful
 */
export const isSuccessfulResponse = (response: Response): boolean => {
  return response.ok && response.status >= 200 && response.status < 300;
};

/**
 * Handles API response and extracts data safely
 */
export const handleApiResponse = async <T>(
  response: Response
): Promise<T> => {
  if (!isSuccessfulResponse(response)) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
};