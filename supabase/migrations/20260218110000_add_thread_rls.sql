
-- Enable RLS
ALTER TABLE thread_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_connections ENABLE ROW LEVEL SECURITY;

-- Policies for thread_notes
CREATE POLICY "Users can view notes in threads they own"
    ON thread_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM threads 
            WHERE threads.id = thread_notes.thread_id 
            AND threads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert notes into threads they own"
    ON thread_notes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM threads 
            WHERE threads.id = thread_notes.thread_id 
            AND threads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update notes in threads they own"
    ON thread_notes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM threads 
            WHERE threads.id = thread_notes.thread_id 
            AND threads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete notes from threads they own"
    ON thread_notes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM threads 
            WHERE threads.id = thread_notes.thread_id 
            AND threads.user_id = auth.uid()
        )
    );

-- Policies for thread_connections
CREATE POLICY "Users can view connections in threads they own"
    ON thread_connections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM threads 
            WHERE threads.id = thread_connections.thread_id 
            AND threads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert connections into threads they own"
    ON thread_connections FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM threads 
            WHERE threads.id = thread_connections.thread_id 
            AND threads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update connections in threads they own"
    ON thread_connections FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM threads 
            WHERE threads.id = thread_connections.thread_id 
            AND threads.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete connections from threads they own"
    ON thread_connections FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM threads 
            WHERE threads.id = thread_connections.thread_id 
            AND threads.user_id = auth.uid()
        )
    );
