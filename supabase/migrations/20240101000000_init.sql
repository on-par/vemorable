-- Enable pgvector extension for embeddings
create extension if not exists vector with schema extensions;

-- Dumps table
create table if not exists public.dumps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  audio_url text,
  transcript text not null,
  one_thing text not null,
  insight_mode text not null check (insight_mode in ('action', 'tension', 'clarity', 'pattern')),
  tags text[] not null default '{}',
  embedding vector(1536),
  duration_seconds integer,
  prompt_shown text,
  created_at timestamptz default now() not null
);

-- Create index for user lookups
create index if not exists dumps_user_id_idx on public.dumps(user_id);

-- Create index for created_at ordering
create index if not exists dumps_created_at_idx on public.dumps(created_at desc);

-- Create index for tag array lookups
create index if not exists dumps_tags_idx on public.dumps using gin(tags);

-- Create vector similarity search index
create index if not exists dumps_embedding_idx on public.dumps
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Enable Row Level Security
alter table public.dumps enable row level security;

-- RLS Policies
create policy "Users can view own dumps"
  on public.dumps for select
  using (auth.uid() = user_id);

create policy "Users can insert own dumps"
  on public.dumps for insert
  with check (auth.uid() = user_id);

create policy "Users can update own dumps"
  on public.dumps for update
  using (auth.uid() = user_id);

create policy "Users can delete own dumps"
  on public.dumps for delete
  using (auth.uid() = user_id);

-- Function for vector similarity search
create or replace function match_dumps(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id_filter uuid
)
returns table (
  id uuid,
  user_id uuid,
  audio_url text,
  transcript text,
  one_thing text,
  insight_mode text,
  tags text[],
  duration_seconds integer,
  prompt_shown text,
  created_at timestamptz,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    dumps.id,
    dumps.user_id,
    dumps.audio_url,
    dumps.transcript,
    dumps.one_thing,
    dumps.insight_mode,
    dumps.tags,
    dumps.duration_seconds,
    dumps.prompt_shown,
    dumps.created_at,
    1 - (dumps.embedding <=> query_embedding) as similarity
  from public.dumps
  where dumps.user_id = user_id_filter
    and 1 - (dumps.embedding <=> query_embedding) > match_threshold
  order by dumps.embedding <=> query_embedding
  limit match_count;
end;
$$;
