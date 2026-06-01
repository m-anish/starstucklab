import Stripe from 'stripe';

// Stripe client singleton — server-side only
export function getStripe(): Stripe {
  const key = import.meta.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key, { apiVersion: '2025-06-30' });
}

// Product → Stripe price mapping
// In production, replace values with actual Stripe Price IDs (price_xxx)
// These are created in the Stripe dashboard or via the Stripe API
export const STRIPE_PRICE_IDS: Record<string, string> = {
  // Format: 'product-slug__variant-key': 'price_xxx'
  // For products with no variants, use just the slug
  m42: import.meta.env.STRIPE_PRICE_M42 ?? 'price_placeholder_m42',
  elli: import.meta.env.STRIPE_PRICE_ELLI ?? 'price_placeholder_elli',
};

export interface CartItem {
  productSlug: string;
  title: string;
  price: number; // in INR, as integer paise × 100
  quantity: number;
  customization?: Record<string, string>;
}

// Build Stripe line items from cart
export function buildLineItems(items: CartItem[]): Stripe.Checkout.SessionCreateParams.LineItem[] {
  return items.map((item) => ({
    price_data: {
      currency: 'inr',
      product_data: {
        name: item.title,
        description: item.customization
          ? Object.entries(item.customization)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')
          : undefined,
      },
      unit_amount: item.price * 100, // Stripe uses paise for INR
    },
    quantity: item.quantity,
  }));
}
