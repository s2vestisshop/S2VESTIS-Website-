import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as productsDb from '../db/products.js';

// GET /api/products
export const listProducts = asyncHandler(async (req, res) => {
  const { items, pagination } = await productsDb.listProducts(req.query);
  res.json({ success: true, data: items, pagination });
});

// GET /api/products/:slug
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await productsDb.getProductBySlug(req.params.slug);
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ success: true, data: product });
});

// GET /api/products/:slug/related
export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await productsDb.getProductBySlug(req.params.slug);
  if (!product) throw ApiError.notFound('Product not found');
  const related = await productsDb.getRelatedProducts(req.params.slug, 8);
  res.json({ success: true, data: related });
});
