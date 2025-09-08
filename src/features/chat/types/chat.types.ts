/**
 * Chat Feature Type Definitions
 * 
 * This file contains all TypeScript type definitions for the chat feature,
 * following the vertical slice architecture pattern.
 */

/**
 * Represents a single message in a chat conversation
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  /** Number of notes used to generate this response (for assistant messages) */
  notesUsed?: number;
}

/**
 * Represents a chat session containing multiple messages
 */
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at?: string;
}

/**
 * Props for the main ChatInterface component
 */
export interface ChatInterfaceProps {
  sessionId?: string;
  onNewSession?: () => void;
  onSessionChange?: (sessionId: string) => void;
}

/**
 * Props for MessageBubble component
 */
export interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isLoading?: boolean;
}

/**
 * API request body for sending a chat message
 */
export interface ChatMessageRequest {
  message: string;
  sessionId?: string | null;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * API response for chat message
 */
export interface ChatMessageResponse {
  success: boolean;
  data?: {
    response: string;
    notesUsed: number;
  };
  response?: string; // Legacy format support
  error?: {
    message: string;
    code: string;
  };
}

/**
 * API request body for creating a new chat session
 */
export interface CreateChatSessionRequest {
  title: string;
}

/**
 * API response for creating a chat session
 */
export interface CreateChatSessionResponse {
  success: boolean;
  data?: ChatSession;
  id?: string; // Legacy format support
  error?: {
    message: string;
    code: string;
  };
}

/**
 * API request body for saving messages to a session
 */
export interface SaveMessagesRequest {
  messages: Message[];
}

/**
 * API response for saving messages
 */
export interface SaveMessagesResponse {
  success: boolean;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Hook state for managing chat functionality
 */
export interface UseChatState {
  messages: Message[];
  currentSessionId: string | null;
  isLoading: boolean;
  inputMessage: string;
}

/**
 * Hook actions for chat functionality
 */
export interface UseChatActions {
  sendMessage: () => Promise<void>;
  setInputMessage: (message: string) => void;
  loadSession: (sessionId: string) => Promise<void>;
  createNewSession: (firstMessage: string) => Promise<string | null>;
  handleNewChat: () => void;
}

/**
 * Return type for useChat hook
 */
export interface UseChatReturn extends UseChatState, UseChatActions {}

/**
 * Hook state for notes integration
 */
export interface UseNotesIntegrationState {
  isNotesLoading: boolean;
  notesCount: number;
  hasNotesAvailable: boolean;
}

/**
 * Return type for useChatNotesIntegration hook
 */
export interface UseNotesIntegrationReturn {
  isNotesLoading: boolean;
  notesCount: number;
  hasNotesAvailable: boolean;
}

/**
 * Error types for chat operations
 */
export type ChatError = 
  | 'NETWORK_ERROR'
  | 'SESSION_NOT_FOUND'
  | 'MESSAGE_SEND_FAILED'
  | 'SESSION_CREATION_FAILED'
  | 'SESSION_LOAD_FAILED'
  | 'UNKNOWN_ERROR';

/**
 * Chat error with details
 */
export interface ChatErrorDetails {
  type: ChatError;
  message: string;
  originalError?: Error;
}