import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, type = 'text', className, id, ...rest }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const isPassword = type === 'password';
    const [reveal, setReveal] = useState(false);
    const inputType = isPassword ? (reveal ? 'text' : 'password') : type;

    return (
      <div className={className}>
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-ink-800">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            type={inputType}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
            className={cn(
              'h-11 w-full rounded-card border bg-surface px-3.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none',
              isPassword && 'pr-11',
              error
                ? 'border-danger focus:border-danger'
                : 'border-ink-200 focus:border-ink-500'
            )}
            {...rest}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setReveal((r) => !r)}
              aria-label={reveal ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-ink-400 hover:text-ink-700"
            >
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error ? (
          <p id={`${fieldId}-error`} className="mt-1.5 text-xs font-medium text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={`${fieldId}-hint`} className="mt-1.5 text-xs text-ink-400">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
FormField.displayName = 'FormField';
