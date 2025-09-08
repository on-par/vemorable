# VeMorable Bug Report

## Critical Bugs

### Bug #1: Notes Not Persisting After Navigation

**Severity**: Critical  
**Date Found**: September 8, 2025  
**Reporter**: Automated Testing (Playwright)

#### Description
Notes disappear completely after navigating between different sections of the application. The note creation process works correctly (save, processing, display), but the notes do not persist when returning to the "My Notes" section after visiting another page.

#### Steps to Reproduce
1. Navigate to https://vemorable.com and sign in
2. Go to "My Notes" section 
3. Click "Create new note"
4. Select "Text Note" option
5. Enter text content (e.g., "This is a test note")
6. Click "Save Note"
7. Wait for processing to complete
8. Verify note appears in the list (✅ Works correctly)
9. Click on the note to view details (✅ Works correctly - content is preserved)
10. Close the note detail modal
11. Navigate to another section (e.g., "Chat")
12. Navigate back to "My Notes"
13. **BUG**: Note has disappeared, showing "No notes" message

#### Expected Behavior
The note should persist and be visible in the "My Notes" section after navigation.

#### Actual Behavior
The note completely disappears from the list, and the UI shows "No notes" as if no notes have ever been created.

#### Technical Details
- URL when bug occurs: https://www.vemorable.com/dashboard
- The note creation and immediate display work correctly
- The note content is properly formatted and processed by AI
- The issue appears to be related to data persistence/fetching when the component remounts
- The note count shows "1 note" initially but returns to empty state after navigation

#### Impact
- Users lose their notes after navigating between sections
- Creates data loss concerns for users
- Makes the application unreliable for note-taking purposes

#### Potential Root Causes
1. Notes are stored in component state rather than persistent storage
2. API calls to fetch notes are failing on subsequent loads
3. User session/authentication issues affecting note retrieval
4. Client-side caching issues
5. Database persistence layer not working correctly

#### Browser/Environment
- Browser: Chromium (via Playwright)
- URL: https://www.vemorable.com
- User: Patrick Robinson (authenticated)

---

### Bug #2: Chat Feature Disconnected from Notes Data

**Severity**: Critical  
**Date Found**: September 8, 2025  
**Reporter**: Automated Testing (Playwright)

#### Description
The Chat feature appears to be completely disconnected from the notes data. Even when notes exist (before they disappear due to Bug #1), they are not accessible or visible in the Chat section, preventing users from asking questions about their notes.

#### Steps to Reproduce
1. Navigate to https://vemorable.com and sign in
2. Create a new note successfully (e.g., "Second test note for Chat verification")
3. Verify note appears in "My Notes" with AI processing complete
4. Navigate to "Chat" section
5. **BUG**: No indication that notes are available for chatting
6. Chat interface shows "No chat sessions yet" and "Start a new conversation to begin"
7. No notes data appears to be accessible to the chat system

#### Expected Behavior
- Chat section should have access to all user notes
- Users should be able to ask questions about existing notes
- There should be some indication of available notes in the chat interface
- Chat should be able to reference, search, and discuss note content

#### Actual Behavior
- Chat interface appears empty even when notes exist
- No connection between notes data and chat functionality
- Chat behaves as if user has no notes at all
- No way to verify if chat can access notes data

#### Technical Details
- URL: https://www.vemorable.com/dashboard/chat
- Chat interface loads correctly but shows no notes integration
- Likely related to Bug #1 - same data persistence/fetching issues
- Chat and Notes appear to use separate data sources/contexts

#### Impact
- Core application feature (chat with notes) is non-functional
- Users cannot interact with their notes through AI chat
- Defeats primary value proposition of "Chat with your Knowledge"
- Makes the application essentially a basic note-taking tool without AI chat benefits

#### Relationship to Other Bugs
This bug is likely related to Bug #1 (Notes Not Persisting). Both suggest a fundamental issue with data persistence and sharing between application components. The same root cause likely affects both features.

#### Browser/Environment
- Browser: Chromium (via Playwright)
- URL: https://www.vemorable.com
- User: Patrick Robinson (authenticated)