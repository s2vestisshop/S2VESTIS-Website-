import { body, param, query } from 'express-validator';
import { GENDERS, SORTS } from '../utils/constants.js';

export const listProductsValidator = [
  query('category').optional().trim().isString(),
  query('gender').optional().isIn(GENDERS).withMessage('Invalid gender'),
  query('search').optional().trim().isString(),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  // size / color / ids accept a single value, a repeated param, or a comma list
  query('size').optional(),
  query('color').optional(),
  query('ids').optional(),
  query('sort').optional().isIn(Object.keys(SORTS)).withMessage('Invalid sort option'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 60 }).toInt(),
  query('featured').optional().isBoolean().toBoolean(),
];

export const slugParamValidator = [
  param('slug').trim().notEmpty().withMessage('Product slug is required'),
];

const variantSchemaValidator = body('variants')
  .isArray({ min: 1 })
  .withMessage('At least one colour variant is required');

export const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 140 }),
  body('description').optional().isString().isLength({ max: 5000 }),
  body('category').trim().notEmpty().withMessage('Category is required').isMongoId(),
  body('gender').optional().isIn(GENDERS),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number').toFloat(),
  body('discountPrice')
    .optional({ nullable: true })
    .customSanitizer((v) => (v === '' || v === null ? null : v))
    .custom((v) => v === null || Number(v) >= 0)
    .withMessage('Discount price must be a positive number'),
  body('isFeatured').optional().isBoolean().toBoolean(),
  body('isActive').optional().isBoolean().toBoolean(),
  variantSchemaValidator,
  body('variants.*.color').trim().notEmpty().withMessage('Variant colour is required'),
  body('variants.*.colorHex').trim().notEmpty().withMessage('Variant colour hex is required'),
  body('variants.*.images')
    .isArray({ min: 1 })
    .withMessage('Each variant needs at least one image'),
  body('variants.*.sizes')
    .isArray({ min: 1 })
    .withMessage('Each variant needs at least one size row'),
  body('variants.*.sizes.*.size').trim().notEmpty().withMessage('Size label is required'),
  body('variants.*.sizes.*.stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be zero or more')
    .toInt(),
];

export const updateProductValidator = [
  param('id').isMongoId().withMessage('Invalid product id'),
  body('name').optional().trim().notEmpty().isLength({ max: 140 }),
  body('description').optional().isString().isLength({ max: 5000 }),
  body('category').optional().trim().isMongoId(),
  body('gender').optional().isIn(GENDERS),
  body('price').optional().isFloat({ min: 0 }).toFloat(),
  body('discountPrice')
    .optional({ nullable: true })
    .customSanitizer((v) => (v === '' || v === null ? null : v))
    .custom((v) => v === null || Number(v) >= 0)
    .withMessage('Discount price must be a positive number'),
  body('isFeatured').optional().isBoolean().toBoolean(),
  body('isActive').optional().isBoolean().toBoolean(),
  body('variants').optional().isArray({ min: 1 }),
];

export const idParamValidator = [param('id').isMongoId().withMessage('Invalid id')];
