# Data Model: VeMorable Core Platform

**Date**: 2025-09-09  
**Database**: PostgreSQL with pgvector extension (Supabase)

## Core Entities

### User
Represents an individual who creates and owns notes.

```typescript
interface User {
  id: string;                    // UUID primary key
  email: string;                 // Unique, validated email address
  created_at: timestamp;         // Account creation timestamp
  updated_at: timestamp;         // Last profile update
  preferences: UserPreferences;  // JSON column for user settings
}

interface UserPreferences {
  defaultLanguage: string;       // Primary language for transcription
  autoProcessing: boolean;       // Enable automatic AI processing
  retentionDays: number;         // Note retention preference (default: 365)
  notificationSettings: {
    processingComplete: boolean;
    weeklyDigest: boolean;
    searchInsights: boolean;
  };
}
```

**Relationships**: One-to-many with Notes, Tags, Summaries  
**Validation Rules**: 
- Email must be unique and valid format
- Created via Supabase Auth, not direct insert
- RLS policy: Users can only access their own data

### Note
Represents a single captured thought or idea with AI-generated metadata.

```typescript
interface Note {
  id: string;                    // UUID primary key
  user_id: string;              // Foreign key to User
  title: string;                // AI-generated or user-provided title
  content: string;              // Original text or transcribed content
  raw_audio_url?: string;       // Temporary URL for audio file (if voice note)
  
  // AI Processing Results
  processed_content: string;    // Cleaned and structured content
  summary: string;             // AI-generated brief summary
  embedding: number[];         // Vector embedding for semantic search
  
  // Metadata
  source_type: 'voice' | 'text'; // How the note was created
  language: string;             // Detected/specified language
  confidence_score: number;     // Transcription confidence (0-1)
  processing_status: ProcessingStatus; // Current AI processing state
  
  // Timestamps
  created_at: timestamp;
  updated_at: timestamp;
  processed_at?: timestamp;     // When AI processing completed
}

type ProcessingStatus = 
  | 'pending'      // Just created, not yet processed
  | 'transcribing' // Converting voice to text
  | 'processing'   // AI analyzing content
  | 'complete'     // All processing finished
  | 'error'        // Processing failed
  | 'retry';       // Queued for retry
```

**Relationships**: 
- Many-to-one with User
- Many-to-many with Tags (via note_tags junction table)
- One-to-many with Summaries (when included in summaries)

**Validation Rules**:
- Content cannot be empty after processing
- Embedding array length must match model dimensions (1536 for text-embedding-3-small)
- Processing status transitions follow defined state machine
- Raw audio URLs expire after 24 hours

**Indexes**:
- `user_id` for user note queries
- `embedding` using pgvector index for similarity search
- `created_at` for chronological sorting
- Composite index on `(user_id, processing_status)` for dashboard queries

### Tag
Represents automatically generated keywords assigned to notes.

```typescript
interface Tag {
  id: string;                   // UUID primary key
  user_id: string;             // Foreign key to User
  name: string;                // Tag name (e.g., "work", "ideas", "personal")
  description?: string;        // AI-generated tag description
  
  // Usage Analytics
  note_count: number;          // How many notes have this tag
  first_used: timestamp;       // When this tag was first generated
  last_used: timestamp;        // Most recent usage
  
  // AI Generation Metadata
  confidence: number;          // AI confidence in tag relevance (0-1)
  generated_by: string;        // AI model version that created tag
  
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Relationships**: 
- Many-to-one with User
- Many-to-many with Notes (via note_tags junction table)

**Validation Rules**:
- Tag names are normalized (lowercase, no special chars)
- Duplicate tags per user are merged automatically
- Minimum confidence threshold of 0.6 for auto-generation

### NoteTags (Junction Table)
Links notes to their automatically generated tags.

```typescript
interface NoteTag {
  note_id: string;             // Foreign key to Note
  tag_id: string;              // Foreign key to Tag
  relevance_score: number;     // How relevant tag is to note (0-1)
  generated_at: timestamp;     // When this tag was applied
  
  // Composite primary key: (note_id, tag_id)
}
```

**Validation Rules**:
- Relevance score must be between 0.6 and 1.0
- Maximum 10 tags per note to maintain quality
- Tags automatically removed if relevance drops below threshold

### Summary
Represents AI-generated summaries combining multiple related notes.

```typescript
interface Summary {
  id: string;                  // UUID primary key
  user_id: string;            // Foreign key to User
  title: string;              // Summary title
  content: string;            // Generated summary content
  query: string;              // Original user query that generated summary
  
  // Source Notes
  source_note_ids: string[];  // Array of note IDs used in summary
  note_count: number;         // Total notes included
  
  // Generation Metadata
  generated_by: string;       // AI model used for generation
  generation_time: number;    // Processing time in milliseconds
  token_usage: number;        // Tokens consumed for generation
  
  // Usage
  access_count: number;       // How many times user viewed
  last_accessed: timestamp;   // Most recent access
  
  created_at: timestamp;
  expires_at: timestamp;      // Auto-cleanup after 30 days
}
```

**Relationships**: 
- Many-to-one with User
- References multiple Notes via source_note_ids array

**Validation Rules**:
- Must reference at least 2 source notes
- Content cannot exceed 5000 characters
- Expires after 30 days unless re-accessed
- Maximum 50 summaries per user (oldest auto-deleted)

## Database Schema (SQL)

```sql
-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (managed by Supabase Auth)
-- Additional user preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  raw_audio_url TEXT,
  
  processed_content TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  
  source_type TEXT NOT NULL CHECK (source_type IN ('voice', 'text')),
  language TEXT NOT NULL DEFAULT 'en',
  confidence_score NUMERIC(3,2) DEFAULT 0.0,
  processing_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (processing_status IN ('pending', 'transcribing', 'processing', 'complete', 'error', 'retry')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  note_count INTEGER DEFAULT 0,
  first_used TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ DEFAULT NOW(),
  
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.0,
  generated_by TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

-- Note-Tag junction table
CREATE TABLE note_tags (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  relevance_score NUMERIC(3,2) NOT NULL CHECK (relevance_score >= 0.6),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (note_id, tag_id)
);

-- Summaries table
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  query TEXT NOT NULL,
  
  source_note_ids UUID[] NOT NULL,
  note_count INTEGER NOT NULL DEFAULT 0,
  
  generated_by TEXT NOT NULL,
  generation_time INTEGER DEFAULT 0,
  token_usage INTEGER DEFAULT 0,
  
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indexes for performance
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_status ON notes(user_id, processing_status);
CREATE INDEX idx_notes_embedding ON notes USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_name ON tags(user_id, name);

CREATE INDEX idx_summaries_user_id ON summaries(user_id);
CREATE INDEX idx_summaries_expires ON summaries(expires_at);

-- Row Level Security (RLS) Policies
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY notes_user_policy ON notes FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY tags_user_policy ON tags FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY summaries_user_policy ON summaries FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY preferences_user_policy ON user_preferences FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Note-tags inherit security from parent tables
CREATE POLICY note_tags_user_policy ON note_tags FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_id AND notes.user_id = auth.uid()));
```

## State Machines

### Note Processing States
```
pending → transcribing → processing → complete
   ↓           ↓            ↓           
  error ←     error  ←     error
   ↓           ↓            ↓
  retry →    retry   →    retry
```

### Data Lifecycle
- **Raw audio**: Deleted after 24 hours or successful transcription
- **Notes**: Retained indefinitely (user controlled via preferences)
- **Summaries**: Auto-expire after 30 days unless accessed
- **Tags**: Cascade deleted when no notes reference them
- **User data**: Permanently deleted on account closure