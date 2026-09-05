import { Router } from 'express';
import {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  googleSignIn,
} from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  googleSignInValidator,
} from '../validators/authValidators.js';

const router = Router();

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.post('/logout', authLimiter, logout);
router.get('/me', me);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidator, validate, resetPassword);
router.post('/google', authLimiter, googleSignInValidator, validate, googleSignIn);

export default router;
