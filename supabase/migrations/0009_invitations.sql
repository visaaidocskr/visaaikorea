-- ===========================================================================
-- 0009_invitations.sql
-- Family invitation cases (C-3-1 short-term visit to Korea).
--
-- This is the mirror image of `applications`: there, the account holder is
-- the traveller leaving Korea. Here the account holder is the INVITER who
-- stays in Korea, and the people who actually apply for the visa are their
-- relatives abroad, who never touch this site. That is why this needs its
-- own tables rather than more columns on `applications` — two full people
-- per case, and one set of documents per invitee.
--
-- What we produce is the Korea-side paperwork only: 초청장 (invitation),
-- 초청 사유서 (statement of reasons) and 신원보증서 (guarantee, the blank
-- form 별지 제129호서식 published under 출입국관리법 시행규칙). The visa
-- itself is applied for by the relative at the Korean mission in their own
-- country.
--
-- Idempotent / safe to re-run.
-- ===========================================================================

-- 1. Status enum -----------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'invitation_status') then
    create type public.invitation_status as enum (
      'draft',
      'submitted',
      'reviewing',
      'missing_documents',
      'documents_generating',
      'completed',
      'cancelled'
    );
  end if;
end$$;

-- 2. invitations — the case, and everything about the inviter --------------
create table if not exists public.invitations (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.profiles (id) on delete cascade,

  -- Inviter (the account holder, living in Korea)
  inviter_full_name        text,
  inviter_nationality      text,
  inviter_sex              text,           -- 'male' | 'female'
  inviter_date_of_birth    date,
  inviter_passport_number  text,
  inviter_phone            text,
  inviter_address_korea    text,           -- Korean address, written in Korean
  korean_visa_status       text,           -- decides which document list applies
  inviter_org_name         text,           -- 근무처: university or employer
  inviter_position         text,           -- 직위: e.g. 학생
  inviter_org_address      text,

  -- Visit window. The guarantee period must cover the invitation period,
  -- so it is stored separately rather than assumed.
  invitation_start_date    date,
  invitation_end_date      date,
  guarantee_months         integer not null default 3,

  -- Which Korean mission the documents are addressed to (수신).
  destination_mission      text not null default 'Embassy of the Republic of Korea in Uzbekistan',

  -- The applicant's own words, used to write 초청 사유서. Never auto-filled.
  invitation_reason        text,

  -- Requirements acknowledgement: the client confirms they have read the
  -- document list that applies to their visa status. Stored with a timestamp
  -- and the status it was shown for, so we can prove what they agreed to
  -- even if the policy text later changes.
  requirements_ack         boolean not null default false,
  requirements_ack_at      timestamptz,
  requirements_ack_status  text,

  status                   public.invitation_status not null default 'draft',
  client_email             text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists idx_invitations_user_id on public.invitations (user_id);
create index if not exists idx_invitations_status on public.invitations (status);

drop trigger if exists trg_invitations_updated_at on public.invitations;
create trigger trg_invitations_updated_at
  before update on public.invitations
  for each row execute function public.set_updated_at();

-- 3. invitation_invitees — one row per invited relative --------------------
-- Each invitee gets their own 초청장 / 사유서 / 신원보증서, so this is a
-- real one-to-many rather than a repeated column block.
create table if not exists public.invitation_invitees (
  id                 uuid primary key default gen_random_uuid(),
  invitation_id      uuid not null references public.invitations (id) on delete cascade,
  sort_order         integer not null default 0,

  surname            text,
  given_name         text,
  middle_name        text,
  date_of_birth      date,
  sex                text,                 -- 'male' | 'female'
  nationality        text,
  passport_number    text,
  address_home       text,                 -- address in the home country
  phone_home         text,
  relationship       text,                 -- 관계, e.g. 모자 (mother–son)

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_invitation_invitees_invitation
  on public.invitation_invitees (invitation_id);

drop trigger if exists trg_invitation_invitees_updated_at on public.invitation_invitees;
create trigger trg_invitation_invitees_updated_at
  before update on public.invitation_invitees
  for each row execute function public.set_updated_at();

-- 4. RLS -------------------------------------------------------------------
alter table public.invitations enable row level security;
alter table public.invitation_invitees enable row level security;

-- invitations: owner-only, admins see everything (same shape as applications)
drop policy if exists "invitations_select_own" on public.invitations;
create policy "invitations_select_own" on public.invitations
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "invitations_insert_own" on public.invitations;
create policy "invitations_insert_own" on public.invitations
  for insert with check (user_id = auth.uid());

drop policy if exists "invitations_update_own" on public.invitations;
create policy "invitations_update_own" on public.invitations
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "invitations_delete_own" on public.invitations;
create policy "invitations_delete_own" on public.invitations
  for delete using (user_id = auth.uid() or public.is_admin());

-- invitees: reachable only through an invitation the caller may see
drop policy if exists "invitation_invitees_select" on public.invitation_invitees;
create policy "invitation_invitees_select" on public.invitation_invitees
  for select using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "invitation_invitees_insert" on public.invitation_invitees;
create policy "invitation_invitees_insert" on public.invitation_invitees
  for insert with check (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and i.user_id = auth.uid()
    )
  );

drop policy if exists "invitation_invitees_update" on public.invitation_invitees;
create policy "invitation_invitees_update" on public.invitation_invitees
  for update using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  ) with check (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "invitation_invitees_delete" on public.invitation_invitees;
create policy "invitation_invitees_delete" on public.invitation_invitees
  for delete using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  );

notify pgrst, 'reload schema';
