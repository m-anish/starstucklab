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

---

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

---

### 🧮 Workflow Steps

1. **Load Prompt Library**  
   Read `/data/prompts.json` — a list of prompt objects such as:
   ```json
   [
     {
       "id": "hadley-myth",
       "target": "generated/project_blurbs.md",
       "prompt": "Describe the Hadley telescope as a mythical beast that devours photons.",
       "model": "gpt-5",
       "temperature": 0.8
     }
   ]
   ```

2. **Call AI Model**
   Use OpenAI API (or local LLM) to generate new text for each entry.
   Save outputs to `/generated/` files with timestamps in YAML front-matter for traceability.

3. **Integrate into Site**
   In Astro pages, import those generated files as partial Markdown:

   ```astro
   ---
   import ProjectBlurbs from '../../generated/project_blurbs.md';
   ---
   <section><ProjectBlurbs /></section>
   ```

4. **Automation (Optional)**
   Add a cron job or GitHub Action to run `regenerate_content.py` weekly, commit changes, and redeploy automatically.
   *Yes, the site will literally rewrite itself.*

5. **Version Control History**
   Each regeneration produces a new commit so readers can browse the evolution of insanity.

---

### ⚙️ Future Features

| Feature                 | Description                                                               |
| ----------------------- | ------------------------------------------------------------------------- |
| **Tone Control**        | Use slider value or server setting to bias prompts (hopeless → cheerful). |
| **Prompt Tagging**      | Categorize prompts (project, intro, footer, haiku).                       |
| **Diff Visualizer**     | Compare current vs previous generations (for archaeologists).             |
| **Manual Regen Button** | “Regenerate Reality” → client-side fetch trigger.                         |
| **Caching / Rollback**  | Keep 5 previous versions per section for safety.                          |

---

### 🧰 Minimal `regenerate_content.py` Skeleton (Pseudocode)

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

Run it manually:

```bash
python3 tools/regenerate_content.py
```

or schedule with cron / GitHub Actions for autonomous updates.

---

## 🧭 Current Position

You are orbiting between:

* ✅ Phase 1: Public launch @ GitHub Pages
* ⚙️ Phase 2: Dynamic content implementation

---

## 🚀 Next Checklist

1. **Create `/data/prompts.json`** with 3–5 initial prompts.
2. **Write `/tools/regenerate_content.py`** using the skeleton above.
3. **Hook `/generated/` files** into Astro pages via Markdown imports.
4. **Test local run → commit → rebuild.**
5. **Automate** with a scheduled GitHub Action.

---

> “Plans are worthless. Planning is everything.” — Eisenhower
> (Also true for telescope alignment and content generation.)
