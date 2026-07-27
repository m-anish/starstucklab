# New Machine Playbook — bootstrap prompt for AI assistants

> **How to use this doc (for Anish):** start a Claude Code (or similar) session in
> `~/Documents/GitHub` (the parent of all the lab repos) and open with something like:
>
> *"Read `starstucklab/docs/NEW_MACHINE_PLAYBOOK.md` fully and follow it. The new
> project is: [two to five sentences about what the machine is and does]."*
>
> That's it. This file carries the process, the conventions, and the taste. Your short
> description carries the substance. Anything project-specific beyond that (sensor
> choices, already-made decisions, scope boundaries) can come as a separate brief later,
> once the repo exists — see `../forsyth/forsyth-fable5-brief.md` for what a full
> per-project engineering brief looks like.

> **How to use this doc (for the AI):** you are bootstrapping a new project into the
> Starstuck Lab family. Work through the phases **in order**. There is exactly one hard
> stop — the naming decision in Phase 1 — everything else runs without asking
> permission. When you finish Phase 5, switch your working directory to the new repo and
> await the project-specific brief.

---

## 0. Context — the lab, the family, the voice

**Starstuck Lab** ([starstucklab.com](https://starstucklab.com)) is a one-person
hardware workshop in the lower Himalayas — *"building small machines for an indifferent
universe."* It is a hub-and-spoke constellation:

- **The hub** — `starstucklab/` — an Astro 5 site on Cloudflare Workers. Storefront +
  journal + a `/machines` grid where every project in the family gets a card.
- **The spokes** — sibling repos on disk (`../jigawatt`, `../lokki`, `../forsyth`,
  `../sirious`, `../clear-skies`, …), each with its own GitHub repo and, usually, its
  own zero-build static site in a `/site` folder, deployed at
  `<name>.starstucklab.com` via Cloudflare Pages.

The house sensibility is loosely *Back to the Future meets Hitchhiker's Guide to the
Galaxy*: dry humor, machines with slightly too much personality for their station in
life, copy that treats hardware as a character rather than a spec sheet. The canonical
voice lives in **`starstucklab/kit/VOICE.md`** (human reference) and
**`starstucklab/src/data/persona_preamble.txt`** (machine-loaded). Read both. Never
paraphrase the voice into new prompts or copy — quote and reuse the canonical source.
The negatives matter most: no cheerleading, no marketing superlatives, no drama.

Each machine occupies its own **personality register** within that voice:

| Machine | Register |
|---|---|
| Sirious | Pompous, faintly Victorian disappointment in your aim |
| jigawatt | Jumpy, resigned; a nervous switch that does its one job |
| forsyth | Quiet, unhurried; the relative who always knew it would rain |
| lokki | Calm, hushed; light that knows when not to be noticed |
| M42 / Elli | Sardonic cosmic melancholy (the original telescopes) |

A new machine must claim a **new register** — a distinct temperament, not a clone of an
existing sibling's.

---

## 1. Phase 1 — Naming (HARD STOP: user picks before anything is created)

Given the user's project description, propose **3–6 candidate names**. The naming
tradition, by example:

- **Sirious** — Sirius (the star) + "serious"; reads as a name, not a pun you explain.
- **lokki** — Loki (the god) + *aloka* (Sanskrit/Pali, "light"); lowercase, soft.
- **jigawatt** — Doc Brown's mispronounced "gigawatt", borrowed on purpose.
- **forsyth** — sounds like "foresight", reads like a dependable old family name.
- **M42** — the Orion Nebula's Messier number; a catalog entry as a name.
- **Clear Skies** — the astronomer's sign-off, taken literally.

Rules of the tradition:

1. **It reads as a name first.** The derivation is a private joke you *can* explain,
   never one you *have* to. Spoken aloud, it shouldn't need a footnote.
2. **Draw from anywhere** — stars, mythology (any tradition), scientific history, unit
   mispronunciations, catalog numbers, Sanskrit/Hindi words, literary references. The
   wider the field, the better; two overlapping derivations (like lokki's) are gold.
3. **It hints at the persona.** The name should suggest the temperament the machine
   will have — pompous, patient, nervous, cheerful, tired.
4. **Practicalities:** works lowercase or capitalized in prose; sane as a GitHub repo
   name and a `<name>.starstucklab.com` subdomain (so: no spaces — Clear Skies predates
   this rule and cost a hyphen); not trademark-adjacent to a competitor in the same
   product space; not already a sibling.

For each candidate present: the name, the derivation(s), a one-line persona sketch
(which register it claims), and one tagline in the house voice (taglines run like *"A
small machine that disagrees with lightning"* / *"The relative who always knew it would
rain"*).

**Stop here. The user picks (or riffs). Do not scaffold anything until a name is
chosen.**

---

## 2. Phase 2 — Explore before building

With the name settled, absorb the conventions from the actual files (do not trust this
doc over the repos — the repos win if they've drifted):

| Read | For |
|---|---|
| `starstucklab/kit/VOICE.md` + `src/data/persona_preamble.txt` | The one canonical voice |
| `starstucklab/kit/README.md`, `kit/tokens.css`, `kit/base.css`, `kit/partials/` | The spoke site kit: theme contract (~12 `--sl-*` vars), family band, footer |
| `starstucklab/src/data/machines.json` + `src/lib/machines.ts` | The card registry contract: every field, the `kind`/`access` enums |
| `starstucklab/tools/gen_machine_cards.py` (docstring at least) | How card blurbs + images are generated from a spoke's og: tags |
| `../jigawatt/README.md` and `../forsyth/README.md` | README conventions: badges, epigraph, status line, family footer |
| One spoke `site/` (e.g. `../lokki/site/` or `../forsyth/site/`) | Static site structure: `index.html`, `styles.css`, `assets/kit/`, `_headers`, `_redirects` |

Report a 5–10 line summary of what you found (and anything that contradicts this doc)
before scaffolding.

---

## 3. Phase 3 — Scaffold the new repo

Create `../<name>/` (a sibling of `starstucklab/`, **not** inside it) and initialize:

```
<name>/
├── README.md          # engineering-voice README (see below)
├── LICENSE            # see license note
├── AGENTS.md          # brief AI-assistant orientation: what it is, family context, conventions
├── .gitignore
├── docs/              # architecture notes land here as they exist
└── site/              # ONLY if the project gets an independent marketing site
```

Plus whatever skeleton the project type implies (`firmware/`, `hardware/`, `cloud/`,
`app/` …) — empty dirs with one-line `README.md` placeholders are fine at this stage.

**README conventions** (study jigawatt's — it's the archetype):

- shields.io badge row: `status` (a persona word — `brooding`, `planning`,
  `expecting rain`), platform/stack facts, license.
- An epigraph: one line of the machine speaking, or its tagline in italics.
- First paragraph: what it does, in the house voice but factually dense. The README is
  the *engineering* version; the site is the *marketing* version.
- A status section with the two-part persona status (`Unit 001 · Brooding`,
  `Station 000 · Expecting rain`) — invent this machine's equivalent.
- Footer: `Part of [starstucklab](https://github.com/m-anish/starstucklab) — building
  small machines for an indifferent universe.` plus sibling links.

**License:** the family is mixed (lokki GPL-3.0, jigawatt MIT, hub DWYWBDBM-1.0).
Default to **MIT** for a new machine unless the user's description implies copyleft
matters; note the choice in your report rather than asking.

**If the project gets its own site** (`/site`): zero-build static — plain `index.html`
+ `styles.css`, **no framework, no build step**. Adopt the kit: run
`bash starstucklab/kit/sync-kit.sh` (or copy `tokens.css` + `base.css` into
`site/assets/kit/` manually if the script doesn't know the new spoke yet — then add it
to the script), link kit CSS before the spoke stylesheet, override the ~12 `--sl-*`
tokens with this machine's own palette and type choices, and use the canonical
`kit/partials/family.html` and `footer.html` markup. Pick an **accent color** that no
sibling uses (see the accents in `machines.json`). Include proper `og:title`,
`og:description`, `og:image` tags — `gen_machine_cards.py` harvests them for the hub
card. Include `_headers` and `_redirects` (copy a sibling's). The hero, motion gimmick,
and band typography are per-spoke by design — give this machine its own.

Do **not** deploy anything to Cloudflare — the user wires up
`<name>.starstucklab.com` themselves once the repo is pushed.

---

## 4. Phase 4 — The hub card

In `starstucklab/` (work on `main` unless told otherwise):

1. **Add an entry to `src/data/machines.json`** following the exact contract in
   `src/lib/machines.ts` — slug, name (match the machine's own casing), tagline, blurb
   (~30 words, house voice), `kind`, `access`, persona `status`, `url`, `external`,
   `repo`, unique `accent`, `order` (next available), `featured: false`.
2. **Card destination:**
   - *Spoke with its own site* → `url: "https://<name>.starstucklab.com"`,
     `external: true`, `access` usually `"read"` (or `"enquire"`/`"open"` as fits).
   - *No independent site* → create a simple internal hub page (an Astro page or a
     product/content entry, whichever pattern fits — M42/Elli use `/shop/<slug>`),
     link the card there with `external: false`.
3. **Card image:** run `python3 tools/gen_machine_cards.py --slug <name>` from
   `starstucklab/` — it harvests the spoke's og: tags, writes the blurb in the house
   voice, and resolves the image (needs `OPENAI_API_KEY` in `.env` for blurb/AI-image;
   `--no-blurb` works offline). If the tooling can't run, hand-write the blurb in the
   canonical voice and note the image as a TODO.
4. Sanity-check with `npm run dev` that the grid renders. Update `CHANGELOG.md`
   (match its existing format).

---

## 5. Phase 5 — GitHub

1. In `../<name>/`: `git init`, initial commit
   (`Co-Authored-By` trailer per your own conventions).
2. Create the repo and push:
   ```bash
   gh repo create m-anish/<name> --public --source . --push \
     --description "<one-line tagline> · https://<name>.starstucklab.com"
   ```
   Include the subdomain URL in the description **only if** the project has a `/site`
   (the user handles the Cloudflare Pages + DNS setup; the link is aspirational for a
   few hours and that's fine). Also set the repo homepage:
   `gh repo edit m-anish/<name> --homepage "https://<name>.starstucklab.com"`.
3. In `starstucklab/`: commit the card + changelog (+ any kit/sync-kit changes) and
   push to `origin main`.

---

## 6. Handoff

Report what was created: the name and its derivation, both repo URLs, the card entry,
and anything left as TODO (imagery, Cloudflare setup). Then **switch your working
directory to `../<name>/`** and wait — the user will follow up with the
project-specific brief (the forsyth brief is the reference for the shape of those:
explore → site → research → hardware planning, with scope boundaries stated
explicitly). Do not start inventing the product's internals from the two-sentence
description alone.

---

## Guardrails

- **One stop point.** Phase 1's name pick is the only place to wait for the user.
  Everything after runs autonomously; surface problems in the final report.
- **The repos are the source of truth.** If a convention here contradicts what the
  sibling repos actually do, follow the repos and flag the drift.
- **Voice is canonical, not improvised.** Load `persona_preamble.txt` / `VOICE.md`;
  don't freestyle a "similar" tone.
- **Don't touch siblings** other than `starstucklab/` (card, kit script) — no edits to
  other spokes' repos.
- **No fabricated engineering.** Placeholder dirs and honest `status: planning` badges
  beat invented specs. The machine hasn't earned opinions yet; it only gets a persona.
