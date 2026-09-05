import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { authApi } from '@/api';
import { toErrorMessage } from '@/api/client';
import { useAppDispatch } from '@/app/hooks';
import { fetchMe } from '@/features/auth/authSlice';

/**
 * Google sends the browser back here after Supabase's own OAuth handshake.
 * We bridge that Supabase session to our own httpOnly-cookie session (the
 * one every other endpoint actually relies on) via POST /api/auth/google,
 * then discard the Supabase session — it has no further use.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) {
        setError('Google sign-in is not configured.');
        return;
      }
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
          throw new Error(sessionError?.message || 'No session came back from Google');
        }
        await authApi.google(data.session.access_token);
        await supabase.auth.signOut();
        await dispatch(fetchMe());
        if (!cancelled) navigate('/', { replace: true });
      } catch (err) {
        if (!cancelled) setError(toErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      {error ? (
        <>
          <p className="max-w-sm text-sm text-danger">{error}</p>
          <Link to="/login" className="btn-outline">
            Back to sign in
          </Link>
        </>
      ) : (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-ink-800" />
          <p className="text-sm text-ink-500">Signing you in…</p>
        </>
      )}
    </div>
  );
}
