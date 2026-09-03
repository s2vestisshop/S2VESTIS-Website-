import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { AUTH_COOKIE, verifyToken } from '../utils/token.js';
import User from '../models/User.js';

/**
 * Reads the JWT cookie if present and attaches req.user (or null).
 * Never throws — use `protect` to require authentication.
 */
export const attachUser = asyncHandler(async (req, _res, next) => {
  req.user = null;
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return next();
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (user) req.user = user;
  } catch {
    // invalid / expired token → treat as guest
  }
  return next();
});

export const protect = (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized('Please log in to continue'));
  return next();
};

export const admin = (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized('Please log in to continue'));
  if (req.user.role !== 'admin') return next(ApiError.forbidden('Admin access required'));
  return next();
};
