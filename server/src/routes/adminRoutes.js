import { Router } from 'express';
import {
  adminListProducts,
  adminGetProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminUpload,
  adminStats,
  adminListOrders,
  adminGetOrderDetail,
  adminUpdateOrderStatusHandler,
  adminRetryShipment,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import {
  createProductValidator,
  updateProductValidator,
  idParamValidator,
} from '../validators/productValidators.js';
import {
  createCategoryValidator,
  updateCategoryValidator,
} from '../validators/categoryValidators.js';
import { adminUpdateOrderStatusValidator } from '../validators/orderValidators.js';

const router = Router();

router.use(protect, admin);

// Dashboard
router.get('/stats', adminStats);

// Products
router.get('/products', adminListProducts);
router.get('/products/:id', idParamValidator, validate, adminGetProduct);
router.post('/products', createProductValidator, validate, adminCreateProduct);
router.put('/products/:id', updateProductValidator, validate, adminUpdateProduct);
router.delete('/products/:id', idParamValidator, validate, adminDeleteProduct);

// Orders
router.get('/orders', adminListOrders);
router.get('/orders/:id', idParamValidator, validate, adminGetOrderDetail);
router.put(
  '/orders/:id/status',
  idParamValidator,
  adminUpdateOrderStatusValidator,
  validate,
  adminUpdateOrderStatusHandler
);
router.post('/orders/:id/create-shipment', idParamValidator, validate, adminRetryShipment);

// Categories
router.get('/categories', adminListCategories);
router.post('/categories', createCategoryValidator, validate, adminCreateCategory);
router.put('/categories/:id', updateCategoryValidator, validate, adminUpdateCategory);
router.delete('/categories/:id', idParamValidator, validate, adminDeleteCategory);

// Image upload (accepts up to 10 files under field "images", or single "image")
router.post(
  '/upload',
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'image', maxCount: 1 },
  ]),
  (req, _res, next) => {
    // normalize .fields() output into req.files array
    const collected = [];
    if (req.files?.images) collected.push(...req.files.images);
    if (req.files?.image) collected.push(...req.files.image);
    req.files = collected;
    next();
  },
  adminUpload
);

export default router;
