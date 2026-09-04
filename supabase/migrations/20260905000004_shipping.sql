-- 0019 (2026-09-05) — Shiprocket integration schema: a generic cached-token
-- table (any future courier/API integration can reuse the same table, one
-- row per provider), delivery timestamp/tracking columns on orders, and an
-- append-only shipment event log for the customer timeline + admin/debug
-- history. See 20260905000005_functions_shipping.sql for the admin RPCs.

create table public.integration_tokens (
  provider   text primary key,
  token      text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column shiprocket_order_id text,
  add column shiprocket_shipment_id text,
  add column awb_code text,
  add column courier_name text,
  add column tracking_url text,
  add column shipped_at timestamptz,
  add column out_for_delivery_at timestamptz,
  add column delivered_at timestamptz,
  add column estimated_delivery_date date;

create table public.shipment_events (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  -- free-text, not the order_status enum: Shiprocket reports interim
  -- statuses (e.g. "Pickup Scheduled", "AWB Assigned") that don't map to one
  -- of our tracked milestones but are still worth keeping for the timeline.
  status      text not null,
  description text,
  occurred_at timestamptz not null default now(),
  raw_payload jsonb,
  created_at  timestamptz not null default now()
);
create index shipment_events_order_idx on public.shipment_events (order_id, occurred_at);

alter table public.integration_tokens enable row level security;
alter table public.shipment_events enable row level security;
-- No policies on either — deny-by-default for anon/authenticated, same as
-- every other non-catalog table (service_role, used exclusively by the
-- Express API, bypasses RLS).
