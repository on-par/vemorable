'use client';

import React, { useState, useEffect } from 'react';
import { VoiceRecorder } from './VoiceRecorder';
import { FileUpload } from './FileUpload';
import { useAuth } from '@clerk/nextjs';
import type { Note, TranscriptionResponse, ProcessNoteResponse, CreateNoteResponse } from '@/types/voice-note.types';

interface VoiceNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteCreated: (note: Note) => void;
}

export default function VoiceNoteModal({ isOpen, onClose, onNoteCreated }: VoiceNoteModalProps) {
  const { userId } = useAuth();
  const [mode, setMode] = useState<'voice' | 'text' | 'file'>('voice');
  const [textContent, setTextContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMode('voice');
      setTextContent('');
      setError(null);
      setAudioBlob(null);
      setSelectedFiles([]);
      setIsProcessing(false);
      setTranscription(null);
      setIsTranscribing(false);
    }
  }, [isOpen]);

  // Handle voice recording completion
  const handleRecordingComplete = async (blob: Blob) => {
    setAudioBlob(blob);
    setError(null);
    setTranscription(null);
    
    // Auto-transcribe when recording completes
    if (userId) {
      setIsTranscribing(true);
      try {
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to transcribe audio');
        }
        
        const data: TranscriptionResponse = await response.json();
        const text = data.data?.text || data.text;
        
        if (text) {
          setTranscription(text);
        }
      } catch {
        // Don't show error for transcription, user can still save manually
        // Error is silent to not interrupt user experience
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  // Handle transcription and note creation for voice
  const handleVoiceSubmit = async () => {
    if (!audioBlob || !userId) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Transcribe audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const transcribeData: TranscriptionResponse = await transcribeResponse.json();
      const transcript = transcription || transcribeData.data?.text || transcribeData.text;

      if (!transcript) {
        throw new Error('No transcription received');
      }

      // Step 2: Process transcript with AI
      const processResponse = await fetch('/api/process-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process note');
      }

      const processedData: ProcessNoteResponse = await processResponse.json();

      // Step 3: Create note in database
      const createResponse = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw_transcript: transcript,
          processed_content: processedData.data.processedContent,
          title: processedData.data.title,
          summary: processedData.data.summary,
          tags: processedData.data.tags,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to save note');
      }

      const { data: newNote }: CreateNoteResponse = await createResponse.json();
      onNoteCreated(newNote);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle text note creation
  const handleTextSubmit = async () => {
    if (!textContent.trim() || !userId) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Process text with AI
      const processResponse = await fetch('/api/process-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: textContent }),
      });

      if (!processResponse.ok) {
        throw new Error('Failed to process note');
      }

      const processedData: ProcessNoteResponse = await processResponse.json();

      // Step 2: Create note in database
      const createResponse = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw_transcript: textContent,
          processed_content: processedData.data.processedContent,
          title: processedData.data.title,
          summary: processedData.data.summary,
          tags: processedData.data.tags,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to save note');
      }

      const { data: newNote }: CreateNoteResponse = await createResponse.json();
      onNoteCreated(newNote);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
    setError(null);
  };

  // Handle file upload and note creation
  const handleFileUpload = async () => {
    if (selectedFiles.length === 0 || !userId) return;

    setIsProcessing(true);
    setError(null);

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('processWithAI', 'true');

        const response = await fetch('/api/upload-note', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to upload file');
        }

        const { data } = await response.json();
        onNoteCreated(data.note);
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => {
      if (e.target === e.currentTarget && !isProcessing && !isTranscribing) {
        onClose();
      }
    }}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Create New Note</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setMode('voice')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'voice'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Voice Note
            </button>
            <button
              onClick={() => setMode('text')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'text'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Text Note
            </button>
            <button
              onClick={() => setMode('file')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'file'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload File
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {mode === 'voice' ? (
            <div>
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                onError={setError}
                maxDuration={300}
              />
              
              {/* Transcription display */}
              {isTranscribing && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-blue-700">Transcribing audio...</p>
                  </div>
                </div>
              )}
              
              {transcription && !isTranscribing && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">Transcription:</h3>
                  <p className="text-sm text-green-700">{transcription}</p>
                </div>
              )}
              
              {audioBlob && !isProcessing && (
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setAudioBlob(null);
                      setTranscription(null);
                      setError(null);
                    }}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry
                  </button>
                  <button
                    onClick={handleVoiceSubmit}
                    disabled={isTranscribing}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Note
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Type or paste your note here..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {textContent.length} characters
                </span>
                <button
                  onClick={handleTextSubmit}
                  disabled={!textContent.trim() || isProcessing}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Note
                </button>
              </div>
            </div>
          )}

          {mode === 'file' && (
            <div>
              <FileUpload
                onFileSelect={handleFileSelect}
                onError={setError}
                maxFiles={5}
                className="mb-4"
              />
              
              {selectedFiles.length > 0 && !isProcessing && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleFileUpload}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Process {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Processing your note...</p>
              <p className="text-sm text-gray-500">This may take a moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}