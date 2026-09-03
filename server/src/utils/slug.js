import slugify from 'slugify';

export function toSlug(str) {
  return slugify(String(str || ''), { lower: true, strict: true, trim: true });
}

/**
 * Ensures a unique slug for a given Mongoose model by appending -2, -3, ...
 * @param {import('mongoose').Model} Model
 * @param {string} base
 * @param {string} [ignoreId] document id to exclude (for updates)
 */
export async function uniqueSlug(Model, base, ignoreId) {
  const root = toSlug(base) || 'item';
  let candidate = root;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (
    await Model.exists({ slug: candidate, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) })
  ) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}
