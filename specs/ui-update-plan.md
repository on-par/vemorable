# VeMorable UI Transformation Plan: ChatGPT-Style Interface

## Overview
Transform VeMorable's interface to a modern ChatGPT-style dark theme UI with voice-first input, maintaining extensibility for future light/dark mode toggle.

## Design Principles
- **Voice-First**: Large microphone button as primary input, switching to send button when typing
- **Dark Theme**: Consistent dark palette across entire application
- **Minimalist**: Remove unnecessary UI chrome, focus on content
- **Conversation-Centric**: Everything is a "note" that can be continued or queried
- **Extensible**: Prepare for future theme toggling via user settings

---

## Phase 1: Design System & Global Styles
**Establish the dark theme foundation and CSS variables**

### Affected Files
- `/src/app/globals.css`
- `/src/app/layout.tsx`
- `/src/styles/` (new directory)
  - `/src/styles/variables.css` (new)
  - `/src/styles/themes.css` (new)

### Tasks
- [ ] Create CSS custom properties for dark theme colors in globals.css
- [ ] [P] Create themes.css with dark theme variables and future light theme structure
- [ ] [P] Update body and root styles for dark background gradient
- [ ] Add Inter font import and set as primary font family
- [ ] Create utility classes for common dark theme patterns
- [ ] Update root layout.tsx to include theme provider structure
- [ ] Add data-theme attribute handler for future theme switching
- [ ] Remove any conflicting light theme defaults

---

## Phase 2: Sidebar Component
**Create the collapsible sidebar with navigation and note history**

### Affected Files
- `/src/components/Layout/Sidebar.tsx` (new)
- `/src/components/Layout/Sidebar.test.tsx` (new)
- `/src/types/navigation.types.ts` (new)
- `/src/hooks/useSidebar.ts` (new)

### Tasks
- [ ] Create Sidebar.tsx component with dark theme styling
- [ ] [P] Implement "New Note" button with plus icon at top
- [ ] [P] Create RecentNotes list component within sidebar
- [ ] Add note item hover states and selection indicators
- [ ] Implement sidebar collapse/expand functionality
- [ ] [P] Add Search quick access button at bottom
- [ ] [P] Add Settings link at bottom
- [ ] [P] Add UserProfile section at bottom
- [ ] Create mobile responsive behavior (slide-out drawer)
- [ ] Add keyboard navigation support (up/down arrows)
- [ ] [P] Write tests for Sidebar component

---

## Phase 3: Bottom Input Bar
**Create the voice-first input bar with adaptive UI**

### Affected Files
- `/src/components/Layout/BottomInputBar.tsx` (new)
- `/src/components/Layout/BottomInputBar.test.tsx` (new)
- `/src/hooks/useInputMode.ts` (new)
- `/src/types/input.types.ts` (new)

### Tasks
- [ ] Create BottomInputBar.tsx with fixed bottom positioning
- [ ] Implement large microphone button as default state
- [ ] Add text input field (hidden by default)
- [ ] Create input mode detection (voice vs text)
- [ ] Implement button swap animation (mic → send)
- [ ] [P] Add file attachment button (paperclip icon)
- [ ] [P] Add input field auto-resize on content
- [ ] Create voice recording visual feedback
- [ ] Add character/time limit indicators
- [ ] Implement mobile keyboard handling
- [ ] [P] Write tests for BottomInputBar component

---

## Phase 4: Update Dashboard Layout
**Transform the main dashboard layout to ChatGPT style**

### Affected Files
- `/src/app/dashboard/layout.tsx`
- `/src/components/Layout/DashboardLayout.tsx`
- `/src/app/dashboard/page.tsx`
- `/src/styles/dashboard.module.css` (new)

### Tasks
- [ ] Update dashboard layout.tsx for sidebar + main content structure
- [ ] Remove top navigation bar
- [ ] Implement flex layout with fixed sidebar
- [ ] Add main content area with proper padding
- [ ] Integrate BottomInputBar into layout
- [ ] [P] Update page transitions and routing
- [ ] [P] Add loading states for page changes
- [ ] Implement responsive breakpoints
- [ ] Update dashboard home page to show recent notes
- [ ] Remove unnecessary wrapper divs and containers

---

## Phase 5: Voice Recorder Integration
**Adapt VoiceRecorder for bottom bar integration**

### Affected Files
- `/src/components/VoiceRecorder.tsx`
- `/src/components/VoiceRecorder.test.tsx`
- `/src/hooks/useVoiceRecording.ts` (new)
- `/src/utils/audio.utils.ts` (new)

### Tasks
- [ ] Refactor VoiceRecorder for inline usage
- [ ] Create minimal recording UI (no modal)
- [ ] [P] Implement real-time audio visualization
- [ ] [P] Add recording time display
- [ ] Create smooth start/stop animations
- [ ] Add error handling for permissions
- [ ] [P] Implement audio level detection
- [ ] Add recording state management
- [ ] Create transcription loading state
- [ ] [P] Update tests for new structure

---

## Phase 6: Note/Chat Interface Update
**Transform the chat interface to conversation style**

