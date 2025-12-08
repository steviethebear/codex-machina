-- Drop existing tables for major refactor
-- Users will be preserved, but all robust data will be wiped as per spec.

DROP TABLE IF EXISTS "public"."questions" CASCADE;
DROP TABLE IF EXISTS "public"."answers" CASCADE; -- If exists
DROP TABLE IF EXISTS "public"."signals" CASCADE;
DROP TABLE IF EXISTS "public"."achievements" CASCADE;
DROP TABLE IF EXISTS "public"."user_achievements" CASCADE;
DROP TABLE IF EXISTS "public"."bonus_rewards" CASCADE;
DROP TABLE IF EXISTS "public"."user_bonus_rewards" CASCADE;
DROP TABLE IF EXISTS "public"."atomic_notes" CASCADE;
DROP TABLE IF EXISTS "public"."links" CASCADE;

-- Also cleaning up any functions/triggers related to these if necessary
-- For now, dropping tables CASCADE should handle most dependencies like FKs.
