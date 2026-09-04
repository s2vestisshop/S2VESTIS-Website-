import { ContentLayout } from '@/components/common/ContentLayout';
import { SizeGuideContent } from '@/components/product/SizeGuide';

export function SizeGuidePage() {
  return (
    <ContentLayout
      title="Size guide"
      intro="One fit block across the core range — tops, tees, shirts, sweats and hoodies."
    >
      <SizeGuideContent />
    </ContentLayout>
  );
}
