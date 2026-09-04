# S2VESTIS

A full-stack apparel e-commerce store — T-Shirts, Polos, Tees, Shirts, Linen
Shirts, Sportswear, Sweatshirts and Hoodies for men & women.

**Monorepo** — [`server/`](server) (Node + Express 5 + Supabase/PostgreSQL) · [`client/`](client) (Vite + React 19 + TypeScript + Tailwind + Redux Toolkit) · [`supabase/`](supabase) (schema, RLS, RPC functions, seed).

> **Out of scope for this build:** real payment capture / a payment gateway, and
> live shipment tracking. `/checkout` places a **demo order** (no payment) that a
> signed-in user can see under *Account → Orders*; there is no fulfilment status.
> A real payment + delivery flow is a planned follow-up.

Built in 9 phases — backend foundation → frontend foundation → home → gallery →
product detail → cart & wishlist → auth → admin → polish — plus content pages,
a size guide, demo order history, and a full migration from MongoDB to
Supabase/PostgreSQL. **All complete.**

---

## Quick start

Requires **Node ≥ 18** (tested on 22) and a **Supabase project** (free tier) —
see [`supabase/README.md`](supabase/README.md) to create one and apply the schema.
There's no offline/in-memory mode; the API always talks to a real Postgres.

**Terminal 1 — backend**
```bash
cd server
cp .env.example .env      # fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npm install
npm run seed               # wipes + loads demo categories/products/users
npm run dev                # → http://localhost:5050
```

**Terminal 2 — frontend**
```bash
cd client
cp .env.example .env
npm install
npm run dev           # → http://localhost:5173  (proxies /api and /uploads to :5050)
```

Open **http://localhost:5173**.

### Demo accounts (created by the seed)

| Role  | Email                 | Password     |
| ----- | --------------------- | ------------ |
| Admin | `admin@s2vestis.com`  | `Admin@12345` |
| User  | `user@s2vestis.com`   | `User@12345`  |

The seed also loads **8 categories** and **~33 products** with colour variants,
per-size stock, discounts and featured flags.

---

## Features

**Storefront**
- Home: auto-rotating hero carousel (editable slide array, crossfade, arrows,
  dots, pause-on-hover, reduced-motion aware), category showcase, live trending row.
- Product gallery: URL-driven filters (category, gender, price range, multi-select
  size & colour), sort, infinite scroll + "Load more", skeleton / empty / error states.
- Product cards: image hover-swap, discount badge, wishlist heart, colour swatches
  that swap the image, and a hover **quick-add** size picker.
- Product detail: image gallery with hover-zoom, colour selector (swaps images and
  size availability), size selector (out-of-stock greyed), stock-capped quantity
  stepper, Add to Cart / Buy Now, wishlist toggle, details accordion, related carousel.
- Cart: global slide-in drawer on every page + full `/cart` page (editable line
  items, stock-capped steppers, order summary, free-shipping nudge).
- Wishlist: `/wishlist` grid with "Move to cart" and remove; works for guests
  (localStorage) and syncs to the account on login.
- Checkout: demo-only cart review → **atomic** order placement (stock decrement,
  cart clear, one transaction) → "Order placed (demo)" confirmation.
- Auth: `/login` + `/register` with inline + server-side validation, redirect-back
  to the page you came from, `/account` overview with **demo order history**.
- Guest **cart and wishlist merge into the account on login/register**.
- Size guide (modal from any product page + `/size-guide`), and content pages:
  About, Contact, FAQ, Shipping & Returns, Stores, Sustainability.

**Admin** (`/admin`, role `admin` only)
- Dashboard: product / category / user counts + low-stock list.
- Products table: debounced search, category & status filters, active/inactive
  toggle, edit, delete, pagination.
- Product form: basics + a dynamic **variant builder** — add a colour → upload
  multiple images for it → size + stock rows. Save as draft or publish. Creates
  and updates the whole variant/image/size tree atomically.
- Categories: CRUD with image upload; delete is blocked while products reference it.

**Cross-cutting**
- JWT in an httpOnly cookie, bcrypt hashing, `express-validator`, centralized
  error handling, rate limiting on auth routes.
- Image uploads via Multer → Cloudinary when configured, else local `./uploads`.
- Route-level code-splitting, a top-level error boundary, mobile-first responsive
  layout (verified at 375 / 768 / 1280).
