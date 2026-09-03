import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronRight, Loader2, Truck, RefreshCw } from 'lucide-react';
import { productsApi } from '@/api';
import { toErrorMessage } from '@/api/client';
import { useAppDispatch } from '@/app/hooks';
import { addToCart } from '@/features/cart/cartSlice';
import { openCartDrawer, pushToast } from '@/features/ui/uiSlice';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ColorSelector } from '@/components/product/ColorSelector';
import { SizeSelector } from '@/components/product/SizeSelector';
import { QuantityStepper } from '@/components/cart/QuantityStepper';
import { Rating } from '@/components/product/Rating';
import { PriceTag } from '@/components/product/PriceTag';
import { WishlistButton } from '@/components/product/WishlistButton';
import { DetailsAccordion } from '@/components/product/DetailsAccordion';
import { ProductCarousel } from '@/components/product/ProductCarousel';
import { Skeleton } from '@/components/ui/Skeleton';
import { NotFoundPage } from './NotFoundPage';
import type { Category, Product } from '@/types';

export function ProductDetailPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[] | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setProduct(null);
    setRelated(null);
    setColorIndex(0);
    setSize(null);
    setQty(1);
    window.scrollTo({ top: 0 });

    productsApi
      .getBySlug(slug)
      .then((p) => {
        if (!alive) return;
        setProduct(p);
        setStatus('ready');
      })
      .catch((e) => {
        if (!alive) return;
        if (toErrorMessage(e).toLowerCase().includes('not found')) setStatus('notfound');
        else {
          setError(toErrorMessage(e));
          setStatus('error');
        }
      });

    productsApi
      .related(slug)
      .then((r) => alive && setRelated(r))
      .catch(() => alive && setRelated([]));

    return () => {
      alive = false;
    };
  }, [slug]);

  const activeVariant = product?.variants[colorIndex] ?? product?.variants[0];

  // auto-select the first in-stock size for the active colour
  useEffect(() => {
    if (!activeVariant) return;
    const firstInStock = activeVariant.sizes.find((s) => s.stock > 0);
    setSize(firstInStock?.size ?? null);
    setSizeError(false);
    setQty(1);
  }, [activeVariant]);

  const selectedRow = activeVariant?.sizes.find((s) => s.size === size);
  const maxQty = Math.min(selectedRow?.stock ?? 0, 20);

  useEffect(() => {
    if (maxQty > 0) setQty((q) => Math.min(Math.max(q, 1), maxQty));
  }, [maxQty]);

  const accordionSections = useMemo(() => {
    if (!product) return [];
    const cat = typeof product.category === 'object' ? (product.category as Category).name : '';
    return [
      { title: 'Description', content: <p>{product.description}</p> },
      {
        title: 'Details & care',
        content: (
          <ul className="list-inside list-disc space-y-1">
            <li>Category: {cat || '—'}</li>
            <li>Fit: modern {product.gender === 'unisex' ? 'unisex' : `${product.gender}'s`} cut</li>
            <li>Machine wash cold, tumble dry low</li>
            <li>Do not bleach · warm iron if needed</li>
          </ul>
        ),
      },
      {
        title: 'Shipping & returns',
        content: (
          <p>
            Free shipping on orders over ₹1999. Easy 15-day returns — items must be unworn with
            tags attached. See the full policy for details.
          </p>
        ),
      },
    ];
  }, [product]);

  if (status === 'notfound') return <NotFoundPage />;
  if (status === 'loading') return <DetailSkeleton />;
  if (status === 'error') {
    return (
      <div className="container-page py-24 text-center">
        <p className="text-sm text-danger">{error}</p>
        <Link to="/products" className="btn-outline mt-6">
          Back to shop
        </Link>
      </div>
    );
  }
  if (!product || !activeVariant) return <NotFoundPage />;

  const outOfStock = !product.variants.some((v) => v.sizes.some((s) => s.stock > 0));
  const catObj = typeof product.category === 'object' ? (product.category as Category) : null;

  const handleAdd = async (buyNow: boolean) => {
    if (!size) {
      setSizeError(true);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await dispatch(
        addToCart({ productId: product._id, color: activeVariant.color, size, quantity: qty })
      ).unwrap();
      if (buyNow) {
        navigate('/cart');
      } else {
        dispatch(openCartDrawer());
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }
    } catch (e) {
      dispatch(pushToast(toErrorMessage(e), 'error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page py-6 lg:py-10">
      {/* breadcrumbs */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-ink-400">
        <Link to="/" className="hover:text-ink-700">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/products" className="hover:text-ink-700">
          Shop
        </Link>
        {catObj && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/products?category=${catObj.slug}`} className="hover:text-ink-700">
              {catObj.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-ink-600">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery
          images={activeVariant.images}
          alt={`${product.name} — ${activeVariant.color}`}
          resetKey={activeVariant.color}
        />

        <div className="lg:pt-2">
          {catObj && (
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">
              {catObj.name}
            </p>
          )}
          <h1 className="mt-1.5 text-2xl font-bold text-ink-900 sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex items-center gap-4">
            <PriceTag product={product} size="lg" />
            {product.rating.count > 0 && (
              <Rating value={product.rating.avg} count={product.rating.count} size="sm" />
            )}
          </div>

          <div className="mt-7 space-y-6">
            <ColorSelector
              variants={product.variants}
              activeIndex={colorIndex}
              onChange={setColorIndex}
            />

            <SizeSelector
              sizes={activeVariant.sizes}
              selected={size}
              onSelect={(s) => {
                setSize(s);
                setSizeError(false);
              }}
              onSizeGuide={() =>
                dispatch(pushToast('Size guide coming soon', 'info'))
              }
              error={sizeError}
            />

            {/* stock hint */}
            {size && selectedRow && (
              <p className="text-xs font-medium">
                {selectedRow.stock === 0 ? (
                  <span className="text-danger">Out of stock in this size</span>
                ) : selectedRow.stock <= 5 ? (
                  <span className="text-clay-600">Only {selectedRow.stock} left</span>
                ) : (
                  <span className="text-sage-600">In stock</span>
                )}
              </p>
            )}

            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-ink-900">Qty</span>
              <QuantityStepper
                value={qty}
                min={1}
                max={Math.max(maxQty, 1)}
                onChange={setQty}
                disabled={outOfStock || maxQty === 0}
              />
            </div>
          </div>

          {/* actions */}
          <div className="mt-8 flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={() => handleAdd(false)}
                disabled={busy || outOfStock}
                className="btn-primary flex-1"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : added ? (
                  <>
                    <Check className="h-4 w-4" /> Added
                  </>
                ) : outOfStock ? (
                  'Sold out'
                ) : (
                  'Add to cart'
                )}
              </button>
              <WishlistButton product={product} variant="inline" />
            </div>
            <button
              onClick={() => handleAdd(true)}
              disabled={busy || outOfStock}
              className="btn-outline w-full"
            >
              Buy now
            </button>
          </div>

          {/* perks */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-ink-500">
            <span className="inline-flex items-center gap-2">
              <Truck className="h-4 w-4" /> Free shipping over ₹1999
            </span>
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> 15-day returns
            </span>
          </div>

          <div className="mt-8">
            <DetailsAccordion sections={accordionSections} />
          </div>
        </div>
      </div>

      <div className="mt-20">
        <ProductCarousel title="You may also like" products={related} />
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="container-page py-10">
      <Skeleton className="mb-6 h-3 w-64" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2 pt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-9 rounded-full" />
            ))}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-12" />
            ))}
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </div>
  );
}
