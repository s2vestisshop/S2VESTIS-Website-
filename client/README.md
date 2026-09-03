# S2VESTIS — Frontend

Vite + React 19 + TypeScript + Tailwind CSS 3 + React Router 7 + Redux Toolkit.

## Setup

```bash
cd client
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

The dev server proxies `/api` and `/uploads` to the backend (default
`http://localhost:5050`, override with `VITE_API_PROXY`) so auth cookies stay
first-party. For a production build set `VITE_API_BASE_URL` to the absolute API URL.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b` typecheck + production build to `dist/` |
| `npm run preview` | serve the built `dist/` |
| `npm run lint` | ESLint |
| `npm run typecheck` | types only, no emit |

## Design tokens

Defined in [`tailwind.config.js`](tailwind.config.js) — a bespoke palette, not
default Tailwind colours:

- `canvas` / `surface` — warm off-white page + card backgrounds
- `ink.50…900` — warm near-black text / structural greys
- `clay.50…900` — terracotta accent (CTAs, sale badges, focus ring)
- `sage.50…700` — quiet secondary accent (success / "in stock")
- `danger` / `success` / `warning` — functional
- `font-display` = Fraunces (headings), `font-sans` = Inter (body/UI)

Reusable component classes (`.btn-primary`, `.btn-outline`, `.container-page`,
`.skeleton`, …) live in [`src/index.css`](src/index.css).

## Structure

```
src/
├── main.tsx / App.tsx          # Provider + BrowserRouter + ErrorBoundary + session bootstrap
├── index.css                   # Tailwind layers + component classes
├── app/                        # store.ts, typed hooks, listeners.ts (merge-on-login)
├── features/                   # redux slices: auth, cart, wishlist, ui
├── api/                        # axios client + typed endpoint modules
├── router/AppRoutes.tsx        # route table — lazy-loaded pages, public + protected + admin
├── components/
│   ├── layout/                 # Layout (Suspense), Navbar, MegaMenu, Footer
│   ├── cart/                   # CartDrawer, CartLineItem, OrderSummary, QuantityStepper
│   ├── product/                # ProductCard, ProductGallery, Color/SizeSelector, Rating, …
│   ├── gallery/                # FilterSidebar, FilterDrawer, SortDropdown, PriceRange, …
│   ├── admin/                  # fields, Toggle, ImageUploader, VariantBuilder
│   ├── auth/                   # ProtectedRoute, AuthCard, FormField
│   ├── wishlist/WishlistCard.tsx
│   ├── ui/                     # Button, Badge, Skeleton, Toaster
│   └── common/                 # Logo, ScrollToTop, PageFallback, ErrorBoundary
├── hooks/                      # useCategories, useProductFilters, useDebouncedValue
├── lib/                        # cn, format, product, storage, nav, colors, validate, adminDrafts
├── data/heroSlides.ts          # editable hero carousel content
├── pages/                      # one file per route (+ pages/admin/)
└── types/                      # shared API types
```

## State

| Slice | Holds | Persistence |
| --- | --- | --- |
| `auth` | current user, status, `initialized` flag | httpOnly cookie (server) |
| `cart` | line items, subtotal, count, per-row pending ids | server (guest via `guestId` cookie) + localStorage snapshot cache |
| `wishlist` | product ids + hydrated docs | server when signed in; localStorage ids for guests, merged on login |
| `ui` | cart drawer / mobile menu / search open, toasts | — |

- Session bootstrap (`App.tsx`): `fetchMe` → then `fetchCart` + `fetchWishlist`.
- `app/listeners.ts` reacts to `login`/`register` fulfilled → `mergeGuestWishlist` + `fetchCart`.
- Routes are `React.lazy`; `react`/`redux`/`framer-motion` are split into cached vendor chunks.
