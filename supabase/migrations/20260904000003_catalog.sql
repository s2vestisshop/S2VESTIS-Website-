-- 0003 — catalog: categories, products, variants, images, sizes

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(name) between 1 and 80),
  slug       text not null unique,
  gender     gender_target not null default 'unisex',
  image_url  text,
  is_active  boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create table public.products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (length(name) between 1 and 160),
  slug           text not null unique,
  description    text not null default '',
  category_id    uuid not null references public.categories(id) on delete restrict,
  gender         gender_target not null default 'unisex',
  price          numeric(12,2) not null check (price >= 0),
  discount_price numeric(12,2) check (discount_price >= 0),
  is_featured    boolean not null default false,
  is_active      boolean not null default true,
  rating_avg     numeric(3,2) not null default 0 check (rating_avg between 0 and 5),
  rating_count   integer not null default 0 check (rating_count >= 0),

  -- server-computed, mirrors the current Mongoose pre-save logic
  effective_price numeric(12,2) generated always as (
    case
      when discount_price is not null and discount_price > 0 and discount_price < price
        then discount_price
      else price
    end
  ) stored,
  discount_percent integer generated always as (
    case
      when discount_price is not null and discount_price > 0 and discount_price < price
        then round((price - discount_price) / price * 100)::int
      else 0
    end
  ) stored,

  search_tsv tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create index products_category_idx      on public.products (category_id);
create index products_active_featured_idx on public.products (is_active, is_featured);
create index products_effective_price_idx on public.products (effective_price);
create index products_created_at_idx     on public.products (created_at desc);
create index products_search_tsv_idx     on public.products using gin (search_tsv);
create index products_name_trgm_idx      on public.products using gin (name gin_trgm_ops);

create table public.product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color      text not null,
  color_hex  text not null default '#000000',
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, color)
);
create index product_variants_product_idx on public.product_variants (product_id);

create table public.variant_images (
  id         uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  url        text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index variant_images_variant_idx on public.variant_images (variant_id, position);

create table public.variant_sizes (
  id         uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  size       text not null,
  stock      integer not null default 0 check (stock >= 0),
  sku        text,
  created_at timestamptz not null default now(),
  unique (variant_id, size)
);
create index variant_sizes_variant_idx on public.variant_sizes (variant_id);
