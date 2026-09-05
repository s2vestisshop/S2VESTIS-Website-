import { supabase, assertNoError } from '../config/supabase.js';

const ORDER = { column: 'sort_order', ascending: true };

function fromRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    text: row.text,
    href: row.href,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

function toRow(patch = {}) {
  const row = {};
  if (patch.text !== undefined) row.text = patch.text;
  if (patch.href !== undefined) row.href = patch.href;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.isActive !== undefined) row.is_active = patch.isActive;
  return row;
}

/** Public — active announcements in display order. */
export async function listAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order(ORDER.column, ORDER)
    .order('created_at', { ascending: true });
  assertNoError(error, 'listAnnouncements');
  return (data ?? []).map(fromRow);
}

/** Admin — every announcement, active or not. */
export async function adminListAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order(ORDER.column, ORDER)
    .order('created_at', { ascending: true });
  assertNoError(error, 'adminListAnnouncements');
  return (data ?? []).map(fromRow);
}

async function nextSortOrder() {
  const { data, error } = await supabase
    .from('announcements')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  assertNoError(error, 'nextSortOrder');
  return (data?.sort_order ?? -1) + 1;
}

export async function createAnnouncement(payload) {
  const row = toRow(payload);
  if (row.sort_order === undefined) row.sort_order = await nextSortOrder();
  const { data, error } = await supabase.from('announcements').insert(row).select().single();
  assertNoError(error, 'createAnnouncement');
  return fromRow(data);
}

export async function updateAnnouncement(id, patch) {
  const row = toRow(patch);
  if (Object.keys(row).length === 0) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    assertNoError(error, 'updateAnnouncement:noop');
    return fromRow(data);
  }
  const { data, error } = await supabase
    .from('announcements')
    .update(row)
    .eq('id', id)
    .select()
    .maybeSingle();
  assertNoError(error, 'updateAnnouncement');
  return fromRow(data);
}

export async function deleteAnnouncement(id) {
  const { data, error } = await supabase.from('announcements').delete().eq('id', id).select('id');
  assertNoError(error, 'deleteAnnouncement');
  return (data?.length ?? 0) > 0;
}

/** Persist a new display order — `ids` is the full list of ids, in order. */
export async function reorderAnnouncements(ids) {
  const results = await Promise.all(
    ids.map((id, i) => supabase.from('announcements').update({ sort_order: i }).eq('id', id))
  );
  for (const { error } of results) assertNoError(error, 'reorderAnnouncements');
  return adminListAnnouncements();
}
