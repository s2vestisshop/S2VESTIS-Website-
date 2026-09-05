import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as productsDb from '../db/products.js';
import * as categoriesDb from '../db/categories.js';
import * as adminDb from '../db/admin.js';
import * as shippingDb from '../db/shipping.js';
import { findById } from '../db/users.js';
import { persistFile, uploadStorageMode } from '../middleware/upload.js';
import { createShipmentOrder } from '../services/shiprocket.js';

/* --------------------------------- Products -------------------------------- */

// GET /api/admin/products  (includes inactive; search + pagination)
export const adminListProducts = asyncHandler(async (req, res) => {
  const { search, category, status, page = 1, limit = 20 } = req.query;
  const { items, pagination } = await productsDb.adminListProducts({
    search,
    category,
    status,
    page,
    limit,
  });
  res.json({ success: true, data: items, pagination });
});

// GET /api/admin/products/:id
export const adminGetProduct = asyncHandler(async (req, res) => {
  const product = await productsDb.adminGetProductById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ success: true, data: product });
});

// POST /api/admin/products
export const adminCreateProduct = asyncHandler(async (req, res) => {
  const ok = await productsDb.categoryExists(req.body.category);
  if (!ok) throw ApiError.badRequest('Category does not exist');

  const product = await productsDb.adminCreateProduct(req.body);
  res.status(201).json({ success: true, data: product });
});

// PUT /api/admin/products/:id
export const adminUpdateProduct = asyncHandler(async (req, res) => {
  if (req.body.category) {
    const ok = await productsDb.categoryExists(req.body.category);
    if (!ok) throw ApiError.badRequest('Category does not exist');
  }

  let product;
  try {
    product = await productsDb.adminUpdateProduct(req.params.id, req.body);
  } catch (err) {
    if (err.message?.includes('PRODUCT_NOT_FOUND')) throw ApiError.notFound('Product not found');
    throw err;
  }
  res.json({ success: true, data: product });
});

// DELETE /api/admin/products/:id
export const adminDeleteProduct = asyncHandler(async (req, res) => {
  const deleted = await productsDb.adminDeleteProduct(req.params.id);
  if (!deleted) throw ApiError.notFound('Product not found');
  res.json({ success: true, message: 'Product deleted' });
});

/* -------------------------------- Categories ------------------------------- */

// GET /api/admin/categories  (includes inactive)
export const adminListCategories = asyncHandler(async (_req, res) => {
  const data = await categoriesDb.adminListCategories();
  res.json({ success: true, data });
});

// POST /api/admin/categories
export const adminCreateCategory = asyncHandler(async (req, res) => {
  const { name, gender = 'unisex', image = '', isActive = true } = req.body;
  const category = await categoriesDb.createCategory({ name, gender, image, isActive });
  res.status(201).json({ success: true, data: category });
});

// PUT /api/admin/categories/:id
export const adminUpdateCategory = asyncHandler(async (req, res) => {
  const category = await categoriesDb.updateCategory(req.params.id, req.body);
  if (!category) throw ApiError.notFound('Category not found');
  res.json({ success: true, data: category });
});

// DELETE /api/admin/categories/:id
export const adminDeleteCategory = asyncHandler(async (req, res) => {
  const inUse = await categoriesDb.countProductsInCategory(req.params.id);
  if (inUse > 0) {
    throw ApiError.badRequest(
      `Cannot delete: ${inUse} product(s) still use this category. Reassign them first.`
    );
  }
  const deleted = await categoriesDb.deleteCategory(req.params.id);
  if (!deleted) throw ApiError.notFound('Category not found');
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

/* ----------------------------------- Orders --------------------------------- */

// GET /api/admin/orders  (search by order number / customer name+email, status filter, paginated)
export const adminListOrders = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  const { items, pagination } = await adminDb.adminListOrders({ search, status, page, limit });
  res.json({ success: true, data: items, pagination });
});

// GET /api/admin/orders/:id
export const adminGetOrderDetail = asyncHandler(async (req, res) => {
  const order = await adminDb.adminGetOrder(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  res.json({ success: true, data: order });
});

// PUT /api/admin/orders/:id/status — manual override (cancel/refund/resolve a review flag)
export const adminUpdateOrderStatusHandler = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  let order;
  try {
    order = await adminDb.adminUpdateOrderStatus(req.params.id, status, note);
  } catch (err) {
    if (err.message?.startsWith('ORDER_NOT_FOUND')) throw ApiError.notFound('Order not found');
    throw err;
  }
  res.json({ success: true, data: order });
});

// POST /api/admin/orders/:id/create-shipment — manual retry for when
// automatic Shiprocket creation (right after payment) failed or Shiprocket
// wasn't configured yet at the time.
export const adminRetryShipment = asyncHandler(async (req, res) => {
  const order = await adminDb.adminGetOrder(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.shiprocketOrderId) {
    throw ApiError.badRequest('A Shiprocket shipment already exists for this order');
  }

  const user = await findById(order.customer.id);
  const shipment = await createShipmentOrder({
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    address: order.address,
    items: order.items,
    itemCount: order.itemCount,
    total: order.total,
    customerEmail: user?.email,
  });
  await shippingDb.recordShipmentCreated(order.id, shipment);

  const updated = await adminDb.adminGetOrder(order.id);
  res.json({ success: true, data: updated });
});

/* -------------------------------- Dashboard ------------------------------- */

// GET /api/admin/stats
export const adminStats = asyncHandler(async (_req, res) => {
  const data = await adminDb.adminStats();
  res.json({ success: true, data });
});
