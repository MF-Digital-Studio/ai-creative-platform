create table public.generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  input_asset_id uuid null references public.assets (id) on delete set null,
  generation_type text not null default 'image',
  status text not null default 'queued',
  provider text not null,
  model text not null,
  creative_direction_snapshot text not null,
  provider_request_id text null,
  output_bucket_id text null,
  output_object_path text null,
  error_message text null,
  cost_usd numeric(12, 6) null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint generations_type_check
    check (
      generation_type in ('image', 'video')
    ),

  constraint generations_status_check
    check (
      status in ('queued', 'processing', 'succeeded', 'failed')
    ),

  constraint generations_provider_length_check
    check (
      char_length(btrim(provider)) between 1 and 64
    ),

  constraint generations_model_length_check
    check (
      char_length(btrim(model)) between 1 and 128
    ),

  constraint generations_creative_direction_length_check
    check (
      char_length(btrim(creative_direction_snapshot)) between 1 and 4000
    ),

  constraint generations_provider_request_id_length_check
    check (
      provider_request_id is null
      or char_length(provider_request_id) <= 255
    ),

  constraint generations_error_message_length_check
    check (
      error_message is null
      or char_length(error_message) <= 2000
    ),

  constraint generations_cost_usd_check
    check (
      cost_usd is null
      or cost_usd >= 0
    ),

  constraint generations_output_pair_check
    check (
      (
        output_bucket_id is null
        and output_object_path is null
      )
      or
      (
        output_bucket_id is not null
        and output_object_path is not null
        and char_length(btrim(output_bucket_id)) > 0
        and char_length(btrim(output_object_path)) > 0
      )
    )
);


create index generations_project_id_idx
  on public.generations using btree (project_id);


create index generations_input_asset_id_idx
  on public.generations using btree (input_asset_id);


alter table public.generations
enable row level security;


create policy "Authenticated users can select generations for their own projects"
  on public.generations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.projects
      where public.projects.id = generations.project_id
        and public.projects.user_id = (select auth.uid())
    )
  );


revoke all privileges
on table public.generations
from anon, authenticated, service_role;


grant select
on table public.generations
to authenticated;


grant select, insert, update
on table public.generations
to service_role;


create function public.set_generations_timestamps()
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


create trigger generations_set_timestamps
  before insert or update on public.generations
  for each row
  execute function public.set_generations_timestamps();