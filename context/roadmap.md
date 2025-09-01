# VemoRable MVP User Stories Checklist

## Project Setup & Configuration

- [x] **US-001**: Initialize Next.js project with TypeScript and required dependencies
  - [x] SUB-001-01: Run `npx create-next-app@latest vemorable --typescript --tailwind --eslint --app --src-dir`
  - [x] SUB-001-02: Install dependencies: `npm install @clerk/nextjs @supabase/supabase-js openai @supabase/ssr`
  - [x] SUB-001-03: Install dev dependencies: `npm install -D @types/node prisma`
  - [x] SUB-001-04: Create `.env.example` file with all required environment variable names
  - [x] SUB-001-05: Update `next.config.js` to allow audio file uploads and configure domains

- [ ] **US-002**: Set up project structure and configuration files
  - [ ] SUB-002-01: Create folder structure: `src/components/`, `src/lib/`, `src/types/`, `src/hooks/`
  - [ ] SUB-002-02: Create `src/lib/supabase.ts` file for Supabase client configuration
  - [ ] SUB-002-03: Create `src/types/database.ts` file for TypeScript database types
  - [ ] SUB-002-04: Update `package.json` scripts to include `"db:generate": "prisma generate"`
  - [ ] SUB-002-05: Create `README.md` with setup instructions and environment variable explanations

## Authentication & User Management

- [ ] **US-003**: Integrate Clerk authentication for user management
  - [ ] SUB-003-01: Create Clerk account, get publishable key and secret key for `.env.local`
  - [ ] SUB-003-02: Create `src/middleware.ts` file with Clerk's authMiddleware configuration
  - [ ] SUB-003-03: Wrap `app/layout.tsx` with `<ClerkProvider>` component
  - [ ] SUB-003-04: Create `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx`
  - [ ] SUB-003-05: Create `src/components/UserButton.tsx` component using Clerk's `<UserButton />`

## Database & Backend Setup

- [ ] **US-004**: Configure Supabase database with required tables
  - [ ] SUB-004-01: Create Supabase project, get URL and anon key for `.env.local`
  - [ ] SUB-004-02: Enable pgvector extension in Supabase SQL Editor: `CREATE EXTENSION IF NOT EXISTS vector;`
  - [ ] SUB-004-03: Create `supabase/migrations/001_initial_schema.sql` with notes and chat tables schema
  - [ ] SUB-004-04: Run migration in Supabase SQL Editor to create all tables
  - [ ] SUB-004-05: Test Supabase connection by creating `src/lib/supabase.ts` client file

- [ ] **US-005**: Create API routes for note management operations
  - [ ] SUB-005-01: Create `app/api/notes/route.ts` with POST (create) and GET (list) handlers
  - [ ] SUB-005-02: Create `app/api/notes/[id]/route.ts` with GET, PUT, and DELETE handlers
  - [ ] SUB-005-03: Add Zod validation schema in `src/lib/validations.ts` for note creation
  - [ ] SUB-005-04: Add error handling middleware function in `src/lib/api-utils.ts`
  - [ ] SUB-005-05: Test API routes using Thunder Client or Postman with sample data

## Voice Input & Transcription

- [ ] **US-006**: Implement voice recording functionality in the browser
  - [ ] SUB-006-01: Create `src/hooks/useVoiceRecording.ts` hook using browser MediaRecorder API
  - [ ] SUB-006-02: Create `src/components/VoiceRecorder.tsx` component with start/stop button
  - [ ] SUB-006-03: Add microphone permission request and error handling in the hook
  - [ ] SUB-006-04: Add visual recording indicator (red dot) and timer display
  - [ ] SUB-006-05: Save recorded audio as blob and prepare for transcription API call

