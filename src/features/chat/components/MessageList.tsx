/**
 * MessageList Component
 * 
 * Displays a scrollable list of chat messages with:
 * - Empty state for new conversations
 * - Individual message bubbles
 * - Notes usage indicators
 * - Auto-scroll to bottom functionality
 * - Loading indicator for assistant responses
 * 
 * Features:
 * - Smooth scrolling
 * - Notes integration feedback
 * - Welcome message based on notes availability
 * - Responsive design
 */

'use client';

import React, { memo, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { useNotesIntegrationUtils } from '../hooks/useChatNotesIntegration';
import { scrollToBottom } from '../utils/chat.utils';
import type { Message } from '../types/chat.types';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

/**
 * Chat icon for empty state
 */
const ChatIcon = memo(() => (
  <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={1.5} 
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
    />
  </svg>
));
ChatIcon.displayName = 'ChatIcon';

/**
 * Empty state component when no messages
 */
const EmptyState = memo(() => {
  const { getWelcomeMessage } = useNotesIntegrationUtils();
  const welcomeMessage = getWelcomeMessage();

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <ChatIcon />
      <p className="text-lg font-medium mb-2">Start a conversation</p>
      <p className="text-sm text-center max-w-md">
        {welcomeMessage}
      </p>
    </div>
  );
});
EmptyState.displayName = 'EmptyState';

/**
 * Notes usage indicator component for assistant messages
 */
const NotesUsageIndicator = memo<{ notesUsed?: number }>(({ notesUsed }) => {
  const { getNotesUsedConfig } = useNotesIntegrationUtils();
  const config = getNotesUsedConfig(notesUsed);

  if (!config) return null;

  const IconComponent = config.icon === 'document' ? DocumentIcon : WarningIcon;

  return (
    <div className="flex justify-start mb-2">
      <div className="max-w-[70%] ml-10">
        <div className="flex items-center gap-2">
          <span className={config.className} data-testid={config.testId}>
            <IconComponent />
            {config.message}
          </span>
          
          {config.reference && (
            <span 
              className={config.reference.className} 
              data-testid={config.reference.testId}
            >
              {config.reference.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
NotesUsageIndicator.displayName = 'NotesUsageIndicator';

/**
 * Document icon for notes indicators
 */
const DocumentIcon = memo(() => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
    />
  </svg>
));
DocumentIcon.displayName = 'DocumentIcon';

/**
 * Warning icon for notes indicators
 */
const WarningIcon = memo(() => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
    />
  </svg>
));
WarningIcon.displayName = 'WarningIcon';

/**
 * Individual message item component
 */
const MessageItem = memo<{ message: Message }>(({ message }) => {
  return (
    <div key={message.id}>
      <MessageBubble
        role={message.role}
        content={message.content}
        timestamp={message.timestamp}
      />
      
      {message.role === 'assistant' && message.notesUsed !== undefined && (
        <NotesUsageIndicator notesUsed={message.notesUsed} />
      )}
    </div>
  );
});
MessageItem.displayName = 'MessageItem';

/**
 * Loading indicator component
 */
const LoadingIndicator = memo(() => (
  <MessageBubble
    role="assistant"
    content=""
    isLoading={true}
  />
));
LoadingIndicator.displayName = 'LoadingIndicator';

/**
 * Scroll anchor component for auto-scroll functionality
 */
const ScrollAnchor = memo<{ messagesEndRef: React.RefObject<HTMLDivElement | null> }>(({ 
  messagesEndRef 
}) => (
  <div ref={messagesEndRef} />
));
ScrollAnchor.displayName = 'ScrollAnchor';

/**
 * Messages container with scrolling functionality
 */
const MessagesContainer = memo<{
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}>(({ messages, isLoading, messagesEndRef }) => {
  return (
    <>
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      
      {isLoading && <LoadingIndicator />}
      
      <ScrollAnchor messagesEndRef={messagesEndRef} />
    </>
  );
});
MessagesContainer.displayName = 'MessagesContainer';

/**
 * MessageList component for displaying chat messages
 */
const MessageList = memo<MessageListProps>(({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom(messagesEndRef.current);
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {messages.length === 0 ? (
        <EmptyState />
      ) : (
        <MessagesContainer 
          messages={messages} 
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />
      )}
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;