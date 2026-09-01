alter table public.generations
  add column if not exists preservation_mode text null,
  add column if not exists fidelity_status text null,
  add column if not exists fidelity_score numeric(6, 5) null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'generations_preservation_mode_check'
  ) then
    alter table public.generations
      add constraint generations_preservation_mode_check
      check (preservation_mode is null or preservation_mode in ('reference_edit', 'pixel_lock'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'generations_fidelity_status_check'
  ) then
    alter table public.generations
      add constraint generations_fidelity_status_check
      check (fidelity_status is null or fidelity_status in ('not_checked', 'locked', 'failed', 'not_available'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'generations_fidelity_score_check'
  ) then
    alter table public.generations
      add constraint generations_fidelity_score_check
      check (fidelity_score is null or (fidelity_score >= 0 and fidelity_score <= 1));
  end if;
end;
$$;
