alter table public.assets
  add column if not exists product_role text null,
  add column if not exists sort_order integer null;

alter table public.assets
  drop constraint if exists assets_product_role_check,
  drop constraint if exists assets_product_sort_order_check;

alter table public.assets
  add constraint assets_product_role_check check (
    product_role is null or (asset_type = 'product' and product_role in ('primary', 'supporting'))
  ),
  add constraint assets_product_sort_order_check check (
    (product_role is null and sort_order is null)
    or (product_role is not null and sort_order between 0 and 3)
  );

-- Previous replacement uploads can leave historical product rows behind. Only
-- the newest row becomes the active primary so distinct legacy SKUs are never
-- silently interpreted as views of one product.
with ranked as (
  select id, row_number() over (partition by project_id order by created_at desc, id desc) as position
  from public.assets
  where asset_type = 'product'
)
update public.assets as assets
set product_role = case when ranked.position = 1 then 'primary' else null end,
    sort_order = case when ranked.position = 1 then 0 else null end
from ranked
where assets.id = ranked.id
  and assets.product_role is null;

create unique index if not exists assets_one_active_product_primary_idx
  on public.assets (project_id)
  where asset_type = 'product' and product_role = 'primary';

create index if not exists assets_active_product_set_idx
  on public.assets (project_id, sort_order)
  where asset_type = 'product' and product_role is not null;

create or replace function public.limit_project_product_assets()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.asset_type = 'product' and new.product_role is not null then
    perform pg_advisory_xact_lock(hashtextextended(new.project_id::text, 1));
    if (select count(*) from public.assets where project_id = new.project_id and asset_type = 'product' and product_role is not null and id <> new.id) >= 4 then
      raise exception 'A project may contain at most four active product images';
    end if;
    if tg_op = 'INSERT' then
      new.sort_order := (select count(*) from public.assets where project_id = new.project_id and asset_type = 'product' and product_role is not null);
      new.product_role := case when new.sort_order = 0 then 'primary' else 'supporting' end;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists assets_limit_project_product_images on public.assets;
create trigger assets_limit_project_product_images
  before insert or update of product_role on public.assets
  for each row execute function public.limit_project_product_assets();

create or replace function public.delete_project_product_asset(p_asset_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.assets%rowtype;
  replacement_id uuid;
begin
  select * into target from public.assets
  where id = p_asset_id and asset_type = 'product' and product_role is not null and user_id = (select auth.uid())
  for update;
  if target.id is null then raise exception 'Product asset not found'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target.project_id::text, 1));
  if (select count(*) from public.assets where project_id = target.project_id and asset_type = 'product' and product_role is not null) <= 1 then
    raise exception 'A project must keep at least one product image';
  end if;
  delete from public.assets where id = target.id;
  if target.product_role = 'primary' then
    select id into replacement_id from public.assets
    where project_id = target.project_id and asset_type = 'product' and product_role = 'supporting'
    order by sort_order, created_at, id limit 1 for update;
    update public.assets set product_role = 'primary' where id = replacement_id;
  end if;
  with ordered as (
    select id, row_number() over (order by case when product_role = 'primary' then 0 else 1 end, sort_order, created_at, id) - 1 as next_order
    from public.assets where project_id = target.project_id and asset_type = 'product' and product_role is not null
  )
  update public.assets set sort_order = ordered.next_order from ordered where assets.id = ordered.id;
  return target.object_path;
end;
$$;

create or replace function public.set_project_product_primary(p_asset_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare target public.assets%rowtype;
begin
  select * into target from public.assets where id = p_asset_id and asset_type = 'product' and product_role is not null and user_id = (select auth.uid()) for update;
  if target.id is null then raise exception 'Product asset not found'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target.project_id::text, 1));
  update public.assets set product_role = 'supporting'
  where project_id = target.project_id and asset_type = 'product' and product_role = 'primary';
  update public.assets set product_role = 'primary', sort_order = 0 where id = target.id;
  with ordered as (
    select id, row_number() over (order by sort_order, created_at, id) as next_order
    from public.assets where project_id = target.project_id and asset_type = 'product' and product_role = 'supporting'
  )
  update public.assets set sort_order = ordered.next_order from ordered where assets.id = ordered.id;
end;
$$;

create or replace function public.reorder_project_product_assets(p_project_id uuid, p_asset_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare expected_count integer;
begin
  if not exists (select 1 from public.projects where id = p_project_id and user_id = (select auth.uid())) then raise exception 'Project not found'; end if;
  select count(*) into expected_count from public.assets where project_id = p_project_id and asset_type = 'product' and product_role is not null and user_id = (select auth.uid());
  if coalesce(array_length(p_asset_ids, 1), 0) <> expected_count or (select count(distinct items.value) from unnest(p_asset_ids) as items(value)) <> expected_count then raise exception 'Invalid product asset order'; end if;
  if exists (select 1 from unnest(p_asset_ids) as items(value) where not exists (select 1 from public.assets where id = items.value and project_id = p_project_id and asset_type = 'product' and product_role is not null and user_id = (select auth.uid()))) then raise exception 'Invalid product asset order'; end if;
  if p_asset_ids[1] <> (select id from public.assets where project_id = p_project_id and asset_type = 'product' and product_role = 'primary') then raise exception 'Primary product must remain first'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_project_id::text, 1));
  update public.assets as assets set sort_order = ranked.position - 1
  from unnest(p_asset_ids) with ordinality as ranked(id, position) where assets.id = ranked.id;
end;
$$;

revoke all on function public.delete_project_product_asset(uuid) from public, anon;
revoke all on function public.set_project_product_primary(uuid) from public, anon;
revoke all on function public.reorder_project_product_assets(uuid, uuid[]) from public, anon;
grant execute on function public.delete_project_product_asset(uuid) to authenticated;
grant execute on function public.set_project_product_primary(uuid) to authenticated;
grant execute on function public.reorder_project_product_assets(uuid, uuid[]) to authenticated;

