-- =====================================
-- SEED TEST USERS FOR DEVELOPMENT
-- =====================================
-- This creates fake users directly in auth.users and public.users
-- WARNING: Only use this for local testing/development!

-- Create test users in auth.users first
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
) VALUES
    (
        '00000000-0000-0000-0000-000000000001'::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'alice@test.com',
        crypt('password123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        'authenticated',
        'authenticated'
    ),
    (
        '00000000-0000-0000-0000-000000000002'::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'bob@test.com',
        crypt('password123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        'authenticated',
        'authenticated'
    ),
    (
        '00000000-0000-0000-0000-000000000003'::uuid,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'charlie@test.com',
        crypt('password123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        'authenticated',
        'authenticated'
    );

-- The trigger should automatically create public.users and characters
-- The handle_new_user() trigger from schema.sql creates these automatically

-- Note: If the trigger didn't run, manually insert users (characters are auto-created):
INSERT INTO public.users (id, email, codex_name, is_admin) VALUES
    ('00000000-0000-0000-0000-000000000001'::uuid, 'alice@test.com', 'Neon Oracle', false),
    ('00000000-0000-0000-0000-000000000002'::uuid, 'bob@test.com', 'Cyber Sage', false),
    ('00000000-0000-0000-0000-000000000003'::uuid, 'charlie@test.com', 'Grid Runner', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================
-- SEED SAMPLE NOTES FROM TEST USERS
-- =====================================

DO $$
DECLARE
    alice_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
    bob_id uuid := '00000000-0000-0000-0000-000000000002'::uuid;
    charlie_id uuid := '00000000-0000-0000-0000-000000000003'::uuid;
    char_alice uuid;
    char_bob uuid;
    char_charlie uuid;
    text_kuhn uuid;
    text_baudrillard uuid;
    text_blade uuid;
    text_matrix uuid;
    text_neuromancer uuid;
    note1_id uuid;
    note2_id uuid;
    note3_id uuid;
    note4_id uuid;
    note5_id uuid;
    note6_id uuid;
BEGIN
    -- Get character IDs
    SELECT id INTO char_alice FROM public.characters WHERE user_id = alice_id;
    SELECT id INTO char_bob FROM public.characters WHERE user_id = bob_id;
    SELECT id INTO char_charlie FROM public.characters WHERE user_id = charlie_id;
    
    -- Get text IDs
    SELECT id INTO text_kuhn FROM public.texts WHERE title = 'The Structure of Scientific Revolutions' LIMIT 1;
    SELECT id INTO text_baudrillard FROM public.texts WHERE title = 'Simulacra and Simulation' LIMIT 1;
    SELECT id INTO text_blade FROM public.texts WHERE title = 'Blade Runner 2049' LIMIT 1;
    SELECT id INTO text_matrix FROM public.texts WHERE title = 'The Matrix' LIMIT 1;
    SELECT id INTO text_neuromancer FROM public.texts WHERE title = 'Neuromancer' LIMIT 1;

    -- Alice's notes
    INSERT INTO public.atomic_notes (author_id, character_id, text_id, title, body, type, tags)
    VALUES
        (alice_id, char_alice, text_kuhn, 'Paradigm Shifts in Science', 
         'Kuhn argues that scientific progress is not linear but occurs through revolutionary paradigm shifts. Normal science operates within a paradigm until anomalies accumulate and force a revolution.', 
         'idea', ARRAY['epistemology', 'science', 'revolution'])
    RETURNING id INTO note1_id;

    INSERT INTO public.atomic_notes (author_id, character_id, text_id, title, body, type, tags)
    VALUES
        (alice_id, char_alice, text_baudrillard, 'Hyperreality and the Desert of the Real', 
         'Baudrillard''s concept of the simulacrum: a copy without an original. In hyperreality, simulations precede and determine reality rather than representing it.', 
         'insight', ARRAY['simulation', 'postmodernism', 'reality'])
    RETURNING id INTO note2_id;

    -- Bob's notes
    INSERT INTO public.atomic_notes (author_id, character_id, text_id, title, body, type, tags)
    VALUES
        (bob_id, char_bob, text_blade, 'Are Replicant Memories Real?', 
         'If memories can be artificially created and feel identical to "real" ones, what distinguishes authentic experience from fabricated experience? Does phenomenological identity equal ontological reality?', 
         'question', ARRAY['memory', 'identity', 'AI', 'phenomenology'])
    RETURNING id INTO note3_id;

    INSERT INTO public.atomic_notes (author_id, character_id, text_id, title, body, type, tags)
    VALUES
        (bob_id, char_bob, text_matrix, 'Red Pill as Philosophical Choice', 
         'The choice between red and blue pills represents the fundamental philosophical choice between comfortable ignorance and uncomfortable truth. Once you see the truth, you cannot unsee it.', 
         'insight', ARRAY['knowledge', 'choice', 'truth', 'enlightenment'])
    RETURNING id INTO note4_id;

    -- Charlie's notes
    INSERT INTO public.atomic_notes (author_id, character_id, text_id, title, body, type, tags)
    VALUES
        (charlie_id, char_charlie, text_neuromancer, 'Cyberspace as Consensual Hallucination', 
         'Gibson defines cyberspace as a "consensual hallucination" - reality constructed by collective agreement. How does this differ from our everyday social reality?', 
         'question', ARRAY['cyberspace', 'reality', 'consensus'])
    RETURNING id INTO note5_id;

    INSERT INTO public.atomic_notes (author_id, character_id, text_id, title, body, type, tags)
    VALUES
        (charlie_id, char_charlie, text_baudrillard, 'The Copy Without Original', 
         'In postmodern capitalism, we consume signs rather than goods. The brand becomes more real than the product. The map precedes the territory.', 
         'idea', ARRAY['capitalism', 'semiotics', 'simulation'])
    RETURNING id INTO note6_id;

    -- Create links between notes
    INSERT INTO public.links (from_note_id, to_note_id, relation_type, explanation, created_by)
    VALUES
        (note2_id, note3_id, 'extends', 
         'Baudrillard''s hyperreality directly applies to the replicants in Blade Runner - their memories are simulacra without originals.',
         alice_id),
        (note4_id, note2_id, 'supports',
         'The Matrix''s simulation theme directly embodies Baudrillard''s concept of hyperreality.',
         bob_id),
        (note5_id, note2_id, 'questions',
         'Does Gibson''s "consensual hallucination" differ from Baudrillard''s hyperreality, or are they describing the same phenomenon?',
         charlie_id),
        (note6_id, note2_id, 'extends',
         'Both explore how simulacra replace reality in late capitalism.',
         charlie_id),
        (note3_id, note4_id, 'contrasts',
         'While the Matrix explores collective delusion, Blade Runner focuses on individual ontological questions.',
         bob_id);

    RAISE NOTICE 'Successfully created % notes and % links', 6, 5;
END $$;
