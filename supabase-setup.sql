-- Run this once in Supabase: SQL Editor > New query.
-- Every new account starts as a volunteer. Change staff/admin roles yourself in SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'volunteer'
    check (role in ('volunteer', 'staff', 'administrator'))
);

-- Users can read only their own role. Role changes are done by an administrator in Supabase.
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- Create a volunteer profile automatically whenever someone signs up.
create or replace function public.create_volunteer_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'volunteer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
  after insert on auth.users
  for each row execute procedure public.create_volunteer_profile();

-- Add profiles for accounts that already existed before this setup.
insert into public.profiles (id, role)
select id, 'volunteer' from auth.users
on conflict (id) do nothing;

-- To promote an account, replace the email and role, then run this separately:
-- update public.profiles
-- set role = 'administrator'
-- where id = (select id from auth.users where email = 'person@example.com');
