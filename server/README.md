# S2VESTIS — Backend API

Node.js + Express 5 + **Supabase (PostgreSQL)** REST API for the S2VESTIS apparel store.
The Express layer holds all business logic; Postgres holds a set of `SECURITY
DEFINER` RPC functions (search, cart, orders, admin CRUD) that the API calls
with the service-role key. See [`../supabase/README.md`](../supabase/README.md)
for the schema itself.

> **Out of scope (this build):** real payment capture / a payment gateway, and
> live shipment tracking. `POST /orders` records a **demo order** (no payment,
> status always `demo-placed`) so a signed-in user has an order history.

## Requirements

- Node.js ≥ 18 (tested on 22)
- A Supabase project with the schema in [`../supabase/migrations/`](../supabase/migrations) applied — see that folder's README for setup. There is no local/offline mode; the API always talks to a real Postgres over the network.

## Setup

```bash
cd server
cp .env.example .env        # fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npm install
npm run seed                # wipes + loads ~33 demo products, 8 categories, 2 users
npm run dev                 # http://localhost:5050
```

### Environment variables (`.env`)

| Key | Default | Notes |
| --- | --- | --- |
| `PORT` | `5050` | API port |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin (Vite dev server) |
| `SUPABASE_URL` | — | Project Settings → API in the Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | — | same page — **server-side only**, bypasses RLS, never expose to the client |
| `JWT_SECRET` | _(required in prod)_ | long random string |
| `JWT_EXPIRES_IN` | `7d` | token + cookie lifetime |
| `COOKIE_SECURE` | `false` | set `true` behind HTTPS |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | _(empty)_ | if **all three** set → uploads go to Cloudinary; otherwise they are stored under `server/uploads/` and served from `/uploads/...` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | `admin@s2vestis.com` / `Admin@12345` | created by `npm run seed` |
| `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` | `user@s2vestis.com` / `User@12345` | created by `npm run seed` |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | start with nodemon |
| `npm start` | start once |
| `npm run seed` | calls `public.reseed_demo_data()` over the network — wipes and reloads all demo data on the configured Supabase project |
| `npm run smoke` | reseeds the configured Supabase project, then runs ~56 end-to-end API assertions against the real running app. ⚠️ Never point this at a project holding real data — it wipes everything first. |

## Auth model

- JWT stored in an **httpOnly cookie** (`token`), `SameSite=Lax`.
- Guests get a `guestId` httpOnly cookie so carts work before login.
- On `register` / `login` the guest cart is **merged** into the user cart
  (matching lines by product + colour + size, quantities summed, capped at 20).
- Auth routes are rate-limited (20 requests / 15 min / IP); the rest of the API
  is limited to 600 / 15 min / IP.

## API reference

Base path: `/api`. All responses are JSON `{ success, ... }`. Errors:
`{ success: false, message, errors?: [{ field, message }] }`.

### Health
- `GET /api/health`

### Auth
| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/auth/register` | `{ name, email, password }` | sets cookie, merges guest cart |
| POST | `/auth/login` | `{ email, password }` | sets cookie, merges guest cart |
| POST | `/auth/logout` | – | clears cookie |
| GET | `/auth/me` | – | `{ user }` or `{ user: null }` |

### Products (public)
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/products` | query: `category` (slug or id), `gender`, `search`, `minPrice`, `maxPrice`, `size`, `color`, `ids`, `sort` (`price-asc`\|`price-desc`\|`newest`\|`popularity`), `page`, `limit` (≤60), `featured`. `size`, `color` & `ids` accept multiple values — repeat the param (`?size=S&size=M`) or comma-separate (`?color=Black,Navy`). `ids` fetches a specific set of products (wishlist hydration). |
| GET | `/products/:slug` | full detail incl. all variants |
| GET | `/products/:slug/related` | up to 8, same category, excludes itself |

`GET /products` response includes `pagination: { page, limit, total, pages, hasNextPage }`.

### Categories (public)
- `GET /categories` — active categories. `?withCounts=true` adds `productCount`.

