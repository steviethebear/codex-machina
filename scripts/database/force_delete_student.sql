-- FORCE DELETE SCRIPT
-- Safely deletes a user by removing public profile dependencies first

DO $$
DECLARE
    target_email text := 'student@test.com';
    target_id uuid;
BEGIN
    SELECT id INTO target_id FROM auth.users WHERE email = target_email;

    IF target_id IS NOT NULL THEN
        -- 1. Delete from public.users (and cascade to notes, etc if configured)
        -- Since public.users is likely manually managed or has dependencies not cascading correctly from auth.users delete
        DELETE FROM public.users WHERE id = target_id;
        
        -- 2. Delete from auth.users
        DELETE FROM auth.users WHERE id = target_id;
    END IF;
END $$;
