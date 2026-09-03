import { Router } from 'express';
import { register, login, logout, me } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { registerValidator, loginValidator } from '../validators/authValidators.js';

const router = Router();

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.post('/logout', authLimiter, logout);
router.get('/me', me);

export default router;
