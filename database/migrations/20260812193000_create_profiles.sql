create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text null,
  avatar_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


alter table public.profiles enable row level security;


create policy "Authenticated users can select their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);


create policy "Authenticated users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);


create policy "Authenticated users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);


revoke all privileges
on table public.profiles
from anon, authenticated, service_role;


grant select, insert, update
on table public.profiles
to authenticated;


create function public.set_profiles_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at = clock_timestamp();
  else
    new.created_at = old.created_at;
  end if;

  new.updated_at = clock_timestamp();

  return new;
end;
$$;


create trigger profiles_set_timestamps
  before insert or update on public.profiles
  for each row
  execute function public.set_profiles_timestamps();