-- Codex Machina v0.3.2 — Smart Suggestions + Hub Recognition
-- Add vector embeddings, hub tracking, and automatic connection counting

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add new columns to atomic_notes
ALTER TABLE public.atomic_notes 
ADD COLUMN IF NOT EXISTS is_hub BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS connection_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS embedding vector(768); -- Gemini embedding-001 produces 768-dim vectors

-- Create index for vector similarity search (using cosine distance)
-- Note: ivfflat requires manual VACUUM ANALYZE after bulk inserts for optimal performance
CREATE INDEX IF NOT EXISTS atomic_notes_embedding_idx ON public.atomic_notes 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function to update connection count for a note
CREATE OR REPLACE FUNCTION update_connection_count()
RETURNS TRIGGER AS $$
DECLARE
  affected_note_id uuid;
BEGIN
  -- Determine which note IDs to update based on INSERT or DELETE
  IF TG_OP = 'INSERT' THEN
    -- Update from_note connection count
    UPDATE atomic_notes
    SET connection_count = (
      SELECT COUNT(DISTINCT CASE 
        WHEN from_note_id = NEW.from_note_id THEN COALESCE(to_note_id, to_text_id)
        WHEN to_note_id = NEW.from_note_id THEN from_note_id
      END)
      FROM links
      WHERE from_note_id = NEW.from_note_id OR to_note_id = NEW.from_note_id
    )
    WHERE id = NEW.from_note_id;
    
    -- Update to_note connection count (if linking to note, not text)
    IF NEW.to_note_id IS NOT NULL THEN
      UPDATE atomic_notes
      SET connection_count = (
        SELECT COUNT(DISTINCT CASE 
          WHEN from_note_id = NEW.to_note_id THEN COALESCE(to_note_id, to_text_id)
          WHEN to_note_id = NEW.to_note_id THEN from_note_id
        END)
        FROM links
        WHERE from_note_id = NEW.to_note_id OR to_note_id = NEW.to_note_id
      )
      WHERE id = NEW.to_note_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Update from_note connection count
    UPDATE atomic_notes
    SET connection_count = (
      SELECT COUNT(DISTINCT CASE 
        WHEN from_note_id = OLD.from_note_id THEN COALESCE(to_note_id, to_text_id)
        WHEN to_note_id = OLD.from_note_id THEN from_note_id
      END)
      FROM links
      WHERE from_note_id = OLD.from_note_id OR to_note_id = OLD.from_note_id
    )
    WHERE id = OLD.from_note_id;
    
    -- Update to_note connection count (if was linking to note)
    IF OLD.to_note_id IS NOT NULL THEN
      UPDATE atomic_notes
      SET connection_count = (
        SELECT COUNT(DISTINCT CASE 
          WHEN from_note_id = OLD.to_note_id THEN COALESCE(to_note_id, to_text_id)
          WHEN to_note_id = OLD.to_note_id THEN from_note_id
        END)
        FROM links
        WHERE from_note_id = OLD.to_note_id OR to_note_id = OLD.to_note_id
      )
      WHERE id = OLD.to_note_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger on link insertion/deletion to update connection counts
DROP TRIGGER IF EXISTS link_connection_count_trigger ON links;
CREATE TRIGGER link_connection_count_trigger
AFTER INSERT OR DELETE ON links
FOR EACH ROW EXECUTE FUNCTION update_connection_count();

-- Function to check and update hub status when connection_count changes
CREATE OR REPLACE FUNCTION check_hub_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- Promote to hub if reaching threshold (5 connections)
  IF NEW.connection_count >= 5 AND (OLD.is_hub = false OR OLD.is_hub IS NULL) THEN
    NEW.is_hub = true;
  -- Demote from hub if falling below threshold
  ELSIF NEW.connection_count < 5 AND OLD.is_hub = true THEN
    NEW.is_hub = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update hub status when connection_count changes
DROP TRIGGER IF EXISTS hub_promotion_trigger ON atomic_notes;
CREATE TRIGGER hub_promotion_trigger
BEFORE UPDATE OF connection_count ON atomic_notes
FOR EACH ROW EXECUTE FUNCTION check_hub_promotion();

-- Initialize connection counts for existing notes
UPDATE atomic_notes
SET connection_count = (
  SELECT COUNT(DISTINCT CASE 
    WHEN from_note_id = atomic_notes.id THEN COALESCE(to_note_id, to_text_id)
    WHEN to_note_id = atomic_notes.id THEN from_note_id
  END)
  FROM links
  WHERE from_note_id = atomic_notes.id OR to_note_id = atomic_notes.id
)
WHERE connection_count = 0;

-- Set hub status for existing notes that qualify
UPDATE atomic_notes
SET is_hub = true
WHERE connection_count >= 5 AND is_hub = false;

-- Create RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  body text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    atomic_notes.id,
    atomic_notes.title,
    atomic_notes.body,
    atomic_notes.created_at,
    1 - (atomic_notes.embedding <=> query_embedding) as similarity
  FROM atomic_notes
  WHERE atomic_notes.embedding IS NOT NULL
    AND 1 - (atomic_notes.embedding <=> query_embedding) > match_threshold
  ORDER BY atomic_notes.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
