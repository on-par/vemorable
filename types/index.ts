/**
 * Core types for Vemorable app
 */

export type InsightMode = 'action' | 'tension' | 'clarity' | 'pattern';

export interface InsightModeConfig {
  name: string;
  description: string;
  prompt: string;
}

export interface Dump {
  id: string;
  user_id: string;
  audio_url: string | null;
  transcript: string;
  one_thing: string;
  insight_mode: InsightMode;
  tags: string[];
  embedding?: number[];
  duration_seconds: number | null;
  prompt_shown: string | null;
  created_at: string;
}

export interface CreateDumpRequest {
  audio_base64: string;
  insight_mode: InsightMode;
  prompt_shown: string;
}

export interface CreateDumpResponse {
  id: string;
  transcript: string;
  one_thing: string;
  tags: string[];
  duration_seconds: number;
}

export interface SearchDumpsRequest {
  query: string;
  limit?: number;
}

export interface SearchResult extends Dump {
  similarity: number;
}

export interface SearchDumpsResponse {
  results: SearchResult[];
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUri: string | null;
  error: string | null;
}

export interface ProcessingState {
  isProcessing: boolean;
  step: 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'saving';
  error: string | null;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
