import crypto from 'node:crypto';

/** Raw token is what gets emailed to the user; only its hash is ever stored
 * (see the `auth_tokens` table comment in the migration this implements). */
export function generateRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
