# Content Guide

How to add and manage content on the Starstuck Lab site. This replaces the old TinaCMS workflow.

---

## CMS: Keystatic

The site uses **[Keystatic](https://keystatic.com)** as its CMS. It edits files directly in the repository — no external database, no cloud sync.

**Accessing the admin:**
1. Run `npm run dev`
2. Open `http://localhost:4321/admin`
3. You'll see the Keystatic UI with collections for **Products** and **Lab Notes**

The admin writes directly to `src/content/products/` and `src/content/lab-notes/`. Changes are normal files in the repo — commit them like anything else.

> **Production note:** Keystatic local-storage mode only works in dev. The `/admin` route is not useful on the deployed site. Make edits locally and deploy.

---

## Products

### Adding a product via admin

1. Go to `http://localhost:4321/admin` in dev
2. Click **Products → New entry**
3. Fill in all fields (see schema below)
4. Save → file is written to `src/content/products/{slug}.md`
5. Commit and deploy

### Adding a product by hand (direct file edit)

Create `src/content/products/{slug}.md`:

```markdown
---
title: My Telescope
tagline: A short punchy one-liner (shown on product cards)
price: 12000
currency: INR
status: available
stock_status: in_stock
images:
  - src: /assets/my-telescope/desktop.webp
    alt: My Telescope — front view
  - src: /assets/my-telescope/thumb.webp
    alt: My Telescope — detail
---

Write the full product description here in Markdown.

## What's included

- The telescope
- A carry bag
- Brief existential dread (complimentary)

## Specifications

| Property | Value |
|---|---|
| Aperture | 130mm |
| Focal length | 650mm |
| Weight | 2.3kg |
```

### Product schema reference

| Field | Type | Notes |
|---|---|---|
| `title` | text | Product name. Also used as the URL slug. |
| `tagline` | text | One-liner for cards and meta descriptions |
| `price` | integer | In INR (whole rupees) |
| `currency` | text | Default: `INR` |
| `status` | select | `available` · `unavailable` · `coming_soon` · `discontinued` |
| `stock_status` | select | `in_stock` · `low_stock` · `out_of_stock` · `made_to_order` |
| `images` | array | List of `{ src, alt }` — src is a path under `/public` |
| body | markdown | Full description, specs, what's included |

### Wiring up Stripe for a new product

After creating the product file, you need a Stripe Price ID:

1. Create a product + price in the [Stripe Dashboard](https://dashboard.stripe.com) (or use test mode)
2. Copy the Price ID (`price_xxxxx`)
3. Add to `src/lib/stripe.ts`:
   ```ts
   export const STRIPE_PRICE_IDS: Record<string, string> = {
     m42: import.meta.env.STRIPE_PRICE_M42 ?? 'price_placeholder_m42',
     elli: import.meta.env.STRIPE_PRICE_ELLI ?? 'price_placeholder_elli',
     my-telescope: import.meta.env.STRIPE_PRICE_MY_TELESCOPE ?? 'price_placeholder',
   };
   ```
4. Add the env var to Cloudflare via `wrangler secret put STRIPE_PRICE_MY_TELESCOPE`

---

## Lab Notes

Lab notes are the site's blog/journal section, at `/lab`.

### Adding a lab note via admin

1. `http://localhost:4321/admin` → **Lab Notes → New entry**
2. Fill in fields, write content
3. Save → written to `src/content/lab-notes/{slug}.md`

### Adding a lab note by hand

Create `src/content/lab-notes/{slug}.md`:

```markdown
---
title: Building the M42 in the Dark
publishDate: 2025-11-01
description: A short summary for cards and SEO (1–2 sentences)
tags:
  - telescope
  - hardware
  - m42
---

Write the full article here in Markdown.

## The Problem

...

## What I Found Out

...
```

### Lab note schema reference

| Field | Type | Notes |
|---|---|---|
| `title` | text | Article title |
| `publishDate` | date | ISO 8601: `YYYY-MM-DD` |
| `description` | text | Used on the listing card and in `<meta>` |
| `tags` | list | Optional. Lowercase, hyphenated |
| body | markdown | Full article content |

---

## Navigation

Edit `src/data/navigation.json`:

```json
{
  "main": [
    { "label": "Shop", "href": "/shop" },
    { "label": "Lab", "href": "/lab" },
    { "label": "Contact", "href": "/contact" }
  ]
}
```

Changes take effect on the next build/reload. No CMS needed.

---

## Footer

Edit `src/data/footer.json`. Structure:

```json
{
  "tagline": "Building small machines for an indifferent universe",
  "links": [
    { "label": "Privacy", "href": "/privacy" },
    { "label": "Terms", "href": "/terms" }
  ],
  "socials": []
}
```

---

## Hero Text Variants

The homepage hero randomly picks a variant from `public/data/hero.json` on each page load (client-side fetch). The file format:

```json
{
  "variant-1": {
    "title": "Starstuck Lab",
    "subtitle": "Building small machines for an indifferent universe",
    "cta": "Enter the Workshop"
  },
  "variant-2": {
    "title": "Still Looking Up",
    "subtitle": "Handmade telescopes from a hill that slopes toward nothing in particular",
    "cta": "See the Workshop"
  }
}
```

**To regenerate with AI:** Run the CLI:
```bash
cd tools
python cli.py content regenerate --block hero
```
This calls OpenAI, writes new variants to `public/data/hero.json`, and you commit the result.

---

## About Panel Copy

The homepage about panel (sidebar) pulls from `public/data/about.json`:

```json
{
  "title": "A Workshop on a Quiet Hill",
  "lead": "Paragraph about the workshop...",
  "motto": "One-line motto"
}
```

**To regenerate with AI:**
```bash
cd tools
python cli.py content regenerate --block about
```

---

## Scene Images (Hero / Workshop / Shop)

Scene images live in `public/assets/{scene}/`:
- `hero-desktop.webp`, `hero-tablet.webp`, `hero-mobile.webp`
- `workshop-desktop.webp`, `workshop-tablet.webp`, `workshop-mobile.webp`
- `shop-desktop.webp`, etc.

**To regenerate/process images from a master:**
```bash
cd tools
python cli.py images process --scene hero
python cli.py images generate --scene workshop  # AI generation from prompt.txt
```

---

## Product Images

Product images live in `public/assets/{product-slug}/`:
- `desktop.webp`, `tablet.webp`, `mobile.webp`, `thumb.webp`

Processing is configured in `config.yaml` under `images.shared_variants`.

```bash
cd tools
python cli.py images process --product m42
```
