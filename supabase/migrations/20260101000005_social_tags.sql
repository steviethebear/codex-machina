-- Create the new relation table
CREATE TABLE IF NOT EXISTS note_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    tag TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(note_id, user_id, tag)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag);
CREATE INDEX IF NOT EXISTS idx_note_tags_user_id ON note_tags(user_id);

-- Enable RLS
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Everyone can read tags (Social discovery)
DROP POLICY IF EXISTS "Anyone can read tags" ON note_tags;
CREATE POLICY "Anyone can read tags" ON note_tags
    FOR SELECT USING (true);

-- 2. Authenticated users can insert tags (Social tagging)
DROP POLICY IF EXISTS "Authenticated users can add tags" ON note_tags;
CREATE POLICY "Authenticated users can add tags" ON note_tags
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Users can delete their OWN tags
DROP POLICY IF EXISTS "Users can delete their own tags" ON note_tags;
CREATE POLICY "Users can delete their own tags" ON note_tags
    FOR DELETE USING (auth.uid() = user_id);

-- Note Owners can delete ANY tag on their note?
-- Optional: "Note owners can delete tags on their notes"
DROP POLICY IF EXISTS "Note owners can delete tags on their notes" ON note_tags;
CREATE POLICY "Note owners can delete tags on their notes" ON note_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM notes WHERE id = note_tags.note_id AND user_id = auth.uid()
        )
    );

-- MIGRATION: Move existing tags to the new table
-- Attribution: The author of the note is assumed to be the tagger for existing tags.
INSERT INTO note_tags (note_id, user_id, tag)
SELECT id, user_id, unnest(tags)
FROM notes
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
ON CONFLICT (note_id, user_id, tag) DO NOTHING;

-- UPDATE RPC: get_user_tags to use the new table
CREATE OR REPLACE FUNCTION get_user_tags(p_user_id UUID)
RETURNS TABLE (
    tag TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.tag, COUNT(*) as count
    FROM note_tags t
    WHERE t.user_id = p_user_id
    GROUP BY t.tag
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- UPDATE RPC: get_global_tag_trends to use the new table
CREATE OR REPLACE FUNCTION get_global_tag_trends()
RETURNS TABLE (
    tag TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.tag, COUNT(*) as count
    FROM note_tags t
    GROUP BY t.tag
    ORDER BY count DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NEW RPC: Global Tag Search (Find notes by tag)
-- This might be useful if complex joins are needed, otherwise client-side join is fine.
