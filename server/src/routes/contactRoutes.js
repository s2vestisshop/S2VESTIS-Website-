import { Router } from 'express';
import { submitContact } from '../controllers/contactController.js';
import { validate } from '../middleware/validate.js';
import { contactValidator } from '../validators/contactValidators.js';

const router = Router();

router.post('/', contactValidator, validate, submitContact);

export default router;
