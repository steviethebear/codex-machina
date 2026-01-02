-- Student-Created Sources Migration
-- v0.6.0: Allow students to propose new sources with teacher approval

-- Modify texts table to support student creation and approval workflow
ALTER TABLE texts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE texts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE texts ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE texts ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE texts ADD COLUMN IF NOT EXISTS rejection_note TEXT;

-- Add constraint for status values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'texts_status_check'
  ) THEN
    ALTER TABLE texts ADD CONSTRAINT texts_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Create index for pending sources review queue
CREATE INDEX IF NOT EXISTS idx_texts_status ON texts(status);
CREATE INDEX IF NOT EXISTS idx_texts_created_by ON texts(created_by);

-- Update RLS policies

-- Students can view approved sources OR their own pending/rejected sources
DROP POLICY IF EXISTS "Students can view approved sources" ON texts;
CREATE POLICY "Students can view approved sources"
  ON texts FOR SELECT
  USING (
    status = 'approved'
    OR created_by = auth.uid()
  );

-- Students can create sources (defaults to pending)
DROP POLICY IF EXISTS "Students can create sources" ON texts;
CREATE POLICY "Students can create sources"
  ON texts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND status = 'pending'
  );

-- Admins can view all sources
DROP POLICY IF EXISTS "Admins can view all sources" ON texts;
CREATE POLICY "Admins can view all sources"
  ON texts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Admins can update any source (for approval/rejection)
DROP POLICY IF EXISTS "Admins can update sources" ON texts;
CREATE POLICY "Admins can update sources"
  ON texts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Admins can delete any source
DROP POLICY IF EXISTS "Admins can delete sources" ON texts;
CREATE POLICY "Admins can delete sources"
  ON texts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Backfill existing sources as approved and admin-created
UPDATE texts
SET status = 'approved', created_by = (
  SELECT id FROM users WHERE is_admin = true LIMIT 1
)
WHERE status IS NULL OR created_by IS NULL;
