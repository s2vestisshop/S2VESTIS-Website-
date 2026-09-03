import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { SORTS } from '../utils/constants.js';

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Accepts `?x=a&x=b`, `?x=a,b`, or a single value → string[]. */
const toArray = (v) =>
  v == null
    ? []
    : (Array.isArray(v) ? v : String(v).split(','))
        .map((s) => String(s).trim())
        .filter(Boolean);

const PUBLIC_FIELDS =
  'name slug description price discountPrice discountPercent effectivePrice gender variants rating isFeatured category createdAt';

// GET /api/products
export const listProducts = asyncHandler(async (req, res) => {
  const {
    category,
    gender,
    search,
    minPrice,
    maxPrice,
    size,
    color,
    ids,
    sort = 'newest',
    page = 1,
    limit = 12,
    featured,
  } = req.query;

  const filter = { isActive: true };

  // Fetch a specific set of products by id (wishlist hydration, etc.)
  const idList = toArray(ids).filter((v) => /^[0-9a-fA-F]{24}$/.test(v));
  if (ids !== undefined) {
    // ids param present but nothing valid → return nothing
    filter._id = { $in: idList };
  }

  if (category) {
    // accept slug or id
    const catDoc = await Category.findOne(
      /^[0-9a-fA-F]{24}$/.test(category) ? { _id: category } : { slug: category }
    ).select('_id');
    // unknown category → empty result set rather than "all"
    filter.category = catDoc ? catDoc._id : null;
  }
  if (gender) filter.gender = gender;
  if (featured !== undefined) filter.isFeatured = featured;

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.effectivePrice = {};
    if (minPrice !== undefined) filter.effectivePrice.$gte = minPrice;
    if (maxPrice !== undefined) filter.effectivePrice.$lte = maxPrice;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const colors = toArray(color);
  const sizes = toArray(size);
  if (colors.length) {
    filter['variants.color'] = {
      $in: colors.map((c) => new RegExp(`^${escapeRegex(c)}$`, 'i')),
    };
  }
  if (sizes.length) {
    filter['variants.sizes.size'] = {
      $in: sizes.map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i')),
    };
  }

  const sortSpec = SORTS[sort] || SORTS.newest;
  const perPage = Math.min(Number(limit) || 12, 60);
  const currentPage = Math.max(Number(page) || 1, 1);
  const skip = (currentPage - 1) * perPage;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .select(PUBLIC_FIELDS)
      .populate('category', 'name slug gender')
      .sort(sortSpec)
      .skip(skip)
      .limit(perPage)
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: {
      page: currentPage,
      limit: perPage,
      total,
      pages: Math.ceil(total / perPage) || 1,
      hasNextPage: skip + items.length < total,
    },
  });
});

// GET /api/products/:slug
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug gender')
    .lean();

  if (!product) throw ApiError.notFound('Product not found');
  res.json({ success: true, data: product });
});

// GET /api/products/:slug/related
export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .select('_id category')
    .lean();
  if (!product) throw ApiError.notFound('Product not found');

  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
  })
    .select(PUBLIC_FIELDS)
    .populate('category', 'name slug gender')
    .sort({ 'rating.avg': -1, createdAt: -1 })
    .limit(8)
    .lean();

  res.json({ success: true, data: related });
});
