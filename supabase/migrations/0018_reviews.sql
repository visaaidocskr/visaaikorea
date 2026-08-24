-- Reviews: 1-5 star ratings collected at the end of each client flow
-- (visa wizard submit, flight request, tour request, invite request),
-- with an optional comment. One review per person per subject.

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  -- Null for anonymous flows (the public flight/tour forms). Signed-in
  -- reviews always carry the author.
  user_id     uuid references auth.users (id) on delete set null,
  context     text not null check (context in
                ('visa_application', 'flight_request', 'tour_request', 'invite_request')),
  -- The application or service-enquiry the rating belongs to. Knowing this
  -- id is the proof of participation for anonymous flows.
  subject_id  uuid not null,
  rating      smallint not null check (rating between 1 and 5),
  comment     text not null default '',
  locale      text not null default 'en',
  created_at  timestamptz not null default now()
);

-- One review per subject per flow. The subject id is unique per submission,
-- so this also caps anonymous reviews at one per enquiry.
create unique index if not exists reviews_one_per_subject
  on public.reviews (context, subject_id);

create index if not exists reviews_created_at on public.reviews (created_at desc);

alter table public.reviews enable row level security;

-- Signed-in clients may insert their own review; everything else (the
-- anonymous flows) goes through the server action, which uses the service
-- role after verifying the subject exists.
drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
  for insert
  with check (user_id = auth.uid());

-- Clients can see their own reviews; admins see all.
drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
  for select
  using (user_id = auth.uid() or public.is_admin());

-- No update/delete for clients: a rating is a moment-in-time signal.
drop policy if exists reviews_admin_delete on public.reviews;
create policy reviews_admin_delete on public.reviews
  for delete
  using (public.is_admin());
