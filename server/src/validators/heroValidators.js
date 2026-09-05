import { body, param } from 'express-validator';

const ALIGNS = ['left', 'center'];

export const createHeroSlideValidator = [
  body('image').trim().notEmpty().withMessage('Image is required').isLength({ max: 2048 }),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 160 }),
  body('align').optional().isIn(ALIGNS),
  body('eyebrow').optional().isString().isLength({ max: 80 }),
  body('subtitle').optional().isString().isLength({ max: 400 }),
  body('ctaText').optional().isString().isLength({ max: 60 }),
  body('ctaLink').optional().isString().isLength({ max: 2048 }),
  body('secondaryText').optional().isString().isLength({ max: 60 }),
  body('secondaryLink').optional().isString().isLength({ max: 2048 }),
  body('sortOrder').optional().isInt().toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
];

export const updateHeroSlideValidator = [
  param('id').isUUID().withMessage('Invalid slide id'),
  body('image').optional().trim().notEmpty().isLength({ max: 2048 }),
  body('title').optional().trim().notEmpty().isLength({ max: 160 }),
  body('align').optional().isIn(ALIGNS),
  body('eyebrow').optional().isString().isLength({ max: 80 }),
  body('subtitle').optional().isString().isLength({ max: 400 }),
  body('ctaText').optional().isString().isLength({ max: 60 }),
  body('ctaLink').optional().isString().isLength({ max: 2048 }),
  body('secondaryText').optional().isString().isLength({ max: 60 }),
  body('secondaryLink').optional().isString().isLength({ max: 2048 }),
  body('sortOrder').optional().isInt().toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
];

export const reorderHeroSlidesValidator = [
  body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
  body('ids.*').isUUID().withMessage('Each id must be a UUID'),
];
