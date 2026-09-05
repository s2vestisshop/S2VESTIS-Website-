import { Router } from 'express';
import { handleShiprocketWebhook } from '../controllers/shippingController.js';

const router = Router();

router.post('/webhook', handleShiprocketWebhook);

export default router;
