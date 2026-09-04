# S2VESTIS · Supabase database

PostgreSQL schema for S2VESTIS — everything the current app uses **plus** the
roadmap features: product reviews, admin order & user management, password
reset / email verification, an outbound-email outbox, coupons, saved addresses,
back-in-stock alerts, recently-viewed, and relevance search.

## Auth model

Supabase **Auth is disabled**. The Express API keeps its own bcrypt + JWT
(httpOnly cookie) auth; users live in `public.users`. Password-reset and
email-verification use single-use hashed tokens in `public.auth_tokens`.

The API connects with the **service-role key**, which bypasses RLS. RLS is still
enabled on every table as a safety net — only active catalog data is readable by
the `anon` / `authenticated` roles, and nothing is writable by them.

## Apply it

### Hosted project (recommended — no Docker)

```bash
npm i -g supabase                       # or: npx supabase ...
supabase link --project-ref <your-ref>  # from the project's dashboard URL
supabase db push                        # runs ./migrations in order
```

Then load demo data — paste [`seed.sql`](seed.sql) into the dashboard SQL editor,
or:

```bash
supabase db reset --linked              # ⚠️ drops & recreates: migrations + seed.sql
```

### Local (needs Docker)

```bash
supabase start                          # spins up Postgres + Studio + API
supabase db reset                       # migrations + seed.sql
# Studio: http://localhost:54323
```

## Wire the API to it

Add to `server/.env`:

```
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role key from Project Settings → API>
# (MONGO_URI is no longer used once the backend is switched over)
```

## Schema map

| Area | Tables |
| --- | --- |
| Identity | `users`, `auth_tokens` |
| Catalog | `categories`, `products`, `product_variants`, `variant_images`, `variant_sizes` |
| Cart / wishlist | `carts` (user **or** `guest_token`), `cart_items` (→ `variant_sizes`), `wishlist_items` |
| Orders | `orders`, `order_items` |
| Reviews | `reviews` (1 per user/product; recomputes `products.rating_avg`/`rating_count`) |
| Commerce | `coupons`, `coupon_redemptions`, `addresses` (one default per user) |
| Engagement | `stock_notifications`, `recently_viewed` (capped at 30/user) |
| Messaging | `newsletter_subscribers`, `contact_messages`, `email_outbox` |

`products.effective_price`, `products.discount_percent` and `products.search_tsv`
are **generated columns** — no application logic needed to keep them in sync.

## RPC functions (call from the API via the service-role client)

| Function | Purpose |
| --- | --- |
| `search_products(q, limit, offset)` / `search_products_count(q)` | full-text + trigram, relevance-ranked |
| `search_suggestions(q, limit)` | autocomplete (product names + categories) |
| `validate_coupon(code, subtotal, user_id)` → `(valid, discount, message)` | coupon check |
| `merge_guest_cart(guest_token, user_id)` | login/register cart merge (qty summed, capped 99) |
| `place_order(cart_id, user_id, coupon_code, address_jsonb)` → `order_id` | **atomic** demo checkout: locks stock, validates, decrements, snapshots items, applies coupon + records redemption, clears the cart, queues the confirmation email. Raises `P0001` with prefixes `EMPTY_CART` / `INSUFFICIENT_STOCK:<name>:<size>` / `INVALID_COUPON:<msg>`. |

## Still needs a worker / Edge Function

- **`email_outbox` drainer** — a cron Edge Function (or a small Node worker) that
  reads `status in ('queued','failed')` rows, sends via your provider (Resend /
  SES / Postmark), and marks `sent` / `failed`. Templates referenced:
  `order_confirmation`, `email_verify`, `password_reset`, `back_in_stock`,
  `newsletter_confirm`.
- Optional: `pg_cron` job calling `purge_expired_auth_tokens()` daily.

## Migrations

| File | Contents |
| --- | --- |
| `…0001_init_extensions_types` | extensions, enum types, `set_updated_at()`, `slugify()` |
| `…0002_users_auth` | `users`, `auth_tokens`, `purge_expired_auth_tokens()` |
| `…0003_catalog` | categories, products (generated cols + tsv), variants, images, sizes |
| `…0004_cart_wishlist` | carts, cart_items, wishlist_items, `touch_cart()` |
| `…0005_orders` | orders, order_items |
| `…0006_reviews_addresses_coupons` | reviews (+ rating recompute), addresses (+ single-default), coupons |
| `…0007_engagement_email` | stock_notifications, recently_viewed, newsletter, contact, email_outbox, restock trigger |
| `…0008_functions` | search, `validate_coupon`, `merge_guest_cart`, `place_order` |
| `…0009_rls` | enable RLS everywhere; public read policies; function grants |
