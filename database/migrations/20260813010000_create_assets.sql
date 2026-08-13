create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  bucket_id text not null default 'product-assets',
  object_path text not null,
  created_at timestamptz not null default now(),
  constraint assets_bucket_id_check check (bucket_id = 'product-assets'),
  constraint assets_object_path_check check (
    array_length(string_to_array(object_path, '/'), 1) = 3
    and split_part(object_path, '/', 1) = user_id::text
    and split_part(object_path, '/', 2) = project_id::text
    and split_part(object_path, '/', 3) <> ''
  ),
  constraint assets_bucket_object_path_key unique (bucket_id, object_path)
);


create index assets_user_id_idx on public.assets using btree (user_id);


create index assets_project_id_idx on public.assets using btree (project_id);


alter table public.assets enable row level security;


create policy "Authenticated users can select their own assets"
  on public.assets
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id

    and exists (
      select 1
      from public.projects
      where public.projects.id = project_id
        and public.projects.user_id = (select auth.uid())
    )
  );


create policy "Authenticated users can insert assets for their own projects"
  on public.assets
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id

    and bucket_id = 'product-assets'

    and array_length(string_to_array(object_path, '/'), 1) = 3
    and split_part(object_path, '/', 1) = user_id::text
    and split_part(object_path, '/', 2) = project_id::text
    and split_part(object_path, '/', 3) <> ''

    and exists (
      select 1
      from public.projects
      where public.projects.id = project_id
        and public.projects.user_id = (select auth.uid())
    )
  );


revoke all privileges
on table public.assets
from anon, authenticated, service_role;


grant select, insert
on table public.assets
to authenticated;


create function public.set_assets_created_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at = clock_timestamp();

  return new;
end;
$$;


create trigger assets_set_created_at
  before insert on public.assets
  for each row
  execute function public.set_assets_created_at();
