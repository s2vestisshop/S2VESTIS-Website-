import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { toErrorMessage } from '@/api/client';
import { useCategories } from '@/hooks/useCategories';
import { Select, TextInput, Textarea } from '@/components/admin/fields';
import { Toggle } from '@/components/admin/Toggle';
import { VariantBuilder } from '@/components/admin/VariantBuilder';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  blankDraft,
  draftFromProduct,
  draftToPayload,
  type ProductDraft,
} from '@/lib/adminDrafts';

export function AdminProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { full: categories } = useCategories();

  const [draft, setDraft] = useState<ProductDraft>(blankDraft);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    let alive = true;
    adminApi
      .getProduct(id!)
      .then((p) => alive && setDraft(draftFromProduct(p)))
      .catch((e) => alive && setLoadError(toErrorMessage(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, isEdit]);

  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'Select a category…' },
      ...categories.map((c) => ({ value: c._id, label: c.name })),
    ],
    [categories]
  );

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const submit = async (mode: 'draft' | 'publish') => {
    const { errors: errs, payload } = draftToPayload(draft, mode === 'publish');
    setErrors(errs);
    if (!payload) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(mode);
    try {
      if (isEdit) await adminApi.updateProduct(id!, payload);
      else await adminApi.createProduct(payload);
      navigate('/admin/products');
    } catch (e) {
      setErrors([toErrorMessage(e)]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(null);
    }
  };

  if (loadError) {
    return (
      <div>
        <BackLink />
        <p className="mt-6 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {loadError}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <BackLink />
      <h1 className="mt-3 text-2xl font-bold text-ink-900">
        {isEdit ? 'Edit product' : 'New product'}
      </h1>

      {errors.length > 0 && (
        <div className="mt-5 rounded-card border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          <p className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" /> Please fix the following:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 space-y-6">
        <section className="rounded-card border border-ink-100 bg-surface p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink-400">
            Basics
          </h2>
          <div className="space-y-4">
            <TextInput
              label="Name"
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Everyday Supima Crew Tee"
            />
            <Textarea
              label="Description"
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
              rows={4}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                options={categoryOptions}
                value={draft.category}
                onChange={(e) => set('category', e.target.value)}
              />
              <Select
                label="Gender"
                options={[
                  { value: 'unisex', label: 'Unisex' },
                  { value: 'men', label: 'Men' },
                  { value: 'women', label: 'Women' },
                ]}
                value={draft.gender}
                onChange={(e) => set('gender', e.target.value as ProductDraft['gender'])}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Base price (₹)"
                type="number"
                min={0}
                value={draft.price}
                onChange={(e) => set('price', e.target.value)}
              />
              <TextInput
                label="Discount price (₹)"
                type="number"
                min={0}
                value={draft.discountPrice}
                onChange={(e) => set('discountPrice', e.target.value)}
                hint="Leave blank for no discount"
              />
            </div>
            <label className="flex items-center gap-3">
              <Toggle checked={draft.isFeatured} onChange={(v) => set('isFeatured', v)} />
              <span className="text-sm text-ink-700">Feature on the home page</span>
            </label>
          </div>
        </section>

        <section className="rounded-card border border-ink-100 bg-surface p-5 sm:p-6">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-widest text-ink-400">
            Colour variants
          </h2>
          <p className="mb-4 text-xs text-ink-400">
            Each colour has its own photos and its own per-size stock.
          </p>
          <VariantBuilder
            variants={draft.variants}
            onChange={(variants) => set('variants', variants)}
          />
        </section>
      </div>

      {/* actions */}
      <div className="sticky bottom-0 mt-8 flex flex-wrap gap-3 border-t border-ink-100 bg-canvas/95 py-4 backdrop-blur">
        <button
          onClick={() => submit('publish')}
          disabled={saving !== null}
          className="btn-primary"
        >
          {saving === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? 'Save & publish' : 'Publish'}
        </button>
        <button
          onClick={() => submit('draft')}
          disabled={saving !== null}
          className="btn-outline"
        >
          {saving === 'draft' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save as draft'}
        </button>
        <Link to="/admin/products" className="btn-ghost">
          Cancel
        </Link>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/admin/products"
      className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900"
    >
      <ArrowLeft className="h-4 w-4" />
      All products
    </Link>
  );
}
