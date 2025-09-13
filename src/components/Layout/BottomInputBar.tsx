/**
 * BottomInputBar Component - Voice-first input with adaptive UI
 * Following vertical slice architecture and SOLID principles
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useInputMode } from '@/hooks/useInputMode';
import type { InputProps } from '@/types/input.types';

interface BottomInputBarProps extends InputProps {
  className?: string;
}

const BottomInputBar: React.FC<BottomInputBarProps> = ({
  onSend,
  onVoiceRecord,
  onFileAttach,
  onModeChange,
  placeholder = 'Type a message or click the microphone to record...',
  maxCharacters = 4000,
  maxRecordingTime = 300,
  disabled = false,
  allowFileAttach = true,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showInputField, setShowInputField] = useState(false);

  const {
    mode,
    textContent,
    isRecording,
    voiceRecordingState,
    isLoading,
    characterCount,
    recordingTime,
    error,
    validation,
    voiceVisualization,
    attachments,
    isMobileKeyboardVisible,
    inputRef,
    setTextContent,
    setMode,
    startRecording,
    stopRecording,
    handleSend,
    handleFileAttach,
    handleEnterPress,
    handleEscapePress,
    clearError,
    resetState
  } = useInputMode({
    onSend,
    onVoiceRecord,
    onFileAttach,
    onModeChange,
    maxCharacters,
    maxRecordingTime,
    allowFileAttach,
    placeholder,
    disabled
  });

  // Show/hide input field based on mode and content
  useEffect(() => {
    const shouldShowInput = mode === 'text' || textContent.length > 0;
    setShowInputField(shouldShowInput);
  }, [mode, textContent.length]);

  // Auto-resize textarea
  const handleTextareaResize = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputRef]);

  // Handle text input changes
  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    if (value.length <= maxCharacters) {
      setTextContent(value);
      handleTextareaResize();
    }
  }, [setTextContent, maxCharacters, handleTextareaResize]);

  // Handle microphone button click
  const handleMicClick = useCallback(() => {
    if (disabled) return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [disabled, isRecording, stopRecording, startRecording]);

  // Handle send button click
  const handleSendClick = useCallback(() => {
    if (disabled || !validation.isValid) return;
    handleSend();
  }, [disabled, validation.isValid, handleSend]);

  // Handle file attachment click
  const handleFileClick = useCallback(() => {
    if (!allowFileAttach || disabled) return;
    fileInputRef.current?.click();
  }, [allowFileAttach, disabled]);

  // Handle file selection
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileAttach(files);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileAttach]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      handleEnterPress(event);
    } else if (event.key === 'Escape') {
      handleEscapePress();
    }
  }, [handleEnterPress, handleEscapePress]);

  // Format recording time
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Determine which button to show (mic or send)
  const shouldShowSendButton = textContent.trim().length > 0 || attachments.length > 0;

  const containerClasses = `
    fixed bottom-0 left-0 right-0 z-40
    bg-secondary border-t border-default
    transition-all duration-300 ease-in-out
    ${isMobileKeyboardVisible ? 'pb-0' : 'pb-4'}
    ${className}
  `.trim();

  const inputContainerClasses = `
    max-w-4xl mx-auto px-4 py-3
    ${isMobileKeyboardVisible ? 'pb-2' : ''}
  `.trim();

  const inputWrapperClasses = `
    relative flex items-end gap-2 p-3
    bg-tertiary rounded-2xl border border-muted
    transition-all duration-200 ease-in-out
    ${showInputField ? 'min-h-[56px]' : 'min-h-[56px]'}
    ${isRecording ? 'border-accent-primary ring-2 ring-accent-primary/20' : ''}
    ${error ? 'border-error ring-2 ring-error/20' : ''}
  `.trim();

  return (
    <>
      <div className={containerClasses}>
        <div className={inputContainerClasses}>
          {/* Error message */}
          {error && (
            <div className="mb-2 px-3 py-2 bg-error/10 border border-error/20 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-error">{error}</p>
                <button
                  onClick={clearError}
                  className="text-error hover:text-error/80 transition-smooth"
                  aria-label="Dismiss error"
                  data-testid="error-dismiss"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Character/time limits */}
          {(characterCount > maxCharacters * 0.8 || recordingTime > maxRecordingTime * 0.8) && (
            <div className="mb-2 px-3 py-1 text-xs text-secondary">
              {characterCount > maxCharacters * 0.8 && (
                <span className={characterCount > maxCharacters * 0.9 ? 'text-warning' : ''}>
                  {characterCount}/{maxCharacters} characters
                </span>
              )}
              {recordingTime > maxRecordingTime * 0.8 && (
                <span className={recordingTime > maxRecordingTime * 0.9 ? 'text-warning' : ''}>
                  Recording: {formatTime(recordingTime)}
                </span>
              )}
            </div>
          )}

          {/* Main input container */}
          <div className={inputWrapperClasses}>
            {/* File attachment button */}
            {allowFileAttach && (
              <button
                onClick={handleFileClick}
                disabled={disabled || isLoading}
                className="flex-shrink-0 p-2 rounded-lg text-secondary hover:text-primary hover:bg-hover transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Attach file"
                data-testid="file-attach-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            )}

            {/* Text input field */}
            <div className={`flex-1 transition-all duration-200 ${showInputField ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <textarea
                ref={inputRef}
                value={textContent}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onInput={handleTextareaResize}
                placeholder={placeholder}
                disabled={disabled || isLoading}
                className={`
                  w-full min-h-[40px] max-h-[120px] resize-none
                  bg-transparent text-primary placeholder-muted
                  border-none outline-none
                  text-sm leading-5
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                style={{ height: '40px' }}
                data-testid="text-input"
                aria-label="Message input"
              />
            </div>

            {/* Voice visualization */}
            {isRecording && (
              <div className="flex-1 flex items-center justify-center">
                <VoiceVisualization
                  isActive={voiceVisualization.isActive}
                  amplitude={voiceVisualization.amplitude}
                  recordingTime={recordingTime}
                />
              </div>
            )}

            {/* Microphone or Send button */}
            {shouldShowSendButton ? (
              <button
                onClick={handleSendClick}
                disabled={disabled || !validation.isValid || isLoading}
                className={`
                  flex-shrink-0 w-10 h-10 rounded-lg
                  flex items-center justify-center
                  transition-all duration-200
                  ${validation.isValid && !disabled && !isLoading
                    ? 'bg-accent-primary text-primary hover:bg-accent-hover'
                    : 'bg-muted text-secondary cursor-not-allowed'
                  }
                `}
                aria-label="Send message"
                data-testid="send-button"
              >
                {isLoading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            ) : (
              <button
                onClick={handleMicClick}
                disabled={disabled || isLoading}
                className={`
                  flex-shrink-0 w-12 h-12 rounded-full
                  flex items-center justify-center
                  transition-all duration-200
                  ${isRecording
                    ? 'bg-error text-primary hover:bg-error/90 animate-pulse'
                    : disabled || isLoading
                    ? 'bg-muted text-secondary cursor-not-allowed'
                    : 'bg-accent-primary text-primary hover:bg-accent-hover hover:scale-105'
                  }
                `}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                data-testid="microphone-button"
              >
                {isLoading ? (
                  <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : isRecording ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 6h12v12H6z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachments.map((attachment) => (
                <AttachmentPreview
                  key={attachment.id}
                  attachment={attachment}
                  onRemove={(id) => {
                    // Handle attachment removal - will be implemented
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.mp3,.mp4,.mov,.avi"
        onChange={handleFileChange}
        className="hidden"
        data-testid="file-input"
      />
    </>
  );
};

// Voice visualization component
interface VoiceVisualizationProps {
  isActive: boolean;
  amplitude: number;
  recordingTime: number;
}

const VoiceVisualization: React.FC<VoiceVisualizationProps> = ({
  isActive,
  amplitude,
  recordingTime
}) => {
  const bars = Array.from({ length: 5 }, (_, i) => {
    const height = isActive ? Math.max(20, amplitude * 0.8 + Math.sin(Date.now() / 200 + i) * 10) : 20;
    return (
      <div
        key={i}
        className="bg-accent-primary rounded-full transition-all duration-100"
        style={{
          width: '3px',
          height: `${height}%`,
          opacity: isActive ? 0.7 + Math.sin(Date.now() / 150 + i * 0.5) * 0.3 : 0.3
        }}
      />
    );
  });

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center gap-1 h-8">
        {bars}
      </div>
      <span className="text-xs text-secondary tabular-nums">
        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
      </span>
    </div>
  );
};

// Attachment preview component
interface AttachmentPreviewProps {
  attachment: {
    id: string;
    name: string;
    size: number;
    type: string;
  };
  onRemove: (id: string) => void;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment, onRemove }) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-hover rounded-lg border border-muted">
      <svg className="w-4 h-4 text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-primary truncate">{attachment.name}</p>
        <p className="text-xs text-secondary">{formatSize(attachment.size)}</p>
      </div>
      <button
        onClick={() => onRemove(attachment.id)}
        className="p-1 rounded text-secondary hover:text-primary hover:bg-hover transition-smooth"
        aria-label="Remove attachment"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default BottomInputBar;