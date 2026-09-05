import { body } from 'express-validator';
import { ORDER_STATUS } from '../utils/constants.js';

export const adminUpdateOrderStatusValidator = [
  body('status').isIn(ORDER_STATUS).withMessage('Invalid status'),
  body('note').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
];
