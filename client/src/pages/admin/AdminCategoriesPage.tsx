import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { toErrorMessage } from '@/api/client';
import { Select, TextInput } from '@/components/admin/fields';
import { Toggle } from '@/components/admin/Toggle';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { Skeleton } from '@/components/ui/Skeleton';
import { onImageError, PLACEHOLDER_IMAGE } from '@/lib/product';
import type { Category } from '@/types';

interface Draft {
  name: string;
  gender: 'men' | 'women' | 'unisex';
  image: string;
  isActive: boolean;
}

const blank: Draft = { name: '', gender: 'unisex', image: '', isActive: true };

export function AdminCategoriesPage() {
  const [list, setList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminApi
      .listCategories()
      .then(setList)
      .catch((e) => setError(toErrorMessage(e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const startEdit = (c: Category) => {
    setEditingId(c._id);
    setDraft({ name: c.name, gender: c.gender, image: c.image ?? '', isActive: c.isActive ?? true });
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setDraft(blank);
    setFormError(null);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      setFormError('Name is required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) await adminApi.updateCategory(editingId, draft);
      else await adminApi.createCategory(draft);
      resetForm();
      load();
    } catch (e) {
      setFormError(toErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Category) => {
    setBusyId(c._id);
    try {
      const updated = await adminApi.updateCategory(c._id, { isActive: !c.isActive });
      setList((l) => l.map((x) => (x._id === c._id ? updated : x)));
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
      await adminApi.deleteCategory(id);
      setList((l) => l.filter((x) => x._id !== id));
      setConfirmId(null);
    } catch (e) {
      setError(toErrorMessage(e));
      setConfirmId(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-ink-900">Categories</h1>

      {/* form */}
      <section className="mt-6 rounded-card border border-ink-100 bg-surface p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink-400">
          {editingId ? 'Edit category' : 'New category'}
        </h2>
        {formError && (
          <p className="mb-4 rounded-card border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="e.g. Jackets"
          />
          <Select
            label="Gender"
            options={[
              { value: 'unisex', label: 'Unisex' },
              { value: 'men', label: 'Men' },
              { value: 'women', label: 'Women' },
            ]}
            value={draft.gender}
            onChange={(e) => setDraft((d) => ({ ...d, gender: e.target.value as Draft['gender'] }))}
          />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-ink-800">Image</p>
          <ImageUploader
            value={draft.image ? [draft.image] : []}
            onChange={(urls) => setDraft((d) => ({ ...d, image: urls[0] ?? '' }))}
            max={1}
          />
        </div>
        <label className="mt-4 flex items-center gap-3">
          <Toggle
            checked={draft.isActive}
            onChange={(v) => setDraft((d) => ({ ...d, isActive: v }))}
          />
          <span className="text-sm text-ink-700">Active</span>
        </label>

        <div className="mt-5 flex gap-3">
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editingId ? (
              'Update category'
            ) : (
              <>
                <Plus className="h-4 w-4" /> Add category
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
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4">
              <Skeleton className="h-10 w-full" />
            </div>
          ))
        ) : list.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-500">No categories yet.</p>
        ) : (
          list.map((c) => (
            <div key={c._id} className="flex items-center gap-4 p-4">
              <img
                src={c.image || PLACEHOLDER_IMAGE}
                alt=""
                onError={onImageError}
                className="h-12 w-12 shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900">{c.name}</p>
                <p className="text-xs text-ink-500">
                  {c.gender} · /{c.slug}
                  {c.isActive === false && ' · hidden'}
                </p>
              </div>
              <Toggle
                checked={c.isActive ?? true}
                disabled={busyId === c._id}
                onChange={() => toggleActive(c)}
                label={`Toggle ${c.name}`}
              />
              <button
                onClick={() => startEdit(c)}
                className="rounded p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              {confirmId === c._id ? (
                <span className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => remove(c._id)}
                    disabled={busyId === c._id}
                    className="font-semibold text-danger hover:underline"
                  >
                    {busyId === c._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Delete'}
                  </button>
                  <button onClick={() => setConfirmId(null)} className="text-ink-500 hover:underline">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmId(c._id)}
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
