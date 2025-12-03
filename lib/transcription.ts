/**
 * Audio transcription utilities
 * Note: Actual transcription happens in the Edge Function
 * This file contains client-side helpers
 */

export interface TranscriptionResult {
  text: string;
  duration: number;
  language?: string;
}

/**
 * Estimate transcription time based on audio duration
 * Whisper typically processes at ~10x real-time
 */
export function estimateTranscriptionTime(audioDurationSeconds: number): number {
  const baseTime = 2; // Base overhead in seconds
  const processingRate = 0.1; // Whisper processes ~10x faster than real-time
  return baseTime + (audioDurationSeconds * processingRate);
}

/**
 * Format transcript for display
 * Handles paragraph breaks and cleanup
 */
export function formatTranscript(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s+/g, '$1\n\n');
}

/**
 * Split transcript into sentences
 */
export function splitIntoSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Get word count from transcript
 */
export function getWordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Estimate reading time in minutes
 */
export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = getWordCount(text);
  return Math.ceil(wordCount / wordsPerMinute);
}
