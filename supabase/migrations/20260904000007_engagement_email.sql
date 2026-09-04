-- 0007 — engagement + outbound email
--   stock notifications, recently-viewed, newsletter, contact, email outbox

-- ---- back-in-stock notifications -----------------------------------
create table public.stock_notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.users(id) on delete cascade,
  email           citext not null,
  variant_size_id uuid not null references public.variant_sizes(id) on delete cascade,
  notified_at     timestamptz,
  created_at      timestamptz not null default now()
);
-- one live request per email + size
create unique index stock_notifications_pending_uidx
  on public.stock_notifications (email, variant_size_id)
  where notified_at is null;

-- ---- recently viewed -------------------------------------------------
create table public.recently_viewed (
  user_id    uuid not null references public.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index recently_viewed_user_idx on public.recently_viewed (user_id, viewed_at desc);

-- keep at most 30 rows per user
create or replace function public.trim_recently_viewed()
returns trigger
language plpgsql
as $$
begin
  delete from public.recently_viewed rv
  where rv.user_id = new.user_id
    and rv.product_id not in (
      select product_id from public.recently_viewed
      where user_id = new.user_id
      order by viewed_at desc
      limit 30
    );
  return null;
end;
$$;
create trigger recently_viewed_trim
  after insert on public.recently_viewed
  for each row execute function public.trim_recently_viewed();

-- ---- newsletter ----------------------------------------------------
create table public.newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           citext not null unique,
  is_confirmed    boolean not null default false,
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz,
  source          text,
  created_at      timestamptz not null default now()
);

-- ---- contact messages -------------------------------------------
create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      citext not null,
  subject    text,
  message    text not null check (length(message) between 1 and 8000),
  status     contact_status not null default 'new',
  created_at timestamptz not null default now()
);
create index contact_messages_status_idx on public.contact_messages (status, created_at desc);

-- ---- email outbox ------------------------------------------------
-- Every outbound email (order confirmation, verify, reset, back-in-stock,
-- newsletter confirm) is written here. A worker / Edge Function drains it.
create table public.email_outbox (
  id         uuid primary key default gen_random_uuid(),
  to_email   citext not null,
  template   text not null,
  payload    jsonb not null default '{}'::jsonb,
  status     email_status not null default 'queued',
  attempts   integer not null default 0,
  error      text,
  created_at timestamptz not null default now(),
  sent_at    timestamptz
);
create index email_outbox_pending_idx
  on public.email_outbox (created_at) where status in ('queued', 'failed');

-- When a size goes from 0 → in stock, queue notifications for anyone waiting.
create or replace function public.variant_sizes_after_restock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(old.stock, 0) = 0 and new.stock > 0 then
    insert into public.email_outbox (to_email, template, payload)
    select sn.email, 'back_in_stock',
           jsonb_build_object('variantSizeId', new.id)
    from public.stock_notifications sn
    where sn.variant_size_id = new.id and sn.notified_at is null;

    update public.stock_notifications
      set notified_at = now()
    where variant_size_id = new.id and notified_at is null;
  end if;
  return null;
end;
$$;
create trigger variant_sizes_restock_notify
  after update of stock on public.variant_sizes
  for each row execute function public.variant_sizes_after_restock();
