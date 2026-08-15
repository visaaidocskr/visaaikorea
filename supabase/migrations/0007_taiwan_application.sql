-- ===========================================================================
-- 0007_taiwan_application.sql
-- Taiwan visa application data collection, mirroring the Japan (0006) pattern.
-- ADDITIVE ONLY: new columns only, reusing every field already shared with
-- Japan (name, passport, occupation, employer, accommodations, flight_bookings,
-- etc.) Only genuinely Taiwan-specific data gets a new column:
--   • applicant_details.home_country_address / home_country_phone — Taiwan's
--     form (field 15) asks for the applicant's PERMANENT address in their home
--     country, distinct from current_korea_address (Korea ARC address, used
--     for Japan and for internal document routing) and from the Taiwan-trip
--     accommodations table (field 14, "Address & Phone No. in Taiwan").
--   • applications.taiwan_travel_purpose / taiwan_travel_purpose_other — the
--     official form's fixed checkbox list (Tourism/Business/Study/Employment/
--     Joining or visiting family/Religion/Entrepreneur/Other), which doesn't
--     match Japan's free-text travel_purpose.
--   • applications.taiwan_background_answers — the 8 page-2 Yes/No declarations
--     (A–H), a different question set from Japan's 6. Same rule as Japan's
--     background_answers: applicant-answered only, NEVER auto-filled.
-- Safe to re-run.
-- ===========================================================================

alter table public.applicant_details
  add column if not exists home_country_address text,
  add column if not exists home_country_phone    text;

alter table public.applications
  add column if not exists taiwan_travel_purpose       text,  -- tourism|business|study|employment|family|religion|entrepreneur|other
  add column if not exists taiwan_travel_purpose_other  text,
  add column if not exists taiwan_background_answers    jsonb;
