/// <reference types="astro/client" />

interface ImportMetaEnv {
  // Stripe
  readonly STRIPE_SECRET_KEY: string;
  readonly STRIPE_WEBHOOK_SECRET: string;
  readonly PUBLIC_STRIPE_PUBLISHABLE_KEY: string;

  // Resend
  readonly RESEND_API_KEY: string;
  readonly RESEND_FROM_EMAIL: string;  // e.g. "Starstuck Lab <orders@starstucklab.com>"
  readonly ADMIN_EMAIL: string;        // where order notifications go

  // Cloudflare Turnstile (contact-form spam protection)
  readonly TURNSTILE_SECRET_KEY: string;

  // OpenAI (for Python CLI / AI generation — not used at runtime)
  readonly OPENAI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Cloudflare runtime env (available via Astro.locals.runtime.env in SSR)
type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