- [ ] **US-007**: Create voice transcription API with OpenAI Whisper
  - [ ] SUB-007-01: Create `app/api/transcribe/route.ts` endpoint accepting FormData with audio file
  - [ ] SUB-007-02: Install and configure OpenAI SDK: add OPENAI_API_KEY to environment variables
  - [ ] SUB-007-03: Implement Whisper API call in transcribe endpoint with error handling
  - [ ] SUB-007-04: Add audio file validation (format, size limits) before processing
  - [ ] SUB-007-05: Return transcribed text as JSON response with confidence score if available

## AI Processing & Enhancement

- [ ] **US-008**: Implement AI-powered note processing and enhancement
  - [ ] SUB-008-01: Create `app/api/process-note/route.ts` endpoint accepting transcript text
  - [ ] SUB-008-02: Create `src/lib/openai.ts` with OpenAI client and helper functions
  - [ ] SUB-008-03: Implement transcript cleanup using GPT-3.5-turbo with specific system prompt
  - [ ] SUB-008-04: Add title and summary generation function with structured output
  - [ ] SUB-008-05: Create auto-tagging function returning array of relevant tags

- [ ] **US-009**: Build vector search capabilities for note retrieval
  - [ ] SUB-009-01: Create `src/lib/embeddings.ts` file with OpenAI embedding functions
  - [ ] SUB-009-02: Add embedding generation to note creation process in API
  - [ ] SUB-009-03: Create `app/api/search/route.ts` for semantic search using pgvector
  - [ ] SUB-009-04: Implement similarity search SQL query in `src/lib/database.ts`
  - [ ] SUB-009-05: Test search functionality with sample notes and queries

## User Interface & Experience

- [ ] **US-010**: Create main dashboard with note creation interface
  - [ ] SUB-010-01: Create `app/dashboard/page.tsx` with protected route wrapper
  - [ ] SUB-010-02: Create `src/components/Layout/DashboardLayout.tsx` with sidebar navigation
  - [ ] SUB-010-03: Create `src/components/VoiceNoteModal.tsx` with recording interface
  - [ ] SUB-010-04: Add floating action button (`+`) to trigger note creation modal
  - [ ] SUB-010-05: Implement text input alternative with `<textarea>` for typing notes

- [ ] **US-011**: Build notes list and management interface
  - [ ] SUB-011-01: Create `src/components/NotesList.tsx` component with grid layout
  - [ ] SUB-011-02: Create `src/components/NoteCard.tsx` with title, summary, tags, and date
  - [ ] SUB-011-03: Add search bar component with real-time filtering in `NotesList`
  - [ ] SUB-011-04: Implement note actions dropdown (edit, delete, favorite) on each card
  - [ ] SUB-011-05: Create `src/components/NoteDetail.tsx` modal for viewing full note content

## Chat Interface & Conversation

- [ ] **US-012**: Implement chat interface for conversing with notes
  - [ ] SUB-012-01: Create `src/components/ChatInterface.tsx` with message list and input
  - [ ] SUB-012-02: Create `app/api/chat/route.ts` endpoint using OpenAI Chat API
  - [ ] SUB-012-03: Implement context retrieval by searching relevant notes for each query
  - [ ] SUB-012-04: Add `src/components/MessageBubble.tsx` for user and assistant messages
  - [ ] SUB-012-05: Create chat session persistence in database with automatic saving

- [ ] **US-013**: Add file upload capability for documents and images
  - [ ] SUB-013-01: Create `src/components/FileUpload.tsx` with drag-and-drop interface
  - [ ] SUB-013-02: Set up file storage using Supabase Storage bucket
  - [ ] SUB-013-03: Create `app/api/upload/route.ts` for handling file uploads
  - [ ] SUB-013-04: Add PDF text extraction using `pdf-parse` npm package
  - [ ] SUB-013-05: Store extracted text as new notes with file reference

## Search & Organization

