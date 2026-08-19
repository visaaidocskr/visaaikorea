-- Public flight and tour quotation requests. These are deliberately separate
-- from visa applications: a quote is not a visa application and should never
-- be mistaken for one by the client or admin team.
create table if not exists public.service_enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('flight', 'tour')),
  full_name text not null,
  residential_address text not null,
  email text not null,
  phone text not null,
  origin_country text not null,
  origin_city text not null,
  destination_country text not null,
  destination_city text,
  departure_date date not null,
  return_date date,
  travellers integer not null check (travellers between 1 and 20),
  baggage_preference text,
  hotel_stars smallint check (hotel_stars between 2 and 5),
  notes text,
  status text not null default 'received'
    check (status in ('received', 'reviewing', 'quoted', 'closed', 'cancelled')),
  admin_quote text,
  quoted_amount_usd numeric(12,2),
  quoted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_service_enquiries_status_created
  on public.service_enquiries(status, created_at desc);
create index if not exists idx_service_enquiries_user_id
  on public.service_enquiries(user_id);

drop trigger if exists trg_service_enquiries_updated_at on public.service_enquiries;
create trigger trg_service_enquiries_updated_at
  before update on public.service_enquiries
  for each row execute function public.set_updated_at();

alter table public.service_enquiries enable row level security;

-- Public submissions are written only through a validated server action using
-- the service role. Clients cannot list other people's personal travel data.
drop policy if exists service_enquiries_admin_all on public.service_enquiries;
create policy service_enquiries_admin_all on public.service_enquiries
  for all using (public.is_admin()) with check (public.is_admin());

notify pgrst, 'reload schema';
