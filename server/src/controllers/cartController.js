import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as productsDb from '../db/products.js';
import * as cartDb from '../db/cart.js';

async function respondWithCart(req, res, status = 200) {
  const cart = await cartDb.getCartState(req);
  res.status(status).json({ success: true, cart });
}

// GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  await cartDb.resolveCartId(req); // ensure a cart row exists (matches old get-or-create behaviour)
  await respondWithCart(req, res);
});

// POST /api/cart/add   body: { productId, color, size, quantity }
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, color, size } = req.body;
  const quantity = Number(req.body.quantity) || 1;

  const product = await productsDb.getActiveProductPrice(productId);
  if (!product) throw ApiError.notFound('Product not found');

  const { variant, sizeRow } = await productsDb.findVariantAndSize(productId, color, size);
  if (!variant) throw ApiError.badRequest(`Colour "${color}" is not available`);
  if (!sizeRow) throw ApiError.badRequest(`Size "${size}" is not available in ${color}`);

  const cartId = await cartDb.resolveCartId(req);
  const existing = await cartDb.findCartItem(cartId, sizeRow.variantSizeId);
  const desiredQty = (existing?.quantity || 0) + quantity;

  if (desiredQty > sizeRow.stock) {
    throw ApiError.badRequest(
      sizeRow.stock === 0
        ? 'This size is out of stock'
        : `Only ${sizeRow.stock} left in ${color} / ${size}`
    );
  }

  await cartDb.upsertCartItem({
    cartId,
    variantSizeId: sizeRow.variantSizeId,
    quantity: desiredQty,
    priceAtAdd: product.effective_price,
  });

  await respondWithCart(req, res, 201);
});

// PUT /api/cart/update   body: { itemId, quantity }
export const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId, quantity } = req.body;
  const cartId = await cartDb.resolveCartId(req);

  const item = await cartDb.getCartItemWithStock(cartId, itemId);
  if (!item) throw ApiError.notFound('Cart item not found');

  if (!item.productActive) {
    await cartDb.deleteCartItem(cartId, itemId);
    throw ApiError.badRequest('That product is no longer available and was removed');
  }

  if (quantity > item.stock) {
    throw ApiError.badRequest(
      item.stock === 0 ? 'This size is out of stock' : `Only ${item.stock} left in stock`
    );
  }

  await cartDb.updateCartItemQuantity(itemId, quantity);
  await respondWithCart(req, res);
});

// DELETE /api/cart/remove/:itemId
export const removeCartItem = asyncHandler(async (req, res) => {
  const cartId = await cartDb.resolveCartId(req);
  const removed = await cartDb.deleteCartItem(cartId, req.params.itemId);
  if (!removed) throw ApiError.notFound('Cart item not found');
  await respondWithCart(req, res);
});

// DELETE /api/cart/clear
export const clearCart = asyncHandler(async (req, res) => {
  const cartId = await cartDb.resolveCartId(req);
  await cartDb.clearCartItems(cartId);
  await respondWithCart(req, res);
});
