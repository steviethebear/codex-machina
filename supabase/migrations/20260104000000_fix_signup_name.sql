-- Update handle_new_user to use codex_name from metadata if provided
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    meta_name text;
BEGIN
    -- Try to get 'codex_name' from user metadata
    meta_name := NEW.raw_user_meta_data->>'codex_name';

    -- Fallback if null
    IF meta_name IS NULL OR meta_name = '' THEN
        meta_name := 'Student ' || substr(NEW.id::text, 1, 4);
    END IF;

    INSERT INTO public.users (id, email, codex_name)
    VALUES (NEW.id, NEW.email, meta_name)
    ON CONFLICT (id) DO UPDATE SET
        codex_name = EXCLUDED.codex_name,
        email = EXCLUDED.email;
  
    INSERT INTO public.characters (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
