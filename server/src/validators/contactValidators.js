import { body } from 'express-validator';

export const contactValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('message')
    .trim()
    .isLength({ min: 10, max: 8000 })
    .withMessage('Message must be at least 10 characters'),
];
