-- Add tags to notes
-- v0.6.0: Lightweight tagging system

ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[];

-- Create GIN index for efficient array operations (contains, overlaps)
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN (tags);

-- Function to get unique tags for a user (efficiently)
CREATE OR REPLACE FUNCTION get_user_tags(p_user_id UUID)
RETURNS TABLE (tag TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(tags) as tag, count(*) as count
  FROM notes
  WHERE user_id = p_user_id
  GROUP BY tag
  ORDER BY count DESC, tag ASC;
END;
$$ LANGUAGE plpgsql;

-- Function for admin trends
CREATE OR REPLACE FUNCTION get_global_tag_trends()
RETURNS TABLE (tag TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(tags) as tag, count(*) as count
  FROM notes
  GROUP BY tag
  ORDER BY count DESC, tag ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;
