import { v4 as uuidv4 } from 'uuid';
import { isProd } from '../config/env.js';

export const GUEST_COOKIE = 'guestId';

/**
 * Ensures every visitor has a stable guestId cookie so guest carts work.
 * Logged-in users still get one; it is used only until their cart is merged.
 */
export function ensureGuestId(req, res, next) {
  let guestId = req.cookies?.[GUEST_COOKIE];
  if (!guestId) {
    guestId = uuidv4();
    res.cookie(GUEST_COOKIE, guestId, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
  }
  req.guestId = guestId;
  next();
}
