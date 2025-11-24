# 🌌 Starstuck Lab — The Roadless Map

> “If you can see the plan clearly, you’re standing too close to the singularity.”

---

## Top-level goal

Turn visitors into engaged explorers by guiding them naturally from **hero → inside the shed → workbench (projects + shop) → checkout → console/logs → exit** while keeping the site playful, accessible, and performant. 

---

## 1) High-level information architecture (single page + rooms)

(Keep it narrative-driven — one scrolling scene with “rooms”)

* **Hero (Outside the Shed)** — tone + CTA “Enter the Workshop” (already built). 
* **About / Intro (Inside the Shed)** — identity + philosophy (parchment panels). 
* **Workbench (Projects + Shop)** — unified grid of projects + purchasable items (polaroid UI). 
* **Product Detail** — lamp spotlight modal / page (story first, specs second). 
* **Checkout** — clipboard form, order personality (order guidelines). 
* **Mood / Sarcasm Window** — global tone control, persists in localStorage. 
* **Roadmap & Console** — developer/AI logs, roadmap, experimental features. 
* **Footer (Forest Nightscape)** — contact + small site credits. 

---

## 2) UX flows (3 primary user journeys)

Short, clear flows you can instrument & optimize.

1. **Curious browser → Explore → Project detail → Bookmark/Share**

   * Key hooks: evocative hero + tagline, clear CTA, projects with short emotional blurbs.
2. **Shopper → Discover product → Add to cart → Checkout**

   * Key hooks: story + clear specs + “personality features” checkout. Keep checkout single-step if possible.
3. **Returning fan → Mood toggle → Dynamic content → Subscribe / follow**

   * Key hooks: Sarcasm Slider, “Regenerate Reality” snippets, newsletter sign-up.

---

## 3) Component inventory (reusable UI)

Design consistent components and map them to pages.

* `HeroBlock` (parallax layers, centered logo, CTA) — exists. 
* `ParchmentPanel` (About content) — semi-translucent read panels.
* `WorkbenchGrid` (cards with “Polaroid” frames + lamp hover effect).
* `ProductCard` → `ProductDetailModal` (spotlight).
* `ClipboardForm` (checkout).
* `MoodSlider` (persisted in localStorage + CSS variables).
* `ConsoleTerminal` (logs + roadmap + regenerate button).
* `FooterSign` (wood sign with contact carved).

---

## 4) Visual & interaction guidelines (core design rules)

Keep the world consistent and accessible.

* **Global design tokens**: starry background `#0b0c10`, body near-white `#f4f4f4`, accent `#4ec57a`. (Matches STYLE_GUIDE.) 
* **Spacing**: center blocks vertically within the overlay; avoid overlapping the hero logo with CTA by reserving a composition band using CSS grid or flex. (You already use an overlay; standardize the overlay internal layout.) 
* **Motion**: subtle parallax & star twinkle; respect `prefers-reduced-motion`. 
* **Accessibility**: keyboard-focusable hero CTA, logo link, readable contrast for small text, `aria` labels for sliders and dynamic content. (Make sure CTA is `:focus-visible` friendly.) 

---

## 5) Technical systems & architecture

What to build and why.

* **Static site generator**: Keep Astro (already in use). Serverless build + GitHub Pages or Netlify. 
* **Data-first content**: Projects/products as markdown + frontmatter in `/content/projects` and `/content/products`. The Workbench reads these at build-time. 
* **Dynamic Content Engine**: scheduled regeneration writes to `/generated/` then gets built; use GitHub Actions for safe regeneration. (See `dynamic_content.md`.) 
* **Mood Engine**: store mood slider value in `localStorage`, expose CSS variables for color/animation speed, pass tone variable when requesting content regen. 
* **Payments**: simple checkout → email + manual fulfillment initially; later add Stripe Checkout for full orders. Use clipboard-style confirmation UI for charm. 
* **Performance**: WebP/AVIF images, responsive `picture` markup (you already use `picture`), preload key assets (logo + hero). 
* **Analytics & Error Tracking**: privacy-aware analytics (Plausible or Netlify analytics) + Sentry for console/edge errors.

---

## 6) Content strategy (short-term)

What content to prioritize on launch:

* Clear **About** (use `ABOUT.md`) — the persona paragraph up front. 
* 6–8 **projects** with a short “build story” each (pull from `PROJECTS.md`). 
* 3 **shop items** (low friction: small accessories, prints, or kits). Use the clipboard checkout. 
* 10–20 **dynamic prompts** saved so the regen engine can change the site voice over time. 

---

## 7) Measurement & success criteria

How we’ll know the site is working:

* Bounce rate on hero → internal navigation (target: < 45%)
* Click-through rate from Workbench cards → Product detail (target: > 8%)
* Checkout completion (initially email form conversion) (target: 20% of interested).
* Return visits influenced by dynamic content (compare cohorts week-over-week).

---

## 8) Roadmap — prioritized tasks (sprintable)

Small, testable steps you (or devs) can do in order.

### Sprint 0 — Critical (1–3 days)

* Polish hero composition and logo behavior (done). 
* Implement `ParchmentPanel` and wire `ABOUT.md`. 
* Add preload for hero + logo and verify LCP.

### Sprint 1 — Shop & Workbench (3–5 days)

* Create `WorkbenchGrid` and import 6 projects from `PROJECTS.md`. 
* Product detail modal with spotlight UI (lamp).
* Implement Clipboard checkout (form + local validation) and link to `ORDER_GUIDELINES.md`. 

### Sprint 2 — Mood Engine & Dynamic Content (4–7 days)

* Mood slider UI + CSS variable system. 
* Hook dynamic content regeneration (stubbed via GitHub Action). 

### Sprint 3 — Console + Roadmap + Analytics (4–7 days)

* `ConsoleTerminal` UI with `ROADMAP.md` + simple admin logs. 
* Add privacy-aware analytics, error tracking.

---

## 9) Quick wins you can do now (paste & go)

1. **Preload logo & hero** (add in page `<head>`):

```html
<link rel="preload" href="/assets/icons/starstucklab_logo_black_white.svg" as="image">
<link rel="preload" href="/assets/hero/hero-master.png" as="image">
```

(Improves first paint.) 

2. **Make the hero CTA keyboard friendly**:

```css
.cta:focus-visible { box-shadow: 0 0 0 4px rgba(78,197,122,0.15); border-radius:28px; }
```

(Improves accessibility.) 

3. **Create content stubs**: add 3 product markdown files (`/content/products/*.md`) with frontmatter fields: `title, price, sku, hero_image, description, story`. These will populate the Workbench.

---

## 10) Risks & mitigations

* **Over-animated / heavy site** → keep motion subtle & respect `prefers-reduced-motion`. 
* **AI-generated content inconsistencies** → cache outputs, human-review before merge. 
* **Checkout fraud / complexity** → start with manual fulfillment; add Stripe later.

---

## Wrap-up — recommended immediate next step

Pick one of these three and I’ll produce the exact patch / implementation:

1. **Finish Workbench grid** — I’ll generate the `WorkbenchGrid` component and a template project markdown file.
2. **Mood Engine MVP** — I’ll provide the slider component, CSS variable map, and localStorage persistence code.
3. **Checkout clipboard** — I’ll give the clipboard UI + form and connect it to a simple serverless email/webhook handler.


> “Plans are fluid. Stars explode.
> Both are progress.”
