import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cartController.js';
import { validate } from '../middleware/validate.js';
import {
  addToCartValidator,
  updateCartValidator,
  removeCartItemValidator,
} from '../validators/cartValidators.js';

const router = Router();

router.get('/', getCart);
router.post('/add', addToCartValidator, validate, addToCart);
router.put('/update', updateCartValidator, validate, updateCartItem);
router.delete('/remove/:itemId', removeCartItemValidator, validate, removeCartItem);
router.delete('/clear', clearCart);

export default router;
