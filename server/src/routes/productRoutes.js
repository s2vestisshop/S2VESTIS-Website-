import { Router } from 'express';
import {
  listProducts,
  getProductBySlug,
  getRelatedProducts,
} from '../controllers/productController.js';
import { validate } from '../middleware/validate.js';
import {
  listProductsValidator,
  slugParamValidator,
} from '../validators/productValidators.js';

const router = Router();

router.get('/', listProductsValidator, validate, listProducts);
router.get('/:slug', slugParamValidator, validate, getProductBySlug);
router.get('/:slug/related', slugParamValidator, validate, getRelatedProducts);

export default router;
