alter table public.generations
  drop constraint if exists generations_quality_check;

alter table public.generations
  add constraint generations_quality_check
  check (
    quality is null
    or quality in ('preview', 'standard', 'low', 'medium', 'high', 'xhigh', 'max', 'auto')
  );
