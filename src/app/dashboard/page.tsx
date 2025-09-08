'use client';

import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import NotesList from '@/components/NotesList';
import VoiceNoteModal from '@/components/VoiceNoteModal';
import { useNotesContext, useNoteOperations } from '@/features/voice-notes/context/NotesContext';
import type { Note } from '@/features/voice-notes/types/notes.types';

export default function DashboardPage() {
  const { isLoaded, userId } = useAuth();
  const { notes, isLoading, error, addNote } = useNotesContext();
  const { deleteNoteWithConfirmation } = useNoteOperations();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !userId) {
      redirect('/sign-in');
    }
  }, [isLoaded, userId]);

  const handleNoteCreated = useCallback((newNote: Note) => {
    addNote(newNote);
    setIsModalOpen(false);
  }, [addNote]);

  const handleNoteDeleted = useCallback(async (noteId: string, noteTitle: string) => {
    await deleteNoteWithConfirmation(noteId, noteTitle);
  }, [deleteNoteWithConfirmation]);

  const handleToggleModal = useCallback(() => {
    setIsModalOpen(prev => !prev);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Show loading state while auth is loading
  if (!isLoaded || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
          <p className="text-gray-600 mt-2">
            Capture your thoughts with voice or text
          </p>
        </div>

        {/* Notes List */}
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <NotesList 
            notes={notes} 
            onNoteDeleted={handleNoteDeleted}
          />
        )}

        {/* Floating Action Button */}
        <button
          onClick={handleToggleModal}
          className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Create new note"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        {/* Voice Note Modal */}
        <VoiceNoteModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onNoteCreated={handleNoteCreated}
        />
      </div>
  );
}