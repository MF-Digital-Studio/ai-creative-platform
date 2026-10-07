alter table public.generations
add column is_favorite boolean not null default false;

create index generations_project_favorites_idx
  on public.generations using btree (project_id, is_favorite)
  where is_favorite = true;
