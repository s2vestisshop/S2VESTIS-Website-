# S2VESTIS

Full-stack apparel e-commerce store — T-Shirts, Polos, Tees, Shirts, Linen Shirts,
Sportswear, Sweatshirts and Hoodies for men & women.

**Monorepo:** [`server/`](server) (Node + Express 5 + MongoDB) · [`client/`](client) (Vite + React + TS + Tailwind + Redux Toolkit).

> Payment gateway, checkout payment flow and order tracking are **out of scope** for
> this build. `/checkout` is a demo confirmation only.

## Build status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Backend foundation — models, auth, product/category/cart/wishlist/admin APIs, uploads, seed | ✅ Done |
| 2 | Frontend foundation — Vite/TS setup, Tailwind tokens, router, Redux store, API layer, Navbar + Footer + Cart Drawer shell | ✅ Done |
| 3 | Home page — hero carousel, category showcase, featured row | ✅ Done |
| 4 | Product gallery — filters, sort, product cards | ✅ Done |
| 5 | Product detail — variants, add to cart / buy now, related | ✅ Done |
| 6 | Cart drawer + cart page + wishlist page | ✅ Done |
| 7 | Auth pages + protected routes | ⬜ |
| 8 | Admin panel — product/category CRUD, variant builder | ⬜ |
| 9 | Polish pass — responsive QA, empty/error states, docs | ⬜ |

## Quick start

You need **Node ≥ 18**. MongoDB is optional — the backend can run against a
throwaway in-memory database.

### 1. Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev:mem      # in-memory MongoDB, auto-seeded → http://localhost:5050
```

Have a real MongoDB? Use `npm run seed` once, then `npm run dev` instead.

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev          # → http://localhost:5173  (proxies /api to :5050)
```

Open http://localhost:5173.

### Demo accounts (from the seed)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@s2vestis.com` | `Admin@12345` |
| User | `user@s2vestis.com` | `User@12345` |

## Verify

```bash
cd server && npm run smoke     # ~45 end-to-end API assertions on an in-memory DB
cd client && npm run build     # typecheck + production build
```

## Tech

- **Frontend:** React 19, Vite 6, TypeScript, Tailwind CSS 3 (custom token palette),
  React Router 7, Redux Toolkit (auth / cart / wishlist / ui slices), Axios, Framer Motion, lucide-react.
- **Backend:** Express 5, Mongoose 8, JWT in httpOnly cookies, bcrypt, express-validator,
  express-rate-limit, Multer (+ Cloudinary, local-disk fallback).
- **State persistence:** server-backed cart for everyone (guest carts keyed by a
  `guestId` cookie, merged into the account on login); localStorage caches the cart
  snapshot and holds the guest wishlist.

See [`server/README.md`](server/README.md) for the full API reference and
[`client/README.md`](client/README.md) for the frontend layout.
