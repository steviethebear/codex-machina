-- v0.6.0 Full Schema (Clean Installation)
-- This migration sets up the entire database schema from scratch.

-- 1. SETUP & EXTENSIONS
SET search_path = public, extensions;

-- CLEAN SLATE (User Request: "No users. No notes. No sources. Nothing.")
DROP TABLE IF EXISTS 
    public.user_achievements,
    public.achievements,
    public.notifications,
    public.note_tags,
    public.reflections,
    public.thread_notes,
    public.threads,
    public.unlocks,
    public.actions,
    public.points,
    public.comments,
    public.connections,
    public.notes,
    public.units,
    public.texts,
    public.characters,
    public.users
CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA public;

-- 2. ENUMS & TYPES
DO $$ BEGIN
    CREATE TYPE note_type AS ENUM ('fleeting', 'permanent', 'source');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- USERS (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  email text UNIQUE NOT NULL,
  codex_name text,
  is_admin boolean DEFAULT false,
  section text, -- Added in v0.6 user_details
  teacher text, -- Added in v0.6 user_details
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CHARACTERS
CREATE TABLE IF NOT EXISTS public.characters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  level int DEFAULT 1,
  xp_total int DEFAULT 0,
  sp_reading int DEFAULT 0,
  sp_thinking int DEFAULT 0,
  sp_writing int DEFAULT 0,
  sp_engagement int DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TEXTS (Sources)
CREATE TABLE IF NOT EXISTS public.texts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  author text NOT NULL,
  type text NOT NULL, -- book, article, film, etc
  url text, -- Added in v0.6
  description text, -- Added in v0.6 source_details
  archived boolean DEFAULT false,
  
  -- Student Sources fields
  status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by uuid REFERENCES public.users(id),
  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamptz,
  rejection_note text,
  
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- UNITS
CREATE TABLE IF NOT EXISTS public.units (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reflection_prompt text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- NOTES
CREATE TABLE IF NOT EXISTS public.notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    content text NOT NULL,
    type note_type NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    
    -- Metadata
    citation text,
    page_number text,
    tags text[] DEFAULT '{}'::text[], -- Added in v0.6 tags.sql
    
    -- Embedding
    embedding vector(1536),
    
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- CONNECTIONS
CREATE TABLE IF NOT EXISTS public.connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    source_note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    target_note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    context text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT unique_connection UNIQUE (source_note_id, target_note_id)
);

-- COMMENTS
CREATE TABLE IF NOT EXISTS public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    highlighted_text text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- POINTS
CREATE TABLE IF NOT EXISTS public.points (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount integer NOT NULL,
    reason text NOT NULL,
    source_id uuid,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- ACTIONS
CREATE TABLE IF NOT EXISTS public.actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  type text NOT NULL,
  xp int DEFAULT 0,
  sp_reading int DEFAULT 0,
  sp_thinking int DEFAULT 0,
  sp_writing int DEFAULT 0,
  sp_engagement int DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- UNLOCKS
CREATE TABLE IF NOT EXISTS public.unlocks (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    feature text NOT NULL,
    unlocked_at timestamptz DEFAULT now(),
    check_metadata jsonb DEFAULT '{}'::jsonb,
    PRIMARY KEY (user_id, feature)
);

-- THREADS
CREATE TABLE IF NOT EXISTS public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- THREAD NOTES
CREATE TABLE IF NOT EXISTS public.thread_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  group_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, note_id)
);

-- REFLECTIONS
CREATE TABLE IF NOT EXISTS public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.users(id), -- Nullable initially
  context TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- NOTE TAGS (Social Tags)
CREATE TABLE IF NOT EXISTS public.note_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    tag TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(note_id, user_id, tag)
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('mention', 'achievement', 'citation', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    key text UNIQUE NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    xp_reward integer DEFAULT 0 NOT NULL,
    icon text,
    tier integer DEFAULT 1 NOT NULL,
    requirement_type text NOT NULL,
    requirement_value integer,
    requirement_metadata jsonb DEFAULT '{}'::jsonb,
    rewards jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at timestamptz DEFAULT now() NOT NULL,
    progress integer DEFAULT 0,
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);


