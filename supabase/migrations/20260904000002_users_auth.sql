-- 0002 — users + auth tokens (password reset / email verification)

create table public.users (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (length(name) between 1 and 120),
  email          citext not null unique,
  password_hash  text not null,
  role           user_role not null default 'customer',
  email_verified boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Single-use, hashed tokens. The raw token is emailed; only its sha256 is stored.
create table public.auth_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  purpose     token_purpose not null,
  token_hash  text not null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index auth_tokens_token_hash_idx on public.auth_tokens (token_hash);
create index auth_tokens_user_purpose_idx on public.auth_tokens (user_id, purpose);

-- Helper the API can call to burn expired tokens (or run from pg_cron).
create or replace function public.purge_expired_auth_tokens()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  delete from public.auth_tokens
  where expires_at < now() - interval '1 day' or used_at is not null;
  get diagnostics n = row_count;
  return n;
end;
$$;
