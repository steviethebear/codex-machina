-- Add 'draft' to moderation_status enum for atomic_notes
-- This enables the Draft/Submit workflow where notes start as drafts

-- Step 1: Add the new value to the enum
ALTER TYPE moderation_status ADD VALUE IF NOT EXISTS 'draft';

-- Step 2: Update existing notes to have 'approved' if they don't have a status
-- (This ensures backward compatibility)
UPDATE atomic_notes 
SET moderation_status = 'approved' 
WHERE moderation_status IS NULL;

-- Note: The enum now supports: 'draft', 'pending', 'approved', 'rejected'
-- New notes should be created with 'draft' status by default
