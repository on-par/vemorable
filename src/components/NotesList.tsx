'use client';

import React, { useState, useMemo, useCallback } from 'react';
import NoteCard from './NoteCard';
import NoteDetail from './NoteDetail';
import TagFilter from './TagFilter';
import DateRangePicker from './DateRangePicker';
import type { Note } from '@/features/voice-notes/types/notes.types';

interface NotesListProps {
  notes: Note[];
  onNoteDeleted?: (noteId: string, noteTitle: string) => void;
  onNoteUpdated?: (note: Note) => void;
}

const NotesList = React.memo(function NotesList({ notes, onNoteDeleted, onNoteUpdated }: NotesListProps) {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [favoriteNotes, setFavoriteNotes] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null,
  });

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

    // Apply date range filter
    if (dateRange.startDate || dateRange.endDate) {
      filtered = filtered.filter(note => {
        const noteDate = new Date(note.created_at);
        if (dateRange.startDate && noteDate < dateRange.startDate) {
          return false;
        }
        if (dateRange.endDate) {
          // Set end date to end of day for inclusive filtering
          const endOfDay = new Date(dateRange.endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (noteDate > endOfDay) {
            return false;
          }
        }
        return true;
      });
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
  }, [notes, searchQuery, selectedTags, sortBy, dateRange]);

  const handleNoteClick = useCallback((note: Note) => {
    setSelectedNote(note);
  }, []);

  const handleNoteDelete = useCallback((noteId: string, noteTitle: string) => {
    if (onNoteDeleted) {
      onNoteDeleted(noteId, noteTitle);
    }
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
    }
  }, [onNoteDeleted, selectedNote]);

  const handleNoteEdit = useCallback((note: Note) => {
    // This would typically open an edit modal or navigate to an edit page
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
    setDateRange({ startDate: null, endDate: null });
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  const clearDateFilter = () => {
    setDateRange({ startDate: null, endDate: null });
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || sortBy !== 'newest' || dateRange.startDate || dateRange.endDate;

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
          {/* Tag Filter Dropdown */}
          <TagFilter
            allTags={allTags}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            onClearTags={clearTagFilters}
          />

          {/* Date Range Picker */}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            onClear={clearDateFilter}
          />

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">Alphabetical</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear all filters
            </button>
          )}

          {/* Results Count */}
          <span className="ml-auto text-sm text-gray-500">
            {filteredAndSortedNotes.length} {filteredAndSortedNotes.length === 1 ? 'note' : 'notes'}
          </span>
        </div>
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
});

export default NotesList;