-- Reflections System Migration
-- v0.6.0 Phase 3

CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id),
  context TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {role, content, timestamp}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_reflections_student_id ON reflections(student_id);
CREATE INDEX IF NOT EXISTS idx_reflections_status ON reflections(status);
CREATE INDEX IF NOT EXISTS idx_reflections_teacher_id ON reflections(teacher_id);

-- Enable RLS
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- 1. Admins (Teachers) can view, create, update, and delete all reflections
DROP POLICY IF EXISTS "Admins can manage all reflections" ON reflections;
CREATE POLICY "Admins can manage all reflections"
  ON reflections
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- 2. Students can view their own reflections
DROP POLICY IF EXISTS "Students can view own reflections" ON reflections;
CREATE POLICY "Students can view own reflections"
  ON reflections FOR SELECT
  USING (student_id = auth.uid());

-- 3. Students can update their own reflections (specifically for adding messages)
DROP POLICY IF EXISTS "Students can update own reflections" ON reflections;
CREATE POLICY "Students can update own reflections"
  ON reflections FOR UPDATE
  USING (student_id = auth.uid());
