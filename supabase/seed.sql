-- Comprehensive Seed Data for Codex Machina

-- =====================================
-- TEXTS (Books, Articles, Films)
-- =====================================
INSERT INTO public.texts (title, author, type) VALUES
-- Philosophy & Theory
('The Structure of Scientific Revolutions', 'Thomas Kuhn', 'book'),
('Simulacra and Simulation', 'Jean Baudrillard', 'book'),
('Being and Time', 'Martin Heidegger', 'book'),
('The Society of the Spectacle', 'Guy Debord', 'book'),
('Discipline and Punish', 'Michel Foucault', 'book'),
('The Sublime Object of Ideology', 'Slavoj Žižek', 'book'),

-- Science Fiction Literature
('Neuromancer', 'William Gibson', 'book'),
('Snow Crash', 'Neal Stephenson', 'book'),
('Do Androids Dream of Electric Sheep?', 'Philip K. Dick', 'book'),
('The Left Hand of Darkness', 'Ursula K. Le Guin', 'book'),
('Foundation', 'Isaac Asimov', 'book'),
('Dune', 'Frank Herbert', 'book'),

-- Dystopian Classics
('1984', 'George Orwell', 'book'),
('Brave New World', 'Aldous Huxley', 'book'),
('Fahrenheit 451', 'Ray Bradbury', 'book'),
('The Handmaid''s Tale', 'Margaret Atwood', 'book'),

-- Films
('Blade Runner 2049', 'Denis Villeneuve', 'film'),
('The Matrix', 'The Wachowskis', 'film'),
('Ghost in the Shell', 'Mamoru Oshii', 'film'),
('Ex Machina', 'Alex Garland', 'film'),
('Her', 'Spike Jonze', 'film'),
('2001: A Space Odyssey', 'Stanley Kubrick', 'film'),
('Arrival', 'Denis Villeneuve', 'film'),

-- Articles & Essays
('The Question Concerning Technology', 'Martin Heidegger', 'article'),
('A Cyborg Manifesto', 'Donna Haraway', 'article'),
('The Work of Art in the Age of Mechanical Reproduction', 'Walter Benjamin', 'article');

-- =====================================
-- UNITS (Course Sections)
-- =====================================
INSERT INTO public.units (title, start_date, end_date, reflection_prompt) VALUES
('Unit 1: Foundations of Reality', '2025-01-01', '2025-01-31', 'How do our tools shape our understanding of truth? Consider the role of paradigms in scientific knowledge.'),
('Unit 2: Simulacra and Simulation', '2025-02-01', '2025-02-28', 'What happens when the copy becomes more real than the original? Explore the relationship between representation and reality.'),
('Unit 3: Technology and Being', '2025-03-01', '2025-03-31', 'In what ways does technology reveal or conceal our fundamental nature? Reflect on Heidegger''s concept of "enframing."'),
('Unit 4: Cyberpunk Futures', '2025-04-01', '2025-04-30', 'How do cyberpunk narratives critique contemporary capitalism? What alternatives do they imagine?'),
('Unit 5: Artificial Intelligence & Consciousness', '2025-05-01', '2025-05-31', 'Can machines think? What would it mean for AI to be conscious, and how would we know?'),
('Unit 6: Dystopian Societies', '2025-06-01', '2025-06-30', 'What do dystopian narratives reveal about our present anxieties? How do they function as warnings or prophecies?');

-- =====================================
-- NOTES: Optional - requires real user IDs
-- =====================================
-- To add sample notes, you need to:
-- 1. Create 2-3 test users via the signup page
-- 2. Get their user IDs from the Supabase Dashboard > Authentication > Users
-- 3. Replace 'YOUR_USER_ID_1', 'YOUR_USER_ID_2' below with actual UUIDs
-- 4. Uncomment and run this section

