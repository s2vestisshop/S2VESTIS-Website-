import { body, param } from 'express-validator';

export const addToCartValidator = [
  body('productId').trim().notEmpty().withMessage('productId is required').isUUID(),
  body('color').trim().notEmpty().withMessage('color is required'),
  body('size').trim().notEmpty().withMessage('size is required'),
  body('quantity').optional().isInt({ min: 1, max: 20 }).toInt(),
];

export const updateCartValidator = [
  body('itemId').trim().notEmpty().withMessage('itemId is required').isUUID(),
  body('quantity').isInt({ min: 1, max: 20 }).withMessage('quantity must be 1-20').toInt(),
];

export const removeCartItemValidator = [
  param('itemId').isUUID().withMessage('Invalid itemId'),
];

export const wishlistAddValidator = [
  body('productId').trim().notEmpty().withMessage('productId is required').isUUID(),
];

export const wishlistRemoveValidator = [
  param('productId').isUUID().withMessage('Invalid productId'),
];
