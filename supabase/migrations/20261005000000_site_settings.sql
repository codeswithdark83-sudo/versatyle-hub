-- Site-wide settings (currently: maintenance mode).
-- Only the server (service role) reads/writes this table; no client policies on purpose.
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;

insert into public.site_settings (key, value)
values ('maintenance', '{"enabled": false, "message": ""}'::jsonb)
on conflict (key) do nothing;
