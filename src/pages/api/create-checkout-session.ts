import type { APIRoute } from 'astro';
import { getStripe, buildLineItems } from '../../lib/stripe';
import type { CartItem } from '../../lib/stripe';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const items: CartItem[] = body.items;

    if (!items?.length) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), { status: 400 });
    }

    const stripe = getStripe();
    const origin = request.headers.get('origin') ?? 'https://starstucklab.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: buildLineItems(items),
      success_url: `${origin}/order?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/machines`,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['IN'],
      },
      // GST handled via Stripe Tax (configure in Stripe dashboard)
      // automatic_tax: { enabled: true },
      metadata: {
        // Store customization info for fulfillment
        items_summary: items
          .map((i) => `${i.title} x${i.quantity}`)
          .join(', '),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[checkout] Stripe session error:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