### Affected Files
- `/src/features/chat/components/ChatInterface.tsx`
- `/src/features/chat/components/MessageBubble.tsx`
- `/src/features/chat/components/MessageList.tsx`
- `/src/components/NoteThread.tsx` (new)
- `/src/app/dashboard/chat/page.tsx`

### Tasks
- [ ] Update ChatInterface.tsx with centered message layout
- [ ] Redesign MessageBubble with minimal styling
- [ ] [P] Create NoteThread component for conversations
- [ ] [P] Update message alignment (user right, AI left)
- [ ] Implement message streaming display
- [ ] Add typing indicators
- [ ] [P] Create note context cards
- [ ] Update scrolling behavior (auto-scroll to bottom)
- [ ] Add message timestamps (subtle)
- [ ] Implement message actions (copy, edit)

---

## Phase 7: Landing Page Dark Theme
**Update the marketing landing page with dark theme**

### Affected Files
- `/src/app/page.tsx`
- `/src/styles/landing.module.css` (new)
- `/src/components/Hero.tsx` (if exists)
- `/src/components/Features.tsx` (if exists)

### Tasks
- [ ] Update landing page background to dark gradient
- [ ] [P] Update text colors for dark theme
- [ ] [P] Update button styles for dark theme
- [ ] [P] Update feature cards with dark backgrounds
- [ ] Adjust image assets for dark backgrounds
- [ ] [P] Update testimonial section styling
- [ ] [P] Update footer with dark theme
- [ ] Add subtle animations and hover effects
- [ ] Update link colors and states
- [ ] Ensure contrast accessibility standards

---

## Phase 8: Authentication Pages
**Update sign-in and sign-up pages for dark theme**

### Affected Files
- `/src/app/sign-in/[[...sign-in]]/page.tsx`
- `/src/app/sign-up/[[...sign-up]]/page.tsx`
- `/src/styles/auth.module.css` (new)

### Tasks
- [ ] Update Clerk components with dark theme
- [ ] [P] Style authentication forms for dark background
- [ ] [P] Update error message styling
- [ ] Add subtle form animations
- [ ] Ensure OAuth button visibility
- [ ] Update loading states
- [ ] Add background gradient matching main app

---

## Phase 9: Component Updates
**Update remaining components for dark theme consistency**

### Affected Files
- `/src/components/NoteCard.tsx`
- `/src/components/NotesList.tsx`
- `/src/components/TagFilter.tsx`
- `/src/components/DateRangePicker.tsx`
- `/src/components/FileUpload.tsx`
- `/src/components/UserButton.tsx`

### Tasks
- [ ] [P] Update NoteCard with dark theme styling
- [ ] [P] Update NotesList for sidebar-style display
- [ ] [P] Redesign TagFilter with dark chips
- [ ] [P] Update DateRangePicker with dark calendar
- [ ] [P] Style FileUpload for dark theme
- [ ] [P] Update UserButton dropdown styling
- [ ] [P] Add hover states to all interactive elements
- [ ] [P] Update focus states for accessibility
- [ ] Ensure consistent spacing and padding
- [ ] Update any remaining light backgrounds

---

## Phase 10: Polish & Optimization
**Final touches and performance improvements**

### Affected Files
- Various components
- `/src/app/manifest.json`
- `/public/` assets

### Tasks
- [ ] Add loading skeletons for all async content
- [ ] [P] Implement virtual scrolling for long note lists
- [ ] [P] Optimize bundle size and code splitting
- [ ] [P] Add keyboard shortcuts documentation
- [ ] Update meta tags for dark theme color
- [ ] [P] Add transition animations between states
- [ ] [P] Test and fix responsive design issues
- [ ] [P] Run accessibility audit and fix issues
- [ ] Update favicon and app icons for dark theme
- [ ] Performance testing and optimization

---

## Phase 11: Theme Toggle Preparation
**Prepare infrastructure for future light/dark mode toggle**

### Affected Files
- `/src/contexts/ThemeContext.tsx` (new)
- `/src/hooks/useTheme.ts` (new)
- `/src/app/dashboard/settings/page.tsx`

### Tasks
- [ ] Create ThemeContext provider
- [ ] [P] Create useTheme hook
- [ ] [P] Add theme preference to user settings
- [ ] Implement localStorage theme persistence
- [ ] Add theme toggle UI component (hidden for MVP)
- [ ] [P] Create light theme variables (commented out)
- [ ] Test theme switching mechanism
- [ ] Document theme extension process

---

## Testing & QA Checklist
**Before considering any phase complete**

- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive testing (iOS, Android)
- [ ] Dark mode contrast accessibility (WCAG AA)
- [ ] Performance metrics (Core Web Vitals)
- [ ] Error state handling
- [ ] Loading state coverage
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

---

## Success Metrics
- **Visual Consistency**: All components follow dark theme
- **Performance**: < 2s initial load, < 100ms interactions
- **Accessibility**: WCAG AA compliant
- **User Experience**: Simplified, focused interface
- **Code Quality**: All tests passing, no TypeScript errors

---

## Notes
- Tasks marked with `[P]` can be executed in parallel
- Each phase should be completed and tested before moving to the next
- Maintain backward compatibility during migration
- Document any breaking changes
- Keep bundle size under control with lazy loading