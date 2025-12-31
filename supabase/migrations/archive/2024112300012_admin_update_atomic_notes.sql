-- 2024-11-23-0012_admin_update_atomic_notes.sql
-- Drop any lingering UPDATE policies on atomic_notes
DROP POLICY IF EXISTS "Admins can update atomic_notes" ON public.atomic_notes;
DROP POLICY IF EXISTS "Users can update own notes or admins" ON public.atomic_notes;

-- Create a single policy that allows admins to update any row (any column)
CREATE POLICY "Admins can update any atomic_notes"
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
