import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';
import { setAuthCookie, clearAuthCookie } from '../utils/token.js';
import { mergeGuestCartIntoUser } from '../services/cartService.js';

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('An account with that email already exists');

  const user = await User.create({ name, email, password });

  setAuthCookie(res, user._id);
  await mergeGuestCartIntoUser(req.guestId, user._id);

  res.status(201).json({ success: true, user: user.toSafeJSON() });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  setAuthCookie(res, user._id);
  await mergeGuestCartIntoUser(req.guestId, user._id);

  res.json({ success: true, user: user.toSafeJSON() });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out' });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  if (!req.user) return res.json({ success: true, user: null });
  return res.json({ success: true, user: req.user.toSafeJSON() });
});
