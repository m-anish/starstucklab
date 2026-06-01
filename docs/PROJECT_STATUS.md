# Project Status — V2

Last updated: 2026-04-09

---

## ✅ Done (solidly built, committed)

| Area | Notes |
|---|---|
| Homepage hero scroll transition | Fade in/out between forest and workshop. Dead-zone fixed 2026-04-09. |
| Design system | CSS tokens (`tokens.css`), parchment aesthetic, Playfair Display typography |
| Layout stack | `BaseLayout` → `StandardPageLayout` → `HeroLayout` / `PageLayout` |
| Keystatic CMS | `/admin` UI, local-storage mode, products + lab-notes collections |
| Product content schema | Astro content collection, `src/content/products/*.md` |
| Lab notes content schema | Astro content collection, `src/content/lab-notes/*.md` |
| Shop page + product detail | `/shop`, `/shop/[slug]` |
| Cart system | Drawer, badge, add-to-cart component, `src/lib/cart.ts` |
| Stripe integration | Checkout Sessions, webhook handler (`/api/webhook`), price ID mapping |
| Contact form | Resend email integration, `/api/contact` endpoint |
| Order confirmation | `/order` page |
| Privacy + Terms pages | `/privacy`, `/terms` |
| M42 3D model viewer | Three.js viewer, STL files in `public/models/m42/` |
| M42 customisation panel | `src/components/customization/` |
| Python CLI tools | Content generation, image processing, AI generation |
| Cloudflare Workers config | `wrangler.jsonc`, `@astrojs/cloudflare` adapter |
| Settings page | `/settings` — API key status dashboard |
| Documentation | README, CHANGELOG, CONTENT_GUIDE, PROJECT_STATUS, AI_CONTEXT |

---

## 🔶 Built but needs real data / config

| Area | What's needed |
|---|---|
| **Stripe Price IDs** | `stripe.ts` uses `price_placeholder_*` fallbacks. Need real `STRIPE_PRICE_M42` and `STRIPE_PRICE_ELLI` env vars set via `wrangler secret put`. |
| **Product catalog** | `elli.md` confirmed complete. Verify `m42.md` exists and is complete (pricing, images, description). |
| **Hero / workshop images** | `public/assets/` directory exists. Confirm `hero-desktop.webp`, `workshop-desktop.webp` etc. are generated. Run CLI if not. |
| **`public/data/about.json`** | File exists with AI prompts; confirm it has been generated with real copy. Run `python cli.py content regenerate --block about` if needed. |
| **`public/data/hero.json`** | File exists; confirm populated with real variants. Run `python cli.py content regenerate --block hero` if needed. |
| **Cloudflare secrets** | Stripe, Resend, OpenAI keys need to be set as Wrangler secrets for production deployment. |

---

## 🔲 Gaps / decisions pending

| Area | Notes |
|---|---|
| **`/about` page** | `src/pages/about.astro` was deleted. The about panel exists inline on the homepage sidebar. Decision needed: is the inline panel sufficient, or add a standalone `/about` route? |
| **Google Analytics** | `GoogleAnalytics.astro` component exists. Needs a GA measurement ID configured. |
| **End-to-end payment test** | Stripe flow is built but hasn't been run through with real test-mode keys from checkout to webhook confirmation. |
| **`tools/deprecated/`** | Old scripts still in repo. Low priority cleanup. |

---

## 🚀 Suggested next steps (prioritised)

### Unblock shipping

1. **Verify / complete `m42.md`** — title, price, images, description, Stripe price
2. **Set up Stripe test keys** — get real Price IDs for both products, run through full checkout flow
3. **Confirm images are generated** — check `public/assets/hero/`, `public/assets/workshop/`; run CLI if any are missing

### Polish before launch

4. **Populate `hero.json` + `about.json`** with final copy (run CLI AI generation or edit directly)
5. **Wire Google Analytics** if you have a GA4 measurement ID
6. **Test M42 customiser** end-to-end at `/shop/m42`

### Pre-launch

7. **Set Cloudflare secrets** via `wrangler secret put` for all required keys
8. **Deploy to Cloudflare + smoke test** — contact form, checkout flow, Keystatic admin, 3D viewer
9. **Decide on `/about` route** — add one if needed

### Post-launch

10. Write more lab notes (currently 1 post)
11. Add more AI hero variants
12. Consider enabling `storage: { kind: 'github' }` in Keystatic config for browser-based editing
