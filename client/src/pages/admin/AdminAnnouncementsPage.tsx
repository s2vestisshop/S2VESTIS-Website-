import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { toErrorMessage } from '@/api/client';
import { TextInput } from '@/components/admin/fields';
import { Toggle } from '@/components/admin/Toggle';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Announcement } from '@/types';

interface Draft {
  text: string;
  href: string;
  isActive: boolean;
}

const blank: Draft = { text: '', href: '', isActive: true };

export function AdminAnnouncementsPage() {
  const [list, setList] = useState<Announcement[]>([]);
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
      .listAnnouncements()
      .then(setList)
      .catch((e) => setError(toErrorMessage(e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const startEdit = (a: Announcement) => {
    setEditingId(a._id ?? null);
    setDraft({ text: a.text ?? '', href: a.href ?? '', isActive: a.isActive ?? true });
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setDraft(blank);
    setFormError(null);
  };

  const save = async () => {
    if (!draft.text.trim()) {
      setFormError('Message text is required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) await adminApi.updateAnnouncement(editingId, draft);
      else await adminApi.createAnnouncement(draft);
      resetForm();
      load();
    } catch (e) {
      setFormError(toErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (a: Announcement) => {
    if (!a._id) return;
    setBusyId(a._id);
    try {
      const updated = await adminApi.updateAnnouncement(a._id, { isActive: !a.isActive });
      setList((l) => l.map((x) => (x._id === a._id ? updated : x)));
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
      await adminApi.deleteAnnouncement(id);
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
      const ids = reordered.map((a) => a._id!).filter(Boolean);
      setList(await adminApi.reorderAnnouncements(ids));
    } catch (e) {
      setError(toErrorMessage(e));
      load();
    } finally {
      setReordering(false);
    }
  };

  const activeCount = list.filter((a) => a.isActive ?? true).length;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-ink-900">Announcements</h1>
      <p className="mt-1 text-sm text-ink-500">
        The strip above the header. When more than one is active it rotates through them
        automatically. {activeCount > 0 && `${activeCount} active.`}
      </p>

      {/* form */}
      <section className="mt-6 rounded-card border border-ink-100 bg-surface p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-ink-400">
          {editingId ? 'Edit message' : 'New message'}
        </h2>
        {formError && (
          <p className="mb-4 rounded-card border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <TextInput
          label="Message"
          value={draft.text}
          onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
          placeholder="Free shipping over ₹1999"
        />
        <TextInput
          label="Link (optional)"
          className="mt-4"
          value={draft.href}
          onChange={(e) => setDraft((d) => ({ ...d, href: e.target.value }))}
          placeholder="/shipping"
          hint="Leave blank for plain text. Use a path like /products?category=hoodies or a full URL."
        />

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
              'Update message'
            ) : (
              <>
                <Plus className="h-4 w-4" /> Add message
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
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4">
              <Skeleton className="h-8 w-full" />
            </div>
          ))
        ) : list.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-500">
            No messages. The site falls back to its built-in strip until you add one.
          </p>
        ) : (
          list.map((a, i) => (
            <div key={a._id ?? i} className="flex items-center gap-3 p-4">
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

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{a.text}</p>
                <p className="truncate text-xs text-ink-500">
                  {a.href ? a.href : 'plain text'}
                  {a.isActive === false && ' · hidden'}
                </p>
              </div>

              <Toggle
                checked={a.isActive ?? true}
                disabled={busyId === a._id}
                onChange={() => toggleActive(a)}
                label={`Toggle ${a.text}`}
              />
              <button
                onClick={() => startEdit(a)}
                className="rounded p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              {confirmId === a._id ? (
                <span className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => a._id && remove(a._id)}
                    disabled={busyId === a._id}
                    className="font-semibold text-danger hover:underline"
                  >
                    {busyId === a._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Delete'}
                  </button>
                  <button onClick={() => setConfirmId(null)} className="text-ink-500 hover:underline">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmId(a._id ?? null)}
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
