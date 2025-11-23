# 🌲✨ STARSTUCK LAB — SITE FLOW ARCHITECTURE (v1)

### *A world-based information architecture for a hillside workshop under the stars.*

---

## 🧭 Overview

Starstuck Lab is structured as a **narrative world**, not a conventional website.
All sections represent physical or conceptual “scenes” inside a nocturnal mountain workshop surrounded by pine trees and stars.

Everything (shop, projects, logs, future community features) fits naturally into one unified world.

---

# 🗺 GLOBAL WORLD LAYERS

These layers span the entire site and create continuity:

### **1. Starscape Layer**

* Slow parallax starfield
* Occasional shooting stars
* Constellations fade in/out subtly
* Sky color shifts with sarcasm slider

### **2. Forest Layer**

* Silhouetted pine trees
* Soft wind sway
* Rare animal eye-glints
* Circular canopy framing the sky

### **3. Shed Layer**

* Outer silhouette on the hero
* Interior wood panels in inner scenes
* Warm “lantern glow” from lamps

### **4. Workbench Layer**

* Wood grain + blueprint refinements
* Polaroid frames, tools, wires
* Desk lamp spotlights for products

### **5. Console UI Layer**

* Sarcasm slider
* Status LEDs, logs, whispers
* Bottom “AI console” aesthetic

---

# 🧩 TOP-LEVEL STRUCTURE

A high-level flow from entry → inner workshop → shop → console → forest exit:

```
HOME  
  ↓  
ABOUT  
  ↓  
PROJECTS + SHOP  
  ↓  
PRODUCT DETAIL  
  ↳ CHECKOUT  
  ↳ BACK  
  ↓  
MOOD / SARCASM WINDOW  
  ↓  
ROADMAP + LOGS (Console)  
  ↓  
FOREST NIGHT SKY (Footer)
```

---

# 🎞 SECTION-BY-SECTION

## 🌌 1. HERO — “Outside the Shed at Night”

**Purpose:** Establish tone
**Visual:**

* Starscape + silhouetted pine trees
* Shed in distance with faint warm glow
* Logo in sky
* Tagline fades in (“I assemble dreams, and they dissolve.”)

**User Action:** Scroll to enter the workshop.

---

## 🪵 2. ABOUT — “Inside the Shed”

**Purpose:** Establish identity + philosophy
**Visual:**

* Wooden walls, tools, pegboard
* Blueprint scribbles in faint overlay
* Semi-transparent parchment panels for text (from `ABOUT.md`)

Narrative: The visitor has stepped inside your brain + workshop.

---

## 🔧 3. PROJECTS + SHOP — “Workbench Display Grid”

**Purpose:** Unified list of:

* Build projects
* Items for sale
* Experiments / prototypes
* Future additions

**Visual:**

* Wood table
* Desk lamp glow halos
* Pine needles, pencil marks
* Blueprint overlay on hover
* Polaroid-style product images

This section *is the shop*.
No separate “store” required.

Pulls content from:

* `PROJECTS.md`
* Items you later add to `/products/*.md`

---

## 🔦 4. PRODUCT DETAIL — “Under the Desk Lamp”

**Purpose:** Story, details, specs, checkout entry
**Visual:**

* Dimming of forest + shed background
* Lamp spotlight on product
* Shadows and warm highlights
* Hand-scribbled annotations (“Field Notes”, “Build Story”, etc.)

Sections:

* Story / flavor text
* Specs (sketched)
* Limitations (humorous honesty)
* Order panel

Checkout button brings user to clipboard form.

---

## 📋 5. CHECKOUT — “Workshop Clipboard Form”

**Purpose:** Collect order info with character
**Visual:**

* Clipboard on wood table
* Paper texture + penciled checkboxes

Content comes from:

* `ORDER_GUIDELINES.md` (“personality features”, “sarcasm checkboxes”)

Confirmation message looks handwritten.

---

## 🌲 6. MOOD / SARCASM SLIDER — “Forest Mood Window”

**Purpose:** Mood control for whole site
**Visual:**

* Forest scene behind UI
* Background warmth changes
* Wildlife appears/disappears
* Shed window glows warmer/colder

This ties directly into:

* dynamic content generation
* tone modulation system
* site colors + animations

---

## 💻 7. ROADMAP + LOGS — “Basement Console Terminal”

**Purpose:**

* Roadmap
* AI logs
* Change history
* Experimental messages

**Visual:**

* Monospace terminal with glow
* Flickering LEDs
* Slight glitch animations

Pull from:

* `ROADMAP.md`
* dynamic content (`dynamic_content.md`)
* future “forum/log” extensions

---

## 🌲🌌 8. FOOTER — “Forest Nightscape Outro”

**Purpose:** Closing tone
**Visual:**

* Fade back to starry sky
* Pine silhouettes
* Owl/bear silhouette easter eggs
* Contact info carved on a wooden sign

Content sourced from:

* `CONTACT.md`

---

# 🧬 CROSS-SITE SYSTEMS

## A. **Mood Engine**

* Drives tone, color, animation speed
* Controls dynamic text variants
* Influenced by slider + environment factors

## B. **Dynamic Content Engine**

* Periodically re-generates selected markdown
* Uses prompt library (`CONTENT_PROMPTS.md`)
* Displays timestamps

## C. **Persona Engine**

* Uses definitions in `ai_personality.md`
* Keeps voice consistent across regenerated content

## D. **SPDX Header Injection**

* All generated code is licensed via header in `STYLE_GUIDE.md`

---

# 🔮 EXTENSIBILITY NOTES

Future features fit naturally as new “rooms” or “stations”:

* **Idea Suggestion Box**
  → A wooden box on the workbench
* **Community Forum**
  → A terminal tab inside the console scene
* **Issue Tracker**
  → “Anomaly Report” mode in the console
* **User Projects Gallery**
  → A wall in the shed with pinned Polaroids
* **Tools / calculators**
  → Gadgets connected to the bench

This world-based structure is inherently expandable.
