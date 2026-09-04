import slugify from 'slugify';
import { supabase } from '../config/supabase.js';
import { assertNoError } from '../config/supabase.js';

export function toSlug(str) {
  return slugify(String(str || ''), { lower: true, strict: true, trim: true });
}

/**
 * Ensures a unique slug within a table by appending -2, -3, ... on collision.
 * @param {string} table  e.g. 'categories'
 * @param {string} base
 * @param {string} [ignoreId] row id to exclude (for updates)
 */
export async function uniqueSlug(table, base, ignoreId) {
  const root = toSlug(base) || 'item';
  let candidate = root;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await slugTaken(table, candidate, ignoreId)) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}

async function slugTaken(table, slug, ignoreId) {
  let q = supabase.from(table).select('id', { head: true, count: 'exact' }).eq('slug', slug);
  if (ignoreId) q = q.neq('id', ignoreId);
  const { count, error } = await q;
  assertNoError(error, `slugTaken(${table})`);
  return (count || 0) > 0;
}
