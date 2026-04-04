-- Run in Supabase SQL Editor (once). Used by Stripe webhook after successful checkout.
-- Requires webhook to use SUPABASE_SERVICE_ROLE_KEY (see src/app/api/stripe/webhook/route.ts).

create or replace function public.increment_order_count(listing_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set order_count = coalesce(order_count, 0) + 1
  where id = listing_id_input;
end;
$$;

revoke all on function public.increment_order_count(uuid) from public;
grant execute on function public.increment_order_count(uuid) to service_role;
