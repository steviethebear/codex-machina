-- Codex Machina v0.4 Migration: Links Table Modifications
-- Created: 2025-11-28
-- Description: Extends links table to support question linking

-- ============================================================================
-- ADD QUESTION LINK COLUMNS
-- ============================================================================

-- Add columns for linking questions
ALTER TABLE links 
  ADD COLUMN IF NOT EXISTS from_question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS to_question_id UUID REFERENCES questions(id) ON DELETE CASCADE;

-- ============================================================================
-- UPDATE CONSTRAINTS
-- ============================================================================

-- Drop existing constraint if it exists
ALTER TABLE links DROP CONSTRAINT IF EXISTS links_source_check;

-- Add new constraint: must link from/to something
-- Links can be: note->note, note->text, question->note, question->question
ALTER TABLE links ADD CONSTRAINT links_source_check 
  CHECK (
    (from_note_id IS NOT NULL OR from_question_id IS NOT NULL) AND
    (to_note_id IS NOT NULL OR to_text_id IS NOT NULL OR to_question_id IS NOT NULL)
  );

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_links_from_question ON links(from_question_id);
CREATE INDEX IF NOT EXISTS idx_links_to_question ON links(to_question_id);

-- Composite index for question-atom links
CREATE INDEX IF NOT EXISTS idx_links_question_atom 
  ON links(from_question_id, to_note_id) 
  WHERE from_question_id IS NOT NULL;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get all atoms linked to a question (replies)
CREATE OR REPLACE FUNCTION get_question_replies(question_id UUID)
RETURNS TABLE (
  atom_id UUID,
  atom_title TEXT,
  atom_body TEXT,
  author_id UUID,
  created_at TIMESTAMPTZ,
  relation_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    an.id,
    an.title,
    an.body,
    an.author_id,
    an.created_at,
    l.relation_type
  FROM links l
  JOIN atomic_notes an ON an.id = l.to_note_id
  WHERE 
    l.from_question_id = get_question_replies.question_id
    AND an.moderation_status = 'approved'
  ORDER BY an.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Get all questions linked to an atom
CREATE OR REPLACE FUNCTION get_atom_questions(atom_id UUID)
RETURNS TABLE (
  question_id UUID,
  question_title TEXT,
  question_body TEXT,
  author_id UUID,
  created_at TIMESTAMPTZ,
  is_resolved BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.title,
    q.body,
    q.author_id,
    q.created_at,
    q.is_resolved
  FROM links l
  JOIN questions q ON q.id = l.from_question_id
  WHERE 
    l.to_note_id = get_atom_questions.atom_id
    AND q.moderation_status = 'approved'
  ORDER BY q.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE RLS POLICIES
-- ============================================================================

-- Links policies should already exist, but ensure they work with questions
-- Students can view links involving approved content
DROP POLICY IF EXISTS "Students can view links" ON links;
CREATE POLICY "Students can view links"
  ON links FOR SELECT
  USING (
    -- Link involves approved atoms
    (from_note_id IS NULL OR EXISTS (
      SELECT 1 FROM atomic_notes WHERE id = from_note_id AND moderation_status = 'approved'
    ))
    AND
    (to_note_id IS NULL OR EXISTS (
      SELECT 1 FROM atomic_notes WHERE id = to_note_id AND moderation_status = 'approved'
    ))
    AND
    -- Link involves approved questions
    (from_question_id IS NULL OR EXISTS (
      SELECT 1 FROM questions WHERE id = from_question_id AND moderation_status = 'approved'
    ))
    AND
    (to_question_id IS NULL OR EXISTS (
      SELECT 1 FROM questions WHERE id = to_question_id AND moderation_status = 'approved'
    ))
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN links.from_question_id IS 'Source question for question-to-atom or question-to-question links';
COMMENT ON COLUMN links.to_question_id IS 'Target question for question-to-question links';