-- 4. VIEW & INDEXES
CREATE VIEW public.hub_stats AS
SELECT 
  target_note_id as note_id,
  count(*) as incoming_links_count
FROM public.connections
GROUP BY target_note_id;

CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag);
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_texts_status ON texts(status);

-- 5. RLS POLICIES

-- Enable RLS everywhere
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Characters
CREATE POLICY "Characters viewable by everyone" ON characters FOR SELECT USING (true);

-- Texts (Sources)
CREATE POLICY "Admins can view all sources" ON texts FOR SELECT USING (exists (select 1 from users where id = auth.uid() and is_admin = true));
CREATE POLICY "Admins can update sources" ON texts FOR UPDATE USING (exists (select 1 from users where id = auth.uid() and is_admin = true));
CREATE POLICY "Admins can delete sources" ON texts FOR DELETE USING (exists (select 1 from users where id = auth.uid() and is_admin = true));
CREATE POLICY "Students can view approved sources" ON texts FOR SELECT USING (status = 'approved' OR created_by = auth.uid());
CREATE POLICY "Students can create sources" ON texts FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Units
CREATE POLICY "Units viewable by everyone" ON units FOR SELECT USING (true);

-- Notes
CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public notes" ON notes FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

-- Connections
CREATE POLICY "Users can view connections" ON connections FOR SELECT USING (true);
CREATE POLICY "Users can insert connections" ON connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON connections FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "everyone can read comments on visible notes" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Points/Actions
CREATE POLICY "Users can view all points" ON points FOR SELECT USING (true);
CREATE POLICY "Users can insert own points" ON points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Actions viewable by owner and admin" ON actions FOR SELECT USING (auth.uid() = user_id or exists (select 1 from users where id = auth.uid() and is_admin = true));

-- Unlocks
CREATE POLICY "Users can view their own unlocks" ON unlocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage unlocks" ON unlocks USING (exists (select 1 from users where id = auth.uid() and is_admin = true));

-- Threads
CREATE POLICY "Users can manage own threads" ON threads USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all threads" ON threads FOR SELECT USING (exists (select 1 from users where id = auth.uid() and is_admin = true));

-- Thread Notes
CREATE POLICY "Users can manage own thread notes" ON thread_notes USING (exists (select 1 from threads where threads.id = thread_notes.thread_id and threads.user_id = auth.uid()));
CREATE POLICY "Admins can view all thread notes" ON thread_notes FOR SELECT USING (exists (select 1 from users where id = auth.uid() and is_admin = true));

-- Reflections
CREATE POLICY "Admins can manage all reflections" ON reflections USING (exists (select 1 from users where id = auth.uid() and is_admin = true));
CREATE POLICY "Students can view own reflections" ON reflections FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can update own reflections" ON reflections FOR UPDATE USING (student_id = auth.uid());

-- Note Tags (Social)
CREATE POLICY "Anyone can read tags" ON note_tags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add tags" ON note_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own tags" ON note_tags FOR DELETE USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Achievements
CREATE POLICY "achievements_visible_to_all" ON achievements FOR SELECT USING (true);
CREATE POLICY "user_achievements_visible_to_all" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "users_can_insert_own_achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 6. FUNCTIONS & TRIGGERS

-- Handle New User Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, codex_name)
  VALUES (NEW.id, NEW.email, 'Student ' || substr(NEW.id::text, 1, 4))
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.characters (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Get User Tags RPC
CREATE OR REPLACE FUNCTION get_user_tags(p_user_id UUID)
RETURNS TABLE (tag TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT t.tag, COUNT(*) as count
    FROM note_tags t
    WHERE t.user_id = p_user_id
    GROUP BY t.tag
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Global Tag Trends RPC
CREATE OR REPLACE FUNCTION get_global_tag_trends()
RETURNS TABLE (tag TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT t.tag, COUNT(*) as count
    FROM note_tags t
    GROUP BY t.tag
    ORDER BY count DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. REALTIME PUBLICATIONS
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
ALTER PUBLICATION supabase_realtime ADD TABLE connections;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE points;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;
