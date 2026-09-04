-- S2VESTIS · Supabase schema
-- 0001 — extensions, enum types, shared helpers
--
-- Auth model: the Express API keeps its own bcrypt + JWT auth. Application rows
-- live in `public` and are written by the API using the service-role key, which
-- bypasses RLS. RLS is enabled everywhere as a safety net; only public catalog
-- data is readable by anon / authenticated roles (see 0009_rls.sql).

create extension if not exists pgcrypto;      -- gen_random_uuid(), gen_random_bytes()
create extension if not exists citext;        -- case-insensitive email / coupon code
create extension if not exists pg_trgm;       -- trigram search / autocomplete
create extension if not exists unaccent;      -- accent-insensitive search helper

-- ---- enum types -----------------------------------------------------------
do $$ begin
  create type user_role       as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gender_target   as enum ('men', 'women', 'unisex');
exception when duplicate_object then null; end $$;

do $$ begin
  -- 'demo-placed' keeps the current frontend contract; the rest are the roadmap.
  create type order_status     as enum
    ('demo-placed', 'pending-payment', 'paid', 'fulfilled', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type coupon_type      as enum ('percent', 'fixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type token_purpose    as enum ('password_reset', 'email_verify');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contact_status   as enum ('new', 'read', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type email_status     as enum ('queued', 'sending', 'sent', 'failed');
exception when duplicate_object then null; end $$;

-- ---- shared: updated_at maintenance -------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger fn: bumps updated_at to now().';

-- ---- shared: slugify (lowercase, ascii, hyphen-collapsed) --------------
create or replace function public.slugify(txt text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(lower(coalesce(txt, '')), '[^a-z0-9]+', '-', 'g')
  );
$$;
