-- Sanitize existing data first
UPDATE texts 
SET type = 'other' 
WHERE type NOT IN ('book', 'article', 'video', 'paper', 'other');

-- Add description to texts
ALTER TABLE texts ADD COLUMN IF NOT EXISTS description TEXT;

-- Update type check constraint to include 'other'
ALTER TABLE texts DROP CONSTRAINT IF EXISTS texts_type_check;

ALTER TABLE texts 
    ADD CONSTRAINT texts_type_check 
    CHECK (type IN ('book', 'article', 'video', 'paper', 'other'));
