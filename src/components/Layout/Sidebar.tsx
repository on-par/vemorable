/**
 * Sidebar Component - ChatGPT-style navigation sidebar
 * Following vertical slice architecture and SOLID principles
 */

'use client';

import React, { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { TestAwareUserButton } from '@/components/TestAwareUserButton';
import { useSidebar } from '@/hooks/useSidebar';
import type { SidebarProps, RecentNote, KeyboardNavigation } from '@/types/navigation.types';

interface SidebarComponentProps extends SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarComponentProps> = ({
  isExpanded: controlledExpanded,
  selectedNoteId: controlledSelectedNoteId,
  recentNotes = [],
  onNoteSelect,
  onNewNote,
  onSearch,
  onSettings,
  onToggleExpanded,
  className = '',
}) => {
  const {
    isExpanded,
    selectedNoteId,
    isLoading,
    toggleExpanded,
    selectNote,
    createNewNote,
    onSearchClick,
    onSettingsClick,
    keyboardNav,
    handleArrowUp,
    handleArrowDown,
    handleEnter,
    handleEscape,
    sidebarRef
  } = useSidebar({
    initialExpanded: controlledExpanded,
    selectedNoteId: controlledSelectedNoteId,
    recentNotes,
    onNoteSelect,
    onNewNote
  });

  // Use controlled state if provided
  const currentExpanded = controlledExpanded ?? isExpanded;
  const currentSelectedNoteId = controlledSelectedNoteId ?? selectedNoteId;

  // Handle external toggle
  const handleToggle = useCallback(() => {
    if (onToggleExpanded) {
      onToggleExpanded();
    } else {
      toggleExpanded();
    }
  }, [onToggleExpanded, toggleExpanded]);

  // Handle external callbacks
  const handleNoteClick = useCallback((noteId: string) => {
    try {
      if (onNoteSelect) {
        onNoteSelect(noteId);
      } else {
        selectNote(noteId);
      }
    } catch (error) {
      console.error('Error selecting note:', error);
    }
  }, [onNoteSelect, selectNote]);

  const handleNewNoteClick = useCallback(() => {
    try {
      if (onNewNote) {
        onNewNote();
      } else {
        createNewNote();
      }
    } catch (error) {
      console.error('Error creating new note:', error);
    }
  }, [onNewNote, createNewNote]);

  const handleSearchClick = useCallback(() => {
    try {
      if (onSearch) {
        onSearch();
      } else {
        onSearchClick();
      }
    } catch (error) {
      console.error('Error handling search:', error);
    }
  }, [onSearch, onSearchClick]);

  const handleSettingsClick = useCallback(() => {
    try {
      if (onSettings) {
        onSettings();
      } else {
        onSettingsClick();
      }
    } catch (error) {
      console.error('Error handling settings:', error);
    }
  }, [onSettings, onSettingsClick]);

  // Keyboard event handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        handleArrowUp();
        break;
      case 'ArrowDown':
        event.preventDefault();
        handleArrowDown();
        break;
      case 'Enter':
        event.preventDefault();
        handleEnter();
        break;
      case 'Escape':
        event.preventDefault();
        handleEscape();
        break;
    }
  }, [handleArrowUp, handleArrowDown, handleEnter, handleEscape]);

  // Mobile state management
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen(prev => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    closeMobile();
  }, [currentSelectedNoteId, closeMobile]);

  // Format note date for display
  const formatNoteDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }, []);

  const sidebarClasses = `
    ${currentExpanded ? 'w-64' : 'w-16'}
    flex flex-col h-full bg-secondary border-r border-default
    transition-all duration-300 ease-in-out
    ${className}
  `.trim();

  const mobileSidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 bg-secondary border-r border-default
    transform transition-transform duration-300 ease-in-out
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:hidden
  `.trim();

  const desktopSidebarClasses = `
    hidden lg:flex ${sidebarClasses}
  `.trim();

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-secondary border border-default hover:bg-hover transition-smooth"
        aria-label="Open menu"
        data-testid="mobile-menu-toggle"
      >
        <svg
          className="w-5 h-5 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          data-testid="menu-icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile sidebar */}
      <nav
        ref={sidebarRef}
        className={mobileSidebarClasses}
        aria-label="Main navigation"
        role="navigation"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <SidebarContent
          isExpanded={true}
          selectedNoteId={currentSelectedNoteId}
          recentNotes={recentNotes}
          isLoading={isLoading}
          keyboardNav={keyboardNav}
          onToggle={closeMobile}
          onNewNote={handleNewNoteClick}
          onNoteClick={handleNoteClick}
          onSearchClick={handleSearchClick}
          onSettingsClick={handleSettingsClick}
          formatNoteDate={formatNoteDate}
          isMobile={true}
        />
      </nav>

      {/* Desktop sidebar */}
      <nav
        className={desktopSidebarClasses}
        aria-label="Main navigation"
        role="navigation"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <SidebarContent
          isExpanded={currentExpanded}
          selectedNoteId={currentSelectedNoteId}
          recentNotes={recentNotes}
          isLoading={isLoading}
          keyboardNav={keyboardNav}
          onToggle={handleToggle}
          onNewNote={handleNewNoteClick}
          onNoteClick={handleNoteClick}
          onSearchClick={handleSearchClick}
          onSettingsClick={handleSettingsClick}
          formatNoteDate={formatNoteDate}
          isMobile={false}
        />
      </nav>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobile}
          data-testid="sidebar-overlay"
          aria-hidden="true"
        />
      )}
    </>
  );
};

interface SidebarContentProps {
  isExpanded: boolean;
  selectedNoteId: string | null;
  recentNotes: RecentNote[];
  isLoading: boolean;
  keyboardNav: KeyboardNavigation;
  onToggle: () => void;
  onNewNote: () => void;
  onNoteClick: (noteId: string) => void;
  onSearchClick: () => void;
  onSettingsClick: () => void;
  formatNoteDate: (date: string) => string;
  isMobile: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  isExpanded,
  selectedNoteId,
  recentNotes,
  isLoading,
  onToggle,
  onNewNote,
  onNoteClick,
  onSearchClick,
  onSettingsClick,
  formatNoteDate,
  isMobile
}) => {
  return (
    <>
      {/* Header with toggle and close */}
      <div className="flex items-center justify-between p-4 border-b border-default">
        {isExpanded && (
          <h2 className="text-lg font-semibold text-primary">VeMorable</h2>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-hover transition-smooth text-secondary"
          aria-label={isMobile ? "Close menu" : "Toggle sidebar"}
          data-testid="sidebar-toggle"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            data-testid="toggle-icon"
          >
            {isMobile ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isExpanded ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
              />
            )}
          </svg>
        </button>
      </div>

      {/* New Note Button */}
      <div className="p-4">
        <button
          onClick={onNewNote}
          disabled={isLoading}
          className={`
            w-full flex items-center gap-3 p-3 rounded-lg
            bg-accent-primary hover:bg-accent-hover
            text-primary font-medium transition-smooth
            disabled:opacity-50 disabled:cursor-not-allowed
            ${!isExpanded ? 'justify-center' : ''}
          `}
          aria-label="New note"
          data-testid="new-note-button"
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            data-testid="plus-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {isExpanded && (
            <span className="text-left">
              {isLoading ? 'Creating...' : 'New Note'}
            </span>
          )}
        </button>
      </div>

      {/* Recent Notes */}
      <div className="flex-1 overflow-y-auto px-4">
        {isExpanded && (
          <h3 className="text-sm font-medium text-secondary mb-3">
            Recent Notes
          </h3>
        )}
        
        {recentNotes && recentNotes.length > 0 ? (
          <div className="space-y-1">
            {recentNotes.map((note) => {
              const isSelected = note.id === selectedNoteId;
              return (
                <button
                  key={note.id}
                  onClick={() => onNoteClick(note.id)}
                  className={`
                    w-full text-left p-3 rounded-lg transition-smooth
                    hover:bg-hover border border-transparent
                    ${isSelected ? 'bg-hover border-accent-primary' : ''}
                    ${!isExpanded ? 'justify-center' : ''}
                  `}
                  aria-current={isSelected ? 'page' : undefined}
                  tabIndex={-1}
                  data-testid={`note-item-${note.id}`}
                >
                  {isExpanded ? (
                    <div className="space-y-1">
                      <div className="font-medium text-primary text-sm line-clamp-2">
                        {note.title}
                      </div>
                      {note.summary && (
                        <div className="text-xs text-muted line-clamp-2">
                          {note.summary}
                        </div>
                      )}
                      <div className="text-xs text-muted">
                        {formatNoteDate(note.updated_at)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-secondary"
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
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : recentNotes ? (
          isExpanded && (
            <div className="text-center py-8 text-muted">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm">No recent notes</p>
              <p className="text-xs mt-1">Create your first note above</p>
            </div>
          )
        ) : null}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-default space-y-2">
        {/* Search Button */}
        <button
          onClick={onSearchClick}
          className={`
            w-full flex items-center gap-3 p-2 rounded-lg
            text-secondary hover:text-primary hover:bg-hover transition-smooth
            ${!isExpanded ? 'justify-center' : ''}
          `}
          aria-label="Search"
          data-testid="search-button"
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            data-testid="search-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {isExpanded && <span>Search</span>}
        </button>

        {/* Settings Link */}
        <Link
          href="/dashboard/settings"
          onClick={onSettingsClick}
          className={`
            w-full flex items-center gap-3 p-2 rounded-lg
            text-secondary hover:text-primary hover:bg-hover transition-smooth
            ${!isExpanded ? 'justify-center' : ''}
          `}
          aria-label="Settings"
          data-testid="settings-link"
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            data-testid="settings-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {isExpanded && <span>Settings</span>}
        </Link>

        {/* User Profile Section */}
        <div className={`
          flex items-center gap-3 p-2 rounded-lg
          ${!isExpanded ? 'justify-center' : ''}
        `}>
          <div className="flex-shrink-0">
            <TestAwareUserButton afterSignOutUrl="/" />
          </div>
          {isExpanded && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-primary">Account</div>
              <div className="text-xs text-muted">Manage profile</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
