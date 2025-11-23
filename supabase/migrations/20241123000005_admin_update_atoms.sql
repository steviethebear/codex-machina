-- Allow admins to update atomic_notes for moderation
-- This enables the moderation queue to approve/reject atoms

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can update atomic_notes" ON public.atomic_notes;

-- Create policy allowing admins to update any atomic note
CREATE POLICY "Admins can update atomic_notes"
ON public.atomic_notes
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.is_admin = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.is_admin = true
    )
);
