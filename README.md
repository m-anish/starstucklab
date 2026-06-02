[<img src="https://ko-fi.com/img/githubbutton_sm.svg" height="36">](https://ko-fi.com/P5P7BMO10)
[<img src="https://buymeachai.ezee.li/assets/images/buymeachai-button.png" height="36">](https://buymeachai.ezee.li/anishmg)

# 🌟 Starstuck Lab

*"Building small machines for an indifferent universe"*

Starstuck Lab is a handmade telescope workshop in India. This repository contains the complete site and tooling ecosystem.

→ **Docs:** [`docs/`](docs/) &nbsp;|&nbsp; **Content guide:** [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md) &nbsp;|&nbsp; **Status:** [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Astro 5](https://astro.build) — SSR, `output: 'server'` |
| Hosting | [Cloudflare Workers](https://workers.cloudflare.com) via `@astrojs/cloudflare` |
| CMS | [Keystatic](https://keystatic.com) — local-storage, runs at `/admin` |
| Payments | [Stripe](https://stripe.com) — Checkout Sessions + webhook |
| Email | [Resend](https://resend.com) — contact form |
| Styles | Custom CSS with design tokens (`src/styles/tokens.css`) |
| CLI tools | Python — content generation, image processing, AI generation |

---

## Quick Start

```bash
npm install
npm run dev        # → http://localhost:4321
```

**CMS admin** (local dev only): `http://localhost:4321/admin`

**CLI tools:**
```bash
cd tools
pip install -r requirements.txt

python cli.py               # interactive mode
python cli.py content --help
python cli.py images --help
```

---

## Deployment

Hosted on Cloudflare Workers. Deploy with:

```bash
npm run build
npx wrangler deploy
```

**Required environment secrets** (set via `wrangler secret put <NAME>`):

| Secret | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `STRIPE_PRICE_M42` | Stripe Price ID for M42 telescope |
| `STRIPE_PRICE_ELLI` | Stripe Price ID for Elli telescope |
| `RESEND_API_KEY` | Contact form emails |
| `OPENAI_API_KEY` | AI content/image generation (CLI tools) |

---

## Project Structure

```
starstucklab/
│
├── src/
│   ├── components/        # Reusable Astro components
│   ├── content/           # Content collections (Astro + Keystatic)
│   │   ├── products/      # Product markdown files (*.md)
│   │   └── lab-notes/     # Lab notes / blog posts (*.md)
│   ├── data/              # JSON config: navigation, footer, hero variants, about
│   ├── layouts/           # Page layouts (Base, Hero, Standard, Page)
│   ├── lib/               # Server-side utilities (Stripe, Resend, cart, scenes)
│   ├── pages/             # Astro routes
│   │   ├── index.astro    # Homepage with hero scroll transition
│   │   ├── shop.astro     # Shop listing
│   │   ├── shop/[slug].astro  # Product detail
│   │   ├── lab/           # Lab notes listing + detail
│   │   ├── checkout.astro
│   │   ├── order.astro    # Post-purchase confirmation
│   │   ├── contact.astro
│   │   ├── admin/         # Keystatic CMS admin UI
│   │   └── api/           # Server endpoints (checkout, webhook, contact)
│   └── styles/
│       ├── tokens.css     # Design tokens (colours, spacing, typography)
│       ├── global.css     # Global resets + base styles
│       └── components/    # Per-component CSS files
│
├── public/
│   ├── assets/            # Scene images (hero, workshop, shop, products)
│   ├── data/              # Runtime JSON (hero.json, about.json — served at /data/)
│   ├── models/m42/        # 3D STL files for the M42 model viewer
│   └── scripts/           # Client-side scripts
│
├── tools/                 # Python CLI for content management
│   ├── cli.py             # Entry point
│   ├── commands/          # Subcommands (content, images, products, assets)
│   ├── lib/               # Shared utilities (AI, config, prompts, paths)
│   └── deprecated/        # Old scripts kept for reference
│
├── config.yaml            # CLI tool configuration (AI, products, images)
├── keystatic.config.ts    # CMS schema definition
├── astro.config.mjs       # Astro + Cloudflare adapter config
└── wrangler.jsonc         # Cloudflare Workers deployment config
```

---

## Content Management

See **[`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md)** for the full guide.

**Short version:**
- Add/edit products → `/admin` in dev, or edit `src/content/products/*.md` directly
- Write lab notes → `/admin` in dev, or edit `src/content/lab-notes/*.md` directly
- Navigation → `src/data/navigation.json`
- Hero text variants → `public/data/hero.json` (AI-generated, update with CLI)
- About panel copy → `public/data/about.json` (AI-generated, update with CLI)

---

## Documentation

| File | Purpose |
|---|---|
| [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md) | How to add products, lab notes, update copy |
| [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) | V2 roadmap status and next steps |
| [`docs/AI_CONTEXT.md`](docs/AI_CONTEXT.md) | Machine-readable repo overview for AI assistants |
| [`CHANGELOG.md`](CHANGELOG.md) | Change history |

---

## License

DWYWBDBM-1.0 — Do What You Want But Don't Blame Me.
