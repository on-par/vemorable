-- Migration: Complete schema with comprehensive RLS policies
-- Date: 2025-09-09
-- Description: Creates missing tables (user_preferences, tags, note_tags, summaries) 
--              and implements comprehensive RLS policies for secure data access

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT NOT NULL PRIMARY KEY,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_preferences CHECK (preferences IS NOT NULL)
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Usage Analytics
  note_count INTEGER DEFAULT 0,
  first_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- AI Generation Metadata
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.0,
  generated_by TEXT NOT NULL DEFAULT 'system',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, name),
  CONSTRAINT valid_confidence CHECK (confidence >= 0.0 AND confidence <= 1.0),
  CONSTRAINT valid_note_count CHECK (note_count >= 0)
);

-- Create note_tags junction table
CREATE TABLE IF NOT EXISTS note_tags (
  note_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  relevance_score NUMERIC(3,2) NOT NULL DEFAULT 0.6,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Composite primary key
  PRIMARY KEY (note_id, tag_id),
  
  -- Foreign key constraints
  CONSTRAINT fk_note_tags_note_id FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  CONSTRAINT fk_note_tags_tag_id FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT valid_relevance_score CHECK (relevance_score >= 0.6 AND relevance_score <= 1.0)
);

-- Create summaries table
CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  query TEXT NOT NULL,
  
  -- Source Notes
  source_note_ids UUID[] NOT NULL DEFAULT '{}',
  note_count INTEGER NOT NULL DEFAULT 0,
  
  -- Generation Metadata
  generated_by TEXT NOT NULL DEFAULT 'openai-gpt-4',
  generation_time INTEGER DEFAULT 0,
  token_usage INTEGER DEFAULT 0,
  
  -- Usage tracking
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Constraints
  CONSTRAINT valid_note_count CHECK (note_count >= 0),
  CONSTRAINT valid_access_count CHECK (access_count >= 0),
  CONSTRAINT valid_generation_time CHECK (generation_time >= 0),
  CONSTRAINT valid_token_usage CHECK (token_usage >= 0),
  CONSTRAINT non_empty_content CHECK (length(trim(content)) > 0),
  CONSTRAINT non_empty_title CHECK (length(trim(title)) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(user_id, name);
CREATE INDEX IF NOT EXISTS idx_tags_last_used ON tags(last_used DESC);
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_summaries_created_at ON summaries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_expires_at ON summaries(expires_at);
CREATE INDEX IF NOT EXISTS idx_summaries_last_accessed ON summaries(last_accessed DESC);

-- Create triggers for updating updated_at timestamps
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- User Preferences RLS Policies
-- Users can only access their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own preferences" ON user_preferences
  FOR DELETE USING (auth.uid()::text = user_id);

-- Tags RLS Policies
-- Users can only access their own tags
CREATE POLICY "Users can view own tags" ON tags
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own tags" ON tags
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own tags" ON tags
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own tags" ON tags
  FOR DELETE USING (auth.uid()::text = user_id);

-- Note Tags RLS Policies
-- Users can access tags for notes they own
CREATE POLICY "Users can view tags for own notes" ON note_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_tags.note_id
      AND notes.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert tags for own notes" ON note_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_tags.note_id
      AND notes.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update tags for own notes" ON note_tags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_tags.note_id
      AND notes.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_tags.note_id
      AND notes.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete tags for own notes" ON note_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_tags.note_id
      AND notes.user_id = auth.uid()::text
    )
  );

-- Summaries RLS Policies
-- Users can only access their own summaries
CREATE POLICY "Users can view own summaries" ON summaries
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own summaries" ON summaries
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own summaries" ON summaries
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own summaries" ON summaries
  FOR DELETE USING (auth.uid()::text = user_id);

-- Comments for documentation
COMMENT ON TABLE user_preferences IS 'Stores user-specific settings and preferences';
COMMENT ON TABLE tags IS 'AI-generated tags for categorizing notes';
COMMENT ON TABLE note_tags IS 'Junction table linking notes to their tags with relevance scores';
COMMENT ON TABLE summaries IS 'AI-generated summaries combining multiple related notes';

COMMENT ON COLUMN tags.confidence IS 'AI confidence in tag relevance (0.0-1.0)';
COMMENT ON COLUMN tags.generated_by IS 'AI model version that created the tag';
COMMENT ON COLUMN note_tags.relevance_score IS 'How relevant the tag is to the note (0.6-1.0)';
COMMENT ON COLUMN summaries.source_note_ids IS 'Array of note IDs used to generate this summary';
COMMENT ON COLUMN summaries.expires_at IS 'Auto-cleanup timestamp (30 days from creation)';
COMMENT ON COLUMN summaries.token_usage IS 'Tokens consumed during AI generation';

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE user_preferences TO authenticated;
GRANT ALL ON TABLE tags TO authenticated;
GRANT ALL ON TABLE note_tags TO authenticated;
GRANT ALL ON TABLE summaries TO authenticated;

-- Grant sequence permissions (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;