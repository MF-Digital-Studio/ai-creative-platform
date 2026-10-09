alter table public.assets
  add column if not exists product_analysis_status jsonb,
  add column if not exists reference_analysis_cache jsonb;

comment on column public.assets.product_analysis_status is
  'Versioned Product Understanding terminal/transient status used to suppress redundant provider calls.';

comment on column public.assets.reference_analysis_cache is
  'Versioned structured reference analysis cache keyed by the ordered immutable reference asset set.';
