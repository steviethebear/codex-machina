-- 2024-11-23-0014_fix_moderation_rpc.sql

-- 1. Clean up RLS policies to avoid confusion (optional but good practice)
DROP POLICY IF EXISTS "Admins can update notes" ON public.atomic_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.atomic_notes;
DROP POLICY IF EXISTS "Admins can update atomic_notes" ON public.atomic_notes;
DROP POLICY IF EXISTS "Users can update own notes or admins" ON public.atomic_notes;
DROP POLICY IF EXISTS "Admins can update any atomic_notes" ON public.atomic_notes;
DROP POLICY IF EXISTS "Atomic notes update (owner or admin)" ON public.atomic_notes;

-- Re-create the standard policy for normal updates
CREATE POLICY "Atomic notes update (owner or admin)"
ON public.atomic_notes
FOR UPDATE
TO authenticated
USING (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
)
WITH CHECK (
    auth.uid() = author_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
);

-- 2. Create RPC function to bypass RLS for moderation actions
CREATE OR REPLACE FUNCTION moderate_atom(
  target_atom_id uuid,
  new_status moderation_status,
  should_hide boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin status
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin only.';
  END IF;

  -- Perform the update
  UPDATE public.atomic_notes
  SET 
    moderation_status = new_status,
    hidden = should_hide
  WHERE id = target_atom_id;
END;
$$;
