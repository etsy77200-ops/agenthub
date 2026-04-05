-- Run in Supabase SQL Editor (once). Adds the URL buyers see only after payment succeeds.
-- App code never selects this column on public listing pages; access is via /api/buyer/* with service role.

alter table public.listings
  add column if not exists agent_access_url text;

comment on column public.listings.agent_access_url is
  'HTTPS URL to the live agent (app, dashboard, or docs). Exposed to buyers only after paid order via server API.';
