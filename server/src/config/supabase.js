import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required — copy server/.env.example to .env and fill them in from your Supabase project (Project Settings → API).'
  );
}

/**
 * Server-side client using the service-role key: bypasses RLS (the app is
 * the trust boundary, same as any Express + ORM backend). Never expose this
 * key or this client to the frontend.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: 'public' },
});

/** Throws a descriptive Error if a PostgREST/RPC call returned an error. */
export function assertNoError(error, context) {
  if (!error) return;
  const err = new Error(error.message || `Supabase error in ${context}`);
  err.cause = error;
  err.pgCode = error.code;
  throw err;
}
