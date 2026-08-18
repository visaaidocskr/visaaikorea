-- ===========================================================================
-- 0013_visa_granted_status.sql
-- Adds a "visa granted" application status.
--
-- The existing statuses only tracked OUR side of the work (documents
-- generated, released to the client, "completed"). Nothing recorded the
-- outcome that actually matters to the applicant: whether the authority
-- granted the visa. "Completed" meant "we finished our part", which for an
-- e-Visa reads as if the visa itself had been issued — so the real outcome
-- gets its own status rather than being inferred.
--
-- Refusals continue to use the existing 'rejected'.
-- ADDITIVE ONLY. Safe to re-run.
-- ===========================================================================

alter type public.application_status add value if not exists 'visa_granted' after 'completed';

notify pgrst, 'reload schema';
