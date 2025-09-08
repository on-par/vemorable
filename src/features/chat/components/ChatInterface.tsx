/**
 * ChatInterface Component
 * 
 * Main chat interface component that orchestrates all chat functionality.
 * Follows vertical slice architecture and separation of concerns.
 * 
 * Features:
 * - Clean component composition
 * - Custom hooks for business logic
 * - Performance optimizations
 * - Error boundary integration
 * - Notes integration
 */

'use client';

import React, { memo, useCallback, useEffect } from 'react';
import ChatErrorBoundary from './ChatErrorBoundary';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { useChat } from '../hooks/useChat';
import type { ChatInterfaceProps } from '../types/chat.types';

/**
 * Core ChatInterface implementation without error boundary
 */
const ChatInterfaceCore = memo<ChatInterfaceProps>(({ 
  sessionId, 
  onNewSession,
  onSessionChange 
}) => {
  // Use custom hook for all chat logic
  const {
    messages,
    currentSessionId,
    isLoading,
    inputMessage,
    sendMessage,
    setInputMessage,
    loadSession,
    handleNewChat,
  } = useChat(sessionId, onSessionChange);

  // Load session when sessionId prop changes
  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, currentSessionId, loadSession]);

  // Handle new chat with callback to parent
  const handleNewChatClick = useCallback(() => {
    handleNewChat();
    onNewSession?.();
  }, [handleNewChat, onNewSession]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <ChatHeader 
        currentSessionId={currentSessionId}
        onNewChat={handleNewChatClick}
      />
      
      <MessageList 
        messages={messages}
        isLoading={isLoading}
      />
      
      <ChatInput
        inputMessage={inputMessage}
        isLoading={isLoading}
        onInputChange={setInputMessage}
        onSendMessage={sendMessage}
      />
    </div>
  );
});

ChatInterfaceCore.displayName = 'ChatInterfaceCore';

/**
 * ChatInterface with error boundary wrapper
 */
const ChatInterface = memo<ChatInterfaceProps>((props) => {
  // Handle errors from chat components
  const handleChatError = useCallback((error: Error) => {
    console.error('Chat error:', error);
    
    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: errorTrackingService.captureException(error);
    }
  }, []);

  return (
    <ChatErrorBoundary onError={handleChatError}>
      <ChatInterfaceCore {...props} />
    </ChatErrorBoundary>
  );
});

ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;