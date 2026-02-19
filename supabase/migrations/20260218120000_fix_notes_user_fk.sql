
-- Update notes.user_id to reference public.users instead of auth.users
-- This allows PostgREST to detect the relationship for joins

BEGIN;

-- Drop existing constraint (name might vary, so we try standard and if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notes_user_id_fkey'
    ) THEN
        ALTER TABLE notes DROP CONSTRAINT notes_user_id_fkey;
    END IF;
END $$;

-- Add new constraint
ALTER TABLE notes
ADD CONSTRAINT notes_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.users(id)
ON DELETE CASCADE;

COMMIT;
