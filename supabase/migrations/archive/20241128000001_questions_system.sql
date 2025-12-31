-- Codex Machina v0.4 Migration: Questions System
-- Created: 2025-11-28
-- Description: Creates questions table for student inquiry nodes

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- QUESTIONS TABLE
-- ============================================================================
-- Stores student questions (inquiry nodes)
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  character_id UUID REFERENCES characters(id) NOT NULL,
  
  -- Content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Context
  text_id UUID REFERENCES texts(id),
  unit_id UUID REFERENCES units(id),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Status
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  accepted_atom_id UUID REFERENCES atomic_notes(id),
  
  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  upvote_count INTEGER DEFAULT 0,
  
  -- Moderation
  moderation_status TEXT DEFAULT 'approved',
  -- 'pending' | 'approved' | 'rejected'
  moderation_result TEXT,
  flagged_by UUID REFERENCES auth.users(id),
  flagged_at TIMESTAMPTZ,
  
  -- Graph integration (embeddings for similarity search)
  embedding VECTOR(1536)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_questions_author ON questions(author_id);
CREATE INDEX IF NOT EXISTS idx_questions_text ON questions(text_id);
CREATE INDEX IF NOT EXISTS idx_questions_unit ON questions(unit_id);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(moderation_status);
CREATE INDEX IF NOT EXISTS idx_questions_resolved ON questions(is_resolved);
CREATE INDEX IF NOT EXISTS idx_questions_created ON questions(created_at DESC);

-- Vector similarity search index (IVFFlat)
CREATE INDEX IF NOT EXISTS idx_questions_embedding 
  ON questions 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Students can view approved questions or their own questions
CREATE POLICY "Students can view approved questions"
  ON questions FOR SELECT
  USING (
    moderation_status = 'approved' 
    OR author_id = auth.uid()
  );

-- Students can create questions
CREATE POLICY "Students can create questions"
  ON questions FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Students can update their own questions (before approval)
CREATE POLICY "Students can update own questions"
  ON questions FOR UPDATE
  USING (
    auth.uid() = author_id 
    AND moderation_status = 'pending'
  );

-- Students can delete their own pending questions
CREATE POLICY "Students can delete own pending questions"
  ON questions FOR DELETE
  USING (
    auth.uid() = author_id 
    AND moderation_status = 'pending'
  );

-- Admins can manage all questions
CREATE POLICY "Admins can manage all questions"
  ON questions FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_questions_updated_at();

-- Increment view count function (called from application)
CREATE OR REPLACE FUNCTION increment_question_views(question_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE questions 
  SET view_count = view_count + 1 
  WHERE id = question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Search similar questions by embedding
CREATE OR REPLACE FUNCTION search_similar_questions(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  body TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.title,
    q.body,
    1 - (q.embedding <=> query_embedding) AS similarity
  FROM questions q
  WHERE 
    q.moderation_status = 'approved'
    AND 1 - (q.embedding <=> query_embedding) > match_threshold
  ORDER BY q.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE questions IS 'Student inquiry nodes that appear on the graph';
COMMENT ON COLUMN questions.embedding IS 'Vector embedding for semantic similarity search';
COMMENT ON COLUMN questions.accepted_atom_id IS 'The atom (reply) marked as accepted answer';
COMMENT ON COLUMN questions.moderation_status IS 'Approval status of the question';
