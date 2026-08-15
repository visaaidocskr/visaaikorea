-- ===========================================================================
-- 0008_trip_reason.sql
-- Free-text "why did you choose this destination?" answer, in the
-- applicant's own words (capped at 150 words client-side). Generic across
-- every destination — used to write a fuller, more personal Travel Purpose
-- Statement (see lib/docs/generators.ts) instead of the single fixed
-- "purpose" enum/string alone. Applicant-answered only, never auto-filled —
-- same "never fabricate" rule as background_answers.
-- Additive only. Safe to re-run.
-- ===========================================================================

alter table public.applications
  add column if not exists trip_reason text;
