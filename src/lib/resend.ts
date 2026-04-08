import { Resend } from 'resend';

export function getResend(): Resend {
  const key = import.meta.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

export interface OrderConfirmationData {
  customerEmail: string;
  customerName: string;
  orderId: string;
  items: Array<{ title: string; quantity: number; price: number; customization?: string }>;
  total: number;
}

export function orderConfirmationHtml(data: OrderConfirmationData): string {
  const itemRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
        ${item.title}${item.customization ? `<br><small style="color:#666">${item.customization}</small>` : ''}
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
    </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #111;">
  <h1 style="font-size: 1.5rem; border-bottom: 2px solid #111; padding-bottom: 12px;">
    Starstuck Lab — Order Confirmed
  </h1>
  <p>Hi ${data.customerName},</p>
  <p>Your order has been received. We'll start building it shortly.</p>

  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
    <thead>
      <tr>
        <th style="text-align:left; padding-bottom: 8px; border-bottom: 2px solid #111;">Item</th>
        <th style="text-align:center; padding-bottom: 8px; border-bottom: 2px solid #111;">Qty</th>
        <th style="text-align:right; padding-bottom: 8px; border-bottom: 2px solid #111;">Price</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="padding-top: 12px; font-weight: bold;">Total</td>
        <td style="padding-top: 12px; font-weight: bold; text-align: right;">₹${data.total.toLocaleString('en-IN')}</td>
      </tr>
    </tfoot>
  </table>

  <p>Order reference: <code>${data.orderId}</code></p>
  <p>Questions? Reply to this email or reach us at hello@starstucklab.com</p>

  <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
  <p style="color: #666; font-size: 0.85rem;">
    Starstuck Lab — Building small machines for an indifferent universe.
  </p>
</body>
</html>`;
}

export function adminOrderNotificationHtml(data: OrderConfirmationData): string {
  return `
<html><body style="font-family: monospace;">
  <h2>New Order: ${data.orderId}</h2>
  <p><strong>Customer:</strong> ${data.customerName} (${data.customerEmail})</p>
  <p><strong>Items:</strong></p>
  <ul>
    ${data.items.map((i) => `<li>${i.title} × ${i.quantity} — ₹${i.price}${i.customization ? ` [${i.customization}]` : ''}</li>`).join('')}
  </ul>
  <p><strong>Total:</strong> ₹${data.total.toLocaleString('en-IN')}</p>
</body></html>`;
}
