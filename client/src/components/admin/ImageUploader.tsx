import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { toErrorMessage } from '@/api/client';
import { onImageError } from '@/lib/product';
import { cn } from '@/lib/cn';

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export function ImageUploader({ value, onChange, max = 8 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = max - value.length;
    const list = Array.from(files).slice(0, Math.max(room, 0));
    if (list.length === 0) {
      setError(`Up to ${max} images per colour.`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const urls = await adminApi.upload(list);
      onChange([...value, ...urls]);
    } catch (e) {
      setError(toErrorMessage(e));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {value.map((url, i) => (
          <div
            key={url + i}
            className="group relative h-24 w-20 overflow-hidden rounded-card border border-ink-200 bg-ink-100"
          >
            <img
              src={url}
              alt=""
              onError={onImageError}
              className="h-full w-full object-cover"
            />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-ink-900/80 px-1 text-[9px] font-semibold uppercase text-canvas">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Remove image"
              className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink-900/80 text-canvas opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'flex h-24 w-20 flex-col items-center justify-center gap-1 rounded-card border border-dashed border-ink-300 text-xs text-ink-500 hover:border-ink-500 hover:text-ink-700',
              uploading && 'opacity-60'
            )}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                Add
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(e) => pick(e.target.files)}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
