import { body, param } from 'express-validator';

export const addToCartValidator = [
  body('productId').trim().notEmpty().withMessage('productId is required').isMongoId(),
  body('color').trim().notEmpty().withMessage('color is required'),
  body('size').trim().notEmpty().withMessage('size is required'),
  body('quantity').optional().isInt({ min: 1, max: 20 }).toInt(),
];

export const updateCartValidator = [
  body('itemId').trim().notEmpty().withMessage('itemId is required').isMongoId(),
  body('quantity').isInt({ min: 1, max: 20 }).withMessage('quantity must be 1-20').toInt(),
];

export const removeCartItemValidator = [
  param('itemId').isMongoId().withMessage('Invalid itemId'),
];

export const wishlistAddValidator = [
  body('productId').trim().notEmpty().withMessage('productId is required').isMongoId(),
];

export const wishlistRemoveValidator = [
  param('productId').isMongoId().withMessage('Invalid productId'),
];
