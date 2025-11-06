# 🌌 Starstuck Lab — The Roadless Map

> “If you can see the plan clearly, you’re not far enough from the explosion.”

---

| Stage | Description | Status |
|--------|--------------|--------|
| **Concept Brew** | Idea fermentation chamber | ✅ Done (and delightfully over-fermented) |
| **License Headers** | Ensure all generated code includes SPDX header | ✅ Completed and standardized |
| **Branding** | Logo finalized (black star + white sapling), fonts, theme locked | ✅ Complete |
| **Website Framework** | Astro site built under `/site`, fully styled and functional | 🚀 Live |
| **Deployment** | GitHub Actions workflow automated for GitHub Pages | ✅ Operational |
| **Base Path & Favicon Fixes** | Resolved asset pathing issues and favicon 404s via `Astro.base` logic | ✅ Fixed |
| **Sarcasm Slider** | Functional, DOM-safe, mood-adjustable range slider | ✅ Implemented |
| **Dynamic Pages** | Placeholder logic ready for AI content regeneration | ⚙️ In progress (Phase 2) |
| **AI Content Engine** | Core backend for generating fresh cosmic nonsense | 🧠 Designing |
| **Cookie & User Session System** | Client-side cookies for mood memory; future backend integration for accounts | 🍪 Planned |
| **Order & Account Backend** | Authentication, order tracking, and persistent user data via Cloudflare Workers or Supabase | 🏗️ Phase 4 |
| **Shop System** | Basic order form with humorous checkboxes | ⚙️ In progress |
| **Domain Launch** | Migrate from GitHub Pages → `starstucklab.com` | 🔜 Next major event |
| **Post-Launch Polish** | Add favicons, metadata, and Easter eggs | 🪄 Pending |
| **AI Persona Integration** | Voice + tone module (“depressed robot meets poetic physicist”) | 🧩 Phase 3 |
| **Weather & Telescope Integration** | Live data feeds from physical gadgets | 🌦️ Planned |
| **Final Goal** | Starstuck Lab becomes a self-aware cosmic art project | 🔮 Inevitable |

---

## 🧠 Phase 2 — Dynamic Content Engine (“Regen Daemon”)

### 🎯 Purpose
To keep sections of the website semi-alive by letting a local or cloud script re-generate text snippets from stored AI prompts.  
Think of it as **content reincarnation with version control**.

### 🧩 Architecture Overview

```

/tools/
├─ regenerate_content.py        # master script
└─ helpers/
└─ prompt_loader.py         # optional modular helpers

/data/
└─ prompts.json                 # list of prompt definitions

/generated/
├─ home_intro.md
├─ project_blurbs.md
└─ footer_poem.md

```

### 🧮 Workflow Steps
1. Load prompt definitions from `/data/prompts.json`.  
2. Call the AI model to generate new text.  
3. Save outputs to `/generated/` with timestamps and YAML front-matter.  
4. Import those markdown files into Astro pages as partials.  
5. Optional automation: a scheduled GitHub Action runs the daemon weekly and redeploys.

### ⚙️ Future Features
| Feature | Description |
|----------|--------------|
| **Tone Control** | Link with mood slider to bias prompt tone. |
| **Prompt Tagging** | Categorize by page or content type. |
| **Diff Visualizer** | Compare successive generations. |
| **Manual Regen Button** | “Regenerate Reality” trigger for curious users. |
| **Caching / Rollback** | Keep recent versions for safety. |

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
```

Run manually:

```bash
python3 tools/regenerate_content.py
```

or schedule via GitHub Actions for autonomous updates.

---

## 🍪 Phase 4 — Cookies, Accounts, and the Order System

### 🎯 Purpose

Move from static illusion to interactive commerce — letting users order telescopes, track progress, and customize experiences.

### 🧩 Implementation Plan

**Stage 1 — Client-Side Cookies**

* Remember user mood, theme, and slider position using cookies or `localStorage`.
* Optionally greet returning visitors by name or assigned “lab assistant ID.”

**Stage 2 — Static → Hybrid**

* Introduce `/api` routes using **Cloudflare Workers** or a small backend.
* Upgrade cookies to secure tokens (JWTs).

**Stage 3 — Full Backend**

* Users can create accounts, log in/out, place and track orders.
* Orders stored in a lightweight database (Supabase, Postgres, or SQLite-on-Edge).
* Admin dashboard for fulfillment.

### 🛠️ Data Flow (Future)

```
Browser (cookie/localStorage)
      ↓
  Astro Front-End
      ↓
  Cloudflare Worker API
      ↓
  Database (Supabase / Postgres)
      ↓
  Notification / Email
```

### ⚡ Long-Term Goals

| Goal                       | Description                                     |
| -------------------------- | ----------------------------------------------- |
| **Persistent Mood Memory** | Automatically restore last mood slider setting. |
| **User Accounts**          | Simple authentication for repeat customers.     |
| **Order Tracking**         | Telescope builds and shipments logged.          |
| **Admin Interface**        | Self-service backend dashboard.                 |

> “Even cookies crumble eventually. But that’s no reason not to bake them.”

---

## 🧭 Current Position

Orbiting between:

* ✅ Phase 1: Public launch @ GitHub Pages
* ⚙️ Phase 2: Dynamic content implementation
* 🍪 Phase 4 plans: Persistent interactivity & commerce

---

## 🚀 Next Checklist

1. Create `/data/prompts.json` with 3–5 initial prompts.
2. Implement `/tools/regenerate_content.py` using the skeleton above.
3. Hook `/generated/` files into Astro pages.
4. Test local regeneration → commit → rebuild.
5. Extend cookie logic for mood persistence.
6. Begin backend prototype (Cloudflare Worker API → Supabase).

---

> “Plans are worthless. Planning is everything.” — Eisenhower
> (Also true for telescope alignment and cookie management.)