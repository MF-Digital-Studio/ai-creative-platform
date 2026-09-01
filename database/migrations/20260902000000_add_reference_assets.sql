alter table public.assets
  drop constraint if exists assets_asset_type_check;

alter table public.assets
  add constraint assets_asset_type_check
  check (asset_type in ('product', 'product_mask', 'reference_image'));

create index if not exists assets_project_reference_images_idx
  on public.assets (project_id, created_at asc)
  where asset_type = 'reference_image';

create or replace function public.limit_project_reference_assets()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.asset_type = 'reference_image' then
    perform pg_advisory_xact_lock(hashtextextended(new.project_id::text, 0));

    if exists (
      select 1
      from public.assets
      where project_id = new.project_id
        and asset_type = 'reference_image'
      having count(*) >= 3
    ) then
      raise exception 'A project may contain at most three reference images';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists assets_limit_project_reference_images on public.assets;

create trigger assets_limit_project_reference_images
  before insert on public.assets
  for each row
  execute function public.limit_project_reference_assets();
