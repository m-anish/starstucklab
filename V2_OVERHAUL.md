# Starstuck Lab V2 — Overhaul Tracking Document

> Branch: `v2-overhaul`  
> Started: 2026-08-04  
> First commit: 2026-08-04  
> Status: 🟡 Foundation complete — ready for wiring and polish

---

## North Star

Shift from "maker's personal site with a shop tacked on" → **real artisan shop with personality**.  
Two products only: **M42 Dobsonian** and **Elli** (new, updated variant).  
Brand voice (sardonic, cosmic, self-deprecating) stays — it's the best thing about V1.

---

## Stack (V2)

| Layer | V1 | V2 |
|---|---|---|
| Framework | Astro 5 (SSR) | Astro 5 (SSR) ✅ |
| Hosting | Cloudflare Pages | Cloudflare Pages ✅ |
| CMS | TinaCMS + Tina Cloud | **Keystatic** (local, no cloud) ✅ |
| Payments | EmailJS | **Stripe** ✅ (boilerplate) |
| Email (transactional) | EmailJS | **Resend** ✅ (boilerplate) |
| 3D | Three.js (underused) | Three.js (expand in Phase 3+) |
| AI tooling | TinaCMS fields + Python CLI | **Python CLI only** ✅ |
| CSS | Complex token system | Simplified tokens + co-located styles ✅ |

**REMOVED:**
- ~~TinaCMS + Tina Cloud~~ ✅
- ~~Projects section~~ ✅
- ~~EmailJS~~ ✅
- ~~Python CLI content CRUD~~ (moved to deprecated)

---

## Products (V2 Canonical)

| Slug | Name | Status | Notes |
|---|---|---|---|
| `m42` | M42 Dobsonian | Active | 3D-printed, customizable tube + mount |
| `elli` | Elli | Active | Updated variant, 130mm, dual-speed Crayford |

---

## Phase 0 — Strategic Cuts ✅ COMPLETE

- [x] Create `v2-overhaul` branch
- [x] Create this tracking document
- [x] Delete `src/content/projects/`, `src/pages/projects/`, `src/pages/projects.astro`
- [x] Delete `src/components/ProjectCard.astro`
- [x] Delete `src/components/EditableTemplateManager.tsx`
- [x] Remove Projects from navigation → Shop, Lab Notes, About, Contact
- [x] Delete lokki.md, weather-station.md from products
- [x] Remove TinaCMS packages from `package.json`
- [x] Delete `tina/` directory
- [x] Move `tools/commands/projects.py` to deprecated

---

## Phase 1 — Keystatic CMS ✅ COMPLETE

- [x] Install `@keystatic/astro`, `@keystatic/core`
- [x] Create `keystatic.config.ts` (products + lab-notes collections)
- [x] Add `keystatic()` to `astro.config.mjs`
- [x] Clean `src/content/config.ts` — remove projects, add lab-notes, new stock statuses
- [x] Create `src/content/lab-notes/` collection + sample note
- [x] Create `src/content/products/elli.md`
- [x] Admin UI available at `/keystatic` in dev mode

---

## Phase 2 — Real E-Commerce (Boilerplate) ✅ COMPLETE

- [x] Install `stripe`, `resend`
- [x] `src/lib/stripe.ts` — Stripe client + `buildLineItems()` helper
- [x] `src/lib/resend.ts` — Resend client + order confirmation + admin notification email templates
- [x] `src/pages/api/create-checkout-session.ts` — POST → Stripe Checkout Session URL
- [x] `src/pages/api/webhook.ts` — Stripe webhook: on payment → send emails via Resend
- [x] `src/pages/api/contact.ts` — Contact form → Resend (replaces EmailJS)
- [x] `src/pages/checkout.astro` — Cart summary + "Pay with Stripe" → redirect flow
- [x] `src/pages/order.astro` — Post-payment confirmation + cart clear
- [x] `src/env.d.ts` — Stripe/Resend env var types

**To do before going live:**
- [ ] Create Stripe account + products/prices, add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_M42`, `STRIPE_PRICE_ELLI` to env
- [ ] Create Resend account + verify domain, add `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_EMAIL` to env
- [ ] Set up Stripe webhook endpoint pointing to `https://starstucklab.com/api/webhook`
- [ ] Enable GST via Stripe Tax (or handle manually)

---

## Phase 3 — Shop & Content ✅ COMPLETE (boilerplate)

- [x] `src/pages/shop.astro` — Clean product grid, badges (build-to-order, out-of-stock), lead time
- [x] `src/pages/shop/[slug].astro` — Full product detail: image, badges, price, customization swatches, add-to-cart, features grid, specs table, markdown body
- [x] `src/pages/lab/index.astro` — Lab Notes listing (date, title, excerpt, tags)
- [x] `src/pages/lab/[slug].astro` — Lab Note detail with prose styling
- [x] `src/pages/index.astro` — Shop-focused hero, featured products, brand statement, lab notes preview
- [x] `src/pages/contact.astro` — Form via `/api/contact` (Resend)
- [x] `src/layouts/PageLayout.astro` — Standard page layout (Navbar + Footer)

**Still to build (Phase 3 extensions):**
- [ ] Interactive 3D model viewer on product detail (Three.js, rotate/zoom, color preview)
- [ ] "Notify me" waitlist for out-of-stock items (Cloudflare KV + Resend)
- [ ] CartDrawer wired to new cart events (`cart:updated`)
- [ ] Navbar sticky + CartBadge wired to localStorage
- [ ] Per-variant inventory tracking in product frontmatter
- [ ] Product image gallery (carousel) on detail page
- [ ] `src/pages/about.astro` — Review + update for V2 (currently using old data patterns)
- [ ] Tag/category filtering on shop page

---

## CSS / Design System (V2) ✅ COMPLETE

- [x] `src/styles/tokens.css` — All custom properties: colors, type scale, spacing scale, radii, shadows, z-index, transitions
- [x] `src/styles/global.css` — Reset, base typography, prose class, utility helpers (`.container`, `.sr-only`)
- [x] Component styles co-located in `.astro` files
- [x] Dark theme: `#0c0c0e` bg, `#ededee` text, `#c9b97a` accent (starlight gold)

---

## Environment Variables Needed

```bash
# .dev.vars (local Cloudflare dev) or Cloudflare Pages dashboard

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_M42=price_...
STRIPE_PRICE_ELLI=price_...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Starstuck Lab <orders@starstucklab.com>
ADMIN_EMAIL=hello@starstucklab.com
```

---

## Notes / Decisions Log

- **2026-08-04:** Branch created. Keystatic chosen over TinaCMS. Stripe + Resend + Cloudflare Workers chosen for e-commerce. Projects section removed entirely. "Lab Notes" replaces Projects. Only M42 and Elli as products.
- **2026-08-04:** Build passes clean (no errors). Committed to `v2-overhaul`.
- No backward compatibility — cut aggressively throughout.
- Keystatic admin UI: run `npm run dev` → navigate to `/keystatic`
- Stripe webhook: register `POST /api/webhook` in Stripe dashboard
