/**
 * Navigation types for the sidebar component
 * Following SOLID principles and TypeScript best practices
 */

export interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
  badge?: number;
  shortcut?: string;
}

export interface RecentNote {
  id: string;
  title: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  isSelected?: boolean;
}

export interface SidebarState {
  isExpanded: boolean;
  selectedNoteId: string | null;
  recentNotes: RecentNote[];
  isLoading: boolean;
}

export interface SidebarActions {
  toggleExpanded: () => void;
  selectNote: (noteId: string) => void;
  createNewNote: () => void;
  onSearchClick: () => void;
  onSettingsClick: () => void;
}

export interface SidebarProps {
  isExpanded?: boolean;
  selectedNoteId?: string | null;
  recentNotes?: RecentNote[];
  onNoteSelect?: (noteId: string) => void;
  onNewNote?: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
  onToggleExpanded?: () => void;
}

export interface KeyboardNavigation {
  currentIndex: number;
  totalItems: number;
  focusedElement: HTMLElement | null;
}

export interface SidebarKeyboardActions {
  handleArrowUp: () => void;
  handleArrowDown: () => void;
  handleEnter: () => void;
  handleEscape: () => void;
}

export type SidebarSection = 'notes' | 'actions' | 'profile';

export interface SidebarSectionProps {
  section: SidebarSection;
  isExpanded: boolean;
}
