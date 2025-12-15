-- Drop existing tables for major refactor v0.5
-- Using CASCADE to ensure dependent objects (triggers, RLS policies, etc.) are also removed.

DROP TABLE IF EXISTS "public"."questions" CASCADE;
DROP TABLE IF EXISTS "public"."answers" CASCADE;
DROP TABLE IF EXISTS "public"."signals" CASCADE;
DROP TABLE IF EXISTS "public"."achievements" CASCADE;
DROP TABLE IF EXISTS "public"."user_achievements" CASCADE;
DROP TABLE IF EXISTS "public"."bonus_rewards" CASCADE;
DROP TABLE IF EXISTS "public"."user_bonus_rewards" CASCADE;
DROP TABLE IF EXISTS "public"."tags" CASCADE;
DROP TABLE IF EXISTS "public"."note_tags" CASCADE;
DROP TABLE IF EXISTS "public"."reflections" CASCADE;
DROP TABLE IF EXISTS "public"."outlines" CASCADE;

-- Drop Core Data Tables (Old & New if re-running)
DROP TABLE IF EXISTS "public"."atomic_notes" CASCADE;
DROP TABLE IF EXISTS "public"."notes" CASCADE;
DROP TABLE IF EXISTS "public"."links" CASCADE;
DROP TABLE IF EXISTS "public"."connections" CASCADE;
DROP TABLE IF EXISTS "public"."comments" CASCADE;
DROP TABLE IF EXISTS "public"."points" CASCADE;

-- Drop Enums if necessary (CASCADE on columns usually handles it from table drops, but types might persist)
DROP TYPE IF EXISTS "public"."note_type" CASCADE;
DROP TYPE IF EXISTS "public"."signal_type" CASCADE;
DROP TYPE IF EXISTS "public"."question_status" CASCADE;
