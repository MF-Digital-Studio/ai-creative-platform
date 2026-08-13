insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'generated-assets',
  'generated-assets',
  false,
  20971520,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
on conflict (id) do nothing;


create policy "Authenticated users can read generated assets for their own projects"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'generated-assets'

    and array_length(storage.foldername(name), 1) = 2

    and (storage.foldername(name))[1] = (select auth.uid())::text

    and storage.filename(name) <> ''

    and exists (
      select 1
      from public.projects
      where public.projects.id::text = (storage.foldername(name))[2]
        and public.projects.user_id = (select auth.uid())
    )
  );