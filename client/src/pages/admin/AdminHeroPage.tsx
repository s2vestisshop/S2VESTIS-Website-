import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { toErrorMessage } from '@/api/client';
import { Select, TextInput, Textarea } from '@/components/admin/fields';
import { Toggle } from '@/components/admin/Toggle';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { Skeleton } from '@/components/ui/Skeleton';
import { onImageError, PLACEHOLDER_IMAGE } from '@/lib/product';
import type { HeroSlide } from '@/types';

interface Draft {
  image: string;
  align: 'left' | 'center';
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  secondaryText: string;
  secondaryLink: string;
  isActive: boolean;
}

const blank: Draft = {
  image: '',
  align: 'left',
  eyebrow: '',
  title: '',
  subtitle: '',
  ctaText: 'Shop now',
  ctaLink: '/products',
  secondaryText: '',
  secondaryLink: '',
  isActive: true,
};

function toDraft(s: HeroSlide): Draft {
  return {
    image: s.image ?? '',
    align: s.align === 'center' ? 'center' : 'left',
    eyebrow: s.eyebrow ?? '',
    title: s.title ?? '',
    subtitle: s.subtitle ?? '',
    ctaText: s.ctaText ?? '',
    ctaLink: s.ctaLink ?? '',
    secondaryText: s.secondaryText ?? '',
    secondaryLink: s.secondaryLink ?? '',
    isActive: s.isActive ?? true,
  };
}

