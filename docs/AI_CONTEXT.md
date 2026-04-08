# AI Context — Starstuck Lab

This file is an authoritative, machine-readable overview of the repository. It is written to help an AI assistant (Claude, GPT, Gemini, etc.) quickly orient to the codebase without needing to read every file.

---

## What This Project Is

A small-batch handmade telescope workshop based in India. The site is a combined storefront + journal + portfolio. Tone: sardonic, melancholic, cosmic. Think "quality artisan work described with the enthusiasm of someone who knows the universe doesn't care but makes things anyway."

---

## Tech Stack (authoritative)

| Concern | Technology | Config file |
|---|---|---|
| Framework | Astro 5 (`output: 'server'`) | `astro.config.mjs` |
| Runtime | Cloudflare Workers | `wrangler.jsonc` |
| Adapter | `@astrojs/cloudflare` | `astro.config.mjs` |
| CMS | Keystatic (local-storage) | `keystatic.config.ts` |
| Payments | Stripe (Checkout Sessions) | `src/lib/stripe.ts` |
| Email | Resend | `src/lib/resend.ts` |
| Styles | Vanilla CSS, custom design tokens | `src/styles/tokens.css` |
| Content | Astro content collections (Markdown) | `src/content/config.ts` |
| AI / CLI | Python 3, OpenAI API | `tools/`, `config.yaml` |

**No React. No Tailwind. No build-time static export.** All pages are server-rendered on Cloudflare Workers. Client-side interactivity is plain JS in `<script>` tags.

---

## Repository Layout

```
starstucklab/
├── src/
│   ├── components/          ← Astro components (.astro)
│   ├── content/             ← Astro content collections (Markdown)
│   │   ├── config.ts        ← Zod schemas for content collections
│   │   ├── products/        ← One .md file per product
│   │   └── lab-notes/       ← One .md file per blog post
│   ├── data/                ← Static JSON config (NOT runtime-served)
│   │   ├── navigation.json  ← Nav links
│   │   ├── footer.json      ← Footer copy + links
│   │   ├── hero.json        ← AI prompt definitions for hero block
│   │   └── about.json       ← AI prompt definitions for about block
│   ├── layouts/             ← Layout hierarchy
│   │   ├── BaseLayout.astro         ← Root: <html>, global CSS, favicon, GA
│   │   ├── HeroLayout.astro         ← Homepage only: hero scroll + nav reveal
│   │   ├── StandardPageLayout.astro ← Most pages: nav + footer + content area
│   │   ├── PageLayout.astro         ← Variant of StandardPage
│   │   └── Layout.astro             ← Legacy base (used by StandardPage)
│   ├── lib/                 ← Server-side utilities
│   │   ├── api-keys.ts      ← Check env var presence
│   │   ├── cart.ts          ← Cart state (client-side localStorage)
│   │   ├── footer.ts        ← Load footer.json
│   │   ├── navigation.ts    ← Load navigation.json
│   │   ├── pricing.ts       ← Price formatting helpers
│   │   ├── resend.ts        ← Send email via Resend
│   │   ├── scenes.ts        ← Resolve scene image URLs from public/assets/
│   │   └── stripe.ts        ← Stripe client, price IDs, line item builder
│   ├── pages/               ← Astro file-based routing
│   │   ├── index.astro          → / (homepage with hero zoom transition)
│   │   ├── shop.astro           → /shop
│   │   ├── shop/[slug].astro    → /shop/m42, /shop/elli, etc.
│   │   ├── shop/m42-customizer.astro  → /shop/m42 customiser
│   │   ├── lab/index.astro      → /lab
│   │   ├── lab/[slug].astro     → /lab/001-building-in-the-dark
│   │   ├── checkout.astro       → /checkout
│   │   ├── order.astro          → /order (post-purchase)
│   │   ├── contact.astro        → /contact
│   │   ├── privacy.astro        → /privacy
│   │   ├── terms.astro          → /terms
│   │   ├── settings.astro       → /settings (API key status)
│   │   ├── admin/               → /admin (Keystatic CMS UI)
│   │   └── api/
│   │       ├── create-checkout-session.ts  ← POST: create Stripe session
│   │       ├── webhook.ts                  ← POST: Stripe webhook
│   │       └── contact.ts                  ← POST: contact form → Resend
│   └── styles/
│       ├── tokens.css           ← CSS custom properties (colours, spacing, fonts)
│       ├── global.css           ← Resets, body, base typography
│       └── components/          ← Per-component stylesheets
│           ├── index.css        ← Homepage hero scroll + fade animation
│           ├── navbar.css
│           ├── footer.css
│           ├── parchment.css    ← Parchment card aesthetic
│           ├── aboutpanel.css
│           └── contact.css
│
├── public/
│   ├── assets/              ← Scene + product images (webp, multiple sizes)
│   │   ├── hero/            ← hero-desktop.webp, hero-tablet.webp, hero-mobile.webp
│   │   ├── workshop/        ← workshop-desktop.webp, etc.
│   │   ├── shop/            ← shop background
│   │   └── {product-slug}/ ← desktop.webp, tablet.webp, mobile.webp, thumb.webp
│   ├── data/                ← Runtime-served JSON (fetched by client JS)
│   │   ├── hero.json        ← Hero text variants (randomly picked on load)
│   │   └── about.json       ← About panel copy
│   ├── models/m42/          ← STL files for 3D telescope model viewer
│   └── scripts/             ← Client-side JS (if any)
│
├── tools/                   ← Python CLI for content + image management
│   ├── cli.py               ← Entry point (`python cli.py`)
│   ├── commands/            ← Subcommands: content, images, products, assets, site
│   ├── lib/                 ← Shared: ai.py, config.py, prompts.py, paths.py, output.py
│   ├── templates/           ← Astro page templates for scaffolding
│   └── deprecated/          ← Old scripts (kept for reference, not used)
│
├── config.yaml              ← CLI config: AI settings, image variants, content prompts
├── keystatic.config.ts      ← CMS collections: products, lab-notes (with Zod-like schema)
├── astro.config.mjs         ← Astro config: output, adapter, integrations, keystatic
└── wrangler.jsonc           ← Cloudflare Workers config: name, routes, env
```

