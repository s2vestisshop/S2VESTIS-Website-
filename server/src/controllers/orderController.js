import crypto from 'node:crypto';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Order from '../models/Order.js';
import { getUserCart, populateCart } from '../services/cartService.js';

function generateOrderNumber() {
  return `S2V-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function variantImage(product, color) {
  const v = product?.variants?.find(
    (x) => x.color.toLowerCase() === String(color).toLowerCase()
  );
  return v?.images?.[0] ?? product?.variants?.[0]?.images?.[0] ?? '';
}

// POST /api/orders  — demo: snapshot the user's cart into an order, then clear it
export const createOrder = asyncHandler(async (req, res) => {
  const cart = await getUserCart(req.user._id);
  await populateCart(cart);

  const liveItems = cart.items.filter((i) => i.product);
  if (liveItems.length === 0) {
    throw ApiError.badRequest('Your cart is empty');
  }

  const items = liveItems.map((i) => ({
    product: i.product._id,
    name: i.product.name,
    slug: i.product.slug,
    image: variantImage(i.product, i.color),
    color: i.color,
    size: i.size,
    quantity: i.quantity,
    price: i.priceAtAdd,
  }));

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // retry once on the (astronomically unlikely) orderNumber collision
  let order;
  for (let attempt = 0; attempt < 3 && !order; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      order = await Order.create({
        user: req.user._id,
        orderNumber: generateOrderNumber(),
        items,
        itemCount,
        total,
        status: 'demo-placed',
      });
    } catch (err) {
      if (err.code === 11000 && attempt < 2) continue;
      throw err;
    }
  }

  cart.items = [];
  await cart.save();

  res.status(201).json({ success: true, data: order });
});

// GET /api/orders  — the current user's orders, newest first
export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: orders });
});

// GET /api/orders/:id
export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!order) throw ApiError.notFound('Order not found');
  res.json({ success: true, data: order });
});
