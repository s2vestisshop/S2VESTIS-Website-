import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as wishlistDb from '../db/wishlist.js';
import { getActiveProductPrice } from '../db/products.js';

// GET /api/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const data = await wishlistDb.getWishlist(req.user._id);
  res.json({ success: true, data });
});

// POST /api/wishlist/add   body: { productId }
export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const product = await getActiveProductPrice(productId);
  if (!product) throw ApiError.notFound('Product not found');

  const data = await wishlistDb.addToWishlist(req.user._id, productId);
  res.status(201).json({ success: true, data });
});

// DELETE /api/wishlist/remove/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const data = await wishlistDb.removeFromWishlist(req.user._id, req.params.productId);
  res.json({ success: true, data });
});
