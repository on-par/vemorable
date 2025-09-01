'use client';

import React, { useState, useEffect } from 'react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

interface VoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob) => void;
  onError?: (error: string) => void;
  maxDuration?: number;
  className?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onError,
  maxDuration = 300,
  className = ''
}) => {
  const {
    isRecording,
    isPermissionGranted,
    recordingTime,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    resetRecording,
    requestPermission
  } = useVoiceRecording({ maxDuration });

  const [hasInteracted, setHasInteracted] = useState(false);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle error callback
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Handle recording complete callback
  useEffect(() => {
    if (audioBlob && onRecordingComplete && !isRecording) {
      onRecordingComplete(audioBlob);
    }
  }, [audioBlob, isRecording, onRecordingComplete]);

  // Handle permission request
  const handlePermissionRequest = async () => {
    setHasInteracted(true);
    await requestPermission();
  };

  // Handle start recording
  const handleStartRecording = async () => {
    setHasInteracted(true);
    await startRecording();
  };

  // Handle stop recording
  const handleStopRecording = () => {
    stopRecording();
  };

  // Handle reset
  const handleReset = () => {
    resetRecording();
  };

  return (
    <div className={`flex flex-col items-center gap-4 p-6 ${className}`}>
      {/* Recording indicator and timer */}
      {isRecording && (
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          </div>
          <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Recording: {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="w-full max-w-md p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Permission request */}
      {!isPermissionGranted && hasInteracted && !error && (
        <div className="w-full max-w-md p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md text-sm">
          <p className="mb-2">Microphone permission is required to record audio.</p>
          <button
            onClick={handlePermissionRequest}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
          >
            Grant Permission
          </button>
        </div>
      )}

      {/* Main control buttons */}
      <div className="flex gap-3">
        {!isRecording ? (
          <>
            <button
              onClick={handleStartRecording}
              className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg"
              disabled={!!error && !isPermissionGranted}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              Start Recording
            </button>
            
            {audioBlob && (
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors shadow-lg"
              >
                Reset
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleStopRecording}
            className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center gap-2 shadow-lg animate-pulse"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
            Stop Recording
          </button>
        )}
      </div>

      {/* Audio playback (when recording is complete) */}
      {audioBlob && !isRecording && (
        <div className="w-full max-w-md">
          <audio
            controls
            className="w-full"
            src={URL.createObjectURL(audioBlob)}
          />
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Recording ready for transcription
          </div>
        </div>
      )}

      {/* Recording info */}
      {!isRecording && !audioBlob && (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
          <p>Click &quot;Start Recording&quot; to begin capturing your voice.</p>
          <p className="mt-1">Maximum recording duration: {formatTime(maxDuration)}</p>
        </div>
      )}
    </div>
  );
};