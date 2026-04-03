-- =============================================
-- AgentHub Database Schema
-- Run this in Supabase SQL Editor (supabase.com > SQL Editor)
-- =============================================

-- 1. Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  avatar_url text,
  bio text,
  role text not null default 'buyer' check (role in ('buyer', 'seller', 'both')),
  stripe_account_id text,
  created_at timestamp with time zone default now()
);

-- 2. Categories table
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  icon text
);

-- 3. Listings table
create table public.listings (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  short_description text not null,
  description text not null,
  category_id uuid references public.categories(id),
  price numeric not null check (price > 0),
  price_type text not null default 'fixed' check (price_type in ('fixed', 'hourly', 'custom')),
  tags text[] default '{}',
  images text[] default '{}',
  demo_url text,
  status text not null default 'draft' check (status in ('active', 'paused', 'draft')),
  rating numeric default 0,
  review_count integer default 0,
  order_count integer default 0,
  created_at timestamp with time zone default now()
);

-- 4. Orders table
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  buyer_id uuid references public.profiles(id) not null,
  listing_id uuid references public.listings(id) not null,
  seller_id uuid references public.profiles(id) not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  amount numeric not null,
  platform_fee numeric not null,
  requirements text,
  stripe_payment_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. Reviews table
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) not null,
  listing_id uuid references public.listings(id) not null,
  reviewer_id uuid references public.profiles(id) not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default now()
);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;

-- Profiles: anyone can read, users can update their own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Categories: anyone can read
create policy "Categories are viewable by everyone" on public.categories for select using (true);

-- Listings: anyone can read active, sellers can manage their own
create policy "Active listings are viewable by everyone" on public.listings for select using (status = 'active' or seller_id = auth.uid());
create policy "Sellers can create listings" on public.listings for insert with check (auth.uid() = seller_id);
create policy "Sellers can update own listings" on public.listings for update using (auth.uid() = seller_id);
create policy "Sellers can delete own listings" on public.listings for delete using (auth.uid() = seller_id);

-- Orders: buyers and sellers can see their own
create policy "Users can view own orders" on public.orders for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Buyers can create orders" on public.orders for insert with check (auth.uid() = buyer_id);
create policy "Order participants can update" on public.orders for update using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Reviews: anyone can read, buyers can create for their orders
create policy "Reviews are viewable by everyone" on public.reviews for select using (true);
create policy "Buyers can create reviews" on public.reviews for insert with check (auth.uid() = reviewer_id);

-- =============================================
-- Auto-create profile on signup (trigger)
-- =============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'buyer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- Seed categories
-- =============================================

insert into public.categories (name, slug, icon) values
  ('Customer Support Agents', 'customer-support', 'headset'),
  ('Sales & Lead Gen Agents', 'sales-lead-gen', 'trending-up'),
  ('Data Analysis Agents', 'data-analysis', 'bar-chart'),
  ('Content Creation Agents', 'content-creation', 'pen-tool'),
  ('Code & Dev Agents', 'code-dev', 'code'),
  ('Research Agents', 'research', 'search'),
  ('Workflow Automation', 'workflow-automation', 'zap'),
  ('Marketing Agents', 'marketing', 'megaphone'),
  ('Finance & Accounting', 'finance-accounting', 'dollar-sign'),
  ('HR & Recruiting Agents', 'hr-recruiting', 'users'),
  ('Legal Agents', 'legal', 'shield'),
  ('Custom Agents', 'custom', 'settings');
