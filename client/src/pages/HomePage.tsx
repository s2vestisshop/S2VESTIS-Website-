import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { UspStrip } from '@/components/home/UspStrip';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { usePageTitle } from '@/hooks/usePageTitle';

export function HomePage() {
  usePageTitle();
  return (
    <>
      <HeroCarousel />
      <CategoryShowcase />
      <UspStrip />
      <FeaturedProducts />
      <NewsletterSection />
    </>
  );
}
