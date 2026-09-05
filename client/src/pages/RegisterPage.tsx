import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearAuthError, register, type AuthRejection } from '@/features/auth/authSlice';
import { AuthCard, AuthLink } from '@/components/auth/AuthCard';
import { FormField } from '@/components/auth/FormField';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { isGoogleSignInConfigured } from '@/lib/supabase';
import { isEmail, minLen, required } from '@/lib/validate';
import { usePageTitle } from '@/hooks/usePageTitle';

interface LocationState {
  from?: string;
}

type FieldErrors = { name?: string; email?: string; password?: string; confirm?: string };

export function RegisterPage() {
  usePageTitle('Create account');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);

  const from = (location.state as LocationState | null)?.from || '/';

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  if (user) return <Navigate to={from} replace />;

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((x) => ({ ...x, [key]: undefined }));
    setBanner(null);
  };

  const validate = () => {
    const next: FieldErrors = {};
    if (!required(form.name)) next.name = 'Enter your name';
    if (!isEmail(form.email)) next.email = 'Enter a valid email address';
    if (!minLen(form.password, 6)) next.password = 'Use at least 6 characters';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!validate()) return;
    setSubmitting(true);
    const res = await dispatch(
      register({ name: form.name.trim(), email: form.email.trim(), password: form.password })
    );
    setSubmitting(false);

    if (register.rejected.match(res)) {
      const payload = res.payload as AuthRejection | undefined;
      const fieldErrs: FieldErrors = {};
      payload?.fieldErrors?.forEach((fe) => {
        if (['name', 'email', 'password'].includes(fe.field)) {
          fieldErrs[fe.field as keyof FieldErrors] = fe.message;
        }
      });
      setErrors(fieldErrs);
      setBanner(payload?.message ?? 'Could not create your account');
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="It takes less than a minute"
      footer={<>Already have an account? <AuthLink to="/login">Sign in</AuthLink></>}
    >
      {banner && (
        <div className="mb-5 flex items-start gap-2 rounded-card border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{banner}</span>
        </div>
      )}

      {isGoogleSignInConfigured && (
        <>
          <GoogleSignInButton />
          <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-widest text-ink-400">
            <div className="h-px flex-1 bg-ink-100" />
            or
            <div className="h-px flex-1 bg-ink-100" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField
          label="Name"
          autoComplete="name"
          autoFocus
          value={form.name}
          onChange={set('name')}
          error={errors.name}
        />
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint="At least 6 characters"
        />
        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-ink-400">
        Your guest cart and wishlist move to your new account automatically.
      </p>
    </AuthCard>
  );
}
