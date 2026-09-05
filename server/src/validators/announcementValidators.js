import { body } from 'express-validator';

export const createAnnouncementValidator = [
  body('text').trim().notEmpty().withMessage('Text is required').isLength({ max: 200 }),
  body('href').optional().isString().isLength({ max: 2048 }),
  body('sortOrder').optional().isInt().toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
];

export const updateAnnouncementValidator = [
  body('text').optional().trim().notEmpty().isLength({ max: 200 }),
  body('href').optional().isString().isLength({ max: 2048 }),
  body('sortOrder').optional().isInt().toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
];

export const reorderAnnouncementsValidator = [
  body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
  body('ids.*').isUUID().withMessage('Each id must be a UUID'),
];
