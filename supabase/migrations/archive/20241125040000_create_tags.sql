-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- lowercase normalized for lookups
    display_name TEXT NOT NULL, -- preserves original case for display
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    usage_count INTEGER NOT NULL DEFAULT 0
);

-- Create note_tags junction table
CREATE TABLE IF NOT EXISTS public.note_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES public.atomic_notes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    UNIQUE(note_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON public.tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON public.note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON public.note_tags(tag_id);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags table
-- Everyone can read tags
CREATE POLICY "Tags are viewable by everyone"
    ON public.tags FOR SELECT
    USING (true);

-- Authenticated users can create tags
CREATE POLICY "Authenticated users can create tags"
    ON public.tags FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update tags they created (mainly for usage_count)
CREATE POLICY "Users can update their own tags"
    ON public.tags FOR UPDATE
    USING (created_by = auth.uid());

-- RLS Policies for note_tags table
-- Everyone can read note_tags
CREATE POLICY "Note tags are viewable by everyone"
    ON public.note_tags FOR SELECT
    USING (true);

-- Note authors can add tags to their notes
CREATE POLICY "Note authors can add tags"
    ON public.note_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.atomic_notes
            WHERE id = note_id AND author_id = auth.uid()
        )
    );

-- Note authors can remove tags from their notes
CREATE POLICY "Note authors can remove tags"
    ON public.note_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.atomic_notes
            WHERE id = note_id AND author_id = auth.uid()
        )
    );

-- Function to increment usage_count when a tag is added to a note
CREATE OR REPLACE FUNCTION increment_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.tags
    SET usage_count = usage_count + 1
    WHERE id = NEW.tag_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement usage_count when a tag is removed from a note
CREATE OR REPLACE FUNCTION decrement_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.tags
    SET usage_count = usage_count - 1
    WHERE id = OLD.tag_id AND usage_count > 0;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to maintain usage_count
CREATE TRIGGER on_note_tag_created
    AFTER INSERT ON public.note_tags
    FOR EACH ROW
    EXECUTE FUNCTION increment_tag_usage();

CREATE TRIGGER on_note_tag_deleted
    AFTER DELETE ON public.note_tags
    FOR EACH ROW
    EXECUTE FUNCTION decrement_tag_usage();
