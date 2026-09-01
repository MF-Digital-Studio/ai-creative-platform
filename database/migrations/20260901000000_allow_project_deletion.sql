grant delete
on table public.projects
to authenticated;


create policy "Authenticated users can delete their own projects"
  on public.projects
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
