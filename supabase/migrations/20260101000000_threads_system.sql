-- Threads System Migration
-- v0.6.0: Weaving space for arranging permanent notes

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Threads table: Main weaving space container
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thread Notes junction: Links notes to threads with position and grouping
CREATE TABLE thread_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  group_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, note_id)
);

-- Create indexes for performance
CREATE INDEX idx_threads_user_id ON threads(user_id);
CREATE INDEX idx_thread_notes_thread_id ON thread_notes(thread_id);
CREATE INDEX idx_thread_notes_note_id ON thread_notes(note_id);
CREATE INDEX idx_thread_notes_position ON thread_notes(thread_id, position);

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_notes ENABLE ROW LEVEL SECURITY;

-- Threads Policies

-- Students can view their own threads
CREATE POLICY "Students can view own threads"
  ON threads FOR SELECT
  USING (auth.uid() = user_id);

-- Students can create their own threads
CREATE POLICY "Students can create own threads"
  ON threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Students can update their own threads
CREATE POLICY "Students can update own threads"
  ON threads FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Students can delete their own threads
CREATE POLICY "Students can delete own threads"
  ON threads FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all threads
CREATE POLICY "Admins can view all threads"
  ON threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Thread Notes Policies

-- Students can view thread_notes for their own threads
CREATE POLICY "Students can view own thread_notes"
  ON thread_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = thread_notes.thread_id
      AND threads.user_id = auth.uid()
    )
  );

-- Students can add notes to their own threads
CREATE POLICY "Students can add notes to own threads"
  ON thread_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = thread_notes.thread_id
      AND threads.user_id = auth.uid()
    )
  );

-- Students can update notes in their own threads
CREATE POLICY "Students can update own thread_notes"
  ON thread_notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = thread_notes.thread_id
      AND threads.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = thread_notes.thread_id
      AND threads.user_id = auth.uid()
    )
  );

-- Students can delete notes from their own threads
CREATE POLICY "Students can delete own thread_notes"
  ON thread_notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM threads
      WHERE threads.id = thread_notes.thread_id
      AND threads.user_id = auth.uid()
    )
  );

-- Admins can view all thread_notes
CREATE POLICY "Admins can view all thread_notes"
  ON thread_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_threads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for threads updated_at
CREATE TRIGGER threads_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW
  EXECUTE FUNCTION update_threads_updated_at();
