# Starstuck Lab Kit

The shared, themeable layer for the **spoke** sites (jigawatt, lokki, future
sirious). It kills the duplicated skeleton without flattening each product's
bespoke identity: the kit owns the *constant* brand pieces; each spoke keeps its
*variable* layer (hero, motion gimmick, band typography) and just overrides ~12
CSS variables.

> This is **Phase 1** of the constellation work. The hub (starstucklab.com) has
> its own richer design system in `src/styles/tokens.css` — the kit is a
> separate, smaller layer aimed only at the zero-build static spokes.

## What's here

| File | Purpose |
|---|---|
| `tokens.css` | The **theme contract** — the ~12 `--sl-*` variables, with neutral defaults. |
| `base.css` | Shared primitives + partials styling. Consumes only `--sl-*` tokens. |
| `partials/family.html` | Canonical "Part of starstucklab" band (identical prose everywhere). |
| `partials/footer.html` | Canonical footer (build + family columns + signoff). |
| `sync-kit.sh` | Vendors `tokens.css` + `base.css` into each spoke repo. |

Phase 1 scope is deliberately small — the genuinely shared, low-risk pieces:
`.sl-wrap`, `.sl-kicker`, `.sl-link`, `.sl-family`, `.sl-footer`. Hero, topbar,
band quote, and the signature motion effects stay per-spoke on purpose.

## How a spoke adopts it

1. **Vendor the CSS:** run `bash kit/sync-kit.sh` from the hub repo. It copies
   `tokens.css` + `base.css` into the spoke (e.g. `jigawatt/docs/assets/kit/`).
2. **Link in this order** (the spoke's own stylesheet loads *last* so its token
   overrides and any bespoke rules win):
   ```html
   <link rel="stylesheet" href="assets/kit/tokens.css">
   <link rel="stylesheet" href="assets/kit/base.css">
   <link rel="stylesheet" href="styles.css">  <!-- spoke: overrides + bespoke -->
   ```
   (CSS custom properties resolve at use-time, so token values aren't load-order
   sensitive; this order just keeps rule specificity predictable.)
3. **Override the tokens** in the spoke's `:root` (in its own stylesheet):
   ```css
   :root {
     --sl-accent: #ffb000;                         /* jigawatt amber  */
     --sl-font-body: 'Inter', system-ui, sans-serif;
     /* …only the vars that differ from the defaults… */
   }
   ```
4. **Swap markup** for the family band + footer to the `partials/` versions
   (replace `REPO_URL` with the spoke's GitHub), then delete the now-dead
   bespoke `.footer` / family CSS.

### The token contract

| Token | jigawatt | lokki |
|---|---|---|
| `--sl-bg` | `#0b0b0d` | `#0d0e10` |
| `--sl-surface` | `#131316` | `#15171a` |
| `--sl-border` | `#1c1c1f` | `#181918` |
| `--sl-text` | `#e8e6e1` | `#ece9e0` |
| `--sl-text-dim` | `#8a8780` | `#8e8d88` |
| `--sl-text-mute` | `#5a5854` | `#5f5e5a` |
| `--sl-accent` | `#ffb000` | `#c66a44` |
| `--sl-accent-2` | `#6ec1e4` | `#3da8a8` |
| `--sl-font-display` | Inter (sans) | `'Fraunces', Georgia, serif` |
| `--sl-font-body` | `'Inter', …` | `'Manrope', …` |
| `--sl-font-mono` | `'JetBrains Mono', …` | `'Space Mono', …` |
| `--sl-maxw` | `1180px` | `1080px` |

## clear-skies (special case)

clear-skies is an **offline PWA app**, not a marketing monograph — no hero, no
family band, no footer, and no web fonts (system-sans, for offline). It takes
**`tokens.css` only**, and even then needs care:

- It already defines `--gold`, `--bg`, `--text`, `--sans` etc. — align those to
  the `--sl-*` names gradually rather than wholesale-replacing.
- Because of the service worker, any kit CSS it uses **must be added to the SW
  precache list**, or it won't be available offline.

Treat clear-skies as token-alignment-only, deferred until jigawatt + lokki are
done.

## Where this lives

Canonical source is `kit/` in the starstucklab (hub) repo for now. It can
graduate to its own `starstucklab-kit` repo later without changing the contract.
