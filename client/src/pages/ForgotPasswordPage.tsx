import { useState } from 'react';
import { AlertCircle, MailCheck } from 'lucide-react';
import { authApi } from '@/api';
import { toErrorMessage } from '@/api/client';
import { AuthCard, AuthLink } from '@/components/auth/AuthCard';
import { FormField } from '@/components/auth/FormField';
import { isEmail } from '@/lib/validate';
import { usePageTitle } from '@/hooks/usePageTitle';

export function ForgotPasswordPage() {
  usePageTitle('Reset your password');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(toErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll email you a link to choose a new one"
      footer={<AuthLink to="/login">Back to sign in</AuthLink>}
    >
      {sent ? (
        <div className="flex flex-col items-center py-4 text-center">
          <MailCheck className="h-10 w-10 text-sage-500" />
          <p className="mt-3 text-sm text-ink-700">
            If <span className="font-medium">{email}</span> is registered, a reset link is on its
            way — check your inbox.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-card border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
          />
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
