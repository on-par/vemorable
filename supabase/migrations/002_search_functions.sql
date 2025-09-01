-- Migration: Add vector search functions and indexes
-- Date: 2024-08-31
-- Description: Creates functions for semantic search using pgvector

-- Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Function for basic similarity search using cosine distance
CREATE OR REPLACE FUNCTION search_notes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id_filter text
)
RETURNS TABLE (
  id uuid,
  user_id text,
  title text,
  raw_transcript text,
  processed_content text,
  summary text,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    notes.id,
    notes.user_id,
    notes.title,
    notes.raw_transcript,
    notes.processed_content,
    notes.summary,
    notes.tags,
    notes.created_at,
    notes.updated_at,
    1 - (notes.embedding <=> query_embedding) AS similarity
  FROM notes
  WHERE 
    notes.user_id = user_id_filter
    AND notes.embedding IS NOT NULL
    AND 1 - (notes.embedding <=> query_embedding) > match_threshold
  ORDER BY notes.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function for similarity search using inner product
CREATE OR REPLACE FUNCTION search_notes_inner_product(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id_filter text
)
RETURNS TABLE (
  id uuid,
  user_id text,
  title text,
  raw_transcript text,
  processed_content text,
  summary text,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    notes.id,
    notes.user_id,
    notes.title,
    notes.raw_transcript,
    notes.processed_content,
    notes.summary,
    notes.tags,
    notes.created_at,
    notes.updated_at,
    (notes.embedding <#> query_embedding) * -1 AS similarity
  FROM notes
  WHERE 
    notes.user_id = user_id_filter
    AND notes.embedding IS NOT NULL
    AND (notes.embedding <#> query_embedding) * -1 > match_threshold
  ORDER BY notes.embedding <#> query_embedding DESC
  LIMIT match_count;
END;
$$;

-- Hybrid search combining vector similarity with keyword search
CREATE OR REPLACE FUNCTION hybrid_search_notes(
  query_embedding vector(1536),
  query_text text,
  match_threshold float,
  match_count int,
  user_id_filter text
)
RETURNS TABLE (
  id uuid,
  user_id text,
  title text,
  raw_transcript text,
  processed_content text,
  summary text,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  similarity float,
  rank float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_search AS (
    SELECT
      notes.id,
      1 - (notes.embedding <=> query_embedding) AS similarity
    FROM notes
    WHERE 
      notes.user_id = user_id_filter
      AND notes.embedding IS NOT NULL
  ),
  keyword_search AS (
    SELECT
      notes.id,
      ts_rank_cd(
        to_tsvector('english', coalesce(notes.title, '') || ' ' || coalesce(notes.processed_content, '')),
        plainto_tsquery('english', query_text)
      ) AS rank
    FROM notes
    WHERE 
      notes.user_id = user_id_filter
      AND (
        notes.title ILIKE '%' || query_text || '%'
        OR notes.processed_content ILIKE '%' || query_text || '%'
        OR EXISTS (
          SELECT 1 FROM unnest(notes.tags) AS tag
          WHERE tag ILIKE '%' || query_text || '%'
        )
      )
  )
  SELECT
    notes.id,
    notes.user_id,
    notes.title,
    notes.raw_transcript,
    notes.processed_content,
    notes.summary,
    notes.tags,
    notes.created_at,
    notes.updated_at,
    COALESCE(vs.similarity, 0) AS similarity,
    COALESCE(ks.rank, 0) + COALESCE(vs.similarity, 0) AS rank
  FROM notes
  LEFT JOIN vector_search vs ON notes.id = vs.id
  LEFT JOIN keyword_search ks ON notes.id = ks.id
  WHERE 
    notes.user_id = user_id_filter
    AND (
      COALESCE(vs.similarity, 0) > match_threshold
      OR COALESCE(ks.rank, 0) > 0
    )
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;

-- Create indexes for better search performance

-- Index for vector similarity search using IVFFlat
-- Note: lists parameter should be adjusted based on your data size
-- For < 1M rows, use lists = 100; for 1M-10M rows, use lists = 1000
CREATE INDEX IF NOT EXISTS notes_embedding_idx ON notes 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for text search
CREATE INDEX IF NOT EXISTS notes_text_search_idx ON notes
USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(processed_content, '')));

-- Index for user_id for faster filtering
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);

-- Index for tags array
CREATE INDEX IF NOT EXISTS notes_tags_idx ON notes USING gin(tags);

-- Index for created_at and updated_at for sorting
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes(updated_at DESC);

-- Composite index for user_id and created_at for common queries
CREATE INDEX IF NOT EXISTS notes_user_created_idx ON notes(user_id, created_at DESC);

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION search_notes TO authenticated;
GRANT EXECUTE ON FUNCTION search_notes_inner_product TO authenticated;
GRANT EXECUTE ON FUNCTION hybrid_search_notes TO authenticated;