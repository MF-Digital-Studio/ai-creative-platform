alter table public.projects
  add column creative_direction text null,
  add constraint projects_creative_direction_length_check
    check (char_length(creative_direction) <= 4000);
