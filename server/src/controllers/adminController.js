import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { uniqueSlug } from '../utils/slug.js';
import { persistFile, uploadStorageMode } from '../middleware/upload.js';

const LOW_STOCK_THRESHOLD = 5;

/* --------------------------------- Products -------------------------------- */

// GET /api/admin/products  (includes inactive; search + pagination)
export const adminListProducts = asyncHandler(async (req, res) => {
  const { search, category, status, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (search) filter.name = { $regex: search, $options: 'i' };
  if (category) filter.category = category;
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  const perPage = Math.min(Number(limit) || 20, 100);
  const currentPage = Math.max(Number(page) || 1, 1);
  const skip = (currentPage - 1) * perPage;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const data = items.map((p) => ({
    ...p,
    totalStock: (p.variants || []).reduce(
      (sum, v) => sum + v.sizes.reduce((s, r) => s + (r.stock || 0), 0),
      0
    ),
  }));

  res.json({
    success: true,
    data,
    pagination: {
      page: currentPage,
      limit: perPage,
      total,
      pages: Math.ceil(total / perPage) || 1,
    },
  });
});

// GET /api/admin/products/:id
export const adminGetProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ success: true, data: product });
});

// POST /api/admin/products
export const adminCreateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description = '',
    category,
    gender = 'unisex',
    price,
    discountPrice = null,
    variants = [],
    isFeatured = false,
    isActive = true,
  } = req.body;

  const categoryExists = await Category.exists({ _id: category });
  if (!categoryExists) throw ApiError.badRequest('Category does not exist');

  const slug = await uniqueSlug(Product, name);

  const product = await Product.create({
    name,
    slug,
    description,
    category,
    gender,
    price,
    discountPrice,
    variants,
    isFeatured,
    isActive,
  });

  res.status(201).json({ success: true, data: product });
});

// PUT /api/admin/products/:id
export const adminUpdateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  const previousName = product.name;
  const updatable = [
    'name',
    'description',
    'category',
    'gender',
    'price',
    'discountPrice',
    'variants',
    'isFeatured',
    'isActive',
  ];

  if (req.body.category) {
    const ok = await Category.exists({ _id: req.body.category });
    if (!ok) throw ApiError.badRequest('Category does not exist');
  }

  for (const key of updatable) {
    if (req.body[key] !== undefined) product[key] = req.body[key];
  }

  if (req.body.name && req.body.name !== previousName) {
    product.slug = await uniqueSlug(Product, req.body.name, product._id);
  }

  await product.save(); // pre-save recalculates pricing
  res.json({ success: true, data: product });
});

// DELETE /api/admin/products/:id
export const adminDeleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ success: true, message: 'Product deleted' });
});

/* -------------------------------- Categories ------------------------------- */

// GET /api/admin/categories  (includes inactive)
export const adminListCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: categories });
});

// POST /api/admin/categories
export const adminCreateCategory = asyncHandler(async (req, res) => {
  const { name, gender = 'unisex', image = '', isActive = true } = req.body;
  const slug = await uniqueSlug(Category, name);
  const category = await Category.create({ name, slug, gender, image, isActive });
  res.status(201).json({ success: true, data: category });
});

// PUT /api/admin/categories/:id
export const adminUpdateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');

  for (const key of ['name', 'gender', 'image', 'isActive']) {
    if (req.body[key] !== undefined) category[key] = req.body[key];
  }
  if (req.body.name && req.body.name !== category.name) {
    category.slug = await uniqueSlug(Category, req.body.name, category._id);
  }
  await category.save();
  res.json({ success: true, data: category });
});

// DELETE /api/admin/categories/:id
export const adminDeleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Product.countDocuments({ category: req.params.id });
  if (inUse > 0) {
    throw ApiError.badRequest(
      `Cannot delete: ${inUse} product(s) still use this category. Reassign them first.`
    );
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  res.json({ success: true, message: 'Category deleted' });
});

/* --------------------------------- Uploads -------------------------------- */

// POST /api/admin/upload   (multipart form field: "images")
export const adminUpload = asyncHandler(async (req, res) => {
  const files = req.files?.length ? req.files : req.file ? [req.file] : [];
  if (!files.length) throw ApiError.badRequest('No image files received');
  const urls = await Promise.all(files.map((f) => persistFile(f, req)));
  res.status(201).json({ success: true, storage: uploadStorageMode, urls });
});

/* -------------------------------- Dashboard ------------------------------- */

// GET /api/admin/stats
export const adminStats = asyncHandler(async (_req, res) => {
  const [totalProducts, activeProducts, totalCategories, totalUsers, demoOrders] =
    await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Category.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
    ]);

  const lowStock = await Product.aggregate([
    { $unwind: '$variants' },
    { $unwind: '$variants.sizes' },
    {
      $group: {
        _id: '$_id',
        name: { $first: '$name' },
        slug: { $first: '$slug' },
        stock: { $sum: '$variants.sizes.stock' },
      },
    },
    { $match: { stock: { $lte: LOW_STOCK_THRESHOLD } } },
    { $sort: { stock: 1 } },
    { $limit: 20 },
  ]);

  res.json({
    success: true,
    data: {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts,
      totalCategories,
      totalUsers,
      demoOrders,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      lowStockCount: lowStock.length,
      lowStock,
    },
  });
});
