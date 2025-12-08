-- Comprehensive Seed Data for Codex Machina v0.5

-- =====================================
-- TEXTS (Books, Articles, Films) - KEPT FROM v0.4
-- =====================================
INSERT INTO public.texts (title, author, type) VALUES
-- Philosophy & Theory
('The Structure of Scientific Revolutions', 'Thomas Kuhn', 'book'),
('Simulacra and Simulation', 'Jean Baudrillard', 'book'),
('Being and Time', 'Martin Heidegger', 'book'),
('The Society of the Spectacle', 'Guy Debord', 'book'),
('Discipline and Punish', 'Michel Foucault', 'book'),
('The Sublime Object of Ideology', 'Slavoj Žižek', 'book'),

-- Additional from previous seed...
('Neuromancer', 'William Gibson', 'book'),
('Snow Crash', 'Neal Stephenson', 'book'),
('Do Androids Dream of Electric Sheep?', 'Philip K. Dick', 'book'),
('The Left Hand of Darkness', 'Ursula K. Le Guin', 'book'),
('1984', 'George Orwell', 'book'),
('Brave New World', 'Aldous Huxley', 'book'),
('Blade Runner 2049', 'Denis Villeneuve', 'film'),
('The Matrix', 'The Wachowskis', 'film'),
('The Question Concerning Technology', 'Martin Heidegger', 'article'),
('A Cyborg Manifesto', 'Donna Haraway', 'article')
ON CONFLICT DO NOTHING;

-- =====================================
-- UNITS (Course Sections) - KEPT FROM v0.4
-- =====================================
INSERT INTO public.units (title, start_date, end_date, reflection_prompt) VALUES
('Unit 1: Foundations of Reality', '2025-01-01', '2025-01-31', 'How do our tools shape our understanding of truth?'),
('Unit 2: Simulacra and Simulation', '2025-02-01', '2025-02-28', 'What happens when the copy becomes more real than the original?'),
('Unit 3: Technology and Being', '2025-03-01', '2025-03-31', 'In what ways does technology reveal or conceal our fundamental nature?'),
('Unit 4: Cyberpunk Futures', '2025-04-01', '2025-04-30', 'How do cyberpunk narratives critique contemporary capitalism?'),
('Unit 5: Artificial Intelligence & Consciousness', '2025-05-01', '2025-05-31', 'Can machines think?'),
('Unit 6: Dystopian Societies', '2025-06-01', '2025-06-30', 'What do dystopian narratives reveal about our present anxieties?')
ON CONFLICT DO NOTHING;

-- =====================================
-- NOTES: SAMPLE DATA v0.5
-- =====================================
/*
-- INSTRUCTIONS:
-- 1. Create test users in Supabase Auth.
-- 2. Replace UUIDs below.
-- 3. Uncomment and run.

DO $$
DECLARE
    u1 uuid := 'REPLACE_WITH_USER_ID_1';
    u2 uuid := 'REPLACE_WITH_USER_ID_2';
    
    n1_id uuid;
    n2_id uuid;
    n3_id uuid;
    n4_id uuid;
BEGIN
    -- 1. Create Fleeting Notes (Private)
    INSERT INTO public.notes (user_id, title, content, type, is_public) VALUES
    (u1, 'Thought on Kuhn due to lecture', 'If paradigms shift suddenly, does that mean truth is relative? Or just our view of it?', 'fleeting', false) RETURNING id INTO n1_id;
    
    INSERT INTO public.notes (user_id, title, content, type, is_public) VALUES
    (u1, 'Simulation in social media', 'Instagram filters are small simulacra. We prefer the filter to the face.', 'fleeting', false);

    -- 2. Create Literature Notes (Public)
    INSERT INTO public.notes (user_id, title, content, type, is_public, citation, page_number) VALUES
    (u1, 'Kuhn on Paradigm Shifts', 'Kuhn argues that science doesn''t progress linearly. Instead, it builds up anomalies until the old model breaks and a new "paradigm" takes over.', 'literature', true, 'The Structure of Scientific Revolutions', 'pg. 52') RETURNING id INTO n2_id;
    
    INSERT INTO public.notes (user_id, title, content, type, is_public, citation, page_number) VALUES
    (u2, 'Baudrillard''s Map vs Territory', 'The simulation is no longer a map of the territory. It is a map that generates the territory. The real is gone.', 'literature', true, 'Simulacra and Simulation', 'pg. 1') RETURNING id INTO n3_id;

    -- 3. Create Permanent Notes (Public, Synthesized)
    INSERT INTO public.notes (user_id, title, content, type, is_public) VALUES
    (u2, 'The Death of the Real', 'We have lost contact with reality because our symbols (maps, screens, data) have become more important to us than the things they represent. This connects Kuhn''s idea of paradigms—we are trapped in a paradigm of symbols.', 'permanent', true) RETURNING id INTO n4_id;

    -- 4. Create Connections
    INSERT INTO public.connections (source_note_id, target_note_id, user_id, explanation) VALUES
    (n3_id, n4_id, u2, 'This permanent note synthesizes the idea from the literature note about the map and territory.');
    
    INSERT INTO public.connections (source_note_id, target_note_id, user_id, explanation) VALUES
    (n2_id, n4_id, u2, 'Kuhn''s paradigms explain why we accept the simulation—it is our current scientific paradigm.');

    -- 5. Create Points
    INSERT INTO public.points (user_id, amount, reason, source_id) VALUES
    (u1, 1, 'created_fleeting_note', n1_id),
    (u1, 2, 'created_lit_note_quality', n2_id),
    (u2, 4, 'created_perm_note_quality', n4_id);

END $$;
*/
