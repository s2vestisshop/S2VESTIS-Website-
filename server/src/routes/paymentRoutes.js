import { Router } from 'express';
import { createCheckout, verifyPayment, handleWebhook } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { checkoutValidator, verifyValidator } from '../validators/paymentValidators.js';

const router = Router();

router.post('/checkout', protect, checkoutValidator, validate, createCheckout);
router.post('/verify', protect, verifyValidator, validate, verifyPayment);
// No `protect` — Razorpay isn't a logged-in user; its signature is the auth.
router.post('/webhook', handleWebhook);

export default router;
