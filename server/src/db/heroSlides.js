import { supabase, assertNoError } from '../config/supabase.js';

const ORDER = { column: 'sort_order', ascending: true };

function fromRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    image: row.image_url,
    align: row.align,
    eyebrow: row.eyebrow,
    title: row.title,
    subtitle: row.subtitle,
    ctaText: row.cta_text,
    ctaLink: row.cta_link,
    secondaryText: row.secondary_text,
    secondaryLink: row.secondary_link,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

function toRow(patch = {}) {
  const row = {};
  if (patch.image !== undefined) row.image_url = patch.image;
  if (patch.align !== undefined) row.align = patch.align;
  if (patch.eyebrow !== undefined) row.eyebrow = patch.eyebrow;
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.subtitle !== undefined) row.subtitle = patch.subtitle;
  if (patch.ctaText !== undefined) row.cta_text = patch.ctaText;
  if (patch.ctaLink !== undefined) row.cta_link = patch.ctaLink;
  if (patch.secondaryText !== undefined) row.secondary_text = patch.secondaryText;
  if (patch.secondaryLink !== undefined) row.secondary_link = patch.secondaryLink;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.isActive !== undefined) row.is_active = patch.isActive;
  return row;
}

/** Public — active slides in display order. */
export async function listHeroSlides() {
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('is_active', true)
    .order(ORDER.column, ORDER)
    .order('created_at', { ascending: true });
  assertNoError(error, 'listHeroSlides');
  return (data ?? []).map(fromRow);
}

/** Admin — every slide, active or not. */
export async function adminListHeroSlides() {
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .order(ORDER.column, ORDER)
    .order('created_at', { ascending: true });
  assertNoError(error, 'adminListHeroSlides');
  return (data ?? []).map(fromRow);
}

async function nextSortOrder() {
  const { data, error } = await supabase
    .from('hero_slides')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  assertNoError(error, 'nextSortOrder');
  return (data?.sort_order ?? -1) + 1;
}

export async function createHeroSlide(payload) {
  const row = toRow(payload);
  if (row.sort_order === undefined) row.sort_order = await nextSortOrder();
  const { data, error } = await supabase.from('hero_slides').insert(row).select().single();
  assertNoError(error, 'createHeroSlide');
  return fromRow(data);
}

export async function updateHeroSlide(id, patch) {
  const row = toRow(patch);
  if (Object.keys(row).length === 0) {
    const { data, error } = await supabase.from('hero_slides').select('*').eq('id', id).maybeSingle();
    assertNoError(error, 'updateHeroSlide:noop');
    return fromRow(data);
  }
  const { data, error } = await supabase
    .from('hero_slides')
    .update(row)
    .eq('id', id)
    .select()
    .maybeSingle();
  assertNoError(error, 'updateHeroSlide');
  return fromRow(data);
}

export async function deleteHeroSlide(id) {
  const { data, error } = await supabase.from('hero_slides').delete().eq('id', id).select('id');
  assertNoError(error, 'deleteHeroSlide');
  return (data?.length ?? 0) > 0;
}

/** Persist a new display order — `ids` is the full list of slide ids, in order. */
export async function reorderHeroSlides(ids) {
  const updates = ids.map((id, i) =>
    supabase.from('hero_slides').update({ sort_order: i }).eq('id', id)
  );
  const results = await Promise.all(updates);
  for (const { error } of results) assertNoError(error, 'reorderHeroSlides');
  return adminListHeroSlides();
}