---

## Key Abstractions

### Content Collections (Astro)

Defined in `src/content/config.ts`. Two collections:

**`products`** — source: `src/content/products/*.md`
- Fields: `title`, `tagline`, `price` (INR int), `currency`, `status`, `stock_status`, `images[]`
- Body: Markdown product description
- Consumed by: `shop.astro`, `shop/[slug].astro`, `FeaturedSections.astro`

**`labNotes`** — source: `src/content/lab-notes/*.md`
- Fields: `title`, `publishDate`, `description`, `tags[]`
- Body: Markdown article
- Consumed by: `lab/index.astro`, `lab/[slug].astro`

### Keystatic CMS

`keystatic.config.ts` mirrors the Astro content collection schemas. When you edit in the `/admin` UI, it writes Markdown to `src/content/products/` or `src/content/lab-notes/`. Storage is `local` — files live in the repo. There is no cloud dependency.

### Scene Image System

`src/lib/scenes.ts` resolves image URLs for the two hero scenes (`hero`, `workshop`) and any product images. It reads from `public/assets/{scene}/{variant}.webp`. The homepage `index.astro` uses `getSceneSources("hero", base)` and `getSceneSources("workshop", base)` to build responsive `<picture>` elements.

### Hero Scroll Transition

`src/styles/components/index.css` + inline `<script>` in `src/pages/index.astro`.

- An invisible `.herozoom-spacer` creates the scroll space: `200vh` on desktop, `250dvh` on mobile.
- Two `position: fixed` images (`.layer-forest` and `.layer-interior`) crossfade as the user scrolls through the spacer.
- `computeProgress()` → 0.0–1.0 based on scroll position within the spacer.
- At progress > 0.9: `.post-zoom` content (shop + about panel) fades in.
- At progress > 0.75: the sticky nav reveals.
- Scroll animation uses `requestAnimationFrame` with a `ticking` flag.
- `data-cross-start="0.40"` and `data-cross-end="0.85"` on the spacer control when the crossfade happens.

### Cart System

`src/lib/cart.ts` — pure client-side, `localStorage`-backed. Cart items have `productSlug`, `title`, `price`, `quantity`, optional `customization`.

