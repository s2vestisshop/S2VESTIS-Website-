function formatPrice(value) {
  return `₹${Math.round(Number(value)).toLocaleString('en-IN')}`;
}

function wrap(preheader, bodyHtml) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f3ef;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
    <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <p style="font-size:20px;font-weight:bold;letter-spacing:0.08em;margin:0 0 24px;">S2VESTIS</p>
      ${bodyHtml}
      <p style="margin-top:32px;font-size:12px;color:#78716c;">
        S2VESTIS — Considered Apparel. Questions? Reply to this email.
      </p>
    </div>
  </body>
</html>`;
}

function itemsTable(items) {
  const rows = items
    .map(
      (it) => `
    <tr>
      <td style="padding:8px 0;font-size:14px;">${it.name} — ${it.color}, ${it.size} × ${it.quantity}</td>
      <td style="padding:8px 0;font-size:14px;text-align:right;">${formatPrice(it.unit_price * it.quantity)}</td>
    </tr>`
    )
    .join('');
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}</table>`;
}

export function orderConfirmationEmail({ orderNumber, total, items = [] }) {
  return {
    subject: `Order confirmed — ${orderNumber}`,
    html: wrap(
      `Your S2VESTIS order ${orderNumber} is confirmed.`,
      `<h2 style="font-size:18px;margin:0 0 8px;">Thanks for your order</h2>
       <p style="font-size:14px;color:#44403c;">Order <strong>${orderNumber}</strong> is confirmed and being prepared.</p>
       ${items.length ? itemsTable(items) : ''}
       <p style="font-size:15px;font-weight:bold;">Total: ${formatPrice(total)}</p>
       <p style="font-size:14px;color:#44403c;">We'll email you again once it ships.</p>`
    ),
  };
}

export function orderShippedEmail({ orderNumber, courierName, awbCode, trackingUrl, estimatedDeliveryDate }) {
  return {
    subject: `Your order ${orderNumber} has shipped`,
    html: wrap(
      `${orderNumber} is on its way.`,
      `<h2 style="font-size:18px;margin:0 0 8px;">Your order has shipped</h2>
       <p style="font-size:14px;color:#44403c;">Order <strong>${orderNumber}</strong> is on its way${courierName ? ` with ${courierName}` : ''}.</p>
       ${awbCode ? `<p style="font-size:14px;">Tracking number: <strong>${awbCode}</strong></p>` : ''}
       ${estimatedDeliveryDate ? `<p style="font-size:14px;">Estimated delivery: <strong>${estimatedDeliveryDate}</strong></p>` : ''}
       ${trackingUrl ? `<p style="margin-top:16px;"><a href="${trackingUrl}" style="color:#b45309;">Track your package →</a></p>` : ''}`
    ),
  };
}

export function orderDeliveredEmail({ orderNumber }) {
  return {
    subject: `Delivered — order ${orderNumber}`,
    html: wrap(
      `${orderNumber} has been delivered.`,
      `<h2 style="font-size:18px;margin:0 0 8px;">Delivered</h2>
       <p style="font-size:14px;color:#44403c;">Order <strong>${orderNumber}</strong> has been delivered. We hope you love it.</p>
       <p style="font-size:14px;color:#44403c;">Not quite right? You have 15 days to start a return from your account.</p>`
    ),
  };
}

export function passwordResetEmail({ resetUrl }) {
  return {
    subject: 'Reset your S2VESTIS password',
    html: wrap(
      'Reset your password.',
      `<h2 style="font-size:18px;margin:0 0 8px;">Reset your password</h2>
       <p style="font-size:14px;color:#44403c;">Click below to choose a new password. This link expires in 1 hour and can only be used once.</p>
       <p style="margin:20px 0;"><a href="${resetUrl}" style="background:#1c1917;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;">Reset password</a></p>
       <p style="font-size:12px;color:#78716c;">If you didn't request this, you can safely ignore this email.</p>`
    ),
  };
}

export function adminPaymentReviewAlert({ orderNumber, reason }) {
  return {
    subject: `[Review needed] Order ${orderNumber}`,
    html: wrap(
      `Order ${orderNumber} needs a look.`,
      `<h2 style="font-size:18px;margin:0 0 8px;">Order flagged for review</h2>
       <p style="font-size:14px;color:#44403c;">Order <strong>${orderNumber}</strong>: ${reason}</p>
       <p style="font-size:14px;color:#44403c;">Check it in the admin panel under Orders.</p>`
    ),
  };
}
