insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-assets',
  'product-assets',
  false,
  20971520,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
on conflict (id) do nothing;


create policy "Authenticated users can upload product assets to owned projects"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-assets'

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


create policy "Authenticated users can read their own product assets"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'product-assets'

    and owner_id = (select auth.uid()::text)

    and (storage.foldername(name))[1] = (select auth.uid())::text
  );