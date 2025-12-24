-- Add RLS to public.users table (v0.5.3 Fix)
-- Allows users to read their own 'is_admin' status

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile" ON "public"."users"
    FOR SELECT USING (auth.uid() = id);

-- 2. Public profiles are visible (for social features)
-- Everyone can read codex_name, but maybe not sensitive info?
-- For now, we select everything.
CREATE POLICY "Users can view public profiles" ON "public"."users"
    FOR SELECT USING (true);

-- 3. Users can update their own profile
CREATE POLICY "Users can update own profile" ON "public"."users"
    FOR UPDATE USING (auth.uid() = id);
