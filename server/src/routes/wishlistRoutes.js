import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  wishlistAddValidator,
  wishlistRemoveValidator,
} from '../validators/cartValidators.js';

const router = Router();

router.use(protect); // wishlist requires a logged-in user

router.get('/', getWishlist);
router.post('/add', wishlistAddValidator, validate, addToWishlist);
router.delete('/remove/:productId', wishlistRemoveValidator, validate, removeFromWishlist);

export default router;
