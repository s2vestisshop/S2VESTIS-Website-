-- 0008 — hero_slides: editable home-page hero carousel content
--
-- Replaces the hard-coded client/src/data/heroSlides.ts list (which stays in the
-- repo as the offline fallback / seed). Managed from the admin panel:
-- GET/POST/PUT/DELETE /api/admin/hero-slides  (+ PUT .../reorder).
--
-- NOTE: reseed_demo_data() does NOT truncate this table — marketing content
-- survives a product reseed.

create table public.hero_slides (
  id             uuid primary key default gen_random_uuid(),
  image_url      text not null,
  align          text not null default 'left' check (align in ('left', 'center')),
  eyebrow        text not null default '',
  title          text not null check (length(title) between 1 and 160),
  subtitle       text not null default '',
  cta_text       text not null default 'Shop now',
  cta_link       text not null default '/products',
  secondary_text text not null default '',
  secondary_link text not null default '',
  sort_order     integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index hero_slides_order_idx on public.hero_slides (sort_order, created_at);

create trigger hero_slides_set_updated_at
  before update on public.hero_slides
  for each row execute function public.set_updated_at();

-- RLS safety net (the Express API uses the service-role key and bypasses this):
-- anon / authenticated may read active slides only, and write nothing.
alter table public.hero_slides enable row level security;

create policy "hero: read active slides"
  on public.hero_slides for select to anon, authenticated
  using (is_active);

-- Seed with the four launch slides, but only if the table is still empty
-- (keeps this migration a no-op on databases that already have content).
insert into public.hero_slides
  (image_url, align, eyebrow, title, subtitle, cta_text, cta_link, secondary_text, secondary_link, sort_order)
select * from (values
  ('/hero/hero-1.jpg', 'left', 'New Season',
   'Considered essentials, made to be worn out.',
   'Premium fabric, clean cuts, honest pricing. Build a wardrobe that lasts from the S2VESTIS core range.',
   'Shop the collection', '/products', 'Shop women', '/products?gender=women', 0),
  ('/hero/hero-2.jpg', 'left', 'Linen, refreshed',
   'Breathable linen shirts for long, warm days.',
   'Relaxed cuts in pure linen and linen blends — camp collars, band collars, resort fits.',
   'Shop linen shirts', '/products?category=linen-shirts', '', '', 1),
  ('/hero/hero-3.jpg', 'center', 'The heavyweight edit',
   'Hoodies & sweats with real weight to them.',
   'Loopback cotton, brushed backs, boxy fits. Layering pieces that hold their shape.',
   'Shop fleece', '/products?category=hoodies', 'Sweatshirts', '/products?category=sweatshirts', 2),
  ('/hero/hero-4.jpg', 'left', 'Move in it',
   'Sportswear that keeps up and dresses down.',
   'Performance tees, compression leggings and featherweight layers for training and after.',
   'Shop sportswear', '/products?category=sportswear', '', '', 3)
) as s(image_url, align, eyebrow, title, subtitle, cta_text, cta_link, secondary_text, secondary_link, sort_order)
where not exists (select 1 from public.hero_slides);
