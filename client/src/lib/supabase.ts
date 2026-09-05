import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Google sign-in is optional — the rest of the app works fine without it. */
export const isGoogleSignInConfigured = Boolean(url && anonKey);

// Used only to run the Google OAuth handshake (signInWithOAuth + getSession).
// The resulting Supabase session is bridged to our own httpOnly-cookie
// session via POST /api/auth/google and then discarded — see
// AuthCallbackPage.tsx. Never used for any other Supabase access from the browser.
export const supabase: SupabaseClient | null = isGoogleSignInConfigured
  ? createClient(url, anonKey)
  : null;
