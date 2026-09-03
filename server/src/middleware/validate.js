import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Runs after an express-validator chain array. Collects errors into a
 * 400 ApiError with a field-keyed list.
 */
export function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({
    field: e.path ?? e.param,
    message: e.msg,
  }));
  return next(new ApiError(400, 'Validation failed', errors));
}
