import { Router } from 'express';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import cartRoutes from './cartRoutes.js';
import wishlistRoutes from './wishlistRoutes.js';
import orderRoutes from './orderRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import shippingRoutes from './shippingRoutes.js';
import contactRoutes from './contactRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, status: 'ok', ts: new Date().toISOString() })
);

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/shipping', shippingRoutes);
router.use('/contact', contactRoutes);
router.use('/admin', adminRoutes);

export default router;
