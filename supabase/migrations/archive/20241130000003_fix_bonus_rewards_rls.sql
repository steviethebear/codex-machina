-- Fix RLS policies for XP awarding system
-- awardXp action inserts into bonus_rewards and actions, and updates characters
-- All these tables need policies to allow the user to perform these operations

-- 1. bonus_rewards: Allow users to insert their own bonuses
DROP POLICY IF EXISTS "Users can insert own bonuses" ON bonus_rewards;
CREATE POLICY "Users can insert own bonuses" ON bonus_rewards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can insert bonuses" ON bonus_rewards;
CREATE POLICY "Admins can insert bonuses" ON bonus_rewards
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- 2. actions: Allow users to insert their own actions (logs)
DROP POLICY IF EXISTS "Users can insert own actions" ON actions;
CREATE POLICY "Users can insert own actions" ON actions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. characters: Allow users to update their own character stats
-- Note: In a stricter system, this would be done via SECURITY DEFINER function to prevent cheating.
-- For now, we allow it to enable the application logic.
DROP POLICY IF EXISTS "Users can update own character" ON characters;
CREATE POLICY "Users can update own character" ON characters
    FOR UPDATE USING (auth.uid() = user_id);
