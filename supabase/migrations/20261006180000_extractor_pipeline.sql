-- Remote extractor rules and anonymous capture diagnostics.
-- Apply in the Supabase SQL editor for project aeoyohqyhawxulisdvqj.

create table if not exists public.extractor_configs (
  site_key text primary key,
  version integer not null default 1,
  config jsonb not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.extractor_configs enable row level security;

drop policy if exists "public read enabled extractor configs" on public.extractor_configs;
create policy "public read enabled extractor configs"
  on public.extractor_configs
  for select
  to anon, authenticated
  using (enabled = true);

create table if not exists public.extraction_events (
  id uuid primary key default gen_random_uuid(),
  site_key text not null,
  hostname text,
  path_pattern text,
  extension_version text,
  layers_used text[] not null default '{}',
  missing_fields text[] not null default '{}',
  field_sources jsonb not null default '{}',
  duration_ms integer,
  created_at timestamptz not null default now()
);

alter table public.extraction_events enable row level security;

drop policy if exists "authenticated insert extraction events" on public.extraction_events;
create policy "authenticated insert extraction events"
  on public.extraction_events
  for insert
  to authenticated
  with check (true);

create table if not exists public.extension_ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  created_at timestamptz not null default now()
);

alter table public.extension_ai_requests enable row level security;

drop policy if exists "users read own ai requests" on public.extension_ai_requests;
create policy "users read own ai requests"
  on public.extension_ai_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users insert own ai requests" on public.extension_ai_requests;
create policy "users insert own ai requests"
  on public.extension_ai_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create index if not exists extension_ai_requests_user_created_idx
  on public.extension_ai_requests (user_id, created_at desc);

create index if not exists extraction_events_site_created_idx
  on public.extraction_events (site_key, created_at desc);

create or replace view public.extraction_failure_summary
with (security_invoker = false) as
select
  site_key,
  count(*) filter (where created_at >= now() - interval '7 days') as captures_7d,
  count(*) filter (
    where created_at >= now() - interval '7 days'
      and missing_fields && array['organization', 'position']
  ) as required_failures_7d,
  count(*) filter (where created_at >= now() - interval '30 days') as captures_30d,
  count(*) filter (
    where created_at >= now() - interval '30 days'
      and missing_fields && array['organization', 'position']
  ) as required_failures_30d,
  (
    count(*) filter (
      where created_at >= now() - interval '7 days'
        and missing_fields && array['organization', 'position']
    )::numeric
    / nullif(count(*) filter (where created_at >= now() - interval '7 days'), 0)
  ) > 0.20 as alert_required_failure_7d
from public.extraction_events
group by site_key;

revoke all on public.extraction_failure_summary from anon, authenticated;
grant select on public.extraction_failure_summary to service_role;
