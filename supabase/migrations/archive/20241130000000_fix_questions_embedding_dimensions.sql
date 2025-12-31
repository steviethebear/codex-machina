-- Fix embedding dimension mismatch for questions table
-- Google's text-embedding-004 produces 768 dimensions, not 1536

-- Drop the existing index
DROP INDEX IF EXISTS idx_questions_embedding;

-- Alter the column to use 768 dimensions
ALTER TABLE questions 
  ALTER COLUMN embedding TYPE VECTOR(768);

-- Recreate the index with correct dimensions
CREATE INDEX idx_questions_embedding 
  ON questions 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Update the search function to use 768 dimensions
CREATE OR REPLACE FUNCTION search_similar_questions(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  body TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.title,
    q.body,
    1 - (q.embedding <=> query_embedding) AS similarity
  FROM questions q
  WHERE 
    q.moderation_status = 'approved'
    AND 1 - (q.embedding <=> query_embedding) > match_threshold
  ORDER BY q.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
