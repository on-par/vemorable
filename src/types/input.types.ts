/**
 * Input types for the bottom input bar component
 * Following SOLID principles and TypeScript best practices
 */

export type InputMode = 'voice' | 'text';

export type VoiceRecordingState = 'idle' | 'recording' | 'processing' | 'complete' | 'error';

export interface InputState {
  mode: InputMode;
  textContent: string;
  isRecording: boolean;
  voiceRecordingState: VoiceRecordingState;
  isLoading: boolean;
  hasAttachments: boolean;
  characterCount: number;
  recordingTime: number;
  error: string | null;
}

export interface InputActions {
  setMode: (mode: InputMode) => void;
  setTextContent: (content: string) => void;
  startRecording: () => void;
  stopRecording: () => void;
  clearInput: () => void;
  handleSend: () => void;
  handleFileAttach: (files: FileList) => void;
  clearError: () => void;
}

export interface InputProps {
  onSend?: (content: string, mode: InputMode) => void;
  onVoiceRecord?: (audioBlob: Blob) => void;
  onFileAttach?: (files: FileList) => void;
  onModeChange?: (mode: InputMode) => void;
  placeholder?: string;
  maxCharacters?: number;
  maxRecordingTime?: number;
  disabled?: boolean;
  allowFileAttach?: boolean;
  className?: string;
}

export interface VoiceVisualization {
  isActive: boolean;
  amplitude: number;
  waveformData: number[];
  recordingTime: number;
}

export interface InputKeyboardActions {
  handleEnterPress: (event: React.KeyboardEvent) => void;
  handleEscapePress: () => void;
  handleShiftEnter: (event: React.KeyboardEvent) => void;
}

export interface InputValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
}

export interface InputLimits {
  maxCharacters: number;
  maxRecordingTime: number; // in seconds
  maxFileSize: number; // in bytes
  allowedFileTypes: string[];
}

export interface MobileKeyboardConfig {
  adjustViewportOnShow: boolean;
  scrollToInputOnFocus: boolean;
  hideOnSubmit: boolean;
}

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'compact' | 'expanded';

export interface InputAnimationConfig {
  buttonSwapDuration: number;
  inputExpandDuration: number;
  voiceVisualizationDuration: number;
  enableReducedMotion: boolean;
}