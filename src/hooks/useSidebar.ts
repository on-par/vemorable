/**
 * Custom hook for sidebar state management
 * Following clean code principles and TDD approach
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { 
  SidebarState, 
  SidebarActions, 
  KeyboardNavigation,
  SidebarKeyboardActions,
  RecentNote
} from '@/types/navigation.types';

interface UseSidebarProps {
  initialExpanded?: boolean;
  recentNotes?: RecentNote[];
  selectedNoteId?: string | null;
  onNoteSelect?: (noteId: string) => void;
  onNewNote?: () => void;
}

interface UseSidebarReturn extends SidebarState, SidebarActions, SidebarKeyboardActions {
  keyboardNav: KeyboardNavigation;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
}

export const useSidebar = ({
  initialExpanded = true,
  recentNotes = [],
  selectedNoteId = null,
  onNoteSelect,
  onNewNote
}: UseSidebarProps = {}): UseSidebarReturn => {
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Sidebar state
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [currentSelectedNoteId, setCurrentSelectedNoteId] = useState(selectedNoteId);
  const [isLoading, setIsLoading] = useState(false);
  
  // Keyboard navigation state
  const [keyboardNav, setKeyboardNav] = useState<KeyboardNavigation>({
    currentIndex: 0,
    totalItems: recentNotes.length + 3, // notes + new note + search + settings
    focusedElement: null
  });

  // Actions
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const selectNote = useCallback((noteId: string) => {
    setCurrentSelectedNoteId(noteId);
    onNoteSelect?.(noteId);
    router.push(`/dashboard/notes/${noteId}`);
  }, [onNoteSelect, router]);

  const createNewNote = useCallback(() => {
    setIsLoading(true);
    onNewNote?.();
    router.push('/dashboard/new-note');
    setTimeout(() => setIsLoading(false), 500); // Simulated loading
  }, [onNewNote, router]);

  const onSearchClick = useCallback(() => {
    router.push('/dashboard/search');
  }, [router]);

  const onSettingsClick = useCallback(() => {
    router.push('/dashboard/settings');
  }, [router]);

  // Keyboard navigation handlers
  const handleArrowUp = useCallback(() => {
    setKeyboardNav(prev => ({
      ...prev,
      currentIndex: Math.max(0, prev.currentIndex - 1)
    }));
  }, []);

  const handleArrowDown = useCallback(() => {
    setKeyboardNav(prev => ({
      ...prev,
      currentIndex: Math.min(prev.totalItems - 1, prev.currentIndex + 1)
    }));
  }, []);

  const handleEnter = useCallback(() => {
    const { currentIndex } = keyboardNav;
    
    if (currentIndex === 0) {
      createNewNote();
    } else if (currentIndex <= recentNotes.length) {
      const note = recentNotes[currentIndex - 1];
      if (note) {
        selectNote(note.id);
      }
    } else if (currentIndex === recentNotes.length + 1) {
      onSearchClick();
    } else if (currentIndex === recentNotes.length + 2) {
      onSettingsClick();
    }
  }, [keyboardNav, recentNotes, createNewNote, selectNote, onSearchClick, onSettingsClick]);

  const handleEscape = useCallback(() => {
    setKeyboardNav(prev => ({
      ...prev,
      currentIndex: 0,
      focusedElement: null
    }));
  }, []);

  // Update keyboard nav when notes change
  useEffect(() => {
    setKeyboardNav(prev => ({
      ...prev,
      totalItems: recentNotes.length + 3
    }));
  }, [recentNotes.length]);

  // Update selected note when prop changes
  useEffect(() => {
    setCurrentSelectedNoteId(selectedNoteId);
  }, [selectedNoteId]);

  return {
    // State
    isExpanded,
    selectedNoteId: currentSelectedNoteId,
    recentNotes,
    isLoading,
    
    // Actions
    toggleExpanded,
    selectNote,
    createNewNote,
    onSearchClick,
    onSettingsClick,
    
    // Keyboard navigation
    keyboardNav,
    handleArrowUp,
    handleArrowDown,
    handleEnter,
    handleEscape,
    
    // Ref
    sidebarRef
  };
};

export default useSidebar;