- `CartDrawer.astro` — slide-out drawer, reactive to cart events
- `AddToCartButton.astro` — dispatches a custom `addToCart` DOM event
- `CartBadge.astro` — shows item count in the nav

### Stripe Payment Flow

1. User builds cart, clicks "Checkout"
2. `checkout.astro` → POSTs cart to `/api/create-checkout-session`
3. `create-checkout-session.ts` looks up `STRIPE_PRICE_IDS[productSlug]`, creates a Stripe Session, returns `{ url }`
4. Client redirects to Stripe-hosted checkout
5. After payment, Stripe redirects to `/order?session_id=xxx`
6. Stripe POSTs to `/api/webhook` → `webhook.ts` verifies signature + handles `checkout.session.completed`

**Price IDs** are in `src/lib/stripe.ts` → `STRIPE_PRICE_IDS`. Env vars: `STRIPE_PRICE_M42`, `STRIPE_PRICE_ELLI`.

---

## Design System

**Tokens** (`src/styles/tokens.css`):
- `--color-bg`, `--color-bg-alt`, `--color-text`, `--color-text-muted`
- `--color-accent`, `--color-accent-muted`
- `--color-parchment`, `--color-parchment-dark` (for cards)
- `--font-serif` (Playfair Display), `--font-sans` (Inter / system-ui)
- `--radius`, `--shadow`, various spacing tokens

**Aesthetic**: dark starry-night background (`#05060a`), warm parchment/cream cards, green accent (`rgba(78,197,122,...)`), serif headings.

**No utility framework.** All styles are in component-specific CSS files imported into the relevant layout/component.

---

## Environment Variables

All secrets are Cloudflare Workers environment variables in production. For local dev, put them in `.env` (gitignored).

| Variable | Used in | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | `src/lib/stripe.ts` | Live or test key |
| `STRIPE_WEBHOOK_SECRET` | `src/pages/api/webhook.ts` | From Stripe dashboard |
| `STRIPE_PRICE_M42` | `src/lib/stripe.ts` | Stripe Price ID |
| `STRIPE_PRICE_ELLI` | `src/lib/stripe.ts` | Stripe Price ID |
| `RESEND_API_KEY` | `src/lib/resend.ts` | For contact form |
| `OPENAI_API_KEY` | `tools/lib/ai.py` | CLI tools only |

---

## Content Editing Conventions

- **Products**: edit via Keystatic `/admin` or directly in `src/content/products/{slug}.md`
- **Lab notes**: edit via Keystatic `/admin` or directly in `src/content/lab-notes/{slug}.md`
- **Navigation**: edit `src/data/navigation.json`
- **Footer**: edit `src/data/footer.json`
- **Hero text**: edit `public/data/hero.json` (or run `python tools/cli.py content regenerate --block hero`)
- **About panel**: edit `public/data/about.json` (or run CLI)

`public/data/hero.json` and `public/data/about.json` are **runtime-served files** (fetched by client JS). They are NOT the same as `src/data/hero.json` and `src/data/about.json` (those are AI prompt definitions for the CLI).

---

## CLI Tools (Python)

Entry: `python tools/cli.py`

| Command | Purpose |
|---|---|
| `content regenerate` | Regenerate AI text (hero, about) |
| `images process` | Crop/resize master images to all variants |
| `images generate` | AI image generation from prompt.txt |
| `products` | Scaffold new product files |
| `assets` | Asset management helpers |

Config in `config.yaml`. AI provider is OpenAI (configurable).

---

## Known Quirks

- `public/data/about.json` and `public/data/hero.json` contain the **generated copy** (what the site shows). `src/data/about.json` and `src/data/hero.json` contain the **AI prompts** used by the CLI to regenerate that copy. Don't confuse them.
- `src/layouts/Layout.astro` is a base layout used internally by `StandardPageLayout.astro`. It's not deprecated.
- TypeScript strict-null errors appear in `src/pages/index.astro` for the hero script variables — these are pre-existing false positives. The runtime null guard (`if (!spacerEl || ...) return`) handles them correctly.
- Keystatic's `storage: { kind: 'local' }` means `/admin` only works in local dev. It cannot edit content on the live site.
