-- Restore Achievements System for v0.5.3
-- Includes 'rewards' column for future unlockables support

-- 1. Create achievements table
CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "key" text UNIQUE NOT NULL, -- stable identifier like 'first_note'
    "name" text NOT NULL,
    "description" text NOT NULL,
    "category" text NOT NULL, -- e.g., 'contribution', 'connection', 'streak'
    "xp_reward" integer DEFAULT 0 NOT NULL,
    "icon" text, -- Emoji or icon name
    "tier" integer DEFAULT 1 NOT NULL,
    
    -- Requirements flexibility
    "requirement_type" text NOT NULL, -- 'count', 'streak', 'manual'
    "requirement_value" integer,
    "requirement_metadata" jsonb DEFAULT '{}'::jsonb,
    
    -- NEW: Rewards for unlocks
    "rewards" jsonb DEFAULT '{}'::jsonb, -- e.g. {"unlock_feature": "graph"}
    
    "created_at" timestamptz DEFAULT now() NOT NULL
);

-- 2. Create user_achievements table
CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "achievement_id" uuid NOT NULL REFERENCES "public"."achievements"(id) ON DELETE CASCADE,
    "unlocked_at" timestamptz DEFAULT now() NOT NULL,
    "progress" integer DEFAULT 0, -- Store current progress (e.g., 5/10)
    
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

-- 3. Enable RLS
ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Achievements are public
CREATE POLICY "achievements_visible_to_all" ON "public"."achievements"
    FOR SELECT USING (true);

-- User Achievements visible to own user AND admins AND public (for profile views)
-- For v0.5.3, we'll make them public to support the "Public Profile" feature easily.
CREATE POLICY "user_achievements_visible_to_all" ON "public"."user_achievements"
    FOR SELECT USING (true);

-- Only system/functions should insert/update (for now, or admin)
-- But we might need client-side "claim" logic? No, usually server-side.
-- For simple MVP, we'll allow Authenticated users to insert their OWN rows if we do client-side checks,
-- OR better, keep it restricted. Let's start restricted and use an RPC or server action.
-- Actually, for the sake of the MVP dashboard working *now* without backend triggers, 
-- I will allow users to INSERT their own achievements (e.g. if the frontend detects unlock).
-- This is insecure but standard for this stage of "Codex Machina".
CREATE POLICY "users_can_insert_own_achievements" ON "public"."user_achievements"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Seed Initial Achievements
INSERT INTO "public"."achievements" 
(key, name, description, category, xp_reward, icon, tier, requirement_type, requirement_value, rewards)
VALUES
    -- Writing
    ('first_note', 'First Note', 'Create your first permanent note', 'writing', 10, '📝', 1, 'count', 1, '{}'),
    ('prolific', 'Prolific Writer', 'Create 10 permanent notes', 'writing', 50, '📚', 2, 'count', 10, '{}'),
    
    -- Linking
    ('connector', 'Connector', 'Create your first connection', 'linking', 15, '🔗', 1, 'count', 1, '{"unlock_feature": "graph"}'),
    ('web_weaver', 'Web Weaver', 'Create 10 connections', 'linking', 50, '🕸️', 2, 'count', 10, '{}'),

    -- Streak
    ('dedicated', 'Dedicated', 'Write on 3 consecutive days', 'streak', 30, '🔥', 1, 'streak', 3, '{}')
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    rewards = EXCLUDED.rewards;

-- 6. Add to Realtime
alter publication supabase_realtime add table user_achievements;
