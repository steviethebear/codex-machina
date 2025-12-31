-- Migration: Add Quality Flags to Atomic Notes
-- Date: 2024-11-23

-- Add quality flag fields
ALTER TABLE atomic_notes
ADD COLUMN IF NOT EXISTS quality_flag TEXT CHECK (quality_flag IN ('exemplary', 'interesting', 'needs_revision')),
ADD COLUMN IF NOT EXISTS flag_visible_to_students BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP;

-- Create index for faster quality flag queries
CREATE INDEX IF NOT EXISTS idx_quality_flags 
ON atomic_notes(quality_flag) 
WHERE quality_flag IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN atomic_notes.quality_flag IS 'Quality level set by admin: exemplary, interesting, or needs_revision';
COMMENT ON COLUMN atomic_notes.flag_visible_to_students IS 'Whether the quality flag badge is visible to students';
COMMENT ON COLUMN atomic_notes.flagged_by IS 'Admin user who set the quality flag';
COMMENT ON COLUMN atomic_notes.flagged_at IS 'Timestamp when quality flag was set';
