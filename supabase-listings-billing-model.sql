-- Run once in Supabase SQL Editor.
-- Adds mixed billing support (one-time, monthly, or both) on listings.

alter table public.listings
  add column if not exists billing_type text not null default 'one_time',
  add column if not exists monthly_price numeric;

update public.listings
set billing_type = 'one_time'
where billing_type is null;

alter table public.listings
  drop constraint if exists listings_billing_type_check;

alter table public.listings
  add constraint listings_billing_type_check
  check (billing_type in ('one_time', 'monthly', 'both'));

comment on column public.listings.billing_type is
  'Pricing model offered by seller: one_time, monthly, or both.';

comment on column public.listings.monthly_price is
  'Recurring monthly price in USD for subscription billing.';
