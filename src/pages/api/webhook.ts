import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import { getResend, orderConfirmationHtml, adminOrderNotificationHtml } from '../../lib/resend';
import type { OrderConfirmationData } from '../../lib/resend';

export const POST: APIRoute = async ({ request }) => {
  const stripe = getStripe();
  const resend = getResend();

  const sig = request.headers.get('stripe-signature');
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  let event;
  try {
    const rawBody = await request.text();
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Retrieve full session with line items
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items'],
    });

    const customerEmail = fullSession.customer_details?.email;
    const customerName = fullSession.customer_details?.name ?? 'Customer';

    if (!customerEmail) {
      console.warn('[webhook] No customer email in session:', session.id);
      return new Response('OK', { status: 200 });
    }

    const items = (fullSession.line_items?.data ?? []).map((li) => ({
      title: li.description ?? li.price?.product?.toString() ?? 'Item',
      quantity: li.quantity ?? 1,
      price: Math.round((li.amount_total ?? 0) / 100), // paise → INR
      customization: undefined,
    }));

    const total = Math.round((fullSession.amount_total ?? 0) / 100);

    const orderData: OrderConfirmationData = {
      customerEmail,
      customerName,
      orderId: session.id,
      items,
      total,
    };

    const fromEmail = import.meta.env.RESEND_FROM_EMAIL ?? 'Starstuck Lab <orders@starstucklab.com>';
    const adminEmail = import.meta.env.ADMIN_EMAIL ?? 'hello@starstucklab.com';

    // Send confirmation to customer
    await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject: `Order confirmed — ${session.id.slice(-8).toUpperCase()}`,
      html: orderConfirmationHtml(orderData),
    });

    // Notify admin
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `New order: ₹${total.toLocaleString('en-IN')} — ${customerName}`,
      html: adminOrderNotificationHtml(orderData),
    });

    console.log(`[webhook] Order fulfilled: ${session.id}`);
  }

  return new Response('OK', { status: 200 });
};
