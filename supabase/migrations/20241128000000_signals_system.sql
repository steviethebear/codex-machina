-- Codex Machina v0.4 Migration: Signals System
-- Created: 2025-11-28
-- Description: Creates signals and user_signals tables for gamified learning challenges

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SIGNALS TABLE
-- ============================================================================
-- Stores signal definitions (challenges/quests)
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Rewards
  xp_reward INTEGER DEFAULT 0,
  sp_reading INTEGER DEFAULT 0,
  sp_thinking INTEGER DEFAULT 0,
  sp_writing INTEGER DEFAULT 0,
  sp_engagement INTEGER DEFAULT 0,
  
  -- Discovery
  discovery_type TEXT DEFAULT 'admin_release',
  -- 'graph_exploration' | 'hub_formation' | 'bridge_builder' | 'admin_release'
  discovery_criteria JSONB DEFAULT '{}'::jsonb,
  
  -- Availability
  unit_id UUID REFERENCES units(id),
  unlock_level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  
  -- Validation
  validation_type TEXT DEFAULT 'llm',
  -- 'llm' | 'teacher' | 'auto'
  validation_prompt TEXT,
  
  -- Metadata
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_time_minutes INTEGER,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Oracle messaging
  oracle_discovery_message TEXT,
  oracle_completion_message TEXT
);

-- Indexes for signals
CREATE INDEX IF NOT EXISTS idx_signals_active ON signals(is_active);
CREATE INDEX IF NOT EXISTS idx_signals_unit ON signals(unit_id);
CREATE INDEX IF NOT EXISTS idx_signals_difficulty ON signals(difficulty);

-- ============================================================================
-- USER_SIGNALS TABLE
-- ============================================================================
-- Tracks individual student progress on signals
CREATE TABLE IF NOT EXISTS user_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE NOT NULL,
  
  -- State machine
  status TEXT NOT NULL DEFAULT 'hidden',
  -- 'hidden' | 'available' | 'in_progress' | 'queued_for_review' | 'completed'
  
  -- Timestamps
  discovered_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Submission
  submission_data JSONB,
  submission_notes TEXT,
  
  -- Validation
  validation_result JSONB,
  validation_feedback TEXT,
  validated_by UUID REFERENCES auth.users(id),
  
  -- Queue metadata (for rate-limit handling)
  queued_at TIMESTAMPTZ,
  queue_reason TEXT,
  -- 'rate_limit' | 'llm_error' | 'manual_review'
  estimated_review_time INTERVAL,
  
  -- Rewards (cached from signal at completion)
  xp_awarded INTEGER,
  sp_awarded JSONB,
  
  UNIQUE(user_id, signal_id)
);

-- Indexes for user_signals
CREATE INDEX IF NOT EXISTS idx_user_signals_user ON user_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_signals_signal ON user_signals(signal_id);
CREATE INDEX IF NOT EXISTS idx_user_signals_status ON user_signals(status);
CREATE INDEX IF NOT EXISTS idx_user_signals_queued ON user_signals(queued_at) WHERE status = 'queued_for_review';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_signals ENABLE ROW LEVEL SECURITY;

-- Signals policies
-- Students can view active signals
CREATE POLICY "Students can view active signals"
  ON signals FOR SELECT
  USING (is_active = true);

-- Admins can manage all signals
CREATE POLICY "Admins can manage signals"
  ON signals FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- User_signals policies
-- Users can view and update their own signal progress
CREATE POLICY "Users manage own signals"
  ON user_signals FOR ALL
  USING (auth.uid() = user_id);

-- Admins can view all user signals (for verification)
CREATE POLICY "Admins can view all user signals"
  ON user_signals FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Admins can update user signals (for manual verification)
CREATE POLICY "Admins can verify user signals"
  ON user_signals FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on signals
CREATE OR REPLACE FUNCTION update_signals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER signals_updated_at
  BEFORE UPDATE ON signals
  FOR EACH ROW
  EXECUTE FUNCTION update_signals_updated_at();

-- Update updated_at timestamp on user_signals
CREATE OR REPLACE FUNCTION update_user_signals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_signals_updated_at
  BEFORE UPDATE ON user_signals
  FOR EACH ROW
  EXECUTE FUNCTION update_user_signals_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE signals IS 'Gamified learning challenges that students can discover and complete';
COMMENT ON TABLE user_signals IS 'Tracks individual student progress on signals';
COMMENT ON COLUMN signals.discovery_type IS 'How students discover this signal';
COMMENT ON COLUMN signals.validation_type IS 'How submissions are validated';
COMMENT ON COLUMN user_signals.status IS 'Current state in the signal lifecycle';
COMMENT ON COLUMN user_signals.queue_reason IS 'Why submission is queued (if applicable)';
