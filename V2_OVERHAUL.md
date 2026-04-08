# Starstuck Lab V2 — Overhaul Tracking Document

> Branch: `v2-overhaul`  
> Started: 2026-08-04  
> Status: 🚧 In Progress

---

## North Star

Shift from "maker's personal site with a shop tacked on" → **real artisan shop with personality**.  
Two products only: **M42 Dobsonian** and **Elli** (new, updated variant). Everything else is cut.  
Brand voice (sardonic, cosmic, self-deprecating) stays — it's the best thing about V1.

---

## Stack (V2 Target)

| Layer | V1 | V2 |
|---|---|---|
| Framework | Astro 5 (SSR) | Astro 5 (SSR) ✅ keep |
| Hosting | Cloudflare Pages | Cloudflare Pages ✅ keep |
| CMS | TinaCMS + Tina Cloud | **Keystatic** (local, no cloud) |
| Payments | EmailJS (lol) | **Stripe** |
| Email (transactional) | EmailJS | **Resend** |
| Workers | — | **Cloudflare Workers** (Stripe webhooks) |
| 3D | Three.js (underused) | Three.js (expanded — interactive viewer) |
| AI tooling | TinaCMS fields + Python CLI + API routes | **Python CLI only** |
| Content | Astro collections + TinaCMS md | Astro collections + Keystatic md |
| CSS | Complex token system | Simplified, maintainable tokens |

**REMOVED:**
- TinaCMS + Tina Cloud dependency
- Projects section entirely
- Python CLI content management commands (keep AI generation only)
- EmailJS
- Backward compatibility — do not care

---

## Products (V2 Canonical)

| Slug | Name | Status | Notes |
|---|---|---|---|
| `m42` | M42 Dobsonian | Active | 3D-printed, customizable tube + mount |
| `elli` | Elli | Active (new) | Updated variant, slightly more expensive |

All other products (Lokki, etc.) — **deleted**.

---

## Phase 0 — Strategic Cuts ✅

- [x] Create `v2-overhaul` branch
- [x] Create this tracking document
- [ ] Delete `src/content/projects/` directory
- [ ] Delete `src/pages/projects.astro` and `src/pages/projects/` directory
- [ ] Delete `src/components/ProjectCard.astro`
- [ ] Remove Projects from navigation
- [ ] Delete all non-M42/Elli products from `src/content/products/`
- [ ] Create `elli.md` product content
- [ ] Remove TinaCMS dependency from `package.json`
- [ ] Delete `tina/` directory
- [ ] Clean Python CLI: remove project commands (`tools/commands/projects.py`), remove product CRUD (keep AI generation)
- [ ] Remove old `public/data/projects/` assets

---

## Phase 1 — Keystatic CMS ✅

- [ ] Install Keystatic (`@keystatic/core`, `@keystatic/astro`)
- [ ] Create `keystatic.config.ts` with products and lab-notes collections
- [ ] Create Lab Notes content type (replaces Projects — simple blog)
- [ ] Wire Keystatic API route (`src/pages/api/keystatic/[...params].ts`)
- [ ] Update `astro.config.mjs` to include Keystatic integration
- [ ] Test admin UI at `/keystatic`
- [ ] Migrate M42 product content to Keystatic-compatible schema
- [ ] Create Elli product content

---

## Phase 2 — Real E-Commerce (Boilerplate) ✅

- [ ] Install Stripe SDK
- [ ] Create Stripe product + price entries (M42, Elli variants)
- [ ] Checkout flow: cart → Stripe Checkout Session (API route)
- [ ] Cloudflare Worker for Stripe webhook handler
- [ ] Install Resend SDK
- [ ] Order confirmation email template (Resend)
- [ ] Admin notification email (Resend)
- [ ] Replace EmailJS in contact form with Resend
- [ ] Remove EmailJS dependency entirely
- [ ] Update checkout.astro / order.astro to new flow
- [ ] GST handling (18% on electronics, displayed at checkout)

---

## Phase 3 — Shop Features ✅

- [ ] Interactive 3D model viewer (Three.js) on product pages — rotate/zoom, color updates with customization
- [ ] Per-variant inventory tracking
- [ ] Tag/category filtering on shop page
- [ ] "Notify me" waitlist for out-of-stock (Cloudflare KV + Resend)
- [ ] Featured products on homepage (finish FeaturedSections)
- [ ] Related products on product detail pages
- [ ] Build-to-order vs in-stock UI distinction
- [ ] Lead time display ("ships in ~2 weeks")
- [ ] FAQ section per product
- [ ] Lab Notes / Build Log page (simple chronological blog)

---

## CSS / Design Standards (V2)

New, simplified approach — no backward compat:
- Single `src/styles/tokens.css` for design tokens (colors, spacing, type)
- Component styles co-located in `.astro` files via `<style>` blocks where possible
- Global styles only for resets, typography base, and token definitions
- No CSS framework — custom only, keep it lean
- Naming: BEM-lite (block__element--modifier), no utility-class overload

---

## Notes / Decisions Log

- **2026-08-04:** Branch created. Keystatic chosen over TinaCMS. Stripe + Resend + Cloudflare Workers chosen for e-commerce. Projects section removed entirely. "Lab Notes" replaces Projects concept. Only M42 and Elli remain as products.
- No backward compatibility requirement — cut aggressively.
