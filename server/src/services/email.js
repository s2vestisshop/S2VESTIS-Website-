import { Resend } from 'resend';
import { env, isEmailConfigured } from '../config/env.js';

const resend = isEmailConfigured ? new Resend(env.email.apiKey) : null;

/**
 * Sends one email, or logs it to the console when RESEND_API_KEY isn't set
 * (local dev) so nothing crashes without a real email account. Callers are
 * expected to wrap this in try/catch — a provider outage should never block
 * checkout or a webhook response, just leave the corresponding
 * email_outbox row marked 'failed' for visibility (see db/email.js).
 */
export async function sendEmail({ to, subject, html }) {
  if (!resend) {
    // eslint-disable-next-line no-console
    console.log(`[email:dev] to=${to} subject="${subject}"`);
    return;
  }
  const { error } = await resend.emails.send({ from: env.email.from, to, subject, html });
  if (error) throw new Error(error.message || 'Resend send failed');
}
