-- Backfill Points for Existing Achievements
-- If a user has an achievement in user_achievements but no corresponding entry in points, add it.

DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT ua.user_id, ua.achievement_id, a.xp_reward, a.name
        FROM public.user_achievements ua
        JOIN public.achievements a ON a.id = ua.achievement_id
        LEFT JOIN public.points p ON p.source_id = ua.achievement_id AND p.user_id = ua.user_id
        WHERE p.id IS NULL -- Only where points are missing
    LOOP
        INSERT INTO public.points (user_id, amount, reason, source_id, created_at)
        VALUES (
            rec.user_id,
            rec.xp_reward,
            'achievement_unlocked', -- Standard reason
            rec.achievement_id,
            now()
        );
        RAISE NOTICE 'Awarded missing points for achievement: % (User: %)', rec.name, rec.user_id;
    END LOOP;
END $$;
