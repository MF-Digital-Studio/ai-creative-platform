alter table public.assets
  add column if not exists asset_type text not null default 'product',
  add column if not exists derived_from_asset_id uuid null references public.assets (id) on delete cascade,
  add column if not exists derivation_key text null,
  add column if not exists derivation_metadata jsonb null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'assets_asset_type_check') then
    alter table public.assets add constraint assets_asset_type_check check (asset_type in ('product', 'product_mask'));
  end if;
end $$;

create unique index if not exists assets_product_mask_derivation_key_idx
  on public.assets (derived_from_asset_id, derivation_key)
  where asset_type = 'product_mask';
