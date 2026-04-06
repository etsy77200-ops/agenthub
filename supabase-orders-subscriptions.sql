-- Run once in Supabase SQL Editor.
-- Adds subscription lifecycle columns to orders for monthly billing.

alter table public.orders
  add column if not exists purchase_type text not null default 'one_time',
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_subscription_status text,
  add column if not exists stripe_last_invoice_id text,
  add column if not exists subscription_current_period_end timestamptz,
  add column if not exists subscription_cancelled_at timestamptz;

update public.orders
set purchase_type = 'one_time'
where purchase_type is null;

alter table public.orders
  drop constraint if exists orders_purchase_type_check;

alter table public.orders
  add constraint orders_purchase_type_check
  check (purchase_type in ('one_time', 'monthly'));

create index if not exists orders_subscription_id_idx
  on public.orders (stripe_subscription_id);

comment on column public.orders.purchase_type is
  'How this order is billed: one_time or monthly.';
comment on column public.orders.stripe_subscription_id is
  'Stripe subscription id for monthly purchases.';
comment on column public.orders.stripe_subscription_status is
  'Latest subscription status copied from Stripe.';
