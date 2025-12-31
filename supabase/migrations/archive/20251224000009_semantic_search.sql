-- Enable pgvector extension
create extension if not exists vector;

-- Add embedding column to notes table
-- Using 768 dimensions for Gemini text-embedding-004
alter table notes 
add column if not exists embedding vector(768);

-- Create index for faster semantic search (HNSW)
create index if not exists notes_embedding_idx 
on notes 
using hnsw (embedding vector_cosine_ops);

-- function to search for similar notes
create or replace function match_notes (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  msg_user_id uuid
)
returns table (
  id uuid,
  title text,
  content text,
  type text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    notes.id,
    notes.title,
    notes.content,
    notes.type,
    1 - (notes.embedding <=> query_embedding) as similarity
  from notes
  where 1 - (notes.embedding <=> query_embedding) > match_threshold
  -- Only return notes visible to the user:
  -- 1. Own notes
  -- 2. Public notes (from others)
  and (notes.user_id = msg_user_id or notes.is_public = true)
  order by notes.embedding <=> query_embedding
  limit match_count;
end;
$$;
