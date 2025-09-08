/**
 * Chat Feature Exports
 * 
 * Central export point for the chat feature following vertical slice architecture.
 * Exports components, hooks, types, and utilities for use by other parts of the application.
 */

// Main component exports
export { default as ChatInterface } from './components/ChatInterface';
export { default as MessageBubble } from './components/MessageBubble';
export { default as ChatHeader } from './components/ChatHeader';
export { default as MessageList } from './components/MessageList';
export { default as ChatInput } from './components/ChatInput';
export { default as ChatErrorBoundary } from './components/ChatErrorBoundary';

// Hook exports
export { useChat } from './hooks/useChat';
export { useChatNotesIntegration, useNotesIntegrationUtils } from './hooks/useChatNotesIntegration';

// Type exports
export type {
  Message,
  ChatSession,
  ChatInterfaceProps,
  MessageBubbleProps,
  ChatMessageRequest,
  ChatMessageResponse,
  CreateChatSessionRequest,
  CreateChatSessionResponse,
  SaveMessagesRequest,
  SaveMessagesResponse,
  UseChatState,
  UseChatActions,
  UseChatReturn,
  UseNotesIntegrationState,
  UseNotesIntegrationReturn,
  ChatError,
  ChatErrorDetails,
} from './types/chat.types';

// Utility exports
export {
  generateMessageId,
  createUserMessage,
  createAssistantMessage,
  createErrorMessage,
  formatMessagesForAPI,
  createChatMessageRequest,
  createSessionRequest,
  validateMessageContent,
  formatTimestamp,
  determineErrorType,
  createChatError,
  getUserFriendlyErrorMessage,
  autoResizeTextarea,
  scrollToBottom,
  extractResponseContent,
  extractNotesUsedCount,
  isSuccessfulResponse,
  handleApiResponse,
} from './utils/chat.utils';