-- 0006 — reviews, addresses, coupons

-- ---- reviews -----------------------------------------------------------
create table public.reviews (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products(id) on delete cascade,
  user_id           uuid not null references public.users(id) on delete cascade,
  rating            integer not null check (rating between 1 and 5),
  title             text check (length(title) <= 140),
  body              text check (length(body) <= 4000),
  verified_purchase boolean not null default false,
  is_approved       boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (product_id, user_id)          -- one review per user per product
);
create index reviews_product_idx on public.reviews (product_id, created_at desc);
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- rating aggregate recompute (function needs `reviews` to exist)
create or replace function public.recompute_product_rating(p_product_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products p set
    rating_count = coalesce(
      (select count(*) from public.reviews r
        where r.product_id = p_product_id and r.is_approved), 0),
    rating_avg = coalesce(
      (select round(avg(r.rating)::numeric, 2) from public.reviews r
        where r.product_id = p_product_id and r.is_approved), 0)
  where p.id = p_product_id;
$$;

create or replace function public.reviews_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_product_rating(coalesce(new.product_id, old.product_id));
  return null;
end;
$$;
create trigger reviews_recompute_rating
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_after_change();

-- ---- addresses --------------------------------------------------------
create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  label       text,
  full_name   text not null,
  phone       text,
  line1       text not null,
  line2       text,
  city        text not null,
  state       text,
  postal_code text not null,
  country     text not null default 'IN',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);
create unique index addresses_one_default_uidx
  on public.addresses (user_id) where is_default;
create trigger addresses_set_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

-- Demote other defaults when one is set as default.
create or replace function public.addresses_enforce_single_default()
returns trigger
language plpgsql
as $$
begin
  if new.is_default then
    update public.addresses
      set is_default = false
    where user_id = new.user_id and id <> new.id and is_default;
  end if;
  return new;
end;
$$;
create trigger addresses_single_default
  before insert or update of is_default on public.addresses
  for each row execute function public.addresses_enforce_single_default();

-- ---- coupons ---------------------------------------------------------
create table public.coupons (
  id             uuid primary key default gen_random_uuid(),
  code           citext not null unique,
  description    text,
  discount_type  coupon_type not null,
  discount_value numeric(12,2) not null check (discount_value > 0),
  min_subtotal   numeric(12,2) not null default 0 check (min_subtotal >= 0),
  max_discount   numeric(12,2) check (max_discount > 0),
  usage_limit    integer check (usage_limit > 0),
  per_user_limit integer check (per_user_limit > 0),
  used_count     integer not null default 0 check (used_count >= 0),
  starts_at      timestamptz,
  expires_at     timestamptz,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

create table public.coupon_redemptions (
  id         uuid primary key default gen_random_uuid(),
  coupon_id  uuid not null references public.coupons(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  order_id   uuid not null references public.orders(id) on delete cascade,
  amount     numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);
create index coupon_redemptions_user_idx on public.coupon_redemptions (user_id);
