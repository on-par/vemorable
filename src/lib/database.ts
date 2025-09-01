import { createServerClientInstance } from './supabase'

/**
 * SQL function for similarity search using pgvector
 * This function should be created in your Supabase database
 */
export const SEARCH_NOTES_SQL = `
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
`

/**
 * Alternative similarity search using inner product
 */
export const SEARCH_NOTES_INNER_PRODUCT_SQL = `
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
`

/**
 * Hybrid search combining vector similarity with keyword search
 */
export const HYBRID_SEARCH_NOTES_SQL = `
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
`

/**
 * Index creation for better search performance
 */
export const CREATE_SEARCH_INDEXES_SQL = `
-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS notes_embedding_idx ON notes 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for text search
CREATE INDEX IF NOT EXISTS notes_text_search_idx ON notes
USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(processed_content, '')));

-- Create index for user_id for faster filtering
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);

-- Create index for tags
CREATE INDEX IF NOT EXISTS notes_tags_idx ON notes USING gin(tags);
`

/**
 * Execute a database function or query
 */
export async function executeQuery(sql: string) {
  const supabase = await createServerClientInstance()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('exec_sql', { query: sql })
  
  if (error) {
    console.error('Database query error:', error)
    throw error
  }
  
  return data
}

/**
 * Initialize search functions in the database
 * This should be run once during setup or migration
 */
export async function initializeSearchFunctions() {
  try {
    // Note: These functions need to be created via Supabase SQL Editor
    // or through migration files since RPC exec_sql might not be available
    console.log('Search functions SQL generated. Please execute in Supabase SQL Editor:')
    console.log(SEARCH_NOTES_SQL)
    console.log(CREATE_SEARCH_INDEXES_SQL)
    
    return {
      success: true,
      message: 'Search function SQL generated. Execute in Supabase SQL Editor.',
    }
  } catch (error) {
    console.error('Error initializing search functions:', error)
    throw error
  }
}