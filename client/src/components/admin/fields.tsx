import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const baseInput =
  'w-full rounded-card border bg-surface px-3.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none disabled:bg-ink-50';

function fieldBorder(error?: string) {
  return error ? 'border-danger focus:border-danger' : 'border-ink-200 focus:border-ink-500';
}

interface TextProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function TextInput({ label, error, hint, className, id, ...rest }: TextProps) {
  const gen = useId();
  const fid = id ?? gen;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={fid} className="mb-1.5 block text-sm font-medium text-ink-800">
          {label}
        </label>
      )}
      <input id={fid} className={cn(baseInput, 'h-11', fieldBorder(error))} {...rest} />
      {error ? (
        <p className="mt-1 text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

interface AreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, rows = 4, ...rest }: AreaProps) {
  const gen = useId();
  const fid = id ?? gen;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={fid} className="mb-1.5 block text-sm font-medium text-ink-800">
          {label}
        </label>
      )}
      <textarea
        id={fid}
        rows={rows}
        className={cn(baseInput, 'py-2.5 leading-relaxed', fieldBorder(error))}
        {...rest}
      />
      {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...rest }: SelectProps) {
  const gen = useId();
  const fid = id ?? gen;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={fid} className="mb-1.5 block text-sm font-medium text-ink-800">
          {label}
        </label>
      )}
      <select id={fid} className={cn(baseInput, 'h-11', fieldBorder(error))} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
