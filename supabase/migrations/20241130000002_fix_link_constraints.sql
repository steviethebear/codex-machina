-- Fix link constraints to allow linking to questions
-- The original link_target_check constraint from initial_schema.sql prevents linking to questions
-- because it requires either to_note_id or to_text_id to be set.

-- Drop the restrictive constraint
ALTER TABLE links DROP CONSTRAINT IF EXISTS link_target_check;

-- Ensure links_source_check is robust (it was added in 20241128000002 but let's make sure)
-- It should enforce that at least one source and at least one target is present
-- We'll drop and recreate it to be safe and consistent

ALTER TABLE links DROP CONSTRAINT IF EXISTS links_source_check;

ALTER TABLE links ADD CONSTRAINT links_check 
  CHECK (
    -- Source check: Must come from a note or a question
    (from_note_id IS NOT NULL OR from_question_id IS NOT NULL) AND
    -- Target check: Must go to a note, text, or question
    (to_note_id IS NOT NULL OR to_text_id IS NOT NULL OR to_question_id IS NOT NULL)
  );
