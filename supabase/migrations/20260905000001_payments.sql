-- 0016 (2026-09-05) — real payments: a staging table for in-flight Razorpay
-- checkouts, plus the payment columns place_order() will write once a
-- payment is actually confirmed. See 0017_functions_payments.sql for the
-- functions that use these.
--
-- Nothing here touches pricing: an `orders` row (and its stock decrement)
-- still only ever gets created by place_order(), and only after payment is
-- verified — payment_attempts exists purely so a Razorpay order can be sized
-- and tracked *before* that happens, without ever locking stock for a
-- checkout that might be abandoned.

do $$ begin
  create type payment_attempt_status as enum ('created', 'paid', 'failed');
exception when duplicate_object then null; end $$;

create table public.payment_attempts (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users(id) on delete cascade,
  cart_id              uuid not null references public.carts(id) on delete cascade,
  order_id             uuid references public.orders(id) on delete set null,
  razorpay_order_id    text not null unique,
  razorpay_payment_id  text unique,
  amount               numeric(12,2) not null check (amount >= 0),
  currency             text not null default 'INR',
  coupon_code          citext,
  address              jsonb not null,
  status               payment_attempt_status not null default 'created',
  failure_reason       text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index payment_attempts_user_idx on public.payment_attempts (user_id, created_at desc);
create trigger payment_attempts_set_updated_at
  before update on public.payment_attempts
  for each row execute function public.set_updated_at();
alter table public.payment_attempts enable row level security;
-- No policies: deny-by-default for anon/authenticated, same as every other
-- non-catalog table (service_role, used exclusively by the Express API,
-- bypasses RLS).

alter table public.orders
  add column razorpay_order_id text,
  add column razorpay_payment_id text unique,
  add column payment_method text,
  add column paid_at timestamptz,
  add column payment_review_required boolean not null default false,
  add column payment_review_note text;
