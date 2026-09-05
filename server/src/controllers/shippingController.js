import asyncHandler from '../utils/asyncHandler.js';
import * as shippingDb from '../db/shipping.js';
import * as emailDb from '../db/email.js';
import { findById } from '../db/users.js';
import { verifyWebhookToken } from '../services/shiprocket.js';
import { sendEmail } from '../services/email.js';
import { orderShippedEmail, orderDeliveredEmail } from '../services/emailTemplates.js';

/** Sends the shipped/delivered milestone email, inserting its own
 * email_outbox audit row (nothing in SQL pre-queues these two, unlike
 * order_confirmation). Never throws — an email hiccup must never affect the
 * webhook's 200 response. */
async function sendMilestoneEmailBestEffort(normalizedStatus, order, orderNumber, webhookBody) {
  if (normalizedStatus !== 'shipped' && normalizedStatus !== 'delivered') return;

  let outboxId = null;
  try {
    const user = await findById(order.userId);
    if (!user?.email) return;

    const template = normalizedStatus === 'shipped' ? 'order_shipped' : 'order_delivered';
    outboxId = await emailDb.insertOutboxRow({
      toEmail: user.email,
      template,
      payload: { orderId: order.id, orderNumber },
    });

    const { subject, html } =
      normalizedStatus === 'shipped'
        ? orderShippedEmail({
            orderNumber,
            courierName: webhookBody.courier_name || null,
            awbCode: webhookBody.awb || null,
            trackingUrl: webhookBody.track_url || webhookBody.tracking_url || null,
            estimatedDeliveryDate: webhookBody.etd || null,
          })
        : orderDeliveredEmail({ orderNumber });

    await sendEmail({ to: user.email, subject, html });
    await emailDb.markOutboxSent(outboxId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`${normalizedStatus} email failed for ${orderNumber}:`, err.message);
    if (outboxId) await emailDb.markOutboxFailed(outboxId, err.message).catch(() => {});
  }
}

function normalizeStatus(raw) {
  const s = String(raw || '').toLowerCase();
  if (s.includes('out for delivery')) return 'out_for_delivery';
  if (s.includes('deliver')) return 'delivered';
  if (s.includes('ship') || s.includes('transit') || s.includes('pick')) return 'shipped';
  return null;
}

// POST /api/shipping/webhook — Shiprocket's order/shipment status callback.
// Unauthenticated by design: a shared-secret header (set in their
// dashboard) is the authentication, not a session or HMAC signature.
export const handleShiprocketWebhook = asyncHandler(async (req, res) => {
  const token = req.headers['x-api-key'] || req.headers['x-webhook-token'];
  if (!verifyWebhookToken(token)) {
    return res.status(401).json({ success: false, message: 'Invalid webhook token' });
  }

  const body = req.body || {};
  // `channel_order_id` is Shiprocket's name for the order_id *we* supplied
  // when creating the shipment (our order_number) — the most reliable way
  // back to our own row. Fall back to matching on their own order id.
  const channelOrderNumber = body.channel_order_id || body.order_id;
  const rawStatus = body.current_status || body.shipment_status || body.status;

  try {
    let order = channelOrderNumber
      ? await shippingDb.findOrderByOrderNumber(String(channelOrderNumber))
      : null;
    if (!order && body.order_id) {
      order = await shippingDb.findOrderByShiprocketOrderId(String(body.order_id));
    }

    if (order) {
      const normalized = normalizeStatus(rawStatus);
      await shippingDb.recordShipmentEvent({
        orderId: order.id,
        status: normalized || String(rawStatus || 'update').toLowerCase(),
        description: rawStatus || null,
        occurredAt: new Date().toISOString(),
        rawPayload: body,
        awbCode: body.awb || null,
        courierName: body.courier_name || null,
        trackingUrl: body.track_url || body.tracking_url || null,
      });
      await sendMilestoneEmailBestEffort(normalized, order, String(channelOrderNumber || body.order_id), body);
    } else {
      // eslint-disable-next-line no-console
      console.error('Shiprocket webhook: could not match any order to', { channelOrderNumber, body });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Shiprocket webhook processing failed:', err.message);
  }

  // Ack once the token checks out, regardless of match/processing outcome —
  // an unmatched or malformed event shouldn't make Shiprocket retry forever.
  res.status(200).json({ success: true });
});
