import { body } from 'express-validator';

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const loginValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
];

export const googleSignInValidator = [
  body('accessToken').trim().notEmpty().withMessage('accessToken is required'),
];

export const resetPasswordValidator = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
