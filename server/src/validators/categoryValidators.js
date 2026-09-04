import { body, param } from 'express-validator';
import { GENDERS } from '../utils/constants.js';

export const createCategoryValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
  body('gender').optional().isIn(GENDERS),
  body('image').optional().isString(),
  body('isActive').optional().isBoolean().toBoolean(),
];

export const updateCategoryValidator = [
  param('id').isUUID().withMessage('Invalid category id'),
  body('name').optional().trim().notEmpty().isLength({ max: 60 }),
  body('gender').optional().isIn(GENDERS),
  body('image').optional().isString(),
  body('isActive').optional().isBoolean().toBoolean(),
];
