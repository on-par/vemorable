'use client';

import React from 'react';

interface Note {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  created_at: string;
  processed_content: string;
  raw_transcript?: string;
}

interface NoteDetailProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
}

export default function NoteDetail({ note, isOpen, onClose }: NoteDetailProps) {
  if (!isOpen || !note) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-detail-title"
    >
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <h2 id="note-detail-title" className="text-2xl font-semibold text-gray-900">
                {note.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(note.created_at)}
              </p>
            </div>
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">{note.summary}</p>
            </div>
          </div>

          {/* Full Content */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Full Note</h3>
            <div className="prose prose-sm max-w-none">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {note.processed_content}
                </p>
              </div>
            </div>
          </div>

          {/* Raw Transcript (if available) */}
          {note.raw_transcript && (
            <div className="mb-6">
              <details className="group">
                <summary className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900 flex items-center gap-2">
                  <svg 
                    className="w-4 h-4 transition-transform group-open:rotate-90" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Original Transcript
                </summary>
                <div className="mt-2 bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 italic whitespace-pre-wrap">
                    {note.raw_transcript}
                  </p>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                // Copy to clipboard functionality
                const textToCopy = `${note.title}\n\n${note.summary}\n\n${note.processed_content}`;
                navigator.clipboard.writeText(textToCopy);
                // You could add a toast notification here
              }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}