-- v0.5 Zettelkasten Schema

-- NOTES TABLE
CREATE TYPE note_type AS ENUM ('fleeting', 'permanent', 'source');

CREATE TABLE "public"."notes" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "title" text NOT NULL,
    "content" text NOT NULL, -- The main body
    "type" note_type NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    
    -- Literature Note specifics MERGED into Source/Fleeting
    "citation" text, -- MLA formatted citation (for Source notes)
    "page_number" text,
    
    -- Permanent Note specifics
    -- response_to_id REMOVED per v0.5 spec
    
    -- Embedding for semantic search (pgvector)
    "embedding" vector(1536), 
    
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Users can view their own notes.
CREATE POLICY "Users can view own notes" ON "public"."notes"
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Users can view PUBLIC notes from others.
CREATE POLICY "Users can view public notes" ON "public"."notes"
    FOR SELECT USING (is_public = true);

-- 3. Users can insert their own notes.
CREATE POLICY "Users can insert own notes" ON "public"."notes"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Users can update their own notes.
CREATE POLICY "Users can update own notes" ON "public"."notes"
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. Users can delete their own notes.
CREATE POLICY "Users can delete own notes" ON "public"."notes"
    FOR DELETE USING (auth.uid() = user_id);


-- CONNECTIONS TABLE (The Graph Edges)
CREATE TABLE "public"."connections" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "source_note_id" uuid NOT NULL REFERENCES "public"."notes"(id) ON DELETE CASCADE,
    "target_note_id" uuid NOT NULL REFERENCES "public"."notes"(id) ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Who created the connection
    "context" text NOT NULL, -- Required 1-2 sentence context (was explanation)
    "created_at" timestamptz DEFAULT now() NOT NULL,
    
    CONSTRAINT unique_connection UNIQUE (source_note_id, target_note_id)
);

ALTER TABLE "public"."connections" ENABLE ROW LEVEL SECURITY;

-- Connection Policies
-- Visible if you can see BOTH notes. 
-- For v0.5 MVP: Public connections are visible to all if the underlying notes are public/ours.
CREATE POLICY "Users can view connections" ON "public"."connections"
    FOR SELECT USING (true); -- Application layer will filter dangling edges if notes aren't loaded

CREATE POLICY "Users can insert connections" ON "public"."connections"
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can delete own connections" ON "public"."connections"
    FOR DELETE USING (auth.uid() = user_id);


-- COMMENTS (Margin Comments)
CREATE TABLE "public"."comments" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "note_id" uuid NOT NULL REFERENCES "public"."notes"(id) ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "content" text NOT NULL,
    "highlighted_text" text, -- The text being commented on (optional anchor)
    "created_at" timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone can read comments on visible notes" ON "public"."comments"
    FOR SELECT USING (true); -- Simplification for MVP

CREATE POLICY "Users can insert comments" ON "public"."comments"
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- POINTS System
CREATE TABLE "public"."points" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "amount" integer NOT NULL,
    "reason" text NOT NULL, -- e.g. "created_fleeting_note", "connection_quality_bonus"
    "source_id" uuid, -- ID of the note/connection/comment that earned this
    "created_at" timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE "public"."points" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all points" ON "public"."points"
    FOR SELECT USING (true); -- For Leaderboard

CREATE POLICY "Users can insert own points" ON "public"."points"
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- OUTLINES REMOVED

-- Realtime subscriptions
alter publication supabase_realtime add table notes;
alter publication supabase_realtime add table connections;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table points;

-- =====================================
-- ADMIN TEST USER
-- =====================================
-- Create an admin test user for development/testing purposes
-- Email: admin@test.com | Password: abc123
-- Uses Supabase's bcrypt format for password hashing

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@test.com',
    crypt('abc123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- Add to public.users table with admin flag
INSERT INTO public.users (id, email, codex_name, is_admin)
SELECT id, email, 'Admin', true
FROM auth.users
WHERE email = 'admin@test.com'
ON CONFLICT (id) DO UPDATE SET is_admin = true;

