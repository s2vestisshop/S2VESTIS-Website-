-- 0009 (2026-09-06) — announcements: the rotating top-bar strip above the navbar
--
-- Replaces the hard-coded "Free shipping over ₹1999 · Easy 15-day returns" line
-- in Navbar.tsx. Managed from Admin → Announcements
-- (GET/POST/PUT/DELETE /api/admin/announcements + PUT .../reorder).
-- The bar cycles through every active row; `href` is optional (makes the
-- message a link). Not truncated by reseed_demo_data().

create table public.announcements (
  id         uuid primary key default gen_random_uuid(),
  text       text not null check (length(text) between 1 and 200),
  href       text not null default '',
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index announcements_order_idx on public.announcements (sort_order, created_at);

create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

alter table public.announcements enable row level security;

create policy "announcements: read active"
  on public.announcements for select to anon, authenticated
  using (is_active);

-- seed the two launch messages, only if the table is still empty
insert into public.announcements (text, href, sort_order)
select * from (values
  ('Free shipping over ₹1999', '/shipping', 0),
  ('Easy 15-day returns', '/shipping', 1)
) as s(text, href, sort_order)
where not exists (select 1 from public.announcements);
