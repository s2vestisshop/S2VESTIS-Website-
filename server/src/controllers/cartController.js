import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Product from '../models/Product.js';
import { resolveCart, populateCart, serializeCart } from '../services/cartService.js';

function findVariant(product, color) {
  return product.variants.find(
    (v) => v.color.toLowerCase() === String(color).toLowerCase()
  );
}

function findSizeRow(variant, size) {
  return variant?.sizes.find(
    (s) => s.size.toLowerCase() === String(size).toLowerCase()
  );
}

async function respondWithCart(res, cart, status = 200) {
  await populateCart(cart);
  res.status(status).json({ success: true, cart: serializeCart(cart) });
}

// GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  const cart = await resolveCart(req);
  await respondWithCart(res, cart);
});

// POST /api/cart/add   body: { productId, color, size, quantity }
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, color, size } = req.body;
  const quantity = Number(req.body.quantity) || 1;

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw ApiError.notFound('Product not found');

  const variant = findVariant(product, color);
  if (!variant) throw ApiError.badRequest(`Colour "${color}" is not available`);

  const sizeRow = findSizeRow(variant, size);
  if (!sizeRow) throw ApiError.badRequest(`Size "${size}" is not available in ${color}`);

  const cart = await resolveCart(req);
  const existing = cart.items.find(
    (i) =>
      String(i.product) === String(product._id) &&
      i.color.toLowerCase() === String(color).toLowerCase() &&
      i.size.toLowerCase() === String(size).toLowerCase()
  );

  const desiredQty = (existing?.quantity || 0) + quantity;
  if (desiredQty > sizeRow.stock) {
    throw ApiError.badRequest(
      sizeRow.stock === 0
        ? 'This size is out of stock'
        : `Only ${sizeRow.stock} left in ${color} / ${size}`
    );
  }

  if (existing) {
    existing.quantity = desiredQty;
    existing.priceAtAdd = product.effectivePrice;
  } else {
    cart.items.push({
      product: product._id,
      color: variant.color,
      size: sizeRow.size,
      quantity,
      priceAtAdd: product.effectivePrice,
    });
  }

  await cart.save();
  await respondWithCart(res, cart, 201);
});

// PUT /api/cart/update   body: { itemId, quantity }
export const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId, quantity } = req.body;

  const cart = await resolveCart(req);
  const item = cart.items.id(itemId);
  if (!item) throw ApiError.notFound('Cart item not found');

  const product = await Product.findById(item.product);
  if (!product || !product.isActive) {
    item.deleteOne();
    await cart.save();
    throw ApiError.badRequest('That product is no longer available and was removed');
  }

  const variant = findVariant(product, item.color);
  const sizeRow = findSizeRow(variant, item.size);
  const stock = sizeRow?.stock ?? 0;
  if (quantity > stock) {
    throw ApiError.badRequest(
      stock === 0 ? 'This size is out of stock' : `Only ${stock} left in stock`
    );
  }

  item.quantity = quantity;
  await cart.save();
  await respondWithCart(res, cart);
});

// DELETE /api/cart/remove/:itemId
export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await resolveCart(req);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw ApiError.notFound('Cart item not found');
  item.deleteOne();
  await cart.save();
  await respondWithCart(res, cart);
});

// DELETE /api/cart/clear
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await resolveCart(req);
  cart.items = [];
  await cart.save();
  await respondWithCart(res, cart);
});
