-- 2024-11-23-0015_admin_view_hidden_notes.sql

-- Allow admins to view ALL atomic_notes, including hidden ones
-- This ensures that rejected (hidden) atoms are visible in the admin queue
CREATE POLICY "Admins can view all notes"
ON public.atomic_notes
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
          AND users.is_admin = true
    )
);
