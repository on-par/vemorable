# VemoRable MVP User Stories Checklist

## Project Setup & Configuration

- [x] **US-001**: Initialize Next.js project with TypeScript and required dependencies
  - [x] SUB-001-01: Run `npx create-next-app@latest vemorable --typescript --tailwind --eslint --app --src-dir`
  - [x] SUB-001-02: Install dependencies: `npm install @clerk/nextjs @supabase/supabase-js openai @supabase/ssr`
  - [x] SUB-001-03: Install dev dependencies: `npm install -D @types/node prisma`
  - [x] SUB-001-04: Create `.env.example` file with all required environment variable names
  - [x] SUB-001-05: Update `next.config.js` to allow audio file uploads and configure domains

- [x] **US-002**: Set up project structure and configuration files
  - [x] SUB-002-01: Create folder structure: `src/components/`, `src/lib/`, `src/types/`, `src/hooks/`
  - [x] SUB-002-02: Create `src/lib/supabase.ts` file for Supabase client configuration
  - [x] SUB-002-03: Create `src/types/database.ts` file for TypeScript database types
  - [x] SUB-002-04: Update `package.json` scripts to include `"db:generate": "prisma generate"`
  - [x] SUB-002-05: Create `README.md` with setup instructions and environment variable explanations

## Authentication & User Management

- [x] **US-003**: Integrate Clerk authentication for user management
  - [x] SUB-003-01: Create Clerk account, get publishable key and secret key for `.env.local`
  - [x] SUB-003-02: Create `src/middleware.ts` file with Clerk's authMiddleware configuration
  - [x] SUB-003-03: Wrap `app/layout.tsx` with `<ClerkProvider>` component
  - [x] SUB-003-04: Create `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx`
  - [x] SUB-003-05: Create `src/components/UserButton.tsx` component using Clerk's `<UserButton />`

## Database & Backend Setup

- [x] **US-004**: Configure Supabase database with required tables
  - [x] SUB-004-01: Create Supabase project, get URL and anon key for `.env.local`
  - [x] SUB-004-02: Enable pgvector extension in Supabase SQL Editor: `CREATE EXTENSION IF NOT EXISTS vector;`
  - [x] SUB-004-03: Create `supabase/migrations/001_initial_schema.sql` with notes and chat tables schema
  - [x] SUB-004-04: Run migration in Supabase SQL Editor to create all tables
  - [x] SUB-004-05: Test Supabase connection by creating `src/lib/supabase.ts` client file

- [x] **US-005**: Create API routes for note management operations
  - [x] SUB-005-01: Create `app/api/notes/route.ts` with POST (create) and GET (list) handlers
  - [x] SUB-005-02: Create `app/api/notes/[id]/route.ts` with GET, PUT, and DELETE handlers
  - [x] SUB-005-03: Add Zod validation schema in `src/lib/validations.ts` for note creation
  - [x] SUB-005-04: Add error handling middleware function in `src/lib/api-utils.ts`
  - [x] SUB-005-05: Test API routes using Thunder Client or Postman with sample data

## Voice Input & Transcription

- [x] **US-006**: Implement voice recording functionality in the browser
  - [x] SUB-006-01: Create `src/hooks/useVoiceRecording.ts` hook using browser MediaRecorder API
  - [x] SUB-006-02: Create `src/components/VoiceRecorder.tsx` component with start/stop button
  - [x] SUB-006-03: Add microphone permission request and error handling in the hook
  - [x] SUB-006-04: Add visual recording indicator (red dot) and timer display
  - [x] SUB-006-05: Save recorded audio as blob and prepare for transcription API call

- [x] **US-007**: Create voice transcription API with OpenAI Whisper
  - [x] SUB-007-01: Create `app/api/transcribe/route.ts` endpoint accepting FormData with audio file
  - [x] SUB-007-02: Install and configure OpenAI SDK: add OPENAI_API_KEY to environment variables
  - [x] SUB-007-03: Implement Whisper API call in transcribe endpoint with error handling
  - [x] SUB-007-04: Add audio file validation (format, size limits) before processing
  - [x] SUB-007-05: Return transcribed text as JSON response with confidence score if available

## AI Processing & Enhancement

- [x] **US-008**: Implement AI-powered note processing and enhancement
  - [x] SUB-008-01: Create `app/api/process-note/route.ts` endpoint accepting transcript text
  - [x] SUB-008-02: Create `src/lib/openai.ts` with OpenAI client and helper functions
  - [x] SUB-008-03: Implement transcript cleanup using GPT-3.5-turbo with specific system prompt
  - [x] SUB-008-04: Add title and summary generation function with structured output
  - [x] SUB-008-05: Create auto-tagging function returning array of relevant tags

- [x] **US-009**: Build vector search capabilities for note retrieval
  - [x] SUB-009-01: Create `src/lib/embeddings.ts` file with OpenAI embedding functions
  - [x] SUB-009-02: Add embedding generation to note creation process in API
  - [x] SUB-009-03: Create `app/api/search/route.ts` for semantic search using pgvector
  - [x] SUB-009-04: Implement similarity search SQL query in `src/lib/database.ts`
  - [x] SUB-009-05: Test search functionality with sample notes and queries

