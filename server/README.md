# S2VESTIS — Backend API

Node.js + Express 5 + MongoDB (Mongoose) REST API for the S2VESTIS apparel store.

> **Out of scope (this build):** payment gateway, checkout payment flow, order
> tracking/shipment status. The `Order` model exists as a stub only.

## Requirements

- Node.js ≥ 18 (tested on 22)
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

## Setup

```bash
cd server
cp .env.example .env        # then edit values
npm install
npm run seed                # wipes + loads ~33 demo products, 8 categories, 2 users
npm run dev                 # http://localhost:5050
```

### Environment variables (`.env`)

| Key | Default | Notes |
| --- | --- | --- |
| `PORT` | `5050` | API port |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin (Vite dev server) |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/s2vestis` | connection string |
| `JWT_SECRET` | _(required in prod)_ | long random string |
| `JWT_EXPIRES_IN` | `7d` | token + cookie lifetime |
| `COOKIE_SECURE` | `false` | set `true` behind HTTPS |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | _(empty)_ | if **all three** set → uploads go to Cloudinary; otherwise they are stored under `server/uploads/` and served from `/uploads/...` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | `admin@s2vestis.com` / `Admin@12345` | created by `npm run seed` |
| `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` | `user@s2vestis.com` / `User@12345` | created by `npm run seed` |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | start with nodemon (needs a real MongoDB) |
| `npm run dev:mem` | start against a throwaway **in-memory MongoDB**, auto-seeded — no local mongod required |
| `npm start` | start once |
| `npm run seed` | wipe + reseed demo data |
| `npm run seed:destroy` | wipe all collections |
| `npm run smoke` | spin up an **in-memory MongoDB**, seed it, and run ~45 end-to-end API assertions (no external services needed) |

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
├── seed.js                     # CLI wrapper around src/seed/seedData.js
├── scripts/smoke.js            # in-memory end-to-end test
└── src/
    ├── app.js                  # express app (middleware, routes, error handling)
    ├── server.js               # connect DB + listen
    ├── config/                 # env, db, cloudinary
    ├── models/                 # User, Category, Product, Cart, Wishlist, Order
    ├── middleware/             # auth, guest, validate, rateLimiter, upload, error
    ├── validators/            # express-validator chains
    ├── controllers/
    ├── services/cartService.js # cart resolve / merge / serialize
    ├── routes/
    └── seed/seedData.js
```
