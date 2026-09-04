import { supabase, assertNoError } from '../config/supabase.js';

export async function adminStats() {
  const { data, error } = await supabase.rpc('admin_stats');
  assertNoError(error, 'adminStats');
  return data;
}
