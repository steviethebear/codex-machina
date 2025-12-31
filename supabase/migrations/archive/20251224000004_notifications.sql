-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('mention', 'achievement', 'citation', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- URL to navigate to
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark read)"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Only system/server functions should insert notifications usually, 
-- but we might allow users to insert 'mention' notifications via triggers or server actions.
-- For now, let's allow inserts if the user is authenticated (e.g. via server action using service role, or if we want client-side Trigger).
-- Actually, inserting normally happens via Server Actions which can bypass RLS if using Service Role, 
-- or we can allow authenticated users to insert notifications FOR OTHERS? No, that's risky (spam).
-- Best practice: Insert using Service Role in Server Actions. RLS for INSERT can be blocked for public.

-- Create index for faster queries
CREATE INDEX notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX notifications_read_idx ON public.notifications(read);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
