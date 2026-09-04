import { Router } from 'express';
import { listMyOrders, getMyOrder } from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParamValidator } from '../validators/productValidators.js';

const router = Router();

router.use(protect); // orders always belong to a signed-in user

// Orders are created by the payments flow now (see paymentRoutes.js) —
// only after a Razorpay payment is verified — not directly here.
router.get('/', listMyOrders);
router.get('/:id', idParamValidator, validate, getMyOrder);

export default router;
