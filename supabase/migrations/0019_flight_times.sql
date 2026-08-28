-- Flight times, for the Schedule of Stay document. The generator shapes the
-- first and last day around these: a 09:00 return flight gets a straight
-- checkout-and-transfer morning instead of an impossible sightseeing plan.
-- Text "HH:MM" (24h), applicant-editable suggestions read from the uploaded
-- reservation by OCR.

alter table public.flight_bookings
  add column if not exists departure_time        text,
  add column if not exists arrival_time          text,
  add column if not exists return_departure_time text,
  add column if not exists return_arrival_time   text;
