import { body } from 'express-validator';

export const checkoutValidator = [
  body('address.fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 120 }),
  body('address.phone')
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian phone number'),
  body('address.line1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('address.line2').optional({ values: 'falsy' }).trim(),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').optional({ values: 'falsy' }).trim(),
  body('address.postalCode')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Enter a valid 6-digit PIN code'),
  body('couponCode').optional({ values: 'falsy' }).trim().isLength({ max: 40 }),
];

export const verifyValidator = [
  body('razorpay_order_id').trim().notEmpty(),
  body('razorpay_payment_id').trim().notEmpty(),
  body('razorpay_signature').trim().notEmpty(),
];
