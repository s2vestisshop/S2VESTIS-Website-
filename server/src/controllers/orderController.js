import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as ordersDb from '../db/orders.js';
import { resolveCartId } from '../db/cart.js';

function translatePlaceOrderError(err) {
  const msg = err.message || '';
  if (msg.startsWith('EMPTY_CART')) return ApiError.badRequest('Your cart is empty');
  if (msg.startsWith('INSUFFICIENT_STOCK')) {
    const [, name, size] = msg.split(':');
    return ApiError.badRequest(`Only limited stock left for ${name} (${size}) — please update your cart.`);
  }
  if (msg.startsWith('INVALID_COUPON')) {
    return ApiError.badRequest(msg.split(':').slice(1).join(':') || 'Invalid coupon code');
  }
  return null;
}

// POST /api/orders  — demo: snapshot the user's cart into an order, then clear it
export const createOrder = asyncHandler(async (req, res) => {
  const cartId = await resolveCartId(req);
  try {
    const order = await ordersDb.placeOrder(req.user._id, cartId);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    const translated = translatePlaceOrderError(err);
    if (translated) throw translated;
    throw err;
  }
});

// GET /api/orders  — the current user's orders, newest first
export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await ordersDb.listMyOrders(req.user._id);
  res.json({ success: true, data: orders });
});

// GET /api/orders/:id
export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await ordersDb.getMyOrder(req.user._id, req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  res.json({ success: true, data: order });
});
