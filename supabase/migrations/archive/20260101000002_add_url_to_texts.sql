-- Add URL column to texts table
-- Post-TypeScript reconciliation fix: Sources need canonical URL field

ALTER TABLE texts ADD COLUMN IF NOT EXISTS url TEXT;

-- Create index for URL lookups
CREATE INDEX IF NOT EXISTS idx_texts_url ON texts(url) WHERE url IS NOT NULL;

-- Update RLS policies are already in place from previous migration
-- No additional RLS changes needed
