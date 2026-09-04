import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { findByEmail, createUser, comparePassword, toSafeUser } from '../db/users.js';
import { setAuthCookie, clearAuthCookie } from '../utils/token.js';
import { mergeGuestCart } from '../db/cart.js';

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await findByEmail(email);
  if (exists) throw ApiError.conflict('An account with that email already exists');

  const user = await createUser({ name, email, password });

  setAuthCookie(res, user._id);
  await mergeGuestCart(req.guestId, user._id);

  res.status(201).json({ success: true, user });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const row = await findByEmail(email, { withPasswordHash: true });
  if (!row || !(await comparePassword(password, row.password_hash))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  const user = toSafeUser(row);

  setAuthCookie(res, user._id);
  await mergeGuestCart(req.guestId, user._id);

  res.json({ success: true, user });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out' });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user ?? null });
});
