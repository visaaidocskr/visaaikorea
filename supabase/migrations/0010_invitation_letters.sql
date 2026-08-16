-- ===========================================================================
-- 0010_invitation_letters.sql
--
-- Two changes to the C-3-1 invitation flow, both from real practice:
--
-- 1. submission_date — the day the relative hands the papers in at the
--    Korean mission. It drives the visit window: C-3-1 decisions take about
--    24 days on average, so the visit cannot sensibly start until ~30 days
--    after submission. Without capturing it we were letting clients pick a
--    visit date the visa could not possibly arrive in time for.
--
-- 2. Three separate letter texts instead of one. Each of the three documents
--    we produce carries a different argument, so the client writes three
--    answers rather than one that we reuse three times:
--      · reason_invitation — for 초청장: who they are and why you invite them
--      · reason_statement  — for 초청 사유서: their circumstances and ties home
--      · reason_guarantee  — for 신원보증서: what you undertake to cover
--
-- The old single `invitation_reason` column is kept (not dropped) so any
-- draft already saved against it is not silently lost; it is no longer
-- written to.
--
-- Idempotent / safe to re-run.
-- ===========================================================================

alter table public.invitations
  add column if not exists submission_date date,
  add column if not exists reason_invitation text,
  add column if not exists reason_statement text,
  add column if not exists reason_guarantee text;

notify pgrst, 'reload schema';
