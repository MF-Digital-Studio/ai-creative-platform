grant select, insert
on table public.assets
to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'assets_product_mask_derivation_required'
  ) then
    alter table public.assets
      add constraint assets_product_mask_derivation_required
      check (
        asset_type <> 'product_mask'
        or (
          derived_from_asset_id is not null
          and derivation_key is not null
          and length(btrim(derivation_key)) > 0
        )
      );
  end if;
end;
$$;
