# 🌌 Starstuck Lab — The Roadless Map

> “If you can see the plan clearly, you’re standing too close to the singularity.”

---

| Stage | Description | Status |
|--------|--------------|--------|
| **Concept Brew** | Idea fermentation chamber | ✅ Done (and still bubbling in the background) |
| **License Headers** | SPDX header compliance for all generated code | ✅ Complete — even the scripts now know who *not* to blame |
| **Branding** | Black star + white sapling logo, font system, and theme palette locked | ✅ Finalized |
| **Website Framework** | Astro site structure (`src/pages`, `layouts`, `styles`) built and polished | 🚀 Live and stable |
| **Deployment** | Automated CI/CD via GitHub Actions → GitHub Pages → starstucklab.com | ✅ Operational |
| **Domain Launch** | DNS migration completed | 🏁 Site live at [**starstucklab.com**](https://starstucklab.com) |
| **Sarcasm Slider** | Mood slider adjusts tone and color dynamically | ✅ Working as intended (which is to say, emotionally unstable) |
| **Dynamic Pages** | Mood-reactive text loading from `/public/data/*.json` via `render-generated.js` | ✅ Fully functional |
| **AI Content Engine** | Regen daemon prototype (`/tools/regenerate_content.py`) + prompt system (`/data/prompts.json`) | ⚙️ Phase 2 complete — ready for weekly automation |
| **Generated Content** | Live Markdown in `/generated/` synced with JSON data | ✅ Integrated and stable |
| **Cookie & Mood Memory System** | Persistent emotional state via localStorage and cookies | 🍪 Implemented |
| **Shop System** | Formspree-based order form + sarcastic agreement checkboxes | ✅ Live (spam toggle optional) |
| **AI Persona Integration** | Unified tone across pages — “depressed robot meets poetic physicist” | 🧠 Active |
| **Regen Workflow** | GitHub Action pending for automated content refresh | 🔁 In progress |
| **Weather & Telescope Integration** | Hardware feeds (wind, Li-ion, LoRa) planned | 🛰️ Prototype stage |
| **Logo Variants & Theming** | Full SVG set under `/assets/logo/variants/` | ✅ Complete — future mood-based swapping ready |
| **Post-Launch Polish** | Metadata, favicon refinement, and hidden Easter eggs | 🪄 Continuous |
| **Final Goal** | Starstuck Lab becomes a mildly self-aware art installation | 🔮 Inevitable |

---

## 🧠 Phase 2 — Dynamic Content Engine (“Regen Daemon”)

### 🎯 Purpose
To keep the site existentially fresh by regenerating text snippets from AI prompts.  
Because static content is for planets that stopped rotating.

---

### 🧩 File Layout
```

/tools/
├─ regenerate_content.py        # core script
└─ helpers/                     # optional utils

/data/
└─ prompts.json                 # prompt definitions

/generated/
├─ about_intro.md
└─ footer_poem.md

```

---

### 🧮 Workflow
1. Load prompt definitions from `/data/prompts.json`.  
2. Generate text using GPT-5 or equivalent AI.  
3. Write Markdown with timestamps and YAML front matter.  
4. Astro imports the updated `.md` for live rendering.  
5. GitHub Action (future) automates weekly regeneration commits.

---

### 🧰 Minimal Script Skeleton
```python
import json, datetime
from openai import OpenAI
from pathlib import Path

client = OpenAI()
data = json.load(open("data/prompts.json"))

for p in data:
    result = client.chat.completions.create(
        model=p.get("model", "gpt-5"),
        temperature=p.get("temperature", 0.8),
        messages=[{"role": "user", "content": p["prompt"]}]
    )
    text = result.choices[0].message.content.strip()
    out = Path(p["target"])
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(f"---\n# generated {datetime.date.today()}\n---\n{text}\n", encoding="utf-8")
````

Run manually:

```bash
python3 site/tools/regenerate_content.py
```

Or let GitHub Actions do it while you sleep (poorly).

---

### ⚙️ Phase 2.5 Goals

| Feature                 | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| **Tone Biasing**        | Mood slider informs AI prompt parameters                          |
| **Prompt Tagging**      | Group prompts by content type                                     |
| **Diff Visualizer**     | Compare “before” and “after” AI musings                           |
| **Manual Regen Button** | “Regenerate Reality” frontend trigger                             |
| **Rollback Cache**      | Keep previous generations just in case the AI gets poetic *again* |

> “Entropy is inevitable. The least we can do is make it self-aware.”

---

## 🍪 Phase 4 — Cookies, Accounts, and the Order System

### 🎯 Purpose

Move beyond static illusion into semi-functional commerce — where telescopes, mood sliders, and despair can all be ordered online.

---

### 🧩 Implementation Plan

**Stage 1 — Local Persistence**

* Cookies/localStorage save user mood & theme
* Optional “lab assistant ID” greeting per visitor

**Stage 2 — Hybrid API**

* `/api` routes via **Cloudflare Workers**
* Tokens for light authentication
* Order validation via Supabase or Edge DB

**Stage 3 — Full Backend**

* Accounts, order history, and telescope build tracking
* Admin dashboard for fulfillment and debugging reality

---

### 🧰 Data Flow (Planned)

```
Browser (cookie/localStorage)
      ↓
  Astro Front-End
      ↓
  Cloudflare Worker API
      ↓
  Supabase / Postgres
      ↓
  Notification / Email
```

---

### ⚡ Long-Term Features

| Feature                    | Description                                    |
| -------------------------- | ---------------------------------------------- |
| **Persistent Mood Memory** | Automatically restore user’s emotional setting |
| **Accounts**               | Lightweight login system                       |
| **Order Tracking**         | Telescope build and shipping status            |
| **Admin Tools**            | Self-service backend dashboard                 |

> “Even cookies crumble, but at least they remember you for a while.”

---

## 🧭 Current Orbit

* ✅ **Phase 1:** Public Launch at [**starstucklab.com**](https://starstucklab.com)
* ⚙️ **Phase 2:** Dynamic regen engine active and generating content
* 🧠 **Phase 3:** Tone and persona integrated sitewide
* 🍪 **Phase 4:** Backend scaffolding in concept phase

---

## 🚀 Next Checklist

1. Expand `/data/prompts.json` with 5–10 content templates
2. Hook weekly regen via GitHub Actions (`regenerate_content.py`)
3. Add “Regenerate Reality” button to footer for testing
4. Implement spam toggle for order form
5. Add theme-swapping logo logic via mood level
6. Begin backend prototype (Cloudflare Worker + Supabase)
7. Drink something caffeinated and reconsider your life choices

---

> “Plans are fluid. Stars explode.
> Both are progress.”
