# Dynamic Content Generation  
*A.k.a. The Site That Thinks Too Much*

> “If a web page could sigh, this one would.”

---

## Overview

The concept is beautifully unnecessary:  
parts of **Starstuck Lab** will periodically regenerate using AI prompts.  
Because static content is for planets that stopped rotating.

This keeps the site feeling *alive* — or at least convincingly animated.  
Each section (homepage intro, project blurbs, or random poetic footnotes) can be refreshed from a **prompt library**.

---

## Goals

- 🧠 Give repeat visitors new versions of the same existential nonsense.  
- 🔁 Build a “content regeneration daemon” that runs daily or weekly.  
- 🗃️ Cache outputs, so users don’t summon the AI on every page load (unless we *want* chaos).  
- 🕒 Include version tags like:

  ```html
  <!-- Generated: 2025-11-06 -->

---

## Implementation Ideas

### 1. Static Site + Dynamic Backend

* Use a static site generator like **Astro**, **Eleventy**, or **Hugo**.
* A simple backend script (Python or Node) periodically refreshes Markdown files using stored prompts.
* The site builds fresh each cycle — *like cosmic reincarnation*, but with more JavaScript.

### 2. Prompt Storage Schema

Each prompt lives in a structured JSON, like this:

```json
{
  "id": "hadley-myth",
  "category": "project",
  "prompt": "Describe the Hadley telescope as a mythical beast that devours photons.",
  "last_generated": "2025-11-06",
  "outputs": [
    "Behold the Hadley — a beast of lenses and longing, forever hunting for stray photons."
  ]
}
```

* **id**: unique identifier for traceability
* **category**: “project”, “intro”, “footer”, etc.
* **prompt**: the AI seed text
* **outputs**: historical generations (so we can keep the good ones)

### 3. Caching & Versioning

* Generated Markdown lives in `/generated/` or `_dynamic/`.
* Each file is named with timestamp suffixes:

  ```
  homepage_2025-11-06.md
  ```
* The website reads the latest version, or gracefully degrades to the previous one if something explodes.

---

## The “Regen Mode” Button

An optional (and totally unnecessary) feature:
a glowing button labeled **“Regenerate Reality”**.

When pressed:

1. A small animation plays (perhaps the sapling grows or sighs).
2. JavaScript calls an API endpoint that requests one section’s regeneration.
3. The new text fades in.
4. The user either applauds or panics.

Use responsibly.

---

## Tone Variation System (Integration with the Sarcasm Slider)

When combined with the **Sarcasm Slider**, dynamic content tone shifts *live*:

| Mood           | Tone                       | Example Output                              |
| -------------- | -------------------------- | ------------------------------------------- |
| 0 – Hopeless   | Apathetic, fatalistic      | “You came back? Fascinating.”               |
| 1 – Curious    | Wondering, slightly poetic | “The stars blink, maybe for you.”           |
| 2 – Optimistic | Cheerfully self-deluded    | “Everything’s working perfectly. Probably.” |

The slider sets a tone variable passed into the prompt or the AI post-processor, allowing micro-shifts in mood without re-generating everything.

---

## Technical Notes

* **Language model**: pick a model capable of maintaining tone consistency (i.e., *not one that secretly dreams of becoming Shakespeare*).
* **Scheduling**: a cron job, GitHub Action, or Cloudflare Worker could trigger regeneration.
* **Safety**: validate and lint generated Markdown before merging (the AI will gleefully break tables if unsupervised).

---

## Risks & Precautions

* 🌀 Users may think the site is alive.
* 💀 AI might develop opinions about telescopes.
* 🔥 Generated content could exceed your hosting quota or your patience.

But remember:

> “Fresh nonsense is still nonsense.
> At least it’s *fresh*.”

---

## Sample Prompt Ideas

| Category          | Prompt Example                                                        |
| ----------------- | --------------------------------------------------------------------- |
| Homepage          | “Welcome the visitor like an overworked cosmic concierge.”            |
| Telescope Project | “Describe a telescope as a mythical creature that devours photons.”   |
| Weather Station   | “Write about the weather station as a moody poet who hates humidity.” |
| Footer            | “Say goodbye like a robot who almost felt something.”                 |

---

## Future Possibilities

* Build a **prompt dashboard** to manage tone, content age, and last-generated timestamp.
* Add **visitor-triggered prompts** (“Feeling lucky?” button).
* Maintain an **AI memory log**, so the site “remembers” previous moods.
* Publish an **archive** of old generations — “Voices of the Site: a Digital Diary.”

---

## Closing Line

> “The universe updates itself every second.
> So should your website.
> Preferably with fewer supernovas.”
