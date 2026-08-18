-- ===========================================================================
-- 0012_vietnam_application.sql
-- Vietnam e-Visa data collection. ADDITIVE ONLY.
--
-- Vietnam is NOT a "rich flow" destination like Japan/Taiwan — there's no
-- official multi-page government form to replicate. It's the generic
-- Destination -> Applicant -> Guidance flow (like Singapore), plus a small
-- set of Vietnam-only questions the e-Visa portal actually asks for:
--   • An emergency contact back in the applicant's home country (name, phone,
--     address, relationship) — the e-Visa "contact in home country" field.
--   • Who is financing the trip: the applicant themselves, or someone else
--     (name/relationship/phone/address of that person).
--   • Whether travel insurance has already been bought.
--   • Whether they want the paid 10-hour express service.
-- The applicant's photo (4x6cm, white background) is stored as an uploaded
-- file (file_type = 'vietnam_photo' in uploaded_files) — no new column
-- needed for that, same mechanism as passport/ARC uploads.
--
-- This platform does not auto-generate the e-Visa application itself — the
-- admin reviews the collected data here and submits it manually on Vietnam's
-- official e-Visa portal, so there is no generated-document table change.
-- Safe to re-run.
-- ===========================================================================

alter table public.applicant_details
  add column if not exists vietnam_family_member_name    text,
  add column if not exists vietnam_family_member_phone    text,
  add column if not exists vietnam_family_member_address  text,
  -- 'father' | 'mother' | 'brother' | 'sister' | 'other'. When 'other', the
  -- applicant types the actual relationship into ..._relationship_other.
  add column if not exists vietnam_family_member_relationship       text,
  add column if not exists vietnam_family_member_relationship_other text,
  add column if not exists vietnam_financing_source        text,  -- 'personal' | 'other'
  add column if not exists vietnam_financier_name          text,
  add column if not exists vietnam_financier_relationship  text,
  add column if not exists vietnam_financier_phone         text,
  add column if not exists vietnam_financier_address       text;

-- Trip-level Vietnam answers. Both are null until the applicant answers.
--   • vietnam_express_requested — asked about the 10-hour express service, so
--     an admin sees the request and can follow up even if the applicant never
--     gets round to messaging us.
--   • vietnam_insurance_purchased — whether they already bought travel
--     insurance for the trip.
alter table public.applications
  add column if not exists vietnam_express_requested   boolean,
  add column if not exists vietnam_insurance_purchased boolean;

notify pgrst, 'reload schema';
