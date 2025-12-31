-- Enable RLS on notes (idempotent)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists to avoid errors on retry
DROP POLICY IF EXISTS "Admins can do everything with notes" ON notes;

-- Create the policy
CREATE POLICY "Admins can do everything with notes"
ON notes
FOR ALL
TO authenticated
USING (
  (SELECT is_admin FROM users WHERE id = auth.uid())
)
WITH CHECK (
  (SELECT is_admin FROM users WHERE id = auth.uid())
);
