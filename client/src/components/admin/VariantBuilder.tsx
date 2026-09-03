import { Plus, Trash2 } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { TextInput } from './fields';
import { cn } from '@/lib/cn';
import { emptyVariant, type SizeDraft, type VariantDraft } from '@/lib/adminDrafts';
import { FILTER_SIZES } from '@/lib/colors';

interface Props {
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
}

export function VariantBuilder({ variants, onChange }: Props) {
  const update = (i: number, patch: Partial<VariantDraft>) =>
    onChange(variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));

  const remove = (i: number) => onChange(variants.filter((_, idx) => idx !== i));
  const add = () => onChange([...variants, emptyVariant()]);

  const setSizes = (i: number, sizes: SizeDraft[]) => update(i, { sizes });

  return (
    <div className="space-y-5">
      {variants.map((v, i) => (
        <div key={i} className="rounded-card border border-ink-200 bg-canvas p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-1 flex-wrap items-end gap-3">
              <TextInput
                label="Colour name"
                placeholder="e.g. Charcoal"
                value={v.color}
                onChange={(e) => update(i, { color: e.target.value })}
                className="min-w-[160px] flex-1"
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-800">Swatch</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={v.colorHex}
                    onChange={(e) => update(i, { colorHex: e.target.value })}
                    className="h-11 w-12 cursor-pointer rounded border border-ink-200 bg-surface p-1"
                  />
                  <TextInput
                    value={v.colorHex}
                    onChange={(e) => update(i, { colorHex: e.target.value })}
                    className="w-24"
                  />
                </div>
              </div>
            </div>
            {variants.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="mt-7 inline-flex items-center gap-1 rounded-card border border-ink-200 px-2.5 py-1.5 text-xs text-ink-600 hover:border-danger hover:text-danger"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-ink-800">Images</p>
            <ImageUploader
              value={v.images}
              onChange={(images) => update(i, { images })}
            />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-ink-800">Sizes &amp; stock</p>
            <div className="space-y-2">
              {v.sizes.map((row, si) => (
                <div key={si} className="flex items-center gap-2">
                  <input
                    value={row.size}
                    onChange={(e) => {
                      const next = [...v.sizes];
                      next[si] = { ...row, size: e.target.value };
                      setSizes(i, next);
                    }}
                    placeholder="Size"
                    className="h-9 w-24 rounded-card border border-ink-200 bg-surface px-2.5 text-sm focus:border-ink-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    min={0}
                    value={row.stock}
                    onChange={(e) => {
                      const next = [...v.sizes];
                      next[si] = { ...row, stock: e.target.value };
                      setSizes(i, next);
                    }}
                    placeholder="Stock"
                    className="h-9 w-24 rounded-card border border-ink-200 bg-surface px-2.5 text-sm focus:border-ink-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSizes(i, v.sizes.filter((_, x) => x !== si))}
                    aria-label="Remove size row"
                    className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSizes(i, [...v.sizes, { size: '', stock: '0' }])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-clay-600 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add size row
              </button>
              <span className="text-ink-200">·</span>
              {FILTER_SIZES.filter((s) => !v.sizes.some((r) => r.size === s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSizes(i, [...v.sizes, { size: s, stock: '0' }])}
                  className="rounded border border-ink-200 px-2 py-0.5 text-[11px] text-ink-600 hover:border-ink-900"
                >
                  +{s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-card border border-dashed border-ink-300 py-3 text-sm font-medium text-ink-600 hover:border-ink-500 hover:text-ink-900'
        )}
      >
        <Plus className="h-4 w-4" /> Add colour variant
      </button>
    </div>
  );
}
