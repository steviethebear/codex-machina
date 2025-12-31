-- Migration: Add Character Titles and System Notes
-- Date: 2024-11-23

-- Add title field to characters table
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add system note fields to atomic_notes table
ALTER TABLE atomic_notes
ADD COLUMN IF NOT EXISTS is_system_note BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS discoverable_by UUID REFERENCES users(id);

-- Create index for faster system note queries
CREATE INDEX IF NOT EXISTS idx_atomic_notes_system_notes 
ON atomic_notes(is_system_note) 
WHERE is_system_note = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN characters.title IS 'Special title earned based on activity patterns (e.g., "The Question-Weaver")';
COMMENT ON COLUMN atomic_notes.is_system_note IS 'True if this is a teacher-created system note that appears as a discoverable artifact';
COMMENT ON COLUMN atomic_notes.discoverable_by IS 'Optional user ID - if set, only this user can see the system note. If null, all users can see it';
