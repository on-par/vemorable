/**
 * MessageBubble Component
 * 
 * A reusable message bubble component for displaying chat messages.
 * Supports both user and assistant messages with loading states.
 * 
 * Features:
 * - Role-based styling (user vs assistant)
 * - Timestamp formatting
 * - Loading animation
 * - Multiline text support
 * - Responsive design
 */

'use client';

import React, { memo } from 'react';
import type { MessageBubbleProps } from '../types/chat.types';
import { formatTimestamp } from '../utils/chat.utils';

/**
 * Icon component for user avatar
 */
const UserIcon = memo(() => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
    />
  </svg>
));
UserIcon.displayName = 'UserIcon';

/**
 * Icon component for assistant avatar
 */
const AssistantIcon = memo(() => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
    />
  </svg>
));
AssistantIcon.displayName = 'AssistantIcon';

/**
 * Loading dots animation component
 */
const LoadingDots = memo(() => (
  <div className="flex items-center space-x-2">
    <div 
      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
      style={{ animationDelay: '0ms' }}
    />
    <div 
      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
      style={{ animationDelay: '150ms' }}
    />
    <div 
      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
      style={{ animationDelay: '300ms' }}
    />
  </div>
));
LoadingDots.displayName = 'LoadingDots';

/**
 * Message content component with multiline support
 */
const MessageContent = memo<{ content: string }>(({ content }) => (
  <div className="whitespace-pre-wrap break-words">
    {content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {index > 0 && <br />}
        {line}
      </React.Fragment>
    ))}
  </div>
));
MessageContent.displayName = 'MessageContent';

/**
 * Avatar component for message bubbles
 */
const MessageAvatar = memo<{ isUser: boolean }>(({ isUser }) => (
  <div 
    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
      isUser ? 'bg-blue-500' : 'bg-gray-700'
    }`}
  >
    {isUser ? <UserIcon /> : <AssistantIcon />}
  </div>
));
MessageAvatar.displayName = 'MessageAvatar';

/**
 * Timestamp component for messages
 */
const MessageTimestamp = memo<{ timestamp?: string; isUser: boolean }>(({ 
  timestamp, 
  isUser 
}) => (
  timestamp ? (
    <span className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
      {formatTimestamp(timestamp)}
    </span>
  ) : null
));
MessageTimestamp.displayName = 'MessageTimestamp';

/**
 * MessageBubble component for displaying individual chat messages
 */
const MessageBubble = memo<MessageBubbleProps>(({ 
  role, 
  content, 
  timestamp,
  isLoading = false 
}) => {
  const isUser = role === 'user';

  // Loading state rendering
  if (isLoading) {
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] ${isUser ? 'order-2' : ''}`}>
          <div className="bg-gray-100 rounded-lg px-4 py-3">
            <LoadingDots />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-end gap-2 max-w-[70%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <MessageAvatar isUser={isUser} />

        <div className="flex flex-col">
          <div className={`rounded-lg px-4 py-2 ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            <MessageContent content={content} />
          </div>
          
          <MessageTimestamp timestamp={timestamp} isUser={isUser} />
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;