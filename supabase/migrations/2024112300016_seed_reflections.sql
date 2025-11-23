-- 2024-11-23-0016_seed_reflections.sql

-- 1. Ensure there is a Unit
INSERT INTO public.units (title, start_date, end_date, reflection_prompt)
SELECT 'Unit 1: The Beginning', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '7 days', 'Reflect on your first week.'
WHERE NOT EXISTS (SELECT 1 FROM public.units WHERE title = 'Unit 1: The Beginning');

-- 2. Insert a reflection for a user (any user found in the DB)
INSERT INTO public.reflections (user_id, unit_id, body)
SELECT 
    users.id,
    units.id,
    'This is a test reflection. I learned a lot about atoms and how to connect them. The system seems robust.'
FROM public.users
CROSS JOIN public.units
WHERE units.title = 'Unit 1: The Beginning'
LIMIT 1;
