import { supabase, assertNoError } from '../config/supabase.js';
import { uniqueSlug } from '../utils/slug.js';

export async function listCategories(withCounts = false) {
  const { data, error } = await supabase.rpc('list_categories', { p_with_counts: withCounts });
  assertNoError(error, 'listCategories');
  return data ?? [];
}

export async function adminListCategories() {
  const { data, error } = await supabase.rpc('admin_list_categories');
  assertNoError(error, 'adminListCategories');
  return data ?? [];
}

function toRow({ name, gender, image, isActive }) {
  const row = {};
  if (name !== undefined) row.name = name;
  if (gender !== undefined) row.gender = gender;
  if (image !== undefined) row.image_url = image;
  if (isActive !== undefined) row.is_active = isActive;
  return row;
}

function fromRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    name: row.name,
    slug: row.slug,
    gender: row.gender,
    image: row.image_url,
    isActive: row.is_active,
  };
}

export async function createCategory({ name, gender = 'unisex', image = '', isActive = true }) {
  const slug = await uniqueSlug('categories', name);
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, slug, gender, image_url: image, is_active: isActive })
    .select()
    .single();
  assertNoError(error, 'createCategory');
  return fromRow(data);
}

export async function updateCategory(id, patch) {
  const { data: existing, error: findErr } = await supabase
    .from('categories')
    .select('id, name')
    .eq('id', id)
    .maybeSingle();
  assertNoError(findErr, 'updateCategory:find');
  if (!existing) return null;

  const row = toRow(patch);
  if (patch.name && patch.name !== existing.name) {
    row.slug = await uniqueSlug('categories', patch.name, id);
  }

  const { data, error } = await supabase
    .from('categories')
    .update(row)
    .eq('id', id)
    .select()
    .single();
  assertNoError(error, 'updateCategory');
  return fromRow(data);
}

/** Throws a Postgres FK-violation (code 23503) if products still reference it. */
export async function deleteCategory(id) {
  const { data, error } = await supabase.from('categories').delete().eq('id', id).select('id');
  assertNoError(error, 'deleteCategory');
  return (data?.length ?? 0) > 0;
}

export async function countProductsInCategory(id) {
  const { count, error } = await supabase
    .from('products')
    .select('id', { head: true, count: 'exact' })
    .eq('category_id', id);
  assertNoError(error, 'countProductsInCategory');
  return count || 0;
}
