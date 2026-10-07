create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  project_id uuid null references public.projects (id) on delete cascade,
  generation_id uuid null references public.generations (id) on delete cascade,
  event_key text not null,
  is_read boolean not null default false,
  metadata jsonb null,
  created_at timestamptz not null default now(),

  constraint notifications_type_check check (
    type in (
      'generation_completed',
      'generation_failed',
      'image_edit_completed',
      'image_edit_failed',
      'security_event',
      'billing_event',
      'credit_event',
      'system_message'
    )
  ),
  constraint notifications_event_key_length_check
    check (char_length(btrim(event_key)) between 1 and 255),
  constraint notifications_metadata_object_check
    check (metadata is null or jsonb_typeof(metadata) = 'object'),
  constraint notifications_user_event_key_unique unique (user_id, event_key)
);

create index notifications_user_created_at_idx
  on public.notifications (user_id, created_at desc);

create index notifications_user_is_read_idx
  on public.notifications (user_id, is_read);

alter table public.notifications enable row level security;

create policy "Users can select their own notifications"
  on public.notifications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can update their own notifications"
  on public.notifications
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all privileges on table public.notifications from anon, authenticated, service_role;
grant select on table public.notifications to authenticated;
grant update (is_read) on table public.notifications to authenticated;
grant select, insert, update on table public.notifications to service_role;
