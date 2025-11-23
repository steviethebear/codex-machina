-- Add moderation fields to atomic_notes

-- Create moderation status enum
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'flagged', 'rejected');

-- Add moderation columns
ALTER TABLE public.atomic_notes 
  ADD COLUMN moderation_status moderation_status DEFAULT 'approved',
  ADD COLUMN moderation_result text,
  ADD COLUMN moderation_checked_at timestamp with time zone;

-- Create index for admin queries
CREATE INDEX idx_atomic_notes_moderation_status ON public.atomic_notes(moderation_status);

-- Update existing notes to approved status
UPDATE public.atomic_notes SET moderation_status = 'approved' WHERE moderation_status IS NULL;
