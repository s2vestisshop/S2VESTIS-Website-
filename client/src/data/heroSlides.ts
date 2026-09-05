/**
 * Home hero carousel — OFFLINE FALLBACK / SEED content.
 *
 * The live slides are now managed from the admin panel
 * (Admin → Hero, backed by the `hero_slides` table and `GET /api/hero-slides`).
 * `HeroCarousel` uses this list only while that request is in flight, or if it
 * fails / returns nothing — so the home page always renders something.
 *
 * The same four entries are seeded into the database by
 * `supabase/migrations/20260905000008_hero_slides.sql`. Keep them roughly in
 * sync if you change them here.
 *
 * `image` can be any URL or a path under `client/public/` (e.g. `/hero/hero-1.jpg`,
 * which lives in `client/public/hero/`). Placeholder art there is 1920×1080 JPG,
 * mid-to-dark on the copy side so the white headline stays readable.
 */
import type { HeroSlide } from '@/types';

export type { HeroSlide };

export const HERO_SLIDES: HeroSlide[] = [
  {
    image: '/hero/hero-1.jpg',
    align: 'left',
    eyebrow: 'New Season',
    title: 'Considered essentials, made to be worn out.',
    subtitle:
      'Premium fabric, clean cuts, honest pricing. Build a wardrobe that lasts from the S2VESTIS core range.',
    ctaText: 'Shop the collection',
    ctaLink: '/products',
    secondaryText: 'Shop women',
    secondaryLink: '/products?gender=women',
  },
  {
    image: '/hero/hero-2.jpg',
    align: 'left',
    eyebrow: 'Linen, refreshed',
    title: 'Breathable linen shirts for long, warm days.',
    subtitle: 'Relaxed cuts in pure linen and linen blends — camp collars, band collars, resort fits.',
    ctaText: 'Shop linen shirts',
    ctaLink: '/products?category=linen-shirts',
  },
  {
    image: '/hero/hero-3.jpg',
    align: 'center',
    eyebrow: 'The heavyweight edit',
    title: 'Hoodies & sweats with real weight to them.',
    subtitle: 'Loopback cotton, brushed backs, boxy fits. Layering pieces that hold their shape.',
    ctaText: 'Shop fleece',
    ctaLink: '/products?category=hoodies',
    secondaryText: 'Sweatshirts',
    secondaryLink: '/products?category=sweatshirts',
  },
  {
    image: '/hero/hero-4.jpg',
    align: 'left',
    eyebrow: 'Move in it',
    title: 'Sportswear that keeps up and dresses down.',
    subtitle: 'Performance tees, compression leggings and featherweight layers for training and after.',
    ctaText: 'Shop sportswear',
    ctaLink: '/products?category=sportswear',
  },
];

/** Auto-advance interval in ms. */
export const HERO_INTERVAL = 6000;
