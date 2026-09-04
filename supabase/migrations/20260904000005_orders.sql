-- 0005 — orders + order items
-- Placement, stock decrement and coupon accounting are done atomically by
-- public.place_order() (see 0008_functions.sql).

create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete restrict,
  order_number   text not null unique,
  status         order_status not null default 'demo-placed',
  subtotal       numeric(12,2) not null check (subtotal >= 0),
  discount_total numeric(12,2) not null default 0 check (discount_total >= 0),
  shipping_total numeric(12,2) not null default 0 check (shipping_total >= 0),
  total          numeric(12,2) not null check (total >= 0),
  item_count     integer not null check (item_count >= 1),
  coupon_code    citext,
  -- snapshot of the shipping address at placement time (nullable in this build)
  address        jsonb,
  placed_at      timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index orders_user_idx       on public.orders (user_id, created_at desc);
create index orders_status_idx     on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  variant_size_id uuid references public.variant_sizes(id) on delete set null,
  name            text not null,
  slug            text not null,
  image_url       text,
  color           text not null,
  size            text not null,
  unit_price      numeric(12,2) not null check (unit_price >= 0),
  quantity        integer not null check (quantity >= 1),
  line_total      numeric(12,2) not null check (line_total >= 0)
);
create index order_items_order_idx on public.order_items (order_id);
