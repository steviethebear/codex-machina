-- Add teacher and class_section columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS teacher text,
ADD COLUMN IF NOT EXISTS class_section text;

-- Update handle_new_user to use metadata for teacher and section
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    meta_name text;
    meta_teacher text;
    meta_section text;
BEGIN
    -- Get metadata
    meta_name := NEW.raw_user_meta_data->>'codex_name';
    meta_teacher := NEW.raw_user_meta_data->>'teacher';
    meta_section := NEW.raw_user_meta_data->>'section';

    -- Fallback for name
    IF meta_name IS NULL OR meta_name = '' THEN
        meta_name := 'Student ' || substr(NEW.id::text, 1, 4);
    END IF;

    INSERT INTO public.users (id, email, codex_name, teacher, class_section)
    VALUES (NEW.id, NEW.email, meta_name, meta_teacher, meta_section)
    ON CONFLICT (id) DO UPDATE SET
        codex_name = EXCLUDED.codex_name,
        email = EXCLUDED.email,
        teacher = EXCLUDED.teacher,
        class_section = EXCLUDED.class_section;
  
    INSERT INTO public.characters (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
