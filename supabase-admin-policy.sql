-- Run this in Supabase SQL Editor
-- Allows admin (your account) to see all orders and listings

-- Drop existing restrictive policies on orders
drop policy if exists "Users can view own orders" on public.orders;

-- Recreate with admin access: you can see ALL orders, others see only their own
create policy "Users can view own orders or admin all" on public.orders
  for select using (
    auth.uid() = buyer_id
    or auth.uid() = seller_id
    or auth.jwt()->>'email' = 'etsy77200@gmail.com'
  );
