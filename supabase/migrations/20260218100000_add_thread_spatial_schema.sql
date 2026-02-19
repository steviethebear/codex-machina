-- Add spatial coordinates to thread_notes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'thread_notes' AND column_name = 'x'
    ) THEN
        ALTER TABLE thread_notes ADD COLUMN x float DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'thread_notes' AND column_name = 'y'
    ) THEN
        ALTER TABLE thread_notes ADD COLUMN y float DEFAULT 0;
    END IF;
END $$;

-- Create thread_connections table for edges
CREATE TABLE IF NOT EXISTS thread_connections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id uuid REFERENCES threads(id) ON DELETE CASCADE NOT NULL,
    source_note_id uuid REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
    target_note_id uuid REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
    label text,
    created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_thread_connections_thread_id ON thread_connections(thread_id);
