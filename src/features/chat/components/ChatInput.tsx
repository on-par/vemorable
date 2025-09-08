/**
 * ChatInput Component
 * 
 * Handles user input for chat messages including:
 * - Auto-resizing textarea
 * - Character count
 * - Send button with loading state
 * - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
 * 
 * Features:
 * - Input validation
 * - Loading states
 * - Accessibility support
 * - Character limit feedback
 */

'use client';

import React, { memo, useCallback, useEffect, useRef } from 'react';
import { autoResizeTextarea, validateMessageContent } from '../utils/chat.utils';

interface ChatInputProps {
  inputMessage: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  placeholder?: string;
  maxLength?: number;
}

/**
 * Icon components
 */
const SendIcon = memo(() => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
    />
  </svg>
));
SendIcon.displayName = 'SendIcon';

const SpinnerIcon = memo(() => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4" 
      fill="none" 
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
    />
  </svg>
));
SpinnerIcon.displayName = 'SpinnerIcon';

/**
 * Character count indicator component
 */
const CharacterCount = memo<{ 
  currentLength: number; 
  maxLength: number; 
}>(({ currentLength, maxLength }) => {
  if (currentLength === 0) return null;

  const isNearLimit = currentLength > maxLength * 0.8;
  const isOverLimit = currentLength > maxLength;

  return (
    <span 
      className={`absolute bottom-3 right-3 text-xs ${
        isOverLimit 
          ? 'text-red-500' 
          : isNearLimit 
            ? 'text-yellow-600' 
            : 'text-gray-400'
      }`}
      aria-live="polite"
    >
      {currentLength}/{maxLength}
    </span>
  );
});
CharacterCount.displayName = 'CharacterCount';

/**
 * Send button component
 */
const SendButton = memo<{
  isDisabled: boolean;
  isLoading: boolean;
  onClick: () => void;
}>(({ isDisabled, isLoading, onClick }) => {
  const handleClick = useCallback(() => {
    if (!isDisabled) {
      onClick();
    }
  }, [isDisabled, onClick]);

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={isLoading ? "Sending message..." : "Send message"}
    >
      {isLoading ? (
        <>
          <SpinnerIcon />
          <span>Thinking...</span>
        </>
      ) : (
        <>
          <SendIcon />
          <span>Send</span>
        </>
      )}
    </button>
  );
});
SendButton.displayName = 'SendButton';

/**
 * Textarea component with auto-resize functionality
 */
const AutoResizeTextarea = memo<{
  value: string;
  placeholder: string;
  disabled: boolean;
  maxLength: number;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}>(({ 
  value, 
  placeholder, 
  disabled, 
  maxLength, 
  onChange, 
  onKeyDown 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea when content changes
  useEffect(() => {
    if (textareaRef.current) {
      autoResizeTextarea(textareaRef.current);
    }
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  }, [onChange, maxLength]);

  return (
    <div className="flex-1 relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
        rows={1}
        style={{ maxHeight: '120px' }}
        aria-describedby="input-help"
        maxLength={maxLength}
      />
      <CharacterCount currentLength={value.length} maxLength={maxLength} />
    </div>
  );
});
AutoResizeTextarea.displayName = 'AutoResizeTextarea';

/**
 * Input help text component
 */
const InputHelpText = memo(() => (
  <p id="input-help" className="mt-2 text-xs text-gray-500">
    Press Enter to send, Shift+Enter for new line
  </p>
));
InputHelpText.displayName = 'InputHelpText';

/**
 * ChatInput component for handling user message input
 */
const ChatInput = memo<ChatInputProps>(({ 
  inputMessage,
  isLoading,
  onInputChange,
  onSendMessage,
  placeholder = "Ask about your notes...",
  maxLength = 2000,
}) => {
  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  }, [onSendMessage]);

  /**
   * Determine if send button should be disabled
   */
  const isSendDisabled = !validateMessageContent(inputMessage) || isLoading;

  return (
    <div className="border-t border-gray-200 px-6 py-4">
      <div className="flex gap-3">
        <AutoResizeTextarea
          value={inputMessage}
          placeholder={placeholder}
          disabled={isLoading}
          maxLength={maxLength}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
        />
        
        <SendButton
          isDisabled={isSendDisabled}
          isLoading={isLoading}
          onClick={onSendMessage}
        />
      </div>
      
      <InputHelpText />
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;