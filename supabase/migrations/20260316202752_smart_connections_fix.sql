-- Fix vector dimension for Gemini (from 1536 to 768)
ALTER TABLE notes 
ALTER COLUMN embedding TYPE vector(768);

-- Create index for faster semantic search (HNSW) if it doesn't exist
CREATE INDEX IF NOT EXISTS notes_embedding_idx 
ON notes 
USING hnsw (embedding vector_cosine_ops);

-- function to search for similar notes
CREATE OR REPLACE FUNCTION match_notes (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  msg_user_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  type text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    notes.id,
    notes.title,
    notes.content,
    notes.type::text,
    1 - (notes.embedding <=> query_embedding) AS similarity
  FROM notes
  WHERE 1 - (notes.embedding <=> query_embedding) > match_threshold
  -- Only return notes visible to the user:
  -- 1. Own notes
  -- 2. Public notes (from others)
  AND (notes.user_id = msg_user_id OR notes.is_public = true)
  ORDER BY notes.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
