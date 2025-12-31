-- Fix foreign key relationship for questions table to allow joining with public.users
-- Currently author_id references auth.users, but we need it to reference public.users for PostgREST joins

-- Drop the existing foreign key constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_author_id_fkey;

-- Add the new foreign key constraint referencing public.users
ALTER TABLE questions
  ADD CONSTRAINT questions_author_id_fkey
  FOREIGN KEY (author_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Also fix flagged_by to reference public.users instead of auth.users
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_flagged_by_fkey;

ALTER TABLE questions
  ADD CONSTRAINT questions_flagged_by_fkey
  FOREIGN KEY (flagged_by)
  REFERENCES public.users(id)
  ON DELETE SET NULL;
