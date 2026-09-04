import { supabase } from './supabase.js';

/**
 * Supabase's client is stateless (HTTP under the hood) — there's no
 * persistent connection to open. This just confirms the project is
 * reachable and the service-role key is valid before the server starts
 * accepting traffic.
 */
export async function connectDB() {
  const { error } = await supabase.from('categories').select('id', { head: true, count: 'exact' });
  if (error) {
    throw new Error(`Could not reach Supabase (${error.message}). Check SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.`);
  }
  const url = new URL(process.env.SUPABASE_URL);
  console.log(`✅ Supabase reachable: ${url.hostname}`);
}
