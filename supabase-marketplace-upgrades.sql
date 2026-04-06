-- Marketplace quality upgrades:
-- 1) Listing revisions (version snapshots on edit)
-- 2) Verified-purchase reviews
-- 3) Conversation read tracking for unread badges

-- 1) Listing revisions
create table if not exists public.listing_revisions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  edited_by uuid not null references public.profiles(id) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists listing_revisions_listing_idx
  on public.listing_revisions (listing_id, created_at desc);

alter table public.listing_revisions enable row level security;

drop policy if exists "listing_revisions_select_owner" on public.listing_revisions;
create policy "listing_revisions_select_owner"
on public.listing_revisions for select
to authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id and l.seller_id = auth.uid()
  )
);

drop policy if exists "listing_revisions_insert_owner" on public.listing_revisions;
create policy "listing_revisions_insert_owner"
on public.listing_revisions for insert
to authenticated
with check (
  edited_by = auth.uid()
  and exists (
    select 1
    from public.listings l
    where l.id = listing_id and l.seller_id = auth.uid()
  )
);

-- 2) Reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null check (length(trim(comment)) > 0 and length(comment) <= 2000),
  verified_purchase boolean not null default true,
  created_at timestamptz not null default now()
);

-- If reviews table already existed from an earlier schema, make sure required columns exist.
alter table public.reviews
  add column if not exists order_id uuid references public.orders(id) on delete cascade,
  add column if not exists listing_id uuid references public.listings(id) on delete cascade,
  add column if not exists reviewer_id uuid references public.profiles(id) on delete cascade,
  add column if not exists rating integer,
  add column if not exists comment text,
  add column if not exists verified_purchase boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

-- Backfill safe defaults for nullable legacy rows.
update public.reviews
set verified_purchase = true
where verified_purchase is null;

create index if not exists reviews_listing_idx on public.reviews (listing_id, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all"
on public.reviews for select
to authenticated, anon
using (true);

drop policy if exists "reviews_insert_verified_buyer" on public.reviews;
create policy "reviews_insert_verified_buyer"
on public.reviews for insert
to authenticated
with check (
  reviewer_id = auth.uid()
  and verified_purchase = true
  and exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.buyer_id = auth.uid()
      and o.listing_id = reviews.listing_id
      and o.status in ('completed', 'accepted', 'in_progress')
  )
);

-- 3) Conversation read tracking for unread counts
alter table public.conversations
  add column if not exists buyer_last_read_at timestamptz,
  add column if not exists seller_last_read_at timestamptz;

