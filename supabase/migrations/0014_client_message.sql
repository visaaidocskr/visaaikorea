-- ===========================================================================
-- 0014_client_message.sql
-- A message from the team TO the client, shown on their application page.
--
-- Why this is separate from admin_notes: admin_notes is admin-only by RLS
-- (its own UI calls it "internal note"), so anything written there is
-- invisible to the client by design. That left no way to tell an applicant
-- WHAT was wrong when their status was set to "Missing documents" — they saw
-- an amber badge and nothing else. This column is the client-facing channel.
--
-- Kept on `applications` rather than a messages table: this is a single
-- current instruction ("re-upload your passport photo"), not a conversation,
-- and it should be replaced when the situation changes rather than stacking
-- up a history the applicant has to read through. The client already reads
-- their own application row under RLS, so no new policy is needed.
-- ADDITIVE ONLY. Safe to re-run.
-- ===========================================================================

alter table public.applications
  add column if not exists client_message    text,
  add column if not exists client_message_at timestamptz;

notify pgrst, 'reload schema';