/*
-- Get the character IDs for your users
DO $$
DECLARE
    user1_id uuid := 'YOUR_USER_ID_1'; -- Replace with actual user ID
    user2_id uuid := 'YOUR_USER_ID_2'; -- Replace with actual user ID
    char1_id uuid;
    char2_id uuid;
    text_kuhn uuid;
    text_baudrillard uuid;
    text_blade uuid;
    text_matrix uuid;
    note1_id uuid;
    note2_id uuid;
    note3_id uuid;
    note4_id uuid;
BEGIN
    -- Get character IDs
    SELECT id INTO char1_id FROM public.characters WHERE user_id = user1_id;
    SELECT id INTO char2_id FROM public.characters WHERE user_id = user2_id;
    
    -- Get some text IDs
    SELECT id INTO text_kuhn FROM public.texts WHERE title = 'The Structure of Scientific Revolutions';
    SELECT id INTO text_baudrillard FROM public.texts WHERE title = 'Simulacra and Simulation';
    SELECT id INTO text_blade FROM public.texts WHERE title = 'Blade Runner 2049';
    SELECT id INTO text_matrix FROM public.texts WHERE title = 'The Matrix';

    -- Create sample notes
    INSERT INTO public.atomic_notes (author_id, character_id, text_id, title, body, type, tags)
    VALUES
        (user1_id, char1_id, text_kuhn, 'Paradigm Shifts in Science', 
         'Kuhn argues that scientific progress is not linear but occurs through revolutionary paradigm shifts. Normal science operates within a paradigm until anomalies accumulate.', 
         'idea', ARRAY['epistemology', 'science', 'revolution'])
    RETURNING id INTO note1_id;

    INSERT INTO public.atomic_notes (author_id, character_id, text_id, title, body, type, tags)
    VALUES
        (user1_id, char1_id, text_baudrillard, 'Hyperreality and the Desert of the Real', 
         'Baudrillard''s concept of the simulacrum: a copy without an original. Today, simulations precede and determine reality rather than representing it.', 
         'insight', ARRAY['simulation', 'postmodernism', 'reality'])
    RETURNING id INTO note2_id;

    INSERT INTO public.atomic_notes (author_id, character_id, text_id, title, body, type, tags)
    VALUES
        (user2_id, char2_id, text_blade, 'Are Replicant Memories Real?', 
         'If memories can be artificially created and feel identical to "real" ones, what distinguishes authentic experience from fabricated experience?', 
         'question', ARRAY['memory', 'identity', 'AI'])
    RETURNING id INTO note3_id;

    INSERT INTO public.atomic_notes (author_id, character_id, text_id, title, body, type, tags)
    VALUES
        (user2_id, char2_id, text_matrix, 'Red Pill / Blue Pill as Philosophical Choice', 
         'The choice between red and blue pills represents the fundamental philosophical choice between comfortable ignorance and uncomfortable truth.', 
         'insight', ARRAY['knowledge', 'choice', 'truth'])
    RETURNING id INTO note4_id;

    -- Create some links between notes
    INSERT INTO public.links (from_note_id, to_note_id, relation_type, explanation, created_by)
    VALUES
        (note2_id, note3_id, 'extends', 
         'Baudrillard''s hyperreality directly applies to the replicants in Blade Runner - their memories are simulacra without originals.',
         user1_id),
        (note4_id, note2_id, 'supports',
         'The Matrix''s simulation theme directly embodies Baudrillard''s concept of hyperreality.',
         user2_id);

    -- Award some points
    INSERT INTO public.actions (user_id, type, xp, sp_thinking, sp_reading, description)
    VALUES
        (user1_id, 'CREATE_NOTE', 0, 4, 2, 'Created 2 notes'),
        (user2_id, 'CREATE_NOTE', 0, 4, 2, 'Created 2 notes'),
        (user1_id, 'LINK_NOTE', 0, 0, 0, 'Created link between notes'),
        (user2_id, 'LINK_NOTE', 0, 0, 0, 'Created link between notes');

    -- Update character stats
    UPDATE public.characters 
    SET sp_thinking = sp_thinking + 4, sp_reading = sp_reading + 2
    WHERE user_id = user1_id;

    UPDATE public.characters 
    SET sp_thinking = sp_thinking + 4, sp_reading = sp_reading + 2
    WHERE user_id = user2_id;
END $$;
*/
