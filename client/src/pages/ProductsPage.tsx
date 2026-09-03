import { useSearchParams } from 'react-router-dom';
import { PagePlaceholder } from '@/components/common/PagePlaceholder';

export function ProductsPage() {
  const [params] = useSearchParams();
  const active = ['category', 'gender', 'search', 'sort']
    .map((k) => (params.get(k) ? `${k}: ${params.get(k)}` : null))
    .filter(Boolean)
    .join(' · ');

  return (
    <PagePlaceholder
      phase="Phase 4 — Product Gallery"
      title="Product gallery"
      description={
        active
          ? `Filters/sort are being read from the URL (${active}). The grid, filter sidebar and hover cards arrive in Phase 4.`
          : 'The filter sidebar, sort dropdown, product cards with hover behaviour and skeleton loaders arrive in Phase 4.'
      }
    />
  );
}
