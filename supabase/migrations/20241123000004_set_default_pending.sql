-- Change default moderation_status from 'approved' to 'pending'
-- This ensures new atoms don't award XP/SP until AI approves them

ALTER TABLE public.atomic_notes 
  ALTER COLUMN moderation_status SET DEFAULT 'pending';

-- Update any existing 'approved' atoms that were auto-approved
-- (Keep them approved since they were created under old system)
