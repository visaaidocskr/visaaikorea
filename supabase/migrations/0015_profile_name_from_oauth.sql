-- ===========================================================================
-- 0015_profile_name_from_oauth.sql
-- Makes the new-user trigger pick up the name from OAuth sign-ups too.
--
-- The original trigger only read `full_name`, which is what our own signup
-- form puts into raw_user_meta_data. Providers use different keys — Google
-- sends both `full_name` and `name` — so a sign-up through Google could land
-- a profile with an empty name, and an admin looking at the applications list
-- would see a blank instead of who it is.
--
-- Falls back through the common keys and leaves the row's other behaviour
-- (on conflict do nothing) untouched. Phone stays empty for OAuth sign-ups:
-- Google doesn't provide one, and the application form asks for it anyway.
-- Safe to re-run.
-- ===========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      ''
    ),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

notify pgrst, 'reload schema';
