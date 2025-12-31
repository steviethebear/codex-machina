-- Secure Function to fetch notes for Admins (Bypasses RLS)
CREATE OR REPLACE FUNCTION get_admin_notes(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Check if the executing user is an Admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND is_admin = true
  ) THEN
    -- Return empty array or error if not admin
    RETURN '[]'::json;
  END IF;

  -- 2. Return notes with user details joined, matching the frontend shape
  RETURN (
    SELECT coalesce(json_agg(t), '[]'::json)
    FROM (
      SELECT 
        n.*,
        json_build_object('codex_name', u.codex_name, 'email', u.email) as "user"
      FROM notes n
      JOIN users u ON n.user_id = u.id
      WHERE n.user_id = target_user_id
      ORDER BY n.updated_at DESC
    ) t
  );
END;
$$;
