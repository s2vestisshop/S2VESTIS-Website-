# S2VESTIS

A full-stack apparel e-commerce store — T-Shirts, Polos, Tees, Shirts, Linen
Shirts, Sportswear, Sweatshirts and Hoodies for men & women.

**Monorepo** — [`server/`](server) (Node + Express 5 + MongoDB) · [`client/`](client) (Vite + React 19 + TypeScript + Tailwind + Redux Toolkit).

> **Out of scope for this build:** real payment capture / a payment gateway, and
> live shipment tracking. `/checkout` places a **demo order** (no payment) that a
> signed-in user can see under *Account → Orders*; there is no fulfilment status.
> A real payment + delivery flow is a planned follow-up.

Built in 9 phases — backend foundation → frontend foundation → home → gallery →
product detail → cart & wishlist → auth → admin → polish — plus content pages,
a size guide, and demo order history. **All complete.**

---

## Quick start

Requires **Node ≥ 18** (tested on 22). MongoDB is **optional** — the backend can
run against a throwaway in-memory database.

**Terminal 1 — backend**
```bash
cd server
cp .env.example .env
npm install
npm run dev:mem       # in-memory MongoDB, auto-seeded → http://localhost:5050
```

**Terminal 2 — frontend**
```bash
cd client
cp .env.example .env
npm install
npm run dev           # → http://localhost:5173  (proxies /api and /uploads to :5050)
```

Open **http://localhost:5173**.

> Have a real MongoDB running? Set `MONGO_URI` in `server/.env`, run `npm run seed`
> once to load demo data, then use `npm run dev` instead of `dev:mem`.

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
- Checkout: demo-only cart review → "Order placed (demo)" confirmation.
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
  multiple images for it → size + stock rows. Save as draft or publish.
- Categories: CRUD with image upload; delete is blocked while products reference it.

**Cross-cutting**
- JWT in an httpOnly cookie, bcrypt hashing, `express-validator`, centralized
  error handling, rate limiting on auth routes.
- Image uploads via Multer → Cloudinary when configured, else local `./uploads`.
- Route-level code-splitting, a top-level error boundary, mobile-first responsive
  layout (verified at 375 / 768 / 1280).

---

## Tech stack

| | |
| --- | --- |
| **Frontend** | React 19, Vite 6, TypeScript, Tailwind CSS 3 (bespoke token palette), React Router 7, Redux Toolkit (`auth` / `cart` / `wishlist` / `ui` slices + listener middleware), Axios, Framer Motion, lucide-react |
| **Backend** | Express 5, Mongoose 8, JWT (httpOnly cookies), bcryptjs, express-validator, express-rate-limit, Multer, Cloudinary (optional), Helmet, Morgan |
| **State persistence** | Server-backed cart for everyone — guest carts keyed by a `guestId` cookie, merged into the account on login. localStorage caches the cart snapshot and holds the guest wishlist. |

---

## Project structure

```
S2VESTIS-Website/
├── server/                     # Express API
│   ├── seed.js                 # CLI → src/seed/seedData.js
│   ├── scripts/
│   │   ├── smoke.js            # in-memory end-to-end API test (55 assertions)
│   │   └── dev-mem.js          # run the API on a throwaway in-memory MongoDB
│   └── src/
│       ├── app.js  server.js
│       ├── config/  models/  middleware/  validators/  controllers/  routes/
│       └── services/cartService.js
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
Frontend design tokens & architecture → [`client/README.md`](client/README.md).

---

## Verify

```bash
cd server && npm run smoke     # spins up in-memory MongoDB, seeds it, runs 55 API assertions
cd client && npm run build     # tsc typecheck + production build
cd client && npm run lint      # eslint
```

---

## Configuration

**`server/.env`** (see `.env.example` for all keys)

| Key | Default | Notes |
| --- | --- | --- |
| `PORT` | `5050` | API port (5000 avoided — macOS AirPlay Receiver uses it) |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/s2vestis` | ignored by `dev:mem` |
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
- **`npm install` fails on peer deps** — use Node ≥ 18 and a clean `node_modules`.
- **Images are grey placeholders** — the demo data points at `picsum.photos`;
  a blocked request just falls back to a placeholder. Admin-uploaded images are
  served from the backend.
- **Login works but the cart looks empty after** — the guest cart merges into the
  account server-side; the client refetches on `login`/`register`. A hard refresh
  re-syncs everything.
