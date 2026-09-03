import { useParams } from 'react-router-dom';
import { PagePlaceholder } from '@/components/common/PagePlaceholder';

export function ProductDetailPage() {
  const { slug } = useParams();
  return (
    <PagePlaceholder
      phase="Phase 5 — Product Detail"
      title="Product detail"
      description={`Slug "${slug}" is routed. Image gallery, colour/size selectors, add-to-cart / buy-now and the related carousel arrive in Phase 5.`}
    />
  );
}