export function AdminHeroPage() {
  const [list, setList] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi
      .listHeroSlides()
      .then(setList)
      .catch((e) => setError(toErrorMessage(e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const startEdit = (s: HeroSlide) => {
    setEditingId(s._id ?? null);
    setDraft(toDraft(s));
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setDraft(blank);
    setFormError(null);
  };

  const save = async () => {
    if (!draft.image.trim()) {
      setFormError('An image is required.');
      return;
    }
    if (!draft.title.trim()) {
      setFormError('A headline is required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) await adminApi.updateHeroSlide(editingId, draft);
      else await adminApi.createHeroSlide(draft);
      resetForm();
      load();
    } catch (e) {
      setFormError(toErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: HeroSlide) => {
    if (!s._id) return;
    setBusyId(s._id);
    try {
      const updated = await adminApi.updateHeroSlide(s._id, { isActive: !s.isActive });
      setList((l) => l.map((x) => (x._id === s._id ? updated : x)));
    } catch (e) {
      setError(toErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await adminApi.deleteHeroSlide(id);
      setList((l) => l.filter((x) => x._id !== id));
      setConfirmId(null);
    } catch (e) {
      setError(toErrorMessage(e));
      setConfirmId(null);
    } finally {
      setBusyId(null);
    }
  };

  const move = async (from: number, dir: -1 | 1) => {
    const to = from + dir;
    if (to < 0 || to >= list.length) return;
    const reordered = [...list];
    [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
    setList(reordered);
    setReordering(true);
    setError(null);
    try {
      const ids = reordered.map((s) => s._id!).filter(Boolean);
      const fresh = await adminApi.reorderHeroSlides(ids);
      setList(fresh);
    } catch (e) {
      setError(toErrorMessage(e));
      load();
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-ink-900">Hero carousel</h1>
      <p className="mt-1 text-sm text-ink-500">
        Slides on the home-page banner. Reorder with the arrows; the top slide shows first.
      </p>

      {/* form */}
      <section className="mt-6 rounded-card border border-ink-100 bg-surface p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink-400">
          {editingId ? 'Edit slide' : 'New slide'}
        </h2>
        {formError && (
          <p className="mb-4 rounded-card border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-ink-800">Image</p>
          <ImageUploader
            value={draft.image ? [draft.image] : []}
            onChange={(urls) => setDraft((d) => ({ ...d, image: urls[0] ?? '' }))}
            max={1}
          />
          <p className="mt-1.5 text-xs text-ink-400">
            Landscape, ~1920×1080. Keep the side where the text sits fairly dark so the white
            headline stays readable.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Eyebrow (small label above the headline)"
            value={draft.eyebrow}
            onChange={(e) => setDraft((d) => ({ ...d, eyebrow: e.target.value }))}
            placeholder="e.g. New Season"
          />
          <Select
            label="Text alignment"
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
            ]}
            value={draft.align}
            onChange={(e) => setDraft((d) => ({ ...d, align: e.target.value as Draft['align'] }))}
          />
        </div>

        <TextInput
          label="Headline"
          className="mt-4"
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="Considered essentials, made to be worn out."
        />
        <Textarea
          label="Subtitle"
          className="mt-4"
          rows={2}
          value={draft.subtitle}
          onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))}
          placeholder="One supporting sentence."
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Button text"
            value={draft.ctaText}
            onChange={(e) => setDraft((d) => ({ ...d, ctaText: e.target.value }))}
            placeholder="Shop the collection"
          />
          <TextInput
            label="Button link"
            value={draft.ctaLink}
            onChange={(e) => setDraft((d) => ({ ...d, ctaLink: e.target.value }))}
            placeholder="/products?category=hoodies"
          />
          <TextInput
            label="Second button text (optional)"
            value={draft.secondaryText}
            onChange={(e) => setDraft((d) => ({ ...d, secondaryText: e.target.value }))}
            placeholder="Shop women"
          />
          <TextInput
            label="Second button link (optional)"
            value={draft.secondaryLink}
            onChange={(e) => setDraft((d) => ({ ...d, secondaryLink: e.target.value }))}
            placeholder="/products?gender=women"
          />
        </div>

        <label className="mt-4 flex items-center gap-3">
          <Toggle
            checked={draft.isActive}
            onChange={(v) => setDraft((d) => ({ ...d, isActive: v }))}
          />
          <span className="text-sm text-ink-700">Active (shown on the site)</span>
        </label>

        <div className="mt-5 flex gap-3">
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editingId ? (
              'Update slide'
            ) : (
              <>
                <Plus className="h-4 w-4" /> Add slide
              </>
            )}
          </button>
          {editingId && (
            <button onClick={resetForm} className="btn-ghost">
              Cancel
            </button>
          )}
        </div>
      </section>

      {error && (
        <p className="mt-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      {/* list */}
      <div className="mt-6 divide-y divide-ink-100 rounded-card border border-ink-100">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))
        ) : list.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-500">
            No slides yet. Add one above — the home page will fall back to its built-in slides until
            then.
          </p>
        ) : (
          list.map((s, i) => (
            <div key={s._id ?? i} className="flex items-center gap-3 p-4">
              <div className="flex flex-col">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || reordering}
                  className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === list.length - 1 || reordering}
                  className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>

              <img
                src={s.image || PLACEHOLDER_IMAGE}
                alt=""
                onError={onImageError}
                className="h-12 w-20 shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-900">{s.title || '(no headline)'}</p>
                <p className="truncate text-xs text-ink-500">
                  {s.eyebrow ? `${s.eyebrow} · ` : ''}
                  {s.align === 'center' ? 'centered' : 'left'}
                  {s.isActive === false && ' · hidden'}
                </p>
              </div>

              <Toggle
                checked={s.isActive ?? true}
                disabled={busyId === s._id}
                onChange={() => toggleActive(s)}
                label={`Toggle ${s.title}`}
              />
              <button
                onClick={() => startEdit(s)}
                className="rounded p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              {confirmId === s._id ? (
                <span className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => s._id && remove(s._id)}
                    disabled={busyId === s._id}
                    className="font-semibold text-danger hover:underline"
                  >
                    {busyId === s._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Delete'}
                  </button>
                  <button onClick={() => setConfirmId(null)} className="text-ink-500 hover:underline">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmId(s._id ?? null)}
                  className="rounded p-2 text-ink-500 hover:bg-ink-100 hover:text-danger"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