## User Interface & Experience

- [x] **US-010**: Create main dashboard with note creation interface
  - [x] SUB-010-01: Create `app/dashboard/page.tsx` with protected route wrapper
  - [x] SUB-010-02: Create `src/components/Layout/DashboardLayout.tsx` with sidebar navigation
  - [x] SUB-010-03: Create `src/components/VoiceNoteModal.tsx` with recording interface
  - [x] SUB-010-04: Add floating action button (`+`) to trigger note creation modal
  - [x] SUB-010-05: Implement text input alternative with `<textarea>` for typing notes

- [x] **US-011**: Build notes list and management interface
  - [x] SUB-011-01: Create `src/components/NotesList.tsx` component with grid layout
  - [x] SUB-011-02: Create `src/components/NoteCard.tsx` with title, summary, tags, and date
  - [x] SUB-011-03: Add search bar component with real-time filtering in `NotesList`
  - [x] SUB-011-04: Implement note actions dropdown (edit, delete, favorite) on each card
  - [x] SUB-011-05: Create `src/components/NoteDetail.tsx` modal for viewing full note content

## Chat Interface & Conversation

- [x] **US-012**: Implement chat interface for conversing with notes
  - [x] SUB-012-01: Create `src/components/ChatInterface.tsx` with message list and input
  - [x] SUB-012-02: Create `app/api/chat/route.ts` endpoint using OpenAI Chat API
  - [x] SUB-012-03: Implement context retrieval by searching relevant notes for each query
  - [x] SUB-012-04: Add `src/components/MessageBubble.tsx` for user and assistant messages
  - [x] SUB-012-05: Create chat session persistence in database with automatic saving

- [x] **US-013**: Add file upload capability for documents and images
  - [x] SUB-013-01: Create `src/components/FileUpload.tsx` with drag-and-drop interface
  - [x] SUB-013-02: Set up file storage using Supabase Storage bucket
  - [x] SUB-013-03: Create `app/api/upload/route.ts` for handling file uploads
  - [x] SUB-013-04: Add PDF text extraction using `pdf-parse` npm package
  - [x] SUB-013-05: Store extracted text as new notes with file reference

## Search & Organization

- [x] **US-014**: Implement basic search and filtering system
  - [x] SUB-014-01: Add search functionality to `NotesList` component using text matching
  - [x] SUB-014-02: Create tag filter dropdown component in `src/components/TagFilter.tsx`
  - [x] SUB-014-03: Add date range picker for filtering notes by creation date
  - [x] SUB-014-04: Implement sort options (newest, oldest, alphabetical) in notes list
  - [x] SUB-014-05: Add "Clear all filters" button to reset search and filters

## Data Export & Backup

- [x] **US-015**: Add basic data export functionality
  - [x] SUB-015-01: Create `app/api/export/route.ts` endpoint for user data export
  - [x] SUB-015-02: Generate JSON export containing all user notes and metadata
  - [x] SUB-015-03: Add export button in user profile/settings area
  - [x] SUB-015-04: Create download link for generated export file
  - [x] SUB-015-05: Add export progress indicator and success message

## Testing & Quality Assurance

- [x] **US-016**: Implement basic testing for core functionality
  - [x] SUB-016-01: Set up Jest and React Testing Library with `npm install -D jest @testing-library/react`
  - [x] SUB-016-02: Create `src/lib/__tests__/openai.test.ts` for AI utility function tests
  - [x] SUB-016-03: Write component tests for `VoiceRecorder` and `NoteCard` components
  - [x] SUB-016-04: Create API route tests for `/api/notes` and `/api/transcribe` endpoints
  - [x] SUB-016-05: Set up test script in `package.json` and ensure all tests pass

## Deployment & Production Setup

- [x] **US-017**: Configure production deployment on Vercel
  - [x] SUB-017-01: Connect GitHub repository to Vercel dashboard
  - [x] SUB-017-02: Configure environment variables in Vercel project settings
  - [x] SUB-017-03: Set up production domain and SSL certificate
  - [x] SUB-017-04: Add basic analytics using Vercel Analytics
  - [x] SUB-017-05: Test production deployment with all features working

## Landing Page & Public Experience

- [x] **US-018**: Create landing page and public-facing experience
  - [x] SUB-018-01: Replace default Next.js page.tsx with proper VemoRable landing page
  - [x] SUB-018-02: Create hero section with value proposition and CTA to sign up
  - [x] SUB-018-03: Add features section showcasing key capabilities (voice notes, AI processing, chat)
  - [x] SUB-018-04: Create navigation bar with sign in/sign up buttons for unauthenticated users
  - [x] SUB-018-05: Add automatic redirect to dashboard for authenticated users
  - [x] SUB-018-06: Create responsive mobile layout for landing page
  - [x] SUB-018-07: Add testimonials or social proof section
  - [x] SUB-018-08: Create footer with links to privacy policy and terms

## Local Development Environment

