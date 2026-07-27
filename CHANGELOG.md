# Changelog

All notable changes to Starstuck Lab are documented here.

---

## [Unreleased — v2-overhaul branch]

### 2026-07-27 — New Machine Playbook

**Added**
- `docs/NEW_MACHINE_PLAYBOOK.md` — a reusable bootstrap prompt for spinning up a new machine in the family. Carries the process (naming → explore → scaffold repo → hub card → GitHub) and the conventions (voice, kit adoption, card contract, README archetype) so a new project only needs a short description to get started. Modeled on `forsyth-fable5-brief.md`, generalized.
- README docs table links the playbook.

---

### 2026-04-09 — Hero scroll fix, dvh units, doc pruning

**Fixed**
- Hero scroll "dead zone" on desktop: spacer reduced from `300vh` → `200vh`. Previously, pressing Space/Down twice completed the hero fade-animation but landed in 100vh of blank space before the workshop content entered the viewport. Now animation completes at `scrollY = 100vh` (one keypress) and post-zoom content enters the viewport at exactly that point.
- Mobile spacer set to `250vh` via media query for comfortable touch swipe room.
- All `100vh` viewport references (`hero-layer`, `hero-overlay`, spacer, mobile CTA/padding) now use `dvh` (dynamic viewport height) with `vh` fallback — correctly accounts for iOS/Android browser chrome appearing/disappearing. Replaces the old JS `--stage-vh` workaround.

**Removed**
- `--stage-vh` JS script (superseded by `dvh` CSS).
- Orphaned `data-zoom-scale` attribute on the herozoom spacer (zoom was removed in a prior refactor).
- Unused `MEDIA.ultra_wide` constant from `index.astro`.
- 49 stale files: `archive-docs/`, `generated/`, `data/` (pre-V2 content fragments), `content/` (hello-world sample), `ADMIN_INTERFACE_PLAN.md`, `ARCHITECTURE.md`, `HEROZOOM_CHANGES.md`, `OPENAI_FIX_DOCUMENTATION.md`, `V2_OVERHAUL.md`, `master.webp`, `public/placeholder.html`.

---

### 2026-04 — Phase 4: V1 visual restoration (`2011ffe`)

**Added**
- Playfair Display typography for hero and product headings.
- Parchment-style product cards with CSS design tokens.
- Scene backgrounds for shop and lab pages.
- YouTube embed component.
- Hero scroll transition fully stabilised (fade-only, no parallax/zoom).

---

### 2025-12 — V2 Overhaul (`2d85b83`)

**Added / Changed**
- Complete architectural overhaul from V1 (static site) to V2 (SSR + e-commerce).
- **Keystatic CMS** replaces TinaCMS. Admin UI at `/admin`, local-storage mode, edits committed directly to repo.
- **Stripe** payments integration: Checkout Sessions, webhook handler, cart system (drawer, badge, add-to-cart).
- **Resend** email integration for the contact form.
- **Cloudflare Workers** deployment via `@astrojs/cloudflare` adapter.
- Astro content collections for `products` and `lab-notes` (Markdown with frontmatter).
- M42 3D model viewer (Three.js / STL files in `public/models/m42/`).
- M42 telescope customisation panel.
- Settings page for API key status (`/settings`).
- Python CLI tools for content and image management (`tools/`).
- Design token system (`src/styles/tokens.css`) — single source of truth for colours, spacing, typography.

---

### Pre-V2 (archived)

Earlier work is preserved in git history. The `archive-docs/` directory (now removed) contained planning documents from the pre-V2 era.
