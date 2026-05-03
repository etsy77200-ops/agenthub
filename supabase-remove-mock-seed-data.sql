-- Remove legacy mock/demo marketplace data from Supabase.
-- Run this in Supabase SQL editor after reviewing the target rows.

begin;

-- 1) Identify demo listings by known seeded titles and example.com sellers.
with target_sellers as (
  select id
  from public.profiles
  where email ilike '%@example.com'
),
target_listings as (
  select l.id
  from public.listings l
  where l.title in (
    'AI Customer Support Agent - 24/7 Multilingual',
    'Lead Generation Agent for B2B SaaS',
    'AI Data Analyst - Automated Reports & Insights',
    'SEO Content Writer Agent',
    'Code Review & Bug Detection Agent',
    'Social Media Marketing Agent'
  )
  or l.seller_id in (select id from target_sellers)
)
-- 2) Delete dependent rows first (defensive order).
delete from public.messages
where conversation_id in (
  select c.id
  from public.conversations c
  where c.listing_id in (select id from target_listings)
);

with target_sellers as (
  select id
  from public.profiles
  where email ilike '%@example.com'
),
target_listings as (
  select l.id
  from public.listings l
  where l.title in (
    'AI Customer Support Agent - 24/7 Multilingual',
    'Lead Generation Agent for B2B SaaS',
    'AI Data Analyst - Automated Reports & Insights',
    'SEO Content Writer Agent',
    'Code Review & Bug Detection Agent',
    'Social Media Marketing Agent'
  )
  or l.seller_id in (select id from target_sellers)
)
delete from public.conversations
where listing_id in (select id from target_listings);

with target_sellers as (
  select id
  from public.profiles
  where email ilike '%@example.com'
),
target_listings as (
  select l.id
  from public.listings l
  where l.title in (
    'AI Customer Support Agent - 24/7 Multilingual',
    'Lead Generation Agent for B2B SaaS',
    'AI Data Analyst - Automated Reports & Insights',
    'SEO Content Writer Agent',
    'Code Review & Bug Detection Agent',
    'Social Media Marketing Agent'
  )
  or l.seller_id in (select id from target_sellers)
)
delete from public.reviews
where listing_id in (select id from target_listings);

with target_sellers as (
  select id
  from public.profiles
  where email ilike '%@example.com'
),
target_listings as (
  select l.id
  from public.listings l
  where l.title in (
    'AI Customer Support Agent - 24/7 Multilingual',
    'Lead Generation Agent for B2B SaaS',
    'AI Data Analyst - Automated Reports & Insights',
    'SEO Content Writer Agent',
    'Code Review & Bug Detection Agent',
    'Social Media Marketing Agent'
  )
  or l.seller_id in (select id from target_sellers)
)
delete from public.orders
where listing_id in (select id from target_listings);

with target_sellers as (
  select id
  from public.profiles
  where email ilike '%@example.com'
),
target_listings as (
  select l.id
  from public.listings l
  where l.title in (
    'AI Customer Support Agent - 24/7 Multilingual',
    'Lead Generation Agent for B2B SaaS',
    'AI Data Analyst - Automated Reports & Insights',
    'SEO Content Writer Agent',
    'Code Review & Bug Detection Agent',
    'Social Media Marketing Agent'
  )
  or l.seller_id in (select id from target_sellers)
)
delete from public.listing_revisions
where listing_id in (select id from target_listings);

with target_sellers as (
  select id
  from public.profiles
  where email ilike '%@example.com'
)
delete from public.listings
where seller_id in (select id from target_sellers)
or title in (
  'AI Customer Support Agent - 24/7 Multilingual',
  'Lead Generation Agent for B2B SaaS',
  'AI Data Analyst - Automated Reports & Insights',
  'SEO Content Writer Agent',
  'Code Review & Bug Detection Agent',
  'Social Media Marketing Agent'
);

-- Optional: delete the seeded demo profiles too.
delete from public.profiles
where email ilike '%@example.com';

commit;
