import jwt from 'jsonwebtoken';
import { env, isProd } from '../config/env.js';

export const AUTH_COOKIE = 'token';

export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure || isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
}

/** Sets the JWT httpOnly cookie on the response. */
export function setAuthCookie(res, userId) {
  const token = signToken({ id: String(userId) });
  res.cookie(AUTH_COOKIE, token, authCookieOptions());
  return token;
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, { ...authCookieOptions(), maxAge: undefined });
}