- Postgres full-text + trigram search, Row Level Security on every table
  (Express uses the service-role key; RLS is the safety net for any other client).

---

## Tech stack

| | |
| --- | --- |
| **Frontend** | React 19, Vite 6, TypeScript, Tailwind CSS 3 (bespoke token palette), React Router 7, Redux Toolkit (`auth` / `cart` / `wishlist` / `ui` slices + listener middleware), Axios, Framer Motion, lucide-react |
| **Backend** | Express 5, `@supabase/supabase-js` (service-role client), JWT (httpOnly cookies), bcryptjs, express-validator, express-rate-limit, Multer, Cloudinary (optional), Helmet, Morgan |
| **Database** | Supabase / PostgreSQL — hand-written schema (not an ORM): generated columns for pricing, `SECURITY DEFINER` RPC functions for search / cart / atomic order placement / admin writes, RLS on every table |
| **State persistence** | Server-backed cart for everyone — guest carts keyed by a `guestId` cookie, merged into the account on login. localStorage caches the cart snapshot and holds the guest wishlist. |

---

## Project structure

```
S2VESTIS-Website/
├── server/                     # Express API
│   ├── seed.js                 # CLI → calls public.reseed_demo_data() over the network
│   ├── scripts/smoke.js        # end-to-end HTTP test against the live app (56 assertions)
│   └── src/
│       ├── app.js  server.js
│       ├── config/             # env, supabase client, cloudinary
│       ├── db/                 # data-access layer — one module per resource
│       ├── middleware/  validators/  controllers/  routes/
├── supabase/                   # PostgreSQL schema
│   ├── migrations/             # numbered, applied in order (SQL Editor or CLI)
│   ├── seed.sql                # SQL Editor convenience wrapper around reseed_demo_data()
│   └── README.md
└── client/                     # Vite + React SPA
    └── src/
        ├── app/                # store, typed hooks, listener middleware
        ├── features/           # redux slices
        ├── api/                # axios client + typed endpoint modules
        ├── router/AppRoutes.tsx
        ├── components/         # layout, cart, product, gallery, admin, auth, ui, common
        ├── hooks/  lib/  data/  types/
        └── pages/              # one file per route (+ pages/admin/)
```

Full API reference → [`server/README.md`](server/README.md).
Database schema & RPCs → [`supabase/README.md`](supabase/README.md).
Frontend design tokens & architecture → [`client/README.md`](client/README.md).
Deploying to production (Render + Vercel) → [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## Verify

```bash
cd server && npm run smoke     # reseeds the configured Supabase project, runs 56 API assertions
cd client && npm run build     # tsc typecheck + production build
cd client && npm run lint      # eslint
```

⚠️ `npm run smoke` (and `npm run seed`) **wipe all data** in whatever Supabase
project `server/.env` points at — never run them against a project holding
real data.

---

## Configuration

**`server/.env`** (see `.env.example` for all keys)

| Key | Default | Notes |
| --- | --- | --- |
| `PORT` | `5050` | API port (5000 avoided — macOS AirPlay Receiver uses it) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | — | Project Settings → API in the Supabase dashboard. Server-side only. |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin |
| `JWT_SECRET` | — | set a long random string for anything non-local |
| `CLOUDINARY_*` | empty | set all three to send uploads to Cloudinary; otherwise local `./uploads` |

**`client/.env`**

| Key | Default | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | leave as-is to use the dev proxy |
| `VITE_API_PROXY` | `http://localhost:5050` | dev proxy target |

---

## Troubleshooting

- **`EADDRINUSE` / weird 403s on the API** — on macOS, AirPlay Receiver squats on
  port 5000; this project uses **5050**. If 5050 is taken, set `PORT` in
  `server/.env` and `VITE_API_PROXY` in `client/.env` to match.
- **Server fails to start with a Supabase error** — check `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` in `server/.env`, and that all migrations in
  `supabase/migrations/` have been applied (see [`supabase/README.md`](supabase/README.md)).
- **`npm install` fails on peer deps** — use Node ≥ 18 and a clean `node_modules`.
- **Images are grey placeholders** — the demo data points at `picsum.photos`;
  a blocked request just falls back to a placeholder. Admin-uploaded images are
  served from the backend.
- **Login works but the cart looks empty after** — the guest cart merges into the
  account server-side; the client refetches on `login`/`register`. A hard refresh
  re-syncs everything.
