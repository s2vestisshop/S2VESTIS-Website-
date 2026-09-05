import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { findByEmail, createUser, comparePassword, updatePassword, toSafeUser } from '../db/users.js';
import { setAuthCookie, clearAuthCookie } from '../utils/token.js';
import { mergeGuestCart } from '../db/cart.js';
import { createToken, findValidToken, markTokenUsed } from '../db/authTokens.js';
import { generateRawToken, hashToken } from '../utils/authToken.js';
import { env } from '../config/env.js';
import { sendEmail } from '../services/email.js';
import { passwordResetEmail } from '../services/emailTemplates.js';

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

// POST /api/auth/forgot-password — always responds the same way regardless
// of whether the account exists, so this can't be used to enumerate
// registered emails.
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const row = await findByEmail(email);

  if (row) {
    const user = toSafeUser(row);
    const raw = generateRawToken();
    await createToken(user._id, 'password_reset', hashToken(raw));
    const resetUrl = `${env.clientUrl}/reset-password?token=${raw}`;
    try {
      const { subject, html } = passwordResetEmail({ resetUrl });
      await sendEmail({ to: user.email, subject, html });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Password reset email failed for ${email}:`, err.message);
    }
  }

  res.json({ success: true, message: 'If that email is registered, a reset link is on its way.' });
});

// POST /api/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const found = await findValidToken(hashToken(token), 'password_reset');
  if (!found) throw ApiError.badRequest('This reset link is invalid or has expired');

  await updatePassword(found.userId, password);
  await markTokenUsed(found.id);

  res.json({ success: true, message: 'Password updated — you can now sign in.' });
});
