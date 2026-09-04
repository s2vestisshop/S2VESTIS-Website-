import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as ordersDb from '../db/orders.js';

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
