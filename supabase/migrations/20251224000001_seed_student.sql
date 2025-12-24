-- Seed Student User for Testing
-- Email: student@test.com
-- Password: abc123

DO $$
DECLARE
    -- Generate a potentially new ID, but we'll prioritize looking up existing one
    target_email text := 'student@test.com';
    user_id uuid;
BEGIN
    -- 1. Get or Create auth user
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;
    
    IF user_id IS NULL THEN
        user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            user_id,
            'authenticated',
            'authenticated',
            target_email,
            crypt('abc123', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"codex_name": "Student A"}',
            now(),
            now()
        );
    END IF;

    -- 2. Ensure public user exists
    INSERT INTO public.users (id, email, codex_name, is_admin)
    VALUES (user_id, target_email, 'Student A', false)
    ON CONFLICT (id) DO UPDATE SET
        codex_name = 'Student A',
        is_admin = false;

    -- 3. Seed some initial data for this student
    -- Welcome Note
    INSERT INTO public.notes (user_id, title, content, type, is_public)
    VALUES (user_id, 'Welcome to Codex Machina', 'This is your first permanent note. Use it to start your journey.', 'permanent', false)
    ON CONFLICT DO NOTHING;

    -- "First Steps" Achievement (if it exists)
    -- We need to find the achievement ID for 'first_note'
    -- INSERT INTO public.user_achievements (user_id, achievement_id, unlocked_at)
    -- SELECT user_id, id, now()
    -- FROM public.achievements WHERE key = 'first_note'
    -- ON CONFLICT DO NOTHING;

END $$;
