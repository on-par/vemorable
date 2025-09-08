/**
 * ChatHeader Component
 * 
 * Displays the chat header with title, session status, and notes integration status.
 * Provides new chat functionality and visual feedback for notes availability.
 * 
 * Features:
 * - Session status indicator
 * - Notes availability feedback
 * - New chat button
 * - Notes integration status
 */

'use client';

import React, { memo, useCallback } from 'react';
import { useNotesIntegrationUtils } from '../hooks/useChatNotesIntegration';

interface ChatHeaderProps {
  currentSessionId: string | null;
  onNewChat: () => void;
}

/**
 * Icon components for different states
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

const PlusIcon = memo(() => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M12 4v16m8-8H4" 
    />
  </svg>
));
PlusIcon.displayName = 'PlusIcon';

/**
 * Session status indicator component
 */
const SessionStatus = memo<{ sessionId: string | null }>(({ sessionId }) => {
  if (!sessionId) return null;

  return (
    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
      Session Active
    </span>
  );
});
SessionStatus.displayName = 'SessionStatus';

/**
 * Notes status indicator component
 */
const NotesStatusIndicator = memo(() => {
  const { getStatusIndicatorConfig } = useNotesIntegrationUtils();
  const config = getStatusIndicatorConfig();

  const IconComponent = config.icon === 'document' ? DocumentIcon : WarningIcon;

  return (
    <span className={config.className} data-testid={config.testId}>
      <IconComponent />
      {config.message}
    </span>
  );
});
NotesStatusIndicator.displayName = 'NotesStatusIndicator';

/**
 * Notes connection status component
 */
const NotesConnectionStatus = memo(() => {
  const { getConnectionStatusConfig } = useNotesIntegrationUtils();
  const config = getConnectionStatusConfig();

  if (!config) return null;

  return (
    <span className={config.className} data-testid={config.testId}>
      {config.message}
    </span>
  );
});
NotesConnectionStatus.displayName = 'NotesConnectionStatus';

/**
 * New chat button component
 */
const NewChatButton = memo<{ onClick: () => void }>(({ onClick }) => {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Start a new chat conversation"
    >
      <PlusIcon />
      New Chat
    </button>
  );
});
NewChatButton.displayName = 'NewChatButton';

/**
 * Notes integration indicators container
 */
const NotesIntegrationIndicators = memo(() => {
  const { integration } = useNotesIntegrationUtils();

  if (integration.isNotesLoading) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded animate-pulse">
          Loading notes...
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <NotesStatusIndicator />
      <NotesConnectionStatus />
    </div>
  );
});
NotesIntegrationIndicators.displayName = 'NotesIntegrationIndicators';

/**
 * ChatHeader component for displaying chat header with status and controls
 */
const ChatHeader = memo<ChatHeaderProps>(({ 
  currentSessionId, 
  onNewChat 
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Chat with your Notes
        </h2>
        
        <SessionStatus sessionId={currentSessionId} />
        <NotesIntegrationIndicators />
      </div>
      
      <NewChatButton onClick={onNewChat} />
    </div>
  );
});

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;