-- Enable RLS on users if not already (it should be)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists to avoid errors
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create policy
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  (SELECT is_admin FROM users WHERE id = auth.uid())
);
