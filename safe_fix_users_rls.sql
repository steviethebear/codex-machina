-- Safe RLS Fix for Users Table
-- Only adds policies if they are missing

DO $$
BEGIN
    -- 1. View Own Profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON "public"."users"
            FOR SELECT USING (auth.uid() = id);
    END IF;

    -- 2. View Public Profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can view public profiles'
    ) THEN
        CREATE POLICY "Users can view public profiles" ON "public"."users"
            FOR SELECT USING (true);
    END IF;

    -- 3. Update Own Profile (Just in case it was missing, though error said it exists)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON "public"."users"
            FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;
