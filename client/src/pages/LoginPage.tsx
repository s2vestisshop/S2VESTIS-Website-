import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearAuthError, login, type AuthRejection } from '@/features/auth/authSlice';
import { AuthCard, AuthLink } from '@/components/auth/AuthCard';
import { FormField } from '@/components/auth/FormField';
import { isEmail, required } from '@/lib/validate';

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);

  const from = (location.state as LocationState | null)?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  if (user) return <Navigate to={from} replace />;

  const validate = () => {
    const next: typeof errors = {};
    if (!isEmail(email)) next.email = 'Enter a valid email address';
    if (!required(password)) next.password = 'Enter your password';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!validate()) return;
    setSubmitting(true);
    const res = await dispatch(login({ email: email.trim(), password }));
    setSubmitting(false);

    if (login.rejected.match(res)) {
      const payload = res.payload as AuthRejection | undefined;
      const fieldErrs: typeof errors = {};
      payload?.fieldErrors?.forEach((fe) => {
        if (fe.field === 'email' || fe.field === 'password') fieldErrs[fe.field] = fe.message;
      });
      setErrors(fieldErrs);
      setBanner(payload?.message ?? 'Could not sign in');
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your S2VESTIS account"
      footer={<>New here? <AuthLink to="/register">Create an account</AuthLink></>}
    >
      {banner && (
        <div className="mb-5 flex items-start gap-2 rounded-card border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{banner}</span>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((x) => ({ ...x, email: undefined }));
            setBanner(null);
          }}
          error={errors.email}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((x) => ({ ...x, password: undefined }));
            setBanner(null);
          }}
          error={errors.password}
        />
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-5 rounded-card bg-ink-50 px-3 py-2 text-center text-xs text-ink-500">
        Demo: <span className="font-medium text-ink-700">user@s2vestis.com</span> /{' '}
        <span className="font-medium text-ink-700">User@12345</span>
      </p>
    </AuthCard>
  );
}
