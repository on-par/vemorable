/**
 * Custom hook for input mode state management
 * Following clean code principles and TDD approach
 * Integrates with existing useVoiceRecording hook
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useVoiceRecording } from './useVoiceRecording';
import type {
  InputMode,
  InputState,
  InputActions,
  InputKeyboardActions,
  InputValidation,
  FileAttachment,
  InputLimits,
  VoiceVisualization,
  MobileKeyboardConfig
} from '@/types/input.types';

interface UseInputModeProps {
  onSend?: (content: string, mode: InputMode) => void;
  onVoiceRecord?: (audioBlob: Blob) => void;
  onFileAttach?: (files: FileList) => void;
  onModeChange?: (mode: InputMode) => void;
  maxCharacters?: number;
  maxRecordingTime?: number;
  allowFileAttach?: boolean;
  placeholder?: string;
  disabled?: boolean;
  mobileKeyboardConfig?: MobileKeyboardConfig;
}

interface UseInputModeReturn extends InputState, InputActions, InputKeyboardActions {
  validation: InputValidation;
  voiceVisualization: VoiceVisualization;
  attachments: FileAttachment[];
  limits: InputLimits;
  isMobileKeyboardVisible: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  resetState: () => void;
}

const DEFAULT_LIMITS: InputLimits = {
  maxCharacters: 4000,
  maxRecordingTime: 300, // 5 minutes
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/*', 'audio/*', 'video/*', '.pdf', '.doc', '.docx', '.txt']
};

const DEFAULT_MOBILE_CONFIG: MobileKeyboardConfig = {
  adjustViewportOnShow: true,
  scrollToInputOnFocus: true,
  hideOnSubmit: true
};

export const useInputMode = ({
  onSend,
  onVoiceRecord,
  onFileAttach,
  onModeChange,
  maxCharacters = DEFAULT_LIMITS.maxCharacters,
  maxRecordingTime = DEFAULT_LIMITS.maxRecordingTime,
  allowFileAttach = true,
  placeholder = 'Type a message or click the microphone to record...',
  disabled = false,
  mobileKeyboardConfig = DEFAULT_MOBILE_CONFIG
}: UseInputModeProps = {}): UseInputModeReturn => {

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Voice recording integration
  const {
    isRecording,
    recordingTime,
    audioBlob,
    error: voiceError,
    startRecording,
    stopRecording,
    resetRecording,
    isPermissionGranted
  } = useVoiceRecording({
    maxDuration: maxRecordingTime
  });

  // Input state
  const [mode, setModeState] = useState<InputMode>('voice');
  const [textContent, setTextContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isMobileKeyboardVisible, setIsMobileKeyboardVisible] = useState(false);

  // Voice visualization state
  const [voiceVisualization, setVoiceVisualization] = useState<VoiceVisualization>({
    isActive: false,
    amplitude: 0,
    waveformData: [],
    recordingTime: 0
  });

  const limits: InputLimits = {
    maxCharacters,
    maxRecordingTime,
    maxFileSize: DEFAULT_LIMITS.maxFileSize,
    allowedFileTypes: DEFAULT_LIMITS.allowedFileTypes
  };

  // Character count
  const characterCount = textContent.length;

  // Input validation
  const validation: InputValidation = {
    isValid: textContent.trim().length > 0 || audioBlob !== null || attachments.length > 0,
    errors: [
      ...(characterCount > maxCharacters ? [`Message exceeds ${maxCharacters} characters`] : []),
      ...(voiceError ? [voiceError] : []),
      ...(error ? [error] : [])
    ],
    warnings: [
      ...(characterCount > maxCharacters * 0.9 ? [`Approaching character limit (${characterCount}/${maxCharacters})`] : [])
    ]
  };

  // Combined state
  const inputState: InputState = {
    mode,
    textContent,
    isRecording,
    voiceRecordingState: isRecording ? 'recording' : audioBlob ? 'complete' : isLoading ? 'processing' : error ? 'error' : 'idle',
    isLoading: isLoading || false,
    hasAttachments: attachments.length > 0,
    characterCount,
    recordingTime,
    error: error || voiceError
  };

  // Auto-switch to text mode when user starts typing
  const handleTextChange = useCallback((content: string) => {
    setTextContent(content);
    if (content.trim() && mode === 'voice') {
      setModeState('text');
      onModeChange?.('text');
    }
  }, [mode, onModeChange]);

  // Mode switching
  const setMode = useCallback((newMode: InputMode) => {
    if (disabled) return;

    if (newMode === 'voice' && isRecording) {
      stopRecording();
    }

    setModeState(newMode);
    onModeChange?.(newMode);

    // Focus input when switching to text mode
    if (newMode === 'text' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled, isRecording, stopRecording, onModeChange]);

  // Start voice recording
  const handleStartRecording = useCallback(async () => {
    if (disabled) return;

    try {
      setError(null);
      setMode('voice');
      await startRecording();

      setVoiceVisualization(prev => ({
        ...prev,
        isActive: true,
        recordingTime: 0
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
    }
  }, [disabled, setMode, startRecording]);

  // Stop voice recording
  const handleStopRecording = useCallback(() => {
    stopRecording();
    setVoiceVisualization(prev => ({
      ...prev,
      isActive: false
    }));
  }, [stopRecording]);

  // Send message
  const handleSend = useCallback(() => {
    if (disabled || !validation.isValid) return;

    setIsLoading(true);

    try {
      if (mode === 'text' && textContent.trim()) {
        onSend?.(textContent.trim(), 'text');
      } else if (mode === 'voice' && audioBlob) {
        onVoiceRecord?.(audioBlob);
        onSend?.('Voice message', 'voice');
      }

      // Clear input after sending
      setTextContent('');
      setAttachments([]);
      resetRecording();
      setMode('voice');

      if (mobileKeyboardConfig.hideOnSubmit) {
        inputRef.current?.blur();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [disabled, validation.isValid, mode, textContent, audioBlob, onSend, onVoiceRecord, resetRecording, setMode, mobileKeyboardConfig.hideOnSubmit]);

  // File attachment handling
  const handleFileAttach = useCallback((files: FileList) => {
    if (!allowFileAttach || disabled) return;

    const newAttachments: FileAttachment[] = [];

    Array.from(files).forEach((file, index) => {
      if (file.size > limits.maxFileSize) {
        setError(`File "${file.name}" is too large. Maximum size is ${limits.maxFileSize / (1024 * 1024)}MB.`);
        return;
      }

      const attachment: FileAttachment = {
        id: `${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      };

      newAttachments.push(attachment);
    });

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
      onFileAttach?.(files);
    }
  }, [allowFileAttach, disabled, limits.maxFileSize, onFileAttach]);

  // Clear input
  const clearInput = useCallback(() => {
    setTextContent('');
    setAttachments([]);
    resetRecording();
    setError(null);
    setMode('voice');
  }, [resetRecording, setMode]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset entire state
  const resetState = useCallback(() => {
    clearInput();
    setIsLoading(false);
    setVoiceVisualization({
      isActive: false,
      amplitude: 0,
      waveformData: [],
      recordingTime: 0
    });
  }, [clearInput]);

  // Keyboard handlers
  const handleEnterPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleShiftEnter = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && event.shiftKey) {
      // Allow normal newline behavior
      return;
    }
  }, []);

  const handleEscapePress = useCallback(() => {
    if (isRecording) {
      handleStopRecording();
    } else {
      clearInput();
    }
  }, [isRecording, handleStopRecording, clearInput]);

  // Mobile keyboard detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const isKeyboardVisible = window.innerHeight < window.outerHeight * 0.75;
      setIsMobileKeyboardVisible(isKeyboardVisible);
    };

    const handleFocusIn = () => {
      if (mobileKeyboardConfig.scrollToInputOnFocus && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [mobileKeyboardConfig.scrollToInputOnFocus]);

  // Update voice visualization with recording time
  useEffect(() => {
    if (isRecording) {
      setVoiceVisualization(prev => ({
        ...prev,
        recordingTime,
        amplitude: Math.random() * 100 // Simulate amplitude - replace with real audio analysis
      }));
    }
  }, [isRecording, recordingTime]);

  // Auto-send voice recording when complete
  useEffect(() => {
    if (audioBlob && mode === 'voice' && !isLoading) {
      // Small delay to allow UI to update
      setTimeout(() => {
        handleSend();
      }, 500);
    }
  }, [audioBlob, mode, isLoading, handleSend]);

  return {
    // State
    ...inputState,

    // Actions
    setMode,
    setTextContent: handleTextChange,
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording,
    clearInput,
    handleSend,
    handleFileAttach,
    clearError,

    // Keyboard actions
    handleEnterPress,
    handleEscapePress,
    handleShiftEnter,

    // Additional data
    validation,
    voiceVisualization,
    attachments,
    limits,
    isMobileKeyboardVisible,
    inputRef,
    resetState
  };
};

export default useInputMode;