alter table public.generations
  add column if not exists quality text null,
  add column if not exists aspect_ratio text null,
  add column if not exists output_mime_type text null,
  add column if not exists processing_started_at timestamptz null,
  add column if not exists processing_completed_at timestamptz null,
  add column if not exists processing_duration_ms integer null,
  add column if not exists provider_metadata jsonb null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'generations_quality_check'
  ) then
    alter table public.generations
      add constraint generations_quality_check
      check (quality is null or quality in ('preview', 'standard', 'high'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'generations_aspect_ratio_check'
  ) then
    alter table public.generations
      add constraint generations_aspect_ratio_check
      check (aspect_ratio is null or aspect_ratio in ('1:1', '4:5', '3:4', '16:9', '9:16'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'generations_output_mime_type_length_check'
  ) then
    alter table public.generations
      add constraint generations_output_mime_type_length_check
      check (output_mime_type is null or char_length(output_mime_type) <= 255);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'generations_processing_duration_ms_check'
  ) then
    alter table public.generations
      add constraint generations_processing_duration_ms_check
      check (processing_duration_ms is null or processing_duration_ms >= 0);
  end if;
end;
$$;
