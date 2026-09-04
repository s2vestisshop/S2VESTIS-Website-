-- 0004 — cart + wishlist

create table public.carts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  guest_token text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- a cart belongs to exactly one of: a user, or a guest cookie
  constraint cart_owner_chk check (
    (user_id is not null and guest_token is null) or
    (user_id is null and guest_token is not null)
  )
);
create unique index carts_user_uidx  on public.carts (user_id)     where user_id is not null;
create unique index carts_guest_uidx on public.carts (guest_token) where guest_token is not null;
create trigger carts_set_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

create table public.cart_items (
  id              uuid primary key default gen_random_uuid(),
  cart_id         uuid not null references public.carts(id) on delete cascade,
  variant_size_id uuid not null references public.variant_sizes(id) on delete cascade,
  quantity        integer not null default 1 check (quantity between 1 and 99),
  price_at_add    numeric(12,2) not null check (price_at_add >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (cart_id, variant_size_id)
);
create index cart_items_cart_idx on public.cart_items (cart_id);
create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

-- keep the parent cart's updated_at fresh when items change
create or replace function public.touch_cart()
returns trigger
language plpgsql
as $$
begin
  update public.carts set updated_at = now()
  where id = coalesce(new.cart_id, old.cart_id);
  return null;
end;
$$;
create trigger cart_items_touch_cart
  after insert or update or delete on public.cart_items
  for each row execute function public.touch_cart();

create table public.wishlist_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index wishlist_items_user_idx on public.wishlist_items (user_id);