### Cart (guest via `guestId` cookie, or the logged-in user)
| Method | Path | Body |
| --- | --- | --- |
| GET | `/cart` | – |
| POST | `/cart/add` | `{ productId, color, size, quantity? }` |
| PUT | `/cart/update` | `{ itemId, quantity }` |
| DELETE | `/cart/remove/:itemId` | – |
| DELETE | `/cart/clear` | – |

Cart responses: `{ cart: { _id, items: [{ _id, product, color, size, quantity, priceAtAdd, lineTotal }], subtotal, count } }`.
Stock is validated on add/update against the product's variant/size.

### Wishlist (auth required)
| Method | Path | Body |
| --- | --- | --- |
| GET | `/wishlist` | – |
| POST | `/wishlist/add` | `{ productId }` |
| DELETE | `/wishlist/remove/:productId` | – |

### Orders — **demo only** (auth required)
No payment capture, no fulfilment / shipment tracking. `status` is always `demo-placed`.
| Method | Path | Notes |
| --- | --- | --- |
| POST | `/orders` | snapshots the user's cart into an order, **clears the cart**, returns `{ orderNumber, items, itemCount, total, status }`; 400 if the cart is empty |
| GET | `/orders` | the current user's orders, newest first |
| GET | `/orders/:id` | one of the user's own orders |

### Admin (auth required, `role: "admin"`)
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/stats` | dashboard counts + low-stock list (≤5 units) |
| GET | `/admin/products` | includes inactive; query: `search`, `category`, `status` (`active`\|`inactive`), `page`, `limit` |
| GET | `/admin/products/:id` | single product |
| POST | `/admin/products` | see body below |
| PUT | `/admin/products/:id` | partial update; pricing recalculated |
| DELETE | `/admin/products/:id` | hard delete |
| GET | `/admin/categories` | includes inactive |
| POST | `/admin/categories` | `{ name, gender?, image?, isActive? }` |
| PUT | `/admin/categories/:id` | partial update |
| DELETE | `/admin/categories/:id` | blocked if products still reference it |
| POST | `/admin/upload` | `multipart/form-data`, field `images` (≤10) or `image`; returns `{ storage, urls }` |

**Create/update product body**

```jsonc
{
  "name": "Everyday Supima Crew Tee",
  "description": "...",
  "category": "<categoryId>",
  "gender": "men",              // men | women | unisex
  "price": 1299,
  "discountPrice": 999,          // or null
  "isFeatured": true,
  "isActive": true,              // false = draft
  "variants": [
    {
      "color": "Black",
      "colorHex": "#111111",
      "images": ["https://.../1.jpg", "https://.../2.jpg"],
      "sizes": [
        { "size": "S", "stock": 12 },
        { "size": "M", "stock": 0 }
      ]
    }
  ]
}
```

`discountPercent` and `effectivePrice` (`= discountPrice ?? price`) are computed
server-side and used for price filtering/sorting.

## Project layout

```
server/
├── seed.js                     # CLI wrapper → calls public.reseed_demo_data() over the network
├── scripts/smoke.js            # end-to-end HTTP test against the live app + Supabase
└── src/
    ├── app.js                  # express app (middleware, routes, error handling)
    ├── server.js               # verify Supabase reachable + listen
    ├── config/                 # env, supabase client, cloudinary
    ├── db/                     # data-access layer — one module per resource, wraps
    │                           #   supabase-js calls / RPCs, shapes rows into the
    │                           #   camelCase JSON the frontend expects
    ├── middleware/             # auth, guest, validate, rateLimiter, upload, error
    ├── validators/              # express-validator chains
    ├── controllers/             # thin — call src/db/*, no query logic here
    └── routes/
```

Almost all query/business logic (filtering, search ranking, cart merge, atomic
order placement + stock decrement, product/variant tree writes) lives in
Postgres `SECURITY DEFINER` functions in `../supabase/migrations/`, not in
`src/db/`. That keeps the Express layer thin and the data layer transactionally
correct regardless of which client calls it.
