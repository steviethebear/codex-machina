-- Bonus Rewards System Migration
-- Adds support for special bonuses: Trailblazer, Scholar, Bridge Builder, Streaks, Combos

-- Create streaks table to track daily contribution streaks
CREATE TABLE IF NOT EXISTS streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_contribution_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bonus_rewards table to log all bonus awards
CREATE TABLE IF NOT EXISTS bonus_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    bonus_type TEXT NOT NULL, -- 'trailblazer', 'scholar', 'bridge_builder', 'streak', 'combo'
    trigger_id UUID, -- ID of atom/link that triggered the bonus
    xp_awarded INT DEFAULT 0,
    sp_awarded JSONB DEFAULT '{}', -- {reading: 10, thinking: 5, etc}
    metadata JSONB DEFAULT '{}', -- Additional context (streak count, combo length, citations, etc)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add bonus_type column to actions table to track bonus-related actions
ALTER TABLE actions ADD COLUMN IF NOT EXISTS bonus_type TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_bonus_rewards_user ON bonus_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_bonus_rewards_type ON bonus_rewards(bonus_type);
CREATE INDEX IF NOT EXISTS idx_bonus_rewards_created ON bonus_rewards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_actions_bonus_type ON actions(bonus_type) WHERE bonus_type IS NOT NULL;

-- Enable RLS
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for streaks
CREATE POLICY "Users can view own streak" ON streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all streaks" ON streaks
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- RLS Policies for bonus_rewards
CREATE POLICY "Users can view own bonuses" ON bonus_rewards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bonuses" ON bonus_rewards
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- Function to update streak updated_at timestamp
CREATE OR REPLACE FUNCTION update_streak_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_streak_timestamp
    BEFORE UPDATE ON streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_streak_timestamp();
