alter table public.assets
  add column if not exists product_profile jsonb null;

-- Product analysis runs only in server-only code with a Supabase secret key.
-- This explicit column grant fixes installations that use opt-in table grants
-- while keeping the privileged write surface limited to product_profile.
grant update (product_profile) on table public.assets to service_role;
