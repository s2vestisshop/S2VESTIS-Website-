/**
 * Home hero carousel content.
 *
 * Edit / reorder / add slides here (3–5 recommended) — the carousel layout,
 * animation, arrows and dots adapt automatically. `image` can be any URL.
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
    image: 'https://picsum.photos/seed/s2v-hero-01/1920/1080',
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
    image: 'https://picsum.photos/seed/s2v-hero-02/1920/1080',
    align: 'left',
    eyebrow: 'Linen, refreshed',
    title: 'Breathable linen shirts for long, warm days.',
    subtitle: 'Relaxed cuts in pure linen and linen blends — camp collars, band collars, resort fits.',
    ctaText: 'Shop linen shirts',
    ctaLink: '/products?category=linen-shirts',
    tone: 'light',
  },
  {
    image: 'https://picsum.photos/seed/s2v-hero-03/1920/1080',
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
    image: 'https://picsum.photos/seed/s2v-hero-04/1920/1080',
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
