'use client';

import React, { useState, useMemo, useCallback } from 'react';
import NoteCard from './NoteCard';
import NoteDetail from './NoteDetail';

interface Note {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  created_at: string;
  processed_content: string;
  raw_transcript?: string;
}

interface NotesListProps {
  notes: Note[];
  onNoteDeleted?: (noteId: string) => void;
  onNoteUpdated?: (note: Note) => void;
}

export default function NotesList({ notes, onNoteDeleted, onNoteUpdated }: NotesListProps) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [favoriteNotes, setFavoriteNotes] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Extract all unique tags from notes
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach(note => {
      note.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [notes]);

  // Filter and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.summary.toLowerCase().includes(query) ||
        note.processed_content.toLowerCase().includes(query) ||
        note.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(note =>
        selectedTags.every(tag => note.tags?.includes(tag))
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [notes, searchQuery, selectedTags, sortBy]);

  const handleNoteClick = useCallback((note: Note) => {
    setSelectedNote(note);
  }, []);

  const handleNoteDelete = useCallback((noteId: string) => {
    if (onNoteDeleted) {
      onNoteDeleted(noteId);
    }
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
    }
  }, [onNoteDeleted, selectedNote]);

  const handleNoteEdit = useCallback((note: Note) => {
    // This would typically open an edit modal or navigate to an edit page
    // For now, we'll just log it
    console.log('Edit note:', note);
    if (onNoteUpdated) {
      // Placeholder for edit functionality
      onNoteUpdated(note);
    }
  }, [onNoteUpdated]);

  const handleNoteFavorite = useCallback((noteId: string) => {
    setFavoriteNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  }, []);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || sortBy !== 'newest';

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No notes</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new note with voice or text.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {(selectedTags.length > 0 || sortBy !== 'newest') && (
              <span className="px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                {selectedTags.length + (sortBy !== 'newest' ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">Alphabetical</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear all filters
            </button>
          )}

          {/* Results Count */}
          <span className="text-sm text-gray-500">
            {filteredAndSortedNotes.length} {filteredAndSortedNotes.length === 1 ? 'note' : 'notes'}
          </span>
        </div>

        {/* Expanded Filters */}
        {showFilters && allTags.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by tags:</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notes Grid */}
      {filteredAndSortedNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleNoteDelete}
              onEdit={handleNoteEdit}
              onFavorite={handleNoteFavorite}
              onClick={handleNoteClick}
              isFavorited={favoriteNotes.has(note.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Note Detail Modal */}
      <NoteDetail
        note={selectedNote!}
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
      />
    </>
  );
}