- [ ] **US-019**: Set up Docker PostgreSQL with pgvector extension
  - [ ] SUB-019-01: Create `docker-compose.yml` with PostgreSQL 15 service, environment variables for POSTGRES_DB=vemorable_dev, POSTGRES_USER=postgres, POSTGRES_PASSWORD=postgres, port mapping 5432:5432
  - [ ] SUB-019-02: Create `docker/init-db.sql` script with `CREATE EXTENSION IF NOT EXISTS vector;` and all table schemas from the roadmap example
  - [ ] SUB-019-03: Configure Docker volume mounting with `./docker/data:/var/lib/postgresql/data` for data persistence
  - [ ] SUB-019-04: Add health check in docker-compose with `pg_isready` command and proper intervals
  - [ ] SUB-019-05: Test connection by running `docker-compose up -d` and connecting via `psql -h localhost -U postgres -d vemorable_dev`

- [ ] **US-020**: Create development authentication bypass
  - [ ] SUB-020-01: Create `src/lib/dev-auth.ts` with mock user object containing id, email="dev@vemorable.local", and other required user properties for development
  - [ ] SUB-020-02: Update `src/middleware.ts` to check for `NODE_ENV=development` and `BYPASS_AUTH=true` environment variables, skip Clerk middleware when both are true
  - [ ] SUB-020-03: Create `src/hooks/useDevAuth.ts` hook that returns mock user data when in development mode, otherwise falls back to Clerk's `useUser`
  - [ ] SUB-020-04: Update all components using `useUser` from Clerk to use the new `useDevAuth` hook instead for consistent development experience
  - [ ] SUB-020-05: Add environment variable `BYPASS_AUTH=true` to `.env.local.example` with clear documentation about development-only usage

- [ ] **US-021**: Configure local development environment
  - [ ] SUB-021-01: Create `.env.local.example` file with DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vemorable_dev, BYPASS_AUTH=true, and all other required environment variables with development defaults
  - [ ] SUB-021-02: Update `src/lib/supabase.ts` to use standard PostgreSQL client (pg) instead of Supabase client when DATABASE_URL points to local PostgreSQL
  - [ ] SUB-021-03: Create `src/lib/database.ts` with raw SQL queries for all database operations (notes CRUD, search, chat sessions) using the pg client
  - [ ] SUB-021-04: Update `next.config.js` to include development-specific configurations like disabling telemetry and enabling detailed error reporting
  - [ ] SUB-021-05: Create `scripts/migrate-dev.ts` script to run database migrations on local PostgreSQL using the init-db.sql file

- [ ] **US-022**: Create database seeding for local testing
  - [ ] SUB-022-01: Create `scripts/seed-dev.ts` with sample user data including 5 different test users with realistic names and emails
  - [ ] SUB-022-02: Add 15-20 sample notes with varied content types (voice transcripts, manual text, file uploads) across all test users
  - [ ] SUB-022-03: Create sample chat sessions with message history for testing the chat interface functionality
  - [ ] SUB-022-04: Include test file uploads and document references in the sample data
  - [ ] SUB-022-05: Add package.json script `"seed:dev": "tsx scripts/seed-dev.ts"` and `"reset:dev": "tsx scripts/reset-dev.ts"` for database management

- [ ] **US-023**: Set up local development workflow
  - [ ] SUB-023-01: Update package.json with `"dev:local": "docker-compose up -d && npm run migrate:dev && npm run seed:dev && npm run dev"` for one-command startup
  - [ ] SUB-023-02: Create `README-LOCAL-DEV.md` with step-by-step setup instructions, prerequisites, and common troubleshooting scenarios
  - [ ] SUB-023-03: Add health check script `scripts/check-local-env.ts` to verify Docker, database connection, and all services are running
  - [ ] SUB-023-04: Configure hot reloading to work with Docker services and add proper shutdown handling
  - [ ] SUB-023-05: Create `docker-compose.override.yml` for developer-specific customizations and document environment variable precedence

---

## Progress Tracking

- **Total User Stories**: 23
- **Completed User Stories**: 18/23 (78%)
- **Total Sub-Tasks**: 118
- **Completed Sub-Tasks**: 93/118 (79%)
- **Current Progress**: 78%

### Completion Status by Category:
- [x] **Project Setup & Configuration** (2 user stories) ✅
- [x] **Authentication & User Management** (1 user story) ✅
- [x] **Database & Backend Setup** (2 user stories) ✅
- [x] **Voice Input & Transcription** (2/2 user stories) ✅
- [x] **AI Processing & Enhancement** (2/2 user stories) ✅
- [x] **User Interface & Experience** (2/2 user stories) ✅
- [x] **Chat Interface & Conversation** (2/2 user stories) ✅
- [x] **Search & Organization** (1/1 user story) ✅
- [x] **Data Export & Backup** (1/1 user story) ✅
- [x] **Testing & Quality Assurance** (1 user story) ✅
- [x] **Deployment & Production Setup** (1 user story) ✅
- [x] **Landing Page & Public Experience** (1 user story) ✅
- [ ] **Local Development Environment** (5 user stories)

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