/**
 * Home hero carousel content.
 *
 * Edit / reorder / add slides here (3–5 recommended) — the carousel layout,
 * animation, arrows and dots adapt automatically. `image` can be any URL or a
 * path under `client/public/`.
 *
 * NOTE: `/hero/hero-N.jpg` (in `client/public/hero/`) are branded PLACEHOLDER
 * images. Replace each with real photography — 1920×1080, JPG, under ~300 KB,
 * same filename. Keep the copy side of the frame (left for slides 1/2/4,
 * centre for slide 3 per `align`) relatively clean and mid-to-dark so the
 * white headline stays readable. Or set `image` to an absolute CDN URL.
 */
export interface HeroSlide {
  image: string;
  align?: 'left' | 'center';
  eyebrow?: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  /** optional secondary link */
  secondaryText?: string;
  secondaryLink?: string;
  /** tailwind text colour for the copy over this image */
  tone?: 'light' | 'dark';
}

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
    tone: 'light',
  },
  {
    image: '/hero/hero-2.jpg',
    align: 'left',
    eyebrow: 'Linen, refreshed',
    title: 'Breathable linen shirts for long, warm days.',
    subtitle: 'Relaxed cuts in pure linen and linen blends — camp collars, band collars, resort fits.',
    ctaText: 'Shop linen shirts',
    ctaLink: '/products?category=linen-shirts',
    tone: 'light',
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
    tone: 'light',
  },
  {
    image: '/hero/hero-4.jpg',
    align: 'left',
    eyebrow: 'Move in it',
    title: 'Sportswear that keeps up and dresses down.',
    subtitle: 'Performance tees, compression leggings and featherweight layers for training and after.',
    ctaText: 'Shop sportswear',
    ctaLink: '/products?category=sportswear',
    tone: 'light',
  },
];

/** Auto-advance interval in ms. */
export const HERO_INTERVAL = 6000;
