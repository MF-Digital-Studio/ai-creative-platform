create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_status_check check (status in ('draft', 'active', 'completed'))
);


create index projects_user_id_idx on public.projects using btree (user_id);


alter table public.projects enable row level security;


create policy "Authenticated users can select their own projects"
  on public.projects
  for select
  to authenticated
  using ((select auth.uid()) = user_id);


create policy "Authenticated users can insert their own projects"
  on public.projects
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);


create policy "Authenticated users can update their own projects"
  on public.projects
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);


revoke all privileges
on table public.projects
from anon, authenticated, service_role;


grant select, insert, update
on table public.projects
to authenticated;


create function public.set_projects_timestamps()
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


create trigger projects_set_timestamps
  before insert or update on public.projects
  for each row
  execute function public.set_projects_timestamps();
