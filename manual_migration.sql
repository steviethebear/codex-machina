-- MANUAL MIGRATION TO FIX LOGIN AND DASHBOARD
-- Run this in the Supabase Dashboard > SQL Editor

-- 1. Eanble pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Restore Achievements System (v0.5.3)
CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "key" text UNIQUE NOT NULL,
    "name" text NOT NULL,
    "description" text NOT NULL,
    "category" text NOT NULL,
    "xp_reward" integer DEFAULT 0 NOT NULL,
    "icon" text,
    "tier" integer DEFAULT 1 NOT NULL,
    "requirement_type" text NOT NULL,
    "requirement_value" integer,
    "requirement_metadata" jsonb DEFAULT '{}'::jsonb,
    "rewards" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "achievement_id" uuid NOT NULL REFERENCES "public"."achievements"(id) ON DELETE CASCADE,
    "unlocked_at" timestamptz DEFAULT now() NOT NULL,
    "progress" integer DEFAULT 0,
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'achievements' AND policyname = 'achievements_visible_to_all') THEN
        CREATE POLICY "achievements_visible_to_all" ON "public"."achievements" FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_achievements' AND policyname = 'user_achievements_visible_to_all') THEN
        CREATE POLICY "user_achievements_visible_to_all" ON "public"."user_achievements" FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_achievements' AND policyname = 'users_can_insert_own_achievements') THEN
        CREATE POLICY "users_can_insert_own_achievements" ON "public"."user_achievements" FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

INSERT INTO "public"."achievements" 
(key, name, description, category, xp_reward, icon, tier, requirement_type, requirement_value, rewards)
VALUES
    ('first_note', 'First Note', 'Create your first permanent note', 'writing', 10, '📝', 1, 'count', 1, '{}'),
    ('prolific', 'Prolific Writer', 'Create 10 permanent notes', 'writing', 50, '📚', 2, 'count', 10, '{}'),
    ('connector', 'Connector', 'Create your first connection', 'linking', 15, '🔗', 1, 'count', 1, '{"unlock_feature": "graph"}'),
    ('web_weaver', 'Web Weaver', 'Create 10 connections', 'linking', 50, '🕸️', 2, 'count', 10, '{}'),
    ('dedicated', 'Dedicated', 'Write on 3 consecutive days', 'streak', 30, '🔥', 1, 'streak', 3, '{}')
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    rewards = EXCLUDED.rewards;

-- 3. Seed Student User 'student@test.com' / 'abc123'
DO $$
DECLARE
    target_email text := 'student@test.com';
    user_id uuid;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;
    
    IF user_id IS NULL THEN
        user_id := gen_random_uuid();
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES ('00000000-0000-0000-0000-000000000000', user_id, 'authenticated', 'authenticated', target_email, crypt('abc123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"codex_name": "Student A"}', now(), now());
    END IF;

    INSERT INTO public.users (id, email, codex_name, is_admin)
    VALUES (user_id, target_email, 'Student A', false)
    ON CONFLICT (id) DO UPDATE SET codex_name = 'Student A';
    
    INSERT INTO public.notes (user_id, title, content, type, is_public)
    VALUES (user_id, 'Welcome to Codex Machina', 'This is your first permanent note.', 'permanent', false)
    ON CONFLICT DO NOTHING;
END $$;

alter publication supabase_realtime add table user_achievements;
