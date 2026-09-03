import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { SORTS } from '../utils/constants.js';

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
    sort = 'newest',
    page = 1,
    limit = 12,
    featured,
  } = req.query;

  const filter = { isActive: true };

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

  if (color) filter['variants.color'] = { $regex: `^${color}$`, $options: 'i' };
  if (size) filter['variants.sizes.size'] = { $regex: `^${size}$`, $options: 'i' };

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
