-- Optional: database-level rule — active listings must have a non-empty demo_url.
-- Run ONLY after every existing active row has demo_url set, or the ALTER will fail.
--
-- Backfill example:
-- update public.listings set demo_url = 'https://example.com/your-demo' where status = 'active' and (demo_url is null or trim(demo_url) = '');

alter table public.listings
  drop constraint if exists listings_active_require_demo;

alter table public.listings
  add constraint listings_active_require_demo
  check (
    status <> 'active'
    or (demo_url is not null and length(trim(demo_url)) > 0)
  );
