import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

const WISHLIST_POPULATE = {
  path: 'products',
  select:
    'name slug price discountPrice discountPercent effectivePrice gender variants rating isActive category',
  populate: { path: 'category', select: 'name slug' },
};

async function getOrCreateWishlist(userId) {
  let wl = await Wishlist.findOne({ user: userId });
  if (!wl) wl = await Wishlist.create({ user: userId, products: [] });
  return wl;
}

// GET /api/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const wl = await getOrCreateWishlist(req.user._id);
  await wl.populate(WISHLIST_POPULATE);
  const products = wl.products.filter((p) => p && p.isActive);
  res.json({ success: true, data: { _id: wl._id, products, count: products.length } });
});

// POST /api/wishlist/add   body: { productId }
export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const product = await Product.findOne({ _id: productId, isActive: true }).select('_id');
  if (!product) throw ApiError.notFound('Product not found');

  const wl = await getOrCreateWishlist(req.user._id);
  if (!wl.products.some((p) => String(p) === String(productId))) {
    wl.products.push(productId);
    await wl.save();
  }
  await wl.populate(WISHLIST_POPULATE);
  const products = wl.products.filter((p) => p && p.isActive);
  res
    .status(201)
    .json({ success: true, data: { _id: wl._id, products, count: products.length } });
});

// DELETE /api/wishlist/remove/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const wl = await getOrCreateWishlist(req.user._id);
  wl.products = wl.products.filter(
    (p) => String(p) !== String(req.params.productId)
  );
  await wl.save();
  await wl.populate(WISHLIST_POPULATE);
  const products = wl.products.filter((p) => p && p.isActive);
  res.json({ success: true, data: { _id: wl._id, products, count: products.length } });
});