- [ ] **US-014**: Implement basic search and filtering system
  - [ ] SUB-014-01: Add search functionality to `NotesList` component using text matching
  - [ ] SUB-014-02: Create tag filter dropdown component in `src/components/TagFilter.tsx`
  - [ ] SUB-014-03: Add date range picker for filtering notes by creation date
  - [ ] SUB-014-04: Implement sort options (newest, oldest, alphabetical) in notes list
  - [ ] SUB-014-05: Add "Clear all filters" button to reset search and filters

## Data Export & Backup

- [ ] **US-015**: Add basic data export functionality
  - [ ] SUB-015-01: Create `app/api/export/route.ts` endpoint for user data export
  - [ ] SUB-015-02: Generate JSON export containing all user notes and metadata
  - [ ] SUB-015-03: Add export button in user profile/settings area
  - [ ] SUB-015-04: Create download link for generated export file
  - [ ] SUB-015-05: Add export progress indicator and success message

## Testing & Quality Assurance

- [ ] **US-016**: Implement basic testing for core functionality
  - [ ] SUB-016-01: Set up Jest and React Testing Library with `npm install -D jest @testing-library/react`
  - [ ] SUB-016-02: Create `src/lib/__tests__/openai.test.ts` for AI utility function tests
  - [ ] SUB-016-03: Write component tests for `VoiceRecorder` and `NoteCard` components
  - [ ] SUB-016-04: Create API route tests for `/api/notes` and `/api/transcribe` endpoints
  - [ ] SUB-016-05: Set up test script in `package.json` and ensure all tests pass

## Deployment & Production Setup

- [ ] **US-017**: Configure production deployment on Vercel
  - [ ] SUB-017-01: Connect GitHub repository to Vercel dashboard
  - [ ] SUB-017-02: Configure environment variables in Vercel project settings
  - [ ] SUB-017-03: Set up production domain and SSL certificate
  - [ ] SUB-017-04: Add basic analytics using Vercel Analytics
  - [ ] SUB-017-05: Test production deployment with all features working

---

## Progress Tracking

- **Total User Stories**: 17
- **Completed User Stories**: 1/17 (5.88%)
- **Total Sub-Tasks**: 85
- **Completed Sub-Tasks**: 5/85 (5.88%)
- **Current Progress**: 5.88%

### Completion Status by Category:
- [ ] **Project Setup & Configuration** (2 user stories)
- [ ] **Authentication & User Management** (1 user story)
- [ ] **Database & Backend Setup** (2 user stories)
- [ ] **Voice Input & Transcription** (2 user stories)
- [ ] **AI Processing & Enhancement** (2 user stories)
- [ ] **User Interface & Experience** (2 user stories)
- [ ] **Chat Interface & Conversation** (2 user stories)
- [ ] **Search & Organization** (1 user story)
- [ ] **Data Export & Backup** (1 user story)
- [ ] **Testing & Quality Assurance** (1 user story)
- [ ] **Deployment & Production Setup** (1 user story)

---

## Notes for Junior Developers

- **Environment Variables Needed**: 
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY`
  - `DATABASE_URL` (for Supabase connection)

- **Key Dependencies to Install**:
  ```bash
  npm install @clerk/nextjs @supabase/supabase-js openai zod
  npm install -D @types/node prisma jest @testing-library/react
  ```

- **Database Schema Example** (for SUB-004-03):
  ```sql
  -- Enable pgvector extension
  CREATE EXTENSION IF NOT EXISTS vector;
  
  -- Notes table
  CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    raw_transcript TEXT,
    processed_content TEXT NOT NULL,
    summary TEXT,
    tags TEXT[] DEFAULT '{}',
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Chat sessions table
  CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Chat messages table
  CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

- **Database Schema Location**: Create `supabase/migrations/001_initial_schema.sql`
- **Each User Story should be completed in order** unless dependencies allow parallel work
- **All Sub-Tasks within a User Story must be completed** before marking the User Story as done
- **Test your work** after each User Story completion
- **Ask for help** if any sub-task is unclear - don't guess at implementations