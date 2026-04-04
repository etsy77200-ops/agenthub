-- =============================================
-- AgentHub: secure admin access (run in Supabase SQL Editor)
-- =============================================
-- 1) Adds profiles.is_admin (clients cannot flip it via the API)
-- 2) RLS so only is_admin users can SELECT all orders + all listings
-- 3) You must set yourself admin ONCE (SQL Editor has no auth.uid(), so it works):
--
--    update public.profiles
--    set is_admin = true
--    where lower(email) = lower('YOUR_OWNER_EMAIL@example.com');
--
-- Match that email to Vercel / .env.local: ADMIN_EMAIL=your_owner_email@example.com
-- =============================================

-- Column
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Prevent authenticated API users from changing is_admin (SQL Editor bypasses auth.uid())
create or replace function public.lock_profile_is_admin()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.is_admin is distinct from old.is_admin then
    if auth.uid() is not null then
      new.is_admin := old.is_admin;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lock_profile_is_admin on public.profiles;
create trigger trg_lock_profile_is_admin
  before update on public.profiles
  for each row
  execute procedure public.lock_profile_is_admin();

-- Orders: replace prior variants with participant + admin policies
drop policy if exists "Users can view own orders" on public.orders;
drop policy if exists "Users can view own orders or admin all" on public.orders;
drop policy if exists "Order participants can view" on public.orders;
drop policy if exists "Admins can view all orders" on public.orders;

create policy "Order participants can view" on public.orders
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Admins can view all orders" on public.orders
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin is true
    )
  );

-- Listings: active public + own drafts + admin sees everything
drop policy if exists "Active listings are viewable by everyone" on public.listings;
drop policy if exists "Listings visible to public sellers and admins" on public.listings;
drop policy if exists "Admins can view all listings" on public.listings;

create policy "Listings visible to public sellers and admins" on public.listings
  for select using (
    status = 'active'
    or seller_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin is true
    )
  );

-- Recreate seller write policies if they were dropped (they should still exist)
-- (No-op if names unchanged — adjust if your DB differs.)
