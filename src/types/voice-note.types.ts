export interface Note {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  created_at: string;
  processed_content: string;
  raw_transcript?: string;
  user_id?: string;
}

export interface TranscriptionResponse {
  success: boolean;
  data?: {
    text: string;
    confidence?: number;
    duration?: number;
    processingTime?: number;
  };
  text?: string;
  error?: string;
}

export interface ProcessNoteResponse {
  success: boolean;
  data: {
    title: string;
    summary: string;
    tags: string[];
    processed_content: string;
  };
  error?: string;
}

export interface CreateNoteResponse {
  success: boolean;
  data: Note;
  error?: string;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  isPermissionGranted: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  error: string | null;
}

export interface ModalState {
  mode: 'voice' | 'text' | 'file';
  isProcessing: boolean;
  isTranscribing: boolean;
  error: string | null;
  transcription: string | null;
  textContent: string;
  audioBlob: Blob | null;
  selectedFiles: File[];
}