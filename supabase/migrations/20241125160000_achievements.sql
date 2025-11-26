-- Achievements/Badges System Migration
-- Adds support for milestone achievements and progress tracking

-- Create achievements table (master list of all possible achievements)
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    xp_reward INT DEFAULT 0,
    icon TEXT,
    tier INT DEFAULT 1,
    requirement_type TEXT NOT NULL,
    requirement_value INT,
    requirement_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements table (tracks user progress and unlocks)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    achievement_id UUID REFERENCES achievements(id) NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    progress INT DEFAULT 0,
    UNIQUE(user_id, achievement_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_key ON achievements(key);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_progress ON user_achievements(user_id, progress) WHERE unlocked_at IS NULL;

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (everyone can view)
CREATE POLICY "Achievements are viewable by everyone" ON achievements
    FOR SELECT USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user achievements" ON user_achievements
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
    );

-- Seed achievements data
INSERT INTO achievements (key, name, description, category, xp_reward, icon, tier, requirement_type, requirement_value, requirement_metadata) VALUES
    -- Contribution Milestones
    ('first_atom', 'First Steps', 'Create your first atom', 'contribution', 5, '🌱', 1, 'count', 1, '{"entity": "atoms"}'),
    ('contributor', 'Contributor', 'Create 10 atoms', 'contribution', 25, '✍️', 2, 'count', 10, '{"entity": "atoms"}'),
    ('prolific_writer', 'Prolific Writer', 'Create 50 atoms', 'contribution', 100, '📝', 3, 'count', 50, '{"entity": "atoms"}'),
    ('master_scribe', 'Master Scribe', 'Create 100 atoms', 'contribution', 250, '🏆', 4, 'count', 100, '{"entity": "atoms"}'),
    
    -- Connection Achievements
    ('connector', 'Connector', 'Create 5 links', 'connection', 15, '🔗', 1, 'count', 5, '{"entity": "links"}'),
    ('web_weaver', 'Web Weaver', 'Create 25 links', 'connection', 50, '🕸️', 2, 'count', 25, '{"entity": "links"}'),
    ('network_architect', 'Network Architect', 'Create 100 links', 'connection', 200, '🏗️', 3, 'count', 100, '{"entity": "links"}'),
    
    -- Text Engagement
    ('reader', 'Reader', 'Link to 3 different texts', 'text_engagement', 20, '📖', 1, 'unique_count', 3, '{"entity": "text_links"}'),
    ('scholar_texts', 'Scholar', 'Link to 10 different texts', 'text_engagement', 75, '📚', 2, 'unique_count', 10, '{"entity": "text_links"}'),
    
    -- Quality Achievements
    ('hub_creator', 'Hub Creator', 'Create your first hub', 'quality', 50, '⭐', 1, 'count', 1, '{"entity": "hubs"}'),
    ('hub_master', 'Hub Master', 'Create 5 hubs', 'quality', 150, '🌟', 2, 'count', 5, '{"entity": "hubs"}'),
    
    -- Consistency Achievements
    ('dedicated', 'Dedicated', 'Maintain a 7-day streak', 'consistency', 50, '🔥', 1, 'streak', 7, '{}'),
    ('committed', 'Committed', 'Maintain a 14-day streak', 'consistency', 100, '💪', 2, 'streak', 14, '{}'),
    ('unstoppable', 'Unstoppable', 'Maintain a 30-day streak', 'consistency', 250, '⚡', 3, 'streak', 30, '{}'),
    
    -- Reflection Achievements
    ('reflective', 'Reflective', 'Submit 3 unit reflections', 'reflection', 30, '💭', 1, 'count', 3, '{"entity": "reflections"}'),
    ('thoughtful', 'Thoughtful', 'Submit 10 unit reflections', 'reflection', 100, '🧠', 2, 'count', 10, '{"entity": "reflections"}')
ON CONFLICT (key) DO NOTHING;